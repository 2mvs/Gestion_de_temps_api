import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllSchedules,
  getSchedulesByEmployee,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../controllers/schedule.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

const createValidation = [
  body('label').notEmpty().withMessage('Le libellé est requis'),
];

router.get('/', getAllSchedules);
router.get('/employee/:employeeId', getSchedulesByEmployee);
router.post('/', validate(createValidation), createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;

