import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/me', userController.getProfile.bind(userController));
router.put('/me', userController.updateProfile.bind(userController));
router.put('/me/password', userController.changePassword.bind(userController));
router.get('/me/stats', userController.getStats.bind(userController));
router.delete('/me', userController.deleteAccount.bind(userController));

export default router;
