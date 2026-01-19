import { Router } from 'express';
import { readingController } from '../controllers/reading.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', readingController.createReading.bind(readingController));
router.get('/', readingController.getReadings.bind(readingController));
router.get('/daily', readingController.getDailyCard.bind(readingController));
router.get('/:id', readingController.getReadingById.bind(readingController));
router.put('/:id', readingController.updateReading.bind(readingController));
router.delete('/:id', readingController.deleteReading.bind(readingController));

export default router;
