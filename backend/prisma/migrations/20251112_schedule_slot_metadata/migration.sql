-- Alter table to add metadata for work schedule slots
ALTER TABLE `work_schedule_slots`
    ADD COLUMN `label` VARCHAR(191) NULL,
    ADD COLUMN `multiplier` DOUBLE NOT NULL DEFAULT 1.0;

