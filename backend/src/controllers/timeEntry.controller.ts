import { Request, Response } from 'express';
import { TimeEntryStatus } from '@prisma/client';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';
import { managerHasAccessToEmployee } from '../utils/access';
import {
  calculateHoursWorked,
  autoCreateOvertimeAndSpecialHours,
} from '../utils/overtimeCalculator';
import { isManagerRole, isAdminRole } from '../utils/roles';

const mapTimeEntryStatus = (value: string): TimeEntryStatus => {
  const normalized = value.toString().toUpperCase();
  const mapping: Record<string, TimeEntryStatus> = {
    EN_ATTENTE: TimeEntryStatus.EN_ATTENTE,
    PENDING: TimeEntryStatus.EN_ATTENTE,
    TERMINE: TimeEntryStatus.TERMINE,
    COMPLETED: TimeEntryStatus.TERMINE,
    INCOMPLET: TimeEntryStatus.INCOMPLET,
    INCOMPLETE: TimeEntryStatus.INCOMPLET,
    ABSENT: TimeEntryStatus.ABSENT,
  };
  const mapped = mapping[normalized];
  if (!mapped) {
    throw new CustomError('Statut invalide', 400);
  }
  return mapped;
};

export const getTimeEntriesByEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }

    const { employeeId } = req.params;
    const { startDate, endDate, includeCalculations } = req.query;

    const parsedEmployeeId = parseInt(employeeId, 10);
    if (Number.isNaN(parsedEmployeeId)) {
      throw new CustomError('Identifiant employé invalide', 400);
    }

    // Vérifier si l'utilisateur est admin
    if (isAdminRole(requester.role)) {
      // Les admins ont accès à tout
    } else {
      // Vérifier d'abord si l'utilisateur consulte ses propres pointages
      const ownEmployee = await prisma.employee.findFirst({
        where: {
          userId: requester.userId,
          id: parsedEmployeeId,
        },
      });

      if (ownEmployee) {
        // L'utilisateur consulte ses propres pointages, autoriser
      } else if (isManagerRole(requester.role)) {
        // Vérifier si le manager a accès à cet employé
        const hasAccess = await managerHasAccessToEmployee(requester.userId, parsedEmployeeId);
        if (!hasAccess) {
          throw new CustomError('Accès refusé', 403);
        }
      } else {
        // Utilisateur normal essayant d'accéder aux pointages d'un autre employé
        throw new CustomError('Accès refusé', 403);
      }
    }

    const where: any = {
      employeeId: parsedEmployeeId,
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

    // Si includeCalculations est true, calculer les heures pour chaque pointage
    let enrichedEntries = timeEntries;
    if (includeCalculations === 'true' || includeCalculations === true) {
      const { calculateHoursWorked } = await import('../utils/overtimeCalculator');
      enrichedEntries = await Promise.all(
        timeEntries.map(async (entry) => {
          if (!entry.clockIn || !entry.clockOut) {
            return {
              ...entry,
              calculatedHours: null,
            };
          }

          try {
            const calculated = await calculateHoursWorked({
              employeeId: parsedEmployeeId,
              clockInTime: entry.clockIn,
              clockOutTime: entry.clockOut,
              date: entry.date,
            });

            return {
              ...entry,
              calculatedHours: calculated,
            };
          } catch (error: any) {
            console.error(`Erreur calcul heures pour entry ${entry.id}:`, error);
            return {
              ...entry,
              calculatedHours: null,
            };
          }
        })
      );
    }

    res.json({ data: enrichedEntries });
  } catch (error) {
    throw error;
  }
};

export const clockIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }

    const { employeeId } = req.params;
    const { clockInTime } = req.body;

    const parsedEmployeeId = parseInt(employeeId, 10);
    if (Number.isNaN(parsedEmployeeId)) {
      throw new CustomError('Identifiant employé invalide', 400);
    }

    if (isManagerRole(requester.role)) {
      const hasAccess = await managerHasAccessToEmployee(requester.userId, parsedEmployeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

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
          employeeId: parsedEmployeeId,
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
          isValidated: false,
          validatedAt: null,
        },
      });
    } else {
      // Créer une nouvelle entrée
      timeEntry = await prisma.timeEntry.create({
        data: {
          employeeId: parsedEmployeeId,
          date: today,
          clockIn: now,
          isValidated: false,
          validatedAt: null,
          status: TimeEntryStatus.EN_ATTENTE,
        },
      });
    }

    await createAuditLog({
      userId: requester.userId,
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
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }

    const { employeeId } = req.params;
    const { clockOutTime } = req.body;

    const parsedEmployeeId = parseInt(employeeId, 10);
    if (Number.isNaN(parsedEmployeeId)) {
      throw new CustomError('Identifiant employé invalide', 400);
    }

    if (isManagerRole(requester.role)) {
      const hasAccess = await managerHasAccessToEmployee(requester.userId, parsedEmployeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

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
          employeeId: parsedEmployeeId,
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
        status: TimeEntryStatus.TERMINE,
        isValidated: false,
        validatedAt: null,
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
          employeeId: parsedEmployeeId,
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
      userId: requester.userId,
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

export const updateTimeEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }

    const { id } = req.params;
    const { clockIn, clockOut, totalHours, status } = req.body;

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!timeEntry) {
      throw new CustomError('Pointage introuvable', 404);
    }

    if (isManagerRole(requester.role)) {
      const hasAccess = await managerHasAccessToEmployee(requester.userId, timeEntry.employeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    if (isManagerRole(requester.role)) {
      const hasAccess = await managerHasAccessToEmployee(requester.userId, timeEntry.employeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    const updates: any = {};

    if (clockIn !== undefined) {
      const parsedClockIn = clockIn ? new Date(clockIn) : null;
      if (parsedClockIn && Number.isNaN(parsedClockIn.getTime())) {
        throw new CustomError("Heure d'entrée invalide", 400);
      }
      updates.clockIn = parsedClockIn;
    }

    if (clockOut !== undefined) {
      const parsedClockOut = clockOut ? new Date(clockOut) : null;
      if (parsedClockOut && Number.isNaN(parsedClockOut.getTime())) {
        throw new CustomError("Heure de sortie invalide", 400);
      }
      updates.clockOut = parsedClockOut;
    }

    if (
      updates.clockIn &&
      updates.clockOut &&
      updates.clockOut <= updates.clockIn
    ) {
      throw new CustomError("L'heure de sortie doit être après l'heure d'entrée", 400);
    }

    // Déterminer les valeurs finales (existantes + mises à jour)
    const finalClockIn = updates.clockIn !== undefined ? updates.clockIn : timeEntry.clockIn;
    const finalClockOut = updates.clockOut !== undefined ? updates.clockOut : timeEntry.clockOut;

    if (totalHours !== undefined) {
      const parsedTotalHours = parseFloat(totalHours);
      if (Number.isNaN(parsedTotalHours) || parsedTotalHours < 0) {
        throw new CustomError('Total heures invalide', 400);
      }
      updates.totalHours = Math.round(parsedTotalHours * 100) / 100;
    } else if (finalClockIn && finalClockOut) {
      const diff =
        (finalClockOut.getTime() - finalClockIn.getTime()) /
        (1000 * 60 * 60);
      updates.totalHours = Math.round(diff * 100) / 100;
    }

    if (status) {
      updates.status = mapTimeEntryStatus(status);
    } else if (finalClockIn && finalClockOut) {
      // Les deux heures sont présentes, le pointage est terminé
      updates.status = TimeEntryStatus.TERMINE;
    } else if (finalClockIn || finalClockOut) {
      // Une seule heure est présente, le pointage est incomplet
      updates.status = TimeEntryStatus.INCOMPLET;
    }

    updates.updatedAt = new Date();
    updates.isValidated = false;
    updates.validatedAt = null;
    updates.validationErrors = null;

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: updates,
    });

    await createAuditLog({
      userId: requester.userId,
      action: 'UPDATE',
      modelType: 'TimeEntry',
      modelId: updatedEntry.id,
      oldValue: timeEntry,
      newValue: updatedEntry,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Pointage mis à jour avec succès',
      data: updatedEntry,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteTimeEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }

    const { id } = req.params;

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!timeEntry) {
      throw new CustomError('Pointage introuvable', 404);
    }

    await prisma.timeEntry.delete({
      where: { id: timeEntry.id },
    });

    await createAuditLog({
      userId: requester.userId,
      action: 'DELETE',
      modelType: 'TimeEntry',
      modelId: timeEntry.id,
      oldValue: timeEntry,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Pointage supprimé avec succès',
    });
  } catch (error) {
    throw error;
  }
};

export const getBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }

    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const parsedEmployeeId = parseInt(employeeId, 10);
    if (Number.isNaN(parsedEmployeeId)) {
      throw new CustomError('Identifiant employé invalide', 400);
    }

    if (isManagerRole(requester.role)) {
      const hasAccess = await managerHasAccessToEmployee(requester.userId, parsedEmployeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    if (!startDate || !endDate) {
      throw new CustomError('Les dates de début et de fin sont requises', 400);
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: parsedEmployeeId,
        date: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
        status: TimeEntryStatus.TERMINE,
      },
    });

    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
    const daysWorked = timeEntries.length;

    // Récupérer le cycle de travail de l'employé
    const employee = await prisma.employee.findUnique({
      where: { id: parsedEmployeeId },
      include: {
        workCycle: {
          include: {
            schedule: true,
          },
        },
      },
    });

    const schedule = employee?.workCycle?.schedule;
    const expectedDailyHours = schedule?.theoreticalDayHours ?? 8;

    const rangeStart = startDate ? new Date(startDate as string) : new Date(timeEntries[0]?.date ?? new Date());
    const rangeEnd = endDate ? new Date(endDate as string) : new Date(timeEntries[timeEntries.length - 1]?.date ?? new Date());
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(0, 0, 0, 0);

    const dayCount = Math.max(
      1,
      Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000)) + 1
    );

    const expectedHours = expectedDailyHours * dayCount;
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
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }

    const { id } = req.params;
    const { autoCorrect } = req.query;

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: parseInt(id) },
    });

    if (!timeEntry) {
      throw new CustomError('Pointage non trouvé', 404);
    }

    if (isManagerRole(requester.role)) {
      const hasAccess = await managerHasAccessToEmployee(requester.userId, timeEntry.employeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
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
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }

    const { employeeId } = req.params;
    const { startDate, endDate, autoCorrect } = req.body;

    const parsedEmployeeId = parseInt(employeeId, 10);
    if (Number.isNaN(parsedEmployeeId)) {
      throw new CustomError('Identifiant employé invalide', 400);
    }

    if (isManagerRole(requester.role)) {
      const hasAccess = await managerHasAccessToEmployee(requester.userId, parsedEmployeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: parsedEmployeeId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const validationReports: any[] = [];
    const issueCounts: Record<string, { count: number; ruleName: string }> = {};
    let correctionsApplied = 0;

    for (const entry of timeEntries) {
      const issues: any[] = [];

      if (!entry.clockIn) {
        issues.push({
          isValid: false,
          ruleId: 'CLOCK_IN_MISSING',
          ruleName: 'Pointage d\'entrée manquant',
          message: 'Pointage d\'entrée manquant',
          severity: 'CRITICAL',
          suggestion: 'Enregistrer l\'heure d\'entrée manuellement ou contacter l\'administrateur.',
        });
      }

      if (!entry.clockOut) {
        issues.push({
          isValid: false,
          ruleId: 'CLOCK_OUT_MISSING',
          ruleName: 'Pointage de sortie manquant',
          message: 'Pointage de sortie manquant',
          severity: 'CRITICAL',
          suggestion: 'Enregistrer l\'heure de sortie manuellement ou contacter l\'administrateur.',
        });
      }

      if (entry.clockIn && entry.clockOut && new Date(entry.clockOut) <= new Date(entry.clockIn)) {
        issues.push({
          isValid: false,
          ruleId: 'CLOCK_ORDER_INVALID',
          ruleName: 'Ordre des pointages invalide',
          message: 'L\'heure de sortie doit être après l\'heure d\'entrée',
          severity: 'HIGH',
          suggestion: 'Corriger les heures de pointage pour respecter l\'ordre chronologique.',
        });
      }

      if (entry.totalHours && entry.totalHours > 24) {
        issues.push({
          isValid: false,
          ruleId: 'TOTAL_HOURS_EXCEEDED',
          ruleName: 'Durée anormale',
          message: 'Le total d\'heures dépasse 24h',
          severity: 'HIGH',
          suggestion: 'Vérifier les heures saisies, un pointage manquant ou invalide est probable.',
        });
      }

      const issuesForStatistics = issues.length ? issues : [{
        isValid: true,
        ruleId: 'OK',
        ruleName: 'Pointage valide',
        message: 'Aucun problème détecté',
        severity: 'LOW',
      }];

      for (const issue of issues) {
        if (!issueCounts[issue.ruleId]) {
          issueCounts[issue.ruleId] = { count: 0, ruleName: issue.ruleName };
        }
        issueCounts[issue.ruleId].count += 1;
      }

      const overallStatus = issues.length === 0 ? 'VALID' : 'INVALID';

      if (autoCorrect && issues.length === 0) {
        // aucun correctif nécessaire
      }

      await prisma.timeEntry.update({
        where: { id: entry.id },
        data: {
          isValidated: issues.length === 0,
          validatedAt: issues.length === 0 ? new Date() : null,
          validationErrors: issues.length > 0 ? JSON.stringify(issues.map(i => i.message)) : null,
        },
      });

      validationReports.push({
        timeEntryId: entry.id,
        employeeId: entry.employeeId,
        employeeName: `${entry.employee?.firstName ?? ''} ${entry.employee?.lastName ?? ''}`.trim() ||
          entry.employee?.employeeNumber ||
          `Employé #${entry.employeeId}`,
        date: entry.date,
        results: issuesForStatistics,
        overallStatus,
        canAutoCorrect: false,
      });
    }

    const totalEntries = validationReports.length;
    const validEntries = validationReports.filter((r) => r.overallStatus === 'VALID').length;
    const invalidEntries = validationReports.filter((r) => r.overallStatus === 'INVALID').length;
    const warningEntries = validationReports.filter((r) => r.overallStatus === 'WARNING').length;

    const mostCommonIssues = Object.entries(issueCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([ruleId, info]) => ({
        ruleId,
        count: info.count,
        ruleName: info.ruleName,
      }));

    res.json({
      data: {
        validationReports,
        statistics: {
          totalEntries,
          validEntries,
          warningEntries,
          invalidEntries,
          mostCommonIssues,
        },
        correctionsApplied,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getValidationStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }

    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const parsedEmployeeId = parseInt(employeeId, 10);
    if (Number.isNaN(parsedEmployeeId)) {
      throw new CustomError('Identifiant employé invalide', 400);
    }

    if (isManagerRole(requester.role)) {
      const hasAccess = await managerHasAccessToEmployee(requester.userId, parsedEmployeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: parsedEmployeeId,
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

