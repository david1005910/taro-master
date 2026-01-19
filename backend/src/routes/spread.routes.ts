import { Router } from 'express';
import { spreadController } from '../controllers/spread.controller';

const router = Router();

router.get('/', spreadController.getSpreads.bind(spreadController));
router.get('/:id', spreadController.getSpreadById.bind(spreadController));

export default router;
