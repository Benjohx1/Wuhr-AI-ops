'use client'

import React, { useState, useRef, useEffect } from 'react'
import styles from './SystemChat.module.css'
import {
  Card,
  Input,
  Button,
  Select,
  Switch,
  Slider,
  Typography,
  Space,
  Avatar,
  Badge,
  Tooltip,
  message,
  Row,
  Col,
  Collapse,
  Tag,
  Dropdown,
  Modal,
  List,
  Empty
} from 'antd'
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  SettingOutlined,
  ClearOutlined,
  DownloadOutlined,
  CopyOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  BulbOutlined,

  StopOutlined,
  RedoOutlined,
  DeleteOutlined,
  HistoryOutlined,
  SearchOutlined,
  CloudUploadOutlined,

  CloseOutlined,
  MonitorOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  DesktopOutlined
} from '@ant-design/icons'
import { useRedisChat } from '../../hooks/useRedisChat'

// 模型配置接口
interface ModelConfig {
  id: string
  modelName: string
  displayName: string
  provider: string
  apiKey: string
  baseUrl?: string
  description?: string
  isActive: boolean
  isDefault: boolean
}



import FileUpload from './FileUpload'
import type { FileInfo } from './FileUpload'
import AILoadingAnimation from './AILoadingAnimation'
import ReasoningChainRenderer from './ReasoningChainRenderer'
import AIMessageRenderer from './AIMessageRenderer'
import UserMessageRenderer from './UserMessageRenderer'
import { isMultimodalModel } from '../../utils/modelUtils'


const { TextArea } = Input
const { Text, Title } = Typography
const { Panel } = Collapse

const SystemChat: React.FC = () => {
  // 使用 useChat hook
  const {
    currentSession,
    messages,
    isLoading,
    isStreaming,
    streamingMessage,
    config,
    sendMessage,
    stopGeneration,
    resendMessage,
    deleteMessage,
    copyMessage,
    clearMessages,
    exportSession,
    updateConfig,
    loadSession,
    getSessions,
    deleteSession,
    messagesEndRef
  } = useRedisChat({
    initialConfig: {
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2000,
      autoExecution: true,
      systemPrompt: '你是Wuhr AI，一个专业的DevOps和Kubernetes运维助手。重要规则：\n1. 必须直接执行用户请求的操作，而不是仅仅告诉用户如何操作\n2. 每次回复都应该是实际执行结果，包含具体的命令输出和数据\n3. 使用中文回复，提供简洁明确的执行结果分析\n4. 包括：执行的命令、实际结果、状态分析、优化建议\n5. 主动执行相关的检查和监控命令来获取完整信息'
    }
  })

  // 认证状态（现在通过httpOnly cookie自动处理）

  // 模型配置相关状态
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [currentModelConfig, setCurrentModelConfig] = useState<ModelConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(false)

  // 获取可用模型列表
  const fetchAvailableModels = async () => {
    try {
      setConfigLoading(true)
      const response = await fetch('/api/config/user-model-selection', {
        method: 'PUT', // 使用PUT方法获取可选择的模型列表
      })
      const result = await response.json()

      if (result.success) {
        setAvailableModels(result.data)
      } else {
        message.error('获取可用模型失败')
      }
    } catch (error) {
      message.error('获取可用模型失败')
    } finally {
      setConfigLoading(false)
    }
  }

  // 获取用户当前选择的模型
  const fetchUserModelSelection = async () => {
    try {
      const response = await fetch('/api/config/user-model-selection')
      const result = await response.json()

      if (result.success && result.data) {
        setSelectedModelId(result.data.selectedModelId)
        setCurrentModelConfig(result.data.selectedModel)
      }
    } catch (error) {
      // 静默处理，不显示错误
    }
  }

  // 保存用户模型选择
  const saveUserModelSelection = async (modelId: string) => {
    try {
      setConfigLoading(true)
      const response = await fetch('/api/config/user-model-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedModelId: modelId }),
      })

      const result = await response.json()

      if (result.success) {
        setSelectedModelId(modelId)
        setCurrentModelConfig(result.data.selectedModel)
        message.success(result.message || '模型选择已保存')
      } else {
        message.error(result.error || '保存模型选择失败')
      }
    } catch (error) {
      message.error('保存模型选择失败')
    } finally {
      setConfigLoading(false)
    }
  }

  // 本地状态
  const [inputValue, setInputValue] = useState('')
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historySearchQuery, setHistorySearchQuery] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([])
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [isK8sMode, setIsK8sMode] = useState(false)

  // 主机配置状态
  const [hostConfig, setHostConfig] = useState({
    executionMode: 'local', // 'local' | 'remote'
    selectedServerId: '',
    connectionStatus: 'disconnected' // 'disconnected' | 'connecting' | 'connected' | 'error'
  })

  // 服务器列表状态
  const [servers, setServers] = useState<any[]>([])
  const [loadingServers, setLoadingServers] = useState(false)

  const textAreaRef = useRef<any>(null)

  // 获取服务器列表
  const fetchServers = async () => {
    setLoadingServers(true)
    try {
      const response = await fetch('/api/admin/servers', {
        credentials: 'include', // 包含httpOnly cookie
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // 转换服务器数据格式 - 注意API返回的是 { servers, pagination } 结构
          const serverList = data.data.servers || data.data || []
          const formattedServers = serverList.map((server: any) => ({
            id: server.id,
            name: server.name,
            ip: server.ip || server.hostname, // 使用ip字段，如果没有则使用hostname
            status: server.status || 'offline', // 直接使用数据库中的状态
            port: server.port || 22,
            username: server.username,
            datacenter: server.location // 使用location字段作为datacenter
          }))
          setServers(formattedServers)
        } else {
          console.error('获取服务器列表失败:', data.error)
          message.error('获取服务器列表失败')
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('获取服务器列表失败:', error)
      message.error('获取服务器列表失败')
    } finally {
      setLoadingServers(false)
    }
  }

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查焦点是否在输入框或其他可编辑元素上
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.contentEditable === 'true') {
        return // 在输入框中不触发快捷键
      }

      // Ctrl + K: 切换K8s模式
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        setIsK8sMode(prev => !prev)
        message.info(`已切换到${!isK8sMode ? 'K8s集群' : 'Linux系统'}模式`)
      }
      // Ctrl + L: 强制切换到Linux模式
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault()
        setIsK8sMode(false)
        message.info('已切换到Linux系统模式')
      }
    }

    // 添加全局键盘事件监听
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isK8sMode])

  // 组件清理函数
  useEffect(() => {
    return () => {
      // 组件卸载时清理状态

      setInputValue('')
      setUploadedFiles([])
      setShowFileUpload(false)
      setShowHistory(false)
      setHistorySearchQuery('')

      // 清理任何可能的定时器或订阅
      if (typeof window !== 'undefined') {
        // 清理可能的事件监听器
        window.removeEventListener('beforeunload', () => {})
      }
    }
  }, [])

  // 测试服务器连接
  const testServerConnection = async (serverId: string) => {
    setHostConfig(prev => ({ ...prev, connectionStatus: 'connecting' }))
    try {
      const server = servers.find(s => s.id === serverId)
      if (!server) {
        throw new Error('服务器不存在')
      }

      // 使用新的基于ID的连接测试API
      const response = await fetch(`/api/admin/servers/${serverId}/test-connection`, {
        method: 'POST',
        credentials: 'include', // 包含httpOnly cookie
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setHostConfig(prev => ({ ...prev, connectionStatus: 'connected' }))
        message.success(`服务器连接成功！现在可以在远程主机 "${server.name}" 上执行命令`)
      } else {
        throw new Error(data.error || '连接失败')
      }
    } catch (error) {
      setHostConfig(prev => ({ ...prev, connectionStatus: 'error' }))
      const errorMessage = `服务器连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      message.error(errorMessage)
      throw error // 重新抛出异常，让调用者知道连接失败
    }
  }

  // 检查kubelet-wuhrai状态
  const checkKubeletWuhrai = async (serverId: string) => {
    if (!serverId) return

    try {
      const response = await fetch(`/api/servers/${serverId}/check-kubelet-wuhrai`, {
        credentials: 'include', // 包含认证cookie
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        const { kubeletStatus, kubeletVersion, recommendations } = result.data

        let statusText = ''

        if (kubeletStatus === 'installed') {
          statusText = `✅ kubelet-wuhrai已安装 ${kubeletVersion ? `(v${kubeletVersion})` : ''}`
        } else {
          statusText = '❌ kubelet-wuhrai未安装'
        }

        // 显示详细信息
        Modal.info({
          title: '远程主机kubelet-wuhrai状态',
          content: (
            <div className="space-y-3">
              <div>
                <strong>状态：</strong> {statusText}
              </div>

              {recommendations.map((rec: any, index: number) => (
                <div key={index} className={`p-2 rounded ${
                  rec.type === 'success' ? 'bg-green-50 text-green-700' :
                  rec.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                  rec.type === 'error' ? 'bg-red-50 text-red-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {rec.message}
                </div>
              ))}

              {kubeletStatus === 'not_installed' && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <strong>安装说明：</strong>
                  <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                    请参考kubelet-wuhrai官方文档进行安装
                  </div>
                </div>
              )}
            </div>
          ),
          width: 600
        })
      } else {
        message.error(`检查失败: ${result.error}`)
      }
    } catch (error) {
      // 显示更详细的错误信息
      if (error instanceof Error) {
        message.error(`检查kubelet-wuhrai状态失败: ${error.message}`)
      } else {
        message.error('检查kubelet-wuhrai状态失败')
      }

      // 显示错误详情对话框
      Modal.error({
        title: 'kubelet-wuhrai状态检查失败',
        content: (
          <div>
            <p>无法检查远程主机上的kubelet-wuhrai状态。可能的原因：</p>
            <ul>
              <li>SSH连接失败</li>
              <li>远程主机无法访问</li>
              <li>认证问题</li>
              <li>网络连接问题</li>
            </ul>
            <div className="mt-4 p-3 bg-red-50 rounded text-red-800">
              <p><strong>错误详情：</strong></p>
              <code>{error instanceof Error ? error.message : String(error)}</code>
            </div>
          </div>
        ),
        width: 500
      })
    }
  }

  // 组件挂载时获取服务器列表和模型配置
  useEffect(() => {
    fetchServers()
    fetchAvailableModels()
    fetchUserModelSelection()
  }, [])

  // 监听主机配置变化，更新聊天配置
  useEffect(() => {
    let hostId = 'local'

    // 只有在远程模式且已选择服务器时就使用远程主机ID
    const shouldUseRemote = hostConfig.executionMode === 'remote' &&
                           hostConfig.selectedServerId

    if (shouldUseRemote) {
      hostId = hostConfig.selectedServerId
    }

    // 更新聊天配置
    updateConfig({ hostId })
  }, [hostConfig.executionMode, hostConfig.selectedServerId, hostConfig.connectionStatus, updateConfig])



  // 检查是否有可用的模型配置
  const isConfigValid = () => {
    return !!currentModelConfig
  }

  // 导出菜单
  const exportMenuItems = [
    {
      key: 'json',
      label: '导出为 JSON',
      icon: <FileTextOutlined />,
      onClick: () => exportSession()
    },
    {
      key: 'markdown',
      label: '导出为 Markdown',
      icon: <FileTextOutlined />,
      onClick: () => exportSession()
    }
  ]

  // 历史会话状态
  const [historySessions, setHistorySessions] = useState<any[]>([])
  
  // 加载历史会话（仅在客户端）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadHistorySessions = async () => {
        try {
          const allSessions = await getSessions()
          setHistorySessions(Array.isArray(allSessions) ? allSessions : [])
        } catch (error) {
          console.error('加载历史会话失败:', error)
          setHistorySessions([])
        }
      }
      loadHistorySessions()
    }
  }, [getSessions, historyRefreshKey])
  
  // 历史会话列表
  const getHistorySessions = () => {
    // 确保返回有效的数组
    const sessions = !historySearchQuery ? historySessions : []

    if (!Array.isArray(sessions)) {
      console.warn('历史会话数据不是数组:', sessions)
      return []
    }

    // 如果有搜索查询，进行客户端搜索
    if (historySearchQuery && typeof window !== 'undefined') {
      return sessions.filter((session: any) => {
        if (!session || !session.title) return false
        return session.title.toLowerCase().includes(historySearchQuery.toLowerCase())
      })
    }

    return sessions
  }

  // 快捷命令 - Kubernetes + Linux系统运维常用命令
  const quickCommands = [
    // Kubernetes相关命令
    {
      label: '集群状态检查',
      command: '检查Kubernetes集群状态，包括节点和组件健康状况',
      icon: <ApiOutlined />,
      description: '全面检查K8s集群节点和核心组件状态',
    },
    {
      label: 'Pod状态监控',
      command: '查看所有命名空间的Pod运行状态和资源使用情况',
      icon: <ThunderboltOutlined />,
      description: '监控集群中所有Pod的运行状态',
    },
    {
      label: '服务网络诊断',
      command: '诊断Kubernetes服务网络连接和DNS解析问题',
      icon: <GlobalOutlined />,
      description: '排查K8s服务间网络连接问题',
    },
    {
      label: '资源配额分析',
      command: '分析集群资源配额使用情况和容量规划建议',
      icon: <FileTextOutlined />,
      description: '查看集群资源使用率和优化建议',
    },
    // Linux系统运维命令
    {
      label: '系统性能监控',
      command: '监控系统CPU、内存、磁盘IO和网络性能指标',
      icon: <MonitorOutlined />,
      description: '实时监控系统关键性能指标',
    },
    {
      label: '进程资源分析',
      command: '分析系统进程资源占用，找出高CPU和内存消耗进程',
      icon: <DesktopOutlined />,
      description: '识别和管理资源消耗较高的进程',
    },
    {
      label: '存储空间管理',
      command: '检查磁盘空间使用情况，清理大文件和日志',
      icon: <DatabaseOutlined />,
      description: '管理磁盘空间，清理不必要文件',
    },
    {
      label: '网络连接诊断',
      command: '诊断网络连接问题，检查端口监听和防火墙状态',
      icon: <BulbOutlined />,
      description: '排查网络连接和端口访问问题',
    },
  ]



  // 发送消息处理
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    // 检查是否已选择模型
    if (!currentModelConfig) {
      message.error('请先选择一个AI模型')
      return
    }

    // 检查当前模型是否支持多模态
    const isMultimodal = isMultimodalModel(config.model)

    let finalMessage = inputValue
    let imageFiles: FileInfo[] = []
    let textFiles: FileInfo[] = []

    // 分类上传的文件
    if (uploadedFiles.length > 0) {
      imageFiles = uploadedFiles.filter(f => f.status === 'success' && f.type.startsWith('image/'))
      textFiles = uploadedFiles.filter(f => f.status === 'success' && !f.type.startsWith('image/') && f.content)

      // 处理文本文件
      if (textFiles.length > 0) {
        const fileContents = textFiles
          .map(f => `[文件: ${f.name}]\n${f.content}`)
          .join('\n\n')
        finalMessage = `${inputValue}\n\n${fileContents}`
      }

      // 处理图像文件
      if (imageFiles.length > 0) {
        if (isMultimodal) {
          // 多模态模型：将图像信息添加到消息中
          const imageInfo = imageFiles
            .map(f => `[图像: ${f.name}]`)
            .join(', ')
          finalMessage = `${finalMessage}\n\n包含图像: ${imageInfo}`
        } else {
          // 非多模态模型：提示用户选择支持图像的模型
          message.warning('当前模型不支持图像理解，请选择支持多模态的模型（如 GPT-4V、Gemini Pro Vision 等）')
          return
        }
      }
    }

    // 构建请求配置，使用数据库中的模型配置

    // 验证远程执行的前提条件
    if (hostConfig.executionMode === 'remote') {
      if (!hostConfig.selectedServerId) {
        message.error('请选择远程主机')
        return
      }

      // 如果连接状态不是已连接，自动进行连接测试
      if (hostConfig.connectionStatus !== 'connected') {
        try {
          await testServerConnection(hostConfig.selectedServerId)
          // 连接成功后继续执行
        } catch (error) {
          message.error('远程主机连接失败，无法执行命令')
          return
        }
      }
    }

    // 直接根据当前hostConfig状态确定hostId，避免状态更新延迟问题
    const currentHostId = (hostConfig.executionMode === 'remote' && hostConfig.selectedServerId)
      ? hostConfig.selectedServerId
      : 'local'

    const requestConfig = {
      model: currentModelConfig.modelName,
      apiKey: currentModelConfig.apiKey,
      baseUrl: currentModelConfig.baseUrl,
      provider: currentModelConfig.provider,
      autoExecution: config.autoExecution,
      hostId: currentHostId, // 直接使用计算出的hostId
      isK8sMode: isK8sMode // 添加K8s模式标识
    }

    await sendMessage(finalMessage, requestConfig)
    setInputValue('')
    setUploadedFiles([]) // 清空已上传文件
  }



  const handleQuickCommand = (command: string) => {
    setInputValue(command)
    textAreaRef.current?.focus()
  }

  // 文件上传处理
  const handleFileAnalyzed = (files: FileInfo[]) => {
    setUploadedFiles(files)
  }

  const handleFileContentChange = (content: string) => {
    setInputValue(content)
    textAreaRef.current?.focus()
  }

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (messagesEndRef?.current) {
      (messagesEndRef.current as HTMLElement).scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 监听消息变化，自动滚动
  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  // 渲染消息
  const renderMessage = (msg: any, index: number) => {
    const isUser = msg.type === 'user'
    const isError = msg.status === 'error'

    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${styles.messageAppear}`}
      >
        <div
          className={`flex items-start space-x-3 max-w-[85%] ${
            isUser ? 'flex-row-reverse space-x-reverse' : ''
          }`}
        >
          {/* 头像 - 固定尺寸防止变形 */}
          <div className={`flex-shrink-0 ${styles.avatarFixed}`}>
            <Avatar
              size={40}
              icon={isUser ? <UserOutlined /> : <RobotOutlined />}
              className={
                isUser
                  ? 'bg-blue-500'
                  : isError
                  ? 'bg-red-500'
                  : 'bg-gradient-to-br from-green-500 to-blue-500'
              }
            />
          </div>

          <div className="min-w-0 flex-1 overflow-hidden">
            {isUser ? (
              <UserMessageRenderer
                content={msg.content}
                timestamp={msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp}
                className="user-message"
              />
            ) : msg.content === '__LOADING_ANIMATION__' ? (
              <div className="rounded-lg p-3 bg-gray-700/80 text-gray-100 border border-gray-600/30">
                <AILoadingAnimation className="py-2" />
              </div>
            ) : (
              <AIMessageRenderer
                content={msg.content}
                isError={isError}
                metadata={msg.metadata}
                className="ai-response"
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        <Row gutter={24} className="flex-1 min-h-0 h-full">
          {/* 左侧对话区域 */}
          <Col xs={24} lg={18} className="h-full flex flex-col">
          <Card
            title={
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                    <RobotOutlined className="text-white" />
                  </div>
                  <div>
                    <Title level={4} className="!text-white !mb-0">
                      Wuhr AI
                    </Title>
                    <Text className="text-gray-400 text-sm">
                      {currentModelConfig?.displayName || '未选择模型'} · K8s + DevOps
                    </Text>
                  </div>
                </div>
                
                <Space>
                  <Badge
                    status={isLoading ? 'processing' : isConfigValid() ? 'success' : 'error'}
                    text={
                      <Text className="text-gray-300">
                        {isLoading ? '处理中...' : isConfigValid() ? '就绪' : '未配置'}
                      </Text>
                    }
                  />
                  
                  <Button
                    icon={<HistoryOutlined />}
                    onClick={() => setShowHistory(true)}
                  >
                    历史
                  </Button>
                  
                  <Dropdown
                    menu={{ items: exportMenuItems }}
                    disabled={!currentSession || messages.length === 0}
                  >
                    <Button icon={<DownloadOutlined />}>
                      导出
                    </Button>
                  </Dropdown>
                  
                  <Button
                    icon={<ClearOutlined />}
                    onClick={clearMessages}
                    disabled={messages.length === 0}
                  >
                    清除
                  </Button>
                </Space>
              </div>
            }
            className="glass-card flex-1 flex flex-col"
            styles={{ body: { padding: 0, height: 'calc(100vh - 170px)', display: 'flex', flexDirection: 'column' } }}
          >
            {/* 消息列表 */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 min-h-0 ${styles.messageContainer}`}>
              {messages.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <RobotOutlined className="text-2xl text-white" />
                  </div>
                  <Title level={4} className="!text-gray-300 !mb-2">
                    欢迎使用 Wuhr AI
                  </Title>
                  <Text className="text-gray-400">
                    智能AI助手，专精于Kubernetes和DevOps运维
                  </Text>
                  
                  {/* 快捷命令 */}
                  <div className="mt-8">
                    <Text className="text-gray-300 block mb-4">运维常用命令：</Text>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
                      {quickCommands.map((cmd, index) => (
                        <Tooltip key={index} title={cmd.description}>
                          <Button
                            block
                            onClick={() => handleQuickCommand(cmd.command)}
                            className="text-left h-auto py-3"
                          >
                            <div className="flex items-center space-x-2">
                              {cmd.icon}
                              <span className="text-sm">{cmd.label}</span>
                            </div>
                          </Button>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map(renderMessage)}
                  
                  {/* 流式响应显示 */}
                  {isStreaming && streamingMessage && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-3 max-w-[80%]">
                        <Avatar
                          icon={<RobotOutlined />}
                          className="bg-gradient-to-br from-green-500 to-blue-500"
                        />
                        <div className="rounded-lg p-4 bg-gray-700 text-gray-100">
                          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                            {streamingMessage}
                            <span className="animate-pulse">|</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 移除重复的加载指示器，因为useRedisChat已经创建了"正在思考中..."的消息 */}

              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="border-t border-gray-700/30 pt-3 px-4 pb-4">
              {/* 文件上传区域 */}
              {showFileUpload && (
                <div className="mb-4">
                  <FileUpload
                    onFileAnalyzed={handleFileAnalyzed}
                    onFileContentChange={handleFileContentChange}
                    maxFiles={5}
                    maxFileSize={10}
                  />
                </div>
              )}

              {/* 已上传文件显示 */}
              {uploadedFiles.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Text className="text-gray-400 text-sm">已选择文件:</Text>
                    <Button
                      size="small"
                      type="text"
                      onClick={() => setUploadedFiles([])}
                    >
                      清空
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 bg-gray-700 rounded px-3 py-1"
                      >
                        <FileTextOutlined className="text-blue-400" />
                        <Text className="text-gray-300 text-sm">{file.name}</Text>
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() => {
                            setUploadedFiles(files => files.filter((_, i) => i !== index))
                          }}
                          className="text-gray-400 hover:text-red-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <TextArea
                  ref={textAreaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="输入您的问题或命令... (支持 /help, @file, !command)"
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  className="flex-1"
                  disabled={isLoading}
                />

                <div className="flex flex-col space-y-2">
                  <Tooltip title="K8s集群命令模式 (Ctrl+K切换)">
                    <Button
                      icon={<GlobalOutlined />}
                      onClick={() => setIsK8sMode(!isK8sMode)}
                      type={isK8sMode ? 'primary' : 'default'}
                      style={{
                        backgroundColor: isK8sMode ? '#1890ff' : undefined,
                        borderColor: isK8sMode ? '#1890ff' : undefined,
                        color: isK8sMode ? '#fff' : undefined
                      }}
                    >
                      K8s
                    </Button>
                  </Tooltip>

                  <div className="flex space-x-2">
                    <Tooltip title="文件上传功能暂时不可用">
                      <Button
                        icon={<CloudUploadOutlined />}
                        onClick={() => setShowFileUpload(!showFileUpload)}
                        type={showFileUpload ? 'primary' : 'default'}
                        disabled={true}
                        style={{ opacity: 0.5 }}
                      />
                    </Tooltip>

                    {isLoading ? (
                      <Button
                        danger
                        icon={<StopOutlined />}
                        onClick={stopGeneration}
                        loading={false}
                      >
                        停止
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || !currentModelConfig}
                        loading={isLoading}
                        className="btn-primary"
                      >
                        发送
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className={`flex items-center space-x-2 ${styles.tagContainer}`}>
                  {/* 限制最多显示3个标签 */}
                  <Tag color="blue" className="text-xs">
                    {currentModelConfig?.displayName || '未选择模型'}
                  </Tag>
                  <Tag color={isK8sMode ? 'cyan' : 'purple'} className="text-xs">
                    {isK8sMode ? 'K8s集群' : 'Linux系统'}
                  </Tag>
                  <Tag color={config.autoExecution ? 'green' : 'orange'} className="text-xs">
                    {config.autoExecution ? '自动执行' : '手动确认'}
                  </Tag>
                  {!isConfigValid() && (
                    <Tag color="red" className="text-xs">配置未完成</Tag>
                  )}
                </div>

                <Text className="text-gray-400 text-sm">
                  Enter发送 | Shift+Enter换行 | Ctrl+K切换模式 | Ctrl+L切换到Linux
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 右侧配置面板 */}
        <Col xs={24} lg={6} className="h-full">
          <Card
            title={
              <div className="flex items-center space-x-2">
                <SettingOutlined className="text-blue-500" />
                <span className="text-white">配置面板</span>
              </div>
            }
            className="glass-card h-full"
            styles={{
              body: {
                padding: '16px 0',
                height: 'calc(100vh - 200px)', // 设置固定高度，减去标题和边距
                overflowY: 'auto', // 添加垂直滚动
                overflowX: 'hidden' // 隐藏水平滚动
              }
            }}
          >
            <Collapse
              defaultActiveKey={[]}
              ghost
              expandIconPosition="end"
            >
              {/* 主机配置面板 */}
              <Panel
                header={
                  <div className="flex items-center space-x-2">
                    <ApiOutlined className="text-blue-400" />
                    <span className="text-gray-300">主机配置</span>
                  </div>
                }
                key="host-config"
              >
                <div className="px-4 space-y-4">
                  {/* 执行模式选择 */}
                  <div>
                    <Text className="text-gray-300 block mb-2">执行模式</Text>
                    <Select
                      value={hostConfig.executionMode}
                      onChange={(value) => setHostConfig(prev => ({ ...prev, executionMode: value }))}
                      className="w-full"
                      options={[
                        { label: '本地执行', value: 'local' },
                        { label: '远程主机', value: 'remote' }
                      ]}
                    />
                  </div>

                  {/* 远程主机配置 */}
                  {hostConfig.executionMode === 'remote' && (
                    <div className="space-y-3 p-3 bg-gray-800/50 rounded-lg">
                      <Text className="text-gray-300 block">选择远程主机</Text>

                      <div>
                        <Text className="text-gray-400 text-sm block mb-2">可用服务器</Text>
                        <Select
                          value={hostConfig.selectedServerId}
                          onChange={(value) => setHostConfig(prev => ({
                            ...prev,
                            selectedServerId: value,
                            connectionStatus: 'disconnected'
                          }))}
                          className="w-full"
                          placeholder="选择服务器"
                          loading={loadingServers}
                          options={servers.map(server => ({
                            label: (
                              <div className="flex items-center justify-between">
                                <span>{server.name}</span>
                                <div className="flex items-center space-x-2">
                                  <Text className="text-xs text-gray-400">{server.ip}</Text>
                                  <Badge
                                    status={server.status === 'online' ? 'success' : 'error'}
                                    text={server.status === 'online' ? '在线' : '离线'}
                                  />
                                </div>
                              </div>
                            ),
                            value: server.id,
                            disabled: server.status !== 'online'
                          }))}
                        />
                      </div>

                      {hostConfig.selectedServerId && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Text className="text-gray-300 text-sm">连接状态</Text>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge
                                  status={
                                    hostConfig.connectionStatus === 'connected' ? 'success' :
                                    hostConfig.connectionStatus === 'connecting' ? 'processing' :
                                    hostConfig.connectionStatus === 'error' ? 'error' : 'default'
                                  }
                                  text={
                                    hostConfig.connectionStatus === 'connected' ? '已连接' :
                                    hostConfig.connectionStatus === 'connecting' ? '连接中...' :
                                    hostConfig.connectionStatus === 'error' ? '连接失败' : '未连接'
                                  }
                                />
                              </div>
                            </div>
                            <Button
                              type="primary"
                              size="small"
                              loading={hostConfig.connectionStatus === 'connecting'}
                              onClick={() => testServerConnection(hostConfig.selectedServerId)}
                              disabled={!hostConfig.selectedServerId}
                            >
                              {hostConfig.connectionStatus === 'connected' ? '重新连接' : '测试连接'}
                            </Button>
                          </div>

                          {/* kubelet-wuhrai状态检查 */}
                          {hostConfig.connectionStatus === 'connected' && (
                            <div className="p-3 bg-gray-700/50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Text className="text-gray-300 text-sm">kubelet-wuhrai状态</Text>
                                <Button
                                  type="link"
                                  size="small"
                                  onClick={() => checkKubeletWuhrai(hostConfig.selectedServerId)}
                                  className="text-blue-400 hover:text-blue-300 p-0"
                                >
                                  检查状态
                                </Button>
                              </div>
                              <div className="text-xs text-gray-400">
                                远程主机需要安装kubelet-wuhrai才能使用AI聊天功能
                              </div>
                            </div>
                          )}

                          {hostConfig.connectionStatus === 'connected' && (
                            <div className="p-2 bg-green-900/20 border border-green-500/30 rounded">
                              <Text className="text-green-400 text-xs">
                                ✓ 已成功连接到远程主机，后续命令将在该主机上执行
                              </Text>
                            </div>
                          )}

                          {hostConfig.connectionStatus === 'error' && (
                            <div className="p-2 bg-red-900/20 border border-red-500/30 rounded">
                              <Text className="text-red-400 text-xs">
                                ✗ 连接失败，请检查服务器状态或网络连接
                              </Text>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Panel>

              <Panel
                header={
                  <div className="flex items-center space-x-2">
                    <RobotOutlined className="text-green-500" />
                    <span className="text-gray-300">模型配置</span>
                  </div>
                }
                key="model-config"
              >
                <div className="px-4 space-y-4">
                  <div>
                    <Text className="text-gray-300 block mb-2">选择模型</Text>
                    <Select
                      value={selectedModelId}
                      onChange={(value) => saveUserModelSelection(value)}
                      loading={configLoading}
                      className="w-full"
                      placeholder="选择AI模型"
                      showSearch
                      popupMatchSelectWidth={300}
                      filterOption={(input, option) => {
                        const label = typeof option?.label === 'string' ? option.label : ''
                        return label.toLowerCase().includes(input.toLowerCase())
                      }}
                      options={availableModels.map(model => ({
                        value: model.id,
                        label: (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-white truncate flex-1">
                              {model.modelName}
                            </span>
                            {model.isDefault && <Tag color="gold" className="ml-2">默认</Tag>}
                          </div>
                        )
                      }))}
                      notFoundContent={
                        <div className="text-center py-4">
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                              <span className="text-gray-400">
                                暂无可用模型<br/>
                                请先在<a href="/config/models" className="text-blue-400">模型管理</a>中添加模型配置
                              </span>
                            }
                          />
                        </div>
                      }
                    />
                  </div>

                  {/* 当前配置状态 */}
                  {currentModelConfig && (
                    <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <Text className="text-gray-300 text-sm">当前配置</Text>
                        <Badge
                          status="success"
                          text={<span className="text-green-400 text-xs">已配置</span>}
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">模型:</span>
                          <span className="text-white">{currentModelConfig.displayName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">提供商:</span>
                          <span className="text-white">{currentModelConfig.provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">API密钥:</span>
                          <span className="text-green-400">已配置</span>
                        </div>
                        {currentModelConfig.baseUrl && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Base URL:</span>
                            <span className="text-white text-xs truncate max-w-32" title={currentModelConfig.baseUrl}>
                              {currentModelConfig.baseUrl}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 配置提示 */}
                  {!currentModelConfig && (
                    <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                      <Text className="text-yellow-400 text-xs">
                        请先选择一个模型，或在<a href="/config/models" className="text-blue-400 underline">模型管理</a>中添加新的模型配置
                      </Text>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Text className="text-gray-300">自动执行工具</Text>
                    <Switch
                      checked={config.autoExecution}
                      onChange={(checked) => updateConfig({ autoExecution: checked })}
                      checkedChildren="开"
                      unCheckedChildren="关"
                    />
                  </div>
                </div>
              </Panel>

              <Panel
                header={
                  <div className="flex items-center space-x-2">
                    <ThunderboltOutlined className="text-orange-500" />
                    <span className="text-gray-300">高级参数</span>
                  </div>
                }
                key="advanced"
              >
                <div className="px-4 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <Text className="text-gray-300 font-medium">Temperature</Text>
                        <div className="text-xs text-gray-500 mt-1">
                          控制回复的创造性和随机性
                        </div>
                      </div>
                      <div className="text-right">
                        <Text className="text-blue-400 font-mono text-sm">
                          {config.temperature.toFixed(1)}
                        </Text>
                        <div className="text-xs text-gray-500">
                          {config.temperature <= 0.3 ? '保守' :
                           config.temperature <= 0.7 ? '平衡' : '创新'}
                        </div>
                      </div>
                    </div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={config.temperature}
                      onChange={(value) => updateConfig({ temperature: value })}
                      marks={{
                        0: { label: '0.0', style: { color: '#6b7280', fontSize: '10px' } },
                        0.3: { label: '0.3', style: { color: '#6b7280', fontSize: '10px' } },
                        0.7: { label: '0.7', style: { color: '#3b82f6', fontSize: '10px' } },
                        1: { label: '1.0', style: { color: '#6b7280', fontSize: '10px' } }
                      }}
                      tooltip={{
                        formatter: (value) => `${value?.toFixed(1)} - ${
                          (value || 0) <= 0.3 ? '保守模式' :
                          (value || 0) <= 0.7 ? '平衡模式' : '创新模式'
                        }`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>更确定</span>
                      <span>更随机</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Text className="text-gray-300">Max Tokens</Text>
                      <Text className="text-gray-400">{config.maxTokens}</Text>
                    </div>
                    <Slider
                      min={100}
                      max={4000}
                      step={100}
                      value={config.maxTokens}
                      onChange={(value) => updateConfig({ maxTokens: value })}
                    />
                  </div>
                </div>
              </Panel>
            </Collapse>



            {/* 状态信息 */}
            <div className="px-4 space-y-3">
              <div className="flex justify-between">
                <Text className="text-gray-400">消息数量</Text>
                <Text className="text-white">{messages.length}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-gray-400">Token 使用</Text>
                <Text className="text-white">
                  {messages.reduce((total, msg) => {
                    return total + (msg.metadata?.tokenUsage?.totalTokens || 0)
                  }, 0)} tokens
                </Text>
              </div>

              {hostConfig.executionMode === 'remote' && hostConfig.selectedServerId && (
                <div className="flex justify-between">
                  <Text className="text-gray-400">连接状态</Text>
                  <Badge
                    status={
                      hostConfig.connectionStatus === 'connected' ? 'success' :
                      hostConfig.connectionStatus === 'connecting' ? 'processing' :
                      hostConfig.connectionStatus === 'error' ? 'error' : 'default'
                    }
                    text={
                      <Text className={
                        hostConfig.connectionStatus === 'connected' ? 'text-green-500' :
                        hostConfig.connectionStatus === 'connecting' ? 'text-blue-500' :
                        hostConfig.connectionStatus === 'error' ? 'text-red-500' : 'text-gray-500'
                      }>
                        {hostConfig.connectionStatus === 'connected' ? '已连接' :
                         hostConfig.connectionStatus === 'connecting' ? '连接中' :
                         hostConfig.connectionStatus === 'error' ? '连接失败' : '未连接'}
                      </Text>
                    }
                  />
                </div>
              )}

              <div className="flex justify-between">
                <Text className="text-gray-400">模型状态</Text>
                <Badge
                  status={isConfigValid() ? "success" : "error"}
                  text={
                    <Text className={isConfigValid() ? "text-green-500" : "text-red-500"}>
                      {isConfigValid() ? '配置完成' : '未配置'}
                    </Text>
                  }
                />
              </div>
            </div>
          </Card>
        </Col>
        </Row>
      </div>

      <Modal
        title="对话历史"
        open={showHistory}
        onCancel={() => setShowHistory(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <Input
            placeholder="搜索会话..."
            prefix={<SearchOutlined />}
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
          />
          
          <List
            key={historyRefreshKey}
            dataSource={getHistorySessions()}
            renderItem={(session) => {
              // 数据验证：确保session存在且有必要的属性
              if (!session || !session.id) {
                return null
              }

              return (
                <List.Item
                  actions={[
                    <Button
                      key="load"
                      type="text"
                      onClick={() => {
                        loadSession(session.id)
                        setShowHistory(false)
                      }}
                    >
                      加载
                    </Button>,
                    <Button
                      key="delete"
                      type="text"
                      danger
                      onClick={async () => {
                        try {
                          // 执行删除操作
                          const success = await deleteSession(session.id)

                          if (success) {
                            // 强制刷新历史对话列表
                            setHistoryRefreshKey(prev => prev + 1)
                            setHistorySearchQuery('')
                            message.success('会话已删除')
                          } else {
                            message.error('删除失败，请重试')
                          }
                        } catch (error) {
                          console.error('💥 删除操作异常:', error)
                          message.error('删除失败，请重试')
                        }
                      }}
                    >
                      删除
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={session.title || '未命名会话'}
                    description={
                      <div className="text-gray-400">
                        <div>
                          {/* 显示消息数量 */}
                          {typeof session.messageCount === 'number'
                            ? `${session.messageCount} 条消息`
                            : (session.messages && Array.isArray(session.messages)
                                ? `${session.messages.length} 条消息`
                                : '0 条消息'
                              )
                          }
                        </div>
                        <div>
                          {/* 安全访问updatedAt属性 */}
                          {session.updatedAt
                            ? (session.updatedAt instanceof Date
                                ? session.updatedAt.toLocaleString()
                                : new Date(session.updatedAt).toLocaleString()
                              )
                            : (session.createdAt
                                ? (session.createdAt instanceof Date
                                    ? session.createdAt.toLocaleString()
                                    : new Date(session.createdAt).toLocaleString()
                                  )
                                : '时间未知'
                              )
                          }
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )
            }}
            locale={{
              emptyText: (
                <Empty
                  description="暂无历史会话"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )
            }}
          />
        </div>
      </Modal>
    </>
  )
}

export default SystemChat 