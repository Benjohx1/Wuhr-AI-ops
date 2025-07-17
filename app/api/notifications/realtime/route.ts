import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/auth/apiHelpers-new'
import Redis from 'ioredis'

// Redis配置
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
})

// GET /api/notifications/realtime - 建立SSE连接获取实时通知
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }
    const user = authResult.user

    console.log('🔗 [Realtime Notifications] 建立SSE连接:', { userId: user.id })

    // 创建SSE响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // 发送初始连接确认
        const data = `data: ${JSON.stringify({
          type: 'connected',
          message: '实时通知连接已建立',
          timestamp: new Date().toISOString()
        })}\n\n`
        controller.enqueue(encoder.encode(data))

        // 创建Redis订阅
        const subscriber = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          enableReadyCheck: false,
          maxRetriesPerRequest: null,
        })

        const channel = `user:${user.id}:notifications`
        
        subscriber.subscribe(channel, (err) => {
          if (err) {
            console.error('❌ [Realtime Notifications] Redis订阅失败:', err)
            controller.error(err)
            return
          }
          console.log(`📡 [Realtime Notifications] 已订阅频道: ${channel}`)
        })

        subscriber.on('message', (receivedChannel, message) => {
          if (receivedChannel === channel) {
            try {
              const notification = JSON.parse(message)
              const data = `data: ${JSON.stringify(notification)}\n\n`
              controller.enqueue(encoder.encode(data))
              console.log(`📬 [Realtime Notifications] 推送通知给用户 ${user.id}:`, notification.type)
            } catch (error) {
              console.error('❌ [Realtime Notifications] 解析通知消息失败:', error)
            }
          }
        })

        // 定期发送心跳
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeat = `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`
            controller.enqueue(encoder.encode(heartbeat))
          } catch (error) {
            console.error('❌ [Realtime Notifications] 心跳发送失败:', error)
            clearInterval(heartbeatInterval)
            subscriber.disconnect()
            controller.close()
          }
        }, 30000) // 30秒心跳

        // 处理连接关闭
        request.signal.addEventListener('abort', () => {
          console.log(`🔌 [Realtime Notifications] 用户 ${user.id} 断开SSE连接`)
          clearInterval(heartbeatInterval)
          subscriber.unsubscribe(channel)
          subscriber.disconnect()
          controller.close()
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error: any) {
    console.error('❌ [Realtime Notifications] 建立SSE连接失败:', error)
    return NextResponse.json({
      success: false,
      error: error.message || '建立实时连接失败'
    }, { status: 500 })
  }
}

// POST /api/notifications/realtime - 测试推送通知（开发用）
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }
    const user = authResult.user

    // 只有管理员可以测试推送
    if (user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: '您没有权限测试推送通知'
      }, { status: 403 })
    }

    const body = await request.json()
    const { targetUserId, type = 'test', title = '测试通知', content = '这是一条测试通知' } = body

    if (!targetUserId) {
      return NextResponse.json({
        success: false,
        error: '目标用户ID不能为空'
      }, { status: 400 })
    }

    console.log('🧪 [Realtime Notifications] 测试推送通知:', {
      targetUserId,
      type,
      title,
      adminId: user.id
    })

    // 推送测试通知
    const channel = `user:${targetUserId}:notifications`
    const notification = {
      type: 'info_notification',
      data: {
        id: `test_${Date.now()}`,
        type,
        title,
        content,
        actionUrl: '/notifications',
        actionText: '查看详情',
        metadata: {
          isTest: true,
          sentBy: user.realName || user.username
        },
        createdAt: new Date().toISOString()
      }
    }

    await redis.publish(channel, JSON.stringify(notification))

    return NextResponse.json({
      success: true,
      data: {
        message: '测试通知已推送',
        targetUserId,
        notification
      }
    })

  } catch (error: any) {
    console.error('❌ [Realtime Notifications] 测试推送失败:', error)
    return NextResponse.json({
      success: false,
      error: error.message || '测试推送失败'
    }, { status: 500 })
  }
}
