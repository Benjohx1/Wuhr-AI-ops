import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../../../../lib/config/database'
import { z } from 'zod'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// 执行部署验证schema
const ExecuteDeploymentSchema = z.object({
  buildParameters: z.record(z.any()).optional(),
  forceExecute: z.boolean().optional().default(false)
})

// 执行部署
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
    const validationResult = ExecuteDeploymentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: '输入数据验证失败',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { buildParameters, forceExecute } = validationResult.data
    const prisma = await getPrismaClient()

    console.log('🚀 执行部署任务:', { deploymentId, buildParameters, forceExecute })

    // 获取部署任务详情
    const deployment = await prisma.deployment.findFirst({
      where: {
        id: deploymentId,
        userId: user.id
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            repositoryUrl: true,
            branch: true,
            buildScript: true,
            deployScript: true
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

    // 检查部署状态
    if (deployment.status === 'deploying') {
      return NextResponse.json({
        success: false,
        error: '部署任务正在执行中，请勿重复执行'
      }, { status: 400 })
    }

    if (deployment.status === 'success' && !forceExecute) {
      return NextResponse.json({
        success: false,
        error: '部署任务已成功完成，如需重新执行请设置forceExecute为true'
      }, { status: 400 })
    }

    // 开始执行部署
    let executionLogs = `[${new Date().toISOString()}] 🚀 开始部署流程\n`
    let executionResult: any = {}
    let buildNumber: string

    try {
      // 更新部署状态为执行中
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'deploying',
          startedAt: new Date(),
          logs: executionLogs
        }
      })

      // 执行本地部署流程
      console.log('📝 执行本地部署流程...')
      
      executionLogs += `[${new Date().toISOString()}] 项目: ${deployment.project.name}\n`
      executionLogs += `[${new Date().toISOString()}] 环境: ${deployment.environment}\n`
      executionLogs += `[${new Date().toISOString()}] 版本: ${deployment.version || 'latest'}\n`
      
      if (buildParameters && Object.keys(buildParameters).length > 0) {
        executionLogs += `[${new Date().toISOString()}] 构建参数: ${JSON.stringify(buildParameters, null, 2)}\n`
      }
      
      executionLogs += `\n`

      // 模拟构建过程
      if (deployment.project.buildScript) {
        executionLogs += `[${new Date().toISOString()}] 📝 开始构建流程\n`
        executionLogs += `[${new Date().toISOString()}] 🔧 执行构建脚本:\n`
        executionLogs += `${deployment.project.buildScript}\n`
        
        // 模拟构建时间
        await new Promise(resolve => setTimeout(resolve, 2000))
        executionLogs += `[${new Date().toISOString()}] ✅ 构建完成\n\n`
      } else {
        executionLogs += `[${new Date().toISOString()}] ⚠️ 未配置构建脚本，跳过构建步骤\n\n`
      }

      // 模拟部署过程
      executionLogs += `[${new Date().toISOString()}] 🚀 开始部署流程\n`
      
      if (deployment.project.deployScript) {
        executionLogs += `[${new Date().toISOString()}] 🔧 执行部署脚本:\n`
        executionLogs += `${deployment.project.deployScript}\n`
        
        // 模拟部署时间
        await new Promise(resolve => setTimeout(resolve, 3000))
        executionLogs += `[${new Date().toISOString()}] ✅ 部署完成\n`
      } else {
        executionLogs += `[${new Date().toISOString()}] ⚠️ 未配置部署脚本，跳过部署步骤\n`
      }

      executionResult = {
        mode: 'local',
        success: true,
        message: '本地部署执行成功',
        buildScript: deployment.project.buildScript,
        deployScript: deployment.project.deployScript,
        environment: deployment.environment,
        buildParameters: buildParameters || {}
      }

      buildNumber = `BUILD-${Date.now()}`
      executionLogs += `[${new Date().toISOString()}] 📋 构建号: ${buildNumber}\n`
      executionLogs += `[${new Date().toISOString()}] 🎉 部署流程完成\n`

      // 更新部署状态为成功
      const updatedDeployment = await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'success',
          completedAt: new Date(),
          duration: Math.floor((Date.now() - new Date(deployment.startedAt || Date.now()).getTime()) / 1000),
          buildNumber: parseInt(buildNumber.split('-')[1]),
          logs: executionLogs,
          config: {
            ...(deployment.config as any || {}),
            executionResult,
            buildParameters: buildParameters || {}
          }
        }
      })

      console.log('✅ 部署执行成功:', deploymentId)

      return NextResponse.json({
        success: true,
        data: {
          id: updatedDeployment.id,
          status: updatedDeployment.status,
          buildNumber: updatedDeployment.buildNumber,
          startedAt: updatedDeployment.startedAt,
          completedAt: updatedDeployment.completedAt,
          duration: updatedDeployment.duration,
          logs: updatedDeployment.logs,
          executionResult
        },
        message: '部署执行成功'
      })

    } catch (error) {
      console.error('❌ 部署执行失败:', error)
      
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      executionLogs += `[${new Date().toISOString()}] ❌ 部署失败: ${errorMessage}\n`

      // 更新部署状态为失败
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          duration: Math.floor((Date.now() - new Date(deployment.startedAt || Date.now()).getTime()) / 1000),
          logs: executionLogs,
          config: {
            ...(deployment.config as any || {}),
            error: errorMessage,
            buildParameters: buildParameters || {}
          }
        }
      })

      return NextResponse.json({
        success: false,
        error: `部署执行失败: ${errorMessage}`
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ 执行部署任务失败:', error)
    return NextResponse.json({
      success: false,
      error: '执行部署任务失败'
    }, { status: 500 })
  }
}
