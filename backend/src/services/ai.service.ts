import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env';

// API 키가 설정되지 않은 경우 null로 설정
const client = config.CLAUDE_API_KEY && config.CLAUDE_API_KEY !== 'your-claude-api-key-here'
  ? new Anthropic({ apiKey: config.CLAUDE_API_KEY })
  : null;

interface CardInput {
  nameKo: string;
  nameEn: string;
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
