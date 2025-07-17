/*
  Warnings:

  - You are about to drop the column `jenkinsConfigId` on the `deployments` table. All the data in the column will be lost.
  - You are about to drop the column `jobName` on the `jenkins_configs` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `jenkins_configs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "deployments" DROP CONSTRAINT "deployments_jenkinsConfigId_fkey";

-- DropForeignKey
ALTER TABLE "jenkins_configs" DROP CONSTRAINT "jenkins_configs_projectId_fkey";

-- DropIndex
DROP INDEX "deployments_jenkinsConfigId_idx";

-- DropIndex
DROP INDEX "jenkins_configs_projectId_idx";

-- AlterTable
ALTER TABLE "deployments" DROP COLUMN "jenkinsConfigId";

-- AlterTable
ALTER TABLE "jenkins_configs" DROP COLUMN "jobName",
DROP COLUMN "projectId";
