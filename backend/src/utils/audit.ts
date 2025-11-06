import prisma from '../config/database';

export interface AuditLogData {
  userId: number;
  action: string;
  modelType: string;
  modelId?: number;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        modelType: data.modelType,
        modelId: data.modelId,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
        newValue: data.newValue ? JSON.stringify(data.newValue) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la création du log d\'audit:', error);
  }
};

