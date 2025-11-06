import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllEmployees,
  getEmployeeById,
  getEmployeePayslip,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  bulkImportEmployees,
} from '../controllers/employee.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Validation pour la création
const createValidation = [
  body('employeeNumber').notEmpty().withMessage('Le numéro d\'employé est requis'),
  body('firstName').notEmpty().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().withMessage('Le nom est requis'),
  body('hireDate').isISO8601().withMessage('Date d\'embauche invalide'),
];

// Validation pour la mise à jour
const updateValidation = [
  body('firstName').optional().notEmpty().withMessage('Le prénom ne peut pas être vide'),
  body('lastName').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
];

// Routes
router.get('/', getAllEmployees);
router.get('/:id/payslip', getEmployeePayslip);
router.get('/:id', getEmployeeById);
router.post('/', validate(createValidation), createEmployee);
router.put('/:id', validate(updateValidation), updateEmployee);
router.delete('/:id', deleteEmployee);
router.post('/bulk', bulkImportEmployees);

export default router;

