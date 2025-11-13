import { Router } from 'express';
import { body } from 'express-validator';
import {
  getSpecialHoursByEmployee,
  createSpecialHour,
  approveSpecialHour,
  getAllSpecialHours,
} from '../controllers/specialHour.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

const createValidation = [
  body('employeeId').isInt().withMessage('ID employé invalide'),
  body('date').isISO8601().withMessage('Date invalide'),
  body('hours').isFloat({ min: 0.5 }).withMessage('Le nombre d\'heures doit être au moins 0.5'),
];

router.get('/', authorize('ADMINISTRATEUR'), getAllSpecialHours);
router.get('/employee/:employeeId', getSpecialHoursByEmployee);
router.post('/', validate(createValidation), createSpecialHour);
router.patch('/:id/approve', approveSpecialHour);

export default router;

