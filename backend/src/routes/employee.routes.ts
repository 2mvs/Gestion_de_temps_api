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
  linkEmployeeAccount,
} from '../controllers/employee.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
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

const linkAccountValidation = [
  body('email').isEmail().withMessage('Un email valide est requis'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'USER'])
    .withMessage('Rôle utilisateur invalide'),
];

// Routes
router.get('/', getAllEmployees);
router.get('/:id/payslip', getEmployeePayslip);
router.get('/:id', getEmployeeById);
router.post('/', authorize('ADMIN'), validate(createValidation), createEmployee);
router.put('/:id', authorize('ADMIN'), validate(updateValidation), updateEmployee);
router.delete('/:id', authorize('ADMIN'), deleteEmployee);
router.post('/bulk', authorize('ADMIN'), bulkImportEmployees);
router.post('/:id/link-account', authorize('ADMIN'), validate(linkAccountValidation), linkEmployeeAccount);

export default router;

