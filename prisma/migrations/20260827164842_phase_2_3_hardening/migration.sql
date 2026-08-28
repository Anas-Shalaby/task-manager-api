/*
  Warnings:

  - You are about to drop the column `target` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ActivityLog` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `ActivityLog` DROP FOREIGN KEY `ActivityLog_userId_fkey`;

-- AlterTable
ALTER TABLE `ActivityLog` DROP COLUMN `target`,
    DROP COLUMN `userId`,
    ADD COLUMN `actorId` VARCHAR(191) NULL,
    ADD COLUMN `changes` JSON NULL,
    ADD COLUMN `entityId` VARCHAR(191) NULL,
    ADD COLUMN `entityType` VARCHAR(191) NOT NULL DEFAULT 'TASK',
    ADD COLUMN `metadata` JSON NULL;

-- CreateIndex
CREATE INDEX `ActivityLog_actorId_createdAt_idx` ON `ActivityLog`(`actorId`, `createdAt`);

-- CreateIndex
CREATE INDEX `ActivityLog_entityType_entityId_createdAt_idx` ON `ActivityLog`(`entityType`, `entityId`, `createdAt`);

-- CreateIndex
CREATE INDEX `Task_status_deadline_idx` ON `Task`(`status`, `deadline`);

-- CreateIndex
CREATE INDEX `Task_priority_status_idx` ON `Task`(`priority`, `status`);

-- CreateIndex
CREATE INDEX `Task_updatedAt_idx` ON `Task`(`updatedAt`);

-- CreateIndex
CREATE INDEX `Task_createdAt_idx` ON `Task`(`createdAt`);

-- CreateIndex
CREATE INDEX `TaskAssignee_userId_taskId_idx` ON `TaskAssignee`(`userId`, `taskId`);

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
