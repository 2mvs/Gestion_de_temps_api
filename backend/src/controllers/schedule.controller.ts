import { Request, Response } from 'express';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';

export const getAllSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    const schedules = await prisma.schedule.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        // workCycles sera disponible après migration Prisma
        // workCycles: {
        //   include: {
        //     workCycle: {
        //       select: {
        //         id: true,
        //         name: true,
        //         abbreviation: true,
        //       },
        //     },
        //   },
        // },
        periods: {
          include: {
            timeRanges: {
              orderBy: {
                startTime: 'asc',
              },
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(schedules);
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
            schedules: {
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
            },
          },
        },
      },
    });

    if (!employee || !employee.workCycle) {
      throw new CustomError('Employé non trouvé ou sans cycle de travail', 404);
    }

    const schedules = employee.workCycle.schedules.map((wcs: any) => ({
      ...wcs.schedule,
      dayOfWeek: wcs.dayOfWeek,
      isDefault: wcs.isDefault,
    }));

    res.json({ data: schedules });
  } catch (error) {
    throw error;
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      label,
      abbreviation,
      scheduleType,
      dayOfWeek,
      startTime,
      endTime,
      breakDuration,
      totalHours,
      periods,
    } = req.body;

    const schedule = await prisma.schedule.create({
      data: {
        label,
        abbreviation: abbreviation || null,
        scheduleType: scheduleType || 'STANDARD',
        dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : null,
        startTime: startTime || null, // Maintenant String (HH:MM)
        endTime: endTime || null, // Maintenant String (HH:MM)
        breakDuration: breakDuration ? parseInt(breakDuration) : null,
        totalHours: totalHours ? parseFloat(totalHours) : null,
        periods: periods
          ? {
              create: periods.map((p: any) => ({
                name: p.name,
                startTime: p.startTime,
                endTime: p.endTime,
                periodType: p.periodType || 'REGULAR',
                timeRanges: p.timeRanges
                  ? {
                      create: p.timeRanges.map((tr: any) => ({
                        name: tr.name,
                        startTime: tr.startTime,
                        endTime: tr.endTime,
                        rangeType: tr.rangeType || 'NORMAL',
                        multiplier: tr.multiplier || 1.0,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        periods: {
          include: {
            timeRanges: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      modelType: 'Schedule',
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
      scheduleType,
      dayOfWeek,
      startTime,
      endTime,
      breakDuration,
      totalHours,
    } = req.body;

    const oldSchedule = await prisma.schedule.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
      include: {
        periods: {
          include: {
            timeRanges: true,
          },
        },
      },
    });

    if (!oldSchedule) {
      throw new CustomError('Horaire non trouvé', 404);
    }

    const schedule = await prisma.schedule.update({
      where: { id: parseInt(id) },
      data: {
        label,
        abbreviation: abbreviation || null,
        scheduleType,
        dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : null,
        startTime: startTime || null, // Maintenant String (HH:MM)
        endTime: endTime || null, // Maintenant String (HH:MM)
        breakDuration: breakDuration ? parseInt(breakDuration) : null,
        totalHours: totalHours ? parseFloat(totalHours) : null,
      },
      include: {
        periods: {
          include: {
            timeRanges: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      modelType: 'Schedule',
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

    const schedule = await prisma.schedule.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
    });

    if (!schedule) {
      throw new CustomError('Horaire non trouvé', 404);
    }

    await prisma.schedule.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      modelType: 'Schedule',
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

