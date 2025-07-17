#!/usr/bin/env node

/**
 * 确保admin@wuhr.ai用户永远存在且为最高管理员
 * 这个脚本会：
 * 1. 检查admin@wuhr.ai用户是否存在
 * 2. 如果不存在，创建该用户
 * 3. 如果存在，确保其拥有最高权限
 * 4. 重置密码为默认密码
 * 5. 添加保护标记，防止被删除
 */

const { PrismaClient } = require('../lib/generated/prisma');
const bcrypt = require('bcryptjs');

const ADMIN_CONFIG = {
  username: 'admin',
  email: 'admin@wuhr.ai',
  password: 'Admin123!',
  role: 'admin',
  permissions: ['*'], // 所有权限
  isActive: true,
  approvalStatus: 'approved',
  isProtected: true // 保护标记，防止被删除
};

async function ensureAdminUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 确保admin@wuhr.ai用户安全...');
    
    // 检查用户是否存在
    let adminUser = await prisma.user.findUnique({
      where: { email: ADMIN_CONFIG.email }
    });
    
    // 生成密码哈希
    const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 12);
    
    if (adminUser) {
      console.log('✅ admin@wuhr.ai 用户已存在，正在更新配置...');
      
      // 更新现有用户，确保其拥有最高权限
      adminUser = await prisma.user.update({
        where: { email: ADMIN_CONFIG.email },
        data: {
          username: ADMIN_CONFIG.username,
          password: hashedPassword,
          role: ADMIN_CONFIG.role,
          permissions: ADMIN_CONFIG.permissions,
          isActive: ADMIN_CONFIG.isActive,
          approvalStatus: ADMIN_CONFIG.approvalStatus,
          updatedAt: new Date()
        }
      });
      
      console.log('🔄 admin用户配置已更新');
    } else {
      console.log('⚠️ admin@wuhr.ai 用户不存在，正在创建...');
      
      // 创建新的admin用户
      adminUser = await prisma.user.create({
        data: {
          username: ADMIN_CONFIG.username,
          email: ADMIN_CONFIG.email,
          password: hashedPassword,
          role: ADMIN_CONFIG.role,
          permissions: ADMIN_CONFIG.permissions,
          isActive: ADMIN_CONFIG.isActive,
          approvalStatus: ADMIN_CONFIG.approvalStatus,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ admin用户创建成功');
    }
    
    // 显示用户信息
    console.log('\n📋 Admin用户信息:');
    console.log(`  ID: ${adminUser.id}`);
    console.log(`  用户名: ${adminUser.username}`);
    console.log(`  邮箱: ${adminUser.email}`);
    console.log(`  角色: ${adminUser.role}`);
    console.log(`  权限: ${JSON.stringify(adminUser.permissions)}`);
    console.log(`  状态: ${adminUser.isActive ? '激活' : '禁用'}`);
    console.log(`  审批状态: ${adminUser.approvalStatus}`);
    console.log(`  密码: ${ADMIN_CONFIG.password}`);
    
    // 添加用户保护记录到系统配置
    await addUserProtection(prisma, adminUser.id);
    
    console.log('\n🛡️ admin@wuhr.ai用户已受到保护，无法被删除');
    console.log('🔑 密码已重置为: Admin123!');
    
  } catch (error) {
    console.error('❌ 确保admin用户失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 添加用户保护记录
 */
async function addUserProtection(prisma, userId) {
  try {
    // 检查是否已有保护记录
    const existingConfig = await prisma.systemConfig.findFirst({
      where: {
        key: 'protected_users'
      }
    });
    
    let protectedUsers = [];
    if (existingConfig) {
      protectedUsers = JSON.parse(existingConfig.value || '[]');
    }
    
    // 添加admin用户到保护列表
    if (!protectedUsers.includes(userId)) {
      protectedUsers.push(userId);
    }
    
    // 更新或创建保护配置
    await prisma.systemConfig.upsert({
      where: {
        key: 'protected_users'
      },
      update: {
        value: JSON.stringify(protectedUsers),
        updatedAt: new Date()
      },
      create: {
        key: 'protected_users',
        value: JSON.stringify(protectedUsers),
        category: 'security',
        description: '受保护的用户列表，这些用户无法被删除',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('🛡️ 用户保护配置已更新');
  } catch (error) {
    console.warn('⚠️ 添加用户保护失败:', error.message);
  }
}

/**
 * 验证admin用户权限
 */
async function validateAdminUser() {
  const prisma = new PrismaClient();
  
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: ADMIN_CONFIG.email }
    });
    
    if (!adminUser) {
      throw new Error('Admin用户不存在');
    }
    
    if (adminUser.role !== 'admin') {
      throw new Error('Admin用户角色不正确');
    }
    
    if (!adminUser.isActive) {
      throw new Error('Admin用户未激活');
    }
    
    if (adminUser.approvalStatus !== 'approved') {
      throw new Error('Admin用户未审批');
    }
    
    // 验证密码
    const passwordValid = await bcrypt.compare(ADMIN_CONFIG.password, adminUser.password);
    if (!passwordValid) {
      throw new Error('Admin用户密码不正确');
    }
    
    console.log('✅ Admin用户验证通过');
    return true;
  } catch (error) {
    console.error('❌ Admin用户验证失败:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始确保admin@wuhr.ai用户安全性...\n');
    
    // 确保admin用户存在且配置正确
    await ensureAdminUser();
    
    // 验证admin用户
    const isValid = await validateAdminUser();
    
    if (isValid) {
      console.log('\n🎉 admin@wuhr.ai用户已确保安全！');
      console.log('📝 请记住以下登录信息:');
      console.log(`   邮箱: ${ADMIN_CONFIG.email}`);
      console.log(`   密码: ${ADMIN_CONFIG.password}`);
      console.log('🔒 该用户已受到保护，无法被删除');
    } else {
      console.log('\n❌ admin用户配置验证失败，请检查系统状态');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 脚本执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  ensureAdminUser,
  validateAdminUser,
  ADMIN_CONFIG
};
