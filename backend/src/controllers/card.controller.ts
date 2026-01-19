import { Request, Response, NextFunction } from 'express';
import { cardService } from '../services/card.service';

export class CardController {
  async getCards(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, suit, search, page, limit } = req.query;

      const result = await cardService.getCards({
        type: type as string,
        suit: suit as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getCardById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const card = await cardService.getCardById(id);

      res.json({
        success: true,
        data: card
      });
    } catch (error) {
      next(error);
    }
  }

  async getMajorArcana(req: Request, res: Response, next: NextFunction) {
    try {
      const cards = await cardService.getMajorArcana();

      res.json({
        success: true,
        data: { cards }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMinorArcana(req: Request, res: Response, next: NextFunction) {
    try {
      const cards = await cardService.getMinorArcana();

      res.json({
        success: true,
        data: { cards }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCardsBySuit(req: Request, res: Response, next: NextFunction) {
    try {
      const { suit } = req.params;
      const cards = await cardService.getCardsBySuit(suit);

      res.json({
        success: true,
        data: { cards }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cardController = new CardController();
