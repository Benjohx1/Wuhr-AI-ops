import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../../../lib/config/database'
import { executeSSHCommand } from '../../../../../lib/ssh/client'
import * as fs from 'fs'
import * as path from 'path'

// 自动部署kubelet-wuhrai到远程主机
async function deployKubeletWuhrai(sshConfig: any): Promise<{
  success: boolean
  error?: string
  version?: string
}> {
  try {
    console.log('🚀 开始自动部署kubelet-wuhrai...')

    // 检查本地kubelet-wuhrai文件是否存在
    const localKubeletPath = path.join(process.cwd(), 'kubelet-wuhrai')
    
    if (!fs.existsSync(localKubeletPath)) {
      console.log('❌ 本地kubelet-wuhrai文件不存在')
      return {
        success: false,
        error: '本地kubelet-wuhrai文件不存在，无法自动部署'
      }
    }

    console.log('✅ 找到本地kubelet-wuhrai文件')

    // 读取本地文件
    const kubeletContent = fs.readFileSync(localKubeletPath)
    const kubeletBase64 = kubeletContent.toString('base64')

    console.log('📤 开始传输文件到远程主机...')

    // 创建远程临时文件
    const remoteCommand = `
      echo "${kubeletBase64}" | base64 -d > /tmp/kubelet-wuhrai && \
      chmod +x /tmp/kubelet-wuhrai && \
      sudo mv /tmp/kubelet-wuhrai /usr/local/bin/kubelet-wuhrai && \
      echo "Deployment completed"
    `

    const deployResult = await executeSSHCommand(sshConfig, remoteCommand)

    if (!deployResult.success) {
      console.log('❌ 部署命令执行失败:', deployResult.stderr)
      return {
        success: false,
        error: `部署失败: ${deployResult.stderr || '未知错误'}`
      }
    }

    console.log('📋 验证部署结果...')

    // 验证部署是否成功
    const verifyResult = await executeSSHCommand(sshConfig, 'which kubelet-wuhrai && kubelet-wuhrai --version')
    
    if (verifyResult.success && verifyResult.stdout.includes('kubelet-wuhrai')) {
      console.log('✅ kubelet-wuhrai部署验证成功')
      
      // 提取版本信息
      const versionMatch = verifyResult.stdout.match(/version[:\s]+([^\n\r]+)/i)
      const version = versionMatch ? versionMatch[1].trim() : 'unknown'

      return {
        success: true,
        version: version
      }
    } else {
      console.log('❌ 部署验证失败')
      return {
        success: false,
        error: '部署完成但验证失败，可能需要手动配置环境变量'
      }
    }

  } catch (error) {
    console.error('❌ 自动部署过程中发生错误:', error)
    return {
      success: false,
      error: `部署异常: ${error instanceof Error ? error.message : '未知错误'}`
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
        
        // 尝试自动部署kubelet-wuhrai
        try {
          const deployResult = await deployKubeletWuhrai(sshConfig)
          if (deployResult.success) {
            kubeletStatus = 'auto_installed'
            recommendations.push({
              type: 'success',
              message: '✅ 已自动部署kubelet-wuhrai到远程主机'
            })
            if (deployResult.version) {
              recommendations.push({
                type: 'info',
                message: `版本信息: ${deployResult.version}`
              })
            }
          } else {
            recommendations.push({
              type: 'warning',
              message: `自动部署失败: ${deployResult.error}`
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
