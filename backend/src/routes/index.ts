import { Router } from 'express';
import authRoutes from './auth.routes';
import cardRoutes from './card.routes';
import spreadRoutes from './spread.routes';
import readingRoutes from './reading.routes';
import aiRoutes from './ai.routes';
import progressRoutes from './progress.routes';
import userRoutes from './user.routes';
import ragRoutes from './rag.routes';
import graphRoutes from './graph.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cards', cardRoutes);
router.use('/spreads', spreadRoutes);
router.use('/readings', readingRoutes);
router.use('/ai', aiRoutes);
router.use('/progress', progressRoutes);
router.use('/users', userRoutes);
router.use('/rag', ragRoutes);
router.use('/graph', graphRoutes);

export default router;
