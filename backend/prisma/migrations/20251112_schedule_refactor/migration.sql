-- Drop legacy relations
ALTER TABLE `employees` DROP FOREIGN KEY `employees_workCycleId_fkey`;

DROP TABLE IF EXISTS `time_ranges`;
DROP TABLE IF EXISTS `periods`;
DROP TABLE IF EXISTS `work_cycle_schedules`;
DROP TABLE IF EXISTS `schedules`;
DROP TABLE IF EXISTS `work_cycles`;

-- Create new work schedules table
CREATE TABLE `work_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `abbreviation` VARCHAR(191) NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `theoreticalDayHours` DOUBLE NULL,
    `theoreticalMorningHours` DOUBLE NULL,
    `theoreticalAfternoonHours` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create work schedule slots
CREATE TABLE `work_schedule_slots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scheduleId` INTEGER NOT NULL,
    `slotType` ENUM('ENTRY_GRACE', 'BREAK', 'OVERTIME', 'SPECIAL') NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    INDEX `work_schedule_slots_scheduleId_idx`(`scheduleId`),
    CONSTRAINT `work_schedule_slots_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `work_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create new work cycles table
CREATE TABLE `work_cycles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `abbreviation` VARCHAR(191) NULL,
    `scheduleId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`),
    INDEX `work_cycles_scheduleId_idx`(`scheduleId`),
    CONSTRAINT `work_cycles_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `work_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Recreate foreign key from employees to work cycles
ALTER TABLE `employees`
    ADD CONSTRAINT `employees_workCycleId_fkey`
    FOREIGN KEY (`workCycleId`) REFERENCES `work_cycles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

