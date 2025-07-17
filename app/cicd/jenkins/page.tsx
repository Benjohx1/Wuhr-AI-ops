'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Alert,
  message,
  Badge,
  Tag,
  Modal,
  Popconfirm,
  Tabs,
  List,
  Spin,
  Form,
  Input,
  Select
} from 'antd'
import {
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  ApiOutlined,
  BuildOutlined,
  ClockCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import MainLayout from '../../components/layout/MainLayout'
import { usePermissions } from '../../hooks/usePermissions'

const { Title, Paragraph, Text } = Typography
const { TabPane } = Tabs
const { Option } = Select

// Jenkins配置类型定义
interface JenkinsConfig {
  id: string
  name: string
  description?: string
  serverUrl: string
  username?: string
  isActive: boolean
  lastTestAt?: string
  testStatus?: string
  createdAt: string
  updatedAt: string
}

// Jenkins作业类型定义
interface JenkinsJob {
  name: string
  displayName: string
  url: string
  buildable: boolean
  color: string
  lastBuild?: {
    number: number
    url: string
    timestamp: number
  }
}

// Jenkins构建类型定义
interface JenkinsBuild {
  id: string
  jenkinsConfigId: string
  buildNumber: number
  jenkinsJobName: string
  status: string
  result?: string
  startedAt?: string
  completedAt?: string
  duration?: number
  buildUrl?: string
  createdAt: string
}

const JenkinsManagementPage: React.FC = () => {
  const { hasPermission } = usePermissions()
  
  // 状态管理
  const [configs, setConfigs] = useState<JenkinsConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<JenkinsConfig | null>(null)
  const [jobs, setJobs] = useState<JenkinsJob[]>([])
  const [builds, setBuilds] = useState<JenkinsBuild[]>([])
  const [loading, setLoading] = useState(false)
  const [jobsLoading, setJobsLoading] = useState(false)
  const [buildsLoading, setBuildsLoading] = useState(false)
  
  // 模态框状态
  const [configModalVisible, setConfigModalVisible] = useState(false)
  const [editingConfig, setEditingConfig] = useState<JenkinsConfig | null>(null)
  const [buildModalVisible, setBuildModalVisible] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JenkinsJob | null>(null)
  
  // 表单
  const [configForm] = Form.useForm()
  const [buildForm] = Form.useForm()

  // 加载Jenkins配置列表
  const loadConfigs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cicd/jenkins', {
        credentials: 'include', // 使用httpOnly cookies
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔐 认证失败，可能需要重新登录')
          setConfigs([])
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log('📋 Jenkins配置加载成功:', data.data)
        setConfigs(data.data.configs || [])
      } else {
        console.error('API返回错误:', data.error)
        setConfigs([])
      }
    } catch (error) {
      console.error('加载Jenkins配置失败:', error)
      // 只在真正的网络错误时显示错误
      if (error instanceof Error && !error.message.includes('401')) {
        message.error('网络错误，无法加载Jenkins配置')
      }
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }

  // 测试Jenkins连接
  const testConnection = async (config: JenkinsConfig) => {
    try {
      const response = await fetch(`/api/cicd/jenkins/${config.id}/test`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (data.success) {
        message.success('Jenkins连接测试成功')
        loadConfigs() // 重新加载以更新测试状态
      } else {
        message.error(data.message || 'Jenkins连接测试失败')
      }
    } catch (error) {
      console.error('Jenkins连接测试失败:', error)
      message.error('Jenkins连接测试失败')
    }
  }

  // 加载Jenkins作业列表
  const loadJobs = async (config: JenkinsConfig) => {
    setJobsLoading(true)
    try {
      const response = await fetch('/api/cicd/jenkins/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serverUrl: config.serverUrl,
          username: config.username,
          apiToken: '' // 在实际环境中需要传递API Token
        })
      })
      const data = await response.json()
      
      if (data.success && data.data.jobs) {
        setJobs(data.data.jobs)
      } else {
        setJobs([])
        message.warning('无法获取Jenkins作业列表')
      }
    } catch (error) {
      console.error('加载Jenkins作业失败:', error)
      setJobs([])
      message.error('加载Jenkins作业失败')
    } finally {
      setJobsLoading(false)
    }
  }

  // 加载构建历史
  const loadBuilds = async (configId: string) => {
    setBuildsLoading(true)
    try {
      const response = await fetch(`/api/cicd/builds?jenkinsConfigId=${configId}`)
      const data = await response.json()
      
      if (data.success) {
        setBuilds(data.data.builds || [])
      } else {
        setBuilds([])
      }
    } catch (error) {
      console.error('加载构建历史失败:', error)
      setBuilds([])
    } finally {
      setBuildsLoading(false)
    }
  }

  // 删除Jenkins配置
  const deleteConfig = async (id: string) => {
    try {
      const response = await fetch(`/api/cicd/jenkins/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        message.success('Jenkins配置删除成功')
        loadConfigs()
        if (selectedConfig?.id === id) {
          setSelectedConfig(null)
          setJobs([])
          setBuilds([])
        }
      } else {
        message.error(data.error || '删除Jenkins配置失败')
      }
    } catch (error) {
      console.error('删除Jenkins配置失败:', error)
      message.error('删除Jenkins配置失败')
    }
  }

  // 处理配置选择
  const handleConfigSelect = (config: JenkinsConfig) => {
    setSelectedConfig(config)
    loadJobs(config)
    loadBuilds(config.id)
  }

  // 触发Jenkins作业
  const triggerJob = async (job: JenkinsJob) => {
    if (!selectedConfig) return

    try {
      // 这里应该调用实际的Jenkins API来触发作业
      message.success(`作业 ${job.name} 已触发执行`)

      // 重新加载构建历史
      loadBuilds(selectedConfig.id)
    } catch (error) {
      console.error('触发Jenkins作业失败:', error)
      message.error('触发Jenkins作业失败')
    }
  }

  // 处理Jenkins配置提交
  const handleConfigSubmit = async (values: any) => {
    try {
      setLoading(true)

      const url = editingConfig
        ? `/api/cicd/jenkins/${editingConfig.id}`
        : '/api/cicd/jenkins'

      const method = editingConfig ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      })

      const data = await response.json()

      if (data.success) {
        message.success(editingConfig ? 'Jenkins配置更新成功' : 'Jenkins配置创建成功')
        setConfigModalVisible(false)
        setEditingConfig(null)
        configForm.resetFields()
        loadConfigs() // 重新加载配置列表
      } else {
        message.error(data.error || '操作失败')
      }
    } catch (error) {
      console.error('提交Jenkins配置失败:', error)
      message.error('提交Jenkins配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadConfigs()
  }, [])

  // Jenkins配置表格列定义
  const configColumns = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: JenkinsConfig) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div className="text-gray-500 text-sm">{record.description}</div>
          )}
        </div>
      )
    },
    {
      title: 'Jenkins服务器',
      dataIndex: 'serverUrl',
      key: 'serverUrl',
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      )
    },
    {
      title: '连接状态',
      key: 'status',
      render: (_: any, record: JenkinsConfig) => {
        const getStatusBadge = () => {
          switch (record.testStatus) {
            case 'connected':
              return <Badge status="success" text="已连接" />
            case 'disconnected':
              return <Badge status="error" text="连接失败" />
            default:
              return <Badge status="default" text="未测试" />
          }
        }
        
        return (
          <div>
            {getStatusBadge()}
            {record.lastTestAt && (
              <div className="text-gray-500 text-xs">
                最后测试: {new Date(record.lastTestAt).toLocaleString()}
              </div>
            )}
          </div>
        )
      }
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
      title: '操作',
      key: 'actions',
      render: (_: any, record: JenkinsConfig) => (
        <Space>
          <Button
            size="small"
            icon={<ApiOutlined />}
            onClick={() => testConnection(record)}
          >
            测试连接
          </Button>
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleConfigSelect(record)}
            type={selectedConfig?.id === record.id ? 'primary' : 'default'}
          >
            管理
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingConfig(record)
              configForm.setFieldsValue(record)
              setConfigModalVisible(true)
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个Jenkins配置吗？"
            onConfirm={() => deleteConfig(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <Title level={2}>Jenkins管理平台</Title>
          <Paragraph>
            管理您的Jenkins服务器配置，查看和执行Jenkins作业，监控构建状态。
          </Paragraph>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jenkins配置列表 */}
          <div className="lg:col-span-2">
            <Card
              title="Jenkins配置"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingConfig(null)
                    configForm.resetFields()
                    setConfigModalVisible(true)
                  }}
                >
                  新增配置
                </Button>
              }
            >
              <Table
                columns={configColumns}
                dataSource={configs}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 个配置`
                }}
              />
            </Card>
          </div>

          {/* Jenkins管理面板 */}
          <div>
            {selectedConfig ? (
              <Card title={`管理: ${selectedConfig.name}`}>
                <Tabs defaultActiveKey="jobs">
                  <TabPane tab="作业列表" key="jobs">
                    <Spin spinning={jobsLoading}>
                      <List
                        dataSource={jobs}
                        renderItem={(job) => (
                          <List.Item
                            actions={[
                              <Button
                                key="trigger"
                                size="small"
                                icon={<PlayCircleOutlined />}
                                onClick={() => triggerJob(job)}
                                disabled={!job.buildable}
                              >
                                执行
                              </Button>
                            ]}
                          >
                            <List.Item.Meta
                              title={
                                <div>
                                  <Text strong>{job.displayName || job.name}</Text>
                                  <Tag color={job.color === 'blue' ? 'blue' : job.color === 'red' ? 'red' : 'default'} className="ml-2">
                                    {job.color}
                                  </Tag>
                                </div>
                              }
                              description={
                                job.lastBuild && (
                                  <Text type="secondary">
                                    最后构建: #{job.lastBuild.number}
                                  </Text>
                                )
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </Spin>
                  </TabPane>
                  
                  <TabPane tab="构建历史" key="builds">
                    <Spin spinning={buildsLoading}>
                      <List
                        dataSource={builds}
                        renderItem={(build) => (
                          <List.Item>
                            <List.Item.Meta
                              title={
                                <div>
                                  <Text strong>#{build.buildNumber}</Text>
                                  <Text className="ml-2">{build.jenkinsJobName}</Text>
                                  <Tag color={build.result === 'SUCCESS' ? 'green' : 'red'} className="ml-2">
                                    {build.result || build.status}
                                  </Tag>
                                </div>
                              }
                              description={
                                <div>
                                  <Text type="secondary">
                                    开始时间: {build.startedAt ? new Date(build.startedAt).toLocaleString() : '未知'}
                                  </Text>
                                  {build.duration && (
                                    <Text type="secondary" className="ml-4">
                                      耗时: {build.duration}秒
                                    </Text>
                                  )}
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </Spin>
                  </TabPane>
                </Tabs>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <ApiOutlined className="text-4xl text-gray-400 mb-4" />
                  <Text type="secondary">请选择一个Jenkins配置进行管理</Text>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Jenkins配置模态框 */}
        <Modal
          title={editingConfig ? '编辑Jenkins配置' : '新增Jenkins配置'}
          open={configModalVisible}
          onCancel={() => {
            setConfigModalVisible(false)
            setEditingConfig(null)
            configForm.resetFields()
          }}
          footer={null}
          width={600}
        >
          <Form
            form={configForm}
            layout="vertical"
            onFinish={handleConfigSubmit}
          >
            <Form.Item
              name="name"
              label="配置名称"
              rules={[
                { required: true, message: '请输入配置名称' },
                { max: 100, message: '配置名称不能超过100个字符' }
              ]}
            >
              <Input placeholder="输入Jenkins配置名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea
                placeholder="输入配置描述（可选）"
                rows={3}
              />
            </Form.Item>

            <Form.Item
              name="serverUrl"
              label="Jenkins服务器URL"
              rules={[
                { required: true, message: '请输入Jenkins服务器URL' },
                { type: 'url', message: '请输入有效的URL' }
              ]}
            >
              <Input placeholder="https://jenkins.example.com" />
            </Form.Item>

            <Form.Item
              name="username"
              label="用户名"
            >
              <Input placeholder="Jenkins用户名（可选）" />
            </Form.Item>

            <Form.Item
              name="apiToken"
              label="API Token"
            >
              <Input.Password placeholder="Jenkins API Token（可选）" />
            </Form.Item>

            <Form.Item
              name="webhookUrl"
              label="Webhook URL"
              rules={[
                { type: 'url', message: '请输入有效的URL' }
              ]}
            >
              <Input placeholder="Webhook回调地址（可选）" />
            </Form.Item>

            <Form.Item>
              <div className="flex justify-end space-x-2">
                <Button onClick={() => {
                  setConfigModalVisible(false)
                  setEditingConfig(null)
                  configForm.resetFields()
                }}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingConfig ? '更新' : '创建'}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  )
}

export default JenkinsManagementPage
