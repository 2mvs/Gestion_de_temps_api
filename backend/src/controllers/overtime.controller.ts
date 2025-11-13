import { Request, Response } from 'express';
import { ApprovalStatus } from '@prisma/client';
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

export const getAllOvertimes = async (req: Request, res: Response): Promise<void> => {
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

    const overtimes = await prisma.overtime.findMany({
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

    res.json({ data: overtimes });
  } catch (error) {
    throw error;
  }
};

export const getOvertimesByEmployee = async (req: Request, res: Response): Promise<void> => {
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

    const overtimes = await prisma.overtime.findMany({
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

    res.json({ data: overtimes });
  } catch (error) {
    throw error;
  }
};

export const createOvertime = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, date, hours, reason } = req.body;

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

    const overtime = await prisma.overtime.create({
      data: {
        employeeId: parsedEmployeeId,
        date: new Date(date),
        hours: parseFloat(hours),
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
      modelType: 'Overtime',
      modelId: overtime.id,
      newValue: overtime,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Heures supplémentaires créées avec succès',
      data: overtime,
    });
  } catch (error) {
    throw error;
  }
};

export const approveOvertime = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(ApprovalStatus).includes(status as ApprovalStatus)) {
      throw new CustomError('Statut invalide', 400);
    }

    const oldOvertime = await prisma.overtime.findUnique({
      where: { id: parseInt(id) },
    });

    if (!oldOvertime) {
      throw new CustomError('Heures supplémentaires non trouvées', 404);
    }

    if (isManagerRole(req.user?.role)) {
      const hasAccess = await managerHasAccessToEmployee(req.user.userId, oldOvertime.employeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    const overtime = await prisma.overtime.update({
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
      modelType: 'Overtime',
      modelId: overtime.id,
      oldValue: oldOvertime,
      newValue: overtime,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: `Heures supplémentaires ${status === ApprovalStatus.APPROUVE ? 'approuvées' : 'rejetées'} avec succès`,
      data: overtime,
    });
  } catch (error) {
    throw error;
  }
};

