import { useState, useEffect, useRef, useCallback } from 'react'

export interface ProjectLogEntry {
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  action: string
  message: string
  details?: any
}

export interface UseProjectLogsOptions {
  projectId?: string
  enabled?: boolean
  realtime?: boolean
  maxLines?: number
  onNewLog?: (log: ProjectLogEntry) => void
  onError?: (error: string) => void
}

export interface UseProjectLogsReturn {
  logs: ProjectLogEntry[]
  loading: boolean
  error: string | null
  connected: boolean
  addLog: (log: Omit<ProjectLogEntry, 'timestamp'>) => void
  clearLogs: () => void
  reconnect: () => void
}

export function useProjectLogs({
  projectId,
  enabled = true,
  realtime = false,
  maxLines = 1000,
  onNewLog,
  onError
}: UseProjectLogsOptions): UseProjectLogsReturn {
  const [logs, setLogs] = useState<ProjectLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const eventSourceRef = useRef<EventSource | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 添加日志到列表
  const addLogToList = useCallback((newLog: ProjectLogEntry) => {
    setLogs(prevLogs => {
      const updatedLogs = [...prevLogs, newLog]
      // 限制日志数量
      if (updatedLogs.length > maxLines) {
        return updatedLogs.slice(-maxLines)
      }
      return updatedLogs
    })
    onNewLog?.(newLog)
  }, [maxLines, onNewLog])

  // 手动添加日志
  const addLog = useCallback((log: Omit<ProjectLogEntry, 'timestamp'>) => {
    const logEntry: ProjectLogEntry = {
      ...log,
      timestamp: new Date().toISOString()
    }
    addLogToList(logEntry)
  }, [addLogToList])

  // 清空日志
  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  // 获取历史日志
  const fetchLogs = useCallback(async () => {
    if (!projectId || !enabled) return

    try {
      setLoading(true)
      setError(null)

      abortControllerRef.current = new AbortController()

      const response = await fetch(`/api/cicd/projects/${projectId}/logs?lines=${maxLines}`, {
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setLogs(data.data.logs || [])
      } else {
        throw new Error(data.error || '获取日志失败')
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = err.message || '获取日志失败'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [projectId, enabled, maxLines, onError])

  // 建立实时连接
  const connectRealtime = useCallback(() => {
    if (!projectId || !enabled || !realtime) return

    try {
      // 关闭现有连接
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const url = `/api/cicd/projects/${projectId}/logs?format=stream&follow=true`
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('📡 项目日志实时连接已建立')
        setConnected(true)
        setError(null)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'log') {
            const logEntry: ProjectLogEntry = {
              timestamp: data.timestamp,
              level: data.level,
              action: data.action,
              message: data.message,
              details: data.details
            }
            addLogToList(logEntry)
          } else if (data.type === 'status') {
            console.log('📊 项目状态更新:', data)
          }
        } catch (err) {
          console.error('解析日志数据失败:', err)
        }
      }

      eventSource.onerror = (event) => {
        console.error('📡 项目日志连接错误:', event)
        setConnected(false)
        
        // 自动重连
        setTimeout(() => {
          if (enabled && realtime) {
            connectRealtime()
          }
        }, 5000)
      }

    } catch (err) {
      console.error('建立实时连接失败:', err)
      setError('建立实时连接失败')
    }
  }, [projectId, enabled, realtime, addLogToList])

  // 重新连接
  const reconnect = useCallback(() => {
    if (realtime) {
      connectRealtime()
    } else {
      fetchLogs()
    }
  }, [realtime, connectRealtime, fetchLogs])

  // 初始化和清理
  useEffect(() => {
    if (!projectId || !enabled) return

    if (realtime) {
      // 先获取历史日志，然后建立实时连接
      fetchLogs().then(() => {
        connectRealtime()
      })
    } else {
      fetchLogs()
    }

    return () => {
      // 清理资源
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      setConnected(false)
    }
  }, [projectId, enabled, realtime, fetchLogs, connectRealtime])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    logs,
    loading,
    error,
    connected,
    addLog,
    clearLogs,
    reconnect
  }
}
