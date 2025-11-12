import { Request, Response } from 'express';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';

export const getAllWorkCycles = async (req: Request, res: Response): Promise<void> => {
  try {
    const workCycles = await prisma.workCycle.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        schedule: {
          include: {
            slots: true,
          },
        },
        employees: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ data: workCycles });
  } catch (error) {
    throw error;
  }
};

export const getWorkCycleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const workCycle = await prisma.workCycle.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
      include: {
        schedule: {
          include: {
            slots: true,
          },
        },
        employees: true,
      },
    });

    if (!workCycle) {
      throw new CustomError('Cycle de travail non trouvé', 404);
    }

    res.json({ data: workCycle });
  } catch (error) {
    throw error;
  }
};

export const createWorkCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { label, abbreviation, scheduleId } = req.body;

    const schedule = await prisma.workSchedule.findFirst({
      where: {
        id: parseInt(scheduleId),
        deletedAt: null,
      },
    });

    if (!schedule) {
      throw new CustomError('Horaire associé introuvable', 404);
    }

    const workCycle = await prisma.workCycle.create({
      data: {
        label,
        abbreviation: abbreviation || null,
        scheduleId: schedule.id,
      },
      include: {
        schedule: {
          include: {
            slots: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      modelType: 'WorkCycle',
      modelId: workCycle.id,
      newValue: workCycle,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Cycle de travail créé avec succès',
      data: workCycle,
    });
  } catch (error) {
    throw error;
  }
};

export const updateWorkCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { label, abbreviation, scheduleId } = req.body;

    const workCycleId = parseInt(id);

    const oldWorkCycle = await prisma.workCycle.findFirst({
      where: {
        id: workCycleId,
        deletedAt: null,
      },
    });

    if (!oldWorkCycle) {
      throw new CustomError('Cycle de travail non trouvé', 404);
    }

    if (scheduleId !== undefined) {
      const schedule = await prisma.workSchedule.findFirst({
        where: {
          id: parseInt(scheduleId),
          deletedAt: null,
        },
      });

      if (!schedule) {
        throw new CustomError('Horaire associé introuvable', 404);
      }
    }

    const workCycle = await prisma.workCycle.update({
      where: { id: workCycleId },
      data: {
        label,
        abbreviation: abbreviation || null,
        scheduleId: scheduleId !== undefined ? parseInt(scheduleId) : oldWorkCycle.scheduleId,
      },
      include: {
        schedule: {
          include: {
            slots: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      modelType: 'WorkCycle',
      modelId: workCycle.id,
      oldValue: oldWorkCycle,
      newValue: workCycle,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Cycle de travail mis à jour avec succès',
      data: workCycle,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteWorkCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const workCycle = await prisma.workCycle.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
    });

    if (!workCycle) {
      throw new CustomError('Cycle de travail non trouvé', 404);
    }

    await prisma.workCycle.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      modelType: 'WorkCycle',
      modelId: parseInt(id),
      oldValue: workCycle,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'Cycle de travail supprimé avec succès' });
  } catch (error) {
    throw error;
  }
};

