const { PrismaClient } = require('../lib/generated/prisma');

async function analyzeDBPerformance() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 开始数据库性能分析...\n');

    // 1. 检查表记录数量
    console.log('📊 表记录数量统计:');
    const userCount = await prisma.user.count();
    const serverCount = await prisma.server.count();
    const sessionCount = await prisma.authSession.count();
    const apiKeyCount = await prisma.apiKey.count();
    
    console.log(`- Users: ${userCount}`);
    console.log(`- Servers: ${serverCount}`);
    console.log(`- Auth Sessions: ${sessionCount}`);
    console.log(`- API Keys: ${apiKeyCount}\n`);

    // 2. 测试常见查询性能
    console.log('⚡ 查询性能测试:');
    
    // 测试用户查询
    const userQueryStart = Date.now();
    await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, username: true, role: true }
    });
    const userQueryTime = Date.now() - userQueryStart;
    console.log(`- 用户查询: ${userQueryTime}ms`);

    // 测试服务器查询
    const serverQueryStart = Date.now();
    await prisma.server.findMany({
      where: { isActive: true },
      select: { id: true, name: true, status: true }
    });
    const serverQueryTime = Date.now() - serverQueryStart;
    console.log(`- 服务器查询: ${serverQueryTime}ms`);

    // 测试API密钥查询
    const apiKeyQueryStart = Date.now();
    await prisma.apiKey.findMany({
      where: { isActive: true },
      select: { id: true, name: true, provider: true }
    });
    const apiKeyQueryTime = Date.now() - apiKeyQueryStart;
    console.log(`- API密钥查询: ${apiKeyQueryTime}ms`);

    // 3. 检查是否需要额外索引
    console.log('\n🔧 索引建议:');
    
    if (userQueryTime > 100) {
      console.log('⚠️  用户查询较慢，建议检查 isActive 索引');
    }
    
    if (serverQueryTime > 100) {
      console.log('⚠️  服务器查询较慢，建议检查 isActive 索引');
    }
    
    if (apiKeyQueryTime > 100) {
      console.log('⚠️  API密钥查询较慢，建议检查 isActive 索引');
    }

    // 4. 检查数据库连接
    console.log('\n🔗 数据库连接测试:');
    const connectionStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const connectionTime = Date.now() - connectionStart;
    console.log(`- 连接延迟: ${connectionTime}ms`);

    if (connectionTime > 50) {
      console.log('⚠️  数据库连接延迟较高，可能影响菜单响应速度');
    }

    // 5. 建议优化措施
    console.log('\n💡 性能优化建议:');
    
    if (userQueryTime > 50 || serverQueryTime > 50 || apiKeyQueryTime > 50) {
      console.log('1. 考虑添加复合索引');
      console.log('2. 使用查询缓存');
      console.log('3. 减少查询字段');
    }
    
    if (connectionTime > 30) {
      console.log('4. 检查数据库连接池配置');
      console.log('5. 考虑使用连接缓存');
    }

    console.log('\n✅ 性能分析完成');

  } catch (error) {
    console.error('❌ 性能分析失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDBPerformance();
