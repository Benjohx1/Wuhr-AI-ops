// CI/CD 相关类型定义

export interface CICDProject {
  id: string
  name: string
  description?: string
  repositoryUrl: string
  repositoryType: string
  branch: string
  buildScript?: string
  deployScript?: string
  environment: 'dev' | 'test' | 'prod'
  isActive: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface CICDProjectWithDetails extends CICDProject {
  jenkinsConfigs: Array<{
    id: string
    name: string
    testStatus?: string
  }>
  _count: {
    deployments: number
    pipelines: number
  }
}

export interface JenkinsConfig {
  id: string
  projectId: string
  name: string
  description?: string
  serverUrl: string
  username?: string
  apiToken?: string
  jobName?: string
  webhookUrl?: string
  config?: any
  isActive: boolean
  lastTestAt?: Date
  testStatus?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface JenkinsConfigWithProject extends JenkinsConfig {
  project: {
    id: string
    name: string
  }
}

export interface Pipeline {
  id: string
  projectId: string
  name: string
  description?: string
  jenkinsJobName: string
  parameters?: any
  triggers?: any
  stages?: any
  isActive: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Build {
  id: string
  jenkinsConfigId: string
  pipelineId?: string
  buildNumber: number
  jenkinsJobName: string
  status: 'pending' | 'queued' | 'running' | 'success' | 'failed' | 'aborted' | 'unstable'
  result?: string
  startedAt?: Date
  completedAt?: Date
  duration?: number
  queueId?: string
  buildUrl?: string
  parameters?: any
  artifacts?: any
  logs?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Deployment {
  id: string
  projectId: string
  jenkinsConfigId?: string
  name: string
  description?: string
  environment: string
  version?: string
  status: 'pending' | 'approved' | 'rejected' | 'scheduled' | 'deploying' | 'success' | 'failed' | 'rolled_back'
  buildNumber?: number
  deployScript?: string
  rollbackScript?: string
  scheduledAt?: Date
  startedAt?: Date
  completedAt?: Date
  duration?: number
  logs?: string
  config?: any
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface DeploymentApproval {
  id: string
  deploymentId: string
  approverId: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  comments?: string
  approvedAt?: Date
  level: number
  isRequired: boolean
  createdAt: Date
  updatedAt: Date
}

// API 请求类型
export interface CreateCICDProjectRequest {
  name: string
  description?: string
  repositoryUrl: string
  repositoryType?: string
  branch?: string
  buildScript?: string
  deployScript?: string
  environment?: 'dev' | 'test' | 'prod'
}

export interface UpdateCICDProjectRequest {
  name?: string
  description?: string
  repositoryUrl?: string
  repositoryType?: string
  branch?: string
  buildScript?: string
  deployScript?: string
  environment?: 'dev' | 'test' | 'prod'
  isActive?: boolean
}

export interface CreateJenkinsConfigRequest {
  projectId: string
  name: string
  description?: string
  serverUrl: string
  username?: string
  apiToken?: string
  jobName?: string
  webhookUrl?: string
  config?: any
}

export interface UpdateJenkinsConfigRequest {
  name?: string
  description?: string
  serverUrl?: string
  username?: string
  apiToken?: string
  jobName?: string
  webhookUrl?: string
  isActive?: boolean
  config?: any
}

export interface JenkinsTestRequest {
  serverUrl: string
  username?: string
  apiToken?: string
}

export interface JenkinsTestResponse {
  success: boolean
  data: {
    connected: boolean
    version?: string
    user?: string
    jobCount?: number
    jobs?: Array<{
      name: string
      displayName?: string
      url: string
      buildable: boolean
      color: string
      lastBuild?: any
    }>
    error?: string
  }
  message?: string
  error?: string
}

// API 响应类型
export interface CICDProjectListResponse {
  success: boolean
  data: {
    projects: CICDProjectWithDetails[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export interface CICDProjectResponse {
  success: boolean
  data: CICDProjectWithDetails
  message?: string
}

export interface JenkinsConfigListResponse {
  success: boolean
  data: {
    configs: JenkinsConfigWithProject[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export interface JenkinsConfigResponse {
  success: boolean
  data: JenkinsConfigWithProject
  message?: string
}

// 统计类型
export interface CICDStats {
  totalProjects: number
  activeProjects: number
  totalDeployments: number
  successfulDeployments: number
  failedDeployments: number
  pendingApprovals: number
  jenkinsConfigs: number
}

// Jenkins 作业相关类型
export interface JenkinsJob {
  name: string
  displayName?: string
  description?: string
  url: string
  buildable: boolean
  color: string
  lastBuild?: {
    number: number
    url: string
    timestamp: number
    result: string
    duration: number
  }
  nextBuildNumber: number
  inQueue: boolean
}

export interface JenkinsBuildRequest {
  jobName: string
  parameters?: Record<string, any>
}

export interface JenkinsBuildResponse {
  success: boolean
  data: {
    queueId: number
    queueUrl: string
    buildNumber?: number
    buildUrl?: string
  }
  message?: string
}
