-- AlterTable
ALTER TABLE "cicd_projects" ADD COLUMN     "serverId" TEXT;

-- CreateTable
CREATE TABLE "kibana_dashboards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "category" VARCHAR(100),
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kibana_dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elk_viewer_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "filters" JSONB,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elk_viewer_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "environment" VARCHAR(20) NOT NULL,
    "projectId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kibana_dashboards_userId_idx" ON "kibana_dashboards"("userId");

-- CreateIndex
CREATE INDEX "kibana_dashboards_isTemplate_idx" ON "kibana_dashboards"("isTemplate");

-- CreateIndex
CREATE INDEX "kibana_dashboards_category_idx" ON "kibana_dashboards"("category");

-- CreateIndex
CREATE UNIQUE INDEX "elk_viewer_configs_userId_key" ON "elk_viewer_configs"("userId");

-- CreateIndex
CREATE INDEX "approval_workflows_environment_idx" ON "approval_workflows"("environment");

-- CreateIndex
CREATE INDEX "approval_workflows_projectId_idx" ON "approval_workflows"("projectId");

-- CreateIndex
CREATE INDEX "approval_workflows_isDefault_idx" ON "approval_workflows"("isDefault");

-- CreateIndex
CREATE INDEX "approval_workflows_userId_idx" ON "approval_workflows"("userId");

-- CreateIndex
CREATE INDEX "cicd_projects_serverId_idx" ON "cicd_projects"("serverId");

-- AddForeignKey
ALTER TABLE "kibana_dashboards" ADD CONSTRAINT "kibana_dashboards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elk_viewer_configs" ADD CONSTRAINT "elk_viewer_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cicd_projects" ADD CONSTRAINT "cicd_projects_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "cicd_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
