import { Request, Response } from 'express';
import prisma from '../config/database';

export const getGeneralReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalEmployees = await prisma.employee.count({
      where: { deletedAt: null, status: 'ACTIVE' },
    });

    const totalWorkCycles = await prisma.workCycle.count({
      where: { deletedAt: null },
    });

    const totalOrganizationalUnits = await prisma.organizationalUnit.count({
      where: { deletedAt: null },
    });

    const pendingAbsences = await prisma.absence.count({
      where: { status: 'PENDING' },
    });

    const pendingOvertimes = await prisma.overtime.count({
      where: { status: 'PENDING' },
    });

    res.json({
      data: {
        totalEmployees,
        totalWorkCycles,
        totalOrganizationalUnits,
        pendingAbsences,
        pendingOvertimes,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getEmployeesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationalUnitId, status, contractType } = req.query;

    const where: any = {
      deletedAt: null,
    };

    if (organizationalUnitId) {
      where.organizationalUnitId = parseInt(organizationalUnitId as string);
    }

    if (status) {
      where.status = status;
    }

    if (contractType) {
      where.contractType = contractType;
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
              },
            },
          },
        },
      },
    });

    const byStatus = await prisma.employee.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    });

    const byContractType = await prisma.employee.groupBy({
      by: ['contractType'],
      where: { deletedAt: null },
      _count: true,
    });

    res.json({
      data: {
        employees,
        statistics: {
          byStatus,
          byContractType,
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getMonthlyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      res.status(400).json({ message: 'Année et mois requis' });
      return;
    }

    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const absences = await prisma.absence.findMany({
      where: {
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
    const totalAbsenceDays = absences.reduce((sum, absence) => sum + absence.days, 0);

    res.json({
      data: {
        period: {
          year: parseInt(year as string),
          month: parseInt(month as string),
          startDate,
          endDate,
        },
        summary: {
          totalTimeEntries: timeEntries.length,
          totalHours: Math.round(totalHours * 100) / 100,
          totalAbsences: absences.length,
          totalAbsenceDays: Math.round(totalAbsenceDays * 100) / 100,
        },
        timeEntries,
        absences,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getAttendanceReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ message: 'Dates de début et de fin requises' });
      return;
    }

    const where: any = {
      date: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      },
    };

    if (employeeId) {
      where.employeeId = parseInt(employeeId as string);
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ employeeId: 'asc' }, { date: 'asc' }],
    });

    // Grouper par employé
    const byEmployee = timeEntries.reduce((acc: any, entry) => {
      const empId = entry.employeeId;
      if (!acc[empId]) {
        acc[empId] = {
          employee: entry.employee,
          totalDays: 0,
          totalHours: 0,
          entries: [],
        };
      }
      acc[empId].totalDays++;
      acc[empId].totalHours += entry.totalHours || 0;
      acc[empId].entries.push(entry);
      return acc;
    }, {});

    res.json({
      data: {
        period: { startDate, endDate },
        byEmployee: Object.values(byEmployee),
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getOvertimeSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    const where: any = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (employeeId) {
      where.employeeId = parseInt(employeeId as string);
    }

    const overtimes = await prisma.overtime.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ employeeId: 'asc' }, { date: 'desc' }],
    });

    // Grouper par employé
    const byEmployee = overtimes.reduce((acc: any, overtime) => {
      const empId = overtime.employeeId;
      if (!acc[empId]) {
        acc[empId] = {
          employee: overtime.employee,
          totalHours: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        };
      }
      acc[empId].totalHours += overtime.hours;
      if (overtime.status === 'APPROVED') acc[empId].approved += overtime.hours;
      if (overtime.status === 'PENDING') acc[empId].pending += overtime.hours;
      if (overtime.status === 'REJECTED') acc[empId].rejected += overtime.hours;
      return acc;
    }, {});

    res.json({
      data: {
        period: startDate && endDate ? { startDate, endDate } : null,
        summary: Object.values(byEmployee),
        details: overtimes,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const exportReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.params;

    // Pour l'instant, on retourne un message simple
    // Dans une version complète, on générerait un fichier Excel/CSV
    res.json({
      message: `Export du rapport ${type} non encore implémenté`,
      note: 'Cette fonctionnalité nécessiterait une bibliothèque comme xlsx ou csv-writer',
    });
  } catch (error) {
    throw error;
  }
};

