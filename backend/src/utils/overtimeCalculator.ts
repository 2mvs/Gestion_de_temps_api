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
    label: string;
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
 * Calcule les heures travaillées en décomposant par plages horaires
 */
export async function calculateHoursWorked(
  timeEntry: TimeEntryData
): Promise<CalculatedHours> {
  const { employeeId, clockInTime, clockOutTime, date } = timeEntry;

  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      deletedAt: null,
    },
    include: {
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

  if (!employee || !employee.workCycle) {
    throw new Error('Employé sans cycle de travail assigné');
  }

  const schedule = employee.workCycle.schedule;

  if (!schedule) {
    const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
    const totalHours = hoursWorked;
    return {
      normalHours: totalHours,
      overtimeHours: 0,
      specialHours: 0,
      breakdown: {
        normal: totalHours,
        overtime: 0,
        nightShift: 0,
        sunday: isSunday(date) ? totalHours : 0,
        holiday: isHoliday(date) ? totalHours : 0,
        other: 0,
      },
      ranges: [],
    };
  }

  const totalMinutesWorked = Math.round(
    (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60)
  );
  const clockInMinutes = clockInTime.getHours() * 60 + clockInTime.getMinutes();
  let clockOutMinutes = clockOutTime.getHours() * 60 + clockOutTime.getMinutes();

  if (clockOutMinutes < clockInMinutes) {
    clockOutMinutes += 1440;
  }

  let scheduledStart = timeToMinutes(schedule.startTime);
  let scheduledEnd = timeToMinutes(schedule.endTime);
  if (scheduledEnd <= scheduledStart) {
    scheduledEnd += 1440;
  }

  const slots = schedule.slots || [];

  let normalMinutes = totalMinutesWorked;
  let overtimeMinutes = 0;
  let specialMinutes = 0;
  let breakMinutes = 0;

  const ranges: Array<{
    start: string;
    end: string;
    hours: number;
    type: string;
    multiplier: number;
  }> = [];

  // Heures supplémentaires avant l'horaire prévu
  if (clockInMinutes < scheduledStart) {
    const minutes = Math.min(scheduledStart - clockInMinutes, totalMinutesWorked);
    overtimeMinutes += Math.max(minutes, 0);
    normalMinutes -= Math.max(minutes, 0);
  }

  // Heures supplémentaires après l'horaire prévu
  if (clockOutMinutes > scheduledEnd) {
    const minutes = clockOutMinutes - Math.max(scheduledEnd, clockInMinutes);
    overtimeMinutes += Math.max(minutes, 0);
    normalMinutes -= Math.max(minutes, 0);
  }

  for (const slot of slots) {
    let slotStart = timeToMinutes(slot.startTime);
    let slotEnd = timeToMinutes(slot.endTime);
    if (slotEnd <= slotStart) {
      slotEnd += 1440;
    }

    const overlapStart = Math.max(clockInMinutes, slotStart);
    const overlapEnd = Math.min(clockOutMinutes, slotEnd);

    if (overlapStart < overlapEnd) {
      const minutes = overlapEnd - overlapStart;
      const hours = minutesToHours(minutes);
      const slotLabel = slot.label || slot.slotType;
      const slotMultiplier =
        slot.multiplier !== undefined && slot.multiplier !== null
          ? slot.multiplier
          : slot.slotType === 'OVERTIME'
          ? 1.25
          : slot.slotType === 'SPECIAL'
          ? 1.5
          : 1.0;

      ranges.push({
        start: `${Math.floor(overlapStart / 60)}:${String(overlapStart % 60).padStart(2, '0')}`,
        end: `${Math.floor(overlapEnd / 60)}:${String(overlapEnd % 60).padStart(2, '0')}`,
        hours,
        label: slotLabel,
        type: slot.slotType,
        multiplier: slotMultiplier,
      });

      switch (slot.slotType) {
        case 'BREAK':
          breakMinutes += minutes;
          normalMinutes -= minutes;
          break;
        case 'OVERTIME':
          overtimeMinutes += minutes;
          normalMinutes -= minutes;
          break;
        case 'SPECIAL':
          specialMinutes += minutes;
          normalMinutes -= minutes;
          break;
        case 'ENTRY_GRACE':
        default:
          // compté comme normal
          break;
      }
    }
  }

  if (normalMinutes < 0) normalMinutes = 0;
  if (overtimeMinutes < 0) overtimeMinutes = 0;
  if (specialMinutes < 0) specialMinutes = 0;
  if (breakMinutes < 0) breakMinutes = 0;

  const normalHours = minutesToHours(normalMinutes);
  const overtimeHours = minutesToHours(overtimeMinutes);
  const slotSpecialHours = minutesToHours(specialMinutes);

  const breakdown = {
    normal: normalHours,
    overtime: overtimeHours,
    nightShift: 0,
    sunday: isSunday(date) ? minutesToHours(totalMinutesWorked) : 0,
    holiday: isHoliday(date) ? minutesToHours(totalMinutesWorked) : 0,
    other: minutesToHours(breakMinutes),
  };

  const specialHours = slotSpecialHours + breakdown.sunday + breakdown.holiday;

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

