import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { neo4jGraphService } from '../services/neo4j.service';

export class GraphController {
  async getStatus(_req: Request, res: Response, next: NextFunction) {
    try {
      const status = await neo4jGraphService.getStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }

  async getCardRelationships(req: Request, res: Response, next: NextFunction) {
    try {
      const cardId = parseInt(req.params.id, 10);
      if (isNaN(cardId)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: '유효하지 않은 카드 ID입니다.' }
        });
      }

      if (!neo4jGraphService.isReady()) {
        return res.json({
          success: true,
          data: null,
          message: 'Neo4j 그래프 서비스가 비활성화 상태입니다.'
        });
      }

      const relationships = await neo4jGraphService.getCardRelationships(cardId);
      if (!relationships) {
        return res.status(404).json({
          success: false,
          error: { code: 'CARD_NOT_FOUND', message: '카드를 찾을 수 없습니다.' }
        });
      }

      res.json({ success: true, data: relationships });
    } catch (error) {
      next(error);
    }
  }

  async getUserPatterns(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      if (!neo4jGraphService.isReady()) {
        return res.json({
          success: true,
          data: null,
          message: 'Neo4j 그래프 서비스가 비활성화 상태입니다.'
        });
      }

      const patterns = await neo4jGraphService.getUserPatterns(userId);
      res.json({ success: true, data: patterns });
    } catch (error) {
      next(error);
    }
  }
}

export const graphController = new GraphController();
