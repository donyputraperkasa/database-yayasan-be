ALTER TABLE `schools`
  ADD COLUMN `archivedAt` DATETIME(3) NULL;

CREATE INDEX `schools_archivedAt_idx` ON `schools`(`archivedAt`);
