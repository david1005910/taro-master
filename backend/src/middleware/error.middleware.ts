import { Request, Response, NextFunction } from 'express';

interface AppError {
  status?: number;
  code?: string;
  message: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || '서버 내부 오류가 발생했습니다.';

  console.error(`[Error] ${code}: ${message}`);

  res.status(status).json({
    success: false,
    error: {
      code,
      message
    }
  });
};
