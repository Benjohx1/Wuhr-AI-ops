#!/usr/bin/env node

/**
 * 设置本地部署测试环境
 */

const { getPrismaClient } = require('../lib/config/database')

async function setupLocalDeployment() {
  console.log('🚀 设置本地部署测试环境...')
  
  try {
    const prisma = await getPrismaClient()
    
    // 1. 检查是否已有本地主机配置
    console.log('\n📋 步骤1: 检查本地主机配置')
    
    let localServer = await prisma.server.findFirst({
      where: {
        OR: [
          { hostname: 'localhost' },
          { ip: '127.0.0.1' },
          { name: '本地主机' }
        ]
      }
    })
    
    if (localServer) {
      console.log('✅ 找到现有的本地主机配置:')
      console.log(`   ID: ${localServer.id}`)
      console.log(`   名称: ${localServer.name}`)
      console.log(`   地址: ${localServer.hostname || localServer.ip}:${localServer.port}`)
      console.log(`   状态: ${localServer.isActive ? '活跃' : '停用'}`)
    } else {
      console.log('⚠️ 没有找到本地主机配置，创建新的配置...')
      
      // 获取当前用户
      const users = await prisma.user.findMany({
        where: { role: 'admin' },
        take: 1
      })
      
      if (users.length === 0) {
        console.log('❌ 没有找到管理员用户，无法创建主机配置')
        return
      }
      
      const adminUser = users[0]
      
      // 创建本地主机配置
      localServer = await prisma.server.create({
        data: {
          name: '本地主机',
          hostname: 'localhost',
          ip: '127.0.0.1',
          port: 22,
          authType: 'local',
          username: process.env.USER || 'deploy',
          description: '本地部署测试主机',
          isActive: true,
          userId: adminUser.id,
          datacenter: 'local'
        }
      })
      
      console.log('✅ 本地主机配置创建成功:')
      console.log(`   ID: ${localServer.id}`)
      console.log(`   名称: ${localServer.name}`)
      console.log(`   地址: ${localServer.hostname}:${localServer.port}`)
    }
    
    // 2. 检查测试项目
    console.log('\n📋 步骤2: 检查测试项目')
    
    let testProject = await prisma.cICDProject.findFirst({
      where: {
        name: '本地测试项目'
      }
    })
    
    if (testProject) {
      console.log('✅ 找到现有的测试项目:')
      console.log(`   ID: ${testProject.id}`)
      console.log(`   名称: ${testProject.name}`)
      console.log(`   仓库: ${testProject.repositoryUrl || '未配置'}`)
    } else {
      console.log('⚠️ 没有找到测试项目，创建新的项目...')
      
      const users = await prisma.user.findMany({
        where: { role: 'admin' },
        take: 1
      })
      
      if (users.length === 0) {
        console.log('❌ 没有找到管理员用户，无法创建项目')
        return
      }
      
      const adminUser = users[0]
      
      // 创建测试项目
      testProject = await prisma.cICDProject.create({
        data: {
          name: '本地测试项目',
          description: '用于本地部署测试的示例项目',
          repositoryUrl: 'https://github.com/vercel/next.js.git',
          branch: 'main',
          buildScript: 'echo "开始构建..." && echo "构建完成"',
          deployScript: 'echo "开始部署..." && echo "部署到本地环境" && echo "部署完成"',
          serverId: localServer.id,
          isActive: true,
          userId: adminUser.id
        }
      })
      
      console.log('✅ 测试项目创建成功:')
      console.log(`   ID: ${testProject.id}`)
      console.log(`   名称: ${testProject.name}`)
      console.log(`   目标主机: ${localServer.name}`)
    }
    
    // 3. 创建测试部署任务
    console.log('\n📋 步骤3: 创建测试部署任务')
    
    const users = await prisma.user.findMany({
      where: { role: 'admin' },
      take: 1
    })
    
    if (users.length === 0) {
      console.log('❌ 没有找到管理员用户，无法创建部署任务')
      return
    }
    
    const adminUser = users[0]
    
    // 检查是否已有测试部署任务
    const existingDeployment = await prisma.deployment.findFirst({
      where: {
        projectId: testProject.id,
        name: '本地测试部署'
      }
    })
    
    if (existingDeployment) {
      console.log('✅ 找到现有的测试部署任务:')
      console.log(`   ID: ${existingDeployment.id}`)
      console.log(`   名称: ${existingDeployment.name}`)
      console.log(`   状态: ${existingDeployment.status}`)
    } else {
      const testDeployment = await prisma.deployment.create({
        data: {
          projectId: testProject.id,
          name: '本地测试部署',
          description: '本地环境部署测试',
          environment: 'dev',
          version: '1.0.0',
          status: 'approved',
          deployScript: 'echo "执行本地部署脚本..." && echo "部署成功完成"',
          userId: adminUser.id
        }
      })
      
      console.log('✅ 测试部署任务创建成功:')
      console.log(`   ID: ${testDeployment.id}`)
      console.log(`   名称: ${testDeployment.name}`)
      console.log(`   状态: ${testDeployment.status}`)
    }
    
    // 4. 提供使用指南
    console.log('\n📋 步骤4: 使用指南')
    
    console.log('\n🎯 本地部署测试环境已准备就绪！')
    
    console.log('\n🚀 测试步骤:')
    console.log('1. 访问部署管理页面: http://localhost:3000/cicd/deployments')
    console.log('2. 找到"本地测试部署"任务')
    console.log('3. 点击"开始部署"按钮')
    console.log('4. 观察部署过程和状态变化')
    console.log('5. 查看部署日志和结果')
    
    console.log('\n🔧 配置信息:')
    console.log(`- 本地主机ID: ${localServer.id}`)
    console.log(`- 测试项目ID: ${testProject.id}`)
    console.log(`- 主机地址: ${localServer.hostname}:${localServer.port}`)
    console.log(`- 认证方式: ${localServer.authType}`)
    
    console.log('\n💡 注意事项:')
    console.log('- 本地部署不需要SSH认证')
    console.log('- 构建和部署脚本都是示例脚本')
    console.log('- 可以修改脚本内容进行更复杂的测试')
    console.log('- 部署日志会显示详细的执行过程')
    
    console.log('\n🔍 故障排查:')
    console.log('如果部署失败，请检查:')
    console.log('- 项目配置是否正确')
    console.log('- 构建和部署脚本是否有效')
    console.log('- 系统权限是否足够')
    console.log('- 查看详细的错误日志')
    
    console.log('\n✅ 本地部署环境设置完成')
    
  } catch (error) {
    console.error('❌ 设置过程中发生错误:', error.message)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  setupLocalDeployment()
}

module.exports = { setupLocalDeployment }
