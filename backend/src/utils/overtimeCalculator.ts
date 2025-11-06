import prisma from '../config/database';

interface TimeEntryData {
  employeeId: number;
  clockInTime: Date;
  clockOutTime: Date;
  date: Date;
}

interface CalculatedHours {
  normalHours: number;
  overtimeHours: number;
  specialHours: number;
  breakdown: {
    normal: number;
    overtime: number;
    nightShift: number;
    sunday: number;
    holiday: number;
    other: number;
  };
  ranges: Array<{
    start: string;
    end: string;
    hours: number;
    type: string;
    multiplier: number;
  }>;
}

/**
 * Convertit une heure string (HH:MM) en minutes depuis minuit
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convertit des minutes en heures décimales
 */
function minutesToHours(minutes: number): number {
  return minutes / 60;
}

/**
 * Vérifie si une date est un dimanche
 */
function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

/**
 * Vérifie si une date est un jour férié (à implémenter avec une table de jours fériés)
 */
function isHoliday(date: Date): boolean {
  // TODO: Implémenter la vérification des jours fériés depuis la base de données
  return false;
}

/**
 * Trouve dans quelle plage horaire se trouve un horaire donné
 */
function findTimeRange(
  hour: number,
  minute: number,
  period: any
): { range: any; minutesInRange: number } | null {
  const totalMinutes = hour * 60 + minute;

  for (const timeRange of period.timeRanges || []) {
    const rangeStart = timeToMinutes(timeRange.startTime);
    const rangeEnd = timeToMinutes(timeRange.endTime);

    if (totalMinutes >= rangeStart && totalMinutes < rangeEnd) {
      // Calculer combien de minutes sont dans cette plage
      const minutesInRange = Math.min(rangeEnd - totalMinutes, 60); // Max 60 minutes par heure
      return { range: timeRange, minutesInRange };
    }
  }

  return null;
}

/**
 * Calcule les heures travaillées en décomposant par plages horaires
 */
export async function calculateHoursWorked(
  timeEntry: TimeEntryData
): Promise<CalculatedHours> {
  const { employeeId, clockInTime, clockOutTime, date } = timeEntry;

  // 1. Récupérer l'employé et son cycle de travail
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
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
                    orderBy: {
                      startTime: 'asc',
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
    throw new Error('Employé sans cycle de travail assigné');
  }

  // 2. Trouver l'horaire correspondant au jour de la semaine
  const dayOfWeek = date.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
  const workCycleSchedule = employee.workCycle.schedules.find(
    (wcs: any) => wcs.dayOfWeek === dayOfWeek || wcs.isDefault
  );

  if (!workCycleSchedule) {
    // Pas d'horaire pour ce jour, toutes les heures sont normales
    const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
    return {
      normalHours: hoursWorked,
      overtimeHours: 0,
      specialHours: 0,
      breakdown: {
        normal: hoursWorked,
        overtime: 0,
        nightShift: 0,
        sunday: 0,
        holiday: 0,
        other: 0,
      },
      ranges: [],
    };
  }

  const schedule = workCycleSchedule.schedule;

  // 3. Extraire les heures de début et fin du pointage
  const clockInHour = clockInTime.getHours();
  const clockInMinute = clockInTime.getMinutes();
  const clockOutHour = clockOutTime.getHours();
  const clockOutMinute = clockOutTime.getMinutes();

  // 4. Calculer les heures totales travaillées
  const totalMinutesWorked = Math.round(
    (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60)
  );
  const totalHoursWorked = minutesToHours(totalMinutesWorked);

  // 5. Calculer les heures par plages horaires
  const breakdown = {
    normal: 0,
    overtime: 0,
    nightShift: 0,
    sunday: 0,
    holiday: 0,
    other: 0,
  };

  const ranges: Array<{
    start: string;
    end: string;
    hours: number;
    type: string;
    multiplier: number;
  }> = [];

  // Convertir les heures de pointage en minutes
  const clockInMinutes = clockInTime.getHours() * 60 + clockInTime.getMinutes();
  const clockOutMinutes = clockOutTime.getHours() * 60 + clockOutTime.getMinutes();

  // Si les heures traversent minuit, ajuster
  let effectiveClockOut = clockOutMinutes;
  if (effectiveClockOut < clockInMinutes) {
    effectiveClockOut += 1440; // Ajouter 24 heures
  }

  // Parcourir les périodes et calculer l'intersection avec les heures travaillées
  if (schedule.periods && schedule.periods.length > 0) {
    for (const period of schedule.periods) {
      const periodStart = timeToMinutes(period.startTime);
      const periodEnd = timeToMinutes(period.endTime);

      // Calculer l'intersection entre les heures travaillées et la période
      const intersectionStart = Math.max(clockInMinutes, periodStart);
      const intersectionEnd = Math.min(effectiveClockOut, periodEnd);

      if (intersectionStart < intersectionEnd) {
        // Il y a une intersection, parcourir les plages de cette période
        for (const timeRange of period.timeRanges || []) {
          const rangeStart = timeToMinutes(timeRange.startTime);
          const rangeEnd = timeToMinutes(timeRange.endTime);

          // Calculer l'intersection entre l'intersection période et la plage
          const rangeIntersectionStart = Math.max(intersectionStart, rangeStart);
          const rangeIntersectionEnd = Math.min(intersectionEnd, rangeEnd);

          if (rangeIntersectionStart < rangeIntersectionEnd) {
            const hours = minutesToHours(rangeIntersectionEnd - rangeIntersectionStart);

            ranges.push({
              start: `${Math.floor(rangeIntersectionStart / 60)}:${String(rangeIntersectionStart % 60).padStart(2, '0')}`,
              end: `${Math.floor(rangeIntersectionEnd / 60)}:${String(rangeIntersectionEnd % 60).padStart(2, '0')}`,
              hours,
              type: timeRange.rangeType,
              multiplier: timeRange.multiplier,
            });

            // Accumuler dans le breakdown
            switch (timeRange.rangeType) {
              case 'NORMAL':
                breakdown.normal += hours;
                break;
              case 'OVERTIME':
                breakdown.overtime += hours;
                break;
              case 'NIGHT_SHIFT':
                breakdown.nightShift += hours;
                break;
              case 'SUNDAY':
                breakdown.sunday += hours;
                break;
              case 'HOLIDAY':
                breakdown.holiday += hours;
                break;
              default:
                breakdown.other += hours;
            }
          }
        }
      }
    }
  } else {
    // Pas de périodes définies, utiliser l'horaire global
    const scheduleStart = schedule.startTime ? timeToMinutes(schedule.startTime) : 0;
    const scheduleEnd = schedule.endTime ? timeToMinutes(schedule.endTime) : 1440;

    const intersectionStart = Math.max(clockInMinutes, scheduleStart);
    const intersectionEnd = Math.min(effectiveClockOut, scheduleEnd);

    if (intersectionStart < intersectionEnd) {
      const hours = minutesToHours(intersectionEnd - intersectionStart);
      breakdown.normal += hours;
      ranges.push({
        start: `${Math.floor(intersectionStart / 60)}:${String(intersectionStart % 60).padStart(2, '0')}`,
        end: `${Math.floor(intersectionEnd / 60)}:${String(intersectionEnd % 60).padStart(2, '0')}`,
        hours,
        type: 'NORMAL',
        multiplier: 1.0,
      });
    }

    // Heures hors horaire = supplémentaires
    if (clockInMinutes < scheduleStart) {
      const hours = minutesToHours(Math.min(scheduleStart - clockInMinutes, effectiveClockOut - clockInMinutes));
      breakdown.overtime += hours;
    }
    if (effectiveClockOut > scheduleEnd) {
      const hours = minutesToHours(Math.min(effectiveClockOut - scheduleEnd, effectiveClockOut - clockInMinutes));
      breakdown.overtime += hours;
    }
  }

  // Vérifier si on est dimanche ou jour férié et appliquer les majorations
  if (isSunday(date) && breakdown.normal > 0) {
    // Majoration dimanche : les heures normales deviennent des heures dimanche
    breakdown.sunday += breakdown.normal;
    breakdown.normal = 0;
  }

  if (isHoliday(date) && breakdown.normal > 0) {
    // Majoration jour férié : les heures normales deviennent des heures fériées
    breakdown.holiday += breakdown.normal;
    breakdown.normal = 0;
  }

  // 6. Calculer les heures normales vs supplémentaires
  const weeklyHours = employee.workCycle.weeklyHours || 40;
  const cycleDays = employee.workCycle.cycleDays || 7;
  const dailyHours = weeklyHours / cycleDays;

  // Calculer les heures accumulées sur la période
  const periodStart = new Date(date);
  periodStart.setDate(periodStart.getDate() - (periodStart.getDay() || 7) + 1); // Lundi de la semaine
  periodStart.setHours(0, 0, 0, 0);

  const timeEntriesThisPeriod = await prisma.timeEntry.findMany({
    where: {
      employeeId,
      date: {
        gte: periodStart,
        lte: date,
      },
      deletedAt: null,
    },
  });

  let totalHoursThisPeriod = breakdown.normal + breakdown.overtime;
  for (const entry of timeEntriesThisPeriod) {
    if (entry.clockInTime && entry.clockOutTime) {
      const hours = (entry.clockOutTime.getTime() - entry.clockInTime.getTime()) / (1000 * 60 * 60);
      totalHoursThisPeriod += hours;
    }
  }

  // Si on dépasse les heures normales du cycle, les heures supplémentaires sont automatiquement des heures sup
  const thresholdHours = (weeklyHours / cycleDays) * (date.getDate() - periodStart.getDate() + 1);
  
  if (totalHoursThisPeriod > thresholdHours) {
    const excess = totalHoursThisPeriod - thresholdHours;
    breakdown.overtime += excess;
    breakdown.normal = Math.max(0, breakdown.normal - excess);
  }

  const normalHours = breakdown.normal;
  const overtimeHours = breakdown.overtime + breakdown.nightShift * 0.5; // Nuit = 50% de sup
  const specialHours = breakdown.sunday + breakdown.holiday + breakdown.other;

  return {
    normalHours,
    overtimeHours,
    specialHours,
    breakdown,
    ranges,
  };
}

/**
 * Crée automatiquement des enregistrements d'heures sup/spéciales si nécessaire
 */
export async function autoCreateOvertimeAndSpecialHours(
  timeEntry: TimeEntryData,
  calculatedHours: CalculatedHours
): Promise<void> {
  const { employeeId, date } = timeEntry;
  const { overtimeHours, specialHours, breakdown } = calculatedHours;

  // Créer un enregistrement d'heures supplémentaires si > 0
  if (overtimeHours > 0.25) {
    // Chercher s'il existe déjà un enregistrement pour ce jour
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existingOvertime = await prisma.overtime.findFirst({
      where: {
        employeeId,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (!existingOvertime) {
      await prisma.overtime.create({
        data: {
          employeeId,
          date: new Date(date),
          hours: Math.round(overtimeHours * 100) / 100,
          reason: `Calcul automatique basé sur l'horaire (${breakdown.overtime.toFixed(2)}h sup + ${breakdown.nightShift.toFixed(2)}h nuit)`,
          status: 'PENDING',
        },
      });
    }
  }

  // Créer un enregistrement d'heures spéciales si > 0
  if (specialHours > 0.25) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existingSpecial = await prisma.specialHour.findFirst({
      where: {
        employeeId,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (!existingSpecial) {
      const hourType =
        breakdown.sunday > 0
          ? 'WEEKEND'
          : breakdown.holiday > 0
          ? 'HOLIDAY'
          : breakdown.nightShift > 0
          ? 'NIGHT_SHIFT'
          : 'ON_CALL';

      await prisma.specialHour.create({
        data: {
          employeeId,
          date: new Date(date),
          hours: Math.round(specialHours * 100) / 100,
          hourType,
          reason: `Calcul automatique: ${breakdown.sunday > 0 ? `${breakdown.sunday.toFixed(2)}h dimanche` : ''} ${breakdown.holiday > 0 ? `${breakdown.holiday.toFixed(2)}h férié` : ''} ${breakdown.other > 0 ? `${breakdown.other.toFixed(2)}h autres` : ''}`,
          status: 'PENDING',
        },
      });
    }
  }
}

