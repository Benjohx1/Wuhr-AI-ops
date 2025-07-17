const { PrismaClient } = require('../lib/generated/prisma')

async function checkUsers() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 检查数据库中的用户...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        approvalStatus: true,
        isActive: true,
        createdAt: true
      }
    })
    
    console.log(`📊 找到 ${users.length} 个用户:`)
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - ${user.role} - ${user.approvalStatus} - ${user.isActive ? '激活' : '未激活'}`)
    })
    
    // 检查待审批用户
    const pendingUsers = users.filter(u => u.approvalStatus === 'pending')
    console.log(`\n⏳ 待审批用户: ${pendingUsers.length} 个`)
    
    // 检查激活用户
    const activeUsers = users.filter(u => u.isActive)
    console.log(`✅ 激活用户: ${activeUsers.length} 个`)
    
  } catch (error) {
    console.error('❌ 检查用户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
