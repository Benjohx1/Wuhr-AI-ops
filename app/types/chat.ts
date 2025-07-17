// 统一的聊天相关类型定义
// 整合了之前分散在多个文件中的重复定义

export interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  status?: 'sending' | 'success' | 'error'
  metadata?: {
    model?: string
    temperature?: number
    maxTokens?: number
    provider?: string
    tokenUsage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
    executionTime?: number
    executionMode?: 'local' | 'remote'
    hostId?: string
    hostName?: string
  }
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  messageCount?: number // 直接添加到主接口中
  metadata?: {
    model?: string
    provider?: string
    messageCount?: number
  }
}

// Redis聊天配置
export interface RedisChatConfig {
  model: string
  temperature: number
  maxTokens: number
  autoExecution: boolean
  systemPrompt?: string
  hostId?: string // 远程主机ID
}

// 聊天设置
export interface ChatSettings {
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  autoExecution?: boolean
  streamResponse?: boolean
}

// 文件信息接口
export interface FileInfo {
  name: string
  size: number
  type: string
  content?: string
  base64?: string
}

// 导出类型
export type MessageType = 'user' | 'ai'
export type MessageStatus = 'sending' | 'success' | 'error'
export type ExecutionMode = 'local' | 'remote'
