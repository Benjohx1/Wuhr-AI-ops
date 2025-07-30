const { PrismaClient } = require('../lib/generated/prisma');
const bcrypt = require('bcryptjs');

// 设置环境变量
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://wuhr_admin:wuhr_secure_password_2024@localhost:5432/wuhr_ai_ops?schema=public";
process.env.DIRECT_URL = process.env.DIRECT_URL || "postgresql://wuhr_admin:wuhr_secure_password_2024@localhost:5432/wuhr_ai_ops?schema=public";

const prisma = new PrismaClient();

async function initSuperAdmin() {
  try {
    console.log('🚀 开始初始化超级管理员...');

    const superAdminEmail = 'admin@wuhr.ai';
    const superAdminPassword = 'Admin123!'; // 超级管理员密码

    // 检查是否已存在超级管理员
    const existingAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail }
    });

    if (existingAdmin) {
      console.log('✅ 超级管理员已存在:', superAdminEmail);
      
      // 确保超级管理员拥有所有权限
      const allPermissions = ['*']; // 所有权限

      // 更新超级管理员权限和密码
      const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
      
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: hashedPassword, // 确保密码是正确的
          role: 'admin',
          permissions: allPermissions,
          isActive: true,
          approvalStatus: 'approved'
        }
      });

      console.log('✅ 超级管理员权限和密码已更新');
      return;
    }

    // 创建超级管理员
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);

    const superAdmin = await prisma.user.create({
      data: {
        username: 'admin',
        email: superAdminEmail,
        password: hashedPassword,
        realName: '超级管理员',
        role: 'admin',
        permissions: ['*'], // 所有权限
        isActive: true,
        approvalStatus: 'approved',
        approvedBy: 'system',
        approvedAt: new Date()
      }
    });

    console.log('✅ 超级管理员创建成功!');
    console.log('📧 邮箱:', superAdminEmail);
    console.log('🔑 密码:', superAdminPassword);

    // 删除其他管理员账户
    console.log('🗑️  正在删除其他管理员账户...');
    
    const otherAdmins = await prisma.user.findMany({
      where: {
        role: 'admin',
        id: { not: superAdmin.id },
        email: { not: 'admin@wuhr.ai' }
      }
    });

    if (otherAdmins.length > 0) {
      const deleteResult = await prisma.user.deleteMany({
        where: {
          role: 'admin',
          id: { not: superAdmin.id },
          email: { not: 'admin@wuhr.ai' }
        }
      });

      console.log(`✅ 已删除 ${deleteResult.count} 个其他管理员账户`);
      console.log('删除的账户:', otherAdmins.map(admin => `${admin.username} (${admin.email})`).join(', '));
    } else {
      console.log('✅ 没有找到其他管理员账户需要删除');
    }

  } catch (error) {
    console.error('❌ 初始化超级管理员失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 删除其他管理员的功能（仅限超级管理员）
async function deleteOtherAdmins(currentUserId, currentUserEmail) {
  try {
    // 验证当前用户是否为超级管理员
    if (currentUserEmail !== 'admin@wuhr.ai') {
      throw new Error('只有超级管理员可以执行此操作');
    }

    console.log('🗑️  开始删除其他管理员账户...');

    // 查找所有其他管理员账户（除了超级管理员）
    const otherAdmins = await prisma.user.findMany({
      where: {
        role: 'admin',
        id: { not: currentUserId },
        email: { not: 'admin@wuhr.ai' }
      }
    });

    if (otherAdmins.length === 0) {
      console.log('✅ 没有找到其他管理员账户');
      return { success: true, deletedCount: 0, message: '没有找到其他管理员账户' };
    }

    // 删除其他管理员账户
    const deleteResult = await prisma.user.deleteMany({
      where: {
        role: 'admin',
        id: { not: currentUserId },
        email: { not: 'admin@wuhr.ai' }
      }
    });

    console.log(`✅ 已删除 ${deleteResult.count} 个其他管理员账户`);
    console.log('删除的账户:', otherAdmins.map(admin => `${admin.username} (${admin.email})`).join(', '));

    return {
      success: true,
      deletedCount: deleteResult.count,
      deletedAdmins: otherAdmins.map(admin => ({
        username: admin.username,
        email: admin.email
      })),
      message: `成功删除 ${deleteResult.count} 个其他管理员账户`
    };

  } catch (error) {
    console.error('❌ 删除其他管理员失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initSuperAdmin()
    .then(() => {
      console.log('🎉 超级管理员初始化完成!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 初始化失败:', error);
      process.exit(1);
    });
}

module.exports = { initSuperAdmin, deleteOtherAdmins };
