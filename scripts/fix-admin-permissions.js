#!/usr/bin/env node

const { PrismaClient } = require('../lib/generated/prisma')

async function fixAdminPermissions() {
  console.log('🚀 开始修复管理员权限...')

  const prisma = new PrismaClient()

  try {
    console.log('🔗 连接数据库...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功')

    console.log('🔍 检查用户权限...')
    
    // 查找所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true
      }
    })
    
    console.log('📋 当前用户列表:')
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - 角色: ${user.role} - 激活: ${user.isActive}`)
    })
    
    // 查找可能的管理员用户
    const potentialAdmins = users.filter(user => 
      user.username === 'admin' || 
      user.email?.includes('admin') || 
      user.username === 'wuhr' ||
      user.email?.includes('wuhr')
    )
    
    if (potentialAdmins.length === 0) {
      console.log('❌ 未找到管理员用户')
      return
    }
    
    console.log('\n🔧 修复管理员权限...')
    
    for (const user of potentialAdmins) {
      console.log(`\n👤 处理用户: ${user.username} (${user.email})`)
      
      // 更新为管理员角色和权限
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'admin',
          permissions: [
            'users:read', 'users:write', 'users:delete',
            'cicd:all', 'servers:all', 'config:all'
          ],
          isActive: true
        }
      })
      
      console.log(`✅ 用户 ${user.username} 已设置为管理员`)
      console.log(`   - 角色: ${updatedUser.role}`)
      console.log(`   - 权限: ${updatedUser.permissions.join(', ')}`)
    }
    
    // 检查Jenkins配置
    console.log('\n🔍 检查Jenkins配置...')
    const jenkinsConfigs = await prisma.jenkinsConfig.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        user: {
          select: {
            username: true,
            role: true
          }
        }
      }
    })
    
    console.log('📋 Jenkins配置列表:')
    jenkinsConfigs.forEach(config => {
      console.log(`  - ${config.name} (ID: ${config.id})`)
      console.log(`    创建者: ${config.user?.username || '未知'} (角色: ${config.user?.role || '未知'})`)
    })
    
    console.log('\n✅ 权限修复完成！')
    
  } catch (error) {
    console.error('❌ 修复权限时出错:', error)
    console.error('错误详情:', error.message)
    console.error('错误堆栈:', error.stack)
  } finally {
    console.log('🔌 断开数据库连接...')
    await prisma.$disconnect()
    console.log('✅ 脚本执行完成')
  }
}

// 运行脚本
fixAdminPermissions()
