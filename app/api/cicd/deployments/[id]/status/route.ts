import { NextRequest } from 'next/server'
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  requirePermission,
  ensureDbInitialized
} from '../../../../../../lib/auth/apiHelpers'
import { getPrismaClient } from '../../../../../../lib/config/database'

// 从部署日志中提取当前执行阶段
function extractCurrentStage(logs: string): string {
  const lines = logs.split('\n').reverse() // 从最新的日志开始查找

  const stagePatterns = [
    { pattern: /🚀 开始完整部署流程/, stage: '初始化部署' },
    { pattern: /📁 准备工作目录/, stage: '准备工作目录' },
    { pattern: /📥 开始拉取代码/, stage: '拉取代码中' },
    { pattern: /正在克隆到/, stage: '克隆代码中' },
    { pattern: /🔄 执行增量更新/, stage: '更新代码中' },
    { pattern: /✅ 代码拉取完成/, stage: '代码拉取完成' },
    { pattern: /🔨 开始本地构建/, stage: '本地构建中' },
    { pattern: /✅ 本地构建完成/, stage: '本地构建完成' },
    { pattern: /📋 检查部署配置/, stage: '检查部署配置' },
    { pattern: /🚀 开始远程部署/, stage: '远程部署中' },
    { pattern: /📡 获取主机配置/, stage: '连接目标主机' },
    { pattern: /📤 开始传输构建产物/, stage: '传输文件中' },
    { pattern: /✅ 构建产物传输完成/, stage: '文件传输完成' },
    { pattern: /🔧 开始执行部署脚本/, stage: '执行部署脚本' },
    { pattern: /✅.*部署脚本执行完成/, stage: '部署脚本完成' },
    { pattern: /✅ 远程部署完成/, stage: '远程部署完成' },
    { pattern: /🔍 验证部署结果/, stage: '验证部署结果' },
    { pattern: /✅ 部署验证完成/, stage: '部署验证完成' },
    { pattern: /🧹 清理工作目录/, stage: '清理工作目录' },
    { pattern: /🎉.*成功完成/, stage: '部署成功' },
    { pattern: /❌.*失败/, stage: '部署失败' }
  ]

  for (const line of lines) {
    for (const { pattern, stage } of stagePatterns) {
      if (pattern.test(line)) {
        return stage
      }
    }
  }

  return '部署中'
}

// 获取部署状态
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 权限检查
    const authResult = await requirePermission(request, 'cicd:read')
    if (!authResult.success) {
      return authResult.response
    }

    // 确保数据库已初始化
    await ensureDbInitialized()
    const prisma = await getPrismaClient()

    const deploymentId = params.id

    console.log('📊 查询部署状态:', { deploymentId })

    // 获取部署任务基本信息
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      select: {
        id: true,
        status: true,
        logs: true,
        buildNumber: true,
        startedAt: true,
        completedAt: true,
        duration: true,
        updatedAt: true
      }
    })

    if (!deployment) {
      return errorResponse('部署任务不存在', undefined, 404)
    }

    // 提取当前阶段信息
    let currentStage = '部署中'
    if (deployment.status === 'deploying' && deployment.logs) {
      currentStage = extractCurrentStage(deployment.logs)
    }

    // 返回部署状态信息
    return successResponse({
      id: deployment.id,
      status: deployment.status,
      currentStage,
      logs: deployment.logs,
      buildNumber: deployment.buildNumber,
      startedAt: deployment.startedAt,
      completedAt: deployment.completedAt,
      duration: deployment.duration,
      updatedAt: deployment.updatedAt
    })

  } catch (error) {
    console.error('❌ 获取部署状态失败:', error)
    return serverErrorResponse('获取部署状态失败')
  }
}
