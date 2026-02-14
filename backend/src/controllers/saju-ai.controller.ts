import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { sajuAIService } from '../services/saju-ai.service';
import { sajuService } from '../services/saju.service';
import { checkRateLimit } from './ai.controller';
import { z } from 'zod';

const summarySchema = z.object({
  readingId: z.string().min(1, '리딩 ID가 필요합니다')
});

const askSchema = z.object({
  readingId: z.string().min(1, '리딩 ID가 필요합니다'),
  question: z.string().min(1, '질문을 입력해주세요').max(500, '질문은 500자 이내로 입력해주세요'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).max(10).default([])
});

function buildSajuContext(reading: any) {
  const adv = reading.advancedAnalysis;
  return {
    name: reading.name,
    gender: reading.gender,
    birthDate: new Date(reading.birthDate).toLocaleDateString('ko-KR'),
    birthTime: reading.birthTime || undefined,
    fourPillars: {
      yearStem: reading.yearStem,
      yearBranch: reading.yearBranch,
      monthStem: reading.monthStem,
      monthBranch: reading.monthBranch,
      dayStem: reading.dayStem,
      dayBranch: reading.dayBranch,
      hourStem: reading.hourStem || undefined,
      hourBranch: reading.hourBranch || undefined
    },
    elements: {
      wood: reading.woodCount,
      fire: reading.fireCount,
      earth: reading.earthCount,
      metal: reading.metalCount,
      water: reading.waterCount
    },
    strength: {
      level: adv?.strength?.level || '중화',
      isStrong: adv?.strength?.isStrong ?? true,
      yongshin: adv?.strength?.yongshin || '미정',
      yongshinElement: adv?.strength?.yongshinElement || '미정'
    },
    geokguk: {
      name: adv?.geokguk?.name || '미정',
      description: adv?.geokguk?.description || ''
    },
    tenGods: adv?.tenGods || {},
    spiritStars: adv?.spiritStars || []
  };
}

export class SajuAIController {
  async getSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const { allowed } = checkRateLimit(userId);
      if (!allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'AI_RATE_LIMIT',
            message: 'AI 요청 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.'
          }
        });
      }

      const validated = summarySchema.parse(req.body);

      const reading = await sajuService.getReadingById(validated.readingId, userId);
      const context = buildSajuContext(reading);
      const result = await sajuAIService.generateSummary(context);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0].message
          }
        });
      }
      if (error.message === '사주 리딩을 찾을 수 없습니다.') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        });
      }
      next(error);
    }
  }

  async askQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const { allowed } = checkRateLimit(userId);
      if (!allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'AI_RATE_LIMIT',
            message: 'AI 요청 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.'
          }
        });
      }

      const validated = askSchema.parse(req.body);

      const reading = await sajuService.getReadingById(validated.readingId, userId);
      const context = buildSajuContext(reading);
      const answer = await sajuAIService.answerQuestion(context, validated.question, validated.history);

      res.json({
        success: true,
        data: { answer }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0].message
          }
        });
      }
      if (error.message === '사주 리딩을 찾을 수 없습니다.') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        });
      }
      next(error);
    }
  }
}

export const sajuAIController = new SajuAIController();
