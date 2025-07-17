import { NextRequest } from 'next/server'
import { requireAuth } from '../../../../lib/auth/apiHelpers-new'
import { getPrismaClient } from '../../../../lib/config/database'
import { successResponse, errorResponse } from '../../../../lib/auth/apiHelpers'

// 获取Grafana仪表板列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const prisma = await getPrismaClient()

    // 获取Grafana配置
    const config = await prisma.systemConfig.findUnique({
      where: {
        key: 'grafana_config'
      }
    })

    if (!config) {
      return errorResponse('Grafana未配置', undefined, 404)
    }

    let grafanaConfig
    try {
      grafanaConfig = JSON.parse(config.value as string)
    } catch (error) {
      return errorResponse('Grafana配置格式错误', undefined, 500)
    }

    if (!grafanaConfig.enabled) {
      return errorResponse('Grafana未启用', undefined, 400)
    }

    // 尝试从Grafana API获取仪表板列表
    try {
      const searchUrl = `${grafanaConfig.serverUrl}/api/search?type=dash-db`
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // 添加认证头
      if (grafanaConfig.apiKey) {
        headers['Authorization'] = `Bearer ${grafanaConfig.apiKey}`
      } else if (grafanaConfig.username && grafanaConfig.password) {
        headers['Authorization'] = `Basic ${Buffer.from(`${grafanaConfig.username}:${grafanaConfig.password}`).toString('base64')}`
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const dashboards = await response.json()
        
        // 格式化仪表板数据
        const formattedDashboards = dashboards.map((dashboard: any) => ({
          id: dashboard.uid || dashboard.id,
          uid: dashboard.uid,
          name: dashboard.title,
          url: `${grafanaConfig.serverUrl}/d/${dashboard.uid}/${dashboard.uri}?orgId=${grafanaConfig.orgId}&kiosk=1`,
          description: dashboard.tags?.join(', ') || '',
          category: dashboard.folderTitle || 'default',
          tags: dashboard.tags || [],
          starred: dashboard.isStarred || false,
          folderId: dashboard.folderId,
          folderTitle: dashboard.folderTitle
        }))

        return successResponse({
          dashboards: formattedDashboards,
          total: formattedDashboards.length,
          serverUrl: grafanaConfig.serverUrl
        })

      } else {
        // 如果API调用失败，返回配置中的默认仪表板
        console.warn('无法从Grafana API获取仪表板，使用默认配置')
        
        const defaultDashboards = grafanaConfig.dashboards || []
        const formattedDashboards = defaultDashboards.map((dashboard: any) => ({
          ...dashboard,
          url: `${grafanaConfig.serverUrl}/d/${dashboard.uid}/${dashboard.id}?orgId=${grafanaConfig.orgId}&kiosk=1`
        }))

        return successResponse({
          dashboards: formattedDashboards,
          total: formattedDashboards.length,
          serverUrl: grafanaConfig.serverUrl,
          warning: '使用默认仪表板配置，无法连接到Grafana API'
        })
      }

    } catch (error) {
      console.error('获取Grafana仪表板失败:', error)
      
      // 返回默认仪表板配置
      const defaultDashboards = grafanaConfig.dashboards || []
      const formattedDashboards = defaultDashboards.map((dashboard: any) => ({
        ...dashboard,
        url: `${grafanaConfig.serverUrl}/d/${dashboard.uid}/${dashboard.id}?orgId=${grafanaConfig.orgId}&kiosk=1`
      }))

      return successResponse({
        dashboards: formattedDashboards,
        total: formattedDashboards.length,
        serverUrl: grafanaConfig.serverUrl,
        warning: '使用默认仪表板配置，Grafana服务器可能未运行'
      })
    }

  } catch (error) {
    console.error('获取仪表板列表失败:', error)
    return errorResponse('获取仪表板列表失败', undefined, 500)
  }
}

// 添加自定义仪表板
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const body = await request.json()
    const { name, uid, description, category, tags, url } = body

    if (!name || !uid) {
      return errorResponse('仪表板名称和UID不能为空', undefined, 400)
    }

    const prisma = await getPrismaClient()

    // 获取当前配置
    const config = await prisma.systemConfig.findUnique({
      where: {
        key: 'grafana_config'
      }
    })

    if (!config) {
      return errorResponse('Grafana未配置', undefined, 404)
    }

    let grafanaConfig
    try {
      grafanaConfig = JSON.parse(config.value as string)
    } catch (error) {
      return errorResponse('Grafana配置格式错误', undefined, 500)
    }

    // 添加新仪表板到配置
    const newDashboard = {
      id: uid,
      uid,
      name,
      description: description || '',
      category: category || 'custom',
      tags: tags || [],
      url: url || `${grafanaConfig.serverUrl}/d/${uid}?orgId=${grafanaConfig.orgId}&kiosk=1`,
      custom: true
    }

    grafanaConfig.dashboards = grafanaConfig.dashboards || []
    grafanaConfig.dashboards.push(newDashboard)

    // 更新配置
    await prisma.systemConfig.update({
      where: {
        key: 'grafana_config'
      },
      data: {
        value: JSON.stringify(grafanaConfig),
        updatedAt: new Date()
      }
    })

    return successResponse({
      message: '自定义仪表板添加成功',
      dashboard: newDashboard
    })

  } catch (error) {
    console.error('添加自定义仪表板失败:', error)
    return errorResponse('添加自定义仪表板失败', undefined, 500)
  }
}
