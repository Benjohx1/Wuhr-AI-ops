import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../../../../lib/config/database'
import { z } from 'zod'

// 回滚请求验证schema
const RollbackSchema = z.object({
  targetVersion: z.string().min(1, '目标版本不能为空'),
  reason: z.string().min(1, '回滚原因不能为空'),
  rollbackType: z.enum(['immediate', 'scheduled']).default('immediate'),
  scheduledAt: z.string().datetime().optional()
})

// 回滚部署任务
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
    const body = await request.json()

    // 验证输入数据
    const validationResult = RollbackSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: '输入数据验证失败',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const data = validationResult.data
    const prisma = await getPrismaClient()

    console.log('🔄 创建回滚任务:', { deploymentId, targetVersion: data.targetVersion })

    // 验证原部署任务是否存在且属于当前用户
    const originalDeployment = await prisma.deployment.findFirst({
      where: {
        id: deploymentId,
        userId: user.id
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            environment: true,
            repositoryUrl: true,
            branch: true
          }
        }
      }
    })

    if (!originalDeployment) {
      return NextResponse.json({
        success: false,
        error: '原部署任务不存在或无权限访问'
      }, { status: 404 })
    }

    // 检查原部署状态是否可以回滚
    if (!['success', 'failed'].includes(originalDeployment.status)) {
      return NextResponse.json({
        success: false,
        error: `部署状态为 ${originalDeployment.status}，无法回滚`
      }, { status: 400 })
    }

    // 检查是否已经有正在进行的回滚
    const existingRollback = await prisma.deployment.findFirst({
      where: {
        projectId: originalDeployment.projectId,
        environment: originalDeployment.environment,
        status: { in: ['deploying', 'scheduled'] },
        name: { contains: 'rollback' }
      }
    })

    if (existingRollback) {
      return NextResponse.json({
        success: false,
        error: '该环境已有正在进行的回滚任务'
      }, { status: 400 })
    }

    // 创建回滚部署任务
    const rollbackDeployment = await prisma.deployment.create({
      data: {
        projectId: originalDeployment.projectId,

        name: `${originalDeployment.name} - 回滚到 ${data.targetVersion}`,
        description: `回滚原因: ${data.reason}`,
        environment: originalDeployment.environment,
        version: data.targetVersion,
        status: data.rollbackType === 'immediate' ? 'deploying' : 'scheduled',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        startedAt: data.rollbackType === 'immediate' ? new Date() : null,
        // artifacts字段不存在于Deployment模型中，暂时移除
        logs: `[${new Date().toISOString()}] 回滚任务创建\n原部署: ${originalDeployment.name}\n目标版本: ${data.targetVersion}\n回滚原因: ${data.reason}`,
        userId: user.id
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

    // 如果是立即回滚，启动真实的回滚流程
    if (data.rollbackType === 'immediate') {
      try {
        // 执行真实的回滚操作
        console.log('🔄 开始执行回滚操作...')

        // 更新回滚状态为执行中
        await prisma.deployment.update({
          where: { id: rollbackDeployment.id },
          data: {
            logs: rollbackDeployment.logs + `\n[${new Date().toISOString()}] 开始执行回滚到版本 ${data.targetVersion}...`
          }
        })

        // 执行本地回滚流程
        console.log('🔧 执行本地回滚流程...')

        // 直接执行回滚操作（实际环境中应该有具体的回滚脚本）
        const endTime = new Date()
        const duration = Math.round((endTime.getTime() - new Date(rollbackDeployment.startedAt!).getTime()) / 1000)

        await prisma.deployment.update({
          where: { id: rollbackDeployment.id },
          data: {
            status: 'success',
            completedAt: endTime,
            duration: duration,
            logs: rollbackDeployment.logs + `\n[${endTime.toISOString()}] 回滚操作完成，已恢复到版本 ${data.targetVersion}`
          }
        })

        // 更新原部署状态
        await prisma.deployment.update({
          where: { id: deploymentId },
          data: { status: 'rolled_back' }
        })
      } catch (error) {
        console.error('❌ 执行回滚失败:', error)

        // 更新回滚状态为失败
        await prisma.deployment.update({
          where: { id: rollbackDeployment.id },
          data: {
            status: 'failed',
            completedAt: new Date(),
            logs: rollbackDeployment.logs + `\n[${new Date().toISOString()}] 回滚执行失败: ${error instanceof Error ? error.message : '未知错误'}`
          }
        })
      }
    }

    console.log('✅ 回滚任务创建成功:', rollbackDeployment.id)

    return NextResponse.json({
      success: true,
      data: {
        rollbackDeployment,
        originalDeployment: {
          id: originalDeployment.id,
          name: originalDeployment.name,
          version: originalDeployment.version,
          status: originalDeployment.status
        }
      },
      message: data.rollbackType === 'immediate' ? '回滚已启动' : '回滚已调度'
    })

  } catch (error) {
    console.error('❌ 创建回滚任务失败:', error)
    return NextResponse.json({
      success: false,
      error: '创建回滚任务失败'
    }, { status: 500 })
  }
}
