import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../../lib/config/database'
import { logDeployment, LogLevel } from '../../../../lib/logging/cicdLogger'
import { z } from 'zod'
import { notificationManager } from '../../../../lib/notifications/manager'

// 部署任务创建验证schema
const createDeploymentSchema = z.object({
  projectId: z.string().min(1, '项目ID不能为空'),
  name: z.string().min(1, '部署任务名称不能为空').max(255, '名称过长'),
  description: z.string().optional(),
  environment: z.enum(['dev', 'test', 'staging', 'prod'], { 
    errorMap: () => ({ message: '环境必须是 dev, test, staging, prod 之一' })
  }),
  buildParameters: z.record(z.any()).optional(),
  selectedJobs: z.array(z.string()).optional(),
  executionOrder: z.array(z.number()).optional(),
  requireApproval: z.boolean().optional().default(false),
  approvers: z.array(z.string()).optional()
})

// 获取部署任务列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const projectId = searchParams.get('projectId')
    const environment = searchParams.get('environment')
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''

    console.log('🔍 获取部署任务列表:', { page, limit, projectId, environment, status, search })

    const prisma = await getPrismaClient()

    // 构建查询条件
    let whereConditions: any = {
      userId: user.id // 只显示用户自己的部署任务
    }

    if (projectId) {
      whereConditions.projectId = projectId
    }

    if (environment) {
      whereConditions.environment = environment
    }

    if (status) {
      whereConditions.status = status
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 查询部署任务数据
    const [deployments, total] = await Promise.all([
      prisma.deployment.findMany({
        where: whereConditions,
        include: {
          project: {
            select: { id: true, name: true, environment: true }
          },
          user: {
            select: { id: true, username: true, email: true }
          },
          approvals: {
            include: {
              approver: {
                select: { id: true, username: true }
              }
            },
            orderBy: { level: 'asc' }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.deployment.count({ where: whereConditions })
    ])

    console.log(`✅ 获取部署任务列表成功，共 ${deployments.length} 个任务`)

    return NextResponse.json({
      success: true,
      data: {
        deployments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('❌ 获取部署任务列表失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取部署任务列表失败'
    }, { status: 500 })
  }
}

// 部署任务验证schema
const DeploymentSchema = z.object({
  projectId: z.string().min(1, '项目ID不能为空'),
  jenkinsConfigId: z.string().optional(),
  name: z.string().min(1, '部署名称不能为空').max(100, '部署名称过长'),
  description: z.string().optional(),
  environment: z.enum(['dev', 'test', 'prod']),
  version: z.string().optional(),
  buildNumber: z.number().int().positive().optional(),
  deployScript: z.string().optional(),
  rollbackScript: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  config: z.any().optional(),
  requireApproval: z.boolean().optional().default(false),
  approvers: z.array(z.string()).optional()
})

// 创建新部署任务
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { user } = authResult
    const body = await request.json()

    // 验证输入数据
    const validationResult = DeploymentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: '输入数据验证失败',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const data = validationResult.data
    const prisma = await getPrismaClient()

    console.log('🔨 创建部署任务:', { projectId: data.projectId, name: data.name, environment: data.environment })

    // 验证项目是否存在且属于当前用户
    const project = await prisma.cICDProject.findFirst({
      where: {
        id: data.projectId,
        userId: user.id
      }
    })

    if (!project) {
      return NextResponse.json({
        success: false,
        error: '项目不存在或无权限访问'
      }, { status: 404 })
    }



    // 处理计划部署时间
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null

    // 根据环境判断是否需要审批
    const needsApproval = data.environment === 'prod' || data.requireApproval
    const initialStatus = needsApproval ? 'pending' : 'approved'

    console.log('🔍 部署审批判断:', {
      environment: data.environment,
      requireApproval: data.requireApproval,
      needsApproval,
      initialStatus
    })

    // 创建部署任务
    const deployment = await prisma.deployment.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        environment: data.environment,
        version: data.version,
        buildNumber: data.buildNumber,
        deployScript: data.deployScript,
        rollbackScript: data.rollbackScript,
        scheduledAt: scheduledAt,
        config: data.config,
        userId: user.id,
        status: initialStatus
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

    console.log('✅ 部署任务创建成功:', deployment.id)

    // 如果需要审批，创建审批记录并发送通知
    if (needsApproval) {
      try {
        // 获取审批人列表
        let approvers = data.approvers || []

        // 如果没有指定审批人，根据环境自动分配
        if (approvers.length === 0) {
          if (data.environment === 'prod') {
            // 生产环境需要管理员审批
            const adminUsers = await prisma.user.findMany({
              where: {
                OR: [
                  { role: 'admin' },
                  { role: 'manager' },
                  { permissions: { has: 'cicd:approve' } }
                ]
              },
              select: { id: true }
            })
            approvers = adminUsers.map(u => u.id)
          }
        }

        if (approvers.length > 0) {
          // 创建审批记录
          const approvals = await Promise.all(
            approvers.map(async (approverId: string) => {
              const approval = await prisma.deploymentApproval.create({
                data: {
                  deploymentId: deployment.id,
                  approverId: approverId,
                  status: 'pending',
                  level: 1,
                  comments: '等待审批'
                }
              })

              // 发送审批请求通知
              try {
                await notificationManager.notifyApprovalRequested(
                  approval.id,
                  deployment.name,
                  user.id,
                  user.username,
                  approverId
                )
              } catch (notifyError) {
                console.error('❌ 发送审批请求通知失败:', notifyError)
              }

              return approval
            })
          )

          console.log(`✅ 创建了 ${approvals.length} 个审批记录`)
        } else {
          console.log('⚠️ 没有找到合适的审批人，部署任务将直接进入已审批状态')
          // 如果没有审批人，直接设置为已审批状态
          await prisma.deployment.update({
            where: { id: deployment.id },
            data: { status: 'approved' }
          })
        }
      } catch (approvalError) {
        console.error('❌ 创建审批记录失败:', approvalError)
      }
    } else {
      // 不需要审批的情况，可以考虑直接开始部署
      console.log('ℹ️ 部署任务不需要审批，状态为已审批')
    }

    return NextResponse.json({
      success: true,
      data: deployment,
      message: '部署任务创建成功'
    })

  } catch (error) {
    console.error('❌ 创建部署任务失败:', error)
    return NextResponse.json({
      success: false,
      error: '创建部署任务失败'
    }, { status: 500 })
  }
}
