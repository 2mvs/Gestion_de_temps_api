import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllWorkCycles,
  getWorkCycleById,
  createWorkCycle,
  updateWorkCycle,
  deleteWorkCycle,
} from '../controllers/workCycle.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

const createValidation = [
  body('label').notEmpty().withMessage('Le libellé est requis'),
  body('scheduleId').isInt().withMessage('Un horaire valide est requis'),
];

router.get('/', getAllWorkCycles);
router.get('/:id', getWorkCycleById);
router.post('/', validate(createValidation), createWorkCycle);
router.put('/:id', updateWorkCycle);
router.delete('/:id', deleteWorkCycle);

export default router;

