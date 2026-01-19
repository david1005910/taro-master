import { Request, Response, NextFunction } from 'express';
import { spreadService } from '../services/spread.service';

export class SpreadController {
  async getSpreads(req: Request, res: Response, next: NextFunction) {
    try {
      const spreads = await spreadService.getSpreads();

      res.json({
        success: true,
        data: { spreads }
      });
    } catch (error) {
      next(error);
    }
  }

  async getSpreadById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const spread = await spreadService.getSpreadById(id);

      res.json({
        success: true,
        data: spread
      });
    } catch (error) {
      next(error);
    }
  }
}

export const spreadController = new SpreadController();
