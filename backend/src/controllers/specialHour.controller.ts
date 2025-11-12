import { Request, Response } from 'express';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';
import { managerHasAccessToEmployee } from '../utils/access';

export const getSpecialHoursByEmployee = async (req: Request, res: Response): Promise<void> => {
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

    if (req.user?.role === 'MANAGER') {
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
        hourType: hourType || 'HOLIDAY',
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

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new CustomError('Statut invalide', 400);
    }

    const oldSpecialHour = await prisma.specialHour.findUnique({
      where: { id: parseInt(id) },
    });

    if (!oldSpecialHour) {
      throw new CustomError('Heures spéciales non trouvées', 404);
    }

    if (req.user?.role === 'MANAGER') {
      const hasAccess = await managerHasAccessToEmployee(req.user.userId, oldSpecialHour.employeeId);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    const specialHour = await prisma.specialHour.update({
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
      modelType: 'SpecialHour',
      modelId: specialHour.id,
      oldValue: oldSpecialHour,
      newValue: specialHour,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: `Heures spéciales ${status === 'APPROVED' ? 'approuvées' : 'rejetées'} avec succès`,
      data: specialHour,
    });
  } catch (error) {
    throw error;
  }
};

