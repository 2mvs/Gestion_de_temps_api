import { Request, Response } from 'express';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';

export const getEmployeePayslip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new CustomError('Les dates de début et de fin sont requises', 400);
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
      include: {
        organizationalUnit: true,
        workCycle: true,
      },
    });

    if (!employee) {
      throw new CustomError('Employé non trouvé', 404);
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Récupérer les pointages
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: employee.id,
        date: {
          gte: start,
          lte: end,
        },
        status: 'COMPLETED',
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Récupérer les heures supplémentaires
    const overtimes = await prisma.overtime.findMany({
      where: {
        employeeId: employee.id,
        date: {
          gte: start,
          lte: end,
        },
        status: 'APPROVED',
      },
    });

    // Récupérer les heures spéciales
    const specialHours = await prisma.specialHour.findMany({
      where: {
        employeeId: employee.id,
        date: {
          gte: start,
          lte: end,
        },
        status: 'APPROVED',
      },
    });

    // Récupérer les absences
    const absences = await prisma.absence.findMany({
      where: {
        employeeId: employee.id,
        startDate: {
          lte: end,
        },
        endDate: {
          gte: start,
        },
        status: 'APPROVED',
      },
    });

    // Calculer les totaux
    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
    const totalOvertimeHours = overtimes.reduce((sum, ot) => sum + (ot.hours || 0), 0);
    const totalSpecialHours = specialHours.reduce((sum, sh) => sum + (sh.hours || 0), 0);
    const totalAbsenceDays = absences.reduce((sum, abs) => sum + (abs.days || 0), 0);

    res.json({
      data: {
        employee: {
          id: employee.id,
          employeeNumber: employee.employeeNumber,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          organizationalUnit: employee.organizationalUnit,
          contractType: employee.contractType,
          hireDate: employee.hireDate,
        },
        period: {
          startDate: start,
          endDate: end,
        },
        summary: {
          totalHours: Math.round(totalHours * 100) / 100,
          totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
          totalSpecialHours: Math.round(totalSpecialHours * 100) / 100,
          totalAbsenceDays,
          workDays: timeEntries.length,
        },
        timeEntries,
        overtimes,
        specialHours,
        absences,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        organizationalUnit: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        workCycle: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            weeklyHours: true,
          },
        },
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

    res.json({ data: employees });
  } catch (error) {
    throw error;
  }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
      include: {
        organizationalUnit: true,
        workCycle: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!employee) {
      throw new CustomError('Employé non trouvé', 404);
    }

    res.json({ data: employee });
  } catch (error) {
    throw error;
  }
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      employeeNumber,
      firstName,
      lastName,
      email,
      phone,
      gender,
      hireDate,
      contractType,
      status,
      organizationalUnitId,
      workCycleId,
    } = req.body;

    const employee = await prisma.employee.create({
      data: {
        employeeNumber,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        gender: gender || 'UNKNOWN',
        hireDate: new Date(hireDate),
        contractType: contractType || 'FULL_TIME',
        status: status || 'ACTIVE',
        organizationalUnitId: organizationalUnitId ? parseInt(organizationalUnitId) : null,
        workCycleId: workCycleId ? parseInt(workCycleId) : null,
      },
      include: {
        organizationalUnit: true,
        workCycle: true,
      },
    });

    // Créer un log d'audit
    await createAuditLog({
      userId: req.user!.userId,
      action: 'CREATE',
      modelType: 'Employee',
      modelId: employee.id,
      newValue: employee,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      message: 'Employé créé avec succès',
      data: employee,
    });
  } catch (error) {
    throw error;
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      hireDate,
      contractType,
      status,
      organizationalUnitId,
      workCycleId,
    } = req.body;

    // Récupérer l'ancienne valeur
    const oldEmployee = await prisma.employee.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
    });

    if (!oldEmployee) {
      throw new CustomError('Employé non trouvé', 404);
    }

    const employee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        gender,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        contractType,
        status,
        organizationalUnitId: organizationalUnitId ? parseInt(organizationalUnitId) : null,
        workCycleId: workCycleId ? parseInt(workCycleId) : null,
      },
      include: {
        organizationalUnit: true,
        workCycle: true,
      },
    });

    // Créer un log d'audit
    await createAuditLog({
      userId: req.user!.userId,
      action: 'UPDATE',
      modelType: 'Employee',
      modelId: employee.id,
      oldValue: oldEmployee,
      newValue: employee,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Employé mis à jour avec succès',
      data: employee,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
    });

    if (!employee) {
      throw new CustomError('Employé non trouvé', 404);
    }

    // Soft delete
    await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
        status: 'TERMINATED',
      },
    });

    // Créer un log d'audit
    await createAuditLog({
      userId: req.user!.userId,
      action: 'DELETE',
      modelType: 'Employee',
      modelId: parseInt(id),
      oldValue: employee,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'Employé supprimé avec succès' });
  } catch (error) {
    throw error;
  }
};

export const bulkImportEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const employees = req.body;

    if (!Array.isArray(employees) || employees.length === 0) {
      throw new CustomError('Données invalides', 400);
    }

    let createdCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];

    for (const empData of employees) {
      try {
        // Vérifier si l'employé existe déjà
        const existing = await prisma.employee.findUnique({
          where: { employeeNumber: empData.employeeNumber },
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        await prisma.employee.create({
          data: {
            employeeNumber: empData.employeeNumber,
            firstName: empData.firstName,
            lastName: empData.lastName,
            email: empData.email || null,
            phone: empData.phone || null,
            gender: empData.gender || 'UNKNOWN',
            hireDate: new Date(empData.hireDate),
            contractType: empData.contractType || 'FULL_TIME',
            status: empData.status || 'ACTIVE',
            organizationalUnitId: empData.organizationalUnitId
              ? parseInt(empData.organizationalUnitId)
              : null,
            workCycleId: empData.workCycleId ? parseInt(empData.workCycleId) : null,
          },
        });

        createdCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push({
          employeeNumber: empData.employeeNumber,
          error: err.message,
        });
      }
    }

    res.json({
      message: 'Import terminé',
      data: {
        createdCount,
        skippedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    throw error;
  }
};

