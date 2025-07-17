import { NextRequest, NextResponse } from 'next/server'
import {
  requireAuth,
  successResponse,
  errorResponse,
  serverErrorResponse
} from '../../../../lib/auth/apiHelpers'
import { getPrismaClient } from '../../../../lib/config/database'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// 获取当前用户资料
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const user = authResult.user

    // 从数据库获取完整的用户信息
    const prisma = await getPrismaClient()
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        approvalStatus: true,
        createdAt: true,
        lastLoginAt: true,
        approvedAt: true,
        approver: {
          select: {
            username: true
          }
        }
      }
    })

    if (!userProfile) {
      return errorResponse('用户不存在', '找不到用户信息', 404)
    }

    return successResponse({
      user: userProfile
    })

  } catch (error) {
    console.error('❌ 获取用户资料失败:', error)
    return serverErrorResponse(error)
  }
}

// 更新当前用户资料
export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const user = authResult.user
    const body = await request.json()
    const { email } = body

    // 验证输入数据
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('邮箱格式错误', '请输入有效的邮箱地址', 400)
    }

    // 检查邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      const prisma = await getPrismaClient()
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser && existingUser.id !== user.id) {
        return errorResponse('邮箱已被使用', '该邮箱地址已被其他用户使用', 400)
      }

      // 更新用户邮箱
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          updatedAt: new Date()
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true,
          approvalStatus: true,
          createdAt: true,
          lastLoginAt: true,
          approvedAt: true,
          updatedAt: true
        }
      })

      return successResponse({
        user: updatedUser,
        message: '邮箱地址更新成功'
      })
    }

    return successResponse({
      message: '没有需要更新的内容'
    })

  } catch (error) {
    console.error('❌ 更新用户资料失败:', error)
    return serverErrorResponse(error)
  }
}