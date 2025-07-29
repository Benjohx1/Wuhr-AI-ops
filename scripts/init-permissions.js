#!/usr/bin/env node

const { PrismaClient } = require('../lib/generated/prisma');

// 由于ES模块导入问题，直接在这里定义权限数据
const PERMISSION_CODES = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  PERMISSIONS_READ: 'permissions:read',
  PERMISSIONS_WRITE: 'permissions:write',
  SERVERS_READ: 'servers:read',
  SERVERS_WRITE: 'servers:write',
  CICD_READ: 'cicd:read',
  CICD_WRITE: 'cicd:write',
  APPROVALS_READ: 'approvals:read',
  APPROVALS_WRITE: 'approvals:write',
  NOTIFICATIONS_READ: 'notifications:read',
  NOTIFICATIONS_WRITE: 'notifications:write',
  CONFIG_READ: 'config:read',
  CONFIG_WRITE: 'config:write',
  AI_READ: 'ai:read',
  AI_WRITE: 'ai:write',
  MONITORING_READ: 'monitoring:read',
  MONITORING_WRITE: 'monitoring:write',
};

const SYSTEM_PERMISSIONS = [
  // 用户管理权限
  {
    id: 'perm_users_read',
    name: '用户查看',
    code: PERMISSION_CODES.USERS_READ,
    description: '查看用户列表、用户信息等，但不能修改',
    category: '用户管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'perm_users_write',
    name: '用户管理',
    code: PERMISSION_CODES.USERS_WRITE,
    description: '创建、编辑、删除用户，修改用户状态等',
    category: '用户管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 权限管理权限
  {
    id: 'perm_permissions_read',
    name: '权限查看',
    code: PERMISSION_CODES.PERMISSIONS_READ,
    description: '查看权限列表、用户权限分配等，但不能修改',
    category: '权限管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'perm_permissions_write',
    name: '权限管理',
    code: PERMISSION_CODES.PERMISSIONS_WRITE,
    description: '分配和撤销用户权限，管理权限配置等',
    category: '权限管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 主机管理权限
  {
    id: 'perm_servers_read',
    name: '主机查看',
    code: PERMISSION_CODES.SERVERS_READ,
    description: '查看服务器列表、服务器状态、监控数据等',
    category: '主机管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'perm_servers_write',
    name: '主机管理',
    code: PERMISSION_CODES.SERVERS_WRITE,
    description: '添加、编辑、删除服务器，执行服务器操作等',
    category: '主机管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // CI/CD管理权限
  {
    id: 'perm_cicd_read',
    name: 'CI/CD查看',
    code: PERMISSION_CODES.CICD_READ,
    description: '查看项目列表、部署历史、构建日志等',
    category: 'CI/CD管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'perm_cicd_write',
    name: 'CI/CD管理',
    code: PERMISSION_CODES.CICD_WRITE,
    description: '创建项目、执行部署、管理构建配置等',
    category: 'CI/CD管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 审批管理权限
  {
    id: 'perm_approvals_read',
    name: '审批查看',
    code: PERMISSION_CODES.APPROVALS_READ,
    description: '查看审批任务列表、审批历史等',
    category: '审批管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'perm_approvals_write',
    name: '审批管理',
    code: PERMISSION_CODES.APPROVALS_WRITE,
    description: '处理审批任务、通过或拒绝审批等',
    category: '审批管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 通知管理权限
  {
    id: 'perm_notifications_read',
    name: '通知查看',
    code: PERMISSION_CODES.NOTIFICATIONS_READ,
    description: '查看通知列表、通知历史等',
    category: '通知管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'perm_notifications_write',
    name: '通知管理',
    code: PERMISSION_CODES.NOTIFICATIONS_WRITE,
    description: '发送通知、管理通知配置、删除通知等',
    category: '通知管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 配置管理权限
  {
    id: 'perm_config_read',
    name: '配置查看',
    code: PERMISSION_CODES.CONFIG_READ,
    description: '查看系统配置、API配置等',
    category: '配置管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'perm_config_write',
    name: '配置管理',
    code: PERMISSION_CODES.CONFIG_WRITE,
    description: '修改系统配置、API密钥、模型配置等',
    category: '配置管理',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // AI助手权限
  {
    id: 'perm_ai_read',
    name: 'AI助手查看',
    code: PERMISSION_CODES.AI_READ,
    description: '查看AI对话历史、模型配置等',
    category: 'AI功能',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'perm_ai_write',
    name: 'AI助手使用',
    code: PERMISSION_CODES.AI_WRITE,
    description: '使用AI助手功能、创建对话、管理对话历史等',
    category: 'AI功能',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 系统监控权限
  {
    id: 'perm_monitoring_read',
    name: '监控查看',
    code: PERMISSION_CODES.MONITORING_READ,
    description: '查看系统监控数据、性能指标等',
    category: '系统监控',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'perm_monitoring_write',
    name: '监控管理',
    code: PERMISSION_CODES.MONITORING_WRITE,
    description: '配置监控规则、管理告警设置等',
    category: '系统监控',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSION_CODES),
  manager: [
    PERMISSION_CODES.USERS_READ,
    PERMISSION_CODES.SERVERS_READ,
    PERMISSION_CODES.SERVERS_WRITE,
    PERMISSION_CODES.CICD_READ,
    PERMISSION_CODES.CICD_WRITE,
    PERMISSION_CODES.APPROVALS_READ,
    PERMISSION_CODES.APPROVALS_WRITE,
    PERMISSION_CODES.NOTIFICATIONS_READ,
    PERMISSION_CODES.CONFIG_READ,
    PERMISSION_CODES.AI_READ,
    PERMISSION_CODES.AI_WRITE,
    PERMISSION_CODES.MONITORING_READ,
    PERMISSION_CODES.MONITORING_WRITE
  ],
  developer: [
    PERMISSION_CODES.SERVERS_READ,
    PERMISSION_CODES.CICD_READ,
    PERMISSION_CODES.CICD_WRITE,
    PERMISSION_CODES.NOTIFICATIONS_READ,
    PERMISSION_CODES.AI_READ,
    PERMISSION_CODES.AI_WRITE,
    PERMISSION_CODES.MONITORING_READ
  ],
  viewer: [
    PERMISSION_CODES.USERS_READ,
    PERMISSION_CODES.SERVERS_READ,
    PERMISSION_CODES.CICD_READ,
    PERMISSION_CODES.APPROVALS_READ,
    PERMISSION_CODES.NOTIFICATIONS_READ,
    PERMISSION_CODES.CONFIG_READ,
    PERMISSION_CODES.AI_READ,
    PERMISSION_CODES.MONITORING_READ
  ]
};

async function initializePermissions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔐 开始初始化权限系统...\n');

    // 1. 清理现有权限数据（可选）
    console.log('🧹 清理现有权限数据...');
    await prisma.permission.deleteMany({});
    console.log('✅ 权限数据清理完成\n');

    // 2. 创建新的权限记录
    console.log('📝 创建权限记录...');
    let createdCount = 0;
    
    for (const permission of SYSTEM_PERMISSIONS) {
      try {
        await prisma.permission.create({
          data: {
            id: permission.id,
            name: permission.name,
            code: permission.code,
            description: permission.description,
            category: permission.category,
            createdAt: new Date(permission.createdAt),
            updatedAt: new Date(permission.updatedAt)
          }
        });
        
        console.log(`  ✅ 创建权限: ${permission.name} (${permission.code})`);
        createdCount++;
      } catch (error) {
        console.error(`  ❌ 创建权限失败: ${permission.name} - ${error.message}`);
      }
    }
    
    console.log(`\n📊 权限创建完成，共创建 ${createdCount} 个权限\n`);

    // 3. 更新现有用户的权限
    console.log('👥 更新现有用户权限...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        permissions: true
      }
    });

    console.log(`📋 找到 ${users.length} 个用户需要更新权限\n`);

    for (const user of users) {
      try {
        let newPermissions = [];
        
        // 根据用户角色分配权限
        if (user.role === 'admin' || user.role === '管理员' || user.role === '超级管理员') {
          newPermissions = ROLE_PERMISSIONS.admin;
        } else if (user.role === 'manager' || user.role === '经理' || user.role === '项目经理') {
          newPermissions = ROLE_PERMISSIONS.manager;
        } else if (user.role === 'developer' || user.role === '开发者' || user.role === '开发人员') {
          newPermissions = ROLE_PERMISSIONS.developer;
        } else if (user.role === 'viewer' || user.role === '查看者' || user.role === '普通用户') {
          newPermissions = ROLE_PERMISSIONS.viewer;
        } else {
          // 默认给予基本权限
          newPermissions = ROLE_PERMISSIONS.viewer;
        }

        // 更新用户权限
        await prisma.user.update({
          where: { id: user.id },
          data: {
            permissions: newPermissions
          }
        });

        console.log(`  ✅ 更新用户权限: ${user.username} (${user.role}) - ${newPermissions.length} 个权限`);
        
      } catch (error) {
        console.error(`  ❌ 更新用户权限失败: ${user.username} - ${error.message}`);
      }
    }

    console.log('\n🎉 权限系统初始化完成！');
    
    // 4. 显示权限统计
    console.log('\n📊 权限统计信息:');
    const permissionCount = await prisma.permission.count();
    console.log(`  - 总权限数: ${permissionCount}`);
    
    const categories = [...new Set(SYSTEM_PERMISSIONS.map(p => p.category))];
    console.log(`  - 权限类别: ${categories.length} 个`);
    categories.forEach(category => {
      const count = SYSTEM_PERMISSIONS.filter(p => p.category === category).length;
      console.log(`    * ${category}: ${count} 个权限`);
    });

    console.log('\n🔑 角色权限分配:');
    Object.entries(ROLE_PERMISSIONS).forEach(([role, permissions]) => {
      console.log(`  - ${role}: ${permissions.length} 个权限`);
    });

  } catch (error) {
    console.error('❌ 权限系统初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 验证权限系统
async function verifyPermissions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n🔍 验证权限系统...');
    
    // 检查权限表
    const permissions = await prisma.permission.findMany({
      orderBy: { category: 'asc' }
    });
    
    console.log(`✅ 权限表验证通过，共 ${permissions.length} 个权限`);
    
    // 检查用户权限
    const usersWithPermissions = await prisma.user.findMany({
      where: {
        permissions: {
          isEmpty: false
        }
      },
      select: {
        username: true,
        role: true,
        permissions: true
      }
    });
    
    console.log(`✅ 用户权限验证通过，${usersWithPermissions.length} 个用户已分配权限`);
    
    // 显示权限分布
    console.log('\n📈 权限分布统计:');
    const permissionStats = {};
    
    usersWithPermissions.forEach(user => {
      user.permissions.forEach(permission => {
        permissionStats[permission] = (permissionStats[permission] || 0) + 1;
      });
    });
    
    Object.entries(permissionStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([permission, count]) => {
        console.log(`  - ${permission}: ${count} 个用户`);
      });
    
  } catch (error) {
    console.error('❌ 权限系统验证失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 主函数
async function main() {
  const command = process.argv[2] || 'init';
  
  switch (command) {
    case 'init':
      await initializePermissions();
      await verifyPermissions();
      break;
      
    case 'verify':
      await verifyPermissions();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      console.log('权限系统初始化工具');
      console.log('');
      console.log('使用方法:');
      console.log('  node scripts/init-permissions.js [command]');
      console.log('');
      console.log('命令:');
      console.log('  init     初始化权限系统 (默认)');
      console.log('  verify   验证权限系统');
      console.log('  help     显示帮助信息');
      console.log('');
      break;
      
    default:
      console.log(`❌ 未知命令: ${command}`);
      console.log('使用 "node scripts/init-permissions.js help" 查看帮助');
      process.exit(1);
  }
}

// 执行主函数
main()
  .then(() => {
    console.log('\n🎉 操作完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 操作失败:', error);
    process.exit(1);
  });
