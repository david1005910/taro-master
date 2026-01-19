import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { userService } from '../services/user.service';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
  newPassword: z.string()
    .min(8, '새 비밀번호는 최소 8자 이상이어야 합니다.')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/, '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.')
});

export class UserController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await userService.getProfile(userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { nickname, profileImage } = req.body;

      const result = await userService.updateProfile(userId, nickname, profileImage);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const validated = changePasswordSchema.parse(req.body);

      const result = await userService.changePassword(
        userId,
        validated.currentPassword,
        validated.newPassword
      );

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

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await userService.getStats(userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await userService.deleteAccount(userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
