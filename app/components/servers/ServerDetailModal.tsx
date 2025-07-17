'use client'

import React, { useState } from 'react'
import {
  Modal,
  Descriptions,
  Button,
  Space,
  Tag,
  Badge,
  Divider,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Tooltip
} from 'antd'
import {
  EditOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  DesktopOutlined,
  UserOutlined,
  SafetyOutlined,
  TagsOutlined
} from '@ant-design/icons'
import { ServerInfo } from '../../types/access-management'

interface ServerDetailModalProps {
  visible: boolean
  server: ServerInfo | null
  onCancel: () => void
  onEdit?: (server: ServerInfo) => void
  onTestConnection?: (server: ServerInfo) => void
}

const ServerDetailModal: React.FC<ServerDetailModalProps> = ({
  visible,
  server,
  onCancel,
  onEdit,
  onTestConnection
}) => {
  const [testLoading, setTestLoading] = useState(false)

  if (!server) return null

  // 状态颜色映射
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success'
      case 'offline': return 'default'
      case 'warning': return 'warning'
      case 'error': return 'error'
      default: return 'default'
    }
  }

  // 状态文本映射
  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '在线'
      case 'offline': return '离线'
      case 'warning': return '警告'
      case 'error': return '错误'
      default: return '未知'
    }
  }

  // 连接测试
  const handleTestConnection = async () => {
    if (!onTestConnection) return

    setTestLoading(true)
    try {
      await onTestConnection(server)
    } finally {
      setTestLoading(false)
    }
  }

  // 格式化时间
  const formatTime = (date: Date | string | null) => {
    if (!date) return '从未连接'
    const d = new Date(date)
    return d.toLocaleString('zh-CN')
  }

  // 计算运行时间
  const getUptime = () => {
    if (!server.lastConnectedAt) return '未知'
    const now = new Date()
    const lastConnected = new Date(server.lastConnectedAt)
    const diffMs = now.getTime() - lastConnected.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (diffDays > 0) {
      return `${diffDays}天${diffHours}小时前`
    } else if (diffHours > 0) {
      return `${diffHours}小时前`
    } else {
      return '刚刚'
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <DesktopOutlined />
          <span>{server.name}</span>
          <Badge 
            status={getStatusColor(server.status)} 
            text={getStatusText(server.status)}
          />
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          关闭
        </Button>,
        <Button
          key="test"
          icon={<ExperimentOutlined />}
          loading={testLoading}
          onClick={handleTestConnection}
        >
          连接测试
        </Button>,
        onEdit && (
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(server)}
          >
            编辑主机
          </Button>
        )
      ].filter(Boolean)}
    >
      <div className="space-y-6">
        {/* 基本信息统计 */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="主机状态"
                value={getStatusText(server.status)}
                prefix={<Badge status={getStatusColor(server.status)} />}
                valueStyle={{ 
                  color: server.status === 'online' ? '#52c41a' : 
                         server.status === 'warning' ? '#faad14' : 
                         server.status === 'error' ? '#f5222d' : '#8c8c8c'
                }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="SSH端口"
                value={server.port}
                prefix={<SafetyOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="最后连接"
                value={getUptime()}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="标签数量"
                value={server.tags.length}
                prefix={<TagsOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* 详细信息 */}
        <Descriptions title="主机详细信息" bordered column={2}>
          <Descriptions.Item label="主机名称" span={1}>
            <strong>{server.name}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="主机名" span={1}>
            {server.hostname}
          </Descriptions.Item>
          
          <Descriptions.Item label="IP地址" span={1}>
            <code>{server.ip}</code>
          </Descriptions.Item>
          <Descriptions.Item label="SSH端口" span={1}>
            <code>{server.port}</code>
          </Descriptions.Item>
          
          <Descriptions.Item label="操作系统" span={1}>
            <div className="flex items-center space-x-2">
              <DesktopOutlined />
              <span>{server.os}</span>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="系统版本" span={1}>
            {server.version || '未知'}
          </Descriptions.Item>
          
          <Descriptions.Item label="机房位置" span={1}>
            <div className="flex items-center space-x-2">
              <EnvironmentOutlined />
              <span>{server.location}</span>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="SSH用户" span={1}>
            <div className="flex items-center space-x-2">
              <UserOutlined />
              <span>{server.username || '未配置'}</span>
            </div>
          </Descriptions.Item>
          
          <Descriptions.Item label="认证方式" span={2}>
            <Space>
              {server.password && (
                <Tag color="blue">密码认证</Tag>
              )}
              {server.keyPath && (
                <Tag color="green">密钥认证</Tag>
              )}
              {!server.password && !server.keyPath && (
                <Tag color="red">未配置</Tag>
              )}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="主机标签" span={2}>
            <Space wrap>
              {server.tags.map(tag => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
              {server.tags.length === 0 && (
                <span className="text-gray-500">无标签</span>
              )}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="描述信息" span={2}>
            {server.description || (
              <span className="text-gray-500">无描述</span>
            )}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* 时间信息 */}
        <Descriptions title="时间信息" bordered column={2}>
          <Descriptions.Item label="创建时间" span={1}>
            <Tooltip title={formatTime(server.createdAt)}>
              <div className="flex items-center space-x-2">
                <ClockCircleOutlined />
                <span>{formatTime(server.createdAt)}</span>
              </div>
            </Tooltip>
          </Descriptions.Item>
          <Descriptions.Item label="更新时间" span={1}>
            <Tooltip title={formatTime(server.updatedAt)}>
              <div className="flex items-center space-x-2">
                <ReloadOutlined />
                <span>{formatTime(server.updatedAt)}</span>
              </div>
            </Tooltip>
          </Descriptions.Item>
          <Descriptions.Item label="最后连接时间" span={2}>
            <Tooltip title={server.lastConnectedAt ? formatTime(server.lastConnectedAt) : '从未连接'}>
              <div className="flex items-center space-x-2">
                <ExperimentOutlined />
                <span>{server.lastConnectedAt ? formatTime(server.lastConnectedAt) : '从未连接'}</span>
              </div>
            </Tooltip>
          </Descriptions.Item>
        </Descriptions>

        {/* SSH密钥信息 */}
        {server.keyPath && (
          <>
            <Divider />
            <Descriptions title="SSH配置" bordered column={1}>
              <Descriptions.Item label="密钥路径">
                <code>{server.keyPath}</code>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </div>
    </Modal>
  )
}

export default ServerDetailModal
