import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/ai.service';
import { z } from 'zod';

const interpretSchema = z.object({
  spreadType: z.string(),
  question: z.string().optional(),
  cards: z.array(z.object({
    nameKo: z.string(),
    nameEn: z.string(),
    position: z.string(),
    positionDescription: z.string(),
    isReversed: z.boolean(),
    keywords: z.array(z.string())
  }))
});

// Rate limiting을 위한 간단한 in-memory 저장소
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
const RATE_LIMIT = 20; // 시간당 20회
const WINDOW_MS = 60 * 60 * 1000; // 1시간

export class AIController {
  async interpret(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      // Rate limiting 체크
      const now = Date.now();
      const userLimit = rateLimitStore.get(userId);

      if (userLimit) {
        if (now < userLimit.resetTime) {
          if (userLimit.count >= RATE_LIMIT) {
            return res.status(429).json({
              success: false,
              error: {
                code: 'AI_RATE_LIMIT',
                message: 'AI 해석 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.'
              }
            });
          }
          userLimit.count++;
        } else {
          rateLimitStore.set(userId, { count: 1, resetTime: now + WINDOW_MS });
        }
      } else {
        rateLimitStore.set(userId, { count: 1, resetTime: now + WINDOW_MS });
      }

      const validated = interpretSchema.parse(req.body);

      const result = await aiService.interpret({
        spreadType: validated.spreadType,
        question: validated.question,
        cards: validated.cards
      });

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
      next(error);
    }
  }
}

export const aiController = new AIController();
