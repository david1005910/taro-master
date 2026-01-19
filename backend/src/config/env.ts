import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY!,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
};

// 필수 환경 변수 검증
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
