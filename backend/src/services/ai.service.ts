import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env';
import { ragService } from './rag.service';
import { neo4jService } from './neo4j.service';
import prisma from '../utils/prisma';

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
  userId?: string;  // for saju context lookup
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

// 오행 한글명
const ELEMENT_KO: Record<string, string> = {
  WOOD: '목(木)', FIRE: '화(火)', EARTH: '토(土)', METAL: '금(金)', WATER: '수(水)'
};

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
    // API 클라이언트가 없는 경우 (API 키 미설정)
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

      // JSON 파싱 시도
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
      if (error.code === 'AI_SERVICE_NOT_CONFIGURED') {
        throw error;
      }
      throw { status: 500, code: 'AI_INTERPRETATION_FAILED', message: 'AI 해석에 실패했습니다. 잠시 후 다시 시도해주세요.' };
    }
  }

  // RAG + 사주 컨텍스트 기반 강화 해석
  async interpretWithRAG(request: InterpretRequest): Promise<InterpretResponse> {
    if (!client) {
      console.error('[AI Service] Claude API key is not configured');
      throw {
        status: 503,
        code: 'AI_SERVICE_NOT_CONFIGURED',
        message: 'AI 서비스가 설정되지 않았습니다. .env 파일에 CLAUDE_API_KEY를 설정해주세요.'
      };
    }

    // 병렬로 컨텍스트 수집
    const [ragCardContexts, questionRagCards, sajuContext] = await Promise.all([
      this.fetchCardRAGContexts(request.cards),
      this.fetchQuestionRAGCards(request.question),
      request.userId ? this.fetchSajuContext(request.userId) : Promise.resolve(null)
    ]);

    const userPrompt = this.buildRAGUserPrompt(request, ragCardContexts, questionRagCards, sajuContext);

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
      if (error.code === 'AI_SERVICE_NOT_CONFIGURED') throw error;
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

  // 사용자 사주 정보 및 충합 분석 조회
  private async fetchSajuContext(userId: string): Promise<string | null> {
    try {
      const sajuReading = await prisma.sajuReading.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      if (!sajuReading) return null;

      // 사주 기둥 구성
      const pillars = [
        `년주: ${sajuReading.yearStem}${sajuReading.yearBranch}`,
        `월주: ${sajuReading.monthStem}${sajuReading.monthBranch}`,
        `일주: ${sajuReading.dayStem}${sajuReading.dayBranch}`
      ];
      if (sajuReading.hourStem && sajuReading.hourBranch) {
        pillars.push(`시주: ${sajuReading.hourStem}${sajuReading.hourBranch}`);
      }

      // 오행 분포
      const elementCounts: Record<string, number> = {
        WOOD: sajuReading.woodCount,
        FIRE: sajuReading.fireCount,
        EARTH: sajuReading.earthCount,
        METAL: sajuReading.metalCount,
        WATER: sajuReading.waterCount
      };
      const total = Object.values(elementCounts).reduce((a, b) => a + b, 0) || 1;
      const elementLines = Object.entries(elementCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([k, v]) => `${ELEMENT_KO[k] || k}: ${v}개 (${Math.round(v / total * 100)}%)`);

      const dominant = Object.entries(elementCounts).sort(([, a], [, b]) => b - a)[0][0];
      const weak = Object.entries(elementCounts).sort(([, a], [, b]) => a - b)[0][0];

      // 충합 분석 (local calculation)
      const saju = {
        yearPillar: { stem: sajuReading.yearStem as any, branch: sajuReading.yearBranch as any },
        monthPillar: { stem: sajuReading.monthStem as any, branch: sajuReading.monthBranch as any },
        dayPillar: { stem: sajuReading.dayStem as any, branch: sajuReading.dayBranch as any },
        hourPillar: sajuReading.hourStem && sajuReading.hourBranch
          ? { stem: sajuReading.hourStem as any, branch: sajuReading.hourBranch as any }
          : { stem: '갑' as any, branch: '자' as any }
      };

      let conflictLines: string[] = [];
      try {
        const ch = neo4jService.findConflictsAndHarmonies(saju);
        if (ch.stemCombinations.length > 0) {
          conflictLines.push(`천간합: ${ch.stemCombinations.map(s => `${s.name}(→${ELEMENT_KO[s.element] || s.element})`).join(', ')}`);
        }
        if (ch.branchConflicts.length > 0) {
          conflictLines.push(`지지충: ${ch.branchConflicts.map(b => b.name).join(', ')}`);
        }
        if (ch.tripleHarmonies.length > 0) {
          conflictLines.push(`삼합: ${ch.tripleHarmonies.map(t => `${t.name}(${ELEMENT_KO[t.element] || t.element})`).join(', ')}`);
        }
        if (ch.sixHarmonies.length > 0) {
          conflictLines.push(`육합: ${ch.sixHarmonies.map(s => `${s.name}(${ELEMENT_KO[s.element] || s.element})`).join(', ')}`);
        }
      } catch {
        // 충합 분석 실패 시 무시
      }

      const lines = [
        `=== 사주(四柱) 컨텍스트 ===`,
        `사주 기둥: ${pillars.join(' | ')}`,
        `오행 분포: ${elementLines.join(', ')}`,
        `강한 기운: ${ELEMENT_KO[dominant] || dominant} | 약한 기운: ${ELEMENT_KO[weak] || weak}`
      ];
      if (conflictLines.length > 0) {
        lines.push(`충합 관계: ${conflictLines.join(' | ')}`);
      }
      return lines.join('\n');
    } catch {
      return null;
    }
  }

  private buildRAGSystemPrompt(): string {
    return `당신은 수십 년간 타로와 사주(四柱)를 함께 연구한 전문 리더입니다.
라이더-웨이트 덱의 상징과 의미, 그리고 동양의 사주 오행 철학을 융합하여
깊이 있는 해석을 제공합니다.

해석 원칙:
1. 제공된 RAG 카드 컨텍스트(정방향/역방향 의미, 상징, 영역별 의미)를 적극 활용
2. 질문과 관련성 높은 카드 정보를 우선 참조하여 질문에 직접 답변
3. 사주 컨텍스트가 있는 경우: 오행 균형과 충합 관계를 타로 해석에 반영
4. 카드 간의 흐름과 에너지 상호작용 분석
5. 역방향 카드는 도전, 내면적 측면, 지연으로 해석
6. 한국어로 응답, 친근하고 통찰력 있는 톤
7. 구체적이고 실용적인 조언 포함

응답 형식:
반드시 아래 JSON 형식으로만 응답하세요:
{
  "questionAnswer": "질문에 대한 직접적인 답변 (150-200자) - 카드와 사주 에너지를 근거로 명확하게",
  "overallInterpretation": "전체 종합 해석 (200-300자) - RAG 컨텍스트와 사주를 연결",
  "cardInterpretations": [
    { "position": "위치명", "interpretation": "해당 위치 카드 해석 (100-150자)" }
  ],
  "conclusion": "🔮 최종 결론 및 조언: 타로와 사주를 융합한 핵심 메시지와 실질적인 행동 조언 (150-200자)"
}`;
  }

  private buildRAGUserPrompt(
    request: InterpretRequest,
    ragContexts: Array<{ card: CardInput; ragDoc: string | null }>,
    questionCards: string | null,
    sajuContext: string | null
  ): string {
    const sections: string[] = [];

    // 기본 리딩 정보
    sections.push(`스프레드: ${request.spreadType}`);
    sections.push(request.question ? `질문: ${request.question}` : '질문: 일반적인 조언을 구합니다.');
    sections.push('');

    // 카드별 RAG 컨텍스트
    sections.push('=== 뽑힌 카드 및 상세 컨텍스트 ===');
    ragContexts.forEach(({ card, ragDoc }, i) => {
      sections.push(`\n[${i + 1}번 카드] ${card.position} (${card.positionDescription})`);
      sections.push(`카드명: ${card.nameKo} (${card.nameEn}) - ${card.isReversed ? '역방향 ↓' : '정방향 ↑'}`);
      sections.push(`기본 키워드: ${card.keywords.join(', ')}`);
      if (ragDoc) {
        sections.push(`[RAG 상세 정보]\n${ragDoc}`);
      }
    });

    // 질문 관련 RAG 카드
    if (questionCards) {
      sections.push('');
      sections.push('=== 질문과 의미적으로 관련된 카드 참조 ===');
      sections.push(questionCards);
    }

    // 사주 컨텍스트
    if (sajuContext) {
      sections.push('');
      sections.push(sajuContext);
    }

    // 해석 요청
    sections.push('');
    sections.push('=== 해석 요청 ===');
    sections.push('위 카드들의 RAG 상세 정보와' + (sajuContext ? ' 사주 컨텍스트를 적극 반영하여' : '') + ' 종합적으로 해석해 주세요.');
    if (sajuContext) {
      sections.push('타로 카드의 메시지와 사주의 오행 에너지 및 충합 관계를 연결하여 더 깊은 통찰을 제공해주세요.');
    }

    return sections.join('\n');
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

export const aiService = new AIService();
