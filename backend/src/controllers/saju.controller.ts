import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { sajuService } from '../services/saju.service';
import { z } from 'zod';

const createSajuSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '생년월일 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, '생시 형식이 올바르지 않습니다 (HH:mm)').optional(),
  isLunar: z.boolean().optional().default(false),
  gender: z.enum(['male', 'female', 'unknown']).optional().default('unknown')
});

export class SajuController {
  // 사주 계산 및 저장
  async createReading(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validated = createSajuSchema.parse(req.body);
      const userId = req.user!.userId;

      const result = await sajuService.calculateAndSave({
        userId,
        name: validated.name,
        birthDate: new Date(validated.birthDate),
        birthTime: validated.birthTime,
        isLunar: validated.isLunar,
        gender: validated.gender
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

  // 사주 리딩 목록 조회
  async getReadings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { page, limit } = req.query;

      const result = await sajuService.getReadings(
        userId,
        page ? parseInt(page as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // 사주 리딩 상세 조회
  async getReadingById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const result = await sajuService.getReadingById(id, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
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

  // 사주 리딩 삭제
  async deleteReading(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const result = await sajuService.deleteReading(id, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
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

export const sajuController = new SajuController();
