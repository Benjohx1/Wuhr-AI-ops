-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('user', 'ai');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sending', 'success', 'error');

-- CreateEnum
CREATE TYPE "ServerStatus" AS ENUM ('online', 'offline', 'warning', 'error');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('cpu', 'memory', 'disk', 'network', 'service', 'custom');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('info', 'warning', 'error', 'critical');

-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('pending', 'queued', 'running', 'success', 'failed', 'aborted', 'unstable');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('pending', 'approved', 'rejected', 'scheduled', 'deploying', 'success', 'failed', 'rolled_back');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "userId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "MessageStatus" NOT NULL DEFAULT 'success',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servers" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "hostname" VARCHAR(255) NOT NULL,
    "ip" VARCHAR(45) NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 22,
    "status" "ServerStatus" NOT NULL DEFAULT 'offline',
    "os" VARCHAR(100) NOT NULL,
    "version" VARCHAR(50),
    "location" VARCHAR(100),
    "tags" TEXT[],
    "description" TEXT,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255),
    "keyPath" VARCHAR(500),
    "lastConnectedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_metrics" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cpuUsage" DOUBLE PRECISION,
    "cpuCores" INTEGER,
    "memoryTotal" DOUBLE PRECISION,
    "memoryUsed" DOUBLE PRECISION,
    "diskTotal" DOUBLE PRECISION,
    "diskUsed" DOUBLE PRECISION,
    "networkIn" DOUBLE PRECISION,
    "networkOut" DOUBLE PRECISION,
    "uptime" INTEGER,

    CONSTRAINT "server_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_alerts" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL DEFAULT 'custom',
    "level" "AlertLevel" NOT NULL DEFAULT 'info',
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_logs" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'info',
    "source" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cicd_projects" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "repositoryUrl" VARCHAR(500) NOT NULL,
    "repositoryType" VARCHAR(50) NOT NULL,
    "branch" VARCHAR(100) NOT NULL DEFAULT 'main',
    "buildScript" TEXT,
    "deployScript" TEXT,
    "environment" VARCHAR(50) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cicd_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenkins_configs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "serverUrl" VARCHAR(500) NOT NULL,
    "username" VARCHAR(100),
    "apiToken" VARCHAR(500),
    "jobName" VARCHAR(200),
    "webhookUrl" VARCHAR(500),
    "config" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTestAt" TIMESTAMP(3),
    "testStatus" VARCHAR(50),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenkins_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipelines" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "jenkinsJobName" VARCHAR(200) NOT NULL,
    "parameters" JSONB,
    "triggers" JSONB,
    "stages" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builds" (
    "id" TEXT NOT NULL,
    "jenkinsConfigId" TEXT NOT NULL,
    "pipelineId" TEXT,
    "buildNumber" INTEGER NOT NULL,
    "jenkinsJobName" VARCHAR(200) NOT NULL,
    "status" "BuildStatus" NOT NULL DEFAULT 'pending',
    "result" VARCHAR(50),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "queueId" VARCHAR(100),
    "buildUrl" VARCHAR(500),
    "parameters" JSONB,
    "artifacts" JSONB,
    "logs" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "jenkinsConfigId" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "environment" VARCHAR(50) NOT NULL,
    "version" VARCHAR(100),
    "status" "DeploymentStatus" NOT NULL DEFAULT 'pending',
    "buildNumber" INTEGER,
    "deployScript" TEXT,
    "rollbackScript" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "logs" TEXT,
    "config" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_approvals" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3),
    "level" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_sessions_userId_idx" ON "chat_sessions"("userId");

-- CreateIndex
CREATE INDEX "chat_sessions_createdAt_idx" ON "chat_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "chat_sessions_updatedAt_idx" ON "chat_sessions"("updatedAt");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");

-- CreateIndex
CREATE INDEX "chat_messages_type_idx" ON "chat_messages"("type");

-- CreateIndex
CREATE INDEX "chat_messages_status_idx" ON "chat_messages"("status");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "servers_userId_idx" ON "servers"("userId");

-- CreateIndex
CREATE INDEX "servers_status_idx" ON "servers"("status");

-- CreateIndex
CREATE INDEX "servers_ip_idx" ON "servers"("ip");

-- CreateIndex
CREATE INDEX "servers_hostname_idx" ON "servers"("hostname");

-- CreateIndex
CREATE INDEX "server_metrics_serverId_idx" ON "server_metrics"("serverId");

-- CreateIndex
CREATE INDEX "server_metrics_timestamp_idx" ON "server_metrics"("timestamp");

-- CreateIndex
CREATE INDEX "server_alerts_serverId_idx" ON "server_alerts"("serverId");

-- CreateIndex
CREATE INDEX "server_alerts_level_idx" ON "server_alerts"("level");

-- CreateIndex
CREATE INDEX "server_alerts_isResolved_idx" ON "server_alerts"("isResolved");

-- CreateIndex
CREATE INDEX "server_alerts_createdAt_idx" ON "server_alerts"("createdAt");

-- CreateIndex
CREATE INDEX "server_logs_serverId_idx" ON "server_logs"("serverId");

-- CreateIndex
CREATE INDEX "server_logs_level_idx" ON "server_logs"("level");

-- CreateIndex
CREATE INDEX "server_logs_source_idx" ON "server_logs"("source");

-- CreateIndex
CREATE INDEX "server_logs_timestamp_idx" ON "server_logs"("timestamp");

-- CreateIndex
CREATE INDEX "cicd_projects_userId_idx" ON "cicd_projects"("userId");

-- CreateIndex
CREATE INDEX "cicd_projects_isActive_idx" ON "cicd_projects"("isActive");

-- CreateIndex
CREATE INDEX "cicd_projects_environment_idx" ON "cicd_projects"("environment");

-- CreateIndex
CREATE INDEX "jenkins_configs_projectId_idx" ON "jenkins_configs"("projectId");

-- CreateIndex
CREATE INDEX "jenkins_configs_userId_idx" ON "jenkins_configs"("userId");

-- CreateIndex
CREATE INDEX "jenkins_configs_isActive_idx" ON "jenkins_configs"("isActive");

-- CreateIndex
CREATE INDEX "jenkins_configs_testStatus_idx" ON "jenkins_configs"("testStatus");

-- CreateIndex
CREATE INDEX "pipelines_projectId_idx" ON "pipelines"("projectId");

-- CreateIndex
CREATE INDEX "pipelines_userId_idx" ON "pipelines"("userId");

-- CreateIndex
CREATE INDEX "pipelines_isActive_idx" ON "pipelines"("isActive");

-- CreateIndex
CREATE INDEX "builds_jenkinsConfigId_idx" ON "builds"("jenkinsConfigId");

-- CreateIndex
CREATE INDEX "builds_pipelineId_idx" ON "builds"("pipelineId");

-- CreateIndex
CREATE INDEX "builds_userId_idx" ON "builds"("userId");

-- CreateIndex
CREATE INDEX "builds_status_idx" ON "builds"("status");

-- CreateIndex
CREATE INDEX "builds_buildNumber_idx" ON "builds"("buildNumber");

-- CreateIndex
CREATE INDEX "builds_startedAt_idx" ON "builds"("startedAt");

-- CreateIndex
CREATE INDEX "deployments_projectId_idx" ON "deployments"("projectId");

-- CreateIndex
CREATE INDEX "deployments_jenkinsConfigId_idx" ON "deployments"("jenkinsConfigId");

-- CreateIndex
CREATE INDEX "deployments_userId_idx" ON "deployments"("userId");

-- CreateIndex
CREATE INDEX "deployments_status_idx" ON "deployments"("status");

-- CreateIndex
CREATE INDEX "deployments_environment_idx" ON "deployments"("environment");

-- CreateIndex
CREATE INDEX "deployments_scheduledAt_idx" ON "deployments"("scheduledAt");

-- CreateIndex
CREATE INDEX "deployment_approvals_deploymentId_idx" ON "deployment_approvals"("deploymentId");

-- CreateIndex
CREATE INDEX "deployment_approvals_approverId_idx" ON "deployment_approvals"("approverId");

-- CreateIndex
CREATE INDEX "deployment_approvals_status_idx" ON "deployment_approvals"("status");

-- CreateIndex
CREATE INDEX "deployment_approvals_level_idx" ON "deployment_approvals"("level");

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_metrics" ADD CONSTRAINT "server_metrics_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_alerts" ADD CONSTRAINT "server_alerts_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_logs" ADD CONSTRAINT "server_logs_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cicd_projects" ADD CONSTRAINT "cicd_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_configs" ADD CONSTRAINT "jenkins_configs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "cicd_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenkins_configs" ADD CONSTRAINT "jenkins_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "cicd_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_jenkinsConfigId_fkey" FOREIGN KEY ("jenkinsConfigId") REFERENCES "jenkins_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "cicd_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_jenkinsConfigId_fkey" FOREIGN KEY ("jenkinsConfigId") REFERENCES "jenkins_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_approvals" ADD CONSTRAINT "deployment_approvals_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_approvals" ADD CONSTRAINT "deployment_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
