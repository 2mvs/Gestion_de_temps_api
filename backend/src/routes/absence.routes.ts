import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllAbsences,
  getAbsencesByEmployee,
  createAbsence,
  updateAbsence,
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

const updateValidation = [
  body('employeeId').optional().isInt().withMessage('ID employé invalide'),
  body('absenceType').optional().isString().withMessage('Type d\'absence invalide'),
  body('startDate').optional().isISO8601().withMessage('Date de début invalide'),
  body('endDate').optional().isISO8601().withMessage('Date de fin invalide'),
  body('days').optional().isFloat({ min: 0.5 }).withMessage('Le nombre de jours doit être au moins 0.5'),
  body('reason').optional().isString().withMessage('La raison doit être une chaîne de caractères'),
];

router.get('/', getAllAbsences);
router.get('/employee/:employeeId', getAbsencesByEmployee);
router.post('/', validate(createValidation), createAbsence);
router.put('/:id', validate(updateValidation), updateAbsence);
router.patch('/:id/approve', approveAbsence);

export default router;

