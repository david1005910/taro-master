import { Router } from 'express';
import { sajuTarotController } from '../controllers/saju-tarot.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 모든 라우트에 인증 미들웨어 적용 (선택적으로 제거 가능)
// router.use(authMiddleware);

// Neo4j 연결 상태 확인
router.get('/status', sajuTarotController.getStatus);

// 사주 기반 추천 타로 카드
router.post('/recommend', sajuTarotController.getRecommendedCards);

// 오행 분석
router.post('/analyze-elements', sajuTarotController.analyzeElements);

// 특정 타로 카드와 사주 관계 조회
router.get('/card/:suit/:number', sajuTarotController.getCardRelations);

// 사주-타로 종합 리딩
router.post('/combined-reading', sajuTarotController.getCombinedReading);

export default router;
