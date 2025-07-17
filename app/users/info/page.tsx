'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
  Switch,
  Avatar,
  Tooltip,
  Badge
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons'
import MainLayout from '../../components/layout/MainLayout'

const { Title, Text } = Typography
const { Option } = Select

// 用户数据类型
interface User {
  id: string
  username: string
  email: string
  fullName?: string
  phone?: string
  role: string
  permissions: string[]
  isActive: boolean
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: string
  rejectedReason?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  avatar?: string
  department?: string
}

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: 'cmcl8td470000nsgr09t6vwce',
    username: 'superadmin',
    email: 'superadmin@example.com',
    fullName: '超级管理员',
    phone: '13800138000',
    role: '超级管理员',
    isActive: true,
    approvalStatus: 'approved',
    lastLoginAt: '2024-01-03T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-03T10:30:00Z',
    department: '技术部',
    permissions: ['users:manage', 'permissions:manage', 'servers:manage', 'config:manage', 'ai:use']
  },
  {
    id: 'cmcl8npz50000nsrg261hocn4',
    username: 'testuser',
    email: 'testuser@example.com',
    fullName: '测试用户',
    phone: '13800138001',
    role: '普通用户',
    isActive: false,
    approvalStatus: 'pending',
    createdAt: '2024-01-02T08:15:00Z',
    updatedAt: '2024-01-02T08:15:00Z',
    department: '运维部',
    permissions: ['ai:use']
  },
  {
    id: 'user3',
    username: 'admin',
    email: 'admin@example.com',
    fullName: '系统管理员',
    phone: '13800138002',
    role: '管理员',
    isActive: true,
    approvalStatus: 'approved',
    lastLoginAt: '2024-01-03T09:45:00Z',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-03T09:45:00Z',
    department: '技术部',
    permissions: ['servers:manage', 'config:manage', 'ai:use']
  },
  {
    id: 'user4',
    username: 'operator',
    email: 'operator@example.com',
    fullName: '运维操作员',
    phone: '13800138003',
    role: '操作员',
    isActive: true,
    approvalStatus: 'approved',
    lastLoginAt: '2024-01-03T08:20:00Z',
    createdAt: '2024-01-01T16:30:00Z',
    updatedAt: '2024-01-03T08:20:00Z',
    department: '运维部',
    permissions: ['ai:use']
  },
  {
    id: 'user5',
    username: 'suspended_user',
    email: 'suspended@example.com',
    fullName: '已暂停用户',
    role: '普通用户',
    isActive: false,
    approvalStatus: 'approved',
    lastLoginAt: '2024-01-01T15:30:00Z',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-02T14:00:00Z',
    department: '市场部',
    permissions: ['ai:use']
  }
]

export default function UserInfoPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')

      if (!response.ok) {
        throw new Error('获取用户列表失败')
      }

      const result = await response.json()
      setUsers(result.data.users || [])
    } catch (error) {
      console.error('获取用户列表失败:', error)
      message.error('获取用户列表失败，请刷新页面重试')
      // 如果API失败，使用模拟数据作为后备
      setUsers(mockUsers)
    } finally {
      setLoading(false)
    }
  }

  // 页面加载时获取用户数据
  useEffect(() => {
    fetchUsers()
  }, [])

  // 获取状态统计
  const getStatusStats = () => {
    const stats = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      pending: users.filter(u => u.approvalStatus === 'pending').length,
      suspended: users.filter(u => !u.isActive && u.approvalStatus === 'approved').length,
      approved: users.filter(u => u.approvalStatus === 'approved').length
    }
    return stats
  }

  const stats = getStatusStats()

  // 状态渲染
  const renderStatus = (user: User) => {
    if (user.isActive) {
      return (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          正常
        </Tag>
      )
    } else if (user.approvalStatus === 'pending') {
      return (
        <Tag color="orange" icon={<ExclamationCircleOutlined />}>
          待审批
        </Tag>
      )
    } else if (user.approvalStatus === 'rejected') {
      return (
        <Tag color="red" icon={<CloseCircleOutlined />}>
          已拒绝
        </Tag>
      )
    } else {
      return (
        <Tag color="gray" icon={<ExclamationCircleOutlined />}>
          已暂停
        </Tag>
      )
    }
  }

  // 审批状态渲染
  const renderApprovalStatus = (approvalStatus: string) => {
    const statusConfig = {
      approved: { color: 'green', text: '已审批', icon: <CheckCircleOutlined /> },
      pending: { color: 'orange', text: '待审批', icon: <ExclamationCircleOutlined /> },
      rejected: { color: 'red', text: '已拒绝', icon: <CloseCircleOutlined /> }
    }
    const config = statusConfig[approvalStatus as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  // 格式化时间
  const formatTime = (timeString?: string) => {
    if (!timeString) return '-'
    return new Date(timeString).toLocaleString('zh-CN')
  }

  // 用户表格列定义
  const columns = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_: any, record: User) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            size={40} 
            icon={<UserOutlined />} 
            src={record.avatar}
            style={{ backgroundColor: '#1890ff' }}
          >
            {record.fullName?.charAt(0) || record.username.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="font-medium">{record.fullName || record.username}</div>
            <div className="text-sm text-gray-500">@{record.username}</div>
          </div>
        </div>
      )
    },
    {
      title: '联系信息',
      key: 'contact',
      width: 200,
      render: (_: any, record: User) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <MailOutlined className="text-gray-400" />
            <span className="text-sm">{record.email}</span>
          </div>
          {record.phone && (
            <div className="flex items-center space-x-1">
              <PhoneOutlined className="text-gray-400" />
              <span className="text-sm">{record.phone}</span>
            </div>
          )}
        </div>
      )
    },
    {
      title: '角色/部门',
      key: 'roleInfo',
      width: 150,
      render: (_: any, record: User) => (
        <div className="space-y-1">
          <Tag color="purple">{record.role}</Tag>
          {record.department && (
            <div className="text-sm text-gray-500">{record.department}</div>
          )}
        </div>
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_: any, record: User) => (
        <div className="space-y-1">
          {renderStatus(record)}
          {renderApprovalStatus(record.approvalStatus)}
        </div>
      )
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 100,
      render: (permissions: string[]) => (
        <Badge count={permissions.length} showZero color="#1890ff" />
      )
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 150,
      render: (time: string) => (
        <div className="text-sm">
          {time ? (
            <Tooltip title={formatTime(time)}>
              <span>{formatTime(time)}</span>
            </Tooltip>
          ) : (
            <span className="text-gray-400">从未登录</span>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: User) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="link" 
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="编辑用户">
            <Button 
              type="link" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? '暂停用户' : '激活用户'}>
            <Button
              type="link"
              size="small"
              icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
          {record.approvalStatus === 'pending' && (
            <Tooltip title="审批用户">
              <Button
                type="link"
                size="small"
                style={{ color: '#52c41a' }}
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除用户">
              <Button 
                type="link" 
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 处理查看用户详情
  const handleView = (user: User) => {
    Modal.info({
      title: '用户详细信息',
      width: 600,
      content: (
        <div className="space-y-4 mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <div><strong>用户名：</strong>{user.username}</div>
            </Col>
            <Col span={12}>
              <div><strong>姓名：</strong>{user.fullName || '-'}</div>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <div><strong>邮箱：</strong>{user.email}</div>
            </Col>
            <Col span={12}>
              <div><strong>电话：</strong>{user.phone || '-'}</div>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <div><strong>角色：</strong>{user.role}</div>
            </Col>
            <Col span={12}>
              <div><strong>部门：</strong>{user.department || '-'}</div>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <div><strong>状态：</strong>{renderStatus(user)}</div>
            </Col>
            <Col span={12}>
              <div><strong>审批状态：</strong>{renderApprovalStatus(user.approvalStatus)}</div>
            </Col>
          </Row>
          <div>
            <strong>权限列表：</strong>
            <div className="mt-2">
              <Space wrap>
                {user.permissions.map(permission => (
                  <Tag key={permission} color="blue">{permission}</Tag>
                ))}
              </Space>
            </div>
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <div><strong>创建时间：</strong>{formatTime(user.createdAt)}</div>
            </Col>
            <Col span={12}>
              <div><strong>最后登录：</strong>{formatTime(user.lastLoginAt)}</div>
            </Col>
          </Row>
        </div>
      )
    })
  }

  // 处理编辑用户
  const handleEdit = (user: User) => {
    setEditingUser(user)
    form.setFieldsValue({
      ...user,
      isActive: user.isActive,
      approvalStatus: user.approvalStatus
    })
    setIsModalVisible(true)
  }

  // 处理切换用户状态
  const handleToggleStatus = async (user: User) => {
    try {
      setLoading(true)

      // 调用API切换用户状态
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          action: 'toggle_status'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '操作失败')
      }

      const result = await response.json()

      // 更新本地状态
      setUsers(users.map(u =>
        u.id === user.id ? result.data.user : u
      ))

      message.success(result.data.message)
    } catch (error) {
      console.error('切换用户状态失败:', error)
      message.error(error instanceof Error ? error.message : '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理审批用户
  const handleApprove = async (user: User) => {
    try {
      setLoading(true)

      // 调用API审批用户
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          action: 'approve'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '审批失败')
      }

      const result = await response.json()

      // 更新本地状态
      setUsers(users.map(u =>
        u.id === user.id ? result.data.user : u
      ))

      message.success(result.data.message)
    } catch (error) {
      console.error('审批用户失败:', error)
      message.error(error instanceof Error ? error.message : '审批失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理删除用户
  const handleDelete = async (id: string) => {
    try {
      setLoading(true)

      // 调用API删除用户
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '删除失败')
      }

      const result = await response.json()

      // 更新本地状态
      setUsers(users.filter(u => u.id !== id))

      message.success(result.data.message)
    } catch (error) {
      console.error('删除用户失败:', error)
      message.error(error instanceof Error ? error.message : '删除失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理添加新用户
  const handleAdd = () => {
    setEditingUser(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)

      if (editingUser) {
        // 编辑用户 - 调用API更新用户信息
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingUser.id,
            ...values
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '更新失败')
        }

        const result = await response.json()

        // 更新本地状态
        setUsers(users.map(u =>
          u.id === editingUser.id ? result.data.user : u
        ))

        message.success(result.data.message)
      } else {
        // 添加新用户 - 这里应该调用注册API，暂时保持原有逻辑
        const newUser: User = {
          id: Date.now().toString(),
          ...values,
          permissions: values.permissions || ['ai:use'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setUsers([...users, newUser])
        message.success('用户添加成功')
      }

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('提交表单失败:', error)
      message.error(error instanceof Error ? error.message : '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <Title level={2} className="!mb-2">
              用户信息
            </Title>
            <Text type="secondary">
              管理系统中的所有用户信息和状态
            </Text>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加用户
          </Button>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={stats.total}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="正常用户"
                value={stats.active}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待审批用户"
                value={stats.pending}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已暂停用户"
                value={stats.suspended}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 用户列表 */}
        <Card>
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            pagination={{
              total: users.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* 添加/编辑用户模态框 */}
        <Modal
          title={editingUser ? '编辑用户信息' : '添加新用户'}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false)
            form.resetFields()
          }}
          footer={null}
          width={700}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input placeholder="请输入用户名" disabled={!!editingUser} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="fullName"
                  label="姓名"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input placeholder="请输入姓名" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input placeholder="请输入邮箱" disabled={!!editingUser} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="电话"
                  rules={[
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                  ]}
                >
                  <Input placeholder="请输入电话号码" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="role"
                  label="角色"
                  rules={[{ required: true, message: '请选择角色' }]}
                >
                  <Select placeholder="请选择角色">
                    <Option value="超级管理员">超级管理员</Option>
                    <Option value="管理员">管理员</Option>
                    <Option value="操作员">操作员</Option>
                    <Option value="普通用户">普通用户</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="department"
                  label="部门"
                >
                  <Select placeholder="请选择部门" allowClear>
                    <Option value="技术部">技术部</Option>
                    <Option value="运维部">运维部</Option>
                    <Option value="产品部">产品部</Option>
                    <Option value="市场部">市场部</Option>
                    <Option value="人事部">人事部</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="isActive"
                  label="激活状态"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="已激活"
                    unCheckedChildren="已暂停"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="approvalStatus"
                  label="审批状态"
                  rules={[{ required: true, message: '请选择审批状态' }]}
                >
                  <Select placeholder="请选择审批状态">
                    <Option value="pending">待审批</Option>
                    <Option value="approved">已审批</Option>
                    <Option value="rejected">已拒绝</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="permissions"
              label="权限"
              rules={[{ required: true, message: '请选择权限' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择权限"
                options={[
                  { label: '用户管理 (users:manage)', value: 'users:manage' },
                  { label: '权限管理 (permissions:manage)', value: 'permissions:manage' },
                  { label: '主机管理 (servers:manage)', value: 'servers:manage' },
                  { label: '配置管理 (config:manage)', value: 'config:manage' },
                  { label: 'AI助手使用 (ai:use)', value: 'ai:use' }
                ]}
              />
            </Form.Item>

            <Form.Item className="mb-0 text-right">
              <Space>
                <Button onClick={() => setIsModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingUser ? '更新' : '添加'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  )
}
