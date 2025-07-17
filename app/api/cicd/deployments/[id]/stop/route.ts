import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../../../../lib/config/database'

// 停止部署任务
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
    const deploymentId = params.id
    const prisma = await getPrismaClient()

    console.log('🛑 停止部署任务:', deploymentId)

    // 验证部署任务是否存在且属于当前用户
    const deployment = await prisma.deployment.findFirst({
      where: {
        id: deploymentId,
        userId: user.id
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!deployment) {
      return NextResponse.json({
        success: false,
        error: '部署任务不存在或无权限访问'
      }, { status: 404 })
    }

    // 检查部署状态是否可以停止
    if (!['deploying', 'scheduled'].includes(deployment.status)) {
      return NextResponse.json({
        success: false,
        error: `部署状态为 ${deployment.status}，无法停止`
      }, { status: 400 })
    }

    // 计算持续时间
    let duration = null
    if (deployment.startedAt) {
      const startTime = new Date(deployment.startedAt).getTime()
      const endTime = new Date().getTime()
      duration = Math.round((endTime - startTime) / 1000)
    }

    // 更新部署状态为已取消
    const updatedDeployment = await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: 'failed', // 使用failed状态表示被停止
        completedAt: new Date(),
        duration: duration,
        logs: (deployment.logs || '') + `\n[${new Date().toISOString()}] 部署被用户手动停止`
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            environment: true
          }
        }
      }
    })

    // 执行本地停止操作
    console.log('🔧 执行本地停止操作...')

    // 这里可以添加具体的停止逻辑
    // 例如：停止正在运行的进程、清理临时文件等

    console.log('✅ 部署任务停止成功:', deploymentId)

    return NextResponse.json({
      success: true,
      data: updatedDeployment,
      message: '部署任务已停止'
    })

  } catch (error) {
    console.error('❌ 停止部署任务失败:', error)
    return NextResponse.json({
      success: false,
      error: '停止部署任务失败'
    }, { status: 500 })
  }
}
