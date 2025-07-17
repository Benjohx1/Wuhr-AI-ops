#!/usr/bin/env node

/**
 * 调试JWT Token生成和验证
 */

const { generateTokens, verifyToken, decodeToken } = require('../lib/auth/jwt-edge');

async function debugJWT() {
  try {
    console.log('🔍 调试JWT Token生成和验证...\n');
    
    // 模拟用户数据
    const testUser = {
      userId: 'test-user-id',
      username: 'admin',
      email: 'admin@wuhr.ai',
      role: 'admin'
    };
    
    console.log('👤 测试用户数据:');
    console.log(JSON.stringify(testUser, null, 2));
    console.log('');
    
    // 生成Token
    console.log('🔐 生成Token...');
    const tokens = await generateTokens(testUser);
    
    console.log('✅ Token生成成功:');
    console.log(`Access Token: ${tokens.accessToken.substring(0, 50)}...`);
    console.log(`Refresh Token: ${tokens.refreshToken.substring(0, 50)}...`);
    console.log('');
    
    // 解码Token（不验证）
    console.log('📖 解码Access Token:');
    const decodedAccess = decodeToken(tokens.accessToken);
    console.log(JSON.stringify(decodedAccess, null, 2));
    console.log('');
    
    // 验证Access Token
    console.log('✅ 验证Access Token...');
    try {
      const verifiedAccess = await verifyToken(tokens.accessToken, 'access');
      console.log('验证成功:');
      console.log(JSON.stringify(verifiedAccess, null, 2));
    } catch (error) {
      console.error('❌ Access Token验证失败:', error.message);
    }
    console.log('');
    
    // 验证Refresh Token
    console.log('✅ 验证Refresh Token...');
    try {
      const verifiedRefresh = await verifyToken(tokens.refreshToken, 'refresh');
      console.log('验证成功:');
      console.log(JSON.stringify(verifiedRefresh, null, 2));
    } catch (error) {
      console.error('❌ Refresh Token验证失败:', error.message);
    }
    
  } catch (error) {
    console.error('💥 调试失败:', error);
  }
}

async function testLoginToken() {
  try {
    console.log('\n🌐 测试实际登录Token...\n');
    
    // 模拟登录请求
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin@wuhr.ai',
        password: 'Admin123!'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 登录成功，获取到Token');
      const accessToken = result.data.tokens.accessToken;
      
      console.log('📖 解码实际Token:');
      const decoded = decodeToken(accessToken);
      console.log(JSON.stringify(decoded, null, 2));
      console.log('');
      
      console.log('✅ 验证实际Token...');
      try {
        const verified = await verifyToken(accessToken, 'access');
        console.log('验证成功:');
        console.log(JSON.stringify(verified, null, 2));
      } catch (error) {
        console.error('❌ 实际Token验证失败:', error.message);
      }
      
    } else {
      console.error('❌ 登录失败:', result.error);
    }
    
  } catch (error) {
    console.error('💥 测试登录Token失败:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  console.log('🧪 JWT Token 调试工具\n');
  
  switch (command) {
    case 'generate':
      await debugJWT();
      break;
      
    case 'login':
      await testLoginToken();
      break;
      
    case 'all':
      await debugJWT();
      await testLoginToken();
      break;
      
    case 'help':
      console.log('使用方法:');
      console.log('  node debug-jwt.js [command]');
      console.log('');
      console.log('命令:');
      console.log('  generate  测试Token生成和验证');
      console.log('  login     测试实际登录Token');
      console.log('  all       运行所有测试 (默认)');
      console.log('  help      显示帮助信息');
      break;
      
    default:
      console.log(`❌ 未知命令: ${command}`);
      process.exit(1);
  }
  
  console.log('\n🎉 调试完成！');
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 程序执行失败:', error);
    process.exit(1);
  });
}
