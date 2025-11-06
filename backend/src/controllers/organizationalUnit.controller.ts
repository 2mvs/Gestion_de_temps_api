import { Request, Response } from 'express';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';

export const getAllOrganizationalUnits = async (req: Request, res: Response): Promise<void> => {
  try {
    const units = await prisma.organizationalUnit.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            code: true,
            name: true,
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
        level: 'asc',
      },
    });

    res.json({ data: units });
  } catch (error) {
    throw error;
  }
};

export const getOrganizationalUnitTree = async (req: Request, res: Response): Promise<void> => {
  try {
    // Récupérer toutes les unités racines (sans parent)
    const rootUnits = await prisma.organizationalUnit.findMany({
      where: {
        parentId: null,
        deletedAt: null,
      },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: {
                  include: {
                    employees: {
                      select: {
                        id: true,
                        employeeNumber: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
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
    });

    res.json({ data: rootUnits });
  } catch (error) {
    throw error;
  }
};

export const getRootOrganizationalUnits = async (req: Request, res: Response): Promise<void> => {
  try {
    const rootUnits = await prisma.organizationalUnit.findMany({
      where: {
        parentId: null,
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
      },
    });

    res.json({ data: rootUnits });
  } catch (error) {
    throw error;
  }
};

export const getOrganizationalUnitById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const unit = await prisma.organizationalUnit.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
      include: {
        parent: true,
        children: true,
        employees: true,
      },
    });

    if (!unit) {
      throw new CustomError('Unité organisationnelle non trouvée', 404);
    }

    res.json({ data: unit });
  } catch (error) {
    throw error;
  }
};

export const getOrganizationalUnitChildren = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const children = await prisma.organizationalUnit.findMany({
      where: {
        parentId: parseInt(id),
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
      },
    });

    res.json({ data: children });
  } catch (error) {
    throw error;
  }
};

export const createOrganizationalUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, description, level, parentId } = req.body;

    const unit = await prisma.organizationalUnit.create({
      data: {
        code,
        name,
        description: description || null,
        level: level || 0,
        parentId: parentId ? parseInt(parentId) : null,
      },
      include: {
        parent: true,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      modelType: 'OrganizationalUnit',
      modelId: unit.id,
      newValue: unit,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Unité organisationnelle créée avec succès',
      data: unit,
    });
  } catch (error) {
    throw error;
  }
};

export const updateOrganizationalUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { code, name, description, level, parentId } = req.body;

    const oldUnit = await prisma.organizationalUnit.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
    });

    if (!oldUnit) {
      throw new CustomError('Unité organisationnelle non trouvée', 404);
    }

    const unit = await prisma.organizationalUnit.update({
      where: { id: parseInt(id) },
      data: {
        code,
        name,
        description: description || null,
        level,
        parentId: parentId ? parseInt(parentId) : null,
      },
      include: {
        parent: true,
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      modelType: 'OrganizationalUnit',
      modelId: unit.id,
      oldValue: oldUnit,
      newValue: unit,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Unité organisationnelle mise à jour avec succès',
      data: unit,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteOrganizationalUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const unit = await prisma.organizationalUnit.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
      include: {
        children: true,
        employees: true,
      },
    });

    if (!unit) {
      throw new CustomError('Unité organisationnelle non trouvée', 404);
    }

    if (unit.children.length > 0) {
      throw new CustomError('Impossible de supprimer une unité ayant des sous-unités', 400);
    }

    if (unit.employees.length > 0) {
      throw new CustomError('Impossible de supprimer une unité ayant des employés', 400);
    }

    await prisma.organizationalUnit.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      modelType: 'OrganizationalUnit',
      modelId: parseInt(id),
      oldValue: unit,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'Unité organisationnelle supprimée avec succès' });
  } catch (error) {
    throw error;
  }
};

