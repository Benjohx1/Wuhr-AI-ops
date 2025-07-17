import { useState, useCallback, useEffect } from 'react'
import { message } from 'antd'
import { copyWithFeedback } from '../utils/clipboard'
import { ChatMessage, ChatSession, RedisChatConfig } from '../types/chat'

export interface UseRedisChatOptions {
  sessionId?: string
  initialConfig?: Partial<RedisChatConfig>
}

export function useRedisChat(options: UseRedisChatOptions = {}) {
  const { sessionId: initialSessionId, initialConfig } = options
  
  // 聊天状态
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<RedisChatConfig>({
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2000,
    autoExecution: true,
    hostId: 'local', // 默认本地执行
    systemPrompt: '你是一个专业的DevOps助手，请用中文回复。你可以帮助用户执行系统命令、分析日志、监控系统性能等。请提供简洁明确的回复，包括：使用的命令、执行结果、优化建议。',
    ...initialConfig
  })

  // Redis API 调用函数
  const apiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '请求失败' }))
      throw new Error(errorData.error || '请求失败')
    }

    return response.json()
  }, [])

  // 创建新会话
  const createNewSession = useCallback(async (title?: string) => {
    try {
      const { session } = await apiCall('/api/chat/redis-sessions', {
        method: 'POST',
        body: JSON.stringify({ title })
      })
      
      setCurrentSession(session)
      setMessages([])
      return session
    } catch (error) {
      console.error('创建会话失败:', error)
      message.error('创建会话失败')
      return null
    }
  }, [apiCall])

  // 加载会话
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const { session, messages: sessionMessages } = await apiCall(`/api/chat/redis-sessions/${sessionId}`)
      
      setCurrentSession(session)
      setMessages(sessionMessages || [])
      return session
    } catch (error) {
      console.error('加载会话失败:', error)
      message.error('加载会话失败')
      return null
    }
  }, [apiCall])

  // 获取会话列表
  const getSessions = useCallback(async () => {
    try {
      const { sessions } = await apiCall('/api/chat/redis-sessions')
      return sessions || []
    } catch (error) {
      console.error('获取会话列表失败:', error)
      message.error('获取会话列表失败')
      return []
    }
  }, [apiCall])

  // 删除会话
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await apiCall(`/api/chat/redis-sessions/${sessionId}`, {
        method: 'DELETE'
      })
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
        setMessages([])
      }
      
      message.success('会话已删除')
      return true
    } catch (error) {
      console.error('删除会话失败:', error)
      message.error('删除会话失败')
      return false
    }
  }, [apiCall, currentSession])

  // 清除历史记录
  const clearHistory = useCallback(async () => {
    try {
      await apiCall('/api/chat/redis-sessions', {
        method: 'DELETE'
      })
      
      setCurrentSession(null)
      setMessages([])
      message.success('历史记录已清除')
      return true
    } catch (error) {
      console.error('清除历史记录失败:', error)
      message.error('清除历史记录失败')
      return false
    }
  }, [apiCall])

  // 添加消息到Redis
  const addMessageToRedis = useCallback(async (sessionId: string, message: ChatMessage) => {
    try {
      await apiCall(`/api/chat/redis-sessions/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ message })
      })
    } catch (error) {
      console.error('保存消息到Redis失败:', error)
      // 不显示错误消息，因为这是后台操作
    }
  }, [apiCall])

  // 发送消息
  const sendMessage = useCallback(async (content: string, modelConfig?: { model: string; apiKey: string; baseUrl?: string; provider?: string; hostId?: string }) => {
    if (!content.trim() || isLoading) return

    setIsLoading(true)

    try {
      // 确保有当前会话
      let session = currentSession
      if (!session) {
        // 使用用户消息的前20个字符作为会话标题
        const sessionTitle = content.length > 20 ? content.substring(0, 20) + '...' : content
        session = await createNewSession(sessionTitle)
        if (!session) {
          throw new Error('无法创建会话')
        }
      }

      // 创建用户消息
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'user',
        content: content.trim(),
        timestamp: new Date()
      }

      // 添加用户消息到本地状态
      setMessages(prev => [...prev, userMessage])

      // 保存用户消息到Redis
      await addMessageToRedis(session.id, userMessage)

      // 创建AI消息
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'ai',
        content: '__LOADING_ANIMATION__', // 特殊标记，用于显示加载动画
        timestamp: new Date()
      }

      // 添加AI消息到本地状态
      setMessages(prev => [...prev, aiMessage])

      // 调用AI API获取回复
      try {
        // 统一使用system/chat接口，支持本地和远程执行
        const apiEndpoint = '/api/system/chat'



        const requestBody = {
          message: config.systemPrompt ? `${config.systemPrompt}\n\n${content}` : content,
          model: modelConfig?.model || config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          autoExecution: config.autoExecution,
          hostId: modelConfig?.hostId || config.hostId || 'local', // 优先使用传入的hostId
          // 添加模型配置参数
          ...(modelConfig && {
            apiKey: modelConfig.apiKey,
            baseUrl: modelConfig.baseUrl,
            provider: modelConfig.provider || 'openai-compatible' // 添加provider字段
          })
        }

        console.log('📤 发送请求体详细信息:', {
          message: `${requestBody.message.substring(0, 100)}...`,
          model: requestBody.model,
          provider: requestBody.provider,
          hostId: requestBody.hostId,
          hasApiKey: !!requestBody.apiKey,
          apiKeyPrefix: requestBody.apiKey ? requestBody.apiKey.substring(0, 8) + '...' : 'none',
          hasBaseUrl: !!requestBody.baseUrl,
          baseUrl: requestBody.baseUrl,
          autoExecution: requestBody.autoExecution,
          isRemoteExecution: requestBody.hostId !== 'local',
          configHostId: config.hostId,
          timestamp: new Date().toISOString()
        })

        console.log('🔍 关键字段检查:', {
          'requestBody.hostId': requestBody.hostId,
          'modelConfig?.hostId': modelConfig?.hostId,
          'config.hostId': config.hostId,
          'hostId来源': modelConfig?.hostId ? 'modelConfig' : (config.hostId ? 'config' : 'default'),
          'hostId类型': typeof requestBody.hostId,
          'hostId === "local"': requestBody.hostId === 'local',
          'hostId !== "local"': requestBody.hostId !== 'local',
          '!!hostId': !!requestBody.hostId,
          '判断结果': !!(requestBody.hostId && requestBody.hostId !== 'local'),
          'API密钥有效': !!(requestBody.apiKey && requestBody.apiKey.length > 20)
        })

        // 添加关键执行模式确认日志
        if (requestBody.hostId && requestBody.hostId !== 'local') {
          console.log('🌐 确认发送远程执行请求:', {
            targetHost: requestBody.hostId,
            endpoint: apiEndpoint,
            expectation: '命令将在远程主机执行'
          })
        } else {
          console.log('🏠 确认发送本地执行请求:', {
            hostId: requestBody.hostId || 'local',
            endpoint: apiEndpoint,
            expectation: '命令将在本地执行'
          })
        }

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          throw new Error(`API请求失败: ${response.status}`)
        }

        const result = await response.json()

        // 添加响应结果日志
        console.log('📥 收到API响应:', {
          success: result.success,
          executionMode: result.executionMode,
          hostId: result.hostId,
          hostName: result.hostName,
          responseLength: result.response?.length || 0,
          hasError: !!result.error,
          timestamp: new Date().toISOString()
        })

        // 验证执行模式
        if (result.executionMode) {
          if (result.executionMode === 'remote') {
            console.log('✅ 确认远程执行成功:', {
              hostName: result.hostName,
              hostId: result.hostId,
              message: '命令已在远程主机执行'
            })
          } else {
            console.log('✅ 确认本地执行成功:', {
              executionMode: result.executionMode,
              message: '命令已在本地执行'
            })
          }
        }

        if (!result.success) {
          throw new Error(result.error || 'API调用失败')
        }

        // 更新AI消息内容
        const updatedAiMessage = {
          ...aiMessage,
          content: result.response || result.output || '抱歉，我无法处理您的请求。',
          metadata: {
            tokenUsage: result.usage || result.tokenUsage,
            model: result.model || config.model,
            executionTime: result.executionTime,
            executionMode: result.executionMode,
            hostId: result.hostId,
            hostName: result.hostName
          }
        }

        setMessages(prev => prev.map(msg =>
          msg.id === aiMessage.id ? updatedAiMessage : msg
        ))

        // 保存AI消息到Redis
        await addMessageToRedis(session.id, updatedAiMessage)

      } catch (error) {
        console.error('AI API调用失败:', error)

        // 检查是否是gemini命令未找到的错误
        let errorContent = `抱歉，处理您的请求时出现错误：${error instanceof Error ? error.message : '未知错误'}`

        if (error instanceof Error && error.message.includes('未安装 Gemini CLI')) {
          errorContent = `${error.message}\n\n💡 解决方案：\n1. 登录到远程主机\n2. 执行安装命令：npm install -g @gemini-ai/cli\n3. 重新尝试聊天`
        }

        // 更新为错误消息
        const errorMessage: ChatMessage = {
          ...aiMessage,
          content: errorContent,
          status: 'error' as const
        }

        setMessages(prev => prev.map(msg =>
          msg.id === aiMessage.id ? errorMessage : msg
        ))

        // 保存错误消息到Redis
        await addMessageToRedis(session.id, errorMessage)
      }

      setIsLoading(false)

    } catch (error) {
      console.error('发送消息失败:', error)
      message.error('发送消息失败')
      setIsLoading(false)
    }
  }, [isLoading, currentSession, createNewSession, addMessageToRedis])

  // 停止生成
  const stopGeneration = useCallback(() => {
    setIsLoading(false)
  }, [])

  // 重发消息
  const resendMessage = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1) return

    const message = messages[messageIndex]
    if (message.type === 'user') {
      await sendMessage(message.content)
    }
  }, [messages, sendMessage])

  // 删除消息
  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }, [])

  // 复制消息
  const copyMessage = useCallback(async (content: string) => {
    await copyWithFeedback(
      content,
      (msg) => message.success(msg),
      (msg) => message.error(msg)
    )
  }, [])

  // 清除消息
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // 导出会话
  const exportSession = useCallback(() => {
    if (!currentSession || messages.length === 0) return

    const exportData = {
      session: currentSession,
      messages: messages,
      exportTime: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-session-${currentSession.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [currentSession, messages])

  // 更新配置
  const updateConfig = useCallback((newConfig: Partial<RedisChatConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // 搜索会话
  const searchSessions = useCallback(async (query: string) => {
    const sessions = await getSessions()
    return sessions.filter((session: any) =>
      session.title.toLowerCase().includes(query.toLowerCase())
    )
  }, [getSessions])

  // 初始化
  useEffect(() => {
    if (initialSessionId) {
      loadSession(initialSessionId)
    }
  }, [initialSessionId, loadSession])

  return {
    // 状态
    currentSession,
    messages,
    isLoading,
    isStreaming: false, // Redis版本暂不支持流式
    streamingMessage: null,
    config,

    // 配置
    setConfig,
    updateConfig,

    // 会话管理
    createNewSession,
    loadSession,
    deleteSession,
    clearHistory,
    getSessions,
    searchSessions,

    // 消息操作
    sendMessage,
    stopGeneration,
    resendMessage,
    deleteMessage,
    copyMessage,
    clearMessages,
    exportSession,

    // 兼容性
    messagesEndRef: { current: null }
  }
}
