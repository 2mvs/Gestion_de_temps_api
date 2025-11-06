import { Router } from 'express';
import {
  getAllAuditLogs,
  getAuditLogsByModel,
  getAuditLogsByUser,
} from '../controllers/auditLog.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/', getAllAuditLogs);
router.get('/model/:modelType/:modelId', getAuditLogsByModel);
router.get('/user/:userId', getAuditLogsByUser);

export default router;

