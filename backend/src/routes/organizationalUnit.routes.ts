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
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

const createValidation = [
  body('code').notEmpty().withMessage('Le code est requis'),
  body('name').notEmpty().withMessage('Le nom est requis'),
];

router.get('/', getAllOrganizationalUnits);
router.get('/tree', getOrganizationalUnitTree);
router.get('/roots', getRootOrganizationalUnits);
router.get('/:id', getOrganizationalUnitById);
router.get('/:id/children', getOrganizationalUnitChildren);
router.post('/', validate(createValidation), createOrganizationalUnit);
router.put('/:id', validate(createValidation), updateOrganizationalUnit);
router.delete('/:id', deleteOrganizationalUnit);

export default router;

