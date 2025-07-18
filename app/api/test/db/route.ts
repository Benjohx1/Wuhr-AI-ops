import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '../../../../lib/config/database'

// 测试数据库连接API
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 测试数据库连接API被调用')
    
    const prisma = await getPrismaClient()
    
    // 测试基本查询
    const userCount = await prisma.user.count()
    const serverCount = await prisma.server.count()
    const projectCount = await prisma.cICDProject.count()
    
    console.log('✅ 数据库连接成功，统计信息:', {
      users: userCount,
      servers: serverCount,
      projects: projectCount
    })

    return NextResponse.json({
      success: true,
      message: '数据库连接测试成功',
      data: {
        stats: {
          users: userCount,
          servers: serverCount,
          projects: projectCount
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error)
    return NextResponse.json({
      success: false,
      error: '数据库连接测试失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}
