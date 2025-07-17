const { PrismaClient } = require('../lib/generated/prisma')

async function checkAccessManagementDatabaseTables() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 检查接入管理相关数据库表的使用情况...\n')
    
    // 检查服务器表
    console.log('📊 Server表分析:')
    const serverCount = await prisma.server.count()
    console.log(`  - 总服务器数: ${serverCount}`)
    
    if (serverCount > 0) {
      const serverStats = await prisma.server.groupBy({
        by: ['status'],
        _count: { status: true }
      })
      
      console.log('  - 按状态分组:')
      serverStats.forEach(stat => {
        console.log(`    * ${stat.status}: ${stat._count.status}个`)
      })
      
      const recentServers = await prisma.server.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          ip: true,
          status: true,
          os: true,
          location: true,
          updatedAt: true
        }
      })
      
      console.log('  - 最近的服务器:')
      recentServers.forEach(server => {
        console.log(`    * ${server.name} (${server.ip}) - ${server.status} - ${server.os} - ${server.location}`)
      })
    }
    
    // 检查服务器指标表
    console.log('\n📊 ServerMetric表分析:')
    const metricCount = await prisma.serverMetric.count()
    console.log(`  - 总指标记录数: ${metricCount}`)
    
    if (metricCount > 0) {
      const recentMetrics = await prisma.serverMetric.findMany({
        take: 3,
        orderBy: { timestamp: 'desc' },
        include: {
          server: {
            select: { name: true }
          }
        }
      })
      
      console.log('  - 最近的指标记录:')
      recentMetrics.forEach(metric => {
        console.log(`    * ${metric.server.name} - CPU: ${metric.cpuUsage}%, 内存: ${metric.memoryUsed}MB, 磁盘: ${metric.diskUsed}GB`)
      })
    }
    
    // 检查服务器告警表
    console.log('\n📊 ServerAlert表分析:')
    const alertCount = await prisma.serverAlert.count()
    console.log(`  - 总告警数: ${alertCount}`)
    
    if (alertCount > 0) {
      const alertStats = await prisma.serverAlert.groupBy({
        by: ['level'],
        _count: { level: true }
      })
      
      console.log('  - 按级别分组:')
      alertStats.forEach(stat => {
        console.log(`    * ${stat.level}: ${stat._count.level}个`)
      })
      
      const unresolvedAlerts = await prisma.serverAlert.count({
        where: { isResolved: false }
      })
      console.log(`  - 未解决告警: ${unresolvedAlerts}个`)
    }
    
    // 检查服务器日志表
    console.log('\n📊 ServerLog表分析:')
    const logCount = await prisma.serverLog.count()
    console.log(`  - 总日志记录数: ${logCount}`)
    
    if (logCount > 0) {
      const logStats = await prisma.serverLog.groupBy({
        by: ['level'],
        _count: { level: true }
      })
      
      console.log('  - 按级别分组:')
      logStats.forEach(stat => {
        console.log(`    * ${stat.level}: ${stat._count.level}个`)
      })
    }
    
    // 检查Git凭证表
    console.log('\n📊 GitCredential表分析:')
    const gitCredentialCount = await prisma.gitCredential.count()
    console.log(`  - 总Git凭证数: ${gitCredentialCount}`)
    
    if (gitCredentialCount > 0) {
      const credentialStats = await prisma.gitCredential.groupBy({
        by: ['platform'],
        _count: { platform: true }
      })
      
      console.log('  - 按平台分组:')
      credentialStats.forEach(stat => {
        console.log(`    * ${stat.platform}: ${stat._count.platform}个`)
      })
      
      const authTypeStats = await prisma.gitCredential.groupBy({
        by: ['authType'],
        _count: { authType: true }
      })
      
      console.log('  - 按认证类型分组:')
      authTypeStats.forEach(stat => {
        console.log(`    * ${stat.authType}: ${stat._count.authType}个`)
      })
    }
    
    // 分析数据完整性
    console.log('\n📈 数据完整性分析:')
    
    // 检查孤立的服务器指标
    const orphanedMetrics = await prisma.serverMetric.count({
      where: {
        serverId: {
          notIn: await prisma.server.findMany({
            select: { id: true }
          }).then(servers => servers.map(s => s.id))
        }
      }
    })
    
    if (orphanedMetrics > 0) {
      console.log(`⚠️  发现 ${orphanedMetrics} 个孤立的服务器指标记录（没有关联服务器）`)
    } else {
      console.log('✅ 所有服务器指标都有关联服务器')
    }
    
    // 检查孤立的服务器告警
    const orphanedAlerts = await prisma.serverAlert.count({
      where: {
        serverId: {
          notIn: await prisma.server.findMany({
            select: { id: true }
          }).then(servers => servers.map(s => s.id))
        }
      }
    })
    
    if (orphanedAlerts > 0) {
      console.log(`⚠️  发现 ${orphanedAlerts} 个孤立的服务器告警（没有关联服务器）`)
    } else {
      console.log('✅ 所有服务器告警都有关联服务器')
    }
    
    // 检查孤立的服务器日志
    const orphanedLogs = await prisma.serverLog.count({
      where: {
        serverId: {
          notIn: await prisma.server.findMany({
            select: { id: true }
          }).then(servers => servers.map(s => s.id))
        }
      }
    })
    
    if (orphanedLogs > 0) {
      console.log(`⚠️  发现 ${orphanedLogs} 个孤立的服务器日志（没有关联服务器）`)
    } else {
      console.log('✅ 所有服务器日志都有关联服务器')
    }
    
    // 检查废弃的字段
    console.log('\n🔍 废弃字段检查:')
    
    // 检查服务器表中的空字段
    const serversWithEmptyFields = await prisma.server.findMany({
      where: {
        OR: [
          { keyPath: null },
          { keyPath: '' },
          { password: null },
          { password: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        keyPath: true,
        password: true
      }
    })
    
    if (serversWithEmptyFields.length > 0) {
      console.log(`⚠️  发现 ${serversWithEmptyFields.length} 个服务器缺少SSH认证信息`)
      serversWithEmptyFields.forEach(server => {
        const missing = []
        if (!server.username) missing.push('username')
        if (!server.keyPath && !server.password) missing.push('认证方式')
        console.log(`    * ${server.name}: 缺少 ${missing.join(', ')}`)
      })
    } else {
      console.log('✅ 所有服务器都有完整的SSH认证信息')
    }
    
    // 总结
    console.log('\n📋 总结:')
    const totalRecords = serverCount + metricCount + alertCount + logCount + gitCredentialCount
    console.log(`总记录数: ${totalRecords}`)
    
    if (totalRecords === 0) {
      console.log('💡 建议: 数据库中没有接入管理数据，可以考虑清理相关的空表或保留用于未来使用')
    } else {
      console.log('💡 建议: 接入管理功能正在使用中，数据库表应该保留')
      
      // 清理建议
      if (orphanedMetrics > 0 || orphanedAlerts > 0 || orphanedLogs > 0) {
        console.log('🧹 清理建议: 发现孤立记录，建议清理以优化数据库性能')
      }
      
      if (serversWithEmptyFields.length > 0) {
        console.log('🔧 修复建议: 补充缺失的SSH认证信息以确保功能正常')
      }
    }
    
    console.log('\n✅ 检查完成')
    
  } catch (error) {
    console.error('❌ 检查失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAccessManagementDatabaseTables()
