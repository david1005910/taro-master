import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env';

const client = config.CLAUDE_API_KEY && config.CLAUDE_API_KEY !== 'your-claude-api-key-here'
  ? new Anthropic({ apiKey: config.CLAUDE_API_KEY })
  : null;

interface SajuContext {
  name: string;
  gender: string;
  birthDate: string;
  birthTime?: string;
  fourPillars: {
    yearStem: string;
    yearBranch: string;
    monthStem: string;
    monthBranch: string;
    dayStem: string;
    dayBranch: string;
    hourStem?: string;
    hourBranch?: string;
  };
  elements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  strength: {
    level: string;
    isStrong: boolean;
    yongshin: string;
    yongshinElement: string;
  };
  geokguk: {
    name: string;
    description: string;
  };
  tenGods: Record<string, string>;
  spiritStars: Array<{ name: string; description: string }>;
}

interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  luckyElements: {
    element: string;
    reason: string;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class SajuAIService {
  private systemPrompt = `당신은 40년 경력의 사주명리학 대가입니다.
전통 동양 철학과 음양오행에 대한 깊은 이해를 바탕으로
정확하고 통찰력 있는 사주 해석을 제공합니다.

해석 원칙:
1. 사주팔자의 음양오행 균형을 기반으로 분석
2. 일간(日干)을 중심으로 각 기둥의 관계를 종합
3. 용신(用神)과 격국(格局)을 고려한 실질적 조언
4. 긍정적이고 건설적인 관점 유지
5. 한국어로 자연스럽게 응답
6. 전문 용어는 쉬운 설명을 병행`;

  async generateSummary(context: SajuContext): Promise<SummaryResponse> {
    if (!client) {
      throw {
        status: 503,
        code: 'AI_SERVICE_NOT_CONFIGURED',
        message: 'AI 서비스가 설정되지 않았습니다.'
      };
    }

    const userPrompt = this.buildSummaryPrompt(context);

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: this.systemPrompt + `\n\n응답 형식:
반드시 아래 JSON 형식으로만 응답하세요:
{
  "summary": "사주 핵심 요약 (3-5문장, 200-300자)",
  "keyPoints": ["핵심 포인트1", "핵심 포인트2", "핵심 포인트3"],
  "luckyElements": {
    "element": "용신 기반 행운의 오행",
    "reason": "해당 오행이 행운인 이유 (1-2문장)"
  }
}`,
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

      return JSON.parse(jsonMatch[0]) as SummaryResponse;
    } catch (error: any) {
      console.error('[Saju AI Service] Summary Error:', error.message || error);
      if (error.status === 401) {
        throw { status: 503, code: 'AI_SERVICE_AUTH_ERROR', message: 'AI API 인증에 실패했습니다.' };
      }
      if (error.status === 429) {
        throw { status: 503, code: 'AI_SERVICE_RATE_LIMIT', message: 'AI 서비스 요청 한도를 초과했습니다.' };
      }
      if (error.code === 'AI_SERVICE_NOT_CONFIGURED') {
        throw error;
      }
      throw { status: 500, code: 'AI_SUMMARY_FAILED', message: 'AI 요약 생성에 실패했습니다.' };
    }
  }

  async answerQuestion(
    context: SajuContext,
    question: string,
    history: ChatMessage[]
  ): Promise<string> {
    if (!client) {
      throw {
        status: 503,
        code: 'AI_SERVICE_NOT_CONFIGURED',
        message: 'AI 서비스가 설정되지 않았습니다.'
      };
    }

    const contextPrompt = this.buildContextPrompt(context);

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: contextPrompt },
      { role: 'assistant', content: `네, ${context.name}님의 사주를 바탕으로 질문에 답변드리겠습니다.` },
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: question }
    ];

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: this.systemPrompt + '\n\n답변은 200-400자 이내로 간결하고 핵심적으로 작성하세요. JSON이 아닌 일반 텍스트로 응답하세요.',
        messages
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      return content.text;
    } catch (error: any) {
      console.error('[Saju AI Service] Q&A Error:', error.message || error);
      if (error.status === 401) {
        throw { status: 503, code: 'AI_SERVICE_AUTH_ERROR', message: 'AI API 인증에 실패했습니다.' };
      }
      if (error.status === 429) {
        throw { status: 503, code: 'AI_SERVICE_RATE_LIMIT', message: 'AI 서비스 요청 한도를 초과했습니다.' };
      }
      if (error.code === 'AI_SERVICE_NOT_CONFIGURED') {
        throw error;
      }
      throw { status: 500, code: 'AI_QA_FAILED', message: 'AI 답변 생성에 실패했습니다.' };
    }
  }

  private buildSummaryPrompt(context: SajuContext): string {
    const { fourPillars: fp, elements, strength, geokguk, tenGods, spiritStars } = context;
    const hourInfo = fp.hourStem ? `시주: ${fp.hourStem}${fp.hourBranch}` : '시주: 미입력';

    return `다음 사주 데이터를 분석하여 핵심 요약을 생성해주세요.

이름: ${context.name}
성별: ${context.gender === 'male' ? '남성' : context.gender === 'female' ? '여성' : '미지정'}
생년월일: ${context.birthDate}${context.birthTime ? ` ${context.birthTime}` : ''}

사주팔자:
년주: ${fp.yearStem}${fp.yearBranch} | 월주: ${fp.monthStem}${fp.monthBranch} | 일주: ${fp.dayStem}${fp.dayBranch} | ${hourInfo}

오행 분포: 목${elements.wood} 화${elements.fire} 토${elements.earth} 금${elements.metal} 수${elements.water}
신강/신약: ${strength.level} (${strength.isStrong ? '신강' : '신약'})
용신: ${strength.yongshin} (${strength.yongshinElement})
격국: ${geokguk.name} - ${geokguk.description}

십성: ${Object.entries(tenGods).map(([k, v]) => `${k}=${v}`).join(', ')}
신살: ${spiritStars.map(s => s.name).join(', ') || '없음'}`;
  }

  private buildContextPrompt(context: SajuContext): string {
    return this.buildSummaryPrompt(context).replace(
      '다음 사주 데이터를 분석하여 핵심 요약을 생성해주세요.',
      '다음은 사주 분석 대상자의 정보입니다. 이 데이터를 기반으로 질문에 답변해주세요.'
    );
  }
}

export const sajuAIService = new SajuAIService();
