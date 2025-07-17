import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/apiHelpers-new'

// 测试模型API连接
export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const body = await request.json()
    const { provider, modelName, apiKey, baseUrl } = body

    if (!provider || !modelName || !apiKey) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 根据不同提供商测试API连接
    let testResult: { success: boolean; error?: string; responseTime?: number }

    const startTime = Date.now()

    try {
      switch (provider) {
        case 'openai-compatible':
          testResult = await testOpenAICompatible(apiKey, baseUrl, modelName)
          break
        case 'deepseek':
          testResult = await testDeepSeek(apiKey, modelName)
          break
        case 'gemini':
          testResult = await testGemini(apiKey, modelName)
          break
        case 'qwen':
          testResult = await testQwen(apiKey, modelName)
          break
        case 'doubao':
          testResult = await testDoubao(apiKey, modelName)
          break
        default:
          testResult = { success: false, error: '不支持的提供商' }
      }

      testResult.responseTime = Date.now() - startTime

      return NextResponse.json(testResult)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: (error as Error).message,
        responseTime: Date.now() - startTime
      })
    }
  } catch (error) {
    console.error('测试模型API失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 测试OpenAI兼容API
async function testOpenAICompatible(apiKey: string, baseUrl: string, modelName: string) {
  const url = baseUrl ? `${baseUrl}/chat/completions` : 'https://api.openai.com/v1/chat/completions'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
      temperature: 0.1
    })
  })

  if (response.ok) {
    return { success: true }
  } else {
    const error = await response.text()
    return { success: false, error: `HTTP ${response.status}: ${error}` }
  }
}

// 测试DeepSeek API
async function testDeepSeek(apiKey: string, modelName: string) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
      temperature: 0.1
    })
  })

  if (response.ok) {
    return { success: true }
  } else {
    const error = await response.text()
    return { success: false, error: `HTTP ${response.status}: ${error}` }
  }
}

// 测试Gemini API
async function testGemini(apiKey: string, modelName: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: 'Hello' }]
      }],
      generationConfig: {
        maxOutputTokens: 5,
        temperature: 0.1
      }
    })
  })

  if (response.ok) {
    return { success: true }
  } else {
    const error = await response.text()
    return { success: false, error: `HTTP ${response.status}: ${error}` }
  }
}

// 测试Qwen API
async function testQwen(apiKey: string, modelName: string) {
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      input: {
        messages: [{ role: 'user', content: 'Hello' }]
      },
      parameters: {
        max_tokens: 5,
        temperature: 0.1
      }
    })
  })

  if (response.ok) {
    return { success: true }
  } else {
    const error = await response.text()
    return { success: false, error: `HTTP ${response.status}: ${error}` }
  }
}

// 测试Doubao API
async function testDoubao(apiKey: string, modelName: string) {
  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
      temperature: 0.1
    })
  })

  if (response.ok) {
    return { success: true }
  } else {
    const error = await response.text()
    return { success: false, error: `HTTP ${response.status}: ${error}` }
  }
}
