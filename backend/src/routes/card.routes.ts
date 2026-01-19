import { Router } from 'express';
import { cardController } from '../controllers/card.controller';

const router = Router();

router.get('/', cardController.getCards.bind(cardController));
router.get('/major', cardController.getMajorArcana.bind(cardController));
router.get('/minor', cardController.getMinorArcana.bind(cardController));
router.get('/suit/:suit', cardController.getCardsBySuit.bind(cardController));
router.get('/:id', cardController.getCardById.bind(cardController));

export default router;
