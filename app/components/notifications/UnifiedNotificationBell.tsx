'use client'

import React, { useState, useEffect } from 'react'
import { Badge, Dropdown, List, Button, Empty, Spin, message, Typography, Tabs, Divider } from 'antd'
import { BellOutlined, CheckOutlined, DeleteOutlined, EyeOutlined, CloseOutlined, CloseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'

const { Text } = Typography
const { TabPane } = Tabs

interface InfoNotification {
  id: string
  type: string
  title: string
  content: string
  isRead: boolean
  actionUrl?: string
  actionText?: string
  metadata?: any
  createdAt: string
}

interface ApprovalNotification {
  id: string
  type: 'user_registration' | 'cicd_approval' | 'jenkins_job'
  title: string
  message: string
  data: any
  createdAt: string
  canApprove: boolean
}

interface UnifiedNotificationBellProps {
  className?: string
}

const UnifiedNotificationBell: React.FC<UnifiedNotificationBellProps> = ({ 
  className = ''
}) => {
  const { user } = useAuth()
  const [infoNotifications, setInfoNotifications] = useState<InfoNotification[]>([])
  const [approvalNotifications, setApprovalNotifications] = useState<ApprovalNotification[]>([])
  const [infoUnreadCount, setInfoUnreadCount] = useState(0)
  const [approvalUnreadCount, setApprovalUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('info')

  // 获取信息通知
  const fetchInfoNotifications = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/notifications/info?limit=10&includeRead=false')
      const data = await response.json()
      
      if (data.success) {
        setInfoNotifications(data.data.notifications || [])
        setInfoUnreadCount(data.data.unreadCount || 0)
        
        // 处理离线通知
        if (data.data.offlineNotifications?.length > 0) {
          console.log('📬 收到离线信息通知:', data.data.offlineNotifications.length)
        }
      }
    } catch (error) {
      console.error('获取信息通知失败:', error)
    }
  }

  // 获取审批通知
  const fetchApprovalNotifications = async () => {
    if (!user) return

    try {
      // 同时获取Jenkins审批任务和信息通知中的审批通知
      const [pendingApprovalsResponse, infoNotificationsResponse] = await Promise.all([
        fetch('/api/notifications/pending-approvals'),
        fetch('/api/notifications/info?type=approval&limit=20&includeRead=false')
      ])

      const pendingApprovalsData = await pendingApprovalsResponse.json()
      const infoNotificationsData = await infoNotificationsResponse.json()

      let allApprovalNotifications: any[] = []
      let totalUnreadCount = 0

      // 添加Jenkins审批任务
      if (pendingApprovalsData.success) {
        allApprovalNotifications = [...(pendingApprovalsData.data.notifications || [])]
        totalUnreadCount += pendingApprovalsData.data.total || 0
      }

      // 添加信息通知中的审批通知
      if (infoNotificationsData.success) {
        const approvalInfoNotifications = (infoNotificationsData.data.notifications || [])
          .filter((n: any) => n.category === 'approval')
          .map((n: any) => ({
            ...n,
            // 转换为审批通知格式
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.content,
            data: n.metadata || {},
            createdAt: n.createdAt,
            canApprove: true
          }))

        allApprovalNotifications = [...allApprovalNotifications, ...approvalInfoNotifications]
        totalUnreadCount += infoNotificationsData.data.unreadApprovalCount || 0
      }

      // 去重（基于ID）
      const uniqueNotifications = allApprovalNotifications.filter((notification, index, self) =>
        index === self.findIndex(n => n.id === notification.id)
      )

      // 按时间排序
      uniqueNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setApprovalNotifications(uniqueNotifications.slice(0, 10)) // 限制显示数量
      setApprovalUnreadCount(totalUnreadCount)

    } catch (error) {
      console.error('获取审批通知失败:', error)
    }
  }

  // 获取所有通知
  const fetchAllNotifications = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchInfoNotifications(),
        fetchApprovalNotifications()
      ])
    } finally {
      setLoading(false)
    }
  }

  // 标记信息通知为已读
  const markInfoNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/info', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'markAsRead',
          notificationIds: [notificationId]
        })
      })

      if (response.ok) {
        setInfoNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          ).filter(n => !n.isRead)
        )
        setInfoUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  // 处理审批操作
  const handleApprovalAction = async (notification: ApprovalNotification, action: 'approve' | 'reject', comment?: string) => {
    try {
      const response = await fetch('/api/notifications/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationId: notification.id,
          action,
          comment
        })
      })

      const data = await response.json()
      if (data.success) {
        message.success(`审批${action === 'approve' ? '通过' : '拒绝'}成功`)
        fetchApprovalNotifications() // 刷新审批通知
      } else {
        message.error(data.error || '审批操作失败')
      }
    } catch (error) {
      console.error('审批操作失败:', error)
      message.error('审批操作失败')
    }
  }

  // 处理信息通知查看
  const handleInfoNotificationView = (notification: InfoNotification) => {
    if (!notification.isRead) {
      markInfoNotificationAsRead(notification.id)
    }

    // 如果有特定的操作链接，跳转到该链接，否则跳转到通知管理页面
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    } else {
      window.location.href = '/notifications'
    }
  }

  // 处理信息通知忽略
  const handleInfoNotificationIgnore = async (notification: InfoNotification) => {
    try {
      // 标记为已读
      if (!notification.isRead) {
        await markInfoNotificationAsRead(notification.id)
      }

      // 从列表中移除
      setInfoNotifications(prev => prev.filter(n => n.id !== notification.id))
      setInfoUnreadCount(prev => Math.max(0, prev - 1))

      message.success('通知已忽略')
    } catch (error) {
      console.error('忽略通知失败:', error)
      message.error('操作失败')
    }
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else {
      return `${days}天前`
    }
  }

  // 获取通知类型图标
  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'jenkins_submit': '📋',
      'jenkins_approve': '✅',
      'jenkins_reject': '❌',
      'jenkins_execute': '🚀',
      'jenkins_complete': '🎉',
      'user_registration': '👤',
      'cicd_approval': '🔄',
      'system_info': 'ℹ️',
      'system_warning': '⚠️',
      'system_error': '🚨'
    }
    return iconMap[type] || '📬'
  }

  // 建立实时通知连接
  useEffect(() => {
    if (!user) return

    let eventSource: EventSource | null = null

    const connectRealtime = () => {
      eventSource = new EventSource('/api/notifications/realtime')
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'info_notification') {
            setInfoNotifications(prev => [data.data, ...prev.slice(0, 9)])
            setInfoUnreadCount(prev => prev + 1)
          } else if (data.type === 'approval_update') {
            // 审批状态更新，重新获取审批通知
            console.log('📬 收到审批更新通知，刷新审批数据')
            fetchApprovalNotifications()
          }
        } catch (error) {
          console.error('解析实时通知失败:', error)
        }
      }

      eventSource.onerror = () => {
        eventSource?.close()
        setTimeout(connectRealtime, 5000)
      }
    }

    connectRealtime()

    return () => {
      eventSource?.close()
    }
  }, [user])

  // 初始加载通知
  useEffect(() => {
    fetchAllNotifications()
  }, [user])

  const totalUnreadCount = infoUnreadCount + approvalUnreadCount

  // 下拉菜单内容
  const dropdownContent = (
    <div style={{ width: 400, maxHeight: 500, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Text strong>通知中心</Text>
      </div>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="small"
        style={{ padding: '0 16px' }}
      >
        <TabPane 
          tab={
            <span>
              信息通知
              {infoUnreadCount > 0 && (
                <Badge count={infoUnreadCount} size="small" style={{ marginLeft: 8 }} />
              )}
            </span>
          } 
          key="info"
        >
          <div style={{ maxHeight: 300, overflowY: 'auto', margin: '0 -16px' }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <Spin />
              </div>
            ) : infoNotifications.length === 0 ? (
              <Empty 
                description="暂无信息通知" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: 20 }}
              />
            ) : (
              <List
                dataSource={infoNotifications}
                renderItem={(notification) => (
                  <List.Item
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f5f5f5'
                    }}
                    actions={[
                      <Button
                        key="view"
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleInfoNotificationView(notification)
                        }}
                      >
                        查看
                      </Button>,
                      <Button
                        key="ignore"
                        type="link"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleInfoNotificationIgnore(notification)
                        }}
                        style={{ color: '#999' }}
                      >
                        忽略
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<span style={{ fontSize: 16 }}>{getNotificationIcon(notification.type)}</span>}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: 13 }}>{notification.title}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {formatTime(notification.createdAt)}
                          </Text>
                        </div>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {notification.content}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              审批通知
              {approvalUnreadCount > 0 && (
                <Badge count={approvalUnreadCount} size="small" style={{ marginLeft: 8 }} />
              )}
            </span>
          } 
          key="approval"
        >
          <div style={{ maxHeight: 300, overflowY: 'auto', margin: '0 -16px' }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <Spin />
              </div>
            ) : approvalNotifications.length === 0 ? (
              <Empty 
                description="暂无审批通知" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: 20 }}
              />
            ) : (
              <List
                dataSource={approvalNotifications}
                renderItem={(notification) => (
                  <List.Item
                    style={{ 
                      padding: '12px 16px',
                      borderBottom: '1px solid #f5f5f5'
                    }}
                    actions={notification.canApprove ? [
                      <Button
                        key="approve"
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleApprovalAction(notification, 'approve')}
                      >
                        通过
                      </Button>,
                      <Button
                        key="reject"
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleApprovalAction(notification, 'reject')}
                      >
                        拒绝
                      </Button>
                    ] : []}
                  >
                    <List.Item.Meta
                      avatar={<span style={{ fontSize: 16 }}>{getNotificationIcon(notification.type)}</span>}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: 13 }}>{notification.title}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {formatTime(notification.createdAt)}
                          </Text>
                        </div>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {notification.message}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </TabPane>
      </Tabs>
      
      <Divider style={{ margin: '8px 0' }} />
      <div style={{ padding: '8px 16px', textAlign: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <Button type="link" size="small" href="/notifications">
          查看全部通知
        </Button>
        <Button type="link" size="small" href="/cicd/approvals">
          查看审批管理
        </Button>
      </div>
    </div>
  )

  return (
    <Dropdown
      overlay={dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      open={dropdownVisible}
      onOpenChange={setDropdownVisible}
    >
      <Badge count={totalUnreadCount} size="small">
        <BellOutlined
          className={`text-xl cursor-pointer transition-colors ${className}`}
          onClick={() => setDropdownVisible(!dropdownVisible)}
        />
      </Badge>
    </Dropdown>
  )
}

export default UnifiedNotificationBell
