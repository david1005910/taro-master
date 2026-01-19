import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { readingService } from '../services/reading.service';
import { aiService } from '../services/ai.service';
import { cardService } from '../services/card.service';
import { spreadService } from '../services/spread.service';
import { z } from 'zod';

const createReadingSchema = z.object({
  spreadId: z.number(),
  question: z.string().optional(),
  interpretMode: z.enum(['TRADITIONAL', 'AI']),
  cards: z.array(z.object({
    cardId: z.number(),
    position: z.number(),
    isReversed: z.boolean()
  }))
});

export class ReadingController {
  async createReading(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validated = createReadingSchema.parse(req.body);
      const userId = req.user!.userId;

      let interpretation: string | undefined;
      let cardInterpretations: Array<{ position: number; interpretation: string }> | undefined;

      // AI 모드인 경우 AI 해석 요청
      if (validated.interpretMode === 'AI') {
        const spread = await spreadService.getSpreadById(validated.spreadId);
        const positions = spread.positions as Array<{ name: string; description: string }>;

        const cardsWithDetails = await Promise.all(
          validated.cards.map(async (c) => {
            const card = await cardService.getCardById(c.cardId);
            const pos = positions[c.position];
            return {
              nameKo: card.nameKo,
              nameEn: card.nameEn,
              position: pos.name,
              positionDescription: pos.description,
              isReversed: c.isReversed,
              keywords: card.keywords as string[]
            };
          })
        );

        const aiResult = await aiService.interpret({
          spreadType: spread.name,
          question: validated.question,
          cards: cardsWithDetails
        });

        interpretation = aiResult.overallInterpretation + '\n\n' + aiResult.advice;
        cardInterpretations = aiResult.cardInterpretations.map((ci, idx) => ({
          position: idx,
          interpretation: ci.interpretation
        }));
      }

      const result = await readingService.createReading({
        userId,
        spreadId: validated.spreadId,
        question: validated.question,
        interpretMode: validated.interpretMode,
        cards: validated.cards,
        interpretation,
        cardInterpretations
      });

      res.status(201).json({
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

  async getReadings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { page, limit, startDate, endDate } = req.query;

      const result = await readingService.getReadings({
        userId,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        startDate: startDate as string,
        endDate: endDate as string
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getReadingById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const result = await readingService.getReadingById(id, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReading(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { note, tags } = req.body;

      const result = await readingService.updateReading(id, userId, note, tags);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReading(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const result = await readingService.deleteReading(id, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getDailyCard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await readingService.getDailyCard(userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export const readingController = new ReadingController();
