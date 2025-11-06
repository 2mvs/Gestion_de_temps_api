import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllAbsences,
  getAbsencesByEmployee,
  createAbsence,
  approveAbsence,
} from '../controllers/absence.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

const createValidation = [
  body('employeeId').isInt().withMessage('ID employé invalide'),
  body('startDate').isISO8601().withMessage('Date de début invalide'),
  body('endDate').isISO8601().withMessage('Date de fin invalide'),
  body('days').isFloat({ min: 0.5 }).withMessage('Le nombre de jours doit être au moins 0.5'),
];

router.get('/', getAllAbsences);
router.get('/employee/:employeeId', getAbsencesByEmployee);
router.post('/', validate(createValidation), createAbsence);
router.patch('/:id/approve', approveAbsence);

export default router;

