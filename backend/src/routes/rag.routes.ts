import { Router } from 'express';
import { ragController } from '../controllers/rag.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /api/rag/status — 공개
router.get('/status', (req, res) => ragController.status(req, res));

// POST /api/rag/index — 보호 (카드 인덱싱)
router.post('/index', authMiddleware, (req, res) => ragController.indexCards(req, res));

// POST /api/rag/search — 공개
router.post('/search', (req, res) => ragController.search(req, res));

export default router;
