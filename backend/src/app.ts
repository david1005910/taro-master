import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import routes from './routes';

const app = express();

// 미들웨어
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// 라우트
app.use('/api', routes);

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 에러 핸들러
app.use(errorHandler);

export default app;
