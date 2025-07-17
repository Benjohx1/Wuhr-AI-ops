'use client'

import React, { useState, useEffect } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import ServerCard from '../../components/servers/ServerCard'
import AddServerModal from '../../components/servers/AddServerModal'
import EditServerModal from '../../components/servers/EditServerModal'
import ServerDetailModal from '../../components/servers/ServerDetailModal'
import {
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Card,
  Statistic,
  Badge,
  Tag,
  Spin,
  Empty,
  message
} from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  FilterOutlined,
  DesktopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'

import { ServerInfo } from '../../types/access-management'
import { useAuth } from '../../hooks/useAuth'

const { Option } = Select

const ServerListPage: React.FC = () => {
  // 移除useServerData hook，只使用真实数据库数据
  const [loading] = useState(false) // 保留loading状态用于兼容性
  const { } = useAuth() // 保持认证状态检查

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [locationFilter, setLocationFilter] = useState('')
  const [filteredServers, setFilteredServers] = useState<ServerInfo[]>([])

  const [testConnectionLoading, setTestConnectionLoading] = useState<string | null>(null)
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, 'success' | 'error' | null>>({})
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [editingServer, setEditingServer] = useState<ServerInfo | null>(null)
  const [viewingServer, setViewingServer] = useState<ServerInfo | null>(null)
  const [realServers, setRealServers] = useState<ServerInfo[]>([])
  const [realLoading, setRealLoading] = useState(false)

  // 获取真实服务器数据
  const fetchRealServers = async () => {
    try {
      setRealLoading(true)
      const response = await fetch('/api/admin/servers')

      if (!response.ok) {
        throw new Error('获取服务器列表失败')
      }

      const result = await response.json()
      setRealServers(result.data.servers || [])
    } catch (error) {
      console.error('获取服务器列表失败:', error)
      message.error('获取服务器列表失败，使用模拟数据')
      // 如果API失败，使用模拟数据作为后备
      setRealServers([])
    } finally {
      setRealLoading(false)
    }
  }

  // 页面加载时获取服务器数据
  useEffect(() => {
    fetchRealServers()
  }, [])

  // 只使用真实数据库数据
  const allServers = React.useMemo(() => realServers, [realServers])

  // 获取统计信息（基于真实数据）
  const stats = React.useMemo(() => {
    return realServers.reduce((acc, server) => {
      acc.total++
      acc[server.status]++
      return acc
    }, {
      total: 0,
      online: 0,
      offline: 0,
      warning: 0,
      error: 0
    })
  }, [realServers])

  // 获取所有唯一的标签
  const allTags = React.useMemo(() =>
    Array.from(new Set(allServers.flatMap(server => server.tags))),
    [allServers]
  )

  // 获取所有唯一的位置
  const allLocations = React.useMemo(() =>
    Array.from(new Set(allServers.map(server => server.location))),
    [allServers]
  )

  // 应用筛选
  useEffect(() => {
    let filtered = allServers

    if (statusFilter.length > 0) {
      filtered = filtered.filter(server => statusFilter.includes(server.status))
    }

    if (tagFilter.length > 0) {
      filtered = filtered.filter(server =>
        tagFilter.some(tag => server.tags.includes(tag))
      )
    }

    if (locationFilter) {
      filtered = filtered.filter(server =>
        server.location?.includes(locationFilter)
      )
    }

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(server =>
        server.name.toLowerCase().includes(searchLower) ||
        server.hostname.toLowerCase().includes(searchLower) ||
        server.ip.includes(searchLower) ||
        server.description?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredServers(filtered)
  }, [allServers, searchQuery, statusFilter, tagFilter, locationFilter])

  // 清除筛选
  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter([])
    setTagFilter([])
    setLocationFilter('')
  }





  // 查看主机详情
  const handleViewServer = (server: ServerInfo) => {
    setViewingServer(server)
    setDetailModalVisible(true)
  }

  // 编辑主机
  const handleEditServer = (server: ServerInfo) => {
    setEditingServer(server)
    setEditModalVisible(true)
  }

  // 添加主机成功回调
  const handleAddServerSuccess = (newServer: ServerInfo) => {
    setRealServers(prev => [newServer, ...prev])
    message.success(`主机 "${newServer.name}" 添加成功`)
  }

  // 编辑主机成功回调
  const handleEditServerSuccess = (updatedServer: ServerInfo) => {
    setRealServers(prev => prev.map(server =>
      server.id === updatedServer.id ? updatedServer : server
    ))
    message.success(`主机 "${updatedServer.name}" 更新成功`)
  }

  // 删除主机成功回调
  const handleDeleteServerSuccess = (deletedServerId: string) => {
    setRealServers(prev => prev.filter(server => server.id !== deletedServerId))
    message.success('主机删除成功')
  }

  // 连接测试处理
  const handleTestConnection = async (server: ServerInfo) => {
    try {
      setTestConnectionLoading(server.id)
      setConnectionStatuses(prev => ({ ...prev, [server.id]: null }))

      // 使用新的基于ID的连接测试API
      const response = await fetch(`/api/admin/servers/${server.id}/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 使用cookie认证
      })

      if (response.ok) {
        setConnectionStatuses(prev => ({ ...prev, [server.id]: 'success' }))
        message.success(`主机 "${server.name}" 连接测试成功`)
      } else {
        const errorData = await response.json()
        setConnectionStatuses(prev => ({ ...prev, [server.id]: 'error' }))
        message.error(`主机 "${server.name}" 连接测试失败: ${errorData.error || '未知错误'}`)
      }
    } catch (error) {
      setConnectionStatuses(prev => ({ ...prev, [server.id]: 'error' }))
      message.error(`连接测试失败: ${error}`)
    } finally {
      setTestConnectionLoading(null)
    }
  }



  // 刷新服务器列表
  const handleRefresh = () => {
    fetchRealServers()
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              主机管理
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              管理和监控所有主机的状态和性能
            </p>
          </div>
          <Space>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={realLoading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
            >
              添加主机
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总服务器数"
                value={stats.total}
                prefix={<DesktopOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="在线服务器"
                value={stats.online}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="警告服务器"
                value={stats.warning}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="离线服务器"
                value={stats.offline}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 搜索和筛选 */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">筛选条件</h3>
              <Button 
                type="link" 
                onClick={clearFilters}
                disabled={!searchQuery && !statusFilter.length && !tagFilter.length && !locationFilter}
              >
                清除筛选
              </Button>
            </div>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder="搜索服务器名称、IP或主机名"
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                />
              </Col>
              
              <Col xs={24} sm={12} md={5}>
                <Select
                  mode="multiple"
                  placeholder="服务器状态"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="online">
                    <Badge status="success" text="在线" />
                  </Option>
                  <Option value="offline">
                    <Badge status="error" text="离线" />
                  </Option>
                  <Option value="warning">
                    <Badge status="warning" text="警告" />
                  </Option>
                  <Option value="error">
                    <Badge status="error" text="错误" />
                  </Option>
                </Select>
              </Col>
              
              <Col xs={24} sm={12} md={5}>
                <Select
                  mode="multiple"
                  placeholder="服务器标签"
                  value={tagFilter}
                  onChange={setTagFilter}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {allTags.map(tag => (
                    <Option key={tag} value={tag}>
                      <Tag color="blue">{tag}</Tag>
                    </Option>
                  ))}
                </Select>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="机房位置"
                  value={locationFilter}
                  onChange={setLocationFilter}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {allLocations.map(location => (
                    <Option key={location} value={location}>
                      {location}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </div>
        </Card>

        {/* 服务器列表 */}
        <Card 
          title={
            <div className="flex items-center space-x-2">
              <FilterOutlined />
              <span>主机列表 ({filteredServers.length})</span>
            </div>
          }
        >
          <Spin spinning={loading || realLoading}>
            {filteredServers.length === 0 ? (
              <Empty
                description="没有找到匹配的主机"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Row gutter={[16, 16]}>
                {filteredServers.map(server => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={server.id}>
                    <ServerCard
                      server={server}
                      onView={handleViewServer}
                      onEdit={handleEditServer}
                      onTestConnection={handleTestConnection}
                      testConnectionLoading={testConnectionLoading === server.id}
                      connectionStatus={connectionStatuses[server.id]}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </Spin>
        </Card>

        {/* 添加主机模态框 */}
        <AddServerModal
          visible={addModalVisible}
          onCancel={() => setAddModalVisible(false)}
          onSuccess={handleAddServerSuccess}
        />

        {/* 编辑主机模态框 */}
        <EditServerModal
          visible={editModalVisible}
          server={editingServer}
          onCancel={() => {
            setEditModalVisible(false)
            setEditingServer(null)
          }}
          onSuccess={handleEditServerSuccess}
          onDelete={handleDeleteServerSuccess}
        />

        {/* 主机详情模态框 */}
        <ServerDetailModal
          visible={detailModalVisible}
          server={viewingServer}
          onCancel={() => {
            setDetailModalVisible(false)
            setViewingServer(null)
          }}
          onEdit={(server) => {
            setDetailModalVisible(false)
            setViewingServer(null)
            handleEditServer(server)
          }}
          onTestConnection={handleTestConnection}
        />
      </div>
    </MainLayout>
  )
}

export default ServerListPage