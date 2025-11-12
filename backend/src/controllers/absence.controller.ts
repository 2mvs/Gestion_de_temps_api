import { Request, Response } from 'express';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';
import { managerHasAccessToEmployee } from '../utils/access';

const computeInclusiveDays = (start: Date, end: Date): number => {
  const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const diff = endUTC - startUTC;
  if (diff < 0) {
    return 0;
  }
  const MS_IN_DAY = 1000 * 60 * 60 * 24;
  return Math.floor(diff / MS_IN_DAY) + 1;
};

export const getAllAbsences = async (req: Request, res: Response): Promise<void> => {
  try {
    const where: any = {};

    if (req.user?.role === 'MANAGER') {
      where.employee = {
        organizationalUnit: {
          managerId: req.user.userId,
        },
      };
    }

    const absences = await prisma.absence.findMany({
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
        approver: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ data: absences });
  } catch (error) {
    throw error;
  }
};

export const getAbsencesByEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    const parsedEmployeeId = parseInt(employeeId, 10);
    if (Number.isNaN(parsedEmployeeId)) {
      throw new CustomError('Identifiant employé invalide', 400);
    }

    if (req.user?.role === 'MANAGER') {
      const hasAccess = await managerHasAccessToEmployee(req.user.userId, parsedEmployeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    const absences = await prisma.absence.findMany({
      where: {
        employeeId: parsedEmployeeId,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        approver: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    res.json({ data: absences });
  } catch (error) {
    throw error;
  }
};

export const createAbsence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, absenceType, startDate, endDate, days, reason } = req.body;

    const parsedEmployeeId = parseInt(employeeId, 10);
    if (Number.isNaN(parsedEmployeeId)) {
      throw new CustomError('Identifiant employé invalide', 400);
    }

    if (req.user?.role === 'MANAGER') {
      const hasAccess = await managerHasAccessToEmployee(req.user.userId, parsedEmployeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    const absence = await prisma.absence.create({
      data: {
        employeeId: parsedEmployeeId,
        absenceType: absenceType || 'VACATION',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days: parseFloat(days),
        reason: reason || null,
        status: 'PENDING',
      },
      include: {
        employee: true,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      modelType: 'Absence',
      modelId: absence.id,
      newValue: absence,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Demande d\'absence créée avec succès',
      data: absence,
    });
  } catch (error) {
    throw error;
  }
};

export const updateAbsence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { absenceType, startDate, endDate, reason, employeeId } = req.body;

    const absence = await prisma.absence.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!absence) {
      throw new CustomError('Absence non trouvée', 404);
    }

    if (absence.status !== 'PENDING') {
      throw new CustomError('Impossible de modifier une absence déjà approuvée ou rejetée', 400);
    }

    const requester = req.user!;
    const isOwner =
      absence.employee?.userId !== null && absence.employee?.userId !== undefined
        ? absence.employee.userId === requester.userId
        : false;
    const hasManagerRights = requester.role === 'ADMIN' || requester.role === 'MANAGER';

    if (!isOwner && !hasManagerRights) {
      throw new CustomError('Accès refusé', 403);
    }

    let targetEmployeeId = absence.employeeId;
    if (employeeId !== undefined && employeeId !== null) {
      const parsedEmployeeId = parseInt(employeeId);
      if (Number.isNaN(parsedEmployeeId)) {
        throw new CustomError('ID employé invalide', 400);
      }
      if (isOwner && parsedEmployeeId !== absence.employeeId) {
        throw new CustomError('Vous ne pouvez pas modifier l\'employé associé à cette demande', 400);
      }
      targetEmployeeId = parsedEmployeeId;
    }

    if (requester.role === 'MANAGER') {
      const hasAccessCurrent = await managerHasAccessToEmployee(requester.userId, absence.employeeId);
      if (!hasAccessCurrent) {
        throw new CustomError('Accès refusé', 403);
      }
      if (targetEmployeeId !== absence.employeeId) {
        const hasAccessTarget = await managerHasAccessToEmployee(requester.userId, targetEmployeeId);
        if (!hasAccessTarget) {
          throw new CustomError('Accès refusé pour l\'employé cible', 403);
        }
      }
    }

    const newStart = startDate ? new Date(startDate) : absence.startDate;
    const newEnd = endDate ? new Date(endDate) : absence.endDate;

    if (Number.isNaN(newStart.getTime()) || Number.isNaN(newEnd.getTime())) {
      throw new CustomError('Dates invalides', 400);
    }

    if (newEnd < newStart) {
      throw new CustomError('La date de fin doit être postérieure ou égale à la date de début', 400);
    }

    const updatedDays = computeInclusiveDays(newStart, newEnd);
    if (updatedDays <= 0) {
      throw new CustomError('Le nombre de jours calculé est invalide', 400);
    }

    const sanitizedReason =
      reason !== undefined ? (reason && reason.trim().length > 0 ? reason.trim() : null) : absence.reason;

    const updatedAbsence = await prisma.absence.update({
      where: { id: absence.id },
      data: {
        employeeId: targetEmployeeId,
        absenceType: absenceType || absence.absenceType,
        startDate: newStart,
        endDate: newEnd,
        days: updatedDays,
        reason: sanitizedReason,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        approver: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: requester.userId,
      action: 'UPDATE',
      modelType: 'Absence',
      modelId: updatedAbsence.id,
      oldValue: absence,
      newValue: updatedAbsence,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Demande d\'absence mise à jour avec succès',
      data: updatedAbsence,
    });
  } catch (error) {
    throw error;
  }
};

export const approveAbsence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, approvedBy } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new CustomError('Statut invalide', 400);
    }

    const oldAbsence = await prisma.absence.findUnique({
      where: { id: parseInt(id) },
    });

    if (!oldAbsence) {
      throw new CustomError('Absence non trouvée', 404);
    }

    if (req.user?.role === 'MANAGER') {
      const hasAccess = await managerHasAccessToEmployee(req.user.userId, oldAbsence.employeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    const absence = await prisma.absence.update({
      where: { id: parseInt(id) },
      data: {
        status,
        approvedBy: approvedBy ? parseInt(approvedBy) : req.user!.userId,
        approvedAt: new Date(),
      },
      include: {
        employee: true,
        approver: true,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
      modelType: 'Absence',
      modelId: absence.id,
      oldValue: oldAbsence,
      newValue: absence,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: `Absence ${status === 'APPROVED' ? 'approuvée' : 'rejetée'} avec succès`,
      data: absence,
    });
  } catch (error) {
    throw error;
  }
};

