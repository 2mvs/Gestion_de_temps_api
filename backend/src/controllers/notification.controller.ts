import { Request, Response } from 'express';
import { NotificationType } from '@prisma/client';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { ADMIN_ROLES } from '../utils/roles';

export const getAllNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { isRead, limit = 50 } = req.query;

    const where: any = {
      userId,
    };

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
    });

    res.json({ data: notifications });
  } catch (error) {
    throw error;
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({ data: { count } });
  } catch (error) {
    throw error;
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const notification = await prisma.notification.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!notification) {
      throw new CustomError('Notification non trouvée', 404);
    }

    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: {
        isRead: true,
      },
    });

    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    throw error;
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    throw error;
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const notification = await prisma.notification.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!notification) {
      throw new CustomError('Notification non trouvée', 404);
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    throw error;
  }
};

export const sendTestNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, title, message, type } = req.body;

    const notification = await prisma.notification.create({
      data: {
        userId: userId ? parseInt(userId) : req.user!.userId,
        type: (type as NotificationType) || NotificationType.INFORMATION,
        title: title || 'Notification de test',
        message: message || 'Ceci est une notification de test',
      },
    });

    res.status(201).json({
      message: 'Notification de test envoyée',
      data: notification,
    });
  } catch (error) {
    throw error;
  }
};

export const sendSystemAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, message } = req.body;

    // Envoyer à tous les utilisateurs avec le rôle ADMIN
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ADMIN_ROLES,
        },
      },
    });

    const notifications = await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: NotificationType.ALERTE_SYSTEME,
            title: title || 'Alerte système',
            message: message || 'Alerte système importante',
          },
        })
      )
    );

    res.status(201).json({
      message: `Alerte envoyée à ${notifications.length} administrateur(s)`,
      data: { count: notifications.length },
    });
  } catch (error) {
    throw error;
  }
};

