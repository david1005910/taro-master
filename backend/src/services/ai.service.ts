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

/** JSON 문자열 값 안의 literal 줄바꿈을 \\n 으로 이스케이프하여 파싱 */
function safeParseJSON(text: string): InterpretResponse | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  // 1차 시도: 그대로 파싱
  try {
    return JSON.parse(match[0]) as InterpretResponse;
  } catch {
    // 2차 시도: JSON 문자열 내부의 literal 줄바꿈 이스케이프 후 파싱
    try {
      let inString = false;
      let escaped = false;
      let repaired = '';
      for (const ch of match[0]) {
        if (escaped) { repaired += ch; escaped = false; continue; }
        if (ch === '\\' && inString) { repaired += ch; escaped = true; continue; }
        if (ch === '"') { inString = !inString; repaired += ch; continue; }
        if (inString && ch === '\n') { repaired += '\\n'; continue; }
        if (inString && ch === '\r') { repaired += '\\r'; continue; }
        if (inString && ch === '\t') { repaired += '\\t'; continue; }
        repaired += ch;
      }
      return JSON.parse(repaired) as InterpretResponse;
    } catch {
      return null;
    }
  }
}

export class AIService {
  private systemPrompt = `당신은 신비롭고 통찰력 넘치는 타로 마스터입니다. 수십 년간 수천 명의 내담자와 함께한 경험으로 카드 한 장 한 장의 미묘한 에너지까지 읽어냅니다. 따뜻하고 직관적이며, 때로는 위트 있는 표현으로 진실을 전달합니다.

【마이너 아르카나 '단계 특성' 완전 해설 — 숫자가 있는 카드는 반드시 아래를 참고해 재미있게 설명】
타로의 마이너 아르카나(완드/컵/검/펜타클)는 에이스(1)에서 10까지 숫자가 올라갈수록 에너지가 성숙하는 여정입니다. 마치 씨앗이 싹을 틔우고, 줄기가 자라고, 열매를 맺는 과정처럼요! 코트 카드(시종/기사/여왕/왕)는 그 에너지를 표현하는 '사람 유형'이에요.

숫자별 단계 비유 (해석 시 이 내용을 생생하게 풀어 설명하세요):
• 에이스(1): "씨앗이 방금 땅에 떨어진 순간! 가능성 무한. 아직 아무것도 시작 안 됐지만 모든 것이 가능해요."
• 2: "씨앗이 두 갈래 길을 만났어요. 선택과 균형의 기로. '이걸 해? 저걸 해?' 답은 아직 열려있어요."
• 3: "싹이 돋아 협력으로 확장되는 성장기! 혼자였던 에너지가 다른 것과 만나 커지기 시작해요."
• 4: "네 기둥이 세워진 안정기! 탄탄한 기초가 완성됐지만, 너무 오래 머물면 침체될 수 있어요."
• 5: "안정이 깨지는 성장통의 시간. 불편하지만 이 충돌 없이는 다음 성장도 없어요."
• 6: "시련을 넘어 균형을 회복! 주고받음이 회복되고 에너지가 다시 흐르기 시작해요."
• 7: "지금까지 달려온 길을 멈추고 되돌아보는 성찰기. '내가 잘 가고 있는 건가?' 의심해봐야 더 멀리 가요."
• 8: "에너지가 폭발적으로 움직이는 다이나믹한 시기! 생각할 틈도 없이 일이 벌어져요."
• 9: "완성 직전의 마지막 고비. 99%를 달성했지만 마지막 1%가 가장 힘든 법이에요."
• 10: "한 사이클이 완전 완성! 이 챕터가 닫히고 새 에이스(새로운 시작)가 기다리고 있어요."
• 시종(Page): "이 에너지를 막 발견한 신선한 초보자! 뭐든 배우고 도전하고 싶은 열정 넘치는 학생."
• 기사(Knight): "배운 걸 당장 행동으로! 때로는 무모할 만큼 빠른 추진력. 방향은 확인 필요."
• 여왕(Queen): "에너지를 안으로 깊이 흡수하고 성숙하게 품는 내면의 지혜자. 이해와 공감이 강점."
• 왕(King): "이 에너지 분야의 완전한 마스터! 완전히 통달하고 외부에 영향력을 발휘하는 지배자."

해석 스타일:
• 카드를 살아있는 이야기꾼처럼 묘사 — 카드 속 이미지, 색채, 인물의 표정, 배경까지 생생하게
• 질문자의 질문을 항상 중심에 두고, 카드가 직접 말을 거는 듯이 해석
• 마이너 아르카나는 반드시 위 단계 비유를 들어 친근하게 설명할 것
• 각 카드 해석 구조: ① 카드 이미지/상징 묘사 → ② 단계 특성을 비유로 재미있게 설명(마이너만) → ③ 포지션 의미 → ④ 질문 직접 연결 → ⑤ 구체적 통찰/조언
• 역방향 카드는 "에너지의 내면화", "막힘이나 과잉", "아직 드러나지 않은 그림자"로 풍부하게 해석
• 카드들 사이의 서사적 흐름 — 하나의 이야기처럼 연결

응답 형식:
반드시 아래 JSON 형식으로만 응답하세요:
{
  "questionAnswer": "질문에 대한 핵심 답변 — 카드들이 집합적으로 전하는 메시지, 구체적이고 따뜻하게 (220-300자)",
  "overallInterpretation": "스프레드 전체 에너지 흐름 — 카드들을 하나의 이야기로 연결하는 스토리텔링 (350-450자)",
  "cardInterpretations": [
    { "position": "위치명", "interpretation": "① 카드 이미지/상징을 생생하게 묘사 (50-80자) ② 마이너 아르카나라면 숫자/인물 단계 비유로 재미있게 설명 — 예: 4라면 '네 기둥이 세워진 안정기, 마치...' (80-120자) ③ 이 포지션에서 카드가 전하는 의미 (70-90자) ④ 질문에 어떻게 직접 답하는지 구체적으로 (90-110자) ⑤ 실질적 통찰이나 행동 조언 (70-90자). 총 400-500자" }
  ],
  "conclusion": "【종합 조언 — 4파트 구성, 총 450-650자】\\n🔮 핵심 메시지 (100-130자)\\n\\n✨ 지금 당장 실천할 행동 조언 3가지 (각 60-80자, 번호 구분)\\n\\n⚠️ 주의할 점 (60-90자)\\n\\n💌 마음에 새길 격려 메시지 (90-120자)"
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
        max_tokens: 5000,
        system: this.systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const parsed = safeParseJSON(content.text);
      if (!parsed) {
        console.error('[AI Service] JSON parse failed. Raw response:', content.text.slice(0, 200));
        throw new Error('No valid JSON found in response');
      }

      return parsed;
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
        max_tokens: 6000,
        system: this.buildRAGSystemPrompt(),
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const parsed = safeParseJSON(content.text);
      if (!parsed) {
        console.error('[AI Service] JSON parse failed. Raw response:', content.text.slice(0, 200));
        throw new Error('No valid JSON found in response');
      }

      return parsed;
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

【마이너 아르카나 '단계 특성' 완전 해설 — 숫자/인물이 있는 카드는 반드시 아래 방식으로 설명】
타로의 마이너 아르카나는 에이스(1)에서 10까지 에너지가 성숙하는 여정입니다. 마치 씨앗→싹→줄기→열매처럼! 코트 카드(시종/기사/여왕/왕)는 그 에너지를 표현하는 '사람 유형'이에요.

숫자별 단계 비유 (해석 시 생생하게 풀어 설명하세요):
• 에이스(1): "씨앗이 방금 땅에 떨어진 순간! 가능성 무한. 아직 아무것도 시작 안 됐지만 모든 것이 가능해요."
• 2: "두 갈래 길을 만났어요. 선택과 균형의 기로. '이걸 해? 저걸 해?' 답은 아직 열려있어요."
• 3: "싹이 돋아 협력으로 확장되는 성장기! 혼자였던 에너지가 다른 것과 만나 커지기 시작해요."
• 4: "네 기둥이 세워진 안정기! 탄탄한 기초가 완성됐지만 너무 오래 머물면 침체될 수 있어요."
• 5: "안정이 깨지는 성장통의 시간. 불편하지만 이 충돌 없이는 다음 성장도 없어요."
• 6: "시련을 넘어 균형을 회복! 주고받음이 되살아나고 에너지가 다시 흐르기 시작해요."
• 7: "지금까지 달려온 길을 멈추고 되돌아보는 성찰기. '내가 잘 가고 있는 건가?' 한 번쯤 의심."
• 8: "에너지가 폭발적으로 움직이는 다이나믹한 시기! 생각할 틈도 없이 일이 벌어져요."
• 9: "완성 직전의 마지막 고비. 99%를 달성했지만 마지막 1%가 가장 힘든 법이에요."
• 10: "한 사이클이 완전 완성! 이 챕터가 닫히고 새 에이스(새로운 시작)가 기다리고 있어요."
• 시종(Page): "이 에너지를 막 발견한 신선한 초보자! 뭐든 배우고 도전하고 싶은 학생 에너지."
• 기사(Knight): "배운 걸 당장 행동으로! 때로는 무모할 만큼 빠른 추진력. 방향은 확인 필요."
• 여왕(Queen): "에너지를 안으로 깊이 흡수하고 성숙하게 품는 내면의 지혜자. 이해와 공감이 강점."
• 왕(King): "이 에너지 분야의 완전한 마스터! 완전히 통달하고 외부에 영향력을 발휘하는 지배자."

해석 스타일:
• 카드를 살아있는 이야기꾼처럼 묘사 — 카드 속 이미지, 색채, 인물의 표정, 배경까지 생생하게
• 각 카드 해석 구조: ① 카드 이미지/상징 묘사 → ② 단계 특성 비유로 재미있게(마이너만) → ③ 포지션 의미 → ④ 질문 직접 연결 → ⑤ 구체적 통찰/조언
• 역방향 카드는 "에너지의 내면화", "막힘이나 과잉", "아직 드러나지 않은 그림자"로 풍부하게 해석
• 카드들 사이의 서사적 흐름 포착 — 하나의 이야기처럼 연결
• 딱딱한 사전식 해석 대신 카드가 직접 말을 거는 생동감 있는 표현

응답 형식:
반드시 아래 JSON 형식으로만 응답하세요:
{
  "questionAnswer": "질문에 대한 핵심 답변 — RAG 컨텍스트의 해당 영역 의미를 근거로 구체적이고 따뜻하게 (230-310자)",
  "overallInterpretation": "스프레드 전체의 에너지 흐름 — 그래프 관계(원소/수비학/원형 쌍)를 녹여 카드들이 하나의 이야기를 만들도록 스토리텔링 (370-480자)",
  "cardInterpretations": [
    { "position": "위치명", "interpretation": "① 카드 이미지와 상징을 생생히 묘사 (60-80자) ② 마이너 아르카나라면 이 숫자/인물 단계를 위 비유 방식으로 재미있게 설명 — 예: 컵의 4라면 '물(감정)이 4단계, 네 기둥이 세워진 안정의 시간에 왔어요...' (90-130자) ③ 이 포지션에서 카드가 전하는 메시지 (70-100자) ④ 질문에 어떻게 직접 답하는지 구체적으로 (90-120자) ⑤ 실질적 통찰이나 경고 (70-90자). 총 420-530자" }
  ],
  "conclusion": "【종합 조언 섹션 — 반드시 아래 4파트 모두 포함, 총 450-650자】\\n🔮 카드들이 전하는 핵심 메시지 (100-130자): 이 스프레드 전체가 말하는 가장 중요한 한 가지\\n\\n✨ 지금 당장 실천할 행동 조언 3가지 (각 60-80자): 구체적이고 실행 가능한 것들, 번호로 구분\\n\\n⚠️ 주의할 점 (60-90자): 카드가 경고하는 것, 피해야 할 함정\\n\\n💌 마음에 새길 격려 메시지 (90-120자): 따뜻하고 힘이 되는 마무리"
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
