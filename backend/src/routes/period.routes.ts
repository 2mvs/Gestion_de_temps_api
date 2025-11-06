import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPeriodsBySchedule,
  createPeriod,
  updatePeriod,
  deletePeriod,
} from '../controllers/period.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

const createValidation = [
  body('scheduleId').notEmpty().withMessage('L\'ID de l\'horaire est requis'),
  body('name').notEmpty().withMessage('Le nom de la période est requis'),
  body('startTime').notEmpty().withMessage('L\'heure de début est requise'),
  body('endTime').notEmpty().withMessage('L\'heure de fin est requise'),
];

router.get('/schedule/:scheduleId', getPeriodsBySchedule);
router.post('/', validate(createValidation), createPeriod);
router.put('/:id', updatePeriod);
router.delete('/:id', deletePeriod);

export default router;

