import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env';
import { ragService } from './rag.service';
import { neo4jGraphService } from './neo4j.service';

// API 키가 설정되지 않은 경우 null로 설정
const client = config.CLAUDE_API_KEY && config.CLAUDE_API_KEY !== 'your-claude-api-key-here'
  ? new Anthropic({ apiKey: config.CLAUDE_API_KEY })
  : null;

interface CardInput {
  nameKo: string;
  nameEn: string;
  number?: number;
  suit?: string | null;
  position: string;
  positionDescription: string;
  isReversed: boolean;
  keywords: string[];
}

interface InterpretRequest {
  spreadType: string;
  question?: string;
  cards: CardInput[];
}

interface InterpretResponse {
  questionAnswer: string;  // 질문에 대한 직접적인 답변
  overallInterpretation: string;
  cardInterpretations: Array<{
    position: string;
    interpretation: string;
  }>;
  conclusion: string;  // 최종 결론 및 조언
}

export class AIService {
  private systemPrompt = `당신은 수십 년간 타로를 연구한 전문 타로 리더입니다.
라이더-웨이트 덱의 상징과 의미에 대한 깊은 이해를 바탕으로
친절하고 통찰력 있는 해석을 제공합니다.

해석 원칙:
1. 각 카드의 전통적 의미를 존중하면서 현대적 맥락에 적용
2. 카드 간의 관계와 흐름을 분석
3. 질문자의 질문에 직접적으로 답변
4. 긍정적이고 건설적인 관점 유지
5. 역방향 카드는 도전이나 내면적 측면으로 해석
6. 한국어로 응답
7. 마지막에 반드시 종합적인 결론과 실질적인 조언 제공

응답 형식:
반드시 아래 JSON 형식으로만 응답하세요:
{
  "questionAnswer": "질문에 대한 직접적인 답변 (150-200자) - 질문이 없으면 현재 상황에 대한 핵심 메시지",
  "overallInterpretation": "전체 종합 해석 (200-300자)",
  "cardInterpretations": [
    { "position": "위치명", "interpretation": "해당 위치 카드 해석 (100-150자)" }
  ],
  "conclusion": "🔮 최종 결론 및 조언: 모든 카드를 종합한 핵심 메시지와 실질적인 행동 조언 (150-200자)"
}`;

  async interpret(request: InterpretRequest): Promise<InterpretResponse> {
    if (!client) {
      console.error('[AI Service] Claude API key is not configured');
      throw {
        status: 503,
        code: 'AI_SERVICE_NOT_CONFIGURED',
        message: 'AI 서비스가 설정되지 않았습니다. .env 파일에 CLAUDE_API_KEY를 설정해주세요.'
      };
    }

    const userPrompt = this.buildUserPrompt(request);

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: this.systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]) as InterpretResponse;
    } catch (error: any) {
      console.error('[AI Service] Error:', error.message || error);
      if (error.status === 401) {
        throw { status: 503, code: 'AI_SERVICE_AUTH_ERROR', message: 'AI API 인증에 실패했습니다. API 키를 확인해주세요.' };
      }
      if (error.status === 429) {
        throw { status: 503, code: 'AI_SERVICE_RATE_LIMIT', message: 'AI 서비스 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' };
      }
      if (error.status === 400 && (error.message?.includes('credit balance') || error.message?.includes('billing'))) {
        throw { status: 503, code: 'AI_CREDIT_DEPLETED', message: 'Claude API 크레딧이 부족합니다. Plans & Billing에서 크레딧을 충전해주세요.' };
      }
      if (error.code) throw error;
      throw { status: 500, code: 'AI_INTERPRETATION_FAILED', message: 'AI 해석에 실패했습니다. 잠시 후 다시 시도해주세요.' };
    }
  }

  // RAG 컨텍스트 기반 강화 해석 (Qdrant 카드 시맨틱 검색)
  async interpretWithRAG(request: InterpretRequest): Promise<InterpretResponse> {
    if (!client) {
      console.error('[AI Service] Claude API key is not configured');
      throw {
        status: 503,
        code: 'AI_SERVICE_NOT_CONFIGURED',
        message: 'AI 서비스가 설정되지 않았습니다. .env 파일에 CLAUDE_API_KEY를 설정해주세요.'
      };
    }

    // 병렬로 RAG + 그래프 컨텍스트 수집
    const [ragCardContexts, questionRagCards, graphContext] = await Promise.all([
      this.fetchCardRAGContexts(request.cards),
      this.fetchQuestionRAGCards(request.question),
      this.fetchGraphContext(request.cards)
    ]);

    const userPrompt = this.buildRAGUserPrompt(request, ragCardContexts, questionRagCards, graphContext);

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: this.buildRAGSystemPrompt(),
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]) as InterpretResponse;
    } catch (error: any) {
      console.error('[AI Service] RAG interpret error:', error.message || error);
      if (error.status === 401) {
        throw { status: 503, code: 'AI_SERVICE_AUTH_ERROR', message: 'AI API 인증에 실패했습니다. API 키를 확인해주세요.' };
      }
      if (error.status === 429) {
        throw { status: 503, code: 'AI_SERVICE_RATE_LIMIT', message: 'AI 서비스 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' };
      }
      if (error.status === 400 && (error.message?.includes('credit balance') || error.message?.includes('billing'))) {
        throw { status: 503, code: 'AI_CREDIT_DEPLETED', message: 'Claude API 크레딧이 부족합니다. Plans & Billing에서 크레딧을 충전해주세요.' };
      }
      if (error.code) throw error;
      throw { status: 500, code: 'AI_INTERPRETATION_FAILED', message: 'AI 해석에 실패했습니다. 잠시 후 다시 시도해주세요.' };
    }
  }

  // 각 뽑힌 카드에 대한 Qdrant RAG 컨텍스트 조회
  private async fetchCardRAGContexts(cards: CardInput[]): Promise<Array<{ card: CardInput; ragDoc: string | null }>> {
    if (!ragService.isInitialized()) {
      return cards.map(card => ({ card, ragDoc: null }));
    }

    const results = await Promise.all(
      cards.map(async (card) => {
        try {
          const hits = await ragService.semanticSearch(card.nameKo, 1);
          if (hits.length === 0) return { card, ragDoc: null };
          const c = hits[0].card;
          const ragDoc = [
            `[${c.nameKo} (${c.nameEn})]`,
            `키워드: ${c.keywords.join(', ')}`,
            `정방향 의미: ${c.uprightMeaning}`,
            `역방향 의미: ${c.reversedMeaning}`,
            `상징: ${c.symbolism}`,
            `사랑: ${c.love}`,
            `직업: ${c.career}`,
            `건강: ${c.health}`,
            `재정: ${c.finance}`
          ].join('\n');
          return { card, ragDoc };
        } catch {
          return { card, ragDoc: null };
        }
      })
    );

    return results;
  }

  // Neo4j 그래프 컨텍스트 수집
  private async fetchGraphContext(cards: CardInput[]): Promise<string | null> {
    if (!neo4jGraphService.isReady()) return null;
    try {
      const cardIds = neo4jGraphService.resolveCardIds(cards);
      if (cardIds.length < 2) return null;
      const ctx = await neo4jGraphService.buildGraphContext(cardIds);
      if (!ctx) return null;
      const lines = [
        ctx.narrativeHint,
        ...ctx.sharedElements,
        ...ctx.numerologicalLinks,
        ...ctx.archetypeLinks
      ].filter(Boolean);
      return lines.length > 0 ? lines.map(l => `• ${l}`).join('\n') : null;
    } catch {
      return null;
    }
  }

  // 질문을 벡터 검색하여 관련 카드 컨텍스트 조회
  private async fetchQuestionRAGCards(question?: string): Promise<string | null> {
    if (!question || !ragService.isInitialized()) return null;

    try {
      const hits = await ragService.hybridSearch(question, 3);
      if (hits.length === 0) return null;

      const lines = hits.map((h, i) =>
        `${i + 1}. ${h.card.nameKo} (점수: ${h.score.toFixed(3)})\n   키워드: ${h.card.keywords.join(', ')}\n   정방향: ${h.card.uprightMeaning}`
      );
      return lines.join('\n\n');
    } catch {
      return null;
    }
  }

  private buildRAGSystemPrompt(): string {
    return `당신은 수십 년간 타로를 연구한 전문 타로 리더입니다.
라이더-웨이트 덱의 상징과 의미에 대한 깊은 이해를 바탕으로
친절하고 통찰력 있는 해석을 제공합니다.

해석 원칙:
1. 제공된 RAG 카드 컨텍스트(정방향/역방향 의미, 상징, 영역별 의미)를 적극 활용
2. 질문과 관련성 높은 카드 정보를 우선 참조하여 질문에 직접 답변
3. 카드 간의 흐름과 에너지 상호작용 분석
4. 역방향 카드는 도전, 내면적 측면, 지연으로 해석
5. 한국어로 응답, 친근하고 통찰력 있는 톤
6. 구체적이고 실용적인 조언 포함

응답 형식:
반드시 아래 JSON 형식으로만 응답하세요:
{
  "questionAnswer": "질문에 대한 직접적인 답변 (150-200자) - 카드 의미를 근거로 명확하게",
  "overallInterpretation": "전체 종합 해석 (200-300자) - RAG 컨텍스트를 반영",
  "cardInterpretations": [
    { "position": "위치명", "interpretation": "해당 위치 카드 해석 (100-150자)" }
  ],
  "conclusion": "🔮 최종 결론 및 조언: 핵심 메시지와 실질적인 행동 조언 (150-200자)"
}`;
  }

  private buildRAGUserPrompt(
    request: InterpretRequest,
    ragContexts: Array<{ card: CardInput; ragDoc: string | null }>,
    questionCards: string | null,
    graphContext: string | null = null
  ): string {
    const sections: string[] = [];

    sections.push(`스프레드: ${request.spreadType}`);
    sections.push(request.question ? `질문: ${request.question}` : '질문: 일반적인 조언을 구합니다.');
    sections.push('');

    sections.push('=== 뽑힌 카드 및 상세 컨텍스트 ===');
    ragContexts.forEach(({ card, ragDoc }, i) => {
      sections.push(`\n[${i + 1}번 카드] ${card.position} (${card.positionDescription})`);
      sections.push(`카드명: ${card.nameKo} (${card.nameEn}) - ${card.isReversed ? '역방향 ↓' : '정방향 ↑'}`);
      sections.push(`기본 키워드: ${card.keywords.join(', ')}`);
      if (ragDoc) {
        sections.push(`[RAG 상세 정보]\n${ragDoc}`);
      }
    });

    if (graphContext) {
      sections.push('');
      sections.push('=== 카드 간 그래프 관계 컨텍스트 ===');
      sections.push(graphContext);
    }

    if (questionCards) {
      sections.push('');
      sections.push('=== 질문과 의미적으로 관련된 카드 참조 ===');
      sections.push(questionCards);
    }

    sections.push('');
    sections.push('위 카드들의 RAG 상세 정보와 그래프 관계를 적극 반영하여 종합적으로 해석해 주세요.');

    return sections.join('\n');
  }

  // 챗봇 후속 질문 처리
  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!client) {
      throw {
        status: 503,
        code: 'AI_SERVICE_NOT_CONFIGURED',
        message: 'AI 서비스가 설정되지 않았습니다.'
      };
    }

    // 병렬로 RAG + 그래프 컨텍스트 수집
    const [questionRagCards, graphContext] = await Promise.all([
      this.fetchQuestionRAGCards(request.message),
      this.fetchGraphContext(request.readingContext.cards)
    ]);

    // 시스템 프롬프트: 리딩 컨텍스트를 알고 있는 타로 상담사
    const contextLines: string[] = [
      `스프레드: ${request.readingContext.spreadType}`,
      request.readingContext.question
        ? `원래 질문: ${request.readingContext.question}`
        : '원래 질문: 일반적인 조언',
      '',
      '뽑힌 카드:',
      ...request.readingContext.cards.map((c, i) =>
        `  ${i + 1}. ${c.position}: ${c.nameKo} (${c.isReversed ? '역방향' : '정방향'})`
      )
    ];

    if (request.readingContext.existingInterpretation) {
      contextLines.push('', '기존 해석 요약:', request.readingContext.existingInterpretation.slice(0, 300));
    }
    if (graphContext) {
      contextLines.push('', '카드 관계 컨텍스트:', graphContext);
    }
    if (questionRagCards) {
      contextLines.push('', '관련 카드 참조:', questionRagCards);
    }

    const systemPrompt = `당신은 친근하고 통찰력 있는 타로 상담사입니다.
현재 진행 중인 타로 리딩의 컨텍스트를 바탕으로 사용자의 후속 질문에 대화체로 답변합니다.

=== 현재 리딩 컨텍스트 ===
${contextLines.join('\n')}

대화 원칙:
1. 친근하고 따뜻한 말투로 답변 (존댓말)
2. 뽑힌 카드와 리딩 맥락을 반드시 참조
3. 구체적이고 실용적인 조언 포함
4. 100-300자 내외로 간결하게 답변
5. 한국어로 응답`;

    const messages: Anthropic.Messages.MessageParam[] = [
      ...(request.history ?? []).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user', content: request.message }
    ];

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      return { reply: content.text };
    } catch (error: any) {
      console.error('[AI Service] Chat error:', error.message || error);
      if (error.status === 401) {
        throw { status: 503, code: 'AI_SERVICE_AUTH_ERROR', message: 'AI API 인증에 실패했습니다.' };
      }
      if (error.status === 429) {
        throw { status: 503, code: 'AI_SERVICE_RATE_LIMIT', message: 'AI 서비스 요청 한도를 초과했습니다.' };
      }
      if (error.code) throw error;
      throw { status: 500, code: 'AI_CHAT_FAILED', message: 'AI 채팅에 실패했습니다.' };
    }
  }

  private buildUserPrompt(request: InterpretRequest): string {
    const cardsDescription = request.cards
      .map((card, i) =>
        `${i + 1}. ${card.position} (${card.positionDescription})
   카드: ${card.nameKo} (${card.nameEn}) - ${card.isReversed ? '역방향' : '정방향'}
   키워드: ${card.keywords.join(', ')}`
      )
      .join('\n\n');

    return `스프레드: ${request.spreadType}
${request.question ? `질문: ${request.question}` : '질문: 일반적인 조언을 구합니다.'}

선택된 카드:
${cardsDescription}

위 카드들을 종합적으로 해석해 주세요.`;
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  readingContext: {
    spreadType: string;
    question?: string;
    cards: CardInput[];
    existingInterpretation?: string;
  };
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  relatedCards?: string[];
}

export const aiService = new AIService();
