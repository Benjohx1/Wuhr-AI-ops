import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { KubeletWuhraiRequest, ProviderType } from '../../../types/api'
import { requireAuth } from '../../../../lib/auth/apiHelpers-new'

import { getPrismaClient } from '../../../../lib/config/database'
import {
  getProviderFromModel,
  validateModelConfig,
  buildEnvironmentVariables,
  generateKubeletArgs
} from '../../../config/kubelet-wuhrai-providers'

// 注释：现在优先使用前端传递的模型配置，而不是数据库存储的API密钥



// 直接执行kubelet-wuhrai的函数
async function executeKubeletWuhrai(request: KubeletWuhraiRequest): Promise<{ success: boolean; response?: string; error?: string }> {
  return new Promise((resolve) => {
    const kubeletWuhraiPath = 'kubelet-wuhrai' // 使用全局命令
    const timeout = 120000 // 120秒超时

    // 构建环境变量 - 使用正确的环境变量名
    const env = {
      OPENAI_API_KEY: request.apiKey,
      OPENAI_API_BASE: request.baseUrl  // 使用正确的环境变量名
    }

    // 构建命令参数 - 完全匹配工作的手动命令
    const args = [
      '--llm-provider', 'openai',
      '--model', 'gpt-4o',
      '--quiet',
      '--skip-verify-ssl',
      '--skip-permissions',
      request.message // 用户消息作为位置参数
    ]

    const fullEnv = { ...process.env, ...env }

    // 构建完整的命令字符串用于调试
    const envString = Object.entries(env).map(([k, v]) => `${k}="${v}"`).join(' ')
    const fullCommand = `${envString} ${kubeletWuhraiPath} ${args.join(' ')}`

    console.log('🚀 执行 kubelet-wuhrai:', {
      path: kubeletWuhraiPath,
      args: args,
      hasApiKey: !!request.apiKey,
      hasBaseUrl: !!request.baseUrl,
      env: env,
      message: request.message.substring(0, 100) + '...',
      messageLength: request.message.length,
      fullCommand: fullCommand.substring(0, 200) + '...',
      cwd: process.cwd()
    })

    // 验证环境变量
    console.log('🔍 环境变量验证:', {
      OPENAI_API_KEY: fullEnv.OPENAI_API_KEY ? `${fullEnv.OPENAI_API_KEY.substring(0, 10)}...` : 'MISSING',
      OPENAI_API_BASE: fullEnv.OPENAI_API_BASE || 'MISSING'
    })

    // 执行kubelet-wuhrai命令 - 完全匹配工作的手动命令结构
    const child = spawn(kubeletWuhraiPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'], // ignore stdin, pipe stdout/stderr
      env: fullEnv,
      cwd: process.cwd(),
      shell: false,
      detached: false,
      windowsHide: true // 隐藏窗口（如果在Windows上）
    })

    if (!child.pid) {
      console.log('❌ 进程启动失败')
      resolve({
        success: false,
        error: '进程启动失败'
      })
      return
    }

    console.log('🔧 进程已启动，PID:', child.pid)

    // 添加进程事件监听
    child.on('spawn', () => {
      console.log('🚀 进程已成功spawn')
    })

    child.on('disconnect', () => {
      console.log('🔌 进程已断开连接')
    })

    child.on('exit', (code, signal) => {
      console.log('🚪 进程已退出:', { code, signal, timestamp: new Date().toISOString() })
    })

    let stdout = ''
    let stderr = ''
    let isResolved = false

    // 设置超时
    const timer = setTimeout(() => {
      if (!isResolved) {
        console.log(`⏰ kubelet-wuhrai 执行超时，强制终止进程 (${timeout/1000}秒)`)
        console.log(`📊 超时时状态: stdout=${stdout.length}字符, stderr=${stderr.length}字符`)
        child.kill('SIGTERM')
        isResolved = true
        resolve({
          success: false,
          error: `执行超时（${timeout/1000}秒）`
        })
      }
    }, timeout)

    child.stdout?.setEncoding('utf8')
    child.stdout?.on('data', (data) => {
      const chunk = data.toString('utf8')
      stdout += chunk
      // 减少日志输出，只在有意义的内容时记录
      if (chunk.length > 10 && !chunk.includes('\x1B[')) {
        console.log('📤 kubelet-wuhrai stdout:', chunk.substring(0, 200))
      }
    })

    child.stderr?.setEncoding('utf8')
    child.stderr?.on('data', (data) => {
      const chunk = data.toString('utf8')
      stderr += chunk
      // 只记录错误信息
      if (chunk.includes('Error') || chunk.includes('Failed')) {
        console.log('📤 kubelet-wuhrai stderr:', chunk.substring(0, 200))
      }
    })

    child.on('close', (code) => {
      if (isResolved) return
      clearTimeout(timer)
      isResolved = true

      console.log('🏁 kubelet-wuhrai 进程结束:', {
        code,
        stdoutLength: stdout.length,
        stderrLength: stderr.length,
        stdout: stdout.substring(0, 500),
        stderr: stderr.substring(0, 500)
      })

      // 改进的ANSI转义序列清理
      const cleanOutput = (text: string) => {
        return text
          .replace(/\x1b\[[0-9;]*m/g, '') // 移除ANSI颜色代码
          .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '') // 移除其他ANSI序列
          .replace(/\x1b\[[\d;]*[A-Za-z]/g, '') // 移除更多ANSI序列
          .replace(/\x1b\]/g, '') // 移除其他转义字符
          .replace(/\r\n/g, '\n') // 统一换行符
          .replace(/\r/g, '\n') // 统一换行符
          .replace(/\n\s*\n/g, '\n') // 移除多余空行
          .trim()
      }

      const cleanStdout = cleanOutput(stdout)
      const cleanStderr = cleanOutput(stderr)

      // 检查是否有kubectl解析错误
      const hasKubectlError = cleanStderr.includes('Failed to parse kubectl command') ||
                             cleanStderr.includes('reached EOF without closing quote')

      if (code === 0 && cleanStdout && !hasKubectlError) {
        console.log('✅ kubelet-wuhrai 执行成功，响应长度:', cleanStdout.length)
        console.log('📨 AI回复预览:', cleanStdout.substring(0, 200))
        resolve({
          success: true,
          response: cleanStdout
        })
      } else if (hasKubectlError) {
        console.log('⚠️ kubelet-wuhrai kubectl命令解析错误')
        resolve({
          success: false,
          error: '命令解析失败，请尝试使用更简单的命令描述'
        })
      } else {
        console.log('❌ kubelet-wuhrai 执行失败:', { code, cleanStderr })
        resolve({
          success: false,
          error: cleanStderr || `进程退出码: ${code}`
        })
      }
    })

    child.on('error', (error) => {
      if (isResolved) return
      clearTimeout(timer)
      isResolved = true
      console.log('❌ kubelet-wuhrai 进程错误:', error)
      resolve({
        success: false,
        error: error.message
      })
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { user } = authResult

    const body = await request.json()
    const {
      message,
      model,
      autoExecution = false,
      temperature = 0.7,
      maxTokens = 4000,
      systemPrompt,
      hostId, // 远程主机ID
      apiKey, // 前端传递的API密钥
      baseUrl // 前端传递的Base URL
    } = body

    // 验证必需参数
    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: '消息内容不能为空',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    const prisma = await getPrismaClient()
    let finalModel: string
    let finalApiKey: string
    let finalBaseUrl: string | undefined
    let provider: ProviderType

    // 如果前端传递了完整配置，直接使用
    if (model && apiKey) {
      finalModel = model
      finalApiKey = apiKey
      finalBaseUrl = baseUrl
      provider = getProviderFromModel(model)


    } else {
      // 否则从数据库获取用户的模型配置

      const userSelection = await prisma.userModelSelection.findUnique({
        where: {
          userId: user.id
        },
        include: {
          selectedModel: true
        }
      })

      if (!userSelection || !userSelection.selectedModel) {
        return NextResponse.json(
          {
            success: false,
            error: '未找到模型配置，请先在AI助手页面选择模型或在模型管理页面添加模型配置',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        )
      }

      const modelConfig = userSelection.selectedModel

      if (!modelConfig.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: '选择的模型已被禁用，请选择其他模型',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        )
      }

      finalModel = modelConfig.modelName
      finalApiKey = modelConfig.apiKey
      finalBaseUrl = modelConfig.baseUrl || undefined
      provider = getProviderFromModel(finalModel)

      console.log('📨 使用数据库配置:', {
        modelId: modelConfig.id,
        model: finalModel,
        displayName: modelConfig.displayName,
        provider: provider,
        hasApiKey: !!finalApiKey,
        hasBaseUrl: !!finalBaseUrl
      })
    }

    // 验证配置完整性
    const validation = validateModelConfig(finalModel, finalApiKey, finalBaseUrl)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: `配置错误: ${validation.errors.join(', ')}`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    console.log('📨 System Chat 请求:', {
      messageLength: message.length,
      model: finalModel,
      provider: provider,
      hostId: hostId || 'local',
      autoExecution: autoExecution,
      hasSystemPrompt: !!systemPrompt,
      hasApiKey: !!finalApiKey,
      hasBaseUrl: !!finalBaseUrl
    })

    // 判断执行模式
    const isRemoteExecution = hostId && hostId !== 'local'

    console.log('🎯 执行模式判断:', {
      hostId: hostId,
      isRemoteExecution: isRemoteExecution,
      hostIdType: typeof hostId,
      hostIdValue: JSON.stringify(hostId),
      timestamp: new Date().toISOString()
    })

    // 添加更详细的决策日志
    if (isRemoteExecution) {
      console.log('✅ 确认进入远程执行模式:', {
        hostId: hostId,
        reason: 'hostId存在且不等于local',
        nextStep: '查找服务器配置'
      })
    } else {
      console.log('✅ 确认进入本地执行模式:', {
        hostId: hostId,
        reason: hostId ? 'hostId等于local' : 'hostId为空或未定义',
        nextStep: '本地kubelet-wuhrai执行'
      })
    }

    if (isRemoteExecution) {
      // 使用新的远程执行架构
      console.log('🌐 进入远程执行模式，使用新架构，主机ID:', hostId)

      try {
        // 调用专用的远程kubelet-wuhrai API
        const remoteApiUrl = new URL('/api/remote/kubelet-wuhrai', request.url)

        const remoteRequest = {
          hostId,
          message,
          model: finalModel,
          apiKey: finalApiKey,
          baseUrl: finalBaseUrl,
          provider,
          temperature,
          maxTokens,
          systemPrompt
        }



        const remoteResponse = await fetch(remoteApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify(remoteRequest)
        })

        if (!remoteResponse.ok) {
          const errorData = await remoteResponse.json().catch(() => ({}))
          throw new Error(errorData.error || `远程API调用失败: ${remoteResponse.status}`)
        }

        const remoteResult = await remoteResponse.json()

        console.log('📥 远程API响应:', {
          success: remoteResult.success,
          hostName: remoteResult.hostName,
          executionMode: remoteResult.executionMode,
          hasResponse: !!remoteResult.response,
          hasError: !!remoteResult.error
        })

        if (!remoteResult.success) {
          throw new Error(remoteResult.error || '远程执行失败')
        }

        // 返回远程执行结果
        return NextResponse.json({
          success: true,
          response: remoteResult.response,
          model: remoteResult.model || finalModel,
          provider: remoteResult.provider || provider,
          executionMode: remoteResult.executionMode,
          hostId: remoteResult.hostId,
          hostName: remoteResult.hostName,
          hostInfo: remoteResult.hostInfo,
          executionTime: remoteResult.executionTime,
          timestamp: remoteResult.timestamp
        })

      } catch (error) {
        console.error('❌ 远程执行失败:', error)
        return NextResponse.json(
          {
            success: false,
            error: `远程执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        )
      }
    } else {
      // 本地执行模式
      console.log('🏠 本地执行模式')
      
      try {
        // 直接使用用户消息，不添加额外的系统提示词
        // kubelet-wuhrai程序本身已经有内置的系统提示词
        const fullMessage = message

        // 构建kubelet-wuhrai请求
        const kubeletRequest: KubeletWuhraiRequest = {
          message: fullMessage,
          model: finalModel,
          provider: provider,
          apiKey: finalApiKey,
          baseUrl: finalBaseUrl,
          temperature: temperature,
          maxTokens: maxTokens,
          autoExecution: autoExecution
        }

        console.log('📨 处理聊天请求:', {
          provider: provider,
          model: finalModel,
          messageLength: message.length,
          autoExecution: autoExecution,
          hasSystemPrompt: !!systemPrompt,
          hasApiKey: !!finalApiKey,
          apiKeyLength: finalApiKey ? finalApiKey.length : 0,
          baseUrl: finalBaseUrl,
          hostId: 'local'
        })

        // 调用kubelet-wuhrai
        const result = await executeKubeletWuhrai(kubeletRequest)

        if (!result.success) {
          throw new Error(result.error || 'kubelet-wuhrai调用失败')
        }

        const responseData = {
          success: true,
          response: `🏠 [本地执行] ${result.response || '处理完成'}`,
          model: finalModel,
          provider: provider,
          executionMode: 'local',
          hostId: 'local',
          timestamp: new Date().toISOString(),
        }

        console.log('📤 返回本地执行结果:', {
          success: responseData.success,
          executionMode: responseData.executionMode,
          responseLength: responseData.response.length
        })

        return NextResponse.json(responseData)

      } catch (error) {
        console.error('❌ kubelet-wuhrai执行失败:', error)
        return NextResponse.json(
          {
            success: false,
            error: `处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        )
      }
    }

  } catch (error) {
    console.error('❌ System Chat API错误:', error)
    return NextResponse.json(
      {
        success: false,
        error: '服务器内部错误',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
