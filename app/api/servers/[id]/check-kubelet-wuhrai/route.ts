import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../../../lib/config/database'
import { executeSSHCommand } from '../../../../../lib/ssh/client'
import * as fs from 'fs'
import * as path from 'path'

// 智能网络检测函数
async function detectNetworkEnvironment(sshConfig: any): Promise<{
  isOverseas: boolean
  networkType: 'domestic' | 'overseas' | 'unknown'
}> {
  try {
    console.log('🌐 开始检测网络环境...')

    // 执行ping google.com命令检测网络环境
    const pingResult = await executeSSHCommand(sshConfig, 'ping -c 3 google.com')

    if (pingResult.success && pingResult.code === 0) {
      console.log('✅ 检测到国外网络环境（可访问Google）')
      return {
        isOverseas: true,
        networkType: 'overseas'
      }
    } else {
      console.log('🏠 检测到国内网络环境（无法访问Google）')
      return {
        isOverseas: false,
        networkType: 'domestic'
      }
    }
  } catch (error) {
    console.log('⚠️ 网络检测失败，默认使用国内环境')
    return {
      isOverseas: false,
      networkType: 'unknown'
    }
  }
}

// 自动下载并安装kubelet-wuhrai到远程主机
async function downloadAndInstallKubeletWuhrai(sshConfig: any): Promise<{
  success: boolean
  error?: string
  version?: string
  method?: string
  networkType?: string
}> {
  try {
    console.log('🚀 开始自动下载并安装kubelet-wuhrai...')

    // 首先检测网络环境
    const networkInfo = await detectNetworkEnvironment(sshConfig)
    console.log(`🌐 网络环境检测结果: ${networkInfo.networkType}`)

    let downloadResult: any
    let installMethod: string

    if (networkInfo.isOverseas) {
      // 国外网络环境，使用GitHub安装
      console.log('📥 使用GitHub源安装kubelet-wuhrai...')
      const githubDownloadCommand = `
        # GitHub安装命令
        curl -fsSL -o /tmp/kubelet-wuhrai https://github.com/st-lzh/kubelet-wuhrai/releases/download/v1.0.0/kubelet-wuhrai && \
        chmod +x /tmp/kubelet-wuhrai && \
        sudo mv /tmp/kubelet-wuhrai /usr/local/bin/kubelet-wuhrai && \
        echo "GitHub installation completed" && \
        kubelet-wuhrai --version 2>/dev/null || echo "version_check_failed"
      `

      downloadResult = await executeSSHCommand(sshConfig, githubDownloadCommand)
      installMethod = 'github'

      if (downloadResult.success && downloadResult.stdout.includes('GitHub installation completed')) {
        console.log('✅ GitHub安装成功')
        const versionMatch = downloadResult.stdout.match(/kubelet-wuhrai version (\S+)/)
        return {
          success: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          method: installMethod,
          networkType: networkInfo.networkType
        }
      }
    } else {
      // 国内网络环境，使用国内下载源
      console.log('📥 使用国内源下载kubelet-wuhrai...')
      const domesticDownloadCommand = `
        # 国内下载命令
        curl -fsSL -o /tmp/kubelet-wuhrai https://www.wuhrai.com/download/kubelet-wuhrai && \
        chmod +x /tmp/kubelet-wuhrai && \
        sudo mv /tmp/kubelet-wuhrai /usr/local/bin/kubelet-wuhrai && \
        echo "Domestic download completed" && \
        kubelet-wuhrai --version 2>/dev/null || echo "version_check_failed"
      `

      downloadResult = await executeSSHCommand(sshConfig, domesticDownloadCommand)
      installMethod = 'domestic'

      if (downloadResult.success && downloadResult.stdout.includes('Domestic download completed')) {
        console.log('✅ 国内下载安装成功')
        const versionMatch = downloadResult.stdout.match(/kubelet-wuhrai version (\S+)/)
        return {
          success: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          method: installMethod,
          networkType: networkInfo.networkType
        }
      }
    }

    // 如果首选方法失败，尝试备用方法
    console.log('📥 首选安装方法失败，尝试备用方法...')
    if (networkInfo.isOverseas) {
      // 如果是国外环境但GitHub失败，尝试国内源
      const domesticDownloadCommand = `
        curl -fsSL -o /tmp/kubelet-wuhrai https://www.wuhrai.com/download/kubelet-wuhrai && \
        chmod +x /tmp/kubelet-wuhrai && \
        sudo mv /tmp/kubelet-wuhrai /usr/local/bin/kubelet-wuhrai && \
        echo "Domestic download completed" && \
        kubelet-wuhrai --version 2>/dev/null || echo "version_check_failed"
      `
      downloadResult = await executeSSHCommand(sshConfig, domesticDownloadCommand)
      installMethod = 'domestic-fallback'
    } else {
      // 如果是国内环境但国内源失败，尝试GitHub
      const githubDownloadCommand = `
        curl -fsSL -o /tmp/kubelet-wuhrai https://github.com/st-lzh/kubelet-wuhrai/releases/download/v1.0.0/kubelet-wuhrai && \
        chmod +x /tmp/kubelet-wuhrai && \
        sudo mv /tmp/kubelet-wuhrai /usr/local/bin/kubelet-wuhrai && \
        echo "GitHub installation completed" && \
        kubelet-wuhrai --version 2>/dev/null || echo "version_check_failed"
      `
      downloadResult = await executeSSHCommand(sshConfig, githubDownloadCommand)
      installMethod = 'github-fallback'
    }

    // 检查备用方法是否成功
    if (downloadResult.success && (
      downloadResult.stdout.includes('GitHub installation completed') ||
      downloadResult.stdout.includes('Domestic download completed')
    )) {
      console.log('✅ 备用方法安装成功')
      const versionMatch = downloadResult.stdout.match(/kubelet-wuhrai version (\S+)/)
      return {
        success: true,
        version: versionMatch ? versionMatch[1] : 'unknown',
        method: installMethod,
        networkType: networkInfo.networkType
      }
    }

    console.log('❌ 所有安装方式都失败了')
    return {
      success: false,
      error: `安装失败: ${downloadResult.stderr || '未知错误'}`,
      networkType: networkInfo.networkType
    }

  } catch (error) {
    console.error('❌ 自动下载安装过程中发生错误:', error)
    return {
      success: false,
      error: `下载安装异常: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}



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
      // 检查kubelet-wuhrai是否安装 - 使用更严格的检测逻辑
      console.log('🔍 检查kubelet-wuhrai是否安装...')
      const checkResult = await executeSSHCommand(sshConfig, 'which kubelet-wuhrai')

      console.log('📊 kubelet-wuhrai检测结果:', {
        success: checkResult.success,
        code: checkResult.code,
        stdout: checkResult.stdout,
        stderr: checkResult.stderr
      })

      // 检查命令是否存在：只有退出码为0且输出包含kubelet-wuhrai路径才算安装
      if (checkResult.code === 0 && checkResult.stdout.trim() && checkResult.stdout.includes('kubelet-wuhrai')) {
        kubeletStatus = 'installed'
        const kubeletPath = checkResult.stdout.trim()
        console.log('✅ kubelet-wuhrai已安装:', kubeletPath)
        recommendations.push({
          type: 'success',
          message: `kubelet-wuhrai命令已找到: ${kubeletPath}`
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
        console.log('❌ kubelet-wuhrai未安装，开始自动下载安装流程')
        recommendations.push({
          type: 'error',
          message: 'kubelet-wuhrai命令未找到，正在尝试自动下载安装...'
        })

        // 尝试自动下载并安装kubelet-wuhrai
        try {
          const installResult = await downloadAndInstallKubeletWuhrai(sshConfig)
          if (installResult.success) {
            kubeletStatus = 'auto_installed'
            const downloadMethod = installResult.method === 'domestic' ? '国内源' : 'GitHub源'
            recommendations.push({
              type: 'success',
              message: `✅ 已通过${downloadMethod}自动下载并安装kubelet-wuhrai到远程主机`
            })
            if (installResult.version) {
              kubeletVersion = installResult.version
              recommendations.push({
                type: 'info',
                message: `安装版本: ${installResult.version}`
              })
            }
          } else {
            recommendations.push({
              type: 'warning',
              message: `自动下载安装失败: ${installResult.error}`
            })
            recommendations.push({
              type: 'info',
              message: '您可以手动安装kubelet-wuhrai：curl -fsSL -o /tmp/kubelet-wuhrai https://github.com/st-lzh/kubelet-wuhrai/releases/download/v1.0.0/kubelet-wuhrai && chmod +x /tmp/kubelet-wuhrai && sudo mv /tmp/kubelet-wuhrai /usr/local/bin/kubelet-wuhrai'
            })
            recommendations.push({
              type: 'info',
              message: '请手动安装kubelet-wuhrai或检查网络连接'
            })
          }
        } catch (deployError) {
          recommendations.push({
            type: 'warning',
            message: '自动部署过程中出现异常，请手动安装'
          })
        }
      }

    } catch (error) {
      console.error('SSH连接或命令执行失败:', error)
      recommendations.push({
        type: 'error',
        message: `SSH连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      })
    }

    // 添加通用建议
    if (kubeletStatus === 'installed' || kubeletStatus === 'auto_installed') {
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
