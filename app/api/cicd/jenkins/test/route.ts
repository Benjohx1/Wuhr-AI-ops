import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/auth/apiHelpers-new'
import { performJenkinsConnectionTest } from '../../../../../lib/utils/jenkinsTestUtils'
import { z } from 'zod'

// Jenkins连接测试验证schema
const JenkinsTestSchema = z.object({
  serverUrl: z.string().url('请输入有效的Jenkins服务器URL'),
  username: z.string().optional(),
  apiToken: z.string().optional()
})

// Jenkins连接测试（不需要保存配置）
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { user } = authResult
    const body = await request.json()

    // 验证输入数据
    const validationResult = JenkinsTestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: '输入数据验证失败',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { serverUrl, username, apiToken } = validationResult.data

    console.log('🧪 开始Jenkins连接测试:', { 
      serverUrl, 
      username: username || 'anonymous',
      hasApiToken: !!apiToken,
      userId: user.id 
    })

    // 执行连接测试
    const testResult = await performJenkinsConnectionTest({
      serverUrl,
      username,
      apiToken
    })

    console.log(`${testResult.success ? '✅' : '❌'} Jenkins连接测试完成`)

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


