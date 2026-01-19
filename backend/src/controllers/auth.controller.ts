import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('유효한 이메일 형식이 아닙니다.'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/, '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.'),
  confirmPassword: z.string(),
  nickname: z.string().min(2, '닉네임은 최소 2자 이상이어야 합니다.').max(20, '닉네임은 최대 20자까지 가능합니다.')
}).refine(data => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword']
});

const loginSchema = z.object({
  email: z.string().email('유효한 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.')
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await authService.register(validated.email, validated.password, validated.nickname);

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

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await authService.login(validated.email, validated.password);

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

  async logout(req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        message: '로그아웃되었습니다.'
      }
    });
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token이 필요합니다.'
          }
        });
      }

      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
