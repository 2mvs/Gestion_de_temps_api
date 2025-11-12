import { Request, Response } from 'express';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';
import { managerHasAccessToEmployee } from '../utils/access';

export const getOvertimesByEmployee = async (req: Request, res: Response): Promise<void> => {
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

    if (req.user?.role === 'MANAGER') {
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
        status: 'PENDING',
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

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new CustomError('Statut invalide', 400);
    }

    const oldOvertime = await prisma.overtime.findUnique({
      where: { id: parseInt(id) },
    });

    if (!oldOvertime) {
      throw new CustomError('Heures supplémentaires non trouvées', 404);
    }

    if (req.user?.role === 'MANAGER') {
      const hasAccess = await managerHasAccessToEmployee(req.user.userId, oldOvertime.employeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    const overtime = await prisma.overtime.update({
      where: { id: parseInt(id) },
      data: {
        status,
        approvedAt: new Date(),
      },
      include: {
        employee: true,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
      modelType: 'Overtime',
      modelId: overtime.id,
      oldValue: oldOvertime,
      newValue: overtime,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: `Heures supplémentaires ${status === 'APPROVED' ? 'approuvées' : 'rejetées'} avec succès`,
      data: overtime,
    });
  } catch (error) {
    throw error;
  }
};

