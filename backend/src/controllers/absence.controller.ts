import { Request, Response } from 'express';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';

export const getAllAbsences = async (req: Request, res: Response): Promise<void> => {
  try {
    const absences = await prisma.absence.findMany({
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

    const absences = await prisma.absence.findMany({
      where: {
        employeeId: parseInt(employeeId),
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

    const absence = await prisma.absence.create({
      data: {
        employeeId: parseInt(employeeId),
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

