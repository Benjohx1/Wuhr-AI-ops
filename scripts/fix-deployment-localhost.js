#!/usr/bin/env node

/**
 * 修复部署为本地模式
 * 临时解决SSH连接问题导致的部署卡住
 */

const { getPrismaClient } = require('../lib/config/database.ts')

async function fixDeploymentToLocalhost() {
  console.log('🔧 修复部署为本地模式\n')

  console.log('📋 问题分析:')
  console.log('=' .repeat(50))
  console.log('根据您的反馈，部署在Git操作完成后卡住了。')
  console.log('这很可能是因为SSH连接远程主机时出现问题。')
  console.log('')
  console.log('常见原因:')
  console.log('- SSH连接超时')
  console.log('- 认证失败')
  console.log('- 网络不通')
  console.log('- 防火墙阻止')
  console.log('')

  console.log('🔧 临时解决方案:')
  console.log('=' .repeat(50))
  console.log('将部署模式改为本地执行，这样:')
  console.log('1. 不需要SSH连接远程主机')
  console.log('2. 部署脚本在本地执行')
  console.log('3. 可以验证部署流程是否正常')
  console.log('4. 适合开发和测试环境')
  console.log('')

  try {
    const prisma = await getPrismaClient()

    // 1. 检查当前的项目配置
    console.log('📋 1. 检查当前项目配置')
    console.log('=' .repeat(50))
    
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        serverId: true,
        server: {
          select: {
            id: true,
            name: true,
            hostname: true,
            ip: true
          }
        }
      }
    })

    if (projects.length === 0) {
      console.log('❌ 没有找到任何项目')
      return
    }

    console.log(`✅ 找到 ${projects.length} 个项目:`)
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name} (ID: ${project.id})`)
      if (project.server) {
        console.log(`   - 当前服务器: ${project.server.name} (${project.server.ip || project.server.hostname})`)
      } else {
        console.log(`   - 当前服务器: 本地 (localhost)`)
      }
    })
    console.log('')

    // 2. 修改项目配置为本地模式
    console.log('📋 2. 修改为本地部署模式')
    console.log('=' .repeat(50))

    for (const project of projects) {
      if (project.serverId) {
        console.log(`🔧 修改项目 "${project.name}" 为本地部署...`)
        
        await prisma.project.update({
          where: { id: project.id },
          data: { serverId: null }
        })
        
        console.log(`   ✅ 项目 "${project.name}" 已设置为本地部署`)
      } else {
        console.log(`   ✅ 项目 "${project.name}" 已经是本地部署模式`)
      }
    }
    console.log('')

    // 3. 验证修改结果
    console.log('📋 3. 验证修改结果')
    console.log('=' .repeat(50))
    
    const updatedProjects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        serverId: true
      }
    })

    updatedProjects.forEach((project, index) => {
      const mode = project.serverId ? '远程部署' : '本地部署'
      console.log(`${index + 1}. ${project.name}: ${mode}`)
    })
    console.log('')

    console.log('✅ 修改完成!')
    console.log('')

  } catch (error) {
    console.error('❌ 修改过程中发生错误:', error.message)
    return
  }

  console.log('📋 本地部署模式说明')
  console.log('=' .repeat(50))
  console.log('现在部署流程将:')
  console.log('1. 📥 在本地拉取代码')
  console.log('2. 🔧 在本地执行构建脚本')
  console.log('3. 🚀 在本地执行部署脚本')
  console.log('4. ✅ 完成部署')
  console.log('')
  console.log('注意事项:')
  console.log('- 部署脚本会在运行部署系统的机器上执行')
  console.log('- 适合开发环境和测试')
  console.log('- 生产环境建议修复SSH连接后使用远程部署')
  console.log('')

  console.log('🧪 测试建议')
  console.log('=' .repeat(50))
  console.log('1. 重新运行部署任务')
  console.log('2. 观察是否能看到完整的部署流程')
  console.log('3. 确认部署脚本在本地正确执行')
  console.log('')
  console.log('预期的日志输出:')
  console.log('```')
  console.log('🚀 开始完整部署流程...')
  console.log('📁 准备工作目录')
  console.log('📥 开始拉取代码...')
  console.log('✅ 代码拉取完成')
  console.log('📋 检查部署配置...')
  console.log('🎯 目标主机: localhost')
  console.log('💻 检测到本地主机，直接执行部署脚本')
  console.log('🔧 开始执行部署脚本...')
  console.log('✅ 部署脚本执行完成')
  console.log('🎉 完整部署流程成功完成')
  console.log('```')
  console.log('')

  console.log('🔄 恢复远程部署')
  console.log('=' .repeat(50))
  console.log('当SSH连接问题解决后，可以:')
  console.log('1. 修复SSH连接问题')
  console.log('2. 在项目管理中重新设置远程服务器')
  console.log('3. 或者运行恢复脚本:')
  console.log('   node scripts/restore-remote-deployment.js')
  console.log('')

  console.log('🔍 SSH问题诊断')
  console.log('=' .repeat(50))
  console.log('如果要解决SSH连接问题，可以运行:')
  console.log('node scripts/diagnose-ssh-issue.js')
  console.log('')
  console.log('手动测试SSH连接:')
  console.log('ssh -o ConnectTimeout=5 user@your-host "echo test"')
  console.log('')

  console.log('✅ 本地部署模式设置完成!')
  console.log('')
  console.log('🚀 现在可以重新运行部署任务了！')
}

// 如果直接运行此脚本
if (require.main === module) {
  fixDeploymentToLocalhost().catch(console.error)
}

module.exports = { fixDeploymentToLocalhost }
