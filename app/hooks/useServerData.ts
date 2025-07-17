import { useState, useEffect, useCallback } from 'react'
import { 
  ServerInfo, 
  ServerMetrics, 
  ServerAlert, 
  ServerLog, 
  ServerGroup,
  ServerOperation,
  ServerStats,
  MonitoringData,
  ChartData
} from '../types/server'

// 模拟服务器数据
const mockServers: ServerInfo[] = [
  {
    id: 'srv-001',
    name: 'Web Server 01',
    hostname: 'web01.example.com',
    ip: '192.168.1.10',
    port: 22,
    status: 'online',
    os: 'Ubuntu 22.04 LTS',
    version: '22.04.3',
    location: '北京机房',
    tags: ['web', 'nginx', 'production'],
    description: '主要Web服务器，运行Nginx和应用服务',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: 'srv-002',
    name: 'Database Server',
    hostname: 'db01.example.com',
    ip: '192.168.1.20',
    port: 22,
    status: 'online',
    os: 'CentOS 8',
    version: '8.5',
    location: '上海机房',
    tags: ['database', 'mysql', 'production'],
    description: 'MySQL主数据库服务器',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date()
  },
  {
    id: 'srv-003',
    name: 'Cache Server',
    hostname: 'cache01.example.com',
    ip: '192.168.1.30',
    port: 22,
    status: 'warning',
    os: 'Ubuntu 20.04 LTS',
    version: '20.04.6',
    location: '广州机房',
    tags: ['cache', 'redis', 'production'],
    description: 'Redis缓存服务器，内存使用率较高',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date()
  },
  {
    id: 'srv-004',
    name: 'API Gateway',
    hostname: 'api01.example.com',
    ip: '192.168.1.40',
    port: 22,
    status: 'online',
    os: 'Ubuntu 22.04 LTS',
    version: '22.04.3',
    location: '深圳机房',
    tags: ['api', 'gateway', 'production'],
    description: 'API网关服务器',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date()
  },
  {
    id: 'srv-005',
    name: 'Test Server',
    hostname: 'test01.example.com',
    ip: '192.168.1.50',
    port: 22,
    status: 'offline',
    os: 'Ubuntu 22.04 LTS',
    version: '22.04.3',
    location: '北京机房',
    tags: ['test', 'staging'],
    description: '测试环境服务器，当前离线维护中',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date()
  }
]

// 模拟告警数据
const mockAlerts: ServerAlert[] = [
  {
    id: 'alert-001',
    serverId: 'srv-003',
    serverName: 'Cache Server',
    type: 'memory',
    level: 'warning',
    title: '内存使用率过高',
    message: '内存使用率达到85%，建议检查Redis缓存配置',
    threshold: 80,
    currentValue: 85,
    isResolved: false,
    createdAt: new Date(Date.now() - 3600000) // 1小时前
  },
  {
    id: 'alert-002',
    serverId: 'srv-005',
    serverName: 'Test Server',
    type: 'service',
    level: 'error',
    title: '服务器离线',
    message: '服务器无法连接，请检查网络连接和服务器状态',
    isResolved: false,
    createdAt: new Date(Date.now() - 7200000) // 2小时前
  },
  {
    id: 'alert-003',
    serverId: 'srv-001',
    serverName: 'Web Server 01',
    type: 'cpu',
    level: 'info',
    title: 'CPU使用率恢复正常',
    message: 'CPU使用率已从95%降至45%',
    threshold: 90,
    currentValue: 45,
    isResolved: true,
    createdAt: new Date(Date.now() - 10800000), // 3小时前
    resolvedAt: new Date(Date.now() - 1800000) // 30分钟前
  }
]

// 模拟日志数据
const mockLogs: ServerLog[] = [
  {
    id: 'log-001',
    serverId: 'srv-001',
    serverName: 'Web Server 01',
    level: 'info',
    source: 'nginx',
    message: 'GET /api/users HTTP/1.1 200 0.123s',
    timestamp: new Date(Date.now() - 60000),
    metadata: { responseTime: 0.123, statusCode: 200 }
  },
  {
    id: 'log-002',
    serverId: 'srv-002',
    serverName: 'Database Server',
    level: 'warn',
    source: 'mysql',
    message: 'Slow query detected: SELECT * FROM users WHERE created_at > NOW() - INTERVAL 1 DAY',
    timestamp: new Date(Date.now() - 120000),
    metadata: { queryTime: 2.5, table: 'users' }
  },
  {
    id: 'log-003',
    serverId: 'srv-003',
    serverName: 'Cache Server',
    level: 'error',
    source: 'redis',
    message: 'Memory usage warning: Used 85% of available memory',
    timestamp: new Date(Date.now() - 180000),
    metadata: { memoryUsage: 85 }
  }
]

// 生成模拟监控数据
const generateMockMetrics = (): MonitoringData => {
  const now = Date.now()
  const dataPoints = 24 // 24小时数据
  
  const generateDataPoints = (baseValue: number, variance: number): ChartData[] => {
    return Array.from({ length: dataPoints }, (_, i) => ({
      time: new Date(now - (dataPoints - i) * 3600000).toISOString(),
      value: Math.max(0, Math.min(100, baseValue + (Math.random() - 0.5) * variance))
    }))
  }

  return {
    cpu: generateDataPoints(45, 30),
    memory: generateDataPoints(65, 20),
    disk: generateDataPoints(35, 10),
    network: generateDataPoints(25, 40)
  }
}

export function useServerData() {
  const [servers, setServers] = useState<ServerInfo[]>(mockServers)
  const [alerts, setAlerts] = useState<ServerAlert[]>(mockAlerts)
  const [logs, setLogs] = useState<ServerLog[]>(mockLogs)
  const [loading, setLoading] = useState(false)
  const [monitoringData, setMonitoringData] = useState<MonitoringData>(generateMockMetrics())

  // 获取服务器统计信息
  const getServerStats = useCallback((): ServerStats => {
    const stats = servers.reduce((acc, server) => {
      acc.total++
      acc[server.status]++
      return acc
    }, {
      total: 0,
      online: 0,
      offline: 0,
      warning: 0,
      error: 0,
      groups: 0,
      alerts: {
        total: alerts.length,
        unresolved: alerts.filter(alert => !alert.isResolved).length,
        critical: alerts.filter(alert => alert.level === 'critical').length
      }
    })

    return stats
  }, [servers, alerts])

  // 获取服务器列表
  const getServers = useCallback((filters?: {
    status?: string[]
    tags?: string[]
    location?: string
    search?: string
  }) => {
    let filteredServers = servers

    if (filters) {
      if (filters.status?.length) {
        filteredServers = filteredServers.filter(server => 
          filters.status!.includes(server.status)
        )
      }
      
      if (filters.tags?.length) {
        filteredServers = filteredServers.filter(server => 
          filters.tags!.some(tag => server.tags.includes(tag))
        )
      }
      
      if (filters.location) {
        filteredServers = filteredServers.filter(server => 
          server.location.includes(filters.location!)
        )
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredServers = filteredServers.filter(server => 
          server.name.toLowerCase().includes(searchLower) ||
          server.hostname.toLowerCase().includes(searchLower) ||
          server.ip.includes(searchLower) ||
          server.description?.toLowerCase().includes(searchLower)
        )
      }
    }

    return filteredServers
  }, [servers])

  // 获取服务器详情
  const getServerById = useCallback((id: string) => {
    return servers.find(server => server.id === id)
  }, [servers])

  // 获取告警列表
  const getAlerts = useCallback((filters?: {
    serverId?: string
    level?: string[]
    resolved?: boolean
  }) => {
    let filteredAlerts = alerts

    if (filters) {
      if (filters.serverId) {
        filteredAlerts = filteredAlerts.filter(alert => 
          alert.serverId === filters.serverId
        )
      }
      
      if (filters.level?.length) {
        filteredAlerts = filteredAlerts.filter(alert => 
          filters.level!.includes(alert.level)
        )
      }
      
      if (filters.resolved !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => 
          alert.isResolved === filters.resolved
        )
      }
    }

    return filteredAlerts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [alerts])

  // 获取日志列表
  const getLogs = useCallback((filters?: {
    serverId?: string
    level?: string[]
    source?: string
    search?: string
    startTime?: Date
    endTime?: Date
  }) => {
    let filteredLogs = logs

    if (filters) {
      if (filters.serverId) {
        filteredLogs = filteredLogs.filter(log => 
          log.serverId === filters.serverId
        )
      }
      
      if (filters.level?.length) {
        filteredLogs = filteredLogs.filter(log => 
          filters.level!.includes(log.level)
        )
      }
      
      if (filters.source) {
        filteredLogs = filteredLogs.filter(log => 
          log.source.includes(filters.source!)
        )
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(searchLower)
        )
      }
      
      if (filters.startTime) {
        filteredLogs = filteredLogs.filter(log => 
          log.timestamp >= filters.startTime!
        )
      }
      
      if (filters.endTime) {
        filteredLogs = filteredLogs.filter(log => 
          log.timestamp <= filters.endTime!
        )
      }
    }

    return filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [logs])

  // 更新服务器状态
  const updateServerStatus = useCallback(async (serverId: string, status: ServerInfo['status']) => {
    setLoading(true)
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setServers(prev => prev.map(server => 
        server.id === serverId 
          ? { ...server, status, updatedAt: new Date() }
          : server
      ))
    } finally {
      setLoading(false)
    }
  }, [])

  // 解决告警
  const resolveAlert = useCallback(async (alertId: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, isResolved: true, resolvedAt: new Date() }
          : alert
      ))
    } finally {
      setLoading(false)
    }
  }, [])

  // 刷新监控数据
  const refreshMonitoringData = useCallback(() => {
    setMonitoringData(generateMockMetrics())
  }, [])

  // 定时刷新数据
  useEffect(() => {
    const interval = setInterval(() => {
      // 模拟新日志
      const newLog: ServerLog = {
        id: `log-${Date.now()}`,
        serverId: mockServers[Math.floor(Math.random() * mockServers.length)].id,
        serverName: mockServers[Math.floor(Math.random() * mockServers.length)].name,
        level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)] as ServerLog['level'],
        source: ['system', 'nginx', 'mysql', 'redis'][Math.floor(Math.random() * 4)],
        message: `Auto-generated log message at ${new Date().toISOString()}`,
        timestamp: new Date()
      }
      
      setLogs(prev => [newLog, ...prev.slice(0, 99)]) // 保持最新100条日志
      
      // 刷新监控数据
      refreshMonitoringData()
    }, 30000) // 30秒刷新一次

    return () => clearInterval(interval)
  }, [refreshMonitoringData])

  return {
    // 数据
    servers,
    alerts,
    logs,
    monitoringData,
    loading,
    
    // 方法
    getServerStats,
    getServers,
    getServerById,
    getAlerts,
    getLogs,
    updateServerStatus,
    resolveAlert,
    refreshMonitoringData
  }
} 