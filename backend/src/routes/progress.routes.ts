import { Router } from 'express';
import { progressController } from '../controllers/progress.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', progressController.getProgress.bind(progressController));
router.get('/favorites', progressController.getFavorites.bind(progressController));
router.put('/:cardId', progressController.updateProgress.bind(progressController));
router.post('/:cardId/favorite', progressController.toggleFavorite.bind(progressController));

export default router;
