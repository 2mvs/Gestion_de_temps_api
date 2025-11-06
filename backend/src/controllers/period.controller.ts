import { Request, Response } from 'express';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';

export const getPeriodsBySchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scheduleId } = req.params;

    const periods = await prisma.period.findMany({
      where: {
        scheduleId: parseInt(scheduleId),
      },
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
    });

    res.json(periods);
  } catch (error) {
    throw error;
  }
};

export const createPeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scheduleId, name, startTime, endTime, periodType, timeRanges } = req.body;

    // Vérifier que le schedule existe
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: parseInt(scheduleId),
        deletedAt: null,
      },
    });

    if (!schedule) {
      throw new CustomError('Horaire non trouvé', 404);
    }

    // Créer la période
    const period = await prisma.period.create({
      data: {
        scheduleId: parseInt(scheduleId),
        name,
        startTime,
        endTime,
        periodType: periodType || 'REGULAR',
        timeRanges: timeRanges
          ? {
              create: timeRanges.map((tr: any) => ({
                name: tr.name,
                startTime: tr.startTime,
                endTime: tr.endTime,
                rangeType: tr.rangeType || 'NORMAL',
                multiplier: tr.multiplier || 1.0,
              })),
            }
          : undefined,
      },
      include: {
        timeRanges: true,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      modelType: 'Period',
      modelId: period.id,
      newValue: period,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Période créée avec succès',
      data: period,
    });
  } catch (error) {
    throw error;
  }
};

export const updatePeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime, periodType } = req.body;

    const oldPeriod = await prisma.period.findFirst({
      where: {
        id: parseInt(id),
      },
      include: {
        timeRanges: true,
      },
    });

    if (!oldPeriod) {
      throw new CustomError('Période non trouvée', 404);
    }

    const period = await prisma.period.update({
      where: { id: parseInt(id) },
      data: {
        name,
        startTime,
        endTime,
        periodType,
      },
      include: {
        timeRanges: true,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      modelType: 'Period',
      modelId: period.id,
      oldValue: oldPeriod,
      newValue: period,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Période mise à jour avec succès',
      data: period,
    });
  } catch (error) {
    throw error;
  }
};

export const deletePeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const period = await prisma.period.findFirst({
      where: {
        id: parseInt(id),
      },
      include: {
        timeRanges: true,
      },
    });

    if (!period) {
      throw new CustomError('Période non trouvée', 404);
    }

    await prisma.period.delete({
      where: { id: parseInt(id) },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      modelType: 'Period',
      modelId: period.id,
      oldValue: period,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Période supprimée avec succès',
    });
  } catch (error) {
    throw error;
  }
};

