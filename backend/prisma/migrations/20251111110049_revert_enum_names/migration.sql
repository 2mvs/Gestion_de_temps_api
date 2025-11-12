/*
  Warnings:

  - You are about to alter the column `absenceType` on the `absences` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(9))`.
  - You are about to alter the column `status` on the `absences` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(11))` to `Enum(EnumId(13))`.
  - You are about to alter the column `gender` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(12))` to `Enum(EnumId(1))`.
  - You are about to alter the column `contractType` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(13))` to `Enum(EnumId(2))`.
  - You are about to alter the column `status` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(14))` to `Enum(EnumId(3))`.
  - You are about to alter the column `status` on the `overtimes` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Enum(EnumId(13))`.
  - You are about to alter the column `periodType` on the `periods` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(7))` to `Enum(EnumId(6))`.
  - The values [HEURES_DE_NUIT,PERSONNALISE] on the enum `schedules_scheduleType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `hourType` on the `special_hours` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(12))`.
  - You are about to alter the column `status` on the `special_hours` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(8))` to `Enum(EnumId(13))`.
  - You are about to alter the column `status` on the `time_entries` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(9))` to `Enum(EnumId(8))`.
  - You are about to alter the column `rangeType` on the `time_ranges` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(10))` to `Enum(EnumId(7))`.
  - You are about to alter the column `cycleType` on the `work_cycles` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(6))` to `Enum(EnumId(4))`.

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
DROP INDEX `periods_scheduleId_fkey` ON `periods`;

-- DropIndex
DROP INDEX `special_hours_employeeId_fkey` ON `special_hours`;

-- DropIndex
DROP INDEX `time_ranges_periodId_fkey` ON `time_ranges`;

-- DropIndex
DROP INDEX `work_cycle_schedules_scheduleId_fkey` ON `work_cycle_schedules`;

-- AlterTable
ALTER TABLE `absences` MODIFY `absenceType` ENUM('VACATION', 'SICK_LEAVE', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'UNPAID_LEAVE', 'OTHER') NOT NULL DEFAULT 'VACATION',
    MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `employees` MODIFY `gender` ENUM('MALE', 'FEMALE', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    MODIFY `contractType` ENUM('FULL_TIME', 'PART_TIME', 'INTERIM', 'CONTRACT') NOT NULL DEFAULT 'FULL_TIME',
    MODIFY `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `overtimes` MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `periods` MODIFY `periodType` ENUM('REGULAR', 'BREAK', 'OVERTIME', 'SPECIAL') NOT NULL DEFAULT 'REGULAR';

-- AlterTable
ALTER TABLE `schedules` MODIFY `scheduleType` ENUM('STANDARD', 'NIGHT_SHIFT', 'FLEXIBLE', 'CUSTOM') NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE `special_hours` MODIFY `hourType` ENUM('HOLIDAY', 'NIGHT_SHIFT', 'WEEKEND', 'ON_CALL') NOT NULL DEFAULT 'HOLIDAY',
    MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `time_entries` MODIFY `status` ENUM('PENDING', 'COMPLETED', 'INCOMPLETE', 'ABSENT') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `time_ranges` MODIFY `rangeType` ENUM('NORMAL', 'OVERTIME', 'NIGHT_SHIFT', 'SUNDAY', 'HOLIDAY', 'SPECIAL') NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE `work_cycles` MODIFY `cycleType` ENUM('DAILY', 'WEEKLY', 'MONTHLY') NOT NULL DEFAULT 'WEEKLY';

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
