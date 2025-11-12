import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Créer un utilisateur admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gta.com' },
    update: {},
    create: {
      email: 'admin@gta.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Utilisateur admin créé:', admin.email);

  // Créer des unités organisationnelles
  const direction = await prisma.organizationalUnit.upsert({
    where: { code: 'DIR' },
    update: {},
    create: {
      code: 'DIR',
      name: 'Direction Générale',
      description: 'Direction de l\'entreprise',
      level: 0,
    },
  });

  const dsi = await prisma.organizationalUnit.upsert({
    where: { code: 'DSI' },
    update: {},
    create: {
      code: 'DSI',
      name: 'Direction des Systèmes d\'Information',
      description: 'Département IT',
      level: 1,
      parentId: direction.id,
    },
  });

  const drh = await prisma.organizationalUnit.upsert({
    where: { code: 'DRH' },
    update: {},
    create: {
      code: 'DRH',
      name: 'Direction des Ressources Humaines',
      description: 'Département RH',
      level: 1,
      parentId: direction.id,
    },
  });

  console.log('✅ Unités organisationnelles créées');

  // Créer des horaires de travail
  const scheduleStandard = await prisma.workSchedule.create({
    data: {
      label: 'Lundi - Vendredi 8h-17h',
      abbreviation: 'STD40',
      startTime: '08:00',
      endTime: '17:00',
      theoreticalDayHours: 8,
      theoreticalMorningHours: 4,
      theoreticalAfternoonHours: 4,
      slots: {
        create: [
          {
            slotType: 'BREAK',
            startTime: '12:00',
            endTime: '13:00',
            label: 'Pause déjeuner',
            multiplier: 1.0,
          },
          {
            slotType: 'OVERTIME',
            startTime: '17:00',
            endTime: '20:00',
            label: 'Heures supplémentaires soir',
            multiplier: 1.50,
          },
          {
            slotType: 'SPECIAL',
            startTime: '05:00',
            endTime: '06:00',
            label: 'Heures de nuit',
            multiplier: 1.75,
          },
        ],
      },
    },
  });

  const scheduleFlex = await prisma.workSchedule.create({
    data: {
      label: 'Lundi - Samedi 9h-16h',
      abbreviation: 'FLEX35',
      startTime: '09:00',
      endTime: '16:00',
      theoreticalDayHours: 6.5,
      theoreticalMorningHours: 3.5,
      theoreticalAfternoonHours: 3,
      slots: {
        create: [
          {
            slotType: 'BREAK',
            startTime: '12:30',
            endTime: '13:00',
            label: 'Pause midi',
            multiplier: 1.0,
          },
          {
            slotType: 'ENTRY_GRACE',
            startTime: '08:45',
            endTime: '09:15',
            label: 'Franchise d\'entrée',
            multiplier: 1.0,
          },
          {
            slotType: 'SPECIAL',
            startTime: '16:00',
            endTime: '18:00',
            label: 'Heures spéciales soir',
            multiplier: 1.60,
          },
        ],
      },
    },
  });

  console.log('✅ Horaires créés');

  // Créer des cycles de travail
  const cycle40h = await prisma.workCycle.create({
    data: {
      label: 'Cycle standard 40h',
      abbreviation: 'STD40',
      scheduleId: scheduleStandard.id,
    },
  });

  const cycle35h = await prisma.workCycle.create({
    data: {
      label: 'Cycle flexible 35h',
      abbreviation: 'FLEX35',
      scheduleId: scheduleFlex.id,
    },
  });

  console.log('✅ Cycles de travail créés');

  // Créer des employés
  const employee1 = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP001',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@gta.com',
      phone: '0612345678',
      gender: 'MALE',
      hireDate: new Date('2020-01-15'),
      contractType: 'FULL_TIME',
      status: 'ACTIVE',
      organizationalUnitId: dsi.id,
      workCycleId: cycle40h.id,
    },
  });

  const employee2 = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP002',
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@gta.com',
      phone: '0623456789',
      gender: 'FEMALE',
      hireDate: new Date('2021-03-20'),
      contractType: 'FULL_TIME',
      status: 'ACTIVE',
      organizationalUnitId: drh.id,
      workCycleId: cycle35h.id,
    },
  });

  const employee3 = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP003',
      firstName: 'Pierre',
      lastName: 'Bernard',
      email: 'pierre.bernard@gta.com',
      phone: '0634567890',
      gender: 'MALE',
      hireDate: new Date('2022-06-01'),
      contractType: 'FULL_TIME',
      status: 'ACTIVE',
      organizationalUnitId: dsi.id,
      workCycleId: cycle40h.id,
    },
  });

  console.log('✅ Employés créés');

  // Créer des pointages pour aujourd'hui
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const clockInTime1 = new Date(today);
  clockInTime1.setHours(8, 30, 0);

  const clockOutTime1 = new Date(today);
  clockOutTime1.setHours(17, 15, 0);

  await prisma.timeEntry.create({
    data: {
      employeeId: employee1.id,
      date: today,
      clockIn: clockInTime1,
      clockOut: clockOutTime1,
      totalHours: 8.75,
      status: 'COMPLETED',
    },
  });

  console.log('✅ Pointages créés');

  // Créer une demande d'absence
  await prisma.absence.create({
    data: {
      employeeId: employee2.id,
      absenceType: 'VACATION',
      startDate: new Date('2025-12-24'),
      endDate: new Date('2025-12-31'),
      days: 6,
      reason: 'Congés de fin d\'année',
      status: 'PENDING',
    },
  });

  console.log('✅ Absences créées');

  // Créer des notifications pour l'admin
  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: 'INFO',
      title: 'Bienvenue sur GTA',
      message: 'Votre système de gestion des temps et activités est prêt !',
      isRead: false,
    },
  });

  console.log('✅ Notifications créées');

  console.log('🎉 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

