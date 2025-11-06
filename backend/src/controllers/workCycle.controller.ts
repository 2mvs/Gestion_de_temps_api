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
        employees: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        // schedules sera disponible après migration Prisma
        // schedules: {
        //   include: {
        //     schedule: {
        //       select: {
        //         id: true,
        //         label: true,
        //         abbreviation: true,
        //       },
        //     },
        //   },
        // },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(workCycles);
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
        employees: true,
        schedules: true,
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
    const {
      name,
      abbreviation,
      description,
      cycleType,
      cycleDays,
      weeklyHours,
      overtimeThreshold,
    } = req.body;

    const workCycle = await prisma.workCycle.create({
      data: {
        name,
        abbreviation: abbreviation || null,
        description: description || null,
        cycleType: cycleType || 'WEEKLY',
        cycleDays: cycleDays || 7,
        weeklyHours: weeklyHours || 40,
        overtimeThreshold: overtimeThreshold || null,
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
    const {
      name,
      abbreviation,
      description,
      cycleType,
      cycleDays,
      weeklyHours,
      overtimeThreshold,
    } = req.body;

    const oldWorkCycle = await prisma.workCycle.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
    });

    if (!oldWorkCycle) {
      throw new CustomError('Cycle de travail non trouvé', 404);
    }

    const workCycle = await prisma.workCycle.update({
      where: { id: parseInt(id) },
      data: {
        name,
        abbreviation: abbreviation || null,
        description: description || null,
        cycleType,
        cycleDays,
        weeklyHours,
        overtimeThreshold: overtimeThreshold || null,
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

// Associer un horaire à un cycle
export const assignScheduleToCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cycleId } = req.params;
    const { scheduleId, dayOfWeek, isDefault } = req.body;

    // Vérifier que le cycle existe
    const workCycle = await prisma.workCycle.findFirst({
      where: {
        id: parseInt(cycleId),
        deletedAt: null,
      },
    });

    if (!workCycle) {
      throw new CustomError('Cycle de travail non trouvé', 404);
    }

    // Vérifier que l'horaire existe
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: parseInt(scheduleId),
        deletedAt: null,
      },
    });

    if (!schedule) {
      throw new CustomError('Horaire non trouvé', 404);
    }

    const workCycleSchedule = await prisma.workCycleSchedule.create({
      data: {
        workCycleId: parseInt(cycleId),
        scheduleId: parseInt(scheduleId),
        dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : null,
        isDefault: isDefault || false,
      },
      include: {
        schedule: {
          include: {
            periods: {
              include: {
                timeRanges: true,
              },
            },
          },
        },
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      modelType: 'WorkCycleSchedule',
      modelId: workCycleSchedule.id,
      newValue: workCycleSchedule,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Horaire associé au cycle avec succès',
      data: workCycleSchedule,
    });
  } catch (error) {
    throw error;
  }
};

// Retirer un horaire d'un cycle
export const removeScheduleFromCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cycleId, scheduleId } = req.params;

    const workCycleSchedule = await prisma.workCycleSchedule.findFirst({
      where: {
        workCycleId: parseInt(cycleId),
        scheduleId: parseInt(scheduleId),
      },
    });

    if (!workCycleSchedule) {
      throw new CustomError('Association non trouvée', 404);
    }

    await prisma.workCycleSchedule.delete({
      where: { id: workCycleSchedule.id },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      modelType: 'WorkCycleSchedule',
      modelId: workCycleSchedule.id,
      oldValue: workCycleSchedule,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'Horaire retiré du cycle avec succès' });
  } catch (error) {
    throw error;
  }
};

// Obtenir tous les horaires d'un cycle
export const getSchedulesByCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cycleId } = req.params;

    const schedules = await prisma.workCycleSchedule.findMany({
      where: {
        workCycleId: parseInt(cycleId),
      },
      include: {
        schedule: {
          include: {
            periods: {
              include: {
                timeRanges: true,
              },
            },
          },
        },
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });

    res.json(schedules);
  } catch (error) {
    throw error;
  }
};

