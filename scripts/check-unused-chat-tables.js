const { PrismaClient } = require('../lib/generated/prisma')

async function checkUnusedChatTables() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 检查数据库中的聊天相关表使用情况...\n')
    
    // 检查ChatSession表
    console.log('📊 ChatSession表分析:')
    const sessionCount = await prisma.chatSession.count()
    console.log(`  - 总会话数: ${sessionCount}`)
    
    if (sessionCount > 0) {
      const recentSessions = await prisma.chatSession.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          updatedAt: true,
          _count: {
            select: { messages: true }
          }
        }
      })
      
      console.log('  - 最近的会话:')
      recentSessions.forEach(session => {
        console.log(`    * ${session.title} (${session._count.messages}条消息) - ${session.updatedAt.toISOString()}`)
      })
    }
    
    // 检查ChatMessage表
    console.log('\n📊 ChatMessage表分析:')
    const messageCount = await prisma.chatMessage.count()
    console.log(`  - 总消息数: ${messageCount}`)
    
    if (messageCount > 0) {
      const messagesByType = await prisma.chatMessage.groupBy({
        by: ['type'],
        _count: { type: true }
      })
      
      console.log('  - 按类型分组:')
      messagesByType.forEach(group => {
        console.log(`    * ${group.type}: ${group._count.type}条`)
      })
      
      const recentMessages = await prisma.chatMessage.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          type: true,
          content: true,
          createdAt: true,
          session: {
            select: { title: true }
          }
        }
      })
      
      console.log('  - 最近的消息:')
      recentMessages.forEach(msg => {
        const preview = msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content
        console.log(`    * [${msg.type}] ${preview} - ${msg.createdAt.toISOString()}`)
      })
    }
    
    // 分析表的使用情况
    console.log('\n📈 使用情况分析:')
    
    if (sessionCount === 0 && messageCount === 0) {
      console.log('✅ 数据库聊天表为空，可以考虑删除')
      console.log('💡 建议: 由于当前使用Redis存储聊天历史，这些表可以安全删除')
    } else if (sessionCount > 0 || messageCount > 0) {
      console.log('⚠️  数据库聊天表包含数据')
      console.log('💡 建议: 需要确认这些数据是否还需要，或者是否需要迁移到Redis')
      
      // 检查最后活动时间
      if (sessionCount > 0) {
        const lastActivity = await prisma.chatSession.findFirst({
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true }
        })
        
        const daysSinceLastActivity = Math.floor(
          (Date.now() - lastActivity.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        console.log(`📅 最后活动: ${daysSinceLastActivity}天前`)
        
        if (daysSinceLastActivity > 30) {
          console.log('💡 数据较旧，可能可以安全删除')
        }
      }
    }
    
    // 检查相关的API路由是否还存在
    console.log('\n🔗 相关代码检查:')
    const fs = require('fs')
    const path = require('path')
    
    const apiChatPath = path.join(__dirname, '../app/api/chat')
    if (fs.existsSync(apiChatPath)) {
      const files = fs.readdirSync(apiChatPath, { recursive: true })
      console.log('  - 发现的API路由文件:')
      files.forEach(file => {
        if (file.endsWith('.ts')) {
          console.log(`    * ${file}`)
        }
      })
    } else {
      console.log('  - 未发现数据库版本的聊天API路由')
    }
    
    console.log('\n✅ 检查完成')
    
  } catch (error) {
    console.error('❌ 检查失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUnusedChatTables()
