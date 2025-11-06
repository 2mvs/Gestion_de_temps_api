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

  // Créer des cycles de travail
  const cycle40h = await prisma.workCycle.create({
    data: {
      name: 'Cycle standard 40h',
      abbreviation: 'STD40',
      description: 'Cycle de travail standard de 40 heures par semaine',
      cycleType: 'WEEKLY',
      cycleDays: 7,
      weeklyHours: 40,
      overtimeThreshold: 40,
    },
  });

  const cycle35h = await prisma.workCycle.create({
    data: {
      name: 'Cycle 35h',
      abbreviation: 'STD35',
      description: 'Cycle de travail de 35 heures par semaine',
      cycleType: 'WEEKLY',
      cycleDays: 7,
      weeklyHours: 35,
      overtimeThreshold: 35,
    },
  });

  console.log('✅ Cycles de travail créés');

  // Créer des horaires pour le cycle 40h
  const schedule1 = await prisma.schedule.create({
    data: {
      label: 'Lundi - Vendredi 8h-17h',
      abbreviation: 'LV_8_17',
      scheduleType: 'STANDARD',
      workCycleId: cycle40h.id,
      totalHours: 8,
      breakDuration: 60,
    },
  });

  console.log('✅ Horaires créés');

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

