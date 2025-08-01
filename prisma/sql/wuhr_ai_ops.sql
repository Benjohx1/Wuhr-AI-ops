--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: wuhr_admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO wuhr_admin;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: wuhr_admin
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AlertLevel; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."AlertLevel" AS ENUM (
    'info',
    'warning',
    'error',
    'critical'
);


ALTER TYPE public."AlertLevel" OWNER TO wuhr_admin;

--
-- Name: AlertType; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."AlertType" AS ENUM (
    'cpu',
    'memory',
    'disk',
    'network',
    'service',
    'custom'
);


ALTER TYPE public."AlertType" OWNER TO wuhr_admin;

--
-- Name: ApprovalStatus; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."ApprovalStatus" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'expired'
);


ALTER TYPE public."ApprovalStatus" OWNER TO wuhr_admin;

--
-- Name: ApprovalType; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."ApprovalType" AS ENUM (
    'user_registration',
    'deployment',
    'cicd_pipeline',
    'system_config',
    'jenkins_job'
);


ALTER TYPE public."ApprovalType" OWNER TO wuhr_admin;

--
-- Name: BuildStatus; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."BuildStatus" AS ENUM (
    'pending',
    'queued',
    'running',
    'success',
    'failed',
    'aborted',
    'unstable'
);


ALTER TYPE public."BuildStatus" OWNER TO wuhr_admin;

--
-- Name: DeploymentStatus; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."DeploymentStatus" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'scheduled',
    'deploying',
    'success',
    'failed',
    'rolled_back'
);


ALTER TYPE public."DeploymentStatus" OWNER TO wuhr_admin;

--
-- Name: LogLevel; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."LogLevel" AS ENUM (
    'debug',
    'info',
    'warn',
    'error',
    'fatal'
);


ALTER TYPE public."LogLevel" OWNER TO wuhr_admin;

--
-- Name: MessageStatus; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."MessageStatus" AS ENUM (
    'sending',
    'success',
    'error'
);


ALTER TYPE public."MessageStatus" OWNER TO wuhr_admin;

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."MessageType" AS ENUM (
    'user',
    'ai',
    'system'
);


ALTER TYPE public."MessageType" OWNER TO wuhr_admin;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."NotificationType" AS ENUM (
    'user_registration',
    'user_approved',
    'user_rejected',
    'system_alert',
    'api_key_expired'
);


ALTER TYPE public."NotificationType" OWNER TO wuhr_admin;

--
-- Name: ServerStatus; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."ServerStatus" AS ENUM (
    'online',
    'offline',
    'warning',
    'error'
);


ALTER TYPE public."ServerStatus" OWNER TO wuhr_admin;

--
-- Name: UserApprovalStatus; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."UserApprovalStatus" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public."UserApprovalStatus" OWNER TO wuhr_admin;

--
-- Name: UserRegistrationStatus; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."UserRegistrationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."UserRegistrationStatus" OWNER TO wuhr_admin;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: wuhr_admin
--

CREATE TYPE public."UserRole" AS ENUM (
    'admin',
    'manager',
    'developer',
    'viewer'
);


ALTER TYPE public."UserRole" OWNER TO wuhr_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO wuhr_admin;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.api_keys (
    id text NOT NULL,
    name character varying(255) NOT NULL,
    provider character varying(50) NOT NULL,
    "apiKey" character varying(500) NOT NULL,
    "baseUrl" character varying(500),
    "isDefault" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    config jsonb,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.api_keys OWNER TO wuhr_admin;

--
-- Name: approval_records; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.approval_records (
    id text NOT NULL,
    "approvalType" public."ApprovalType" NOT NULL,
    "targetId" text NOT NULL,
    "targetName" character varying(255) NOT NULL,
    "operatorId" text NOT NULL,
    "operatorName" character varying(100) NOT NULL,
    action public."ApprovalStatus" NOT NULL,
    comment text,
    "operatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.approval_records OWNER TO wuhr_admin;

--
-- Name: approval_workflows; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.approval_workflows (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    environment character varying(20) NOT NULL,
    "projectId" text,
    "isDefault" boolean DEFAULT false NOT NULL,
    config jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.approval_workflows OWNER TO wuhr_admin;

--
-- Name: auth_logs; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.auth_logs (
    id text NOT NULL,
    "userId" text,
    username character varying(50),
    email character varying(255),
    action character varying(50) NOT NULL,
    success boolean NOT NULL,
    "ipAddress" character varying(45),
    "userAgent" text,
    details text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.auth_logs OWNER TO wuhr_admin;

--
-- Name: auth_sessions; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.auth_sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "refreshTokenId" character varying(255) NOT NULL,
    "userAgent" text,
    "ipAddress" character varying(45),
    "isActive" boolean DEFAULT true NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "lastUsedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.auth_sessions OWNER TO wuhr_admin;

--
-- Name: builds; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.builds (
    id text NOT NULL,
    "jenkinsConfigId" text NOT NULL,
    "pipelineId" text,
    "buildNumber" integer NOT NULL,
    "jenkinsJobName" character varying(200) NOT NULL,
    status public."BuildStatus" DEFAULT 'pending'::public."BuildStatus" NOT NULL,
    result character varying(50),
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    duration integer,
    "queueId" character varying(100),
    "buildUrl" character varying(500),
    parameters jsonb,
    artifacts jsonb,
    logs text,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.builds OWNER TO wuhr_admin;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.chat_messages (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    type public."MessageType" NOT NULL,
    content text NOT NULL,
    metadata jsonb,
    status public."MessageStatus" DEFAULT 'success'::public."MessageStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.chat_messages OWNER TO wuhr_admin;

--
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.chat_sessions (
    id text NOT NULL,
    title character varying(255) NOT NULL,
    "userId" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.chat_sessions OWNER TO wuhr_admin;

--
-- Name: cicd_projects; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.cicd_projects (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "repositoryUrl" character varying(500) NOT NULL,
    "repositoryType" character varying(50) NOT NULL,
    branch character varying(100) DEFAULT 'main'::character varying NOT NULL,
    "buildScript" text,
    "deployScript" text,
    environment character varying(50) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "serverId" text,
    "gitCredentialId" text,
    "approvalUsers" jsonb,
    "buildTimeout" integer,
    "buildTriggers" jsonb,
    "environmentVariables" jsonb,
    "notificationUsers" jsonb,
    "requireApproval" boolean DEFAULT false NOT NULL,
    tags jsonb
);


ALTER TABLE public.cicd_projects OWNER TO wuhr_admin;

--
-- Name: deployment_approvals; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.deployment_approvals (
    id text NOT NULL,
    "deploymentId" text NOT NULL,
    "approverId" text NOT NULL,
    status public."ApprovalStatus" DEFAULT 'pending'::public."ApprovalStatus" NOT NULL,
    comments text,
    "approvedAt" timestamp(3) without time zone,
    level integer DEFAULT 1 NOT NULL,
    "isRequired" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.deployment_approvals OWNER TO wuhr_admin;

--
-- Name: deployment_templates; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.deployment_templates (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    type character varying(20) NOT NULL,
    content text NOT NULL,
    version character varying(50) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.deployment_templates OWNER TO wuhr_admin;

--
-- Name: deployments; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.deployments (
    id text NOT NULL,
    "projectId" text,
    name character varying(100) NOT NULL,
    description text,
    environment character varying(50) NOT NULL,
    version character varying(100),
    status public."DeploymentStatus" DEFAULT 'pending'::public."DeploymentStatus" NOT NULL,
    "buildNumber" integer,
    "deployScript" text,
    "rollbackScript" text,
    "scheduledAt" timestamp(3) without time zone,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    duration integer,
    logs text,
    config jsonb,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "approvalUsers" jsonb,
    "buildId" text,
    "deploymentHosts" jsonb,
    "isJenkinsDeployment" boolean DEFAULT false NOT NULL,
    "jenkinsBuildNumber" integer,
    "jenkinsJobId" text,
    "jenkinsJobIds" jsonb,
    "jenkinsJobName" text,
    "jenkinsQueueId" integer,
    "jenkinsQueueUrl" text,
    "notificationUsers" jsonb,
    "requireApproval" boolean DEFAULT false NOT NULL,
    "templateId" text
);


ALTER TABLE public.deployments OWNER TO wuhr_admin;

--
-- Name: elk_configs; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.elk_configs (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    host character varying(255) NOT NULL,
    port integer NOT NULL,
    username character varying(100),
    password text,
    indices jsonb DEFAULT '[]'::jsonb NOT NULL,
    ssl boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "apiKey" text,
    "webUrl" character varying(500),
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.elk_configs OWNER TO wuhr_admin;

--
-- Name: elk_viewer_configs; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.elk_viewer_configs (
    id text NOT NULL,
    "userId" text NOT NULL,
    layout jsonb NOT NULL,
    filters jsonb,
    preferences jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.elk_viewer_configs OWNER TO wuhr_admin;

--
-- Name: git_credentials; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.git_credentials (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    platform character varying(50) NOT NULL,
    "authType" character varying(50) NOT NULL,
    "encryptedCredentials" text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.git_credentials OWNER TO wuhr_admin;

--
-- Name: grafana_configs; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.grafana_configs (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    host character varying(255) NOT NULL,
    port integer DEFAULT 3000 NOT NULL,
    protocol character varying(10) DEFAULT 'http'::character varying NOT NULL,
    username character varying(100),
    password text,
    "apiKey" text,
    "orgId" integer DEFAULT 1 NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    description text,
    tags jsonb DEFAULT '[]'::jsonb,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.grafana_configs OWNER TO wuhr_admin;

--
-- Name: info_notifications; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.info_notifications (
    id text NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    "userId" text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "actionUrl" character varying(500),
    "actionText" character varying(100),
    metadata jsonb,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.info_notifications OWNER TO wuhr_admin;

--
-- Name: jenkins_config_approvers; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.jenkins_config_approvers (
    id text NOT NULL,
    "configId" text NOT NULL,
    "approverId" text NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.jenkins_config_approvers OWNER TO wuhr_admin;

--
-- Name: jenkins_configs; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.jenkins_configs (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "serverUrl" character varying(500) NOT NULL,
    username character varying(100),
    "apiToken" character varying(500),
    "webhookUrl" character varying(500),
    config jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastTestAt" timestamp(3) without time zone,
    "testStatus" character varying(50),
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.jenkins_configs OWNER TO wuhr_admin;

--
-- Name: jenkins_job_approvals; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.jenkins_job_approvals (
    id text NOT NULL,
    "executionId" text NOT NULL,
    "approverId" text NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    status public."ApprovalStatus" DEFAULT 'pending'::public."ApprovalStatus" NOT NULL,
    comments text,
    "approvedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "isRequired" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.jenkins_job_approvals OWNER TO wuhr_admin;

--
-- Name: jenkins_job_configs; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.jenkins_job_configs (
    id text NOT NULL,
    "jenkinsConfigId" text NOT NULL,
    "jobName" character varying(200) NOT NULL,
    "displayName" character varying(200),
    description text,
    "requireApproval" boolean DEFAULT true NOT NULL,
    "approvalRoles" jsonb,
    parameters jsonb,
    schedule jsonb,
    enabled boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.jenkins_job_configs OWNER TO wuhr_admin;

--
-- Name: jenkins_job_executions; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.jenkins_job_executions (
    id text NOT NULL,
    "configId" text NOT NULL,
    "jobName" character varying(200) NOT NULL,
    "operationType" character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "requestedBy" text NOT NULL,
    reason text,
    parameters jsonb,
    "executionResult" jsonb,
    "executedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.jenkins_job_executions OWNER TO wuhr_admin;

--
-- Name: jenkins_job_group_mappings; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.jenkins_job_group_mappings (
    id text NOT NULL,
    "groupId" text NOT NULL,
    "jobName" character varying(200) NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.jenkins_job_group_mappings OWNER TO wuhr_admin;

--
-- Name: jenkins_job_groups; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.jenkins_job_groups (
    id text NOT NULL,
    "jenkinsConfigId" text NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    color character varying(20),
    icon character varying(50),
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.jenkins_job_groups OWNER TO wuhr_admin;

--
-- Name: jenkins_job_notifiers; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.jenkins_job_notifiers (
    id text NOT NULL,
    "executionId" text NOT NULL,
    "notifierId" text NOT NULL,
    "notifyOnSubmit" boolean DEFAULT true NOT NULL,
    "notifyOnApprove" boolean DEFAULT true NOT NULL,
    "notifyOnReject" boolean DEFAULT true NOT NULL,
    "notifyOnExecute" boolean DEFAULT true NOT NULL,
    "notifyOnComplete" boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.jenkins_job_notifiers OWNER TO wuhr_admin;

--
-- Name: kibana_dashboards; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.kibana_dashboards (
    id text NOT NULL,
    "userId" text NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    config jsonb NOT NULL,
    "isTemplate" boolean DEFAULT false NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    category character varying(100),
    tags text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.kibana_dashboards OWNER TO wuhr_admin;

--
-- Name: model_configs; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.model_configs (
    id text NOT NULL,
    "userId" text NOT NULL,
    "modelName" character varying(100) NOT NULL,
    "displayName" character varying(100) NOT NULL,
    provider character varying(50) NOT NULL,
    "apiKey" character varying(500) NOT NULL,
    "baseUrl" character varying(500),
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.model_configs OWNER TO wuhr_admin;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    type public."NotificationType" NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    data jsonb,
    "isRead" boolean DEFAULT false NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO wuhr_admin;

--
-- Name: permission_group_permissions; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.permission_group_permissions (
    "groupId" text NOT NULL,
    "permissionId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.permission_group_permissions OWNER TO wuhr_admin;

--
-- Name: permission_groups; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.permission_groups (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.permission_groups OWNER TO wuhr_admin;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(100) NOT NULL,
    description text,
    category character varying(50) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.permissions OWNER TO wuhr_admin;

--
-- Name: pipelines; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.pipelines (
    id text NOT NULL,
    "projectId" text NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "jenkinsJobName" character varying(200) NOT NULL,
    parameters jsonb,
    triggers jsonb,
    stages jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pipelines OWNER TO wuhr_admin;

--
-- Name: preset_models; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.preset_models (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    "displayName" character varying(100) NOT NULL,
    provider character varying(50) NOT NULL,
    description text,
    "contextLength" integer,
    "maxTokens" integer,
    "supportedFeatures" text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.preset_models OWNER TO wuhr_admin;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.roles (
    name public."UserRole" NOT NULL,
    "displayName" character varying(100) NOT NULL,
    description text NOT NULL,
    permissions jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO wuhr_admin;

--
-- Name: server_alerts; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.server_alerts (
    id text NOT NULL,
    "serverId" text NOT NULL,
    type public."AlertType" DEFAULT 'custom'::public."AlertType" NOT NULL,
    level public."AlertLevel" DEFAULT 'info'::public."AlertLevel" NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    threshold double precision,
    "currentValue" double precision,
    "isResolved" boolean DEFAULT false NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.server_alerts OWNER TO wuhr_admin;

--
-- Name: server_logs; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.server_logs (
    id text NOT NULL,
    "serverId" text NOT NULL,
    level public."LogLevel" DEFAULT 'info'::public."LogLevel" NOT NULL,
    source character varying(100) NOT NULL,
    message text NOT NULL,
    metadata jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.server_logs OWNER TO wuhr_admin;

--
-- Name: server_metrics; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.server_metrics (
    id text NOT NULL,
    "serverId" text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "cpuUsage" double precision,
    "cpuCores" integer,
    "memoryTotal" double precision,
    "memoryUsed" double precision,
    "diskTotal" double precision,
    "diskUsed" double precision,
    "networkIn" double precision,
    "networkOut" double precision,
    uptime integer
);


ALTER TABLE public.server_metrics OWNER TO wuhr_admin;

--
-- Name: servers; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.servers (
    id text NOT NULL,
    name character varying(255) NOT NULL,
    hostname character varying(255) NOT NULL,
    ip character varying(45) NOT NULL,
    port integer DEFAULT 22 NOT NULL,
    status public."ServerStatus" DEFAULT 'offline'::public."ServerStatus" NOT NULL,
    os character varying(100) NOT NULL,
    version character varying(50),
    location character varying(100),
    tags text[],
    description text,
    username character varying(100) NOT NULL,
    password character varying(255),
    "keyPath" character varying(500),
    "lastConnectedAt" timestamp(3) without time zone,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "authType" character varying(50) DEFAULT 'password'::character varying NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    datacenter character varying(100)
);


ALTER TABLE public.servers OWNER TO wuhr_admin;

--
-- Name: system_configs; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.system_configs (
    key character varying(255) NOT NULL,
    value jsonb NOT NULL,
    category character varying(100) NOT NULL,
    description text,
    "isPublic" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.system_configs OWNER TO wuhr_admin;

--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.system_logs (
    id text NOT NULL,
    level public."LogLevel" DEFAULT 'info'::public."LogLevel" NOT NULL,
    category character varying(100) NOT NULL,
    message text NOT NULL,
    details jsonb,
    source character varying(255),
    "userId" text,
    metadata jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.system_logs OWNER TO wuhr_admin;

--
-- Name: user_model_selections; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.user_model_selections (
    id text NOT NULL,
    "userId" text NOT NULL,
    "selectedModelId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_model_selections OWNER TO wuhr_admin;

--
-- Name: user_permission_groups; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.user_permission_groups (
    "userId" text NOT NULL,
    "groupId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_permission_groups OWNER TO wuhr_admin;

--
-- Name: user_registrations; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.user_registrations (
    id text NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    "realName" character varying(100) NOT NULL,
    reason text NOT NULL,
    "permissionGroupId" text,
    status public."UserRegistrationStatus" DEFAULT 'PENDING'::public."UserRegistrationStatus" NOT NULL,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reviewedAt" timestamp(3) without time zone,
    "reviewedBy" text,
    "reviewNote" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_registrations OWNER TO wuhr_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: wuhr_admin
--

CREATE TABLE public.users (
    id text NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role public."UserRole" DEFAULT 'viewer'::public."UserRole" NOT NULL,
    permissions text[],
    "isActive" boolean DEFAULT false NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "approvalStatus" public."UserApprovalStatus" DEFAULT 'pending'::public."UserApprovalStatus" NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "approvedBy" text,
    "rejectedReason" text,
    "realName" character varying(100)
);


ALTER TABLE public.users OWNER TO wuhr_admin;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
3e2435ac-bb12-4f35-a3e7-9f90c3ef3a3f	01becb802cdf8587e12819f075f43e3afeac5a4582a30e788d1e4cd8271bfde3	2025-08-01 09:41:52.487652+00	20250117000000_remove_unused_chat_tables	\N	\N	2025-08-01 09:41:52.485808+00	1
8dc20182-c182-4431-9803-5a44e4622c94	6d068cfa33c65cc30045d3bbc9efdce908166a2cfef683b9d9a377a1d97354b8	2025-08-01 09:41:52.545284+00	20250630045220_	\N	\N	2025-08-01 09:41:52.488179+00	1
55fda587-ddb6-4e7f-8a2a-a9a4d1bff93e	52a8f3e0aea463b9dc3e46cf132e43cd7919afd2bcadb95777a9ebc409b33ffb	2025-08-01 09:41:52.55065+00	20250701052815_add_api_keys	\N	\N	2025-08-01 09:41:52.545742+00	1
3ceadfe2-37e3-473c-9dfb-b332e8e2af07	5b4393dfa1cd2488068fa943dd62fa553f7355d80cf65cb30380c7a3c203bedb	2025-08-01 09:41:52.559379+00	20250701100958_add_user_approval_system	\N	\N	2025-08-01 09:41:52.551073+00	1
06b05218-4365-40f1-b42d-4a7792b75f55	32e2dc20cd72cae809ff966cf08253322bf8f599939e7b941dcdd17af3d7313a	2025-08-01 09:41:52.568447+00	20250701120000_remove_project_tables	\N	\N	2025-08-01 09:41:52.559838+00	1
c0ac97ad-74a3-40ee-8eb1-1d73046f8f36	0b3b158d7237b9c33b8f1e139af87ca58b9024278f07c095a5ac139559393490	2025-08-01 09:41:52.626325+00	20250703124841_add_cicd_models	\N	\N	2025-08-01 09:41:52.569075+00	1
7d8686b5-20da-4a81-8ba7-249b2b3c67f4	c66a7c585fbc7ef9527c9adf37410478df2293ccfbb0b7de217979d29e42b6aa	2025-08-01 09:41:52.641951+00	20250704141220_add_server_to_cicd_project	\N	\N	2025-08-01 09:41:52.626751+00	1
2f440369-9f16-41bd-9a4c-42e7ca08a7b6	6eae93e8b54df695ed0e27911483221d99a020202ab895d5c4f69b755a8664b2	2025-08-01 09:41:52.645162+00	20250705_add_server_auth_fields	\N	\N	2025-08-01 09:41:52.642335+00	1
1cc30e24-2248-4bdb-bb09-968b69f804c3	4e4bbddfdcaa86bbff029e484002a164ca293f4c343b11d19bdaa9bcd5aa64ba	2025-08-01 09:41:52.658852+00	20250706035835_add_approval_records	\N	\N	2025-08-01 09:41:52.64556+00	1
1c18da9a-6f77-4be5-b2ec-3a396d87e743	3497d270deaacb5889feec4f7c3d138027c57c1fd6ecb5f5640b760f1fc36de6	2025-08-01 09:41:52.661593+00	20250707022116_	\N	\N	2025-08-01 09:41:52.659366+00	1
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.api_keys (id, name, provider, "apiKey", "baseUrl", "isDefault", "isActive", config, "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: approval_records; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.approval_records (id, "approvalType", "targetId", "targetName", "operatorId", "operatorName", action, comment, "operatedAt", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: approval_workflows; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.approval_workflows (id, name, description, environment, "projectId", "isDefault", config, "isActive", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: auth_logs; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.auth_logs (id, "userId", username, email, action, success, "ipAddress", "userAgent", details, "timestamp") FROM stdin;
\.


--
-- Data for Name: auth_sessions; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.auth_sessions (id, "userId", "refreshTokenId", "userAgent", "ipAddress", "isActive", "expiresAt", "lastUsedAt", "createdAt") FROM stdin;
7226dac1-0d05-4bd2-9853-6d7eaa32dd6d	cmdsmx4ql00009wfl9fwgnn79	7226dac1-0d05-4bd2-9853-6d7eaa32dd6d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	192.168.50.33	t	2025-08-08 09:44:13.561	2025-08-01 09:44:13.561	2025-08-01 09:44:13.562
\.


--
-- Data for Name: builds; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.builds (id, "jenkinsConfigId", "pipelineId", "buildNumber", "jenkinsJobName", status, result, "startedAt", "completedAt", duration, "queueId", "buildUrl", parameters, artifacts, logs, "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.chat_messages (id, "sessionId", type, content, metadata, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: chat_sessions; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.chat_sessions (id, title, "userId", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: cicd_projects; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.cicd_projects (id, name, description, "repositoryUrl", "repositoryType", branch, "buildScript", "deployScript", environment, "isActive", "userId", "createdAt", "updatedAt", "serverId", "gitCredentialId", "approvalUsers", "buildTimeout", "buildTriggers", "environmentVariables", "notificationUsers", "requireApproval", tags) FROM stdin;
\.


--
-- Data for Name: deployment_approvals; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.deployment_approvals (id, "deploymentId", "approverId", status, comments, "approvedAt", level, "isRequired", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: deployment_templates; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.deployment_templates (id, name, description, type, content, version, "isActive", "usageCount", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: deployments; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.deployments (id, "projectId", name, description, environment, version, status, "buildNumber", "deployScript", "rollbackScript", "scheduledAt", "startedAt", "completedAt", duration, logs, config, "userId", "createdAt", "updatedAt", "approvalUsers", "buildId", "deploymentHosts", "isJenkinsDeployment", "jenkinsBuildNumber", "jenkinsJobId", "jenkinsJobIds", "jenkinsJobName", "jenkinsQueueId", "jenkinsQueueUrl", "notificationUsers", "requireApproval", "templateId") FROM stdin;
\.


--
-- Data for Name: elk_configs; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.elk_configs (id, name, host, port, username, password, indices, ssl, "isActive", "apiKey", "webUrl", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: elk_viewer_configs; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.elk_viewer_configs (id, "userId", layout, filters, preferences, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: git_credentials; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.git_credentials (id, name, platform, "authType", "encryptedCredentials", "isDefault", "isActive", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: grafana_configs; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.grafana_configs (id, name, host, port, protocol, username, password, "apiKey", "orgId", "isActive", description, tags, "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: info_notifications; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.info_notifications (id, type, title, content, "userId", "isRead", "readAt", "actionUrl", "actionText", metadata, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: jenkins_config_approvers; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.jenkins_config_approvers (id, "configId", "approverId", level, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: jenkins_configs; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.jenkins_configs (id, name, description, "serverUrl", username, "apiToken", "webhookUrl", config, "isActive", "lastTestAt", "testStatus", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: jenkins_job_approvals; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.jenkins_job_approvals (id, "executionId", "approverId", level, status, comments, "approvedAt", "expiresAt", "isRequired", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: jenkins_job_configs; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.jenkins_job_configs (id, "jenkinsConfigId", "jobName", "displayName", description, "requireApproval", "approvalRoles", parameters, schedule, enabled, "isActive", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: jenkins_job_executions; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.jenkins_job_executions (id, "configId", "jobName", "operationType", status, "requestedBy", reason, parameters, "executionResult", "executedAt", "completedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: jenkins_job_group_mappings; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.jenkins_job_group_mappings (id, "groupId", "jobName", "sortOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: jenkins_job_groups; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.jenkins_job_groups (id, "jenkinsConfigId", name, description, color, icon, "sortOrder", "isActive", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: jenkins_job_notifiers; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.jenkins_job_notifiers (id, "executionId", "notifierId", "notifyOnSubmit", "notifyOnApprove", "notifyOnReject", "notifyOnExecute", "notifyOnComplete", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: kibana_dashboards; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.kibana_dashboards (id, "userId", name, description, config, "isTemplate", "isDefault", category, tags, "createdAt", "updatedAt") FROM stdin;
cmdsmxvbt00019wyhja3vtktz	cmdsmx4ql00009wfl9fwgnn79	系统监控仪表板模板	监控系统性能、错误日志和关键指标的标准模板	{"layout": {"grid": {"rows": 10, "columns": 12}, "panels": [{"id": "error-logs", "type": "logs", "title": "错误日志", "config": {"query": "level:ERROR", "columns": ["@timestamp", "level", "message", "source"], "timeRange": {"to": "now", "from": "now-1h"}}, "position": {"h": 4, "w": 6, "x": 0, "y": 0}}, {"id": "log-levels", "type": "pie", "title": "日志级别分布", "config": {"aggregation": {"type": "terms", "field": "level"}}, "position": {"h": 4, "w": 3, "x": 6, "y": 0}}, {"id": "timeline", "type": "histogram", "title": "日志时间线", "config": {"aggregation": {"type": "date_histogram", "field": "@timestamp", "interval": "5m"}}, "position": {"h": 4, "w": 3, "x": 9, "y": 0}}]}, "filters": [{"field": "level", "value": true, "operator": "exists"}], "timeRange": {"to": "now", "from": "now-1h"}, "refreshInterval": 30000}	t	f	system	{monitoring,system,performance,template}	2025-08-01 09:42:45.21	2025-08-01 09:42:45.21
cmdsmxvby00039wyhshe6otug	cmdsmx4ql00009wfl9fwgnn79	应用程序日志模板	专注于应用程序日志分析和调试的模板	{"layout": {"grid": {"rows": 10, "columns": 12}, "panels": [{"id": "app-errors", "type": "logs", "title": "应用程序错误", "config": {"query": "level:(ERROR OR FATAL) AND source:application", "columns": ["@timestamp", "level", "message", "stack_trace"], "timeRange": {"to": "now", "from": "now-2h"}}, "position": {"h": 5, "w": 8, "x": 0, "y": 0}}, {"id": "error-count", "type": "metric", "title": "错误计数", "config": {"aggregation": {"type": "count", "filter": "level:(ERROR OR FATAL)"}}, "position": {"h": 2, "w": 2, "x": 8, "y": 0}}]}, "filters": [{"field": "source", "value": "application", "operator": "is"}], "timeRange": {"to": "now", "from": "now-1h"}, "refreshInterval": 15000}	t	f	application	{application,debug,logs,template}	2025-08-01 09:42:45.215	2025-08-01 09:42:45.215
cmdsmxvc100059wyhsilphwlv	cmdsmx4ql00009wfl9fwgnn79	安全审计模板	安全事件监控和审计日志分析模板	{"layout": {"grid": {"rows": 10, "columns": 12}, "panels": [{"id": "security-events", "type": "logs", "title": "安全事件", "config": {"query": "category:security OR type:auth OR type:login", "columns": ["@timestamp", "event_type", "user", "ip_address", "result"], "timeRange": {"to": "now", "from": "now-24h"}}, "position": {"h": 5, "w": 6, "x": 0, "y": 0}}, {"id": "failed-logins", "type": "logs", "title": "登录失败", "config": {"query": "type:login AND result:failed", "columns": ["@timestamp", "user", "ip_address", "reason"], "timeRange": {"to": "now", "from": "now-24h"}}, "position": {"h": 5, "w": 6, "x": 6, "y": 0}}]}, "filters": [{"field": "category", "value": "security", "operator": "is"}], "timeRange": {"to": "now", "from": "now-24h"}, "refreshInterval": 60000}	t	f	security	{security,audit,monitoring,template}	2025-08-01 09:42:45.217	2025-08-01 09:42:45.217
\.


--
-- Data for Name: model_configs; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.model_configs (id, "userId", "modelName", "displayName", provider, "apiKey", "baseUrl", description, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.notifications (id, type, title, message, data, "isRead", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: permission_group_permissions; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.permission_group_permissions ("groupId", "permissionId", "createdAt") FROM stdin;
\.


--
-- Data for Name: permission_groups; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.permission_groups (id, name, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.permissions (id, name, code, description, category, "createdAt", "updatedAt") FROM stdin;
perm_users_read	用户查看	users:read	查看用户列表、用户信息等，但不能修改	用户管理	2025-08-01 09:42:11.031	2025-08-01 09:42:11.032
perm_users_write	用户管理	users:write	创建、编辑、删除用户，修改用户状态等	用户管理	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_permissions_read	权限查看	permissions:read	查看权限列表、用户权限分配等，但不能修改	权限管理	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_permissions_write	权限管理	permissions:write	分配和撤销用户权限，管理权限配置等	权限管理	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_servers_read	主机查看	servers:read	查看服务器列表、服务器状态、监控数据等	主机管理	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_servers_write	主机管理	servers:write	添加、编辑、删除服务器，执行服务器操作等	主机管理	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_cicd_read	CI/CD查看	cicd:read	查看项目列表、部署历史、构建日志等	CI/CD管理	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_cicd_write	CI/CD管理	cicd:write	创建项目、执行部署、管理构建配置等	CI/CD管理	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_approvals_read	审批查看	approvals:read	查看审批任务列表、审批历史等	审批管理	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_approvals_write	审批管理	approvals:write	处理审批任务、通过或拒绝审批等	审批管理	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_notifications_read	通知查看	notifications:read	查看通知列表、通知历史等	通知管理	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_notifications_write	通知管理	notifications:write	发送通知、管理通知配置、删除通知等	通知管理	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_config_read	配置查看	config:read	查看系统配置、API配置等	配置管理	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_config_write	配置管理	config:write	修改系统配置、API密钥、模型配置等	配置管理	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_ai_read	AI助手查看	ai:read	查看AI对话历史、模型配置等	AI功能	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_ai_write	AI助手使用	ai:write	使用AI助手功能、创建对话、管理对话历史等	AI功能	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_monitoring_read	监控查看	monitoring:read	查看系统监控数据、性能指标等	系统监控	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
perm_monitoring_write	监控管理	monitoring:write	配置监控规则、管理告警设置等	系统监控	2025-08-01 09:42:11.032	2025-08-01 09:42:11.032
\.


--
-- Data for Name: pipelines; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.pipelines (id, "projectId", name, description, "jenkinsJobName", parameters, triggers, stages, "isActive", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: preset_models; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.preset_models (id, name, "displayName", provider, description, "contextLength", "maxTokens", "supportedFeatures", "isActive", "createdAt", "updatedAt") FROM stdin;
cmdsmxldr00009wrct2rfneno	gpt-4o	GPT-4o	openai-compatible	OpenAI最新的多模态模型，支持文本、图像、音频输入	128000	4096	{chat,completion,vision,tools,streaming,json_mode}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr00019wrcbdd3taup	gpt-4o-mini	GPT-4o Mini	openai-compatible	GPT-4o的轻量级版本，性价比更高	128000	4096	{chat,completion,vision,tools,streaming,json_mode}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr00029wrc5lkqsnde	gpt-4-turbo	GPT-4 Turbo	openai-compatible	GPT-4的优化版本，响应更快	128000	4096	{chat,completion,tools,streaming,json_mode}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr00039wrccbwb2sl4	gpt-3.5-turbo	GPT-3.5 Turbo	openai-compatible	快速且经济的对话模型	16385	4096	{chat,completion,streaming,json_mode}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr00049wrcpihci0tw	deepseek-chat	DeepSeek Chat	deepseek	DeepSeek的对话模型，支持中文优化	32768	4096	{chat,completion,streaming}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr00059wrcovivesxl	deepseek-coder	DeepSeek Coder	deepseek	专为代码生成优化的模型	16384	4096	{chat,completion,streaming}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr00069wrcg99c7dbk	deepseek-vision	DeepSeek Vision	deepseek	支持视觉理解的多模态模型	32768	4096	{chat,completion,vision,streaming}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr00079wrc3uxsvoh8	gemini-1.5-pro	Gemini 1.5 Pro	gemini	Google最新的多模态模型，支持超长上下文	1000000	8192	{chat,completion,vision,tools,streaming}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr00089wrchfjk1rgv	gemini-1.5-flash	Gemini 1.5 Flash	gemini	Gemini 1.5的快速版本，性价比更高	1000000	8192	{chat,completion,vision,tools,streaming}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr00099wrc6r81rfp8	gemini-pro	Gemini Pro	gemini	Google的文本生成模型	32768	2048	{chat,completion,streaming}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr000a9wrcjr9bndc8	qwen-turbo	Qwen Turbo	qwen	阿里云Qwen的快速对话模型	8192	1500	{chat,completion,streaming}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr000b9wrcg4d2xfyi	qwen-plus	Qwen Plus	qwen	Qwen的高性能对话模型	32768	1500	{chat,completion,streaming}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr000c9wrckn2z3ih8	qwen-max	Qwen Max	qwen	Qwen的最强对话模型	32768	1500	{chat,completion,streaming}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr000d9wrcul7340ec	qwen-vl-plus	Qwen VL Plus	qwen	Qwen的多模态视觉语言模型	32768	1500	{chat,completion,vision,streaming}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr000e9wrcu5ilg9u9	doubao-pro-4k	Doubao Pro 4K	doubao	豆包Pro 4K上下文模型	4096	2048	{chat,completion,streaming}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr000f9wrc8pufxjhj	doubao-pro-32k	Doubao Pro 32K	doubao	豆包Pro 32K上下文模型	32768	2048	{chat,completion,streaming}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
cmdsmxldr000g9wrcampizhqv	doubao-lite	Doubao Lite	doubao	豆包轻量级模型，快速响应	4096	1024	{chat,completion,streaming}	t	2025-08-01 09:42:32.319	2025-08-01 09:42:32.319
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.roles (name, "displayName", description, permissions, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: server_alerts; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.server_alerts (id, "serverId", type, level, title, message, threshold, "currentValue", "isResolved", "resolvedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: server_logs; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.server_logs (id, "serverId", level, source, message, metadata, "timestamp") FROM stdin;
\.


--
-- Data for Name: server_metrics; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.server_metrics (id, "serverId", "timestamp", "cpuUsage", "cpuCores", "memoryTotal", "memoryUsed", "diskTotal", "diskUsed", "networkIn", "networkOut", uptime) FROM stdin;
\.


--
-- Data for Name: servers; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.servers (id, name, hostname, ip, port, status, os, version, location, tags, description, username, password, "keyPath", "lastConnectedAt", "userId", "createdAt", "updatedAt", "authType", "isActive", datacenter) FROM stdin;
\.


--
-- Data for Name: system_configs; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.system_configs (key, value, category, description, "isPublic", "createdAt", "updatedAt") FROM stdin;
protected_users	"[\\"cmdsmx4ql00009wfl9fwgnn79\\"]"	security	受保护的用户列表，这些用户无法被删除	f	2025-08-01 09:42:10.756	2025-08-01 09:42:10.756
\.


--
-- Data for Name: system_logs; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.system_logs (id, level, category, message, details, source, "userId", metadata, "timestamp") FROM stdin;
\.


--
-- Data for Name: user_model_selections; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.user_model_selections (id, "userId", "selectedModelId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_permission_groups; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.user_permission_groups ("userId", "groupId", "createdAt") FROM stdin;
\.


--
-- Data for Name: user_registrations; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.user_registrations (id, username, email, password, "realName", reason, "permissionGroupId", status, "submittedAt", "reviewedAt", "reviewedBy", "reviewNote", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: wuhr_admin
--

COPY public.users (id, username, email, password, role, permissions, "isActive", "lastLoginAt", "createdAt", "updatedAt", "approvalStatus", "approvedAt", "approvedBy", "rejectedReason", "realName") FROM stdin;
cmdsmx4ql00009wfl9fwgnn79	admin	admin@wuhr.ai	$2a$12$oVaA.94V8r.Sy9eprM.RDe4B4Dit00WfqZWcnIftnglUahMdExghW	admin	{users:read,users:write,permissions:read,permissions:write,servers:read,servers:write,cicd:read,cicd:write,approvals:read,approvals:write,notifications:read,notifications:write,config:read,config:write,ai:read,ai:write,monitoring:read,monitoring:write}	t	2025-08-01 09:44:13.556	2025-08-01 09:42:10.749	2025-08-01 09:44:13.556	approved	\N	\N	\N	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: approval_records approval_records_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.approval_records
    ADD CONSTRAINT approval_records_pkey PRIMARY KEY (id);


--
-- Name: approval_workflows approval_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.approval_workflows
    ADD CONSTRAINT approval_workflows_pkey PRIMARY KEY (id);


--
-- Name: auth_logs auth_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.auth_logs
    ADD CONSTRAINT auth_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_sessions auth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);


--
-- Name: builds builds_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.builds
    ADD CONSTRAINT builds_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: cicd_projects cicd_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.cicd_projects
    ADD CONSTRAINT cicd_projects_pkey PRIMARY KEY (id);


--
-- Name: deployment_approvals deployment_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.deployment_approvals
    ADD CONSTRAINT deployment_approvals_pkey PRIMARY KEY (id);


--
-- Name: deployment_templates deployment_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.deployment_templates
    ADD CONSTRAINT deployment_templates_pkey PRIMARY KEY (id);


--
-- Name: deployments deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT deployments_pkey PRIMARY KEY (id);


--
-- Name: elk_configs elk_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.elk_configs
    ADD CONSTRAINT elk_configs_pkey PRIMARY KEY (id);


--
-- Name: elk_viewer_configs elk_viewer_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.elk_viewer_configs
    ADD CONSTRAINT elk_viewer_configs_pkey PRIMARY KEY (id);


--
-- Name: git_credentials git_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.git_credentials
    ADD CONSTRAINT git_credentials_pkey PRIMARY KEY (id);


--
-- Name: grafana_configs grafana_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.grafana_configs
    ADD CONSTRAINT grafana_configs_pkey PRIMARY KEY (id);


--
-- Name: info_notifications info_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.info_notifications
    ADD CONSTRAINT info_notifications_pkey PRIMARY KEY (id);


--
-- Name: jenkins_config_approvers jenkins_config_approvers_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_config_approvers
    ADD CONSTRAINT jenkins_config_approvers_pkey PRIMARY KEY (id);


--
-- Name: jenkins_configs jenkins_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_configs
    ADD CONSTRAINT jenkins_configs_pkey PRIMARY KEY (id);


--
-- Name: jenkins_job_approvals jenkins_job_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_approvals
    ADD CONSTRAINT jenkins_job_approvals_pkey PRIMARY KEY (id);


--
-- Name: jenkins_job_configs jenkins_job_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_configs
    ADD CONSTRAINT jenkins_job_configs_pkey PRIMARY KEY (id);


--
-- Name: jenkins_job_executions jenkins_job_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_executions
    ADD CONSTRAINT jenkins_job_executions_pkey PRIMARY KEY (id);


--
-- Name: jenkins_job_group_mappings jenkins_job_group_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_group_mappings
    ADD CONSTRAINT jenkins_job_group_mappings_pkey PRIMARY KEY (id);


--
-- Name: jenkins_job_groups jenkins_job_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_groups
    ADD CONSTRAINT jenkins_job_groups_pkey PRIMARY KEY (id);


--
-- Name: jenkins_job_notifiers jenkins_job_notifiers_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_notifiers
    ADD CONSTRAINT jenkins_job_notifiers_pkey PRIMARY KEY (id);


--
-- Name: kibana_dashboards kibana_dashboards_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.kibana_dashboards
    ADD CONSTRAINT kibana_dashboards_pkey PRIMARY KEY (id);


--
-- Name: model_configs model_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.model_configs
    ADD CONSTRAINT model_configs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: permission_group_permissions permission_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.permission_group_permissions
    ADD CONSTRAINT permission_group_permissions_pkey PRIMARY KEY ("groupId", "permissionId");


--
-- Name: permission_groups permission_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.permission_groups
    ADD CONSTRAINT permission_groups_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: pipelines pipelines_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_pkey PRIMARY KEY (id);


--
-- Name: preset_models preset_models_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.preset_models
    ADD CONSTRAINT preset_models_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (name);


--
-- Name: server_alerts server_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.server_alerts
    ADD CONSTRAINT server_alerts_pkey PRIMARY KEY (id);


--
-- Name: server_logs server_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.server_logs
    ADD CONSTRAINT server_logs_pkey PRIMARY KEY (id);


--
-- Name: server_metrics server_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.server_metrics
    ADD CONSTRAINT server_metrics_pkey PRIMARY KEY (id);


--
-- Name: servers servers_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.servers
    ADD CONSTRAINT servers_pkey PRIMARY KEY (id);


--
-- Name: system_configs system_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT system_configs_pkey PRIMARY KEY (key);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- Name: user_model_selections user_model_selections_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.user_model_selections
    ADD CONSTRAINT user_model_selections_pkey PRIMARY KEY (id);


--
-- Name: user_permission_groups user_permission_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.user_permission_groups
    ADD CONSTRAINT user_permission_groups_pkey PRIMARY KEY ("userId", "groupId");


--
-- Name: user_registrations user_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.user_registrations
    ADD CONSTRAINT user_registrations_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: api_keys_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "api_keys_isActive_idx" ON public.api_keys USING btree ("isActive");


--
-- Name: api_keys_isDefault_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "api_keys_isDefault_idx" ON public.api_keys USING btree ("isDefault");


--
-- Name: api_keys_provider_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX api_keys_provider_idx ON public.api_keys USING btree (provider);


--
-- Name: api_keys_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "api_keys_userId_idx" ON public.api_keys USING btree ("userId");


--
-- Name: approval_records_action_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX approval_records_action_idx ON public.approval_records USING btree (action);


--
-- Name: approval_records_approvalType_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "approval_records_approvalType_idx" ON public.approval_records USING btree ("approvalType");


--
-- Name: approval_records_operatedAt_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "approval_records_operatedAt_idx" ON public.approval_records USING btree ("operatedAt");


--
-- Name: approval_records_operatorId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "approval_records_operatorId_idx" ON public.approval_records USING btree ("operatorId");


--
-- Name: approval_records_targetId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "approval_records_targetId_idx" ON public.approval_records USING btree ("targetId");


--
-- Name: approval_workflows_environment_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX approval_workflows_environment_idx ON public.approval_workflows USING btree (environment);


--
-- Name: approval_workflows_isDefault_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "approval_workflows_isDefault_idx" ON public.approval_workflows USING btree ("isDefault");


--
-- Name: approval_workflows_projectId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "approval_workflows_projectId_idx" ON public.approval_workflows USING btree ("projectId");


--
-- Name: approval_workflows_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "approval_workflows_userId_idx" ON public.approval_workflows USING btree ("userId");


--
-- Name: auth_logs_action_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX auth_logs_action_idx ON public.auth_logs USING btree (action);


--
-- Name: auth_logs_success_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX auth_logs_success_idx ON public.auth_logs USING btree (success);


--
-- Name: auth_logs_timestamp_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX auth_logs_timestamp_idx ON public.auth_logs USING btree ("timestamp");


--
-- Name: auth_logs_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "auth_logs_userId_idx" ON public.auth_logs USING btree ("userId");


--
-- Name: auth_sessions_expiresAt_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "auth_sessions_expiresAt_idx" ON public.auth_sessions USING btree ("expiresAt");


--
-- Name: auth_sessions_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "auth_sessions_isActive_idx" ON public.auth_sessions USING btree ("isActive");


--
-- Name: auth_sessions_refreshTokenId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "auth_sessions_refreshTokenId_idx" ON public.auth_sessions USING btree ("refreshTokenId");


--
-- Name: auth_sessions_refreshTokenId_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX "auth_sessions_refreshTokenId_key" ON public.auth_sessions USING btree ("refreshTokenId");


--
-- Name: auth_sessions_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "auth_sessions_userId_idx" ON public.auth_sessions USING btree ("userId");


--
-- Name: builds_buildNumber_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "builds_buildNumber_idx" ON public.builds USING btree ("buildNumber");


--
-- Name: builds_jenkinsConfigId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "builds_jenkinsConfigId_idx" ON public.builds USING btree ("jenkinsConfigId");


--
-- Name: builds_pipelineId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "builds_pipelineId_idx" ON public.builds USING btree ("pipelineId");


--
-- Name: builds_startedAt_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "builds_startedAt_idx" ON public.builds USING btree ("startedAt");


--
-- Name: builds_status_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX builds_status_idx ON public.builds USING btree (status);


--
-- Name: builds_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "builds_userId_idx" ON public.builds USING btree ("userId");


--
-- Name: chat_messages_createdAt_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "chat_messages_createdAt_idx" ON public.chat_messages USING btree ("createdAt");


--
-- Name: chat_messages_sessionId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "chat_messages_sessionId_idx" ON public.chat_messages USING btree ("sessionId");


--
-- Name: chat_messages_type_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX chat_messages_type_idx ON public.chat_messages USING btree (type);


--
-- Name: chat_sessions_createdAt_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "chat_sessions_createdAt_idx" ON public.chat_sessions USING btree ("createdAt");


--
-- Name: chat_sessions_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "chat_sessions_userId_idx" ON public.chat_sessions USING btree ("userId");


--
-- Name: cicd_projects_environment_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX cicd_projects_environment_idx ON public.cicd_projects USING btree (environment);


--
-- Name: cicd_projects_gitCredentialId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "cicd_projects_gitCredentialId_idx" ON public.cicd_projects USING btree ("gitCredentialId");


--
-- Name: cicd_projects_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "cicd_projects_isActive_idx" ON public.cicd_projects USING btree ("isActive");


--
-- Name: cicd_projects_serverId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "cicd_projects_serverId_idx" ON public.cicd_projects USING btree ("serverId");


--
-- Name: cicd_projects_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "cicd_projects_userId_idx" ON public.cicd_projects USING btree ("userId");


--
-- Name: deployment_approvals_approverId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "deployment_approvals_approverId_idx" ON public.deployment_approvals USING btree ("approverId");


--
-- Name: deployment_approvals_deploymentId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "deployment_approvals_deploymentId_idx" ON public.deployment_approvals USING btree ("deploymentId");


--
-- Name: deployment_approvals_level_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX deployment_approvals_level_idx ON public.deployment_approvals USING btree (level);


--
-- Name: deployment_approvals_status_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX deployment_approvals_status_idx ON public.deployment_approvals USING btree (status);


--
-- Name: deployment_templates_createdAt_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "deployment_templates_createdAt_idx" ON public.deployment_templates USING btree ("createdAt");


--
-- Name: deployment_templates_createdBy_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "deployment_templates_createdBy_idx" ON public.deployment_templates USING btree ("createdBy");


--
-- Name: deployment_templates_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "deployment_templates_isActive_idx" ON public.deployment_templates USING btree ("isActive");


--
-- Name: deployment_templates_type_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX deployment_templates_type_idx ON public.deployment_templates USING btree (type);


--
-- Name: deployments_buildId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "deployments_buildId_idx" ON public.deployments USING btree ("buildId");


--
-- Name: deployments_createdAt_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "deployments_createdAt_idx" ON public.deployments USING btree ("createdAt");


--
-- Name: deployments_environment_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX deployments_environment_idx ON public.deployments USING btree (environment);


--
-- Name: deployments_projectId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "deployments_projectId_idx" ON public.deployments USING btree ("projectId");


--
-- Name: deployments_requireApproval_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "deployments_requireApproval_idx" ON public.deployments USING btree ("requireApproval");


--
-- Name: deployments_scheduledAt_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "deployments_scheduledAt_idx" ON public.deployments USING btree ("scheduledAt");


--
-- Name: deployments_status_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX deployments_status_idx ON public.deployments USING btree (status);


--
-- Name: deployments_templateId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "deployments_templateId_idx" ON public.deployments USING btree ("templateId");


--
-- Name: deployments_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "deployments_userId_idx" ON public.deployments USING btree ("userId");


--
-- Name: elk_configs_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "elk_configs_isActive_idx" ON public.elk_configs USING btree ("isActive");


--
-- Name: elk_configs_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "elk_configs_userId_idx" ON public.elk_configs USING btree ("userId");


--
-- Name: elk_viewer_configs_userId_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX "elk_viewer_configs_userId_key" ON public.elk_viewer_configs USING btree ("userId");


--
-- Name: git_credentials_authType_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "git_credentials_authType_idx" ON public.git_credentials USING btree ("authType");


--
-- Name: git_credentials_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "git_credentials_isActive_idx" ON public.git_credentials USING btree ("isActive");


--
-- Name: git_credentials_isDefault_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "git_credentials_isDefault_idx" ON public.git_credentials USING btree ("isDefault");


--
-- Name: git_credentials_platform_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX git_credentials_platform_idx ON public.git_credentials USING btree (platform);


--
-- Name: git_credentials_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "git_credentials_userId_idx" ON public.git_credentials USING btree ("userId");


--
-- Name: grafana_configs_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "grafana_configs_isActive_idx" ON public.grafana_configs USING btree ("isActive");


--
-- Name: grafana_configs_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "grafana_configs_userId_idx" ON public.grafana_configs USING btree ("userId");


--
-- Name: info_notifications_createdAt_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "info_notifications_createdAt_idx" ON public.info_notifications USING btree ("createdAt");


--
-- Name: info_notifications_expiresAt_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "info_notifications_expiresAt_idx" ON public.info_notifications USING btree ("expiresAt");


--
-- Name: info_notifications_isRead_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "info_notifications_isRead_idx" ON public.info_notifications USING btree ("isRead");


--
-- Name: info_notifications_type_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX info_notifications_type_idx ON public.info_notifications USING btree (type);


--
-- Name: info_notifications_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "info_notifications_userId_idx" ON public.info_notifications USING btree ("userId");


--
-- Name: jenkins_config_approvers_approverId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_config_approvers_approverId_idx" ON public.jenkins_config_approvers USING btree ("approverId");


--
-- Name: jenkins_config_approvers_configId_approverId_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX "jenkins_config_approvers_configId_approverId_key" ON public.jenkins_config_approvers USING btree ("configId", "approverId");


--
-- Name: jenkins_config_approvers_configId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_config_approvers_configId_idx" ON public.jenkins_config_approvers USING btree ("configId");


--
-- Name: jenkins_config_approvers_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_config_approvers_isActive_idx" ON public.jenkins_config_approvers USING btree ("isActive");


--
-- Name: jenkins_configs_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_configs_isActive_idx" ON public.jenkins_configs USING btree ("isActive");


--
-- Name: jenkins_configs_testStatus_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_configs_testStatus_idx" ON public.jenkins_configs USING btree ("testStatus");


--
-- Name: jenkins_configs_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_configs_userId_idx" ON public.jenkins_configs USING btree ("userId");


--
-- Name: jenkins_job_approvals_approverId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_approvals_approverId_idx" ON public.jenkins_job_approvals USING btree ("approverId");


--
-- Name: jenkins_job_approvals_executionId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_approvals_executionId_idx" ON public.jenkins_job_approvals USING btree ("executionId");


--
-- Name: jenkins_job_approvals_level_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX jenkins_job_approvals_level_idx ON public.jenkins_job_approvals USING btree (level);


--
-- Name: jenkins_job_approvals_status_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX jenkins_job_approvals_status_idx ON public.jenkins_job_approvals USING btree (status);


--
-- Name: jenkins_job_configs_enabled_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX jenkins_job_configs_enabled_idx ON public.jenkins_job_configs USING btree (enabled);


--
-- Name: jenkins_job_configs_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_configs_isActive_idx" ON public.jenkins_job_configs USING btree ("isActive");


--
-- Name: jenkins_job_configs_jenkinsConfigId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_configs_jenkinsConfigId_idx" ON public.jenkins_job_configs USING btree ("jenkinsConfigId");


--
-- Name: jenkins_job_configs_jenkinsConfigId_jobName_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX "jenkins_job_configs_jenkinsConfigId_jobName_key" ON public.jenkins_job_configs USING btree ("jenkinsConfigId", "jobName");


--
-- Name: jenkins_job_configs_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_configs_userId_idx" ON public.jenkins_job_configs USING btree ("userId");


--
-- Name: jenkins_job_executions_configId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_executions_configId_idx" ON public.jenkins_job_executions USING btree ("configId");


--
-- Name: jenkins_job_executions_operationType_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_executions_operationType_idx" ON public.jenkins_job_executions USING btree ("operationType");


--
-- Name: jenkins_job_executions_requestedBy_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_executions_requestedBy_idx" ON public.jenkins_job_executions USING btree ("requestedBy");


--
-- Name: jenkins_job_executions_status_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX jenkins_job_executions_status_idx ON public.jenkins_job_executions USING btree (status);


--
-- Name: jenkins_job_group_mappings_groupId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_group_mappings_groupId_idx" ON public.jenkins_job_group_mappings USING btree ("groupId");


--
-- Name: jenkins_job_group_mappings_groupId_jobName_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX "jenkins_job_group_mappings_groupId_jobName_key" ON public.jenkins_job_group_mappings USING btree ("groupId", "jobName");


--
-- Name: jenkins_job_group_mappings_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_group_mappings_isActive_idx" ON public.jenkins_job_group_mappings USING btree ("isActive");


--
-- Name: jenkins_job_group_mappings_jobName_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_group_mappings_jobName_idx" ON public.jenkins_job_group_mappings USING btree ("jobName");


--
-- Name: jenkins_job_groups_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_groups_isActive_idx" ON public.jenkins_job_groups USING btree ("isActive");


--
-- Name: jenkins_job_groups_jenkinsConfigId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_groups_jenkinsConfigId_idx" ON public.jenkins_job_groups USING btree ("jenkinsConfigId");


--
-- Name: jenkins_job_groups_sortOrder_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_groups_sortOrder_idx" ON public.jenkins_job_groups USING btree ("sortOrder");


--
-- Name: jenkins_job_groups_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_groups_userId_idx" ON public.jenkins_job_groups USING btree ("userId");


--
-- Name: jenkins_job_notifiers_executionId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_notifiers_executionId_idx" ON public.jenkins_job_notifiers USING btree ("executionId");


--
-- Name: jenkins_job_notifiers_executionId_notifierId_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX "jenkins_job_notifiers_executionId_notifierId_key" ON public.jenkins_job_notifiers USING btree ("executionId", "notifierId");


--
-- Name: jenkins_job_notifiers_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_notifiers_isActive_idx" ON public.jenkins_job_notifiers USING btree ("isActive");


--
-- Name: jenkins_job_notifiers_notifierId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "jenkins_job_notifiers_notifierId_idx" ON public.jenkins_job_notifiers USING btree ("notifierId");


--
-- Name: kibana_dashboards_category_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX kibana_dashboards_category_idx ON public.kibana_dashboards USING btree (category);


--
-- Name: kibana_dashboards_isTemplate_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "kibana_dashboards_isTemplate_idx" ON public.kibana_dashboards USING btree ("isTemplate");


--
-- Name: kibana_dashboards_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "kibana_dashboards_userId_idx" ON public.kibana_dashboards USING btree ("userId");


--
-- Name: model_configs_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "model_configs_isActive_idx" ON public.model_configs USING btree ("isActive");


--
-- Name: model_configs_provider_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX model_configs_provider_idx ON public.model_configs USING btree (provider);


--
-- Name: model_configs_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "model_configs_userId_idx" ON public.model_configs USING btree ("userId");


--
-- Name: model_configs_userId_modelName_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX "model_configs_userId_modelName_key" ON public.model_configs USING btree ("userId", "modelName");


--
-- Name: notifications_createdAt_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "notifications_createdAt_idx" ON public.notifications USING btree ("createdAt");


--
-- Name: notifications_isRead_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "notifications_isRead_idx" ON public.notifications USING btree ("isRead");


--
-- Name: notifications_type_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX notifications_type_idx ON public.notifications USING btree (type);


--
-- Name: notifications_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "notifications_userId_idx" ON public.notifications USING btree ("userId");


--
-- Name: permission_group_permissions_groupId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "permission_group_permissions_groupId_idx" ON public.permission_group_permissions USING btree ("groupId");


--
-- Name: permission_group_permissions_permissionId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "permission_group_permissions_permissionId_idx" ON public.permission_group_permissions USING btree ("permissionId");


--
-- Name: permission_groups_name_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX permission_groups_name_idx ON public.permission_groups USING btree (name);


--
-- Name: permissions_category_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX permissions_category_idx ON public.permissions USING btree (category);


--
-- Name: permissions_code_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX permissions_code_idx ON public.permissions USING btree (code);


--
-- Name: permissions_code_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX permissions_code_key ON public.permissions USING btree (code);


--
-- Name: pipelines_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "pipelines_isActive_idx" ON public.pipelines USING btree ("isActive");


--
-- Name: pipelines_projectId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "pipelines_projectId_idx" ON public.pipelines USING btree ("projectId");


--
-- Name: pipelines_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "pipelines_userId_idx" ON public.pipelines USING btree ("userId");


--
-- Name: preset_models_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "preset_models_isActive_idx" ON public.preset_models USING btree ("isActive");


--
-- Name: preset_models_name_provider_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX preset_models_name_provider_key ON public.preset_models USING btree (name, provider);


--
-- Name: preset_models_provider_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX preset_models_provider_idx ON public.preset_models USING btree (provider);


--
-- Name: server_alerts_createdAt_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "server_alerts_createdAt_idx" ON public.server_alerts USING btree ("createdAt");


--
-- Name: server_alerts_isResolved_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "server_alerts_isResolved_idx" ON public.server_alerts USING btree ("isResolved");


--
-- Name: server_alerts_level_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX server_alerts_level_idx ON public.server_alerts USING btree (level);


--
-- Name: server_alerts_serverId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "server_alerts_serverId_idx" ON public.server_alerts USING btree ("serverId");


--
-- Name: server_logs_level_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX server_logs_level_idx ON public.server_logs USING btree (level);


--
-- Name: server_logs_serverId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "server_logs_serverId_idx" ON public.server_logs USING btree ("serverId");


--
-- Name: server_logs_source_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX server_logs_source_idx ON public.server_logs USING btree (source);


--
-- Name: server_logs_timestamp_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX server_logs_timestamp_idx ON public.server_logs USING btree ("timestamp");


--
-- Name: server_metrics_serverId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "server_metrics_serverId_idx" ON public.server_metrics USING btree ("serverId");


--
-- Name: server_metrics_timestamp_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX server_metrics_timestamp_idx ON public.server_metrics USING btree ("timestamp");


--
-- Name: servers_hostname_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX servers_hostname_idx ON public.servers USING btree (hostname);


--
-- Name: servers_ip_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX servers_ip_idx ON public.servers USING btree (ip);


--
-- Name: servers_status_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX servers_status_idx ON public.servers USING btree (status);


--
-- Name: servers_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "servers_userId_idx" ON public.servers USING btree ("userId");


--
-- Name: system_configs_category_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX system_configs_category_idx ON public.system_configs USING btree (category);


--
-- Name: system_configs_isPublic_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "system_configs_isPublic_idx" ON public.system_configs USING btree ("isPublic");


--
-- Name: system_logs_category_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX system_logs_category_idx ON public.system_logs USING btree (category);


--
-- Name: system_logs_level_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX system_logs_level_idx ON public.system_logs USING btree (level);


--
-- Name: system_logs_timestamp_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX system_logs_timestamp_idx ON public.system_logs USING btree ("timestamp");


--
-- Name: system_logs_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "system_logs_userId_idx" ON public.system_logs USING btree ("userId");


--
-- Name: user_model_selections_selectedModelId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "user_model_selections_selectedModelId_idx" ON public.user_model_selections USING btree ("selectedModelId");


--
-- Name: user_model_selections_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "user_model_selections_userId_idx" ON public.user_model_selections USING btree ("userId");


--
-- Name: user_model_selections_userId_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX "user_model_selections_userId_key" ON public.user_model_selections USING btree ("userId");


--
-- Name: user_permission_groups_groupId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "user_permission_groups_groupId_idx" ON public.user_permission_groups USING btree ("groupId");


--
-- Name: user_permission_groups_userId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "user_permission_groups_userId_idx" ON public.user_permission_groups USING btree ("userId");


--
-- Name: user_registrations_email_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX user_registrations_email_key ON public.user_registrations USING btree (email);


--
-- Name: user_registrations_permissionGroupId_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "user_registrations_permissionGroupId_idx" ON public.user_registrations USING btree ("permissionGroupId");


--
-- Name: user_registrations_status_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX user_registrations_status_idx ON public.user_registrations USING btree (status);


--
-- Name: user_registrations_submittedAt_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "user_registrations_submittedAt_idx" ON public.user_registrations USING btree ("submittedAt");


--
-- Name: user_registrations_username_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX user_registrations_username_key ON public.user_registrations USING btree (username);


--
-- Name: users_approvalStatus_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "users_approvalStatus_idx" ON public.users USING btree ("approvalStatus");


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_isActive_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX "users_isActive_idx" ON public.users USING btree ("isActive");


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: users_username_idx; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE INDEX users_username_idx ON public.users USING btree (username);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: wuhr_admin
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: api_keys api_keys_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: approval_records approval_records_operatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.approval_records
    ADD CONSTRAINT "approval_records_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: approval_workflows approval_workflows_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.approval_workflows
    ADD CONSTRAINT "approval_workflows_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.cicd_projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: approval_workflows approval_workflows_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.approval_workflows
    ADD CONSTRAINT "approval_workflows_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auth_logs auth_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.auth_logs
    ADD CONSTRAINT "auth_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: auth_sessions auth_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: builds builds_jenkinsConfigId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.builds
    ADD CONSTRAINT "builds_jenkinsConfigId_fkey" FOREIGN KEY ("jenkinsConfigId") REFERENCES public.jenkins_configs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: builds builds_pipelineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.builds
    ADD CONSTRAINT "builds_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES public.pipelines(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: builds builds_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.builds
    ADD CONSTRAINT "builds_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.chat_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_sessions chat_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cicd_projects cicd_projects_gitCredentialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.cicd_projects
    ADD CONSTRAINT "cicd_projects_gitCredentialId_fkey" FOREIGN KEY ("gitCredentialId") REFERENCES public.git_credentials(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cicd_projects cicd_projects_serverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.cicd_projects
    ADD CONSTRAINT "cicd_projects_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES public.servers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cicd_projects cicd_projects_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.cicd_projects
    ADD CONSTRAINT "cicd_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deployment_approvals deployment_approvals_approverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.deployment_approvals
    ADD CONSTRAINT "deployment_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deployment_approvals deployment_approvals_deploymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.deployment_approvals
    ADD CONSTRAINT "deployment_approvals_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES public.deployments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deployment_templates deployment_templates_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.deployment_templates
    ADD CONSTRAINT "deployment_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deployments deployments_buildId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT "deployments_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES public.builds(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: deployments deployments_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT "deployments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.cicd_projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: deployments deployments_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT "deployments_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.deployment_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: deployments deployments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT "deployments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: elk_configs elk_configs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.elk_configs
    ADD CONSTRAINT "elk_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: elk_viewer_configs elk_viewer_configs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.elk_viewer_configs
    ADD CONSTRAINT "elk_viewer_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: git_credentials git_credentials_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.git_credentials
    ADD CONSTRAINT "git_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: grafana_configs grafana_configs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.grafana_configs
    ADD CONSTRAINT "grafana_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: info_notifications info_notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.info_notifications
    ADD CONSTRAINT "info_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_config_approvers jenkins_config_approvers_approverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_config_approvers
    ADD CONSTRAINT "jenkins_config_approvers_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_config_approvers jenkins_config_approvers_configId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_config_approvers
    ADD CONSTRAINT "jenkins_config_approvers_configId_fkey" FOREIGN KEY ("configId") REFERENCES public.jenkins_configs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_configs jenkins_configs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_configs
    ADD CONSTRAINT "jenkins_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_job_approvals jenkins_job_approvals_approverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_approvals
    ADD CONSTRAINT "jenkins_job_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_job_approvals jenkins_job_approvals_executionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_approvals
    ADD CONSTRAINT "jenkins_job_approvals_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES public.jenkins_job_executions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_job_configs jenkins_job_configs_jenkinsConfigId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_configs
    ADD CONSTRAINT "jenkins_job_configs_jenkinsConfigId_fkey" FOREIGN KEY ("jenkinsConfigId") REFERENCES public.jenkins_configs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_job_configs jenkins_job_configs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_configs
    ADD CONSTRAINT "jenkins_job_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_job_executions jenkins_job_executions_configId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_executions
    ADD CONSTRAINT "jenkins_job_executions_configId_fkey" FOREIGN KEY ("configId") REFERENCES public.jenkins_configs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_job_executions jenkins_job_executions_requestedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_executions
    ADD CONSTRAINT "jenkins_job_executions_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_job_group_mappings jenkins_job_group_mappings_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_group_mappings
    ADD CONSTRAINT "jenkins_job_group_mappings_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.jenkins_job_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_job_groups jenkins_job_groups_jenkinsConfigId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_groups
    ADD CONSTRAINT "jenkins_job_groups_jenkinsConfigId_fkey" FOREIGN KEY ("jenkinsConfigId") REFERENCES public.jenkins_configs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_job_groups jenkins_job_groups_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_groups
    ADD CONSTRAINT "jenkins_job_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_job_notifiers jenkins_job_notifiers_executionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_notifiers
    ADD CONSTRAINT "jenkins_job_notifiers_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES public.jenkins_job_executions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jenkins_job_notifiers jenkins_job_notifiers_notifierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.jenkins_job_notifiers
    ADD CONSTRAINT "jenkins_job_notifiers_notifierId_fkey" FOREIGN KEY ("notifierId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kibana_dashboards kibana_dashboards_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.kibana_dashboards
    ADD CONSTRAINT "kibana_dashboards_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: model_configs model_configs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.model_configs
    ADD CONSTRAINT "model_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: permission_group_permissions permission_group_permissions_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.permission_group_permissions
    ADD CONSTRAINT "permission_group_permissions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.permission_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: permission_group_permissions permission_group_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.permission_group_permissions
    ADD CONSTRAINT "permission_group_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pipelines pipelines_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT "pipelines_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.cicd_projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pipelines pipelines_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT "pipelines_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: server_alerts server_alerts_serverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.server_alerts
    ADD CONSTRAINT "server_alerts_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES public.servers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: server_logs server_logs_serverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.server_logs
    ADD CONSTRAINT "server_logs_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES public.servers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: server_metrics server_metrics_serverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.server_metrics
    ADD CONSTRAINT "server_metrics_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES public.servers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: servers servers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.servers
    ADD CONSTRAINT "servers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_model_selections user_model_selections_selectedModelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.user_model_selections
    ADD CONSTRAINT "user_model_selections_selectedModelId_fkey" FOREIGN KEY ("selectedModelId") REFERENCES public.model_configs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_model_selections user_model_selections_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.user_model_selections
    ADD CONSTRAINT "user_model_selections_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_permission_groups user_permission_groups_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.user_permission_groups
    ADD CONSTRAINT "user_permission_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.permission_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_permission_groups user_permission_groups_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.user_permission_groups
    ADD CONSTRAINT "user_permission_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_approvedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuhr_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: wuhr_admin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

