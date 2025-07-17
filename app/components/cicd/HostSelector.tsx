'use client'

import React, { useState, useEffect } from 'react'
import { 
  Form, 
  Select, 
  Card, 
  Typography, 
  Space, 
  Tag, 
  Alert,
  Spin,
  Empty,
  Button,
  Tooltip
} from 'antd'
import {
  CloudServerOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { ServerInfo } from '../../types/server'

const { Text, Title } = Typography
const { Option } = Select

interface HostSelectorProps {
  form: any
  selectedServerId?: string
  onServerSelect?: (serverId: string | undefined, serverInfo: ServerInfo | null) => void
}

const HostSelector: React.FC<HostSelectorProps> = ({
  form,
  selectedServerId,
  onServerSelect
}) => {
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null)

  // 获取主机列表
  const fetchServers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/servers')
      const result = await response.json()

      if (result.success) {
        setServers(result.data.servers || [])
      } else {
        console.error('获取主机列表失败:', result.error)
      }
    } catch (error) {
      console.error('获取主机列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时获取主机列表
  useEffect(() => {
    fetchServers()
  }, [])

  // 当选中的服务器ID变化时，更新选中的服务器信息
  useEffect(() => {
    if (selectedServerId && servers.length > 0) {
      const server = servers.find(s => s.id === selectedServerId)
      setSelectedServer(server || null)
    } else {
      setSelectedServer(null)
    }
  }, [selectedServerId, servers])

  // 处理主机选择
  const handleServerSelect = (serverId: string | undefined) => {
    const server = serverId ? servers.find(s => s.id === serverId) : null
    setSelectedServer(server || null)
    onServerSelect?.(serverId, server || null)
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success'
      case 'offline': return 'default'
      case 'warning': return 'warning'
      case 'error': return 'error'
      default: return 'default'
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '在线'
      case 'offline': return '离线'
      case 'warning': return '警告'
      case 'error': return '错误'
      default: return '未知'
    }
  }

  // 渲染主机选项
  const renderServerOption = (server: ServerInfo) => (
    <Option key={server.id} value={server.id}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <CloudServerOutlined />
          <span>{server.name}</span>
          <Text type="secondary">({server.ip})</Text>
        </Space>
        <Tag color={getStatusColor(server.status)}>
          {getStatusText(server.status)}
        </Tag>
      </div>
    </Option>
  )

  // 渲染选中主机的详细信息
  const renderSelectedServerInfo = () => {
    if (!selectedServer) return null

    return (
      <Card size="small" style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Space>
            {selectedServer.status === 'online' ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            )}
            <Text strong>选中主机信息</Text>
          </Space>
        </div>

        <div style={{ marginBottom: 8 }}>
          <Text strong>主机名称: </Text>
          <Text>{selectedServer.name}</Text>
        </div>

        <div style={{ marginBottom: 8 }}>
          <Text strong>主机地址: </Text>
          <Text code>{selectedServer.ip}:{selectedServer.port}</Text>
        </div>

        <div style={{ marginBottom: 8 }}>
          <Text strong>操作系统: </Text>
          <Text>{selectedServer.os} {selectedServer.version}</Text>
        </div>

        <div style={{ marginBottom: 8 }}>
          <Text strong>位置: </Text>
          <Text>{selectedServer.location}</Text>
        </div>

        {selectedServer.tags && selectedServer.tags.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <Text strong>标签: </Text>
            <Space wrap>
              {selectedServer.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </div>
        )}

        <div>
          <Text strong>状态: </Text>
          <Tag color={getStatusColor(selectedServer.status)}>
            {getStatusText(selectedServer.status)}
          </Tag>
        </div>

        {selectedServer.status !== 'online' && (
          <Alert
            message="主机状态异常"
            description="选中的主机当前不在线，可能会影响部署操作。建议选择在线状态的主机。"
            type="warning"
            style={{ marginTop: 12 }}
          />
        )}
      </Card>
    )
  }

  return (
    <div className="host-selector">
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            <CloudServerOutlined /> 选择部署主机
          </Title>
          <Tooltip title="刷新主机列表">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={fetchServers}
              loading={loading}
            />
          </Tooltip>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
          选择项目部署的目标主机，建议选择在线状态的主机
        </Text>
      </div>

      <Form.Item
        name="serverId"
        label="目标主机"
        rules={[
          { required: false, message: '请选择部署主机' }
        ]}
      >
        <Select
          placeholder="选择部署主机（可选）"
          allowClear
          loading={loading}
          onChange={handleServerSelect}
          notFoundContent={
            loading ? <Spin size="small" /> : 
            servers.length === 0 ? (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无可用主机"
              />
            ) : null
          }
        >
          {servers.map(renderServerOption)}
        </Select>
      </Form.Item>

      {servers.length === 0 && !loading && (
        <Alert
          message="暂无可用主机"
          description="请先在主机管理模块中添加主机，然后再创建项目。"
          type="info"
          showIcon
          style={{ marginTop: 8 }}
        />
      )}

      {renderSelectedServerInfo()}

      <Alert
        message="提示"
        description="选择主机是可选的。如果不选择主机，项目将使用默认的本地环境进行构建和部署。"
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </div>
  )
}

export default HostSelector
