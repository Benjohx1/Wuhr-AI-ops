/*
  Warnings:

  - You are about to drop the `chat_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "ApprovalType" ADD VALUE 'jenkins_job';

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "chat_sessions" DROP CONSTRAINT "chat_sessions_userId_fkey";

-- AlterTable
ALTER TABLE "cicd_projects" ADD COLUMN     "deploymentTemplateId" TEXT;

-- AlterTable
ALTER TABLE "deployments" ADD COLUMN     "jenkinsConfigId" TEXT,
ADD COLUMN     "jenkinsJobName" VARCHAR(200);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "realName" VARCHAR(100);

-- DropTable
DROP TABLE "chat_messages";

-- DropTable
DROP TABLE "chat_sessions";

-- DropEnum
DROP TYPE "MessageStatus";

-- DropEnum
DROP TYPE "MessageType";

-- CreateTable
CREATE TABLE "user_registrations" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "realName" VARCHAR(100) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "UserRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL DEFAULT 'general',
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenkins_job_configs" (
    "id" TEXT NOT NULL,
    "jenkinsConfigId" TEXT NOT NULL,
    "jobName" VARCHAR(200) NOT NULL,
    "displayName" VARCHAR(200),
    "description" TEXT,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "approvalRoles" JSONB,
    "parameters" JSONB,
    "schedule" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenkins_job_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenkins_job_groups" (
    "id" TEXT NOT NULL,
    "jenkinsConfigId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(20),
    "icon" VARCHAR(50),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenkins_job_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenkins_job_group_mappings" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "jobName" VARCHAR(200) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenkins_job_group_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenkins_job_executions" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "jobName" VARCHAR(200) NOT NULL,
    "operationType" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "requestedBy" TEXT NOT NULL,
    "reason" TEXT,
    "parameters" JSONB,
    "executionResult" JSONB,
    "executedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenkins_job_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenkins_job_approvals" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenkins_job_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenkins_config_approvers" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenkins_config_approvers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenkins_job_notifiers" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "notifierId" TEXT NOT NULL,
    "notifyOnSubmit" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnApprove" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnReject" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnExecute" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnComplete" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenkins_job_notifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "info_notifications" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "actionUrl" VARCHAR(500),
    "actionText" VARCHAR(100),
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "info_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelName" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "apiKey" VARCHAR(500) NOT NULL,
    "baseUrl" VARCHAR(500),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_model_selections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "selectedModelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_model_selections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_registrations_username_key" ON "user_registrations"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_registrations_email_key" ON "user_registrations"("email");

-- CreateIndex
CREATE INDEX "user_registrations_status_idx" ON "user_registrations"("status");

-- CreateIndex
CREATE INDEX "user_registrations_submittedAt_idx" ON "user_registrations"("submittedAt");

-- CreateIndex
CREATE INDEX "deployment_templates_userId_idx" ON "deployment_templates"("userId");

-- CreateIndex
CREATE INDEX "deployment_templates_category_idx" ON "deployment_templates"("category");

-- CreateIndex
CREATE INDEX "deployment_templates_isActive_idx" ON "deployment_templates"("isActive");

-- CreateIndex
CREATE INDEX "jenkins_job_configs_jenkinsConfigId_idx" ON "jenkins_job_configs"("jenkinsConfigId");

-- CreateIndex
CREATE INDEX "jenkins_job_configs_userId_idx" ON "jenkins_job_configs"("userId");

-- CreateIndex
CREATE INDEX "jenkins_job_configs_isActive_idx" ON "jenkins_job_configs"("isActive");

-- CreateIndex
CREATE INDEX "jenkins_job_configs_enabled_idx" ON "jenkins_job_configs"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "jenkins_job_configs_jenkinsConfigId_jobName_key" ON "jenkins_job_configs"("jenkinsConfigId", "jobName");

-- CreateIndex
CREATE INDEX "jenkins_job_groups_jenkinsConfigId_idx" ON "jenkins_job_groups"("jenkinsConfigId");

-- CreateIndex
CREATE INDEX "jenkins_job_groups_userId_idx" ON "jenkins_job_groups"("userId");

-- CreateIndex
CREATE INDEX "jenkins_job_groups_isActive_idx" ON "jenkins_job_groups"("isActive");

-- CreateIndex
CREATE INDEX "jenkins_job_groups_sortOrder_idx" ON "jenkins_job_groups"("sortOrder");

-- CreateIndex
CREATE INDEX "jenkins_job_group_mappings_groupId_idx" ON "jenkins_job_group_mappings"("groupId");

-- CreateIndex
CREATE INDEX "jenkins_job_group_mappings_jobName_idx" ON "jenkins_job_group_mappings"("jobName");

-- CreateIndex
CREATE INDEX "jenkins_job_group_mappings_isActive_idx" ON "jenkins_job_group_mappings"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "jenkins_job_group_mappings_groupId_jobName_key" ON "jenkins_job_group_mappings"("groupId", "jobName");

-- CreateIndex
CREATE INDEX "jenkins_job_executions_configId_idx" ON "jenkins_job_executions"("configId");

-- CreateIndex
CREATE INDEX "jenkins_job_executions_requestedBy_idx" ON "jenkins_job_executions"("requestedBy");

-- CreateIndex
CREATE INDEX "jenkins_job_executions_status_idx" ON "jenkins_job_executions"("status");

-- CreateIndex
CREATE INDEX "jenkins_job_executions_operationType_idx" ON "jenkins_job_executions"("operationType");

-- CreateIndex
CREATE INDEX "jenkins_job_approvals_executionId_idx" ON "jenkins_job_approvals"("executionId");

-- CreateIndex
CREATE INDEX "jenkins_job_approvals_approverId_idx" ON "jenkins_job_approvals"("approverId");

-- CreateIndex
CREATE INDEX "jenkins_job_approvals_status_idx" ON "jenkins_job_approvals"("status");

-- CreateIndex
CREATE INDEX "jenkins_job_approvals_level_idx" ON "jenkins_job_approvals"("level");

-- CreateIndex
CREATE INDEX "jenkins_config_approvers_configId_idx" ON "jenkins_config_approvers"("configId");

-- CreateIndex
CREATE INDEX "jenkins_config_approvers_approverId_idx" ON "jenkins_config_approvers"("approverId");

-- CreateIndex
CREATE INDEX "jenkins_config_approvers_isActive_idx" ON "jenkins_config_approvers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "jenkins_config_approvers_configId_approverId_key" ON "jenkins_config_approvers"("configId", "approverId");

-- CreateIndex
CREATE INDEX "jenkins_job_notifiers_executionId_idx" ON "jenkins_job_notifiers"("executionId");

-- CreateIndex
CREATE INDEX "jenkins_job_notifiers_notifierId_idx" ON "jenkins_job_notifiers"("notifierId");

-- CreateIndex
CREATE INDEX "jenkins_job_notifiers_isActive_idx" ON "jenkins_job_notifiers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "jenkins_job_notifiers_executionId_notifierId_key" ON "jenkins_job_notifiers"("executionId", "notifierId");

-- CreateIndex
CREATE INDEX "info_notifications_userId_idx" ON "info_notifications"("userId");

-- CreateIndex
CREATE INDEX "info_notifications_type_idx" ON "info_notifications"("type");

-- CreateIndex
CREATE INDEX "info_notifications_isRead_idx" ON "info_notifications"("isRead");

-- CreateIndex
CREATE INDEX "info_notifications_createdAt_idx" ON "info_notifications"("createdAt");

-- CreateIndex
CREATE INDEX "info_notifications_expiresAt_idx" ON "info_notifications"("expiresAt");

-- CreateIndex
CREATE INDEX "model_configs_userId_idx" ON "model_configs"("userId");

-- CreateIndex
CREATE INDEX "model_configs_provider_idx" ON "model_configs"("provider");

-- CreateIndex
CREATE INDEX "model_configs_isActive_idx" ON "model_configs"("isActive");

-- CreateIndex
CREATE INDEX "model_configs_isDefault_idx" ON "model_configs"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "model_configs_userId_modelName_key" ON "model_configs"("userId", "modelName");

-- CreateIndex
CREATE UNIQUE INDEX "user_model_selections_userId_key" ON "user_model_selections"("userId");

-- CreateIndex
CREATE INDEX "user_model_selections_userId_idx" ON "user_model_selections"("userId");

-- CreateIndex
CREATE INDEX "user_model_selections_selectedModelId_idx" ON "user_model_selections"("selectedModelId");

-- CreateIndex
CREATE INDEX "cicd_projects_deploymentTemplateId_idx" ON "cicd_projects"("deploymentTemplateId");

-- CreateIndex
CREATE INDEX "deployments_jenkinsConfigId_idx" ON "deployments"("jenkinsConfigId");

-- AddForeignKey
ALTER TABLE "cicd_projects" ADD CONSTRAINT "cicd_projects_deploymentTemplateId_fkey" FOREIGN KEY ("deploymentTemplateId") REFERENCES "deployment_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_templates" ADD CONSTRAINT "deployment_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_job_configs" ADD CONSTRAINT "jenkins_job_configs_jenkinsConfigId_fkey" FOREIGN KEY ("jenkinsConfigId") REFERENCES "jenkins_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_job_configs" ADD CONSTRAINT "jenkins_job_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_job_groups" ADD CONSTRAINT "jenkins_job_groups_jenkinsConfigId_fkey" FOREIGN KEY ("jenkinsConfigId") REFERENCES "jenkins_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_job_groups" ADD CONSTRAINT "jenkins_job_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_job_group_mappings" ADD CONSTRAINT "jenkins_job_group_mappings_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "jenkins_job_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_jenkinsConfigId_fkey" FOREIGN KEY ("jenkinsConfigId") REFERENCES "jenkins_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_job_executions" ADD CONSTRAINT "jenkins_job_executions_configId_fkey" FOREIGN KEY ("configId") REFERENCES "jenkins_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_job_executions" ADD CONSTRAINT "jenkins_job_executions_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_job_approvals" ADD CONSTRAINT "jenkins_job_approvals_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "jenkins_job_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_job_approvals" ADD CONSTRAINT "jenkins_job_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_config_approvers" ADD CONSTRAINT "jenkins_config_approvers_configId_fkey" FOREIGN KEY ("configId") REFERENCES "jenkins_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_config_approvers" ADD CONSTRAINT "jenkins_config_approvers_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_job_notifiers" ADD CONSTRAINT "jenkins_job_notifiers_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "jenkins_job_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_job_notifiers" ADD CONSTRAINT "jenkins_job_notifiers_notifierId_fkey" FOREIGN KEY ("notifierId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "info_notifications" ADD CONSTRAINT "info_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_configs" ADD CONSTRAINT "model_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_model_selections" ADD CONSTRAINT "user_model_selections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_model_selections" ADD CONSTRAINT "user_model_selections_selectedModelId_fkey" FOREIGN KEY ("selectedModelId") REFERENCES "model_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
