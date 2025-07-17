import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../../../../lib/config/database'
import { performJenkinsConnectionTest } from '../../../../../../lib/utils/jenkinsTestUtils'

// Jenkins连接测试
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { user } = authResult
    const configId = params.id
    const prisma = await getPrismaClient()

    console.log('🧪 开始Jenkins连接测试:', { configId, userId: user.id })

    // 查询Jenkins配置
    const config = await prisma.jenkinsConfig.findFirst({
      where: {
        id: configId,
        userId: user.id
      }
    })

    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Jenkins配置不存在或无权限访问'
      }, { status: 404 })
    }

    // 执行Jenkins连接测试
    const testResult = await performJenkinsConnectionTest({
      serverUrl: config.serverUrl,
      username: config.username || undefined,
      apiToken: config.apiToken || undefined
    })

    // 更新测试状态
    await prisma.jenkinsConfig.update({
      where: { id: configId },
      data: {
        lastTestAt: new Date(),
        testStatus: testResult.success ? 'connected' : 'disconnected'
      }
    })

    console.log(`${testResult.success ? '✅' : '❌'} Jenkins连接测试完成:`, configId)

    return NextResponse.json({
      success: testResult.success,
      data: testResult.data,
      message: testResult.message
    })

  } catch (error) {
    console.error('❌ Jenkins连接测试失败:', error)
    return NextResponse.json({
      success: false,
      error: 'Jenkins连接测试失败'
    }, { status: 500 })
  }
}


