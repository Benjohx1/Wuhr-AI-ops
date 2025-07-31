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
async function executeKubeletWuhrai(request: KubeletWuhraiRequest): Promise<{
  success: boolean;
  response?: string;
  error?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  executionTime?: number;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const kubeletWuhraiPath = 'kubelet-wuhrai' // 使用PATH中的命令
    const timeout = 120000 // 120秒超时

    // 使用传入的模型配置构建环境变量
    const envVars = buildEnvironmentVariables(
      request.model || 'deepseek-chat',
      request.apiKey || '',
      request.baseUrl,
      request.provider
    )

    // 构建kubelet-wuhrai命令参数
    const args = generateKubeletArgs(
      request.model || 'deepseek-chat',
      true, // 使用quiet模式
      request.provider
    )

    // 添加其他必要参数
    args.push('--skip-verify-ssl', '--skip-permissions')

    // 用户消息作为位置参数
    args.push(request.message)

    const fullEnv = { ...process.env, ...envVars }

    // 构建完整的命令字符串用于调试
    const envString = Object.entries(envVars).map(([k, v]) => `${k}="${v}"`).join(' ')
    const fullCommand = `${envString} ${kubeletWuhraiPath} ${args.join(' ')}`

    console.log('🚀 执行 kubelet-wuhrai:', {
      path: kubeletWuhraiPath,
      model: request.model,
      provider: request.provider,
      args: args,
      hasApiKey: !!request.apiKey,
      hasBaseUrl: !!request.baseUrl,
      envVars: Object.keys(envVars),
      message: request.message.substring(0, 100) + '...',
      messageLength: request.message.length,
      fullCommand: fullCommand.substring(0, 200) + '...',
      cwd: process.cwd()
    })

    // 验证环境变量
    console.log('🔍 环境变量验证:', {
      envVars: Object.keys(envVars),
      hasApiKey: Object.values(envVars).some(v => v && v.length > 0),
      baseUrl: request.baseUrl || 'NONE'
    })

    // 检查kubelet-wuhrai是否可用
    console.log('🔍 检查kubelet-wuhrai可用性:', {
      path: kubeletWuhraiPath,
      args: args.slice(0, -1), // 不显示完整消息
      env: Object.keys(envVars)
    })

    // 执行kubelet-wuhrai命令 - 使用shell执行以确保PATH解析
    const child = spawn(kubeletWuhraiPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'], // ignore stdin, pipe stdout/stderr
      env: fullEnv,
      cwd: process.cwd(),
      shell: true, // 使用shell执行以确保PATH解析
      detached: false,
      windowsHide: true // 隐藏窗口（如果在Windows上）
    })

    let stdout = ''
    let stderr = ''
    let isResolved = false

    // 添加错误处理
    child.on('error', (error) => {
      const nodeError = error as NodeJS.ErrnoException
      console.error('❌ kubelet-wuhrai spawn错误:', {
        error: error.message,
        code: nodeError.code,
        errno: nodeError.errno,
        syscall: nodeError.syscall,
        path: nodeError.path
      })

      if (!isResolved) {
        isResolved = true
        clearTimeout(timer)

        let errorMessage = `kubelet-wuhrai执行失败: ${error.message}`

        if (nodeError.code === 'ENOENT') {
          errorMessage = `kubelet-wuhrai命令未找到。请确保：
1. kubelet-wuhrai已正确安装到系统PATH中
2. 可以在终端中直接运行 'kubelet-wuhrai --version' 命令
3. 如果使用自定义安装路径，请确保已添加到PATH环境变量`
        }

        resolve({
          success: false,
          error: errorMessage
        })
      }
    })

    if (!child.pid) {
      console.log('❌ 进程启动失败 - 无PID')
      if (!isResolved) {
        isResolved = true
        resolve({
          success: false,
          error: 'kubelet-wuhrai进程启动失败 - 无法获取进程ID'
        })
      }
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

      // 完全清理ANSI转义序列和控制字符
      const cleanOutput = (text: string) => {
        return text
          // 移除所有ANSI转义序列
          .replace(/\x1b\[[0-9;]*[mGKHfABCDsuJnpqr]/g, '') // 标准ANSI序列
          .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '') // 其他ANSI序列
          .replace(/\x1b\[[\d;]*[A-Za-z]/g, '') // 数字参数ANSI序列
          .replace(/\x1b\[[?]?[0-9;]*[hlc]/g, '') // 私有模式序列
          .replace(/\x1b\]/g, '') // OSC序列开始
          .replace(/\x1b\\/g, '') // OSC序列结束
          .replace(/\x1b[()][AB012]/g, '') // 字符集选择
          .replace(/\x1b[=>]/g, '') // 键盘模式
          .replace(/\x1b[78]/g, '') // 保存/恢复光标
          .replace(/\x1b[DEHMN]/g, '') // 其他控制序列
          .replace(/\x1b\[[\d;]*[~]/g, '') // 功能键序列
          .replace(/\x1b\[[0-9;]*[ABCDEFGHIJKLMNOPQRSTUVWXYZ]/g, '') // 所有大写字母结尾的序列
          .replace(/\x1b\[[0-9;]*[abcdefghijklmnopqrstuvwxyz]/g, '') // 所有小写字母结尾的序列
          // 移除其他控制字符
          .replace(/\x07/g, '') // 响铃
          .replace(/\x08/g, '') // 退格
          .replace(/\x0c/g, '') // 换页
          .replace(/\x0e/g, '') // 移位输出
          .replace(/\x0f/g, '') // 移位输入
          .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '') // 其他控制字符
          // 统一换行符和清理空白
          .replace(/\r\n/g, '\n') // 统一换行符
          .replace(/\r/g, '\n') // 统一换行符
          .replace(/\n\s*\n\s*\n/g, '\n\n') // 移除多余空行，保留双换行
          .replace(/^\s+|\s+$/g, '') // 移除首尾空白
          .replace(/[ \t]+/g, ' ') // 合并多个空格和制表符
      }

      const cleanStdout = cleanOutput(stdout)
      const cleanStderr = cleanOutput(stderr)

      // 检查是否有kubectl解析错误
      const hasKubectlError = cleanStderr.includes('Failed to parse kubectl command') ||
                             cleanStderr.includes('reached EOF without closing quote')

      if (code === 0 && cleanStdout && !hasKubectlError) {
        console.log('✅ kubelet-wuhrai 执行成功，响应长度:', cleanStdout.length)
        console.log('📨 AI回复预览:', cleanStdout.substring(0, 200))

        // 估算token使用量
        const estimatedUsage = {
          promptTokens: Math.ceil(request.message.length / 4),
          completionTokens: Math.ceil(cleanStdout.length / 4),
          totalTokens: Math.ceil((request.message.length + cleanStdout.length) / 4)
        }

        resolve({
          success: true,
          response: cleanStdout,
          usage: estimatedUsage,
          executionTime: Date.now() - startTime
        })
      } else if (hasKubectlError) {
        console.log('⚠️ kubelet-wuhrai kubectl命令解析错误')
        resolve({
          success: false,
          error: '命令解析失败，请尝试使用更简单的命令描述'
        })
      } else {
        console.log('❌ kubelet-wuhrai 执行失败:', { code, cleanStderr })

        let errorMessage = cleanStderr || `进程退出码: ${code}`

        // 特殊处理常见错误
        if (cleanStderr.includes('cannot execute binary file')) {
          errorMessage = `kubelet-wuhrai二进制文件无法执行。可能原因：
1. 二进制文件损坏或不兼容当前系统架构
2. 文件权限不足，请检查执行权限
3. 请重新下载并安装kubelet-wuhrai
4. 确保下载的版本与当前系统架构匹配（x86_64/arm64）`
        } else if (code === 127) {
          errorMessage = `kubelet-wuhrai命令未找到（退出码127）。请确保：
1. kubelet-wuhrai已正确安装
2. 命令在系统PATH中可用
3. 可以在终端中运行 'which kubelet-wuhrai' 检查安装位置`
        } else if (cleanStderr.includes('400 Bad Request') || cleanStderr.includes('HTTP 400')) {
          errorMessage = `API调用失败（400错误）。可能原因：
1. API密钥无效或格式错误
2. 模型名称不被API服务支持
3. 请求参数格式不正确
4. Base URL配置错误
详细错误：${cleanStderr}`
        } else if (cleanStderr.includes('401') || cleanStderr.includes('Unauthorized')) {
          errorMessage = `API认证失败（401错误）。请检查：
1. API密钥是否正确
2. API密钥是否有效且未过期
3. API密钥权限是否足够
详细错误：${cleanStderr}`
        } else if (cleanStderr.includes('connection refused') || cleanStderr.includes('connect: connection refused')) {
          errorMessage = `无法连接到API服务。请检查：
1. Base URL是否正确：${request.baseUrl || '未设置'}
2. 服务是否正在运行
3. 网络连接是否正常
4. 防火墙设置是否阻止连接`
        }

        resolve({
          success: false,
          error: errorMessage
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
      baseUrl, // 前端传递的Base URL
      isK8sMode = false // K8s命令模式标识
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
    console.log('🔍 验证模型配置:', {
      model: finalModel,
      hasApiKey: !!finalApiKey,
      apiKeyLength: finalApiKey?.length || 0,
      baseUrl: finalBaseUrl,
      provider: provider
    })

    const validation = validateModelConfig(finalModel, finalApiKey, finalBaseUrl)
    if (!validation.valid) {
      console.error('❌ 模型配置验证失败:', validation.errors)
      return NextResponse.json(
        {
          success: false,
          error: `配置错误: ${validation.errors.join(', ')}`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    console.log('✅ 模型配置验证通过')

    console.log('📨 System Chat 请求:', {
      messageLength: message.length,
      model: finalModel,
      provider: provider,
      hostId: hostId || 'local',
      autoExecution: autoExecution,
      hasSystemPrompt: !!systemPrompt,
      hasApiKey: !!finalApiKey,
      hasBaseUrl: !!finalBaseUrl,
      isK8sMode: isK8sMode
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

        // 构建环境约束的系统提示词（远程执行）
        let environmentConstraint = ''
        if (isK8sMode) {
          environmentConstraint = `
⚠️ **严格约束：当前为K8s集群命令模式**
- 只能执行Kubernetes相关命令（kubectl等）
- 禁止执行任何Linux系统命令（如ls、cat、ps、top等）
- 所有操作都必须针对Kubernetes集群
- 如果用户要求执行Linux系统命令，请明确告知当前为K8s模式，需要切换到Linux模式
`
        } else {
          environmentConstraint = `
⚠️ **严格约束：当前为Linux系统命令模式**  
- 只能执行Linux系统命令（如ls、cat、ps、top、systemctl等）
- 禁止执行任何Kubernetes命令（如kubectl等）
- 所有操作都针对本地Linux系统
- 如果用户要求执行Kubernetes命令，请明确告知当前为Linux模式，需要切换到K8s模式
`
        }

        // 构建带环境约束的完整消息（远程执行）
        const constrainedMessage = `${environmentConstraint}\n\n用户请求：${message}`

        const remoteRequest = {
          hostId,
          message: constrainedMessage,
          model: finalModel,
          apiKey: finalApiKey,
          baseUrl: finalBaseUrl,
          provider,
          temperature,
          maxTokens,
          systemPrompt,
          isK8sMode
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

        // 估算token使用量（如果远程API没有返回）
        const estimatedTokenUsage = remoteResult.usage || {
          promptTokens: Math.ceil(message.length / 4),
          completionTokens: Math.ceil((remoteResult.response || '').length / 4),
          totalTokens: Math.ceil((message.length + (remoteResult.response || '').length) / 4)
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
          usage: estimatedTokenUsage, // 添加token使用统计
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

        // 构建环境约束的系统提示词
        let environmentConstraint = ''
        if (isK8sMode) {
          environmentConstraint = `
⚠️ **严格约束：当前为K8s集群命令模式**
- 只能执行Kubernetes相关命令（kubectl等）
- 禁止执行任何Linux系统命令（如ls、cat、ps、top等）
- 所有操作都必须针对Kubernetes集群
- 如果用户要求执行Linux系统命令，请明确告知当前为K8s模式，需要切换到Linux模式
`
        } else {
          environmentConstraint = `
⚠️ **严格约束：当前为Linux系统命令模式**  
- 只能执行Linux系统命令（如ls、cat、ps、top、systemctl等）
- 禁止执行任何Kubernetes命令（如kubectl等）
- 所有操作都针对本地Linux系统
- 如果用户要求执行Kubernetes命令，请明确告知当前为Linux模式，需要切换到K8s模式
`
        }

        // 构建带环境约束的完整消息
        const constrainedMessage = `${environmentConstraint}\n\n用户请求：${message}`

        // 构建kubelet-wuhrai请求
        const kubeletRequest: KubeletWuhraiRequest = {
          message: constrainedMessage,
          model: finalModel,
          provider: provider,
          apiKey: finalApiKey,
          baseUrl: finalBaseUrl,
          temperature: temperature,
          maxTokens: maxTokens,
          autoExecution: autoExecution,
          isK8sMode: isK8sMode
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

        // 估算token使用量（如果kubelet-wuhrai没有返回）
        const estimatedTokenUsage = result.usage || {
          promptTokens: Math.ceil(message.length / 4), // 粗略估算：4字符=1token
          completionTokens: Math.ceil((result.response || '').length / 4),
          totalTokens: Math.ceil((message.length + (result.response || '').length) / 4)
        }

        const responseData = {
          success: true,
          response: `🏠 [本地执行] ${result.response || '处理完成'}`,
          model: finalModel,
          provider: provider,
          executionMode: 'local',
          hostId: 'local',
          usage: estimatedTokenUsage, // 添加token使用统计
          executionTime: result.executionTime,
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
