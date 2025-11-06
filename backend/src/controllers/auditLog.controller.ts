import { Request, Response } from 'express';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';

export const getAllAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { modelType, action, userId, limit = 100, offset = 0 } = req.query;

    const where: any = {};

    if (modelType) {
      where.modelType = modelType as string;
    }

    if (action) {
      where.action = action as string;
    }

    if (userId) {
      where.userId = parseInt(userId as string);
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({ data: auditLogs });
  } catch (error) {
    throw error;
  }
};

export const getAuditLogsByModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { modelType, modelId } = req.params;

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        modelType,
        modelId: parseInt(modelId),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ data: auditLogs });
  } catch (error) {
    throw error;
  }
};

export const getAuditLogsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        userId: parseInt(userId),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    res.json({ data: auditLogs });
  } catch (error) {
    throw error;
  }
};

