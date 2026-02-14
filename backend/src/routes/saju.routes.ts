import { Router } from 'express';
import { sajuController } from '../controllers/saju.controller';
import { sajuAIController } from '../controllers/saju-ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 모든 사주 라우트는 인증 필요
router.use(authMiddleware);

// POST /api/saju - 사주 계산 및 저장
router.post('/', (req, res, next) => sajuController.createReading(req, res, next));

// AI 엔드포인트 (/:id 라우트보다 먼저 배치)
// POST /api/saju/ai/summary - AI 요약 생성
router.post('/ai/summary', (req, res, next) => sajuAIController.getSummary(req, res, next));

// POST /api/saju/ai/ask - AI Q&A
router.post('/ai/ask', (req, res, next) => sajuAIController.askQuestion(req, res, next));

// GET /api/saju - 사주 리딩 목록 조회
router.get('/', (req, res, next) => sajuController.getReadings(req, res, next));

// GET /api/saju/:id - 사주 리딩 상세 조회
router.get('/:id', (req, res, next) => sajuController.getReadingById(req, res, next));

// DELETE /api/saju/:id - 사주 리딩 삭제
router.delete('/:id', (req, res, next) => sajuController.deleteReading(req, res, next));

export default router;
