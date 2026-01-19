import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { progressService } from '../services/progress.service';

export class ProgressController {
  async getProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await progressService.getProgress(userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cardId = parseInt(req.params.cardId);
      const { isLearned, note } = req.body;

      const result = await progressService.updateProgress(userId, cardId, isLearned, note);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleFavorite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cardId = parseInt(req.params.cardId);

      const result = await progressService.toggleFavorite(userId, cardId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getFavorites(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await progressService.getFavorites(userId);

      res.json({
        success: true,
        data: { favorites: result }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const progressController = new ProgressController();
