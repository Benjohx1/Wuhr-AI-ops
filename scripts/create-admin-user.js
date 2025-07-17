#!/usr/bin/env node

const { PrismaClient } = require('../lib/generated/prisma');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  const prisma = new PrismaClient();
  try {
    console.log('🔧 创建管理员用户 admin@wuhr.ai...');
    
    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@wuhr.ai' },
          { username: 'admin@wuhr.ai' }
        ]
      }
    });
    
    if (existingUser) {
      console.log('⚠️ 用户已存在，更新密码...');
      
      // 加密新密码
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      // 更新用户
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          isActive: true,
          approvalStatus: 'approved',
          role: 'admin'
        }
      });
      
      console.log('✅ 用户密码已更新:', {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        approvalStatus: updatedUser.approvalStatus
      });
    } else {
      console.log('➕ 创建新用户...');
      
      // 加密密码
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      // 创建新用户
      const newUser = await prisma.user.create({
        data: {
          username: 'admin@wuhr.ai',
          email: 'admin@wuhr.ai',
          password: hashedPassword,
          realName: '系统管理员',
          role: 'admin',
          isActive: true,
          approvalStatus: 'approved'
        }
      });
      
      console.log('✅ 管理员用户创建成功:', {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        approvalStatus: newUser.approvalStatus
      });
    }
    
    // 验证密码
    console.log('🔐 验证密码...');
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@wuhr.ai' },
          { username: 'admin@wuhr.ai' }
        ]
      }
    });
    
    if (user && user.password) {
      const isValid = await bcrypt.compare('Admin123!', user.password);
      console.log('✅ 密码验证结果:', isValid ? '成功' : '失败');
      
      if (isValid) {
        console.log('🎉 管理员用户设置完成！');
        console.log('📝 登录信息:');
        console.log('   用户名: admin@wuhr.ai');
        console.log('   密码: Admin123!');
        console.log('   角色: admin');
      }
    }
    
  } catch (error) {
    console.error('❌ 创建用户失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
