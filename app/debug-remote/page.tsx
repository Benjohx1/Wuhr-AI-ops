'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Select, Input, message, Space, Typography, Alert } from 'antd'

const { Title, Text } = Typography

interface Server {
  id: string
  name: string
  ip: string
  port: number
  status: string
}

export default function DebugRemote() {
  const [servers, setServers] = useState<Server[]>([])
  const [selectedServerId, setSelectedServerId] = useState<string>('')
  const [testMessage, setTestMessage] = useState('hostname && whoami && pwd')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  // 获取服务器列表
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch('/api/admin/servers', {
          credentials: 'include'
        })
        const data = await response.json()
        if (data.success) {
          setServers(data.servers)
        }
      } catch (error) {
        console.error('获取服务器列表失败:', error)
      }
    }
    fetchServers()
  }, [])

  // 测试健康检查
  const testHealthCheck = async () => {
    if (!selectedServerId) {
      message.warning('请选择服务器')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/remote/health-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ hostId: selectedServerId })
      })

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        message.success('健康检查通过')
      } else {
        message.error(`健康检查失败: ${data.error}`)
      }
    } catch (error) {
      message.error('健康检查请求失败')
      setResult({ error: error instanceof Error ? error.message : '未知错误' })
    } finally {
      setLoading(false)
    }
  }

  // 测试远程kubelet-wuhrai执行
  const testRemoteKubelet = async () => {
    if (!selectedServerId) {
      message.warning('请选择服务器')
      return
    }

    if (!apiKey) {
      message.warning('请输入API密钥')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/remote/kubelet-wuhrai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          hostId: selectedServerId,
          message: testMessage,
          model: 'deepseek-chat',
          apiKey: apiKey,
          provider: 'deepseek'
        })
      })

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        message.success('远程kubelet-wuhrai执行成功')
      } else {
        message.error(`远程kubelet-wuhrai执行失败: ${data.error}`)
      }
    } catch (error) {
      message.error('远程kubelet-wuhrai请求失败')
      setResult({ error: error instanceof Error ? error.message : '未知错误' })
    } finally {
      setLoading(false)
    }
  }

  // 测试通过AI助手接口的远程执行
  const testSystemChatRemote = async () => {
    if (!selectedServerId) {
      message.warning('请选择服务器')
      return
    }

    if (!apiKey) {
      message.warning('请输入API密钥')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/system/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          message: testMessage,
          model: 'deepseek-chat',
          apiKey: apiKey,
          baseUrl: 'https://api.deepseek.com',
          provider: 'deepseek',
          hostId: selectedServerId, // 直接指定hostId
          autoExecution: true
        })
      })

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        message.success('AI助手远程执行成功')
      } else {
        message.error(`AI助手远程执行失败: ${data.error}`)
      }
    } catch (error) {
      message.error('AI助手远程执行请求失败')
      setResult({ error: error instanceof Error ? error.message : '未知错误' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Title level={2}>远程执行调试工具</Title>
      
      <Card title="配置" className="mb-4">
        <Space direction="vertical" className="w-full">
          <div>
            <Text>选择远程服务器:</Text>
            <Select
              value={selectedServerId}
              onChange={setSelectedServerId}
              className="w-full mt-2"
              placeholder="选择服务器"
              options={servers.map(server => ({
                label: `${server.name} (${server.ip}:${server.port}) - ${server.status}`,
                value: server.id
              }))}
            />
          </div>
          
          <div>
            <Text>测试消息:</Text>
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="mt-2"
              placeholder="输入测试消息"
            />
          </div>
          
          <div>
            <Text>API密钥 (DeepSeek):</Text>
            <Input.Password
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-2"
              placeholder="输入DeepSeek API密钥"
            />
          </div>
        </Space>
      </Card>

      <Card title="测试操作" className="mb-4">
        <Space wrap>
          <Button 
            type="primary" 
            onClick={testHealthCheck}
            loading={loading}
            disabled={!selectedServerId}
          >
            1. 健康检查
          </Button>
          
          <Button 
            type="primary" 
            onClick={testRemoteKubelet}
            loading={loading}
            disabled={!selectedServerId || !apiKey}
          >
            2. 远程kubelet-wuhrai
          </Button>
          
          <Button 
            type="primary" 
            onClick={testSystemChatRemote}
            loading={loading}
            disabled={!selectedServerId || !apiKey}
          >
            3. AI助手远程执行
          </Button>
        </Space>
      </Card>

      {result && (
        <Card title="执行结果">
          <Alert
            type={result.success ? 'success' : 'error'}
            message={result.success ? '执行成功' : '执行失败'}
            description={result.error}
            className="mb-4"
          />
          
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  )
}
