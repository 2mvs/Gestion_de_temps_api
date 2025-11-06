import { Router } from 'express';
import {
  getGeneralReport,
  getEmployeesReport,
  getMonthlyReport,
  getAttendanceReport,
  getOvertimeSummary,
  exportReport,
} from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/general', getGeneralReport);
router.get('/employees', getEmployeesReport);
router.get('/monthly', getMonthlyReport);
router.get('/attendance', getAttendanceReport);
router.get('/overtime-summary', getOvertimeSummary);
router.get('/export/:type', exportReport);

export default router;

