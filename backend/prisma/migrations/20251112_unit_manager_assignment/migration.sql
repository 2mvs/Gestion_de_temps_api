ALTER TABLE `organizational_units`
ADD COLUMN `managerId` INTEGER NULL;

ALTER TABLE `organizational_units`
ADD CONSTRAINT `organizational_units_managerId_fkey`
FOREIGN KEY (`managerId`) REFERENCES `users`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

