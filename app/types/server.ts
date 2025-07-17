// 服务器管理相关类型定义

export interface ServerInfo {
  id: string
  name: string
  hostname: string
  ip: string
  port: number
  status: 'online' | 'offline' | 'warning' | 'error'
  os: string
  version: string
  location: string
  tags: string[]
  description?: string
  username?: string
  password?: string
  keyPath?: string
  lastConnectedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ServerMetrics {
  serverId: string
  timestamp: Date
  cpu: {
    usage: number // 百分比
    cores: number
    loadAverage: [number, number, number] // 1分钟, 5分钟, 15分钟
  }
  memory: {
    total: number // GB
    used: number // GB
    free: number // GB
    usage: number // 百分比
  }
  disk: {
    total: number // GB
    used: number // GB
    free: number // GB
    usage: number // 百分比
  }
  network: {
    inbound: number // MB/s
    outbound: number // MB/s
  }
  uptime: number // 秒
}

export interface ServerAlert {
  id: string
  serverId: string
  serverName: string
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'service' | 'custom'
  level: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  threshold?: number
  currentValue?: number
  isResolved: boolean
  createdAt: Date
  resolvedAt?: Date
}

export interface ServerLog {
  id: string
  serverId: string
  serverName: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  source: string // 日志来源，如 'system', 'nginx', 'mysql' 等
  message: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface ServerGroup {
  id: string
  name: string
  description?: string
  serverIds: string[]
  color: string
  createdAt: Date
}

export interface ServerOperation {
  id: string
  serverId: string
  serverName: string
  type: 'restart' | 'stop' | 'start' | 'deploy' | 'backup' | 'update' | 'custom'
  command: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  output?: string
  error?: string
  userId: string
}

// 服务器统计信息
export interface ServerStats {
  total: number
  online: number
  offline: number
  warning: number
  error: number
  groups: number
  alerts: {
    total: number
    unresolved: number
    critical: number
  }
}

// 监控图表数据
export interface ChartData {
  time: string
  value: number
  category?: string
}

export interface MonitoringData {
  cpu: ChartData[]
  memory: ChartData[]
  disk: ChartData[]
  network: ChartData[]
}

// 服务器配置
export interface ServerConfig {
  ssh: {
    host: string
    port: number
    username: string
    keyPath?: string
    password?: string
  }
  monitoring: {
    enabled: boolean
    interval: number // 秒
    metrics: string[]
  }
  alerts: {
    enabled: boolean
    rules: AlertRule[]
  }
}

export interface AlertRule {
  id: string
  name: string
  metric: string
  operator: '>' | '<' | '>=' | '<=' | '==' | '!='
  threshold: number
  duration: number // 秒
  severity: 'info' | 'warning' | 'error' | 'critical'
  enabled: boolean
} 