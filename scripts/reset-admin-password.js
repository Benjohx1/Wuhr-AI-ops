const { PrismaClient } = require('../lib/generated/prisma')
const bcrypt = require('bcryptjs')

async function resetAdminPassword() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 重置管理员密码...')
    
    // 新密码
    const newPassword = 'Admin123!'
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // 更新管理员密码
    const result = await prisma.user.updateMany({
      where: {
        role: 'admin'
      },
      data: {
        password: hashedPassword
      }
    })
    
    console.log(`✅ 已更新 ${result.count} 个管理员账户的密码`)
    console.log(`🔑 新密码: ${newPassword}`)
    
    // 显示管理员账户信息
    const admins = await prisma.user.findMany({
      where: {
        role: 'admin'
      },
      select: {
        username: true,
        email: true,
        role: true,
        isActive: true,
        approvalStatus: true
      }
    })
    
    console.log('\n👑 管理员账户:')
    admins.forEach(admin => {
      console.log(`  - ${admin.username} (${admin.email}) - ${admin.isActive ? '激活' : '未激活'} - ${admin.approvalStatus}`)
    })
    
  } catch (error) {
    console.error('❌ 重置密码失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
