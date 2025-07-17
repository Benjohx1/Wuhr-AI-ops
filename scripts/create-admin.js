#!/usr/bin/env node

/**
 * 创建默认管理员账户脚本
 * 用于初始化系统时创建管理员账户
 */

const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

// 默认管理员配置
const DEFAULT_ADMIN = {
  username: 'admin',
  email: 'admin@wuhr.ai',
  password: 'Admin123!',
  role: 'admin',
  permissions: [
    'users:read', 'users:write', 'users:delete',
    'cicd:all', 'servers:all', 'config:all'
  ]
};

// 演示账户配置
const DEMO_ACCOUNTS = [
  {
    username: 'manager',
    email: 'manager@wuhr.ai',
    password: 'Manager123!',
    role: 'manager',
    permissions: [
      'users:read', 'cicd:read', 'cicd:write', 'cicd:execute',
      'servers:read', 'servers:write', 'config:read', 'config:write'
    ]
  },
  {
    username: 'developer',
    email: 'developer@wuhr.ai',
    password: 'Developer123!',
    role: 'developer',
    permissions: [
      'users:read', 'cicd:read', 'cicd:execute',
      'servers:read', 'config:read'
    ]
  },
  {
    username: 'viewer',
    email: 'viewer@wuhr.ai',
    password: 'Viewer123!',
    role: 'viewer',
    permissions: [
      'users:read', 'cicd:read', 'servers:read', 'config:read'
    ]
  }
];

/**
 * 生成用户ID
 */
function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 创建用户对象
 */
async function createUser(userData) {
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  const now = new Date();

  return {
    id: generateUserId(),
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    role: userData.role,
    permissions: userData.permissions,
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastLoginAt: null
  };
}

/**
 * 读取现有用户数据
 */
async function readUsersData() {
  const dataDir = path.join(__dirname, '../data');
  const usersFile = path.join(dataDir, 'users.json');

  try {
    // 确保数据目录存在
    await fs.mkdir(dataDir, { recursive: true });

    // 尝试读取现有用户数据
    const data = await fs.readFile(usersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 文件不存在，返回空数组
      return [];
    }
    throw error;
  }
}

/**
 * 保存用户数据
 */
async function saveUsersData(users) {
  const dataDir = path.join(__dirname, '../data');
  const usersFile = path.join(dataDir, 'users.json');

  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

/**
 * 检查用户是否已存在
 */
function userExists(users, username, email) {
  return users.some(user =>
    user.username === username || user.email === email
  );
}

/**
 * 创建管理员账户
 */
async function createAdminAccount() {
  try {
    console.log('🚀 开始创建管理员账户...\n');

    // 读取现有用户数据
    const users = await readUsersData();
    console.log(`📊 当前用户数量: ${users.length}`);

    // 检查管理员是否已存在
    if (userExists(users, DEFAULT_ADMIN.username, DEFAULT_ADMIN.email)) {
      console.log('⚠️  管理员账户已存在，跳过创建');
      console.log(`👤 用户名: ${DEFAULT_ADMIN.username}`);
      console.log(`📧 邮箱: ${DEFAULT_ADMIN.email}`);
      console.log(`🔑 密码: ${DEFAULT_ADMIN.password}\n`);
      return;
    }

    // 创建管理员用户
    const adminUser = await createUser(DEFAULT_ADMIN);
    users.push(adminUser);

    console.log('✅ 管理员账户创建成功！');
    console.log(`👤 用户名: ${DEFAULT_ADMIN.username}`);
    console.log(`📧 邮箱: ${DEFAULT_ADMIN.email}`);
    console.log(`🔑 密码: ${DEFAULT_ADMIN.password}`);
    console.log(`🎭 角色: ${DEFAULT_ADMIN.role}\n`);

    // 保存用户数据
    await saveUsersData(users);
    console.log('💾 用户数据已保存\n');

  } catch (error) {
    console.error('❌ 创建管理员账户失败:', error.message);
    process.exit(1);
  }
}

/**
 * 创建演示账户
 */
async function createDemoAccounts() {
  try {
    console.log('🎭 开始创建演示账户...\n');

    // 读取现有用户数据
    const users = await readUsersData();
    let createdCount = 0;

    for (const demoAccount of DEMO_ACCOUNTS) {
      if (!userExists(users, demoAccount.username, demoAccount.email)) {
        const demoUser = await createUser(demoAccount);
        users.push(demoUser);
        createdCount++;

        console.log(`✅ 创建 ${demoAccount.role} 账户:`);
        console.log(`   👤 用户名: ${demoAccount.username}`);
        console.log(`   📧 邮箱: ${demoAccount.email}`);
        console.log(`   🔑 密码: ${demoAccount.password}\n`);
      } else {
        console.log(`⚠️  ${demoAccount.role} 账户已存在，跳过创建\n`);
      }
    }

    if (createdCount > 0) {
      await saveUsersData(users);
      console.log(`💾 创建了 ${createdCount} 个演示账户\n`);
    }

  } catch (error) {
    console.error('❌ 创建演示账户失败:', error.message);
    process.exit(1);
  }
}

/**
 * 显示所有账户信息
 */
async function showAllAccounts() {
  try {
    const users = await readUsersData();

    if (users.length === 0) {
      console.log('📭 暂无用户账户\n');
      return;
    }

    console.log('📋 所有用户账户:\n');
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
    console.error('❌ 读取用户数据失败:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'admin';

  console.log('🤖 Wuhr AI Ops - 用户账户管理工具\n');

  switch (command) {
    case 'admin':
      await createAdminAccount();
      break;

    case 'demo':
      await createDemoAccounts();
      break;

    case 'all':
      await createAdminAccount();
      await createDemoAccounts();
      break;

    case 'list':
      await showAllAccounts();
      break;

    case 'help':
    case '--help':
    case '-h':
      console.log('使用方法:');
      console.log('  node create-admin.js [command]');
      console.log('');
      console.log('命令:');
      console.log('  admin    创建管理员账户 (默认)');
      console.log('  demo     创建演示账户');
      console.log('  all      创建所有账户');
      console.log('  list     显示所有账户');
      console.log('  help     显示帮助信息');
      console.log('');
      break;

    default:
      console.log(`❌ 未知命令: ${command}`);
      console.log('使用 "node create-admin.js help" 查看帮助');
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
  createAdminAccount,
  createDemoAccounts,
  showAllAccounts
};