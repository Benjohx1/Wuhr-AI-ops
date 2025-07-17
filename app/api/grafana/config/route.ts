import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '../../../lib/database'
import crypto from 'crypto'

// 加密密钥
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'wuhr-ai-grafana-key-32-chars-long'
const ALGORITHM = 'aes-256-cbc'

// 确保密钥长度为32字节
function getKey(): Buffer {
  const key = ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)
  return Buffer.from(key, 'utf8')
}

// 加密函数
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const key = getKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

// 解密函数
function decrypt(text: string): string {
  try {
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift()!, 'hex')
    const encryptedText = textParts.join(':')
    const key = getKey()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('解密失败:', error)
    return ''
  }
}

// 获取Grafana配置
export async function GET() {
  try {
    const db = await getDatabase()

    const result = await db.get(`
      SELECT * FROM grafana_config
      WHERE id = 1
    `)

    if (result) {
      // 解密敏感信息
      const config = {
        ...result,
        password: result.password ? decrypt(result.password) : '',
        apiKey: result.apiKey ? decrypt(result.apiKey) : ''
      }

      return NextResponse.json({
        success: true,
        data: {
          config,
          isConfigured: !!result.serverUrl
        }
      })
    } else {
      return NextResponse.json({
        success: true,
        data: {
          config: {
            serverUrl: 'http://localhost:3000',
            username: 'admin',
            password: '',
            apiKey: '',
            orgId: 1,
            enabled: false
          },
          isConfigured: false
        }
      })
    }
  } catch (error) {
    console.error('获取Grafana配置失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取Grafana配置失败'
    }, { status: 500 })
  }
}

// 保存Grafana配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serverUrl, username, password, apiKey, orgId, enabled } = body

    if (!serverUrl) {
      return NextResponse.json({
        success: false,
        error: '服务器地址不能为空'
      }, { status: 400 })
    }

    const db = await getDatabase()

    // 加密敏感信息
    const encryptedPassword = password ? encrypt(password) : null
    const encryptedApiKey = apiKey ? encrypt(apiKey) : null

    // 检查是否已存在配置
    const existing = await db.get('SELECT id FROM grafana_config WHERE id = 1')

    if (existing) {
      // 更新配置
      await db.run(`
        UPDATE grafana_config
        SET serverUrl = ?, username = ?, password = ?, apiKey = ?, orgId = ?, enabled = ?, updatedAt = datetime('now')
        WHERE id = 1
      `, [serverUrl, username, encryptedPassword, encryptedApiKey, orgId || 1, enabled ? 1 : 0])
    } else {
      // 创建新配置
      await db.run(`
        INSERT INTO grafana_config (id, serverUrl, username, password, apiKey, orgId, enabled, createdAt, updatedAt)
        VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [serverUrl, username, encryptedPassword, encryptedApiKey, orgId || 1, enabled ? 1 : 0])
    }

    return NextResponse.json({
      success: true,
      message: 'Grafana配置保存成功'
    })
  } catch (error) {
    console.error('保存Grafana配置失败:', error)
    return NextResponse.json({
      success: false,
      error: '保存Grafana配置失败'
    }, { status: 500 })
  }
}

// 测试Grafana连接
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { serverUrl, username, password, apiKey } = body

    if (!serverUrl) {
      return NextResponse.json({
        success: false,
        error: '服务器地址不能为空'
      }, { status: 400 })
    }

    // 构建Grafana API URL
    const grafanaUrl = `${serverUrl}/api/org`

    // 准备认证信息
    const auth = apiKey
      ? `Bearer ${apiKey}`
      : password
      ? `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      : null

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (auth) {
      headers['Authorization'] = auth
    }

    // 测试连接
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(grafanaUrl, {
      method: 'GET',
      headers,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: `连接测试成功！组织: ${data.name || '未知'}`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: `连接失败: ${response.status} ${response.statusText}`
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Grafana连接测试失败:', error)
    return NextResponse.json({
      success: false,
      error: `连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 })
  }
}
