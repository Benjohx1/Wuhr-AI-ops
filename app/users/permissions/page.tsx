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
  Statistic
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SafetyOutlined,
  TeamOutlined,
  SettingOutlined
} from '@ant-design/icons'
import MainLayout from '../../components/layout/MainLayout'

const { Title, Text } = Typography
const { Option } = Select

// 权限数据类型
interface Permission {
  id: string
  name: string
  code: string
  description: string
  category: string
  createdAt: string
  updatedAt: string
}

// 用户角色数据类型
interface UserRole {
  id: string
  userId: string
  username: string
  email: string
  role: string
  permissions: string[]
  isActive: boolean
  createdAt: string
}

// 模拟权限数据
const mockPermissions: Permission[] = [
  {
    id: '1',
    name: '用户管理',
    code: 'users:manage',
    description: '管理系统用户，包括创建、编辑、删除用户',
    category: '用户管理',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '权限管理',
    code: 'permissions:manage',
    description: '管理系统权限，包括分配和撤销权限',
    category: '权限管理',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: '主机管理',
    code: 'servers:manage',
    description: '管理服务器和主机，包括添加、编辑、删除主机',
    category: '主机管理',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: '配置管理',
    code: 'config:manage',
    description: '管理系统配置，包括API密钥、模型配置等',
    category: '配置管理',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'AI助手使用',
    code: 'ai:use',
    description: '使用AI助手功能，基于kubelet-wuhrai的智能运维助手',
    category: 'AI功能',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

// 模拟用户角色数据
const mockUserRoles: UserRole[] = [
  {
    id: '1',
    userId: 'user1',
    username: 'superadmin',
    email: 'superadmin@example.com',
    role: '超级管理员',
    permissions: ['users:manage', 'permissions:manage', 'servers:manage', 'config:manage', 'ai:use'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    userId: 'user2',
    username: 'admin',
    email: 'admin@example.com',
    role: '管理员',
    permissions: ['servers:manage', 'config:manage', 'ai:use'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    userId: 'user3',
    username: 'operator',
    email: 'operator@example.com',
    role: '操作员',
    permissions: ['ai:use'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
]

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>(mockPermissions)
  const [userRoles, setUserRoles] = useState<UserRole[]>(mockUserRoles)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('permissions')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Permission | UserRole | null>(null)
  const [form] = Form.useForm()

  // 权限表格列定义
  const permissionColumns = [
    {
      title: '权限名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '权限代码',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag color="green">{text}</Tag>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Permission) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个权限吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 用户角色表格列定义
  const userRoleColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (text: string) => <Tag color="purple">{text}</Tag>
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <Space wrap>
          {permissions.map(permission => (
            <Tag key={permission} color="blue" style={{ fontSize: '12px' }}>
              {permission}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '激活' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: UserRole) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditUserRole(record)}
          >
            编辑权限
          </Button>
          <Popconfirm
            title="确定要删除这个用户角色吗？"
            onConfirm={() => handleDeleteUserRole(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 处理编辑权限
  const handleEdit = (permission: Permission) => {
    setEditingItem(permission)
    form.setFieldsValue(permission)
    setIsModalVisible(true)
  }

  // 处理编辑用户角色
  const handleEditUserRole = (userRole: UserRole) => {
    setEditingItem(userRole)
    form.setFieldsValue(userRole)
    setIsModalVisible(true)
  }

  // 处理删除权限
  const handleDelete = (id: string) => {
    setPermissions(permissions.filter(p => p.id !== id))
    message.success('权限删除成功')
  }

  // 处理删除用户角色
  const handleDeleteUserRole = (id: string) => {
    setUserRoles(userRoles.filter(ur => ur.id !== id))
    message.success('用户角色删除成功')
  }

  // 处理添加新项
  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      
      if (activeTab === 'permissions') {
        if (editingItem) {
          // 编辑权限
          setPermissions(permissions.map(p => 
            p.id === (editingItem as Permission).id 
              ? { ...p, ...values, updatedAt: new Date().toISOString() }
              : p
          ))
          message.success('权限更新成功')
        } else {
          // 添加新权限
          const newPermission: Permission = {
            id: Date.now().toString(),
            ...values,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          setPermissions([...permissions, newPermission])
          message.success('权限添加成功')
        }
      } else {
        if (editingItem) {
          // 编辑用户角色
          setUserRoles(userRoles.map(ur => 
            ur.id === (editingItem as UserRole).id 
              ? { ...ur, ...values }
              : ur
          ))
          message.success('用户权限更新成功')
        } else {
          // 添加新用户角色
          const newUserRole: UserRole = {
            id: Date.now().toString(),
            userId: `user${Date.now()}`,
            ...values,
            createdAt: new Date().toISOString()
          }
          setUserRoles([...userRoles, newUserRole])
          message.success('用户角色添加成功')
        }
      }
      
      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('操作失败，请重试')
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
            权限管理
          </Title>
          <Text type="secondary">
            管理系统权限和用户角色分配
          </Text>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总权限数"
              value={permissions.length}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="用户角色数"
              value={userRoles.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="激活用户"
              value={userRoles.filter(ur => ur.isActive).length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="权限分类"
              value={new Set(permissions.map(p => p.category)).size}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 标签页切换 */}
      <Card>
        <div className="mb-4">
          <Space>
            <Button 
              type={activeTab === 'permissions' ? 'primary' : 'default'}
              onClick={() => setActiveTab('permissions')}
            >
              权限管理
            </Button>
            <Button 
              type={activeTab === 'userRoles' ? 'primary' : 'default'}
              onClick={() => setActiveTab('userRoles')}
            >
              用户权限
            </Button>
          </Space>
          <div className="float-right">
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              {activeTab === 'permissions' ? '添加权限' : '分配权限'}
            </Button>
          </div>
        </div>

        {/* 权限管理表格 */}
        {activeTab === 'permissions' && (
          <Table
            columns={permissionColumns}
            dataSource={permissions}
            rowKey="id"
            loading={loading}
            pagination={{
              total: permissions.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        )}

        {/* 用户权限表格 */}
        {activeTab === 'userRoles' && (
          <Table
            columns={userRoleColumns}
            dataSource={userRoles}
            rowKey="id"
            loading={loading}
            pagination={{
              total: userRoles.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        )}
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={
          activeTab === 'permissions' 
            ? (editingItem ? '编辑权限' : '添加权限')
            : (editingItem ? '编辑用户权限' : '分配用户权限')
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {activeTab === 'permissions' ? (
            <>
              <Form.Item
                name="name"
                label="权限名称"
                rules={[{ required: true, message: '请输入权限名称' }]}
              >
                <Input placeholder="请输入权限名称" />
              </Form.Item>
              <Form.Item
                name="code"
                label="权限代码"
                rules={[{ required: true, message: '请输入权限代码' }]}
              >
                <Input placeholder="例如：users:manage" />
              </Form.Item>
              <Form.Item
                name="category"
                label="权限分类"
                rules={[{ required: true, message: '请选择权限分类' }]}
              >
                <Select placeholder="请选择权限分类">
                  <Option value="用户管理">用户管理</Option>
                  <Option value="权限管理">权限管理</Option>
                  <Option value="主机管理">主机管理</Option>
                  <Option value="配置管理">配置管理</Option>
                  <Option value="AI功能">AI功能</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="description"
                label="权限描述"
                rules={[{ required: true, message: '请输入权限描述' }]}
              >
                <Input.TextArea rows={3} placeholder="请输入权限描述" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" disabled={!!editingItem} />
              </Form.Item>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" disabled={!!editingItem} />
              </Form.Item>
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
              <Form.Item
                name="permissions"
                label="权限"
                rules={[{ required: true, message: '请选择权限' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择权限"
                  options={permissions.map(p => ({
                    label: `${p.name} (${p.code})`,
                    value: p.code
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="isActive"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value={true}>激活</Option>
                  <Option value={false}>禁用</Option>
                </Select>
              </Form.Item>
            </>
          )}
          
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingItem ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      </div>
    </MainLayout>
  )
}
