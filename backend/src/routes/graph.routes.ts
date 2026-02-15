import { Router } from 'express';
import { graphController } from '../controllers/graph.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 공개 엔드포인트
router.get('/status', graphController.getStatus.bind(graphController));
router.get('/card/:id/relationships', graphController.getCardRelationships.bind(graphController));

// 인증 필요
router.get('/user/patterns', authMiddleware, graphController.getUserPatterns.bind(graphController));

export default router;
