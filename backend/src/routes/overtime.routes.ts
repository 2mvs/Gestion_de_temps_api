import { Router } from 'express';
import { body } from 'express-validator';
import {
  getOvertimesByEmployee,
  createOvertime,
  approveOvertime,
  getAllOvertimes,
} from '../controllers/overtime.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

const createValidation = [
  body('employeeId').isInt().withMessage('ID employé invalide'),
  body('date').isISO8601().withMessage('Date invalide'),
  body('hours').isFloat({ min: 0.5 }).withMessage('Le nombre d\'heures doit être au moins 0.5'),
];

router.get('/', authorize('ADMINISTRATEUR'), getAllOvertimes);
router.get('/employee/:employeeId', getOvertimesByEmployee);
router.post('/', validate(createValidation), createOvertime);
router.patch('/:id/approve', approveOvertime);

export default router;

