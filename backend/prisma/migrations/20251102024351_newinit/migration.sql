/*
  Warnings:

  - You are about to drop the column `workCycleId` on the `schedules` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `absences_approvedBy_fkey` ON `absences`;

-- DropIndex
DROP INDEX `absences_employeeId_fkey` ON `absences`;

-- DropIndex
DROP INDEX `audit_logs_userId_fkey` ON `audit_logs`;

-- DropIndex
DROP INDEX `employees_organizationalUnitId_fkey` ON `employees`;

-- DropIndex
DROP INDEX `employees_workCycleId_fkey` ON `employees`;

-- DropIndex
DROP INDEX `notifications_userId_fkey` ON `notifications`;

-- DropIndex
DROP INDEX `organizational_units_parentId_fkey` ON `organizational_units`;

-- DropIndex
DROP INDEX `overtimes_employeeId_fkey` ON `overtimes`;

-- DropIndex
DROP INDEX `schedules_workCycleId_fkey` ON `schedules`;

-- DropIndex
DROP INDEX `special_hours_employeeId_fkey` ON `special_hours`;

-- AlterTable
ALTER TABLE `schedules` DROP COLUMN `workCycleId`,
    MODIFY `startTime` VARCHAR(191) NULL,
    MODIFY `endTime` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `work_cycle_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workCycleId` INTEGER NOT NULL,
    `scheduleId` INTEGER NOT NULL,
    `dayOfWeek` INTEGER NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `work_cycle_schedules_workCycleId_scheduleId_dayOfWeek_key`(`workCycleId`, `scheduleId`, `dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scheduleId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `periodType` ENUM('REGULAR', 'BREAK', 'OVERTIME', 'SPECIAL') NOT NULL DEFAULT 'REGULAR',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `time_ranges` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `periodId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `rangeType` ENUM('NORMAL', 'OVERTIME', 'NIGHT_SHIFT', 'SUNDAY', 'HOLIDAY', 'SPECIAL') NOT NULL DEFAULT 'NORMAL',
    `multiplier` DOUBLE NOT NULL DEFAULT 1.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_organizationalUnitId_fkey` FOREIGN KEY (`organizationalUnitId`) REFERENCES `organizational_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_workCycleId_fkey` FOREIGN KEY (`workCycleId`) REFERENCES `work_cycles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizational_units` ADD CONSTRAINT `organizational_units_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `organizational_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_cycle_schedules` ADD CONSTRAINT `work_cycle_schedules_workCycleId_fkey` FOREIGN KEY (`workCycleId`) REFERENCES `work_cycles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_cycle_schedules` ADD CONSTRAINT `work_cycle_schedules_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periods` ADD CONSTRAINT `periods_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_ranges` ADD CONSTRAINT `time_ranges_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `periods`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_entries` ADD CONSTRAINT `time_entries_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absences` ADD CONSTRAINT `absences_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absences` ADD CONSTRAINT `absences_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `overtimes` ADD CONSTRAINT `overtimes_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `special_hours` ADD CONSTRAINT `special_hours_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
