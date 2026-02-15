import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/ai.service';
import { readingService } from '../services/reading.service';
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

const chatSchema = z.object({
  readingId: z.string(),
  message: z.string().min(1).max(500),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
});

// Rate limiting을 위한 간단한 in-memory 저장소 (saju-ai와 공유)
export const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
export const RATE_LIMIT = 20; // 시간당 20회
export const WINDOW_MS = 60 * 60 * 1000; // 1시간

export function checkRateLimit(userId: string): { allowed: boolean } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (userLimit) {
    if (now < userLimit.resetTime) {
      if (userLimit.count >= RATE_LIMIT) {
        return { allowed: false };
      }
      userLimit.count++;
    } else {
      rateLimitStore.set(userId, { count: 1, resetTime: now + WINDOW_MS });
    }
  } else {
    rateLimitStore.set(userId, { count: 1, resetTime: now + WINDOW_MS });
  }

  return { allowed: true };
}

export class AIController {
  async interpret(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      // Rate limiting 체크
      const { allowed } = checkRateLimit(userId);
      if (!allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'AI_RATE_LIMIT',
            message: 'AI 해석 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.'
          }
        });
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

  async chat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const { allowed } = checkRateLimit(userId);
      if (!allowed) {
        return res.status(429).json({
          success: false,
          error: { code: 'AI_RATE_LIMIT', message: 'AI 요청 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.' }
        });
      }

      const validated = chatSchema.parse(req.body);

      // 리딩 데이터 로드
      const reading = await readingService.getReadingById(validated.readingId, userId);

      // 카드 정보 구성
      const cards = reading.cards.map((rc: any) => ({
        nameKo: rc.card.nameKo,
        nameEn: rc.card.nameEn,
        number: rc.card.number,
        suit: rc.card.suit,
        position: rc.positionName,
        positionDescription: rc.positionDescription,
        isReversed: rc.isReversed,
        keywords: rc.card.keywords as string[]
      }));

      const result = await aiService.chat({
        readingContext: {
          spreadType: reading.spreadName,
          question: reading.question ?? undefined,
          cards,
          existingInterpretation: reading.interpretation ?? undefined
        },
        message: validated.message,
        history: validated.history
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
        });
      }
      if (error.code === 'READING_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: { code: 'READING_NOT_FOUND', message: '리딩을 찾을 수 없습니다.' }
        });
      }
      next(error);
    }
  }
}

export const aiController = new AIController();
