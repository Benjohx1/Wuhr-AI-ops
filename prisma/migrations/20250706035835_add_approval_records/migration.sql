-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('user_registration', 'deployment', 'cicd_pipeline', 'system_config');

-- DropIndex
DROP INDEX "servers_authType_idx";

-- DropIndex
DROP INDEX "servers_isActive_idx";

-- AlterTable
ALTER TABLE "cicd_projects" ADD COLUMN     "gitCredentialId" TEXT;

-- CreateTable
CREATE TABLE "approval_records" (
    "id" TEXT NOT NULL,
    "approvalType" "ApprovalType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" VARCHAR(255) NOT NULL,
    "operatorId" TEXT NOT NULL,
    "operatorName" VARCHAR(100) NOT NULL,
    "action" "ApprovalStatus" NOT NULL,
    "comment" TEXT,
    "operatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "git_credentials" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "authType" VARCHAR(50) NOT NULL,
    "encryptedCredentials" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "git_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "approval_records_approvalType_idx" ON "approval_records"("approvalType");

-- CreateIndex
CREATE INDEX "approval_records_targetId_idx" ON "approval_records"("targetId");

-- CreateIndex
CREATE INDEX "approval_records_operatorId_idx" ON "approval_records"("operatorId");

-- CreateIndex
CREATE INDEX "approval_records_action_idx" ON "approval_records"("action");

-- CreateIndex
CREATE INDEX "approval_records_operatedAt_idx" ON "approval_records"("operatedAt");

-- CreateIndex
CREATE INDEX "git_credentials_userId_idx" ON "git_credentials"("userId");

-- CreateIndex
CREATE INDEX "git_credentials_platform_idx" ON "git_credentials"("platform");

-- CreateIndex
CREATE INDEX "git_credentials_authType_idx" ON "git_credentials"("authType");

-- CreateIndex
CREATE INDEX "git_credentials_isDefault_idx" ON "git_credentials"("isDefault");

-- CreateIndex
CREATE INDEX "git_credentials_isActive_idx" ON "git_credentials"("isActive");

-- CreateIndex
CREATE INDEX "cicd_projects_gitCredentialId_idx" ON "cicd_projects"("gitCredentialId");

-- AddForeignKey
ALTER TABLE "cicd_projects" ADD CONSTRAINT "cicd_projects_gitCredentialId_fkey" FOREIGN KEY ("gitCredentialId") REFERENCES "git_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_records" ADD CONSTRAINT "approval_records_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "git_credentials" ADD CONSTRAINT "git_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
