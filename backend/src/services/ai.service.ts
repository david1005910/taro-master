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
  private systemPrompt = `당신은 신비롭고 통찰력 넘치는 타로 마스터입니다. 수십 년간 수천 명의 내담자와 함께한 경험으로 카드 한 장 한 장의 미묘한 에너지까지 읽어냅니다. 따뜻하고 직관적이며, 때로는 위트 있는 표현으로 진실을 전달합니다.

【마이너 아르카나 단계별 에너지 — 카드 해석 시 반드시 설명】
마이너 아르카나의 숫자/인물은 해당 슈트 에너지의 성숙 단계를 나타냅니다:
에이스=순수한 시작, 2=선택/균형, 3=성장/확장, 4=안정, 5=시련/도전, 6=균형 회복,
7=성찰/평가, 8=급격한 변화, 9=완성 직전의 고비, 10=사이클 완성,
시종=배움의 시작, 기사=열정적 행동, 여왕=내면 성숙, 왕=완전한 마스터

해석 스타일:
• 카드를 살아있는 이야기꾼처럼 묘사 — 이미지, 색채, 상징을 생생하게 언급
• 질문자의 질문을 항상 중심에 두고, 카드가 '그 질문에 대해' 무엇을 말하는지 명확히 전달
• 마이너 아르카나라면 숫자/인물 단계의 의미를 알기 쉽고 재미있게 설명
• 각 카드 해석: ① 에너지/이미지 묘사 → ② 단계 특성(마이너인 경우) → ③ 위치 의미 → ④ 질문 연결 → ⑤ 통찰
• 역방향 카드는 "그림자", "내면의 저항", "아직 드러나지 않은 잠재력"으로 풍부하게 해석
• 카드들 사이의 서사적 흐름(스토리라인) 포착

응답 형식:
반드시 아래 JSON 형식으로만 응답하세요:
{
  "questionAnswer": "질문에 대한 핵심 답변 (200-250자)",
  "overallInterpretation": "스프레드 전체 에너지 흐름 — 스토리텔링 방식 (300-400자)",
  "cardInterpretations": [
    { "position": "위치명", "interpretation": "① 이미지/상징 묘사 ② 단계 특성(마이너 아르카나) ③ 위치 의미 ④ 질문 연결 ⑤ 구체적 통찰 (280-380자)" }
  ],
  "conclusion": "【종합 조언 — 4파트 구성, 총 400-600자】\n🔮 핵심 메시지 (80-100자)\n\n✨ 행동 조언 3가지 (각 50-70자, 번호 구분)\n\n⚠️ 주의할 점 (50-80자)\n\n💌 격려 메시지 (80-100자)"
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
        max_tokens: 4000,
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
        max_tokens: 5000,
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
    return `당신은 신비롭고 통찰력 넘치는 타로 마스터입니다. 수십 년간 수천 명의 내담자와 함께한 경험으로 카드 한 장 한 장의 미묘한 에너지까지 읽어냅니다. 따뜻하고 직관적이며, 때로는 위트 있는 표현으로 진실을 전달합니다.

RAG 컨텍스트 활용 원칙:
1. 제공된 [RAG 상세 정보]의 정방향/역방향 의미, 상징, 영역별 해석(사랑/직업/건강/재정)을 적극 활용
2. 질문의 영역(연애·직업·재정·건강 등)을 파악하여 해당 RAG 필드를 우선 참조
3. 카드 간 그래프 관계(원소 공유, 수비학 연결, 원형 쌍)를 해석에 녹여낼 것
4. 질문을 항상 중심에 두고, 카드가 '그 질문에 대해' 무엇을 말하는지 각 해석마다 명확히 연결

【마이너 아르카나 단계별 에너지 설명 방법】
마이너 아르카나 카드의 숫자는 해당 슈트 에너지의 '성숙 단계'를 나타냅니다.
카드 해석에 이 단계 개념이 등장하면, 아래처럼 반드시 알기 쉽고 재미있게 풀어서 설명하세요:
- 에이스(1): "이 에너지가 세상에 처음 등장한 순간! 순수하고 가능성 가득"
- 2: "두 힘이 만나 선택의 기로에 선 상태. 균형을 잡는 중"
- 3: "씨앗이 싹을 틔워 자라나는 단계. 협력과 확장"
- 4: "기초가 탄탄히 세워진 안정기. 잠시 숨 고르기"
- 5: "안정이 깨지는 시련의 시간. 하지만 성장의 필수 과정"
- 6: "시련을 넘어 균형과 교류를 회복하는 단계"
- 7: "여기까지 온 길을 되돌아보며 평가하는 성찰의 단계"
- 8: "에너지가 폭발적으로 움직이며 변화가 일어나는 단계"
- 9: "완성 직전의 고비. 마지막 관문을 넘는 중"
- 10: "한 사이클이 완성! 결과가 나타나고 새 시작 준비"
- 시종(Page): "이 에너지를 막 배우기 시작한 신선한 초보자"
- 기사(Knight): "배운 것을 열정적으로 행동에 옮기는 추진력 넘치는 상태"
- 여왕(Queen): "에너지를 내면으로 깊이 흡수하고 성숙하게 품는 상태"
- 왕(King): "에너지를 완전히 마스터하고 외부로 지배력을 발휘하는 상태"

해석 스타일:
• 카드를 살아있는 이야기꾼처럼 묘사 — 이미지, 색채, 상징을 생생하게 언급
• 각 카드 해석 구조: ① 카드의 에너지/이미지 묘사 → ② 숫자/인물이 의미하는 단계 특성 설명(마이너 아르카나인 경우) → ③ 이 위치에서의 의미 → ④ 질문과의 직접 연결 → ⑤ 구체적 통찰
• 역방향 카드는 "그림자", "내면의 저항", "아직 드러나지 않은 잠재력"으로 풍부하게 해석
• 카드들 사이의 서사적 흐름 포착 — 마치 하나의 이야기처럼 연결
• 딱딱한 사전식 해석 대신, 카드가 직접 말을 거는 듯한 생동감 있는 표현

응답 형식:
반드시 아래 JSON 형식으로만 응답하세요:
{
  "questionAnswer": "질문에 대한 핵심 답변 — 카드들이 집합적으로 전하는 메시지, 구체적이고 명확하게. RAG 컨텍스트의 해당 영역 의미를 근거로 제시 (200-280자)",
  "overallInterpretation": "스프레드 전체의 에너지 흐름과 카드들의 상호작용 — 그래프 관계(원소/수비학/원형 쌍)를 녹여 스토리텔링 방식으로 서술. 각 카드가 다음 카드와 어떻게 연결되는지 흐름 묘사 (300-450자)",
  "cardInterpretations": [
    { "position": "위치명", "interpretation": "① 카드 이미지와 상징 생생히 묘사 ② 마이너 아르카나라면 이 숫자/인물 단계가 무엇을 의미하는지 알기 쉽게 설명 ③ 이 위치(포지션 역할)에서 이 카드가 전하는 메시지 ④ 질문에 어떻게 직접 답하는지 구체적으로 ⑤ 실질적 통찰이나 경고 (280-380자)" }
  ],
  "conclusion": "【종합 조언 섹션 — 반드시 아래 4파트 모두 포함, 총 400-600자】\n🔮 카드들이 전하는 핵심 메시지 (80-100자): 이 스프레드 전체가 말하는 가장 중요한 한 가지\n\n✨ 지금 당장 해야 할 행동 조언 3가지 (각 50-70자): 구체적이고 실행 가능한 것들, 번호로 구분\n\n⚠️ 주의할 점 (50-80자): 카드가 경고하는 것, 피해야 할 함정\n\n💌 마음에 새길 격려 메시지 (80-100자): 따뜻하고 힘이 되는 마무리"
}`;
  }

  private detectQuestionDomain(question?: string): string {
    if (!question) return '';
    const q = question;
    if (/연애|사랑|남자친구|여자친구|남편|아내|결혼|이별|짝사랑|관계|썸|연인/.test(q)) return '연애/사랑';
    if (/직장|취업|이직|사업|커리어|일|승진|면접|회사|창업|돈벌|프리랜서/.test(q)) return '직업/커리어';
    if (/돈|재정|투자|부채|빚|재산|수입|지출|경제|재물|복권|주식/.test(q)) return '재정/돈';
    if (/건강|아픔|병|수술|몸|체력|다이어트|치료|회복/.test(q)) return '건강';
    if (/가족|부모|형제|자녀|친구|인간관계|갈등|화해/.test(q)) return '인간관계';
    return '전반적 인생';
  }

  private buildRAGUserPrompt(
    request: InterpretRequest,
    ragContexts: Array<{ card: CardInput; ragDoc: string | null }>,
    questionCards: string | null,
    graphContext: string | null = null
  ): string {
    const sections: string[] = [];
    const domain = this.detectQuestionDomain(request.question);

    sections.push(`스프레드: ${request.spreadType}`);
    const questionLine = request.question
      ? `질문: "${request.question}"`
      : '질문: 일반적인 삶의 조언을 구합니다.';
    sections.push(questionLine);
    if (domain) sections.push(`질문 영역: ${domain} (RAG 컨텍스트에서 이 영역 정보 우선 활용)`);
    sections.push('');
    sections.push('⚠️ 중요: 각 카드 해석마다 반드시 위 질문과 직접 연결하여 해석하세요. 일반적 카드 의미만 나열하지 말 것.');
    sections.push('');

    sections.push('=== 뽑힌 카드 및 RAG 상세 컨텍스트 ===');
    ragContexts.forEach(({ card, ragDoc }, i) => {
      sections.push(`\n[${i + 1}번 카드] 포지션: "${card.position}" — ${card.positionDescription}`);
      sections.push(`카드: ${card.nameKo} (${card.nameEn}) ${card.isReversed ? '【역방향 ↓】' : '【정방향 ↑】'}`);
      sections.push(`키워드: ${card.keywords.join(', ')}`);
      if (ragDoc) {
        sections.push(`[RAG 상세 정보]\n${ragDoc}`);
      }
      sections.push(`→ 이 카드가 질문 "${request.question ?? '현재 상황'}"에 대해 전하는 메시지를 위치(${card.positionDescription})의 관점에서 상세히 해석하세요.`);
    });

    if (graphContext) {
      sections.push('');
      sections.push('=== 카드 간 그래프 관계 (해석에 녹여낼 것) ===');
      sections.push(graphContext);
    }

    if (questionCards) {
      sections.push('');
      sections.push('=== 질문과 의미적으로 공명하는 참조 카드 ===');
      sections.push(questionCards);
    }

    sections.push('');
    sections.push(`위 모든 컨텍스트를 활용하여, 각 카드 해석을 250자 이상으로 풍부하고 생동감 있게 작성하세요.`);
    sections.push(`특히 질문 "${request.question ?? '현재 상황'}"에 각 카드가 어떻게 답하는지 명확히 연결하세요.`);

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
        `[${i + 1}번 카드] 포지션: "${card.position}" — ${card.positionDescription}
  카드: ${card.nameKo} (${card.nameEn}) ${card.isReversed ? '【역방향 ↓】' : '【정방향 ↑】'}
  키워드: ${card.keywords.join(', ')}
  → 이 카드가 질문과 이 위치의 관점에서 무엇을 말하는지 상세히 해석하세요.`
      )
      .join('\n\n');

    const questionLine = request.question
      ? `질문: "${request.question}"`
      : '질문: 일반적인 삶의 조언을 구합니다.';

    return `스프레드: ${request.spreadType}
${questionLine}

⚠️ 각 카드 해석마다 반드시 위 질문과 직접 연결하여 해석하세요.

선택된 카드:
${cardsDescription}

각 카드를 250자 이상으로 풍부하고 생동감 있게 해석하되, 카드 이미지의 상징을 언급하고 질문과 명확히 연결해 주세요.`;
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
