const { PrismaClient } = require('../lib/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function initSuperAdmin() {
  try {
    console.log('🚀 开始初始化超级管理员...')

    const superAdminEmail = 'admin@wuhr.ai'
    const superAdminPassword = 'Admin123!' // 固定密码，不要修改

    // 检查是否已存在超级管理员
    const existingAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail }
    })

    if (existingAdmin) {
      console.log('✅ 超级管理员已存在:', superAdminEmail)
      
      // 确保超级管理员拥有所有权限
      const allPermissions = [
        // 用户管理权限
        'users:read', 'users:write', 'users:delete',
        'permissions:read', 'permissions:write', 'permissions:delete',
        
        // AI助手权限
        'ai:read', 'ai:write', 'ai:use',
        
        // 服务器管理权限
        'servers:read', 'servers:write', 'servers:delete',
        'servers:connect', 'servers:execute',
        
        // CI/CD权限
        'cicd:read', 'cicd:write', 'cicd:delete',
        'cicd:deploy', 'cicd:approve',
        
        // 配置管理权限
        'config:read', 'config:write', 'config:delete',
        
        // 监控权限
        'monitoring:read', 'monitoring:write',
        
        // 通知权限
        'notifications:read', 'notifications:write', 'notifications:delete',
        
        // 审批权限
        'approvals:read', 'approvals:write', 'approvals:approve',
        
        // 系统管理权限
        'system:admin', 'system:config', 'system:logs'
      ]

      // 更新超级管理员权限
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          role: 'admin',
          permissions: allPermissions,
          isActive: true,
          approvalStatus: 'approved'
        }
      })

      console.log('✅ 超级管理员权限已更新')
      return
    }

    // 创建超级管理员
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12)

    const superAdmin = await prisma.user.create({
      data: {
        username: 'admin',
        email: superAdminEmail,
        password: hashedPassword,
        realName: '超级管理员',
        role: 'admin',
        permissions: [
          // 用户管理权限
          'users:read', 'users:write', 'users:delete',
          'permissions:read', 'permissions:write', 'permissions:delete',
          
          // AI助手权限
          'ai:read', 'ai:write', 'ai:use',
          
          // 服务器管理权限
          'servers:read', 'servers:write', 'servers:delete',
          'servers:connect', 'servers:execute',
          
          // CI/CD权限
          'cicd:read', 'cicd:write', 'cicd:delete',
          'cicd:deploy', 'cicd:approve',
          
          // 配置管理权限
          'config:read', 'config:write', 'config:delete',
          
          // 监控权限
          'monitoring:read', 'monitoring:write',
          
          // 通知权限
          'notifications:read', 'notifications:write', 'notifications:delete',
          
          // 审批权限
          'approvals:read', 'approvals:write', 'approvals:approve',
          
          // 系统管理权限
          'system:admin', 'system:config', 'system:logs'
        ],
        isActive: true,
        approvalStatus: 'approved',
        approvedBy: 'system',
        approvedAt: new Date()
      }
    })

    console.log('✅ 超级管理员创建成功!')
    console.log('📧 邮箱:', superAdminEmail)
    console.log('🔑 密码:', superAdminPassword)
    console.log('⚠️  请首次登录后立即修改密码!')

  } catch (error) {
    console.error('❌ 初始化超级管理员失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initSuperAdmin()
    .then(() => {
      console.log('🎉 超级管理员初始化完成!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 初始化失败:', error)
      process.exit(1)
    })
}

module.exports = { initSuperAdmin }
