import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../../../lib/config/database'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// 获取部署统计信息
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d' // 默认30天
    const environment = searchParams.get('environment')
    const projectId = searchParams.get('projectId')

    const prisma = await getPrismaClient()

    // 计算时间范围
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // 构建查询条件
    const where: any = {
      userId: user.id,
      createdAt: {
        gte: startDate
      }
    }

    if (environment) {
      where.environment = environment
    }

    if (projectId) {
      where.projectId = projectId
    }

    // 获取基本统计
    const [
      totalDeployments,
      successDeployments,
      failedDeployments,
      deployingDeployments,
      pendingDeployments,
      rolledBackDeployments
    ] = await Promise.all([
      prisma.deployment.count({ where }),
      prisma.deployment.count({ where: { ...where, status: 'success' } }),
      prisma.deployment.count({ where: { ...where, status: 'failed' } }),
      prisma.deployment.count({ where: { ...where, status: 'deploying' } }),
      prisma.deployment.count({ where: { ...where, status: 'pending' } }),
      prisma.deployment.count({ where: { ...where, status: 'rolled_back' } })
    ])

    // 计算成功率
    const completedDeployments = successDeployments + failedDeployments + rolledBackDeployments
    const successRate = completedDeployments > 0 ? Math.round((successDeployments / completedDeployments) * 100) : 0

    // 计算平均部署时间
    const deploymentsWithDuration = await prisma.deployment.findMany({
      where: {
        ...where,
        duration: { not: null },
        status: { in: ['success', 'failed', 'rolled_back'] }
      },
      select: { duration: true }
    })

    const avgDuration = deploymentsWithDuration.length > 0
      ? Math.round(deploymentsWithDuration.reduce((sum, deployment) => sum + (deployment.duration || 0), 0) / deploymentsWithDuration.length)
      : 0

    // 获取每日部署趋势（最近30天）
    const dailyTrend = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'rolled_back' THEN 1 ELSE 0 END) as rolled_back
      FROM "Deployment"
      WHERE user_id = ${user.id}
        AND created_at >= ${startDate}
        ${environment ? `AND environment = '${environment}'` : ''}
        ${projectId ? `AND project_id = '${projectId}'` : ''}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    ` as Array<{
      date: string
      total: bigint
      success: bigint
      failed: bigint
      rolled_back: bigint
    }>

    // 获取环境分布统计
    const environmentStats = await prisma.$queryRaw`
      SELECT 
        environment,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'deploying' THEN 1 ELSE 0 END) as deploying
      FROM "Deployment"
      WHERE user_id = ${user.id}
        AND created_at >= ${startDate}
        ${projectId ? `AND project_id = '${projectId}'` : ''}
      GROUP BY environment
      ORDER BY total DESC
    ` as Array<{
      environment: string
      total: bigint
      success: bigint
      failed: bigint
      deploying: bigint
    }>

    // 获取部署时长分布
    const durationDistribution = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN duration < 60 THEN '< 1分钟'
          WHEN duration < 300 THEN '1-5分钟'
          WHEN duration < 900 THEN '5-15分钟'
          WHEN duration < 1800 THEN '15-30分钟'
          ELSE '> 30分钟'
        END as duration_range,
        COUNT(*) as count
      FROM "Deployment"
      WHERE user_id = ${user.id}
        AND created_at >= ${startDate}
        AND duration IS NOT NULL
        AND status IN ('success', 'failed', 'rolled_back')
        ${environment ? `AND environment = '${environment}'` : ''}
        ${projectId ? `AND project_id = '${projectId}'` : ''}
      GROUP BY duration_range
      ORDER BY 
        CASE duration_range
          WHEN '< 1分钟' THEN 1
          WHEN '1-5分钟' THEN 2
          WHEN '5-15分钟' THEN 3
          WHEN '15-30分钟' THEN 4
          WHEN '> 30分钟' THEN 5
        END
    ` as Array<{
      duration_range: string
      count: bigint
    }>

    // 获取最近失败的部署
    const recentFailures = await prisma.deployment.findMany({
      where: {
        ...where,
        status: { in: ['failed', 'rolled_back'] }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // 获取最活跃的项目
    const topProjects = await prisma.$queryRaw`
      SELECT 
        p.id,
        p.name,
        COUNT(d.id) as deployment_count,
        SUM(CASE WHEN d.status = 'success' THEN 1 ELSE 0 END) as success_count,
        AVG(d.duration) as avg_duration
      FROM "CICDProject" p
      LEFT JOIN "Deployment" d ON p.id = d.project_id
      WHERE p.user_id = ${user.id}
        AND d.created_at >= ${startDate}
        ${environment ? `AND d.environment = '${environment}'` : ''}
        ${projectId ? `AND p.id = '${projectId}'` : ''}
      GROUP BY p.id, p.name
      HAVING COUNT(d.id) > 0
      ORDER BY deployment_count DESC
      LIMIT 10
    ` as Array<{
      id: string
      name: string
      deployment_count: bigint
      success_count: bigint
      avg_duration: number
    }>

    console.log('✅ 获取部署统计信息成功')

    return NextResponse.json({
      success: true,
      data: {
        // 基本统计
        total: totalDeployments,
        success: successDeployments,
        failed: failedDeployments,
        deploying: deployingDeployments,
        pending: pendingDeployments,
        rolledBack: rolledBackDeployments,
        successRate,
        avgDuration,
        
        // 趋势数据
        dailyTrend: dailyTrend.map(item => ({
          date: item.date,
          total: Number(item.total),
          success: Number(item.success),
          failed: Number(item.failed),
          rolledBack: Number(item.rolled_back)
        })),
        
        // 环境统计
        environmentStats: environmentStats.map(item => ({
          environment: item.environment,
          total: Number(item.total),
          success: Number(item.success),
          failed: Number(item.failed),
          deploying: Number(item.deploying),
          successRate: Number(item.total) > 0 
            ? Math.round((Number(item.success) / Number(item.total)) * 100)
            : 0
        })),
        
        // 时长分布
        durationDistribution: durationDistribution.map(item => ({
          range: item.duration_range,
          count: Number(item.count)
        })),
        
        // 最近失败
        recentFailures: recentFailures.map(deployment => ({
          id: deployment.id,
          name: deployment.name,
          status: deployment.status,
          environment: deployment.environment,
          createdAt: deployment.createdAt,
          duration: deployment.duration,
          project: deployment.project
        })),
        
        // 活跃项目
        topProjects: topProjects.map(project => ({
          id: project.id,
          name: project.name,
          deploymentCount: Number(project.deployment_count),
          successCount: Number(project.success_count),
          successRate: Number(project.deployment_count) > 0 
            ? Math.round((Number(project.success_count) / Number(project.deployment_count)) * 100)
            : 0,
          avgDuration: Math.round(project.avg_duration || 0)
        })),
        
        // 查询参数
        timeRange,
        environment,
        projectId,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ 获取部署统计信息失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取部署统计信息失败'
    }, { status: 500 })
  }
}
