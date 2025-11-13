import { Request, Response } from 'express';
import { ApprovalStatus, SpecialHourType } from '@prisma/client';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';
import { managerHasAccessToEmployee } from '../utils/access';
import { isManagerRole, isAdminRole } from '../utils/roles';

const mapApprovalStatus = (value?: string | null): ApprovalStatus | undefined => {
  if (!value) return undefined;
  const normalized = value.toString().toUpperCase();
  switch (normalized) {
    case 'EN_ATTENTE':
    case 'PENDING':
      return ApprovalStatus.EN_ATTENTE;
    case 'APPROUVE':
    case 'APPROVED':
      return ApprovalStatus.APPROUVE;
    case 'REJETE':
    case 'REJECTED':
      return ApprovalStatus.REJETE;
    default:
      return undefined;
  }
};

export const getAllSpecialHours = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isAdminRole(req.user?.role)) {
      throw new CustomError('Accès refusé', 403);
    }

    const { employeeId, status, startDate, endDate } = req.query;

    const where: any = {};

    if (employeeId) {
      const parsedEmployeeId = parseInt(employeeId as string, 10);
      if (Number.isNaN(parsedEmployeeId)) {
        throw new CustomError('Identifiant employé invalide', 400);
      }
      where.employeeId = parsedEmployeeId;
    }

    if (status) {
      const mappedStatus = mapApprovalStatus(status as string);
      if (!mappedStatus) {
        throw new CustomError('Statut invalide', 400);
      }
      where.status = mappedStatus;
    }

    if (startDate || endDate) {
      where.date = {
        ...(startDate ? { gte: new Date(startDate as string) } : {}),
        ...(endDate ? { lte: new Date(endDate as string) } : {}),
      };
    }

    const specialHours = await prisma.specialHour.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            organizationalUnit: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.json({ data: specialHours });
  } catch (error) {
    throw error;
  }
};

export const getSpecialHoursByEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    const parsedEmployeeId = parseInt(employeeId, 10);
    if (Number.isNaN(parsedEmployeeId)) {
      throw new CustomError('Identifiant employé invalide', 400);
    }

    if (isManagerRole(req.user?.role)) {
      const hasAccess = await managerHasAccessToEmployee(req.user.userId, parsedEmployeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    const specialHours = await prisma.specialHour.findMany({
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
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.json({ data: specialHours });
  } catch (error) {
    throw error;
  }
};

export const createSpecialHour = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, date, hours, hourType, reason } = req.body;

    const parsedEmployeeId = parseInt(employeeId, 10);
    if (Number.isNaN(parsedEmployeeId)) {
      throw new CustomError('Identifiant employé invalide', 400);
    }

    if (isManagerRole(req.user?.role)) {
      const hasAccess = await managerHasAccessToEmployee(req.user.userId, parsedEmployeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    const specialHour = await prisma.specialHour.create({
      data: {
        employeeId: parsedEmployeeId,
        date: new Date(date),
        hours: parseFloat(hours),
        hourType: (hourType as SpecialHourType) || SpecialHourType.FERIE,
        reason: reason || null,
        status: ApprovalStatus.EN_ATTENTE,
      },
      include: {
        employee: true,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      modelType: 'SpecialHour',
      modelId: specialHour.id,
      newValue: specialHour,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Heures spéciales créées avec succès',
      data: specialHour,
    });
  } catch (error) {
    throw error;
  }
};

export const approveSpecialHour = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(ApprovalStatus).includes(status as ApprovalStatus)) {
      throw new CustomError('Statut invalide', 400);
    }

    const oldSpecialHour = await prisma.specialHour.findUnique({
      where: { id: parseInt(id) },
    });

    if (!oldSpecialHour) {
      throw new CustomError('Heures spéciales non trouvées', 404);
    }

    if (isManagerRole(req.user?.role)) {
      const hasAccess = await managerHasAccessToEmployee(req.user.userId, oldSpecialHour.employeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    const specialHour = await prisma.specialHour.update({
      where: { id: parseInt(id) },
      data: {
        status: status as ApprovalStatus,
        approvedAt: new Date(),
      },
      include: {
        employee: true,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: status === ApprovalStatus.APPROUVE ? 'APPROVE' : 'REJECT',
      modelType: 'SpecialHour',
      modelId: specialHour.id,
      oldValue: oldSpecialHour,
      newValue: specialHour,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: `Heures spéciales ${status === ApprovalStatus.APPROUVE ? 'approuvées' : 'rejetées'} avec succès`,
      data: specialHour,
    });
  } catch (error) {
    throw error;
  }
};

