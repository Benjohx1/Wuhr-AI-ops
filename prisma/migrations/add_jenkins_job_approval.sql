-- 添加Jenkins Job审批相关表结构

-- 1. 扩展ApprovalType枚举，添加jenkins_job类型
ALTER TYPE "ApprovalType" ADD VALUE 'jenkins_job';

-- 2. 创建Jenkins Job执行记录表
CREATE TABLE IF NOT EXISTS "jenkins_job_executions" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "operationType" TEXT NOT NULL, -- 'build', 'enable', 'disable', 'delete'
    "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'executing', 'completed', 'failed'
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

-- 3. 创建Jenkins Job审批表
CREATE TABLE IF NOT EXISTS "jenkins_job_approvals" (
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

-- 4. 创建Jenkins配置审批人员设置表
CREATE TABLE IF NOT EXISTS "jenkins_config_approvers" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenkins_config_approvers_pkey" PRIMARY KEY ("id")
);

-- 5. 添加外键约束
ALTER TABLE "jenkins_job_executions" 
ADD CONSTRAINT "jenkins_job_executions_configId_fkey" 
FOREIGN KEY ("configId") REFERENCES "jenkins_configs"("id") ON DELETE CASCADE;

ALTER TABLE "jenkins_job_executions" 
ADD CONSTRAINT "jenkins_job_executions_requestedBy_fkey" 
FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "jenkins_job_approvals" 
ADD CONSTRAINT "jenkins_job_approvals_executionId_fkey" 
FOREIGN KEY ("executionId") REFERENCES "jenkins_job_executions"("id") ON DELETE CASCADE;

ALTER TABLE "jenkins_job_approvals" 
ADD CONSTRAINT "jenkins_job_approvals_approverId_fkey" 
FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "jenkins_config_approvers" 
ADD CONSTRAINT "jenkins_config_approvers_configId_fkey" 
FOREIGN KEY ("configId") REFERENCES "jenkins_configs"("id") ON DELETE CASCADE;

ALTER TABLE "jenkins_config_approvers" 
ADD CONSTRAINT "jenkins_config_approvers_approverId_fkey" 
FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE CASCADE;

-- 6. 添加索引
CREATE INDEX "jenkins_job_executions_configId_idx" ON "jenkins_job_executions"("configId");
CREATE INDEX "jenkins_job_executions_requestedBy_idx" ON "jenkins_job_executions"("requestedBy");
CREATE INDEX "jenkins_job_executions_status_idx" ON "jenkins_job_executions"("status");
CREATE INDEX "jenkins_job_executions_operationType_idx" ON "jenkins_job_executions"("operationType");

CREATE INDEX "jenkins_job_approvals_executionId_idx" ON "jenkins_job_approvals"("executionId");
CREATE INDEX "jenkins_job_approvals_approverId_idx" ON "jenkins_job_approvals"("approverId");
CREATE INDEX "jenkins_job_approvals_status_idx" ON "jenkins_job_approvals"("status");
CREATE INDEX "jenkins_job_approvals_level_idx" ON "jenkins_job_approvals"("level");

CREATE INDEX "jenkins_config_approvers_configId_idx" ON "jenkins_config_approvers"("configId");
CREATE INDEX "jenkins_config_approvers_approverId_idx" ON "jenkins_config_approvers"("approverId");
CREATE INDEX "jenkins_config_approvers_isActive_idx" ON "jenkins_config_approvers"("isActive");

-- 7. 添加唯一约束
ALTER TABLE "jenkins_config_approvers" 
ADD CONSTRAINT "jenkins_config_approvers_configId_approverId_key" 
UNIQUE ("configId", "approverId");
