import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/interpret', aiController.interpret.bind(aiController));
router.post('/chat', aiController.chat.bind(aiController));

export default router;
