'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Alert,
  Tabs,
  Table,
  Modal,
  Tag,
  Tooltip,
  Popconfirm,
  Empty,
  App,
  Select,
  Checkbox,
  Divider,
  Row,
  Col,
  Spin,
  message
} from 'antd'
import {
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  ExperimentOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  CloudUploadOutlined
} from '@ant-design/icons'
import MainLayout from '../../components/layout/MainLayout'
import { apiClient } from '../../utils/apiClient'

const { Title, Text } = Typography
const { TextArea } = Input

// 类型定义
interface JenkinsConfig {
  id: string
  name: string
  description?: string
  serverUrl: string
  username: string
  apiToken: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface JenkinsJob {
  name: string
  url: string
  color: string
  buildable: boolean
  lastBuild?: {
    number: number
    url: string
    result: string
    timestamp: number
  }
}

interface Build {
  id: string
  buildNumber: number
  jenkinsJobName: string
  status: string
  result?: string
  startedAt?: string
  completedAt?: string
  duration?: number
  buildUrl?: string
}

function JenkinsConfigPageContent() {
  const { message: messageApi } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [configs, setConfigs] = useState<JenkinsConfig[]>([])
  const [jobs, setJobs] = useState<JenkinsJob[]>([])
  const [builds, setBuilds] = useState<Build[]>([])
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingConfig, setEditingConfig] = useState<JenkinsConfig | null>(null)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [jobsLoading, setJobsLoading] = useState(false)
  const [buildsLoading, setBuildsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('configs')

  // 获取Jenkins配置列表
  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/jenkins/config')
      const data = response.data as any

      if (data.success) {
        setConfigs(data.data.configs || [])
        if (data.data.configs?.length > 0 && !selectedConfig) {
          setSelectedConfig(data.data.configs[0].id)
        }
      } else {
        messageApi.error(data.error || '获取Jenkins配置失败')
      }
    } catch (error: any) {
      console.error('获取Jenkins配置失败:', error)
      messageApi.error('获取Jenkins配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取Jenkins任务列表
  const fetchJobs = async (configId: string) => {
    if (!configId) return

    try {
      setJobsLoading(true)
      const response = await apiClient.get(`/api/jenkins/jobs?configId=${configId}`)
      const data = response.data as any

      if (data.success) {
        setJobs(data.data.jobs || [])
      } else {
        messageApi.error(data.error || '获取Jenkins任务失败')
      }
    } catch (error: any) {
      console.error('获取Jenkins任务失败:', error)
      messageApi.error('获取Jenkins任务失败')
    } finally {
      setJobsLoading(false)
    }
  }

  // 获取构建历史
  const fetchBuilds = async (configId?: string) => {
    try {
      setBuildsLoading(true)
      const url = configId
        ? `/api/jenkins/builds?configId=${configId}`
        : '/api/jenkins/builds'
      const response = await apiClient.get(url)
      const data = response.data as any

      if (data.success) {
        setBuilds(data.data.builds || [])
        console.log('📋 构建历史获取成功:', data.data.builds?.length || 0, '条记录')
      } else {
        messageApi.error(data.error || '获取构建历史失败')
      }
    } catch (error: any) {
      console.error('获取构建历史失败:', error)
      messageApi.error('获取构建历史失败')
    } finally {
      setBuildsLoading(false)
    }
  }

  // 测试Jenkins连接
  const handleTestConnection = async (config: JenkinsConfig) => {
    try {
      setTestingConnection(config.id)
      const response = await apiClient.post('/api/jenkins/test', {
        serverUrl: config.serverUrl,
        username: config.username,
        apiToken: config.apiToken
      })
      const data = response.data as any

      if (data.success) {
        messageApi.success('Jenkins连接测试成功！')
      } else {
        messageApi.error(data.error || 'Jenkins连接测试失败')
      }
    } catch (error: any) {
      console.error('Jenkins连接测试失败:', error)
      messageApi.error('Jenkins连接测试失败')
    } finally {
      setTestingConnection(null)
    }
  }

  // 保存配置
  const handleSave = async (values: any) => {
    try {
      setLoading(true)

      const response = editingConfig
        ? await apiClient.put('/api/jenkins/config', { ...values, id: editingConfig.id })
        : await apiClient.post('/api/jenkins/config', values)

      const data = response.data as any

      if (data.success) {
        messageApi.success(data.data.message)
        setModalVisible(false)
        setEditingConfig(null)
        form.resetFields()
        fetchConfigs()
      } else {
        messageApi.error(data.error || '保存Jenkins配置失败')
      }
    } catch (error: any) {
      console.error('保存Jenkins配置失败:', error)
      messageApi.error('保存Jenkins配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除配置
  const handleDelete = async (configId: string) => {
    try {
      setLoading(true)
      const response = await apiClient.delete(`/api/jenkins/config?id=${configId}`)
      const data = response.data as any

      if (data.success) {
        messageApi.success('删除Jenkins配置成功')
        fetchConfigs()
        if (selectedConfig === configId) {
          setSelectedConfig(null)
        }
      } else {
        messageApi.error(data.error || '删除Jenkins配置失败')
      }
    } catch (error: any) {
      console.error('删除Jenkins配置失败:', error)
      messageApi.error('删除Jenkins配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 打开配置模态框
  const openConfigModal = (config?: JenkinsConfig) => {
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
  }, [])

  useEffect(() => {
    if (selectedConfig && activeTab === 'jobs') {
      fetchJobs(selectedConfig)
    }
  }, [selectedConfig, activeTab])

  useEffect(() => {
    if (activeTab === 'builds') {
      fetchBuilds(selectedConfig || undefined)
    }
  }, [activeTab, selectedConfig])

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
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
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
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'configs',
                label: (
                  <span>
                    <SettingOutlined />
                    服务器配置
                  </span>
                ),
                children: (
                  <div>
                    <Table
                      columns={configColumns}
                      dataSource={configs}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 条记录`
                      }}
                      size="middle"
                    />
                  </div>
                )
              },
              {
                key: 'jobs',
                label: (
                  <span>
                    <PlayCircleOutlined />
                    Jenkins任务
                  </span>
                ),
                children: (
                  <div>
                    {selectedConfig ? (
                      <Table
                        columns={[
                          {
                            title: '任务名称',
                            dataIndex: 'name',
                            key: 'name'
                          },
                          {
                            title: '状态',
                            dataIndex: 'color',
                            key: 'color',
                            render: (color: string) => {
                              const statusMap: Record<string, { color: string; text: string }> = {
                                'blue': { color: 'green', text: '成功' },
                                'red': { color: 'red', text: '失败' },
                                'yellow': { color: 'orange', text: '不稳定' },
                                'grey': { color: 'default', text: '未构建' },
                                'disabled': { color: 'default', text: '禁用' }
                              }
                              const status = statusMap[color] || { color: 'default', text: '未知' }
                              return <Tag color={status.color}>{status.text}</Tag>
                            }
                          },
                          {
                            title: '可构建',
                            dataIndex: 'buildable',
                            key: 'buildable',
                            render: (buildable: boolean) => (
                              <Tag color={buildable ? 'green' : 'red'}>
                                {buildable ? '是' : '否'}
                              </Tag>
                            )
                          }
                        ]}
                        dataSource={jobs}
                        rowKey="name"
                        loading={jobsLoading}
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                          showQuickJumper: true,
                          showTotal: (total) => `共 ${total} 条记录`
                        }}
                        size="middle"
                      />
                    ) : (
                      <Empty description="请先选择Jenkins配置" />
                    )}
                  </div>
                )
              },
              {
                key: 'builds',
                label: (
                  <span>
                    <HistoryOutlined />
                    构建历史
                  </span>
                ),
                children: (
                  <div>
                    <div className="mb-4 flex justify-between items-center">
                      <div>
                        {selectedConfig && (
                          <Tag color="blue">
                            当前配置: {configs.find(c => c.id === selectedConfig)?.name}
                          </Tag>
                        )}
                      </div>
                      <Space>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => fetchBuilds(selectedConfig || undefined)}
                          loading={buildsLoading}
                        >
                          刷新
                        </Button>
                      </Space>
                    </div>
                    <Table
                      columns={[
                        {
                          title: '任务名称',
                          dataIndex: 'jenkinsJobName',
                          key: 'jenkinsJobName'
                        },
                        {
                          title: '构建号',
                          dataIndex: 'buildNumber',
                          key: 'buildNumber'
                        },
                        {
                          title: '状态',
                          dataIndex: 'status',
                          key: 'status',
                          render: (status: string) => {
                            const statusMap: Record<string, { color: string; text: string }> = {
                              'success': { color: 'green', text: '成功' },
                              'failed': { color: 'red', text: '失败' },
                              'running': { color: 'blue', text: '运行中' },
                              'pending': { color: 'orange', text: '等待中' },
                              'aborted': { color: 'default', text: '已中止' }
                            }
                            const statusInfo = statusMap[status] || { color: 'default', text: status }
                            return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                          }
                        },
                        {
                          title: '开始时间',
                          dataIndex: 'startedAt',
                          key: 'startedAt',
                          render: (date: string) => date ? new Date(date).toLocaleString() : '-'
                        },
                        {
                          title: '完成时间',
                          dataIndex: 'completedAt',
                          key: 'completedAt',
                          render: (date: string) => date ? new Date(date).toLocaleString() : '-'
                        }
                      ]}
                      dataSource={builds}
                      rowKey="id"
                      loading={buildsLoading}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 条记录`
                      }}
                      size="middle"
                    />
                  </div>
                )
              }
            ]}
          />
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
              name="name"
              label="配置名称"
              rules={[{ required: true, message: '请输入配置名称' }]}
            >
              <Input placeholder="请输入配置名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
            >
              <TextArea rows={2} placeholder="请输入配置描述（可选）" />
            </Form.Item>

            <Form.Item
              name="serverUrl"
              label="Jenkins服务器地址"
              rules={[
                { required: true, message: '请输入Jenkins服务器地址' },
                { type: 'url', message: '请输入有效的URL地址' }
              ]}
            >
              <Input placeholder="https://jenkins.example.com" />
            </Form.Item>

            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入Jenkins用户名" />
            </Form.Item>

            <Form.Item
              name="apiToken"
              label="API Token"
              rules={[{ required: true, message: '请输入API Token' }]}
            >
              <Input.Password placeholder="请输入Jenkins API Token" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingConfig ? '更新' : '创建'}
                </Button>
                <Button onClick={() => {
                  setModalVisible(false)
                  setEditingConfig(null)
                  form.resetFields()
                }}>
                  取消
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
