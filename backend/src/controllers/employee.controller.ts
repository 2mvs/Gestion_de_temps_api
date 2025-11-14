import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  ApprovalStatus,
  ContractType,
  EmployeeStatus,
  Gender,
  TimeEntryStatus,
  UserRole,
} from '@prisma/client';
import prisma from '../config/database';
import { CustomError } from '../middlewares/error.middleware';
import { createAuditLog } from '../utils/audit';
import { managerHasAccessToEmployee, managerHasAccessToUnit } from '../utils/access';
import { isManagerRole } from '../utils/roles';
import { calculateHoursWorked } from '../utils/overtimeCalculator';

export const getEmployeePayslip = async (req: Request, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }
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

    if (!employee) {
      throw new CustomError('Employé non trouvé', 404);
    }

    if (isManagerRole(requester.role)) {
      const hasAccess = await managerHasAccessToEmployee(requester.userId, employee.id);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
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
        status: TimeEntryStatus.TERMINE,
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
        status: ApprovalStatus.APPROUVE,
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
        status: ApprovalStatus.APPROUVE,
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
        status: ApprovalStatus.APPROUVE,
      },
    });

    // Calculer les totaux via le moteur de calcul
    let totalNormalHours = 0;
    let totalCalculatedOvertime = 0;
    let totalCalculatedSpecial = 0;

    const enrichedTimeEntries = await Promise.all(
      timeEntries.map(async (entry) => {
        if (!entry.clockIn || !entry.clockOut) {
          return {
            ...entry,
            calculatedHours: null,
          };
        }

        const calculated = await calculateHoursWorked({
          employeeId: employee.id,
          clockInTime: entry.clockIn,
          clockOutTime: entry.clockOut,
          date: entry.date,
        });

        totalNormalHours += calculated.normalHours;
        totalCalculatedOvertime += calculated.overtimeHours;
        totalCalculatedSpecial += calculated.specialHours;

        return {
          ...entry,
          calculatedHours: calculated,
        };
      })
    );

    // Tenir compte des enregistrements approuvés (manuels ou automatiques)
    const approvedOvertimeHours = overtimes.reduce((sum, ot) => sum + (ot.hours || 0), 0);
    const approvedSpecialHours = specialHours.reduce((sum, sh) => sum + (sh.hours || 0), 0);

    const totalBreakHours = enrichedTimeEntries.reduce(
      (sum, entry) => sum + (entry.calculatedHours?.breakdown.other || 0),
      0
    );

    const totalHours = totalNormalHours;
    const totalOvertimeHours = Math.max(totalCalculatedOvertime, approvedOvertimeHours);
    const totalSpecialHours = Math.max(totalCalculatedSpecial, approvedSpecialHours);
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
          totalBreakHours: Math.round(totalBreakHours * 100) / 100,
          totalAbsenceDays,
          workDays: timeEntries.length,
        },
        timeEntries: enrichedTimeEntries,
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
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }
    const where: any = {
      deletedAt: null,
    };

    if (isManagerRole(requester.role)) {
      where.organizationalUnit = {
        managerId: requester.userId,
      };
    }

    const employees = await prisma.employee.findMany({
      where,
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
            label: true,
            abbreviation: true,
            schedule: {
              select: {
                id: true,
                label: true,
                startTime: true,
                endTime: true,
                theoreticalDayHours: true,
                theoreticalMorningHours: true,
                theoreticalAfternoonHours: true,
                slots: {
                  select: {
                    id: true,
                    slotType: true,
                    startTime: true,
                    endTime: true,
                    label: true,
                    multiplier: true,
                  },
                  orderBy: {
                    startTime: 'asc',
                  },
                },
              },
            },
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
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }
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

    if (isManagerRole(requester.role)) {
      const hasAccess = await managerHasAccessToEmployee(requester.userId, employee.id);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    res.json({ data: employee });
  } catch (error) {
    throw error;
  }
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }
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

    if (isManagerRole(requester.role)) {
      if (!organizationalUnitId) {
        throw new CustomError('Vous devez sélectionner une unité organisationnelle', 403);
      }
      const unitId = parseInt(organizationalUnitId);
      if (Number.isNaN(unitId)) {
        throw new CustomError('Unité organisationnelle invalide', 400);
      }
      const hasUnitAccess = await managerHasAccessToUnit(requester.userId, unitId);
      if (!hasUnitAccess) {
        throw new CustomError('Accès refusé pour cette unité organisationnelle', 403);
      }
    }

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
      userId: requester.userId,
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
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }
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

    if (isManagerRole(requester.role)) {
      const hasAccess = await managerHasAccessToEmployee(requester.userId, oldEmployee.id);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
      if (
        organizationalUnitId !== undefined &&
        organizationalUnitId !== null &&
        parseInt(organizationalUnitId) !== oldEmployee.organizationalUnitId
      ) {
        throw new CustomError('Vous ne pouvez pas modifier l\'unité organisationnelle assignée', 403);
      }
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
      userId: requester.userId,
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
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }
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

    if (isManagerRole(requester.role)) {
      const hasAccess = await managerHasAccessToEmployee(requester.userId, employee.id);
      if (!hasAccess) {
        throw new CustomError('Accès refusé', 403);
      }
    }

    // Soft delete
    await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
        status: EmployeeStatus.RESILIE,
      },
    });

    // Créer un log d'audit
    await createAuditLog({
      userId: requester.userId,
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

export const linkEmployeeAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }
    const { id } = req.params;
    const { email, password, role } = req.body;

    if (!email || typeof email !== 'string') {
      throw new CustomError('Un email valide est requis', 400);
    }

    let requestedRole: UserRole | undefined;
    if (role !== undefined && role !== null) {
      const normalizedRole = String(role).toUpperCase();
      if (!Object.values(UserRole).includes(normalizedRole as UserRole)) {
        throw new CustomError('Rôle utilisateur invalide', 400);
      }
      requestedRole = normalizedRole as UserRole;
    }

    const employeeId = parseInt(id);
    if (Number.isNaN(employeeId)) {
      throw new CustomError('Identifiant employé invalide', 400);
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        deletedAt: null,
      },
      include: {
        user: true,
      },
    });

    if (!employee) {
      throw new CustomError('Employé non trouvé', 404);
    }

    const wasLinked = Boolean(employee.userId);

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (existingUser && existingUser.employee && existingUser.employee.id !== employee.id) {
      throw new CustomError(
        `Cet utilisateur est déjà associé à ${existingUser.employee.firstName} ${existingUser.employee.lastName}`,
        400
      );
    }

    let userSummary: { id: number; email: string; role: string };

    if (!existingUser) {
      if (!password || typeof password !== 'string' || password.length < 6) {
        throw new CustomError('Un mot de passe de minimum 6 caractères est requis pour créer un nouvel utilisateur', 400);
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const targetRole = requestedRole ?? UserRole.UTILISATEUR;
      const createdUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          role: targetRole,
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });
      userSummary = createdUser;
    } else {
      const updateData: any = {};

      if (requestedRole && requestedRole !== existingUser.role) {
        updateData.role = requestedRole;
      }

      if (password && typeof password === 'string') {
        if (password.length < 6) {
          throw new CustomError('Le mot de passe doit contenir au moins 6 caractères', 400);
        }
        updateData.password = await bcrypt.hash(password, 10);
      }

      if (Object.keys(updateData).length > 0) {
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: updateData,
          select: {
            id: true,
            email: true,
            role: true,
          },
        });
        userSummary = updatedUser;
      } else {
        userSummary = {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
        };
      }
    }

    const employeeUpdateData: any = { userId: userSummary.id };

    if (!employee.email) {
      employeeUpdateData.email = normalizedEmail;
    }

    await prisma.employee.update({
      where: { id: employee.id },
      data: employeeUpdateData,
    });

    if (requester?.userId) {
      await createAuditLog({
        userId: requester.userId,
        action: employee.userId ? 'UPDATE' : 'CREATE',
        modelType: 'EmployeeUserLink',
        modelId: employee.id,
        newValue: {
          employeeId: employee.id,
          userId: userSummary.id,
          email: userSummary.email,
          role: userSummary.role,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }

    res.json({
      message: wasLinked ? 'Accès employé mis à jour avec succès' : 'Accès employé activé avec succès',
      data: {
        employeeId: employee.id,
        user: userSummary,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const bulkImportEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      throw new CustomError('Non authentifié', 401);
    }
    const employees = req.body;

    if (!Array.isArray(employees) || employees.length === 0) {
      throw new CustomError('Données invalides', 400);
    }

    let createdCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];

    for (const empData of employees) {
      try {
        const existing = await prisma.employee.findUnique({
          where: { employeeNumber: empData.employeeNumber },
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        const parsedHireDate = empData.hireDate ? new Date(empData.hireDate) : undefined;
        const parsedContractType =
          (empData.contractType as ContractType) ?? ContractType.TEMPS_PLEIN;
        const parsedStatus = (empData.status as EmployeeStatus) ?? EmployeeStatus.ACTIF;
        const parsedGender = (empData.gender as Gender) ?? Gender.INCONNU;
        const parsedOrgUnitId = empData.organizationalUnitId
          ? parseInt(empData.organizationalUnitId, 10)
          : null;
        const parsedWorkCycleId = empData.workCycleId ? parseInt(empData.workCycleId, 10) : null;

        await prisma.employee.upsert({
          where: { employeeNumber: empData.employeeNumber },
          update: {
            firstName: empData.firstName,
            lastName: empData.lastName,
            email: empData.email || null,
            phone: empData.phone || null,
            gender: parsedGender,
            contractType: parsedContractType,
            status: parsedStatus,
            organizationalUnitId: parsedOrgUnitId,
            workCycleId: parsedWorkCycleId,
            ...(parsedHireDate ? { hireDate: parsedHireDate } : {}),
          },
          create: {
            employeeNumber: empData.employeeNumber,
            firstName: empData.firstName,
            lastName: empData.lastName,
            email: empData.email || null,
            phone: empData.phone || null,
            gender: parsedGender,
            hireDate: parsedHireDate ?? new Date(),
            contractType: parsedContractType,
            status: parsedStatus,
            organizationalUnitId: parsedOrgUnitId,
            workCycleId: parsedWorkCycleId,
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

