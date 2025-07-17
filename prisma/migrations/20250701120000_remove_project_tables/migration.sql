-- 删除项目相关的数据表
-- 这个迁移将删除所有项目、部署、任务相关的表，简化系统为纯模型配置管理

-- 删除外键约束和表
DROP TABLE IF EXISTS "approvals" CASCADE;
DROP TABLE IF EXISTS "deployments" CASCADE;
DROP TABLE IF EXISTS "jenkins_configs" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "projects" CASCADE;

-- 删除相关的枚举类型
DROP TYPE IF EXISTS "DeploymentStatus";
DROP TYPE IF EXISTS "ApprovalStatus";
DROP TYPE IF EXISTS "TaskStatus";
