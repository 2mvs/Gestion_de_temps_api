import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler, notFound } from './middlewares/error.middleware';
import routes from './routes';

const app: Application = express();

// Middlewares globaux
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Augmenter la limite pour l'import CSV d'employés
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Routes principales
app.use('/api', routes);

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'API Backend GTA - Système de gestion des temps et activités',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      employees: '/api/employees',
      workCycles: '/api/work-cycles',
      schedules: '/api/schedules',
      timeEntries: '/api/time-entries',
      absences: '/api/absences',
      overtimes: '/api/overtimes',
      specialHours: '/api/special-hours',
      organizationalUnits: '/api/organizational-units',
      notifications: '/api/notifications',
      auditLogs: '/api/audit-logs',
      reports: '/api/reports',
    },
  });
});

// Gestion des erreurs
app.use(notFound);
app.use(errorHandler);

export default app;

