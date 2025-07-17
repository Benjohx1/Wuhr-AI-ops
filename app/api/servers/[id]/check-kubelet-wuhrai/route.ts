import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../../../lib/config/database'
import { executeSSHCommand } from '../../../../../lib/ssh/client'



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

    const serverId = params.id

    // 获取服务器信息
    const prisma = await getPrismaClient()
    const server = await prisma.server.findUnique({
      where: { id: serverId }
    })

    if (!server) {
      return NextResponse.json({
        success: false,
        error: '服务器不存在'
      }, { status: 404 })
    }

    console.log('🔍 检查kubelet-wuhrai状态，服务器:', {
      name: server.name,
      ip: server.ip,
      port: server.port
    })

    // 构建SSH配置
    const sshConfig = {
      host: server.ip,
      port: server.port,
      username: server.username,
      password: server.password || undefined,
      timeout: 30000
    }

    const recommendations: Array<{
      type: 'success' | 'warning' | 'error' | 'info'
      message: string
    }> = []

    let kubeletStatus = 'not_installed'
    let kubeletVersion = ''

    try {
      // 检查kubelet-wuhrai是否安装
      const checkResult = await executeSSHCommand(sshConfig, 'which kubelet-wuhrai')
      
      if (checkResult.success && checkResult.stdout.trim()) {
        kubeletStatus = 'installed'
        recommendations.push({
          type: 'success',
          message: 'kubelet-wuhrai命令已找到'
        })

        // 尝试获取版本信息
        try {
          const versionResult = await executeSSHCommand(sshConfig, 'kubelet-wuhrai --version')
          if (versionResult.success && versionResult.stdout.trim()) {
            kubeletVersion = versionResult.stdout.trim()
            recommendations.push({
              type: 'info',
              message: `版本信息: ${kubeletVersion}`
            })
          }
        } catch (error) {
          console.log('获取kubelet-wuhrai版本失败:', error)
          recommendations.push({
            type: 'warning',
            message: '无法获取版本信息，但命令可执行'
          })
        }

        // 检查基本功能
        try {
          const helpResult = await executeSSHCommand(sshConfig, 'kubelet-wuhrai --help')
          if (helpResult.success) {
            recommendations.push({
              type: 'success',
              message: 'kubelet-wuhrai帮助命令正常'
            })
          }
        } catch (error) {
          recommendations.push({
            type: 'warning',
            message: '帮助命令执行异常，可能存在配置问题'
          })
        }

      } else {
        kubeletStatus = 'not_installed'
        recommendations.push({
          type: 'error',
          message: 'kubelet-wuhrai命令未找到'
        })
        recommendations.push({
          type: 'info',
          message: '请确保kubelet-wuhrai已正确安装并在PATH中'
        })
      }

    } catch (error) {
      console.error('SSH连接或命令执行失败:', error)
      recommendations.push({
        type: 'error',
        message: `SSH连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      })
    }

    // 添加通用建议
    if (kubeletStatus === 'installed') {
      recommendations.push({
        type: 'success',
        message: '✅ 远程主机已准备好进行AI聊天'
      })
    } else {
      recommendations.push({
        type: 'warning',
        message: '⚠️ 需要安装kubelet-wuhrai才能在此主机上使用AI功能'
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        kubeletStatus,
        kubeletVersion,
        recommendations,
        serverInfo: {
          name: server.name,
          ip: server.ip,
          port: server.port
        }
      }
    })

  } catch (error) {
    console.error('检查kubelet-wuhrai状态失败:', error)
    return NextResponse.json({
      success: false,
      error: '检查kubelet-wuhrai状态失败'
    }, { status: 500 })
  }
}
