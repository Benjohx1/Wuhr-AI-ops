import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../lib/config/database'

// 强制动态渲染，解决构建时的request.headers问题
export const dynamic = 'force-dynamic'


// 获取用户列表 - 用于用户选择器
export async function GET(request: NextRequest) {
  try {
    // 权限检查 - 只需要登录即可
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    console.log('📋 获取用户列表（用于选择器）')

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const role = searchParams.get('role')

    const prisma = await getPrismaClient()

    // 构建查询条件
    const where: any = {
      isActive: true // 只返回活跃用户
    }

    // 搜索条件
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 角色过滤
    if (role) {
      where.role = role
    }

    // 获取用户列表 - 只返回基本信息
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: [
        { role: 'asc' }, // 按角色排序，管理员在前
        { username: 'asc' }
      ],
      take: limit
    })

    console.log(`✅ 获取用户列表成功，共 ${users.length} 个用户`)

    return NextResponse.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        })),
        total: users.length
      }
    })

  } catch (error) {
    console.error('❌ 获取用户列表失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取用户列表失败'
    }, { status: 500 })
  }
}
