import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serverUrl, username, password, apiKey, orgId = 1 } = body

    console.log('🔗 测试Grafana连接:', {
      serverUrl,
      username,
      orgId,
      hasPassword: !!password,
      hasApiKey: !!apiKey
    })

    // 验证必需参数
    if (!serverUrl) {
      return NextResponse.json({
        success: false,
        error: '服务器地址不能为空'
      }, { status: 400 })
    }

    if (!username && !apiKey) {
      return NextResponse.json({
        success: false,
        error: '用户名或API密钥至少需要提供一个'
      }, { status: 400 })
    }

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // 设置认证
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    } else if (username && password) {
      const auth = Buffer.from(`${username}:${password}`).toString('base64')
      headers['Authorization'] = `Basic ${auth}`
    }

    // 测试连接 - 获取组织信息
    const testUrl = `${serverUrl.replace(/\/$/, '')}/api/org`
    
    console.log('🔗 发送测试请求到:', testUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Grafana API错误:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })

        if (response.status === 401) {
          return NextResponse.json({
            success: false,
            error: '认证失败，请检查用户名密码或API密钥'
          }, { status: 400 })
        } else if (response.status === 403) {
          return NextResponse.json({
            success: false,
            error: '权限不足，请检查用户权限'
          }, { status: 400 })
        } else {
          return NextResponse.json({
            success: false,
            error: `Grafana服务器错误: ${response.status} ${response.statusText}`
          }, { status: 400 })
        }
      }

      const orgData = await response.json()
      
      console.log('✅ Grafana连接测试成功:', orgData)

      // 尝试获取Grafana版本信息
      let versionInfo = ''
      try {
        const healthResponse = await fetch(`${serverUrl.replace(/\/$/, '')}/api/health`, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(5000)
        })

        if (healthResponse.ok) {
          const healthData = await healthResponse.json()
          versionInfo = healthData.version || ''
        }
      } catch (error) {
        console.log('获取版本信息失败:', error)
      }

      return NextResponse.json({
        success: true,
        message: 'Grafana连接测试成功',
        data: {
          organization: orgData,
          version: versionInfo,
          serverUrl,
          connectionTime: new Date().toISOString()
        }
      })

    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return NextResponse.json({
            success: false,
            error: '连接超时，请检查服务器地址和网络连接'
          }, { status: 400 })
        } else {
          console.error('Grafana连接错误:', error)
          return NextResponse.json({
            success: false,
            error: `连接失败: ${error.message}`
          }, { status: 400 })
        }
      } else {
        return NextResponse.json({
          success: false,
          error: '未知连接错误'
        }, { status: 400 })
      }
    }

  } catch (error) {
    console.error('测试Grafana连接失败:', error)
    return NextResponse.json({
      success: false,
      error: '测试连接失败'
    }, { status: 500 })
  }
}
