import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/auth/apiHelpers-new'
import {
  performSSHConnectionTest,
  createSSHConfig,
  validateSSHConfig
} from '../../../../../lib/utils/sshConnectionUtils'

// 响应辅助函数
function successResponse(data: any) {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  })
}

function errorResponse(error: string, details?: string, status: number = 400) {
  return NextResponse.json({
    success: false,
    error,
    details,
    timestamp: new Date().toISOString()
  }, { status })
}

function serverErrorResponse(error: any) {
  console.error('API错误:', error)
  return NextResponse.json({
    success: false,
    error: '服务器内部错误',
    timestamp: new Date().toISOString()
  }, { status: 500 })
}

// SSH连接测试
export async function POST(request: NextRequest) {
  try {
    // 权限检查 - 只需要登录即可
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const body = await request.json()
    const { hostname, ip, port = 22, username, password, keyPath } = body

    // 创建SSH连接配置
    const sshConfig = createSSHConfig({
      host: ip,
      port,
      username,
      password,
      privateKey: keyPath
    })

    // 验证配置
    const validation = validateSSHConfig(sshConfig)
    if (!validation.valid) {
      return errorResponse('配置验证失败', validation.errors.join('; '), 400)
    }



    // 执行SSH连接测试
    const testResult = await performSSHConnectionTest(sshConfig)

    if (testResult.success) {
      return successResponse({
        message: testResult.message,
        connected: testResult.connected,
        systemInfo: testResult.systemInfo,
        connectionTime: testResult.connectionTime
      })
    } else {
      return errorResponse(testResult.message, testResult.error, 400)
    }

  } catch (error) {
    console.error('❌ SSH连接测试处理失败:', error)
    return serverErrorResponse(error)
  }
}

// 批量连接测试
export async function PUT(request: NextRequest) {
  try {
    // 权限检查 - 只需要登录即可
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const body = await request.json()
    const { serverIds } = body

    // 验证必要参数
    if (!serverIds || !Array.isArray(serverIds) || serverIds.length === 0) {
      return errorResponse('缺少服务器ID列表', 'serverIds是必需的数组', 400)
    }

    if (serverIds.length > 10) {
      return errorResponse('批量测试限制', '一次最多只能测试10台服务器', 400)
    }

    // TODO: 从数据库获取服务器信息并进行批量连接测试
    // 这里先模拟批量测试结果
    
    const results = serverIds.map(serverId => {
      const isSuccess = Math.random() > 0.3 // 70%成功率
      
      return {
        serverId,
        connected: isSuccess,
        message: isSuccess ? '连接成功' : '连接失败',
        testTime: Date.now(),
        ...(isSuccess ? {
          systemInfo: {
            os: 'Ubuntu 22.04.3 LTS',
            uptime: `${Math.floor(Math.random() * 30)} days`,
            memory: `${Math.floor(Math.random() * 32 + 8)}GB`
          }
        } : {
          errorCode: 'ECONNREFUSED',
          errorMessage: '连接被拒绝'
        })
      }
    })

    const successCount = results.filter(r => r.connected).length
    const failureCount = results.length - successCount

    console.log(`✅ 批量SSH连接测试完成: ${successCount}成功, ${failureCount}失败`)

    return successResponse({
      message: `批量连接测试完成: ${successCount}成功, ${failureCount}失败`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failure: failureCount,
        testTime: Date.now()
      }
    })

  } catch (error) {
    console.error('❌ 批量SSH连接测试失败:', error)
    return serverErrorResponse(error)
  }
}
