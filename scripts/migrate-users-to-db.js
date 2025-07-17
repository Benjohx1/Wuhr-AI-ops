#!/usr/bin/env node

/**
 * 将JSON文件中的用户数据迁移到Prisma数据库
 */

const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

/**
 * 读取JSON用户数据
 */
async function readUsersFromJson() {
  try {
    const usersFile = path.join(__dirname, '../data/users.json');
    const data = await fs.readFile(usersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ 读取用户JSON文件失败:', error.message);
    return [];
  }
}

/**
 * 迁移用户到数据库
 */
async function migrateUsers() {
  try {
    console.log('🚀 开始迁移用户数据到数据库...\n');
    
    // 读取JSON用户数据
    const jsonUsers = await readUsersFromJson();
    console.log(`📊 JSON文件中的用户数量: ${jsonUsers.length}`);
    
    if (jsonUsers.length === 0) {
      console.log('⚠️  没有找到用户数据，退出迁移');
      return;
    }
    
    // 检查数据库中现有用户
    const existingUsers = await prisma.user.findMany();
    console.log(`📊 数据库中现有用户数量: ${existingUsers.length}`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const user of jsonUsers) {
      try {
        // 检查用户是否已存在
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { username: user.username },
              { email: user.email }
            ]
          }
        });
        
        if (existingUser) {
          console.log(`⚠️  用户已存在，跳过: ${user.username} (${user.email})`);
          skippedCount++;
          continue;
        }
        
        // 创建新用户
        const newUser = await prisma.user.create({
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            password: user.password,
            role: user.role,
            permissions: user.permissions,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        });
        
        console.log(`✅ 迁移成功: ${newUser.username} (${newUser.email})`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ 迁移用户失败 ${user.username}:`, error.message);
      }
    }
    
    console.log('\n📊 迁移统计:');
    console.log(`✅ 成功迁移: ${migratedCount} 个用户`);
    console.log(`⚠️  跳过重复: ${skippedCount} 个用户`);
    console.log(`❌ 迁移失败: ${jsonUsers.length - migratedCount - skippedCount} 个用户`);
    
    // 验证迁移结果
    const finalUsers = await prisma.user.findMany();
    console.log(`\n🎯 数据库中最终用户数量: ${finalUsers.length}`);
    
    console.log('\n📋 数据库中的用户列表:');
    finalUsers.forEach(user => {
      console.log(`  👤 ${user.username} (${user.email}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('💥 迁移过程失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 清空数据库用户表
 */
async function clearUsers() {
  try {
    console.log('🗑️  清空数据库用户表...');
    const result = await prisma.user.deleteMany();
    console.log(`✅ 删除了 ${result.count} 个用户`);
  } catch (error) {
    console.error('❌ 清空用户表失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 显示数据库用户
 */
async function showUsers() {
  try {
    const users = await prisma.user.findMany();
    
    if (users.length === 0) {
      console.log('📭 数据库中暂无用户');
      return;
    }
    
    console.log('📋 数据库中的用户:\n');
    console.log('┌─────────────┬─────────────────────┬─────────────┬──────────┐');
    console.log('│ 用户名      │ 邮箱                │ 角色        │ 状态     │');
    console.log('├─────────────┼─────────────────────┼─────────────┼──────────┤');
    
    users.forEach(user => {
      const username = user.username.padEnd(11);
      const email = user.email.padEnd(19);
      const role = user.role.padEnd(11);
      const status = (user.isActive ? '激活' : '禁用').padEnd(8);
      console.log(`│ ${username} │ ${email} │ ${role} │ ${status} │`);
    });
    
    console.log('└─────────────┴─────────────────────┴─────────────┴──────────┘\n');
    
  } catch (error) {
    console.error('❌ 查询用户失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';
  
  console.log('🗄️  Wuhr AI Ops - 用户数据迁移工具\n');
  
  switch (command) {
    case 'migrate':
      await migrateUsers();
      break;
      
    case 'clear':
      await clearUsers();
      break;
      
    case 'show':
      await showUsers();
      break;
      
    case 'reset':
      await clearUsers();
      await migrateUsers();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      console.log('使用方法:');
      console.log('  node migrate-users-to-db.js [command]');
      console.log('');
      console.log('命令:');
      console.log('  migrate  迁移JSON用户到数据库 (默认)');
      console.log('  clear    清空数据库用户表');
      console.log('  show     显示数据库用户');
      console.log('  reset    清空并重新迁移');
      console.log('  help     显示帮助信息');
      console.log('');
      break;
      
    default:
      console.log(`❌ 未知命令: ${command}`);
      console.log('使用 "node migrate-users-to-db.js help" 查看帮助');
      process.exit(1);
  }
  
  console.log('🎉 操作完成！');
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('💥 程序执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  migrateUsers,
  clearUsers,
  showUsers
};
