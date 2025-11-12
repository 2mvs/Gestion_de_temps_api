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
DROP INDEX `organizational_units_managerId_fkey` ON `organizational_units`;

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

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_organizationalUnitId_fkey` FOREIGN KEY (`organizationalUnitId`) REFERENCES `organizational_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_workCycleId_fkey` FOREIGN KEY (`workCycleId`) REFERENCES `work_cycles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizational_units` ADD CONSTRAINT `organizational_units_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `organizational_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizational_units` ADD CONSTRAINT `organizational_units_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
