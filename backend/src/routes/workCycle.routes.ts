import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllWorkCycles,
  getWorkCycleById,
  createWorkCycle,
  updateWorkCycle,
  deleteWorkCycle,
  assignScheduleToCycle,
  removeScheduleFromCycle,
  getSchedulesByCycle,
} from '../controllers/workCycle.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

const createValidation = [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('cycleDays').isInt({ min: 1 }).withMessage('Le nombre de jours doit être positif'),
  body('weeklyHours').isFloat({ min: 0 }).withMessage('Les heures hebdomadaires doivent être positives'),
];

router.get('/', getAllWorkCycles);
router.get('/:id', getWorkCycleById);
router.get('/:cycleId/schedules', getSchedulesByCycle);
router.post('/', validate(createValidation), createWorkCycle);
router.post('/:cycleId/schedules', assignScheduleToCycle);
router.put('/:id', updateWorkCycle);
router.delete('/:id', deleteWorkCycle);
router.delete('/:cycleId/schedules/:scheduleId', removeScheduleFromCycle);

export default router;

