'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Typography,
  Table,
  Button,
  Space,
  Tag,
  Alert,
  Tabs,
  Input,
  Select,
  DatePicker,
  Popconfirm,
  message,
  Badge,
  Tooltip,
  Empty,
  Spin,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  BellOutlined,
  ReloadOutlined,
  CheckOutlined,
  DeleteOutlined,
  FilterOutlined,
  SearchOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import MainLayout from '../components/layout/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'

const { Title, Paragraph, Text } = Typography
const { TabPane } = Tabs

const NotificationsPage: React.FC = () => {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const router = useRouter()

  const canRead = hasPermission('notifications:read')
  const canWrite = hasPermission('notifications:write')
  const [activeTab, setActiveTab] = useState('unread')
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [stats, setStats] = useState<any>(null)

  // 加载通知数据
  const loadNotifications = async (options: {
    includeRead?: boolean
    page?: number
    pageSize?: number
    type?: string | null
    keyword?: string
  } = {}) => {
    if (!user) return

    const {
      includeRead = activeTab !== 'unread',
      page = currentPage,
      pageSize: size = pageSize,
      type = typeFilter,
      keyword = searchKeyword
    } = options

    setLoading(true)
    try {
      // 构建查询参数
      const params = new URLSearchParams()
      params.append('includeRead', String(includeRead))
      params.append('limit', String(size))
      params.append('offset', String((page - 1) * size))
      
      if (type) {
        params.append('type', type)
      }
      
      if (keyword) {
        params.append('keyword', keyword)
      }

      console.log('📋 [通知管理页面] 请求参数:', params.toString())

      const response = await fetch(`/api/notifications/info?${params.toString()}`)
      const data = await response.json()

      console.log('📋 [通知管理页面] API响应:', {
        status: response.status,
        success: data.success,
        dataKeys: Object.keys(data.data || {}),
        notificationCount: data.data?.notifications?.length || 0,
        total: data.data?.total || 0,
        unreadCount: data.data?.unreadCount || 0
      })

      if (data.success) {
        const notifications = data.data.notifications || []
        setNotifications(notifications)
        setTotal(data.data.total || 0)
        setUnreadCount(data.data.unreadCount || 0)

        console.log('📋 [通知管理页面] 设置通知数据:', {
          notificationCount: notifications.length,
          firstNotification: notifications[0] ? {
            id: notifications[0].id,
            type: notifications[0].type,
            title: notifications[0].title
          } : null
        })

        // 更新统计信息
        setStats({
          total: data.data.total || 0,
          unread: data.data.unreadCount || 0,
          read: (data.data.total || 0) - (data.data.unreadCount || 0),
          todayCount: notifications.filter((n: any) => {
            const date = new Date(n.createdAt)
            const today = new Date()
            return date.toDateString() === today.toDateString()
          }).length || 0
        })
      } else {
        console.error('📋 [通知管理页面] API返回失败:', data.error)
        message.error(`获取通知数据失败: ${data.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('获取通知数据失败:', error)
      message.error('获取通知数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 标记为已读
  const markAsRead = async (notificationIds: string[]) => {
    if (!notificationIds.length) return

    try {
      const response = await fetch('/api/notifications/info', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'markAsRead',
          notificationIds
        })
      })

      const data = await response.json()
      if (data.success) {
        message.success(`已将 ${data.data.count} 条通知标记为已读`)
        loadNotifications()
        setSelectedRowKeys([])
      } else {
        message.error(data.error || '操作失败')
      }
    } catch (error) {
      console.error('标记已读失败:', error)
      message.error('操作失败')
    }
  }

  // 全部标记为已读
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/info', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'markAllAsRead'
        })
      })

      const data = await response.json()
      if (data.success) {
        message.success(`已将 ${data.data.count} 条通知标记为已读`)
        loadNotifications()
        setSelectedRowKeys([])
      } else {
        message.error(data.error || '操作失败')
      }
    } catch (error) {
      console.error('全部标记已读失败:', error)
      message.error('操作失败')
    }
  }

  // 删除通知
  const deleteNotifications = async (notificationIds: string[]) => {
    if (!notificationIds.length) return

    try {
      const response = await fetch('/api/notifications/info', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          notificationIds
        })
      })

      const data = await response.json()
      if (data.success) {
        message.success(`已删除 ${data.data.count} 条通知`)
        loadNotifications()
        setSelectedRowKeys([])
      } else {
        message.error(data.error || '操作失败')
      }
    } catch (error) {
      console.error('删除通知失败:', error)
      message.error('操作失败')
    }
  }

  // 处理表格选择
  const handleTableSelectChange = (selectedKeys: React.Key[]) => {
    setSelectedRowKeys(selectedKeys as string[])
  }

  // 处理通知详情查看
  const handleViewNotificationDetail = (record: any) => {
    try {
      // 如果有actionUrl，使用内部路由导航
      if (record.actionUrl) {
        // 确保是内部路由
        if (record.actionUrl.startsWith('/')) {
          router.push(record.actionUrl)
        } else {
          // 如果是外部链接，在新标签页打开
          window.open(record.actionUrl, '_blank')
        }
      } else {
        // 如果没有actionUrl，显示通知详情
        message.info('通知详情：' + record.content)
      }
    } catch (error) {
      console.error('查看通知详情失败:', error)
      message.error('查看通知详情失败')
    }
  }

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setCurrentPage(1)
    setSelectedRowKeys([])
    loadNotifications({
      includeRead: key !== 'unread',
      page: 1
    })
  }

  // 处理类型筛选
  const handleTypeFilterChange = (value: string | null) => {
    setTypeFilter(value)
    setCurrentPage(1)
    loadNotifications({
      type: value,
      page: 1
    })
  }

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1)
    loadNotifications({
      keyword: searchKeyword,
      page: 1
    })
  }

  // 处理分页变化
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page)
    if (pageSize) setPageSize(pageSize)
    loadNotifications({
      page,
      pageSize: pageSize || undefined
    })
  }

  // 初始加载
  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  // 表格列定义
  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      fixed: 'left' as const,
      render: (type: string) => {
        const typeMap: Record<string, { text: string; color: string }> = {
          'jenkins_submit': { text: 'Jenkins提交', color: 'blue' },
          'jenkins_approve': { text: 'Jenkins通过', color: 'green' },
          'jenkins_reject': { text: 'Jenkins拒绝', color: 'red' },
          'jenkins_execute': { text: 'Jenkins执行', color: 'orange' },
          'jenkins_complete': { text: 'Jenkins完成', color: 'purple' },
          'system_info': { text: '系统信息', color: 'default' }
        }
        const config = typeMap[type] || { text: type, color: 'default' }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      ellipsis: {
        showTitle: false
      },
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '160px'
          }}>
            {text}
          </div>
        </Tooltip>
      )
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 250,
      ellipsis: {
        showTitle: false
      },
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '230px'
          }}>
            {text}
          </div>
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 70,
      render: (isRead: boolean) => (
        <Tag color={isRead ? 'green' : 'orange'}>
          {isRead ? '已读' : '未读'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => (
        <div style={{ fontSize: '12px' }}>
          {new Date(date).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          {!record.isRead && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => markAsRead([record.id])}
              style={{ padding: '0 4px' }}
            >
              已读
            </Button>
          )}
          {record.actionUrl && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewNotificationDetail(record)}
              style={{ padding: '0 4px' }}
            >
              查看
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteNotifications([record.id])}
            style={{ padding: '0 4px' }}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  if (!canRead) {
    return (
      <MainLayout>
        <div className="p-6">
          <Alert
            message="访问受限"
            description="您没有权限访问通知管理功能。"
            type="warning"
            showIcon
          />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <Title level={2} className="mb-2">
            <BellOutlined className="mr-2" />
            通知管理
          </Title>
          <Paragraph className="text-gray-600 mb-0">
            管理系统通知，查看通知历史和状态
          </Paragraph>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card className="glass-card" size="small">
                <Statistic
                  title="未读通知"
                  value={stats.unread}
                  prefix={<Badge status="processing" />}
                  valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card className="glass-card" size="small">
                <Statistic
                  title="已读通知"
                  value={stats.read}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card className="glass-card" size="small">
                <Statistic
                  title="今日通知"
                  value={stats.todayCount}
                  prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1', fontSize: '20px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card className="glass-card" size="small">
                <Statistic
                  title="通知总数"
                  value={stats.total}
                  prefix={<BellOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ color: '#fa8c16', fontSize: '20px' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Card className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ marginBottom: '16px' }}>
            <Tabs activeKey={activeTab} onChange={handleTabChange}>
              <TabPane
                tab={
                  <span>
                    <Badge status="processing" />
                    未读通知 {unreadCount > 0 && `(${unreadCount})`}
                  </span>
                }
                key="unread"
              />
              <TabPane
                tab={
                  <span>
                    <CheckCircleOutlined />
                    已读通知
                  </span>
                }
                key="read"
              />
              <TabPane
                tab={
                  <span>
                    <BellOutlined />
                    全部通知
                  </span>
                }
                key="all"
              />
            </Tabs>
          </div>

          {/* 搜索和操作区域 */}
          <div style={{ marginBottom: '16px' }}>
            <Row gutter={[16, 16]} justify="space-between" align="middle">
              <Col xs={24} sm={24} md={12} lg={14} xl={16}>
                <Space wrap>
                  <Select
                    placeholder="通知类型"
                    style={{ width: 140 }}
                    allowClear
                    onChange={handleTypeFilterChange}
                    value={typeFilter}
                  >
                    <Select.Option value="jenkins_submit">Jenkins提交</Select.Option>
                    <Select.Option value="jenkins_approve">Jenkins通过</Select.Option>
                    <Select.Option value="jenkins_reject">Jenkins拒绝</Select.Option>
                    <Select.Option value="jenkins_execute">Jenkins执行</Select.Option>
                    <Select.Option value="jenkins_complete">Jenkins完成</Select.Option>
                    <Select.Option value="system_info">系统信息</Select.Option>
                  </Select>
                  <Input
                    placeholder="搜索通知内容"
                    style={{ width: 180 }}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onPressEnter={handleSearch}
                    suffix={<SearchOutlined />}
                  />
                  <Button type="primary" onClick={handleSearch}>
                    搜索
                  </Button>
                </Space>
              </Col>
              <Col xs={24} sm={24} md={12} lg={10} xl={8}>
                <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                  {selectedRowKeys.length > 0 && (
                    <>
                      <Button
                        size="small"
                        onClick={() => markAsRead(selectedRowKeys)}
                        icon={<CheckOutlined />}
                      >
                        标记已读
                      </Button>
                      <Popconfirm
                        title="确定要删除选中的通知吗？"
                        onConfirm={() => deleteNotifications(selectedRowKeys)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    </>
                  )}
                  {activeTab === 'unread' && unreadCount > 0 && (
                    <Button
                      size="small"
                      type="primary"
                      onClick={markAllAsRead}
                      icon={<CheckOutlined />}
                    >
                      全部已读
                    </Button>
                  )}
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => loadNotifications()}
                    loading={loading}
                  >
                    刷新
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          <Table
            rowSelection={{
              selectedRowKeys,
              onChange: handleTableSelectChange
            }}
            columns={columns}
            dataSource={notifications}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1050 }} // 设置水平滚动，确保内容不会溢出
            pagination={{
              current: currentPage,
              pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: handlePageChange,
              showTotal: (total) => `共 ${total} 条通知`
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      {activeTab === 'unread'
                        ? '没有未读通知'
                        : activeTab === 'read'
                        ? '没有已读通知'
                        : '没有通知记录'}
                    </span>
                  }
                />
              )
            }}
          />
        </Card>
      </div>
    </MainLayout>
  )
}

export default NotificationsPage
