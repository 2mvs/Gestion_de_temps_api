import { Router } from 'express';
import {
  getTimeEntriesByEmployee,
  clockIn,
  clockOut,
  getBalance,
  validateTimeEntry,
  validatePeriod,
  getValidationStats,
  getValidationRules,
} from '../controllers/timeEntry.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/employee/:employeeId', getTimeEntriesByEmployee);
router.post('/:employeeId/clock-in', clockIn);
router.post('/:employeeId/clock-out', clockOut);
router.get('/employee/:employeeId/balance', getBalance);
router.post('/:id/validate', validateTimeEntry);
router.post('/employee/:employeeId/validate-period', validatePeriod);
router.get('/employee/:employeeId/validation-stats', getValidationStats);
router.get('/validation-rules', getValidationRules);

export default router;

