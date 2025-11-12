import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllOrganizationalUnits,
  getOrganizationalUnitTree,
  getRootOrganizationalUnits,
  getOrganizationalUnitById,
  getOrganizationalUnitChildren,
  createOrganizationalUnit,
  updateOrganizationalUnit,
  deleteOrganizationalUnit,
} from '../controllers/organizationalUnit.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

const createValidation = [
  body('code').notEmpty().withMessage('Le code est requis'),
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('managerId')
    .optional({ nullable: true })
    .custom((value) => value === null || value === '' || Number.isInteger(Number(value)))
    .withMessage('Manager invalide'),
];

const updateValidation = [
  body('code').notEmpty().withMessage('Le code est requis'),
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('managerId')
    .optional({ nullable: true })
    .custom((value) => value === null || value === '' || Number.isInteger(Number(value)))
    .withMessage('Manager invalide'),
];

router.get('/', getAllOrganizationalUnits);
router.get('/tree', getOrganizationalUnitTree);
router.get('/roots', getRootOrganizationalUnits);
router.get('/:id', getOrganizationalUnitById);
router.get('/:id/children', getOrganizationalUnitChildren);
router.post('/', authorize('ADMIN'), validate(createValidation), createOrganizationalUnit);
router.put('/:id', authorize('ADMIN'), validate(updateValidation), updateOrganizationalUnit);
router.delete('/:id', authorize('ADMIN'), deleteOrganizationalUnit);

export default router;

