const { PrismaClient } = require('./lib/generated/prisma');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // 检查是否已有管理员用户
    const existingAdmin = await prisma.user.findFirst({
      where: { username: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('✅ 管理员用户已存在');
      return;
    }
    
    // 创建管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@wuhrai.com',
        password: hashedPassword,
        realName: '系统管理员',
        role: 'admin',
        permissions: [
          'users:read',
          'users:write',
          'users:delete',
          'servers:read',
          'servers:write',
          'servers:delete',
          'cicd:read',
          'cicd:write',
          'cicd:delete',
          'config:read',
          'config:write',
          'config:delete',
          'admin:all'
        ],
        isActive: true,
        approvalStatus: 'approved'
      }
    });
    
    console.log('✅ 管理员用户创建成功:', {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    });
    
  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
