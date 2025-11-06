import { Router } from 'express';
import authRoutes from './auth.routes';
import employeeRoutes from './employee.routes';
import workCycleRoutes from './workCycle.routes';
import scheduleRoutes from './schedule.routes';
import periodRoutes from './period.routes';
import timeRangeRoutes from './timeRange.routes';
import timeEntryRoutes from './timeEntry.routes';
import absenceRoutes from './absence.routes';
import overtimeRoutes from './overtime.routes';
import specialHourRoutes from './specialHour.routes';
import organizationalUnitRoutes from './organizationalUnit.routes';
import notificationRoutes from './notification.routes';
import auditLogRoutes from './auditLog.routes';
import reportRoutes from './report.routes';

const router = Router();

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes des employés
router.use('/employees', employeeRoutes);

// Routes des cycles de travail et horaires
router.use('/work-cycles', workCycleRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/periods', periodRoutes);
router.use('/time-ranges', timeRangeRoutes);

// Routes des pointages
router.use('/time-entries', timeEntryRoutes);

// Routes des absences, heures supplémentaires et heures spéciales
router.use('/absences', absenceRoutes);
router.use('/overtimes', overtimeRoutes);
router.use('/special-hours', specialHourRoutes);

// Routes des unités organisationnelles
router.use('/organizational-units', organizationalUnitRoutes);

// Routes des notifications
router.use('/notifications', notificationRoutes);

// Routes des logs d'audit
router.use('/audit-logs', auditLogRoutes);

// Routes des rapports
router.use('/reports', reportRoutes);

// Route de santé
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;

