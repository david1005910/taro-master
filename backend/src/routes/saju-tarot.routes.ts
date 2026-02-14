import { Router } from 'express';
import { sajuTarotController } from '../controllers/saju-tarot.controller';

const router = Router();

// Neo4j + RAG 연결 상태 확인
router.get('/status', sajuTarotController.getStatus);

// 사주 기반 추천 타로 카드
router.post('/recommend', sajuTarotController.getRecommendedCards);

// 오행 분석
router.post('/analyze-elements', sajuTarotController.analyzeElements);

// 특정 타로 카드와 사주 관계 조회
router.get('/card/:suit/:number', sajuTarotController.getCardRelations);

// 사주-타로 종합 리딩
router.post('/combined-reading', sajuTarotController.getCombinedReading);

// 사주 그래프 종합 인사이트 (천간합/지지충/삼합/육합 + 멀티홉 카드 추천)
router.post('/graph-insight', sajuTarotController.getGraphInsight);

// Graph + RAG 하이브리드 검색
router.post('/hybrid-search', sajuTarotController.hybridSearch);

// 뽑힌 타로 카드 집합 그래프 분석 (카드 간 관계: 상생/상극/연속/동일오행)
router.post('/reading-analysis', sajuTarotController.readingAnalysis);

export default router;
