'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Table,
  Modal,
  Tag,
  Tooltip,
  Popconfirm,
  Empty,
  App,
  Select
} from 'antd'

import {
  SettingOutlined,
  DeleteOutlined,
  LinkOutlined,
  UserOutlined,
  KeyOutlined,
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import MainLayout from '../../components/layout/MainLayout'
import { apiClient } from '../../utils/apiClient'

const { Title, Text } = Typography
const { TextArea } = Input

interface JenkinsConfig {
  id: string
  name: string
  description?: string
  serverUrl: string
  username?: string
  apiToken?: string
  webhookUrl?: string
  testStatus?: 'connected' | 'error' | 'pending'
  lastTestAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}



function JenkinsConfigPageContent() {
  const { message: messageApi } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [configs, setConfigs] = useState<JenkinsConfig[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingConfig, setEditingConfig] = useState<JenkinsConfig | null>(null)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  // 服务器列表相关状态
  const [availableServers, setAvailableServers] = useState<any[]>([])
  const [serversLoading, setServersLoading] = useState(false)













  // 获取服务器列表
  const fetchServers = async () => {
    try {
      setServersLoading(true)
      const response = await apiClient.get('/api/admin/servers')
      const data = response.data as any

      if (data.success) {
        setAvailableServers(data.data.servers || [])
        console.log('✅ 服务器列表获取成功:', data.data.servers?.length || 0, '台服务器')
      } else {
        console.error('获取服务器列表失败:', data.error)
        setAvailableServers([])
      }
    } catch (error: any) {
      console.error('获取服务器列表失败:', error)
      setAvailableServers([])
    } finally {
      setServersLoading(false)
    }
  }

  // 获取Jenkins配置列表
  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/cicd/jenkins')
      const data = response.data as any

      if (data.success) {
        setConfigs(data.data.configs || [])
      }
    } catch (error: any) {
      console.error('获取Jenkins配置失败:', error)
      if (error.response?.status >= 500) {
        messageApi.error('获取Jenkins配置失败')
      }
    } finally {
      setLoading(false)
    }
  }





  // 保存配置
  const handleSave = async (values: any) => {
    try {
      setLoading(true)

      const configResponse = editingConfig
        ? await apiClient.put(`/api/cicd/jenkins/${editingConfig.id}`, values)
        : await apiClient.post('/api/cicd/jenkins', values)

      const configData = configResponse.data as any

      if (configData.success) {
        messageApi.success(editingConfig ? '配置更新成功' : '配置创建成功')
        setModalVisible(false)
        form.resetFields()
        setEditingConfig(null)
        await fetchConfigs()
      } else {
        messageApi.error(configData.error || '保存配置失败')
      }
    } catch (error: any) {
      console.error('保存配置失败:', error)
      messageApi.error('保存配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 测试连接
  const handleTestConnection = async (config: JenkinsConfig) => {
    try {
      setTestingConnection(config.id)

      const response = await apiClient.post(`/api/cicd/jenkins/${config.id}/test`, {
        serverUrl: config.serverUrl,
        username: config.username,
        apiToken: config.apiToken
      })

      const data = response?.data as any

      if (data && data.success) {
        messageApi.success(data.message || '连接测试成功')
        await fetchConfigs() // 刷新配置列表以更新测试状态
      } else {
        const errorMsg = data?.error || '连接测试失败'
        messageApi.error(errorMsg)
      }
    } catch (error: any) {
      let errorMessage = '连接测试失败'

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = `网络错误: ${error.message}`
      }

      messageApi.error(errorMessage)
    } finally {
      setTestingConnection(null)
    }
  }

  // 删除配置
  const handleDelete = async (configId: string) => {
    try {
      setLoading(true)

      const deleteResponse = await apiClient.delete(`/api/cicd/jenkins/${configId}`)
      const deleteData = deleteResponse.data as any

      if (deleteData.success) {
        messageApi.success('配置删除成功')
        await fetchConfigs()
      } else {
        messageApi.error(deleteData.error || '删除配置失败')
      }
    } catch (error: any) {
      messageApi.error('删除配置失败')
    } finally {
      setLoading(false)
    }
  }





  // 打开配置模态框
  const openConfigModal = async (config?: JenkinsConfig) => {
    setEditingConfig(config || null)
    if (config) {
      form.setFieldsValue(config)
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  useEffect(() => {
    fetchConfigs()
    fetchServers()
  }, [])

  // 配置表格列定义
  const configColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: JenkinsConfig) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.description && (
            <div className="text-sm text-gray-500">{record.description}</div>
          )}
        </div>
      )
    },
    {
      title: '服务器地址',
      dataIndex: 'serverUrl',
      key: 'serverUrl',
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
          {url}
        </a>
      )
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '连接状态',
      key: 'status',
      render: (record: JenkinsConfig) => {
        if (record.testStatus === 'connected') {
          return <Tag color="green" icon={<CheckCircleOutlined />}>已连接</Tag>
        } else if (record.testStatus === 'error') {
          return <Tag color="red" icon={<ExclamationCircleOutlined />}>连接失败</Tag>
        } else {
          return <Tag color="default" icon={<ClockCircleOutlined />}>未测试</Tag>
        }
      }
    },
    {
      title: '最后测试',
      dataIndex: 'lastTestAt',
      key: 'lastTestAt',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: JenkinsConfig) => (
        <Space>
          <Tooltip title="测试连接">
            <Button
              type="text"
              icon={<LinkOutlined />}
              loading={testingConnection === record.id}
              onClick={() => handleTestConnection(record)}
            />
          </Tooltip>


          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openConfigModal(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个Jenkins配置吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="text-white mb-2">
              <SettingOutlined className="mr-3" />
              Jenkins 服务器配置
            </Title>
            <Text type="secondary" className="text-lg">
              配置和管理Jenkins服务器连接信息
            </Text>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openConfigModal()}
            size="large"
          >
            添加Jenkins配置
          </Button>
        </div>

        {/* 主要内容区域 */}
        <Card className="glass-card">
          <div>
            {configs.length === 0 ? (
              <Empty
                description="暂无Jenkins配置"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openConfigModal()}
                >
                  添加第一个配置
                </Button>
              </Empty>
            ) : (
              <Table
                columns={configColumns}
                dataSource={configs}
                rowKey="id"
                loading={loading}
                pagination={false}
                size="middle"
              />
            )}
          </div>
        </Card>

        {/* 配置模态框 */}
        <Modal
          title={editingConfig ? '编辑Jenkins配置' : '添加Jenkins配置'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            setEditingConfig(null)
            form.resetFields()
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Form.Item
              label="配置名称"
              name="name"
              rules={[{ required: true, message: '请输入配置名称' }]}
            >
              <Input placeholder="例如：生产环境Jenkins" />
            </Form.Item>

            <Form.Item
              label="描述"
              name="description"
            >
              <TextArea placeholder="配置描述（可选）" rows={2} />
            </Form.Item>

            <Form.Item
              label="选择服务器"
              name="serverId"
              tooltip="从服务器配置中选择一个已配置的服务器，或手动输入服务器地址"
            >
              <Select
                placeholder="选择已配置的服务器（可选）"
                loading={serversLoading}
                allowClear
                showSearch
                optionFilterProp="children"
                onChange={(value, option: any) => {
                  if (value && option) {
                    // 当选择服务器时，自动填充服务器地址
                    const server = availableServers.find(s => s.id === value)
                    if (server) {
                      form.setFieldValue('serverUrl', `http://${server.ip}:8080`)
                    }
                  }
                }}
              >
                {availableServers.map(server => (
                  <Select.Option key={server.id} value={server.id} server={server}>
                    <div className="flex items-center justify-between">
                      <span>{server.name}</span>
                      <span className="text-gray-500 text-sm">({server.ip})</span>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="服务器地址"
              name="serverUrl"
              rules={[
                { required: true, message: '请输入Jenkins服务器地址' },
                { type: 'url', message: '请输入有效的URL' }
              ]}
              tooltip="Jenkins服务器的完整URL地址，如果上面选择了服务器会自动填充"
            >
              <Input
                placeholder="https://jenkins.example.com 或 http://192.168.1.100:8080"
                prefix={<LinkOutlined />}
              />
            </Form.Item>

            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                placeholder="jenkins用户名"
                prefix={<UserOutlined />}
              />
            </Form.Item>

            <Form.Item
              label="API Token"
              name="apiToken"
              rules={[{ required: true, message: '请输入API Token' }]}
              extra="在Jenkins用户设置中生成API Token"
            >
              <Input.Password
                placeholder="输入API Token"
                prefix={<KeyOutlined />}
              />
            </Form.Item>

            <Form.Item
              label="Webhook URL"
              name="webhookUrl"
              extra="用于接收Jenkins构建通知（可选）"
            >
              <Input placeholder="https://your-app.com/webhook/jenkins" />
            </Form.Item>



            <Form.Item className="mb-0">
              <Space className="w-full justify-end">
                <Button onClick={() => setModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingConfig ? '更新' : '保存'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>




      </div>
    </MainLayout>
  )
}

export default function JenkinsConfigPage() {
  return (
    <App>
      <JenkinsConfigPageContent />
    </App>
  )
}
