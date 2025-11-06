import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTimeRangesByPeriod,
  createTimeRange,
  updateTimeRange,
  deleteTimeRange,
} from '../controllers/timeRange.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

const createValidation = [
  body('periodId').notEmpty().withMessage('L\'ID de la période est requis'),
  body('name').notEmpty().withMessage('Le nom de la plage est requis'),
  body('startTime').notEmpty().withMessage('L\'heure de début est requise'),
  body('endTime').notEmpty().withMessage('L\'heure de fin est requise'),
];

router.get('/period/:periodId', getTimeRangesByPeriod);
router.post('/', validate(createValidation), createTimeRange);
router.put('/:id', updateTimeRange);
router.delete('/:id', deleteTimeRange);

export default router;

