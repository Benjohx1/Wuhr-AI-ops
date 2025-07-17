import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../../../../lib/config/database'
import { SimplifiedDeploymentExecutor } from '../../../../../../lib/deployment/simplifiedDeploymentExecutor'

// 开始部署
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

    console.log('🚀 开始部署:', { deploymentId, userId: user.id })

    const prisma = await getPrismaClient()

    // 查找部署任务
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            repositoryUrl: true,
            branch: true,
            buildScript: true,
            deployScript: true,
            serverId: true
          }
        },
        approvals: {
          where: { status: 'pending' }
        }
      }
    })

    if (!deployment) {
      return NextResponse.json({
        success: false,
        error: '部署任务不存在'
      }, { status: 404 })
    }

    // 检查权限
    if (deployment.userId !== user.id) {
      return NextResponse.json({
        success: false,
        error: '无权限操作此部署任务'
      }, { status: 403 })
    }

    // 检查状态
    if (deployment.status !== 'approved' && deployment.status !== 'scheduled') {
      return NextResponse.json({
        success: false,
        error: '只有已审批或已计划的部署任务才能开始部署'
      }, { status: 400 })
    }

    // 检查是否有待审批的审批
    if (deployment.approvals.length > 0) {
      return NextResponse.json({
        success: false,
        error: '存在待审批的审批，无法开始部署'
      }, { status: 400 })
    }

    // 更新部署状态为部署中
    const updatedDeployment = await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: 'deploying',
        startedAt: new Date(),
        logs: '部署开始...\n'
      }
    })

    console.log('✅ 部署状态已更新为部署中')

    // 异步执行真实部署，不阻塞响应
    setTimeout(async () => {
      try {
        console.log('🚀 开始执行真实部署:', deploymentId)

        // 执行简化部署
        const deploymentConfig = {
          id: deploymentId,
          name: deployment.name,
          deployScript: deployment.project.deployScript || '',
          serverId: deployment.project.serverId || undefined
        }

        const executor = new SimplifiedDeploymentExecutor(deploymentId, deploymentConfig)
        const deploymentResult = await executor.execute()

        const prisma = await getPrismaClient()

        // 更新部署结果 - 使用upsert确保记录存在
        await prisma.deployment.upsert({
          where: { id: deploymentId },
          update: {
            status: deploymentResult.success ? 'success' : 'failed',
            completedAt: new Date(),
            duration: deploymentResult.duration,
            logs: deploymentResult.logs
          },
          create: {
            id: deploymentId,
            projectId: deployment.projectId,
            name: deployment.name,
            description: deployment.description,
            environment: deployment.environment,
            version: deployment.version,
            status: deploymentResult.success ? 'success' : 'failed',
            completedAt: new Date(),
            duration: deploymentResult.duration,
            logs: deploymentResult.logs,
            userId: deployment.userId,
            deployScript: deployment.deployScript,
            rollbackScript: deployment.rollbackScript
          }
        })

        console.log(`✅ 简化部署${deploymentResult.success ? '成功' : '失败'}:`, deploymentId)

        if (!deploymentResult.success) {
          console.error('❌ 部署失败，详细日志:', deploymentResult.logs)
        }

      } catch (error) {
        console.error('❌ 部署执行异常:', error)

        try {
          const prisma = await getPrismaClient()

          // 更新为失败状态 - 使用upsert确保记录存在
          await prisma.deployment.upsert({
            where: { id: deploymentId },
            update: {
              status: 'failed',
              completedAt: new Date(),
              duration: 0,
              logs: (deployment.logs || '') + '\n❌ 部署执行异常: ' +
                (error instanceof Error ? error.message : '未知错误')
            },
            create: {
              id: deploymentId,
              projectId: deployment.projectId,
              name: deployment.name,
              description: deployment.description,
              environment: deployment.environment,
              version: deployment.version,
              status: 'failed',
              completedAt: new Date(),
              duration: 0,
              logs: '❌ 部署执行异常: ' + (error instanceof Error ? error.message : '未知错误'),
              userId: deployment.userId,
              deployScript: deployment.deployScript,
              rollbackScript: deployment.rollbackScript
            }
          })
        } catch (updateError) {
          console.error('❌ 更新失败状态失败:', updateError)
        }
      }
    }, 1000) // 1秒后开始执行

    return NextResponse.json({
      success: true,
      message: '部署已开始',
      data: updatedDeployment
    })

  } catch (error) {
    console.error('❌ 开始部署失败:', error)
    return NextResponse.json({
      success: false,
      error: '开始部署失败'
    }, { status: 500 })
  }
}
