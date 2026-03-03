import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
import { ragService } from './rag.service';
import { neo4jGraphService } from './neo4j.service';
import prisma from '../utils/prisma';

// API 키가 설정되지 않은 경우 null로 설정
const genAI = config.GEMINI_API_KEY && config.GEMINI_API_KEY !== 'your-gemini-api-key-here'
  ? new GoogleGenerativeAI(config.GEMINI_API_KEY)
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
    if (!genAI) {
      console.error('[AI Service] Gemini API key is not configured');
      throw {
        status: 503,
        code: 'AI_SERVICE_NOT_CONFIGURED',
        message: 'AI 서비스가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 설정해주세요.'
      };
    }

    const userPrompt = this.buildUserPrompt(request);

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.8,
          maxOutputTokens: 3000  // 5000 → 3000 (속도 40% 향상)
        }
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: this.systemPrompt
      });

      const responseText = result.response.text();
      const parsed = safeParseJSON(responseText);

      if (!parsed) {
        console.error('[AI Service] JSON parse failed. Raw response:', responseText.slice(0, 200));
        throw new Error('No valid JSON found in response');
      }

      return parsed;
    } catch (error: any) {
      console.error('[AI Service] Error:', error.message || error);

      // Gemini API error handling
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('invalid API key')) {
        throw { status: 503, code: 'AI_SERVICE_AUTH_ERROR', message: 'AI API 인증에 실패했습니다. API 키를 확인해주세요.' };
      }
      if (error.message?.includes('RATE_LIMIT_EXCEEDED') || error.message?.includes('quota')) {
        throw { status: 503, code: 'AI_SERVICE_RATE_LIMIT', message: 'AI 서비스 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' };
      }
      if (error.code) throw error;
      throw { status: 500, code: 'AI_INTERPRETATION_FAILED', message: 'AI 해석에 실패했습니다. 잠시 후 다시 시도해주세요.' };
    }
  }

  // RAG 컨텍스트 기반 강화 해석 (Qdrant 카드 시맨틱 검색)
  async interpretWithRAG(request: InterpretRequest): Promise<InterpretResponse> {
    if (!genAI) {
      console.error('[AI Service] Gemini API key is not configured');
      throw {
        status: 503,
        code: 'AI_SERVICE_NOT_CONFIGURED',
        message: 'AI 서비스가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 설정해주세요.'
      };
    }

    // 병렬로 RAG + 그래프 컨텍스트 수집 (Inference.py 패턴: 카드+질문 결합 검색)
    const [ragCardContexts, questionRagCards, graphContext] = await Promise.all([
      this.fetchCardRAGContexts(request.cards, request.question),
      this.fetchQuestionRAGCards(request.question),
      this.fetchGraphContext(request.cards)
    ]);

    const userPrompt = this.buildRAGUserPrompt(request, ragCardContexts, questionRagCards, graphContext);

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.8,
          maxOutputTokens: 4000  // 속도 최적화: 8000 → 4000 (50% 빠름)
        }
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: this.buildRAGSystemPrompt()
      });

      const responseText = result.response.text();
      const parsed = safeParseJSON(responseText);

      if (!parsed) {
        console.error('[AI Service] JSON parse failed. Raw response:', responseText.slice(0, 200));
        throw new Error('No valid JSON found in response');
      }

      return parsed;
    } catch (error: any) {
      console.error('[AI Service] RAG interpret error:', error.message || error);

      // Gemini API error handling
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('invalid API key')) {
        throw { status: 503, code: 'AI_SERVICE_AUTH_ERROR', message: 'AI API 인증에 실패했습니다. API 키를 확인해주세요.' };
      }
      if (error.message?.includes('RATE_LIMIT_EXCEEDED') || error.message?.includes('quota')) {
        throw { status: 503, code: 'AI_SERVICE_RATE_LIMIT', message: 'AI 서비스 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' };
      }
      if (error.code) throw error;
      throw { status: 500, code: 'AI_INTERPRETATION_FAILED', message: 'AI 해석에 실패했습니다. 잠시 후 다시 시도해주세요.' };
    }
  }

  // 각 뽑힌 카드에 대한 Qdrant RAG 컨텍스트 조회 (Filtering.py + Reasoning.py 패턴 적용)
  private async fetchCardRAGContexts(
    cards: CardInput[],
    question?: string
  ): Promise<Array<{ card: CardInput; ragDoc: string | null }>> {
    if (!ragService.isInitialized()) {
      return cards.map(card => ({ card, ragDoc: null }));
    }

    // 질문 도메인 감지 (chunks 필터링용)
    const domain = this.detectQuestionDomain(question);
    const questionDomainHint = question || '현재 상황';

    // 멀티 카드 처리: 각 카드별로 병렬 검색 (Filtering.py 권장)
    const results = await Promise.all(
      cards.map(async (card) => {
        try {
          // Reasoning.py 패턴: Position 정보를 쿼리에 포함 (같은 카드도 위치에 따라 다른 해석)
          const positionHint = card.position ? `${card.position} 위치에서` : '';
          const query = `${card.nameKo} 카드가 ${positionHint} ${card.isReversed ? '역방향으로' : '정방향으로'} 나왔을 때, ${questionDomainHint}에 대한 해석은?`;

          // Filtering.py 패턴: 메타데이터 필터로 해당 카드만 검색 (다른 카드 섞이지 않도록)
          let hits = await ragService.hybridSearch(query, 2, {
            nameKo: card.nameKo
          });

          // Fallback: 필터링 결과 없으면 일반 검색 (Filtering.py 권장)
          if (hits.length === 0) {
            console.warn(`[AI] No filtered results for ${card.nameKo}, trying general search...`);
            hits = await ragService.hybridSearch(query, 2);
          }

          if (hits.length === 0) return { card, ragDoc: null };

          // ChromaDB.py 패턴: 시맨틱 검색 품질 검증 (k=2, 가장 의미가 가까운 해석)
          console.log(`[RAG] ${card.nameKo} search - score: ${hits[0].score.toFixed(3)}, results: ${hits.length}`);

          // 첫 번째 결과를 주 컨텍스트로 사용
          const c = hits[0].card;

          // ChromaDB.py fallback 패턴: 검색 품질 검증 (임계값 0.5)
          if (hits[0].score < 0.5) {
            console.warn(`[RAG] ⚠️  Low relevance score for ${card.nameKo}: ${hits[0].score.toFixed(3)}`);
            console.warn(`[RAG] 💡 검색 품질이 낮습니다. 일반 카드 정보로 대체합니다.`);

            // 스코어가 너무 낮으면 DB에서 직접 조회 (fallback)
            try {
              const directCard = await prisma.card.findFirst({
                where: { nameKo: card.nameKo }
              });
              if (directCard) {
                console.log(`[RAG] ✓ Fallback: DB에서 직접 조회 성공 - ${card.nameKo}`);
                return {
                  card,
                  ragDoc: this.buildFallbackContext(directCard, domain, card.isReversed)
                };
              }
            } catch (dbError) {
              console.error(`[RAG] Fallback DB 조회 실패:`, dbError);
            }
          }

          // [간소화된 참고 지식] — 속도 최적화 (불필요한 정보 제거)
          const ragDocLines: string[] = [
            `[${c.nameKo}]`,
            `키워드: ${c.keywords.slice(0, 3).join(', ')}`,  // 상위 3개만
            ''
          ];

          // 정/역방향 의미 (핵심만)
          const meaningKey = card.isReversed ? '역방향' : '정방향';
          const meaningText = card.isReversed ? c.reversedMeaning : c.uprightMeaning;
          ragDocLines.push(`${meaningKey}: ${meaningText}`);

          // 도메인 관련 정보만 포함 (나머지 제거)
          if (domain === '연애/사랑' && c.love) {
            ragDocLines.push(`사랑: ${c.love}`);
          } else if (domain === '직업/커리어' && c.career) {
            ragDocLines.push(`직업: ${c.career}`);
          } else if (domain === '재정/돈' && c.finance) {
            ragDocLines.push(`재정: ${c.finance}`);
          } else if (domain === '건강' && c.health) {
            ragDocLines.push(`건강: ${c.health}`);
          } else if (c.symbolism) {
            // 도메인 매칭 안되면 상징만
            ragDocLines.push(`상징: ${c.symbolism.slice(0, 100)}`);  // 100자 제한
          }

          return { card, ragDoc: ragDocLines.join('\n') };
        } catch (e) {
          console.warn(`[AI] RAG context fetch failed for ${card.nameKo}:`, e);
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

  // Reasoning.py 패턴: 카드 간 '케미' 분석 (메이저 비율, 원소 분포, 수비학 패턴)
  private analyzeCardChemistry(cards: CardInput[]): string {
    const lines: string[] = [];

    // 1. 메이저/마이너 비율 분석
    const majorCount = cards.filter(c => !c.suit).length;
    const minorCount = cards.length - majorCount;

    if (majorCount > 0) {
      const majorRatio = ((majorCount / cards.length) * 100).toFixed(0);
      lines.push(`🎯 메이저 아르카나 ${majorCount}장 (${majorRatio}%) — 큰 전환점, 인생의 중요한 국면`);
    }
    if (minorCount > 0) {
      const minorRatio = ((minorCount / cards.length) * 100).toFixed(0);
      lines.push(`📅 마이너 아르카나 ${minorCount}장 (${minorRatio}%) — 일상적 사건, 세부적 흐름`);
    }

    // 2. 원소(Element) 분포 분석
    const elementMap: Record<string, number> = { 불: 0, 물: 0, 공기: 0, 흙: 0 };
    const suitToElement: Record<string, string> = {
      WANDS: '불',
      CUPS: '물',
      SWORDS: '공기',
      PENTACLES: '흙'
    };

    cards.forEach(card => {
      if (card.suit && suitToElement[card.suit]) {
        elementMap[suitToElement[card.suit]]++;
      }
    });

    const totalElements = Object.values(elementMap).reduce((a, b) => a + b, 0);
    if (totalElements > 0) {
      lines.push('');
      lines.push('🔥💧🌬️🌿 원소(Element) 에너지 분포:');

      const elementDescriptions: Record<string, string> = {
        불: '열정·행동·창의',
        물: '감정·직관·흐름',
        공기: '사고·소통·분석',
        흙: '물질·안정·실행'
      };

      Object.entries(elementMap)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .forEach(([element, count]) => {
          const percentage = ((count / totalElements) * 100).toFixed(0);
          lines.push(`  • ${element} 원소 ${count}장 (${percentage}%) — ${elementDescriptions[element]}`);
        });

      // 지배 원소 감지 (50% 이상)
      const dominantElement = Object.entries(elementMap).find(([_, count]) => count / totalElements >= 0.5);
      if (dominantElement) {
        lines.push('');
        lines.push(`⚡ 지배 원소: ${dominantElement[0]} (${((dominantElement[1] / totalElements) * 100).toFixed(0)}%) — 이 스프레드는 ${dominantElement[0]} 에너지가 강하게 작용합니다`);
      }
    }

    // 3. 수비학 패턴 분석 (같은 숫자 반복)
    const numberMap: Record<number, string[]> = {};
    cards.forEach(card => {
      if (card.number !== undefined && card.number !== null) {
        if (!numberMap[card.number]) numberMap[card.number] = [];
        numberMap[card.number].push(card.nameKo);
      }
    });

    const repeatedNumbers = Object.entries(numberMap).filter(([_, cards]) => cards.length >= 2);
    if (repeatedNumbers.length > 0) {
      lines.push('');
      lines.push('🔢 수비학 패턴 (같은 숫자 반복):');
      repeatedNumbers.forEach(([num, cardNames]) => {
        const numInt = parseInt(num);
        const meaning = this.getNumerologyMeaning(numInt);
        lines.push(`  • 숫자 ${num} (${cardNames.join(', ')}) — ${meaning}`);
      });
    }

    return lines.length > 0 ? lines.join('\n') : '';
  }

  // 수비학 의미 헬퍼
  private getNumerologyMeaning(num: number): string {
    const meanings: Record<number, string> = {
      1: '새로운 시작, 창조, 잠재력',
      2: '균형, 선택, 파트너십',
      3: '성장, 확장, 표현',
      4: '안정, 구조, 기초',
      5: '변화, 도전, 갈등',
      6: '조화, 회복, 균형',
      7: '성찰, 평가, 내면',
      8: '힘, 움직임, 달성',
      9: '완성, 성숙, 전환',
      10: '완결, 순환의 끝, 새 시작 준비'
    };
    return meanings[num] || '특별한 의미';
  }

  // 질문을 벡터 검색하여 관련 카드 컨텍스트 조회 (Filtering.py: 시맨틱 검색)
  private async fetchQuestionRAGCards(question?: string): Promise<string | null> {
    if (!question || !ragService.isInitialized()) return null;

    try {
      // 속도 최적화: 3개 → 1개 검색 (프롬프트 크기 67% 감소)
      const hits = await ragService.hybridSearch(question, 1);
      if (hits.length === 0) {
        console.warn('[RAG] No semantic matches found for question:', question);
        return null;
      }

      // 검색 품질 로그
      console.log(`[RAG] Question search found ${hits.length} cards, top score: ${hits[0].score.toFixed(3)}`);

      // 간소화된 정보만 반환
      const h = hits[0];
      return `${h.card.nameKo} (관련도: ${h.score.toFixed(3)})\n키워드: ${h.card.keywords.slice(0, 3).join(', ')}\n의미: ${h.card.uprightMeaning.slice(0, 80)}...`;
    } catch (e) {
      console.error('[RAG] Question search failed:', e);
      return null;
    }
  }

  private buildRAGSystemPrompt(): string {
    return `╔═══════════════════════════════════════════════════════════════╗
║         당신은 신비롭고 따뜻한 타로 마스터입니다              ║
╚═══════════════════════════════════════════════════════════════╝

【Persona — 20년 경력의 타로 상담사】
당신은 이런 사람입니다:
• **이름:** 타로 마스터 (20년 경력, 5000명 이상 상담)
• **성격:** 따뜻하고 신비로우며, 위트 있는 말투로 진실을 부드럽게 전달
• **특기:** 카드 한 장 한 장의 미묘한 에너지와 상징을 깊이 읽어냄
• **철학:** "타로는 미래를 정하는 것이 아니라, 현재의 에너지를 비추는 거울입니다."
• **접근:** 단순히 지식을 읽어주는 것이 아니라, 상담자의 삶에 실제로 도움이 되는 통찰 제공

【답변 구조 — Retrieve.py 패턴】
모든 답변은 반드시 다음 3단계 논리적 구조를 따라야 합니다:

1️⃣ **서론 (인사/분위기 조성, 30-50자)**
   - 친근한 인사와 질문에 대한 공감
   - 예: "안녕하세요! 오늘 이런 질문을 품고 계시는군요. 카드들이 무슨 이야기를 들려줄지 함께 들어볼까요?"

2️⃣ **본론 (카드 해석 및 질문 직접 답변, 핵심 내용)**
   - 각 카드의 상세 해석 (RAG 데이터 기반)
   - 질문에 대한 구체적이고 직접적인 답변
   - 멀티 카드일 경우: 과거-현재-미래의 유기적 흐름 연결

3️⃣ **결론 (조언 및 격려, 80-120자)**
   - 실천 가능한 구체적 조언 2-3개
   - 따뜻한 격려와 긍정적 마무리
   - 예: "지금 당장 할 수 있는 작은 행동부터 시작해보세요. 당신은 이미 충분히 준비되어 있습니다!"

RAG 컨텍스트 활용 원칙:
1. 제공된 [RAG 상세 정보]의 정방향/역방향 의미, 상징, 영역별 해석(사랑/직업/건강/재정)을 적극 활용
2. 질문의 영역(연애·직업·재정·건강 등)을 파악하여 해당 RAG 필드를 우선 참조
3. 카드 간 그래프 관계(원소 공유, 수비학 연결, 원형 쌍)를 해석에 녹여낼 것
4. 질문을 항상 중심에 두고, 카드가 '그 질문에 대해' 무엇을 말하는지 각 해석마다 명확히 연결

【멀티 카드 종합 해석 — Retrieve.py 패턴】
**3장 이상의 카드가 있을 경우 (과거-현재-미래 등):**
- 각 카드를 단독으로 해석하지 말고, **전체 흐름을 유기적으로 연결**하세요
- 예: "과거의 바보 카드가 보여준 순수한 열정이 → 현재 마법사 카드의 실행력으로 이어지고 → 미래 세계 카드의 완성으로 귀결됩니다"
- **스토리텔링**: 3장의 카드를 하나의 드라마처럼 엮어서 전달
- overallInterpretation에서 반드시 "과거→현재→미래" 또는 "상황→장애→결과" 같은 흐름을 명시

【할루시네이션 제어 — 중요!】
⚠️ **데이터 기반 답변 원칙:**
- 제공된 [RAG 참고 지식]에 있는 내용을 **최우선**으로 사용
- 만약 RAG 데이터에 특정 질문 영역(예: 건강)에 대한 정보가 없다면:
  1. 일반적인 타로 상징성을 간략히 언급 ("이 카드는 전통적으로 ... 상징합니다")
  2. **단, 확신적인 단정은 피하기** ("반드시 ~할 것입니다" 금지)
  3. "카드의 일반적 의미를 참고하면..." 같은 유보적 표현 사용
- 절대 **지어내거나 과장하지 마세요**. 모르면 솔직히 "이 영역은 명확하지 않으니 다른 카드와 함께 보시는 것을 권합니다" 표현 가능

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
  "overallInterpretation": "스프레드 전체의 에너지 흐름 — 케미 분석(메이저/원소/수비학) + 그래프 관계를 녹여 카드들이 하나의 이야기를 만들도록 스토리텔링. position별 흐름(과거→현재→미래) 반드시 명시 (370-500자)",
  "cardInterpretations": [
    { "position": "위치명", "interpretation": "① 카드 이미지와 상징을 생생히 묘사 (60-80자) ② 마이너 아르카나라면 이 숫자/인물 단계를 위 비유 방식으로 재미있게 설명 — 예: 컵의 4라면 '물(감정)이 4단계, 네 기둥이 세워진 안정의 시간에 왔어요...' (90-130자) ③ 이 **position(위치)**에서 카드가 전하는 메시지 — 같은 카드도 위치에 따라 의미가 다름! (80-110자) ④ 질문에 어떻게 직접 답하는지 구체적으로 (90-120자) ⑤ 실질적 통찰이나 경고 (70-90자). 총 420-550자" }
  ],
  "conclusion": "【종합 조언 섹션 — 반드시 아래 5파트 모두 포함, Reasoning.py 패턴】\\n💎 한 줄 요약 조언 (50-70자): 이 리딩의 핵심을 한 문장으로 압축한 행운의 메시지\\n\\n🔮 카드들이 전하는 핵심 메시지 (100-130자): 이 스프레드 전체가 말하는 가장 중요한 한 가지\\n\\n✨ 지금 당장 실천할 행동 조언 3가지 (각 60-80자): 구체적이고 실행 가능한 것들, 번호로 구분\\n\\n⚠️ 주의할 점 (60-90자): 카드가 경고하는 것, 피해야 할 함정\\n\\n💌 마음에 새길 격려 메시지 (90-120자): 따뜻하고 힘이 되는 마무리"
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

  // ChromaDB.py Fallback 패턴: DB에서 직접 조회한 카드 정보로 컨텍스트 생성
  private buildFallbackContext(
    card: any,
    domain: string,
    isReversed: boolean
  ): string {
    const keywords = (() => {
      try { return JSON.parse(card.keywords) as string[]; }
      catch { return card.keywords.split(',').map((k: string) => k.trim()); }
    })();

    const ragDocLines: string[] = [
      `[${card.nameKo} (${card.nameEn}) — Fallback 참고 지식 (DB 직접 조회)]`,
      `키워드: ${keywords.join(', ')}`,
      `⚠️ 주의: RAG 검색 품질이 낮아 데이터베이스에서 직접 가져온 정보입니다.`,
      ''
    ];

    // 정/역방향 의미
    ragDocLines.push(`정방향 의미: ${card.uprightMeaning}`);
    ragDocLines.push(`역방향 의미: ${card.reversedMeaning}`);
    ragDocLines.push('');

    // 도메인 우선 정보
    if (domain === '연애/사랑' && card.love) {
      ragDocLines.push(`💕 연애/사랑 해석 (우선): ${card.love}`);
    } else if (domain === '직업/커리어' && card.career) {
      ragDocLines.push(`💼 직업/커리어 해석 (우선): ${card.career}`);
    } else if (domain === '재정/돈' && card.finance) {
      ragDocLines.push(`💰 재정/돈 해석 (우선): ${card.finance}`);
    } else if (domain === '건강' && card.health) {
      ragDocLines.push(`🏥 건강 해석 (우선): ${card.health}`);
    }

    // 나머지 영역
    ragDocLines.push('');
    ragDocLines.push(`상징: ${card.symbolism}`);
    if (domain !== '연애/사랑' && card.love) ragDocLines.push(`사랑: ${card.love}`);
    if (domain !== '직업/커리어' && card.career) ragDocLines.push(`직업: ${card.career}`);
    if (domain !== '건강' && card.health) ragDocLines.push(`건강: ${card.health}`);
    if (domain !== '재정/돈' && card.finance) ragDocLines.push(`재정: ${card.finance}`);

    return ragDocLines.join('\n');
  }

  private buildRAGUserPrompt(
    request: InterpretRequest,
    ragContexts: Array<{ card: CardInput; ragDoc: string | null }>,
    questionCards: string | null,
    graphContext: string | null = null
  ): string {
    const sections: string[] = [];
    const domain = this.detectQuestionDomain(request.question);

    // Inference.py 패턴: [질문] 섹션을 맨 앞에 명확히 배치
    sections.push('╔═══════════════════════════════════════════════════════╗');
    sections.push('║                     [사용자 질문]                      ║');
    sections.push('╚═══════════════════════════════════════════════════════╝');
    const questionLine = request.question
      ? `"${request.question}"`
      : '일반적인 삶의 조언을 구합니다.';
    sections.push(questionLine);
    sections.push('');
    sections.push(`스프레드: ${request.spreadType}`);
    if (domain) sections.push(`질문 영역: ${domain} ← RAG 컨텍스트에서 이 영역 정보를 최우선 활용`);
    sections.push('');
    sections.push('⚠️ 중요: 각 카드 해석마다 반드시 위 질문과 직접 연결하여 해석하세요. 일반적 카드 의미만 나열하지 말 것.');
    sections.push('');

    // Inference.py 패턴: [뽑은 카드] + [참고 지식] 섹션
    sections.push('╔═══════════════════════════════════════════════════════╗');
    sections.push('║              [뽑은 카드] & [참고 지식]                 ║');
    sections.push('╚═══════════════════════════════════════════════════════╝');
    ragContexts.forEach(({ card, ragDoc }, i) => {
      sections.push(`\n━━━ [${i + 1}번 카드] 포지션: "${card.position}" — ${card.positionDescription} ━━━`);
      sections.push(`카드: ${card.nameKo} (${card.nameEn}) ${card.isReversed ? '【역방향 ↓】' : '【정방향 ↑】'}`);
      sections.push(`키워드: ${card.keywords.join(', ')}`);
      sections.push('');
      if (ragDoc) {
        sections.push(ragDoc);
        sections.push('');
      }
      sections.push(`💬 해석 가이드: 위 [참고 지식]을 바탕으로, 이 카드가 질문 "${request.question ?? '현재 상황'}"에 대해 전하는 메시지를 위치(${card.positionDescription})의 관점에서 상세히 해석하세요.`);
    });

    // Reasoning.py 패턴: 카드 간 '케미' 분석 (메이저 비율, 원소 분포, 수비학 패턴)
    const chemistryAnalysis = this.analyzeCardChemistry(ragContexts.map(r => r.card));
    if (chemistryAnalysis) {
      sections.push('');
      sections.push('╔═══════════════════════════════════════════════════════╗');
      sections.push('║         [카드 간 케미 분석 — Reasoning.py 패턴]        ║');
      sections.push('╚═══════════════════════════════════════════════════════╝');
      sections.push(chemistryAnalysis);
      sections.push('');
      sections.push('💡 이 케미 정보를 overallInterpretation에 반영하세요. 예: "물 원소가 지배적이므로 감정과 직관이 중요합니다"');
    }

    if (graphContext) {
      sections.push('');
      sections.push('╔═══════════════════════════════════════════════════════╗');
      sections.push('║            [카드 간 관계 — 그래프 컨텍스트]            ║');
      sections.push('╚═══════════════════════════════════════════════════════╝');
      sections.push(graphContext);
      sections.push('');
      sections.push('💡 이 관계들을 전체 해석(overallInterpretation)에 스토리텔링으로 녹여내세요.');
    }

    if (questionCards) {
      sections.push('');
      sections.push('╔═══════════════════════════════════════════════════════╗');
      sections.push('║          [질문 관련 추가 참조 카드 — RAG 검색]          ║');
      sections.push('╚═══════════════════════════════════════════════════════╝');
      sections.push(questionCards);
      sections.push('');
      sections.push('💡 이 카드들은 질문과 의미적으로 유사하므로 해석의 배경 컨텍스트로 활용하세요.');
    }

    sections.push('');
    sections.push('╔═══════════════════════════════════════════════════════╗');
    sections.push('║                  [종합 해석 가이드]                    ║');
    sections.push('╚═══════════════════════════════════════════════════════╝');
    sections.push('');
    sections.push('📝 각 카드 해석: 250자 이상으로 풍부하고 생동감 있게 작성');
    sections.push(`💬 질문 연결: "${request.question ?? '현재 상황'}"에 각 카드가 어떻게 답하는지 명확히 연결`);
    sections.push('');

    // 멀티 카드 흐름 강조 (Reasoning.py 패턴 강화)
    if (ragContexts.length >= 2) {
      sections.push('🌊 **멀티 카드 에너지 흐름 연결 (Reasoning.py 패턴):**');
      sections.push(`   ${ragContexts.length}장의 카드를 단독으로 해석하지 말고, 전체 흐름을 유기적으로 연결하세요!`);
      sections.push('');
      const positions = ragContexts.map(r => r.card.position).join(' → ');
      sections.push(`   📍 흐름 구조: "${positions}"`);
      sections.push('');

      if (ragContexts.length >= 3) {
        sections.push(`   ✨ 에너지 흐름 예시:`);
        sections.push(`      "${ragContexts[0].card.nameKo} (${ragContexts[0].card.position})"가 보여준 에너지가`);
        sections.push(`      → "${ragContexts[1].card.nameKo} (${ragContexts[1].card.position})"의 상황으로 이어지고`);
        sections.push(`      → "${ragContexts[2].card.nameKo} (${ragContexts[2].card.position})"의 결과/조언으로 귀결됩니다`);
      } else {
        sections.push(`   ✨ 에너지 흐름 예시:`);
        sections.push(`      "${ragContexts[0].card.nameKo} (${ragContexts[0].card.position})"에서 시작한 에너지가`);
        sections.push(`      → "${ragContexts[1].card.nameKo} (${ragContexts[1].card.position})"로 전개됩니다`);
      }
      sections.push('');

      sections.push('   🎭 스토리텔링 원칙:');
      sections.push('      1. 각 카드의 의미를 먼저 짧게 설명');
      sections.push('      2. 과거→현재→미래 (또는 상황→장애→결과) 흐름 중심으로 종합 이야기 구성');
      sections.push('      3. 카드들 사이에 모순이 있다면 → 그것을 극복하기 위한 조언으로 풀어서 설명');
      sections.push('      4. overallInterpretation에서 반드시 전체 흐름을 명시');
      sections.push('');
      sections.push('   ⚠️ 중요: 각 카드의 **position(위치)** 의미를 해석에 반드시 반영하세요!');
      sections.push(`      예: 같은 "달" 카드라도 "과거" 자리에 있으면 "지나간 혼란", "미래" 자리에 있으면 "다가올 불확실성"으로 해석이 달라집니다`);
      sections.push('');
    }

    return sections.join('\n');
  }

  // 챗봇 후속 질문 처리
  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!genAI) {
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

    // Gemini 대화 형식으로 변환
    const contents = [
      ...(request.history ?? []).map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      })),
      { role: 'user' as const, parts: [{ text: request.message }] }
    ];

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2000  // 증가: 1000 → 2000 (채팅 답변 잘림 방지)
        }
      });

      const result = await model.generateContent({
        contents,
        systemInstruction: systemPrompt
      });

      const reply = result.response.text();
      return { reply };
    } catch (error: any) {
      console.error('[AI Service] Chat error:', error.message || error);

      // Gemini error handling
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('invalid API key')) {
        throw { status: 503, code: 'AI_SERVICE_AUTH_ERROR', message: 'AI API 인증에 실패했습니다.' };
      }
      if (error.message?.includes('RATE_LIMIT_EXCEEDED') || error.message?.includes('quota')) {
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
