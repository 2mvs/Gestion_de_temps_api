import { Request, Response } from 'express';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';

export const getAllSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    const schedules = await prisma.workSchedule.findMany({
      where: { deletedAt: null },
      include: {
        slots: {
          orderBy: {
            startTime: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ data: schedules });
  } catch (error) {
    throw error;
  }
};

export const getSchedulesByEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    const employee = await prisma.employee.findFirst({
      where: {
        id: parseInt(employeeId),
        deletedAt: null,
      },
      include: {
        workCycle: {
          include: {
            schedule: {
              include: {
                slots: true,
              },
            },
          },
        },
      },
    });

    if (!employee || !employee.workCycle || !employee.workCycle.schedule) {
      throw new CustomError('Employé non trouvé ou sans horaire assigné', 404);
    }

    res.json({ data: employee.workCycle.schedule });
  } catch (error) {
    throw error;
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      label,
      abbreviation,
      startTime,
      endTime,
      theoreticalDayHours,
      theoreticalMorningHours,
      theoreticalAfternoonHours,
      slots,
    } = req.body;

    const schedule = await prisma.workSchedule.create({
      data: {
        label,
        abbreviation: abbreviation || null,
        startTime,
        endTime,
        theoreticalDayHours:
          theoreticalDayHours !== undefined && theoreticalDayHours !== null
            ? parseFloat(theoreticalDayHours)
            : null,
        theoreticalMorningHours:
          theoreticalMorningHours !== undefined && theoreticalMorningHours !== null
            ? parseFloat(theoreticalMorningHours)
            : null,
        theoreticalAfternoonHours:
          theoreticalAfternoonHours !== undefined && theoreticalAfternoonHours !== null
            ? parseFloat(theoreticalAfternoonHours)
            : null,
        slots:
          slots && Array.isArray(slots)
            ? {
                create: slots.map((slot: any) => ({
                  slotType: slot.slotType,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  label: slot.label || null,
                  multiplier:
                    slot.multiplier !== undefined && slot.multiplier !== null
                      ? parseFloat(slot.multiplier)
                      : 1.0,
                })),
              }
            : undefined,
      },
      include: {
        slots: true,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      modelType: 'WorkSchedule',
      modelId: schedule.id,
      newValue: schedule,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Horaire créé avec succès',
      data: schedule,
    });
  } catch (error) {
    throw error;
  }
};

export const updateSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      label,
      abbreviation,
      startTime,
      endTime,
      theoreticalDayHours,
      theoreticalMorningHours,
      theoreticalAfternoonHours,
      slots,
    } = req.body;

    const scheduleId = parseInt(id);

    const oldSchedule = await prisma.workSchedule.findFirst({
      where: {
        id: scheduleId,
        deletedAt: null,
      },
      include: {
        slots: true,
      },
    });

    if (!oldSchedule) {
      throw new CustomError('Horaire non trouvé', 404);
    }

    await prisma.workScheduleSlot.deleteMany({
      where: { scheduleId },
    });

    const schedule = await prisma.workSchedule.update({
      where: { id: scheduleId },
      data: {
        label,
        abbreviation: abbreviation || null,
        startTime,
        endTime,
        theoreticalDayHours:
          theoreticalDayHours !== undefined && theoreticalDayHours !== null
            ? parseFloat(theoreticalDayHours)
            : null,
        theoreticalMorningHours:
          theoreticalMorningHours !== undefined && theoreticalMorningHours !== null
            ? parseFloat(theoreticalMorningHours)
            : null,
        theoreticalAfternoonHours:
          theoreticalAfternoonHours !== undefined && theoreticalAfternoonHours !== null
            ? parseFloat(theoreticalAfternoonHours)
            : null,
        slots:
          slots && Array.isArray(slots)
            ? {
                create: slots.map((slot: any) => ({
                  slotType: slot.slotType,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  label: slot.label || null,
                  multiplier:
                    slot.multiplier !== undefined && slot.multiplier !== null
                      ? parseFloat(slot.multiplier)
                      : 1.0,
                })),
              }
            : undefined,
      },
      include: {
        slots: true,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      modelType: 'WorkSchedule',
      modelId: schedule.id,
      oldValue: oldSchedule,
      newValue: schedule,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Horaire mis à jour avec succès',
      data: schedule,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const schedule = await prisma.workSchedule.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
    });

    if (!schedule) {
      throw new CustomError('Horaire non trouvé', 404);
    }

    await prisma.workSchedule.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      modelType: 'WorkSchedule',
      modelId: parseInt(id),
      oldValue: schedule,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'Horaire supprimé avec succès' });
  } catch (error) {
    throw error;
  }
};

