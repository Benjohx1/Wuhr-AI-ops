const { PrismaClient } = require('../lib/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🚀 开始创建管理员账户...')
    
    // 检查管理员是否已存在
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@wuhr.ai' }
    })
    
    if (existingAdmin) {
      console.log('✅ 管理员账户已存在')
      return
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash('Admin123!', 12)
    
    // 创建管理员用户
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@wuhr.ai',
        password: hashedPassword,
        role: 'admin',
        permissions: [
          'users:read',
          'users:write',
          'permissions:read',
          'permissions:write',
          'servers:read',
          'servers:write',
          'cicd:read',
          'cicd:write',
          'approvals:read',
          'approvals:write',
          'notifications:read',
          'notifications:write',
          'config:read',
          'config:write',
          'ai:read',
          'ai:write',
          'monitoring:read',
          'monitoring:write',
          'admin:all'
        ],
        isActive: true,
        approvalStatus: 'approved',
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log('✅ 管理员账户创建成功！')
    console.log('📧 邮箱:', admin.email)
    console.log('👤 用户名:', admin.username)
    console.log('🔑 密码: Admin123!')
    
  } catch (error) {
    console.error('❌ 创建管理员失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin() 