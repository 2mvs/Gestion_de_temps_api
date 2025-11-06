import { Request, Response } from 'express';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';
import {
  calculateHoursWorked,
  autoCreateOvertimeAndSpecialHours,
} from '../utils/overtimeCalculator';

export const getTimeEntriesByEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, includeCalculations } = req.query;

    const where: any = {
      employeeId: parseInt(employeeId),
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.json({ data: timeEntries });
  } catch (error) {
    throw error;
  }
};

export const clockIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { clockInTime } = req.body;

    const now = clockInTime ? new Date(clockInTime) : new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Validation : Ne pas permettre de pointer dans le futur (N+1)
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (today > currentDate) {
      throw new CustomError('Impossible de pointer pour une date future', 400);
    }
    
    // Optionnel : Limiter les pointages trop anciens (ex: max 30 jours)
    const thirtyDaysAgo = new Date(currentDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (today < thirtyDaysAgo) {
      throw new CustomError('Impossible de pointer pour une date de plus de 30 jours', 400);
    }

    // Vérifier si un pointage existe déjà pour aujourd'hui
    const existingEntry = await prisma.timeEntry.findUnique({
      where: {
        employeeId_date: {
          employeeId: parseInt(employeeId),
          date: today,
        },
      },
    });

    if (existingEntry && existingEntry.clockIn) {
      throw new CustomError('Un pointage d\'entrée existe déjà pour aujourd\'hui', 400);
    }

    let timeEntry;
    if (existingEntry) {
      // Mettre à jour l'entrée existante
      timeEntry = await prisma.timeEntry.update({
        where: { id: existingEntry.id },
        data: {
          clockIn: now,
        },
      });
    } else {
      // Créer une nouvelle entrée
      timeEntry = await prisma.timeEntry.create({
        data: {
          employeeId: parseInt(employeeId),
          date: today,
          clockIn: now,
          status: 'PENDING',
        },
      });
    }

    await createAuditLog({
      userId: req.user!.userId,
      action: 'CLOCK_IN',
      modelType: 'TimeEntry',
      modelId: timeEntry.id,
      newValue: timeEntry,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Pointage d\'entrée enregistré',
      data: timeEntry,
    });
  } catch (error) {
    throw error;
  }
};

export const clockOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { clockOutTime } = req.body;

    const now = clockOutTime ? new Date(clockOutTime) : new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Validation : Ne pas permettre de pointer dans le futur (N+1)
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (today > currentDate) {
      throw new CustomError('Impossible de pointer pour une date future', 400);
    }

    // Trouver le pointage d'aujourd'hui
    const timeEntry = await prisma.timeEntry.findUnique({
      where: {
        employeeId_date: {
          employeeId: parseInt(employeeId),
          date: today,
        },
      },
    });

    if (!timeEntry) {
      throw new CustomError('Aucun pointage d\'entrée trouvé pour aujourd\'hui', 404);
    }

    if (!timeEntry.clockIn) {
      throw new CustomError('Vous devez d\'abord pointer l\'entrée', 400);
    }

    if (timeEntry.clockOut) {
      throw new CustomError('Pointage de sortie déjà enregistré', 400);
    }

    // Calculer le total d'heures
    const clockInTime = new Date(timeEntry.clockIn).getTime();
    const clockOutTimeMs = now.getTime();
    const totalHours = (clockOutTimeMs - clockInTime) / (1000 * 60 * 60);

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        clockOut: now,
        totalHours: Math.round(totalHours * 100) / 100,
        status: 'COMPLETED',
      },
    });

    // CALCUL AUTOMATIQUE DES HEURES SUP/SPÉCIALES
    try {
      const calculatedHours = await calculateHoursWorked({
        employeeId: parseInt(employeeId),
        clockInTime: timeEntry.clockIn,
        clockOutTime: now,
        date: today,
      });

      // Créer automatiquement les enregistrements d'heures sup/spéciales
      await autoCreateOvertimeAndSpecialHours(
        {
          employeeId: parseInt(employeeId),
          clockInTime: timeEntry.clockIn,
          clockOutTime: now,
          date: today,
        },
        calculatedHours
      );

      // Mettre à jour le timeEntry avec les détails du calcul
      await prisma.timeEntry.update({
        where: { id: updatedEntry.id },
        data: {
          validationErrors: JSON.stringify({
            calculatedHours: {
              normal: calculatedHours.normalHours,
              overtime: calculatedHours.overtimeHours,
              special: calculatedHours.specialHours,
              breakdown: calculatedHours.breakdown,
            },
          }),
        },
      });
    } catch (calcError: any) {
      // Ne pas bloquer le pointage si le calcul échoue
      console.error('Erreur lors du calcul automatique:', calcError);
    }

    await createAuditLog({
      userId: req.user!.userId,
      action: 'CLOCK_OUT',
      modelType: 'TimeEntry',
      modelId: updatedEntry.id,
      oldValue: timeEntry,
      newValue: updatedEntry,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Pointage de sortie enregistré',
      data: updatedEntry,
    });
  } catch (error) {
    throw error;
  }
};

export const getBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new CustomError('Les dates de début et de fin sont requises', 400);
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: parseInt(employeeId),
        date: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
        status: 'COMPLETED',
      },
    });

    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
    const daysWorked = timeEntries.length;

    // Récupérer le cycle de travail de l'employé
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      include: {
        workCycle: true,
      },
    });

    const expectedWeeklyHours = employee?.workCycle?.weeklyHours || 40;
    const weeks = Math.ceil(
      (new Date(endDate as string).getTime() - new Date(startDate as string).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    );
    const expectedHours = expectedWeeklyHours * weeks;
    const balance = totalHours - expectedHours;

    res.json({
      data: {
        totalHours: Math.round(totalHours * 100) / 100,
        expectedHours: Math.round(expectedHours * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        daysWorked,
        period: {
          startDate,
          endDate,
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

export const validateTimeEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { autoCorrect } = req.query;

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: parseInt(id) },
    });

    if (!timeEntry) {
      throw new CustomError('Pointage non trouvé', 404);
    }

    const errors: string[] = [];

    // Validation 1: Vérifier qu'il y a une entrée et une sortie
    if (!timeEntry.clockIn) {
      errors.push('Pointage d\'entrée manquant');
    }
    if (!timeEntry.clockOut) {
      errors.push('Pointage de sortie manquant');
    }

    // Validation 2: Vérifier que la sortie est après l'entrée
    if (timeEntry.clockIn && timeEntry.clockOut) {
      if (new Date(timeEntry.clockOut) <= new Date(timeEntry.clockIn)) {
        errors.push('L\'heure de sortie doit être après l\'heure d\'entrée');
      }
    }

    // Validation 3: Vérifier que les heures sont raisonnables (< 24h)
    if (timeEntry.totalHours && timeEntry.totalHours > 24) {
      errors.push('Le total d\'heures dépasse 24h');
    }

    const isValid = errors.length === 0;

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: parseInt(id) },
      data: {
        isValidated: isValid,
        validatedAt: isValid ? new Date() : null,
        validationErrors: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    });

    res.json({
      data: {
        ...updatedEntry,
        validationErrors: errors,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const validatePeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, autoCorrect } = req.body;

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: parseInt(employeeId),
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    const results = [];
    for (const entry of timeEntries) {
      const errors: string[] = [];

      if (!entry.clockIn) errors.push('Pointage d\'entrée manquant');
      if (!entry.clockOut) errors.push('Pointage de sortie manquant');
      
      if (entry.clockIn && entry.clockOut && new Date(entry.clockOut) <= new Date(entry.clockIn)) {
        errors.push('L\'heure de sortie doit être après l\'heure d\'entrée');
      }

      if (entry.totalHours && entry.totalHours > 24) {
        errors.push('Le total d\'heures dépasse 24h');
      }

      const isValid = errors.length === 0;

      const updated = await prisma.timeEntry.update({
        where: { id: entry.id },
        data: {
          isValidated: isValid,
          validatedAt: isValid ? new Date() : null,
          validationErrors: errors.length > 0 ? JSON.stringify(errors) : null,
        },
      });

      results.push({
        id: updated.id,
        date: updated.date,
        isValid,
        errors,
      });
    }

    res.json({ data: results });
  } catch (error) {
    throw error;
  }
};

export const getValidationStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: parseInt(employeeId),
        date: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      },
    });

    const total = timeEntries.length;
    const validated = timeEntries.filter(e => e.isValidated).length;
    const withErrors = timeEntries.filter(e => e.validationErrors).length;
    const pending = timeEntries.filter(e => !e.isValidated && !e.validationErrors).length;

    res.json({
      data: {
        total,
        validated,
        withErrors,
        pending,
        validationRate: total > 0 ? Math.round((validated / total) * 100) : 0,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getValidationRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const rules = [
      {
        id: 1,
        name: 'Pointage d\'entrée obligatoire',
        description: 'Chaque journée travaillée doit avoir un pointage d\'entrée',
        severity: 'error',
      },
      {
        id: 2,
        name: 'Pointage de sortie obligatoire',
        description: 'Chaque journée travaillée doit avoir un pointage de sortie',
        severity: 'error',
      },
      {
        id: 3,
        name: 'Ordre chronologique',
        description: 'L\'heure de sortie doit être postérieure à l\'heure d\'entrée',
        severity: 'error',
      },
      {
        id: 4,
        name: 'Limite de 24 heures',
        description: 'Le total d\'heures par jour ne peut pas dépasser 24 heures',
        severity: 'warning',
      },
    ];

    res.json({ data: rules });
  } catch (error) {
    throw error;
  }
};

