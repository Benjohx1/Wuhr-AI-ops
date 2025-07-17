import { NextRequest, NextResponse } from 'next/server'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import {
  KubeletWuhraiRequest,
  KubeletWuhraiResponse,
  ProviderType,
  TokenUsage,
  ToolCall
} from '../../../types/api'
import { requireAuth } from '../../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../../lib/config/database'
import {
  buildEnvironmentVariables,
  generateKubeletArgs,
  getProviderFromModel,
  validateModelConfig
} from '../../../config/kubelet-wuhrai-providers'

// 系统Shell检测工具函数
function getSystemShell(): { shell: string; shellFlag: string } {
  const platform = process.platform

  if (platform === 'win32') {
    // Windows系统
    return { shell: 'cmd', shellFlag: '/c' }
  } else {
    // Unix-like系统 (Linux, macOS)
    return { shell: 'bash', shellFlag: '-c' }
  }
}

// kubelet-wuhrai CLI 执行器类
class ServerKubeletWuhraiClient {
  private kubeletWuhraiPath: string

  constructor() {
    // kubelet-wuhrai二进制文件路径
    this.kubeletWuhraiPath = '/data/kubelet-wuhrai/bin/kubelet-wuhrai'
  }

  // 检查kubelet-wuhrai命令是否可用
  private async checkKubeletWuhraiCommand(): Promise<boolean> {
    return new Promise((resolve) => {
      const { spawn } = require('child_process')
      const { shell, shellFlag } = getSystemShell()

      // 尝试执行 kubelet-wuhrai version 来检查命令是否存在
      const child = spawn(shell, [shellFlag, `${this.kubeletWuhraiPath} version`], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      })

      let hasOutput = false

      child.stdout?.on('data', () => {
        hasOutput = true
      })

      child.stderr?.on('data', () => {
        hasOutput = true
      })

      child.on('close', (code: number | null) => {
        resolve(hasOutput || code === 0)
      })

      child.on('error', () => {
        resolve(false)
      })

      // 设置超时
      setTimeout(() => {
        child.kill()
        resolve(false)
      }, 5000)
    })
  }

  // 获取系统信息
  private getSystemInfo(): string {
    const os = require('os')
    const platform = process.platform
    const arch = process.arch
    const nodeVersion = process.version
    const osType = os.type()
    const osRelease = os.release()

    let systemType = 'Unknown'
    let shellType = 'Unknown'
    let commonCommands: string[] = []

    if (platform === 'win32') {
      systemType = 'Windows'
      shellType = 'cmd/powershell'
      commonCommands = ['dir', 'type', 'findstr', 'tasklist', 'systeminfo', 'wmic']
    } else if (platform === 'darwin') {
      systemType = 'macOS'
      shellType = 'bash/zsh'
      commonCommands = ['ls', 'cat', 'grep', 'ps', 'top', 'df', 'free', 'uname']
    } else if (platform === 'linux') {
      systemType = 'Linux'
      shellType = 'bash'
      commonCommands = ['ls', 'cat', 'grep', 'ps', 'top', 'df', 'free', 'uname', 'systemctl', 'kubectl']
    }

    return `SYSTEM_INFO:
Operating System: ${systemType} (${osType} ${osRelease})
Platform: ${platform}
Architecture: ${arch}
Node.js Version: ${nodeVersion}
Shell Type: ${shellType}
Common Commands: ${commonCommands.join(', ')}
Kubernetes Tools: kubectl, kubelet-wuhrai available

CONTEXT: You are running on a ${systemType} system with Kubernetes tools available. 
You can help with system administration, Kubernetes operations, and DevOps tasks.
Please provide responses in Chinese and include practical command examples when appropriate.`
  }

  // 执行kubelet-wuhrai命令
  async execute(request: KubeletWuhraiRequest): Promise<KubeletWuhraiResponse> {
    const startTime = Date.now()

    // 检查kubelet-wuhrai是否可用
    const isAvailable = await this.checkKubeletWuhraiCommand()
    if (!isAvailable) {
      return {
        success: false,
        error: 'kubelet-wuhrai 命令不可用，请确保已正确安装',
        timestamp: new Date().toISOString(),
      }
    }

    return new Promise((resolve, reject) => {
      // 获取系统信息并添加到消息中
      const systemInfo = this.getSystemInfo()
      const enhancedMessage = `${systemInfo}\n\n${request.message}`

      // 获取实际的配置参数
      const actualModel = request.model || 'deepseek-chat'
      const actualApiKey = request.apiKey || ''
      const actualBaseUrl = request.baseUrl
      const actualProvider = getProviderFromModel(actualModel)

      // 构建kubelet-wuhrai命令参数
      const args = generateKubeletArgs(
        actualModel,
        true // 始终使用quiet模式
      )

      // 验证模型配置
      const validation = validateModelConfig(
        actualModel,
        actualApiKey,
        actualBaseUrl
      )

      if (!validation.valid) {
        console.error('❌ 模型配置验证失败:', validation.errors)
        return {
          success: false,
          error: `模型配置错误: ${validation.errors.join(', ')}`,
          timestamp: new Date().toISOString(),
        }
      }

      // 构建kubelet-wuhrai环境变量
      const kubeletEnv = buildEnvironmentVariables(
        actualModel,
        actualApiKey,
        actualBaseUrl
      )

      // 合并环境变量
      const env = { ...process.env, ...kubeletEnv }



      // 如果有会话ID，添加到环境变量
      if (request.sessionId) {
        env.KUBELET_WUHRAI_SESSION_ID = request.sessionId
      }



      // 使用spawn执行命令
      const child = spawn(this.kubeletWuhraiPath, [...args, enhancedMessage], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: env, // 使用我们构建的环境变量
        cwd: '/data/kubelet-wuhrai'
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        const executionTime = Date.now() - startTime

        if (code === 0 && stdout.trim()) {
          console.log('✅ kubelet-wuhrai 执行成功:', {
            executionTime: `${executionTime}ms`,
            outputLength: stdout.length
          })

          resolve({
            success: true,
            response: stdout.trim(),
            executionTime,
            timestamp: new Date().toISOString(),
            status: 'completed',
            metadata: {
              model: request.model,
              provider: request.provider,
              execution_time: `${executionTime}ms`,
              tools_used: ['kubelet-wuhrai'],
              model_used: request.model || 'deepseek-chat'
            }
          })
        } else {
          console.error('❌ kubelet-wuhrai 执行失败:', {
            code,
            stderr: stderr.substring(0, 500),
            stdout: stdout.substring(0, 500)
          })

          resolve({
            success: false,
            error: stderr || stdout || `命令执行失败，退出码: ${code}`,
            executionTime,
            timestamp: new Date().toISOString(),
            status: 'error'
          })
        }
      })

      child.on('error', (error) => {
        const executionTime = Date.now() - startTime
        console.error('❌ kubelet-wuhrai 进程错误:', error)

        resolve({
          success: false,
          error: `进程执行错误: ${error.message}`,
          executionTime,
          timestamp: new Date().toISOString(),
          status: 'error'
        })
      })

      // 设置超时
      setTimeout(() => {
        child.kill()
        resolve({
          success: false,
          error: '命令执行超时',
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          status: 'error'
        })
      }, 120000) // 120秒超时
    })
  }
}

// 强制动态渲染
export const dynamic = 'force-dynamic'

// 请求计数器
let requestCounter = 0

export async function POST(request: NextRequest) {
  const currentRequestId = ++requestCounter

  try {
    console.log(`🔄 [请求 #${currentRequestId}] 开始处理 kubelet-wuhrai API 请求`)

    // 验证用户身份
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      console.log(`❌ [请求 #${currentRequestId}] 认证失败`)
      return authResult.response
    }

    const body = await request.json()

    // 验证基本请求参数
    if (!body.message || !body.model) {
      console.log(`❌ [请求 #${currentRequestId}] 参数验证失败`)
      return NextResponse.json(
        { error: '缺少必要参数: message, model' },
        { status: 400 }
      )
    }

    console.log(`📥 [请求 #${currentRequestId}] 收到 kubelet-wuhrai API 请求:`, {
      userId: authResult.user.id,
      model: body.model,
      messageLength: body.message.length,
      hostId: body.hostId
    })

    // 检查是否为远程执行
    const hostId = body.hostId
    const isRemoteExecution = hostId && hostId !== 'local'

    if (isRemoteExecution) {
      // 远程执行模式
      console.log(`🌐 [请求 #${currentRequestId}] 进入远程执行模式，主机ID:`, hostId)

      const prisma = await getPrismaClient()

      try {
        // 获取主机配置信息
        const server = await prisma.server.findUnique({
          where: { id: hostId }
        })

        if (!server) {
          throw new Error(`主机不存在: ${hostId}`)
        }

        console.log(`🔍 [请求 #${currentRequestId}] 找到主机配置:`, {
          name: server.name,
          ip: server.ip,
          port: server.port,
          username: server.username
        })

        // 获取用户的API配置用于远程执行
        const apiKeys = await prisma.apiKey.findMany({
          where: {
            userId: authResult.user.id,
            isActive: true,
          },
        })

        if (apiKeys.length === 0) {
          throw new Error('未找到可用的API配置')
        }

        const defaultApiKey = apiKeys.find(key => key.isDefault) || apiKeys[0]

        // 构建SSH配置
        const sshConfig = {
          host: server.ip,
          port: server.port,
          username: server.username,
          password: server.password || undefined,
          timeout: 60000
        }

        // 构建环境变量
        const { buildEnvironmentVariables, generateKubeletArgs } = await import('../../../config/kubelet-wuhrai-providers')
        const envVars = buildEnvironmentVariables(
          body.model,
          defaultApiKey.apiKey,
          defaultApiKey.provider === 'openai-compatible' ? (defaultApiKey.baseUrl || undefined) : undefined
        )
        const envString = Object.entries(envVars)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')

        // 构建kubelet-wuhrai命令
        const message = body.systemPrompt ? `${body.systemPrompt}\n\n${body.message}` : body.message
        const args = generateKubeletArgs(body.model, true)
        const kubeletCommand = `${envString} kubelet-wuhrai ${args.join(' ')} "${message}"`

        console.log(`🔧 [请求 #${currentRequestId}] 远程执行命令:`, kubeletCommand)

        // 使用SSH执行命令
        const { executeSSHCommand } = await import('../../../../lib/ssh/client')
        const result = await executeSSHCommand(sshConfig, kubeletCommand)

        if (!result.success) {
          throw new Error(result.stderr || '远程命令执行失败')
        }

        return NextResponse.json({
          success: true,
          response: result.stdout || '命令执行完成，但没有返回内容',
          model: body.model,
          executionMode: 'remote',
          hostId: hostId,
          hostName: server.name,
          timestamp: new Date().toISOString(),
        })

      } catch (error) {

        return NextResponse.json({
          success: false,
          error: `远程执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
          timestamp: new Date().toISOString(),
        }, { status: 500 })
      }
    }

    // 本地执行模式（原有逻辑）


    // 获取用户的API配置
    const prisma = await getPrismaClient()
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: authResult.user.id,
        isActive: true,
      },
    })

    if (apiKeys.length === 0) {
      return NextResponse.json(
        { error: '未找到可用的API配置，请先配置API密钥' },
        { status: 400 }
      )
    }

    // 选择默认的API配置
    const defaultApiKey = apiKeys.find(key => key.isDefault) || apiKeys[0]
    
    // 构建kubelet-wuhrai请求
    const kubeletWuhraiRequest: KubeletWuhraiRequest = {
      message: body.systemPrompt ? `${body.systemPrompt}\n\n${body.message}` : body.message,
      provider: defaultApiKey.provider as ProviderType,
      apiKey: defaultApiKey.apiKey,
      baseUrl: defaultApiKey.provider === 'openai-compatible' ? (defaultApiKey.baseUrl || undefined) : undefined,
      model: body.model,
      autoExecution: body.autoExecution,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      systemPrompt: body.systemPrompt,
      quiet: true, // 始终使用quiet模式
      sessionId: body.sessionId
    }

    console.log('📨 处理聊天请求:', {
      provider: defaultApiKey.provider,
      model: body.model,
      messageLength: body.message.length,
      autoExecution: body.autoExecution,
      hasSystemPrompt: !!body.systemPrompt,
      apiKeyName: defaultApiKey.name,
      hasApiKey: !!defaultApiKey.apiKey,
      apiKeyLength: defaultApiKey.apiKey ? defaultApiKey.apiKey.length : 0,
      apiKeyPrefix: defaultApiKey.apiKey ? defaultApiKey.apiKey.substring(0, 8) + '...' : 'none'
    })

    // 执行kubelet-wuhrai命令
    const executor = new ServerKubeletWuhraiClient()
    const result = await executor.execute(kubeletWuhraiRequest)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }

  } catch (error) {

    return NextResponse.json({
      success: false,
      error: 'kubelet-wuhrai API处理失败',
      details: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
