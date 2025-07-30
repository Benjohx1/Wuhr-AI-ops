#!/usr/bin/env node

const { PrismaClient } = require('../lib/generated/prisma')
const bcrypt = require('bcryptjs')

async function ensureSuperAdmin() {
  console.log('🚀 确保超级管理员存在...')

  const prisma = new PrismaClient({
    log: ['error', 'warn']
  })
  
  try {
    console.log('🔗 连接数据库...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    const superAdminEmail = 'admin@wuhr.ai'
    const superAdminUsername = 'admin'
    const defaultPassword = 'admin123'
    
    // 检查超级管理员是否存在
    let superAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail }
    })
    
    if (!superAdmin) {
      console.log('🔧 创建超级管理员账户...')
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(defaultPassword, 12)
      
      // 创建超级管理员
      superAdmin = await prisma.user.create({
        data: {
          username: superAdminUsername,
          email: superAdminEmail,
          password: hashedPassword,
          role: 'admin',
          permissions: ['*'], // 所有权限
          isActive: true,
          approvalStatus: 'approved'
        }
      })
      
      console.log('✅ 超级管理员账户创建成功')
    } else {
      console.log('👤 超级管理员账户已存在，检查权限...')
      
      // 确保权限正确
      const updatedAdmin = await prisma.user.update({
        where: { email: superAdminEmail },
        data: {
          role: 'admin',
          permissions: ['*'], // 所有权限
          isActive: true,
          approvalStatus: 'approved'
        }
      })
      
      console.log('✅ 超级管理员权限已更新')
    }
    
    console.log('\n📋 超级管理员信息:')
    console.log(`  - 用户名: ${superAdmin.username}`)
    console.log(`  - 邮箱: ${superAdmin.email}`)
    console.log(`  - 角色: ${superAdmin.role}`)
    console.log(`  - 权限: ${superAdmin.permissions.join(', ')}`)
    console.log(`  - 状态: ${superAdmin.isActive ? '激活' : '未激活'}`)
    console.log(`  - 审批状态: ${superAdmin.approvalStatus}`)
    
    // 检查其他用户
    console.log('\n🔍 检查其他用户...')
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true
      }
    })
    
    console.log('📋 所有用户列表:')
    allUsers.forEach(user => {
      const isSuperAdmin = user.email === superAdminEmail
      console.log(`  ${isSuperAdmin ? '👑' : '👤'} ${user.username} (${user.email}) - 角色: ${user.role} - 状态: ${user.isActive ? '激活' : '未激活'}`)
    })
    
    console.log('\n✅ 超级管理员确保完成！')
    console.log(`\n🔑 登录信息:`)
    console.log(`   邮箱: ${superAdminEmail}`)
    console.log(`   密码: ${defaultPassword}`)
    console.log(`   注意: admin@wuhr.ai 是硬编码的超级管理员，拥有所有权限且不能被删除或修改权限`)
    
  } catch (error) {
    console.error('❌ 确保超级管理员时出错:', error)
    console.error('错误详情:', error.message)
    console.error('错误堆栈:', error.stack)
    process.exit(1)
  } finally {
    console.log('🔌 断开数据库连接...')
    await prisma.$disconnect()
    console.log('✅ 脚本执行完成')
  }
}

// 运行脚本
ensureSuperAdmin()
