import { Request, Response } from 'express';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';

export const getTimeRangesByPeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { periodId } = req.params;

    const timeRanges = await prisma.timeRange.findMany({
      where: {
        periodId: parseInt(periodId),
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    res.json(timeRanges);
  } catch (error) {
    throw error;
  }
};

export const createTimeRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { periodId, name, startTime, endTime, rangeType, multiplier } = req.body;

    // Vérifier que la période existe
    const period = await prisma.period.findFirst({
      where: {
        id: parseInt(periodId),
      },
    });

    if (!period) {
      throw new CustomError('Période non trouvée', 404);
    }

    const timeRange = await prisma.timeRange.create({
      data: {
        periodId: parseInt(periodId),
        name,
        startTime,
        endTime,
        rangeType: rangeType || 'NORMAL',
        multiplier: multiplier || 1.0,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      modelType: 'TimeRange',
      modelId: timeRange.id,
      newValue: timeRange,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Plage horaire créée avec succès',
      data: timeRange,
    });
  } catch (error) {
    throw error;
  }
};

export const updateTimeRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime, rangeType, multiplier } = req.body;

    const oldTimeRange = await prisma.timeRange.findFirst({
      where: {
        id: parseInt(id),
      },
    });

    if (!oldTimeRange) {
      throw new CustomError('Plage horaire non trouvée', 404);
    }

    const timeRange = await prisma.timeRange.update({
      where: { id: parseInt(id) },
      data: {
        name,
        startTime,
        endTime,
        rangeType,
        multiplier,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      modelType: 'TimeRange',
      modelId: timeRange.id,
      oldValue: oldTimeRange,
      newValue: timeRange,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Plage horaire mise à jour avec succès',
      data: timeRange,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteTimeRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const timeRange = await prisma.timeRange.findFirst({
      where: {
        id: parseInt(id),
      },
    });

    if (!timeRange) {
      throw new CustomError('Plage horaire non trouvée', 404);
    }

    await prisma.timeRange.delete({
      where: { id: parseInt(id) },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      modelType: 'TimeRange',
      modelId: timeRange.id,
      oldValue: timeRange,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Plage horaire supprimée avec succès',
    });
  } catch (error) {
    throw error;
  }
};

