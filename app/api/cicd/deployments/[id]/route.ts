import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../../../lib/config/database'

// 获取单个部署任务详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 权限检查
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { user } = authResult
    const deploymentId = params.id
    const prisma = await getPrismaClient()

    console.log('🔍 获取部署任务详情:', { deploymentId })

    // 查询部署任务数据
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          select: { id: true, name: true, userId: true }
        },
        user: {
          select: { id: true, username: true, email: true }
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, username: true, email: true }
            }
          }
        }
      }
    })

    if (!deployment) {
      return NextResponse.json({
        success: false,
        error: '部署任务不存在'
      }, { status: 404 })
    }

    console.log('✅ 部署任务详情获取成功:', { deploymentId, name: deployment.name })

    return NextResponse.json({
      success: true,
      data: {
        id: deployment.id,
        projectId: deployment.projectId,
        name: deployment.name,
        description: deployment.description,
        environment: deployment.environment,
        status: deployment.status,
        version: deployment.version,
        buildNumber: deployment.buildNumber,
        deployScript: deployment.deployScript,
        rollbackScript: deployment.rollbackScript,
        scheduledAt: deployment.scheduledAt,
        startedAt: deployment.startedAt,
        completedAt: deployment.completedAt,
        duration: deployment.duration,
        logs: deployment.logs,
        config: deployment.config,
        createdAt: deployment.createdAt,
        updatedAt: deployment.updatedAt,
        project: deployment.project,
        creator: deployment.user,
        approvals: deployment.approvals.map(approval => ({
          id: approval.id,
          approverId: approval.approverId,
          status: approval.status,
          comments: approval.comments,
          approvedAt: approval.approvedAt,
          approver: approval.approver
        }))
      }
    })

  } catch (error) {
    console.error('❌ 获取部署任务详情错误:', error)
    return NextResponse.json({
      success: false,
      error: '获取部署任务详情失败'
    }, { status: 500 })
  }
}

// 更新部署任务
export async function PUT(
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

    console.log('📝 更新部署任务:', { deploymentId, userId: user.id })

    const prisma = await getPrismaClient()

    // 检查部署任务是否存在且用户有权限
    const existingDeployment = await prisma.deployment.findUnique({
      where: { id: deploymentId }
    })

    if (!existingDeployment) {
      return NextResponse.json({
        success: false,
        error: '部署任务不存在'
      }, { status: 404 })
    }

    if (existingDeployment.userId !== user.id) {
      return NextResponse.json({
        success: false,
        error: '无权限修改此部署任务'
      }, { status: 403 })
    }

    // 检查部署状态，正在部署的任务不能修改
    if (existingDeployment.status === 'deploying') {
      return NextResponse.json({
        success: false,
        error: '正在部署的任务不能修改'
      }, { status: 400 })
    }

    // 更新部署任务
    const updatedDeployment = await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        name: body.name,
        description: body.description,
        environment: body.environment,
        version: body.version,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        updatedAt: new Date()
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        user: {
          select: { id: true, username: true }
        }
      }
    })

    console.log('✅ 部署任务更新成功:', deploymentId)

    return NextResponse.json({
      success: true,
      message: '部署任务更新成功',
      data: updatedDeployment
    })

  } catch (error) {
    console.error('❌ 更新部署任务失败:', error)
    return NextResponse.json({
      success: false,
      error: '更新部署任务失败'
    }, { status: 500 })
  }
}

// 删除部署任务
export async function DELETE(
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

    console.log('🗑️ 删除部署任务:', { deploymentId, userId: user.id })

    const prisma = await getPrismaClient()

    // 检查部署任务是否存在且用户有权限
    const existingDeployment = await prisma.deployment.findUnique({
      where: { id: deploymentId }
    })

    if (!existingDeployment) {
      return NextResponse.json({
        success: false,
        error: '部署任务不存在'
      }, { status: 404 })
    }

    if (existingDeployment.userId !== user.id) {
      return NextResponse.json({
        success: false,
        error: '无权限删除此部署任务'
      }, { status: 403 })
    }

    // 检查部署状态，正在部署的任务不能删除
    if (existingDeployment.status === 'deploying') {
      return NextResponse.json({
        success: false,
        error: '正在部署的任务不能删除'
      }, { status: 400 })
    }

    // 删除相关的审批记录
    await prisma.deploymentApproval.deleteMany({
      where: { deploymentId: deploymentId }
    })

    // 删除部署任务
    await prisma.deployment.delete({
      where: { id: deploymentId }
    })

    console.log('✅ 部署任务删除成功:', deploymentId)

    return NextResponse.json({
      success: true,
      message: '部署任务删除成功'
    })

  } catch (error) {
    console.error('❌ 删除部署任务失败:', error)
    return NextResponse.json({
      success: false,
      error: '删除部署任务失败'
    }, { status: 500 })
  }
}
