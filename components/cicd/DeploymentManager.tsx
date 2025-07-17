'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
  Popconfirm,
  Badge,
  Tag,
  DatePicker,
  Tooltip,
  Checkbox
} from 'antd'
import {
  RocketOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  RollbackOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import OptimizedDeploymentLogViewer from './OptimizedDeploymentLogViewer'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

interface Deployment {
  id: string
  projectId: string
  name: string
  description?: string
  environment: 'dev' | 'test' | 'prod'
  version?: string
  status: 'pending' | 'approved' | 'rejected' | 'scheduled' | 'deploying' | 'success' | 'failed' | 'rolled_back'
  buildNumber?: number
  scheduledAt?: string
  startedAt?: string
  completedAt?: string
  duration?: number
  logs?: string
  userId: string
  createdAt: string
  updatedAt: string
  project: {
    id: string
    name: string
    environment: string
  }
  approvals: Array<{
    id: string
    approverId: string
    status: 'pending' | 'approved' | 'rejected'
    comments?: string
    approvedAt?: string
    level: number
    approver: {
      id: string
      username: string
    }
  }>
}

interface Project {
  id: string
  name: string
  environment: string
  repositoryUrl?: string
  branch?: string
  buildScript?: string
  deployScript?: string
}



interface DeploymentManagerProps {
  projectId?: string
}

const DeploymentManager: React.FC<DeploymentManagerProps> = ({ projectId }) => {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingDeployment, setEditingDeployment] = useState<Deployment | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [requireApproval, setRequireApproval] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [deployingIds, setDeployingIds] = useState<Set<string>>(new Set())
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null)
  const [logViewerVisible, setLogViewerVisible] = useState(false)
  const [selectedDeploymentForLogs, setSelectedDeploymentForLogs] = useState<Deployment | null>(null)

  // 优化的数据刷新函数
  const refreshData = useCallback(() => {
    loadDeployments(pagination.current)
  }, [pagination.current])

  // 状态轮询 - 只在有部署任务运行时轮询
  useEffect(() => {
    const hasDeployingTasks = deployments.some(d => d.status === 'deploying')

    if (!hasDeployingTasks) {
      return // 没有正在部署的任务，不需要轮询
    }

    console.log('🔄 开始轮询部署状态，检测到正在部署的任务')
    const interval = setInterval(() => {
      refreshData()
    }, 3000) // 每3秒检查一次

    return () => {
      console.log('⏹️ 停止轮询部署状态')
      clearInterval(interval)
    }
  }, [deployments, refreshData])

  // 加载部署任务列表
  const loadDeployments = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.pageSize.toString()
      })

      if (projectId) {
        params.append('projectId', projectId)
      }

      const response = await fetch(`/api/cicd/deployments?${params}`)

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setDeployments(result.data.deployments)
          setPagination(prev => ({
            ...prev,
            current: result.data.pagination.page,
            total: result.data.pagination.total
          }))
        } else {
          message.error(result.error || '加载部署任务失败')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        message.error(errorData.error || '加载部署任务失败')
      }
    } catch (error) {
      console.error('加载部署任务失败:', error)
      message.error('加载部署任务失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载项目列表
  const loadProjects = async () => {
    try {
      const response = await fetch('/api/cicd/projects?limit=100')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setProjects(result.data.projects)
        }
      }
    } catch (error) {
      console.error('加载项目列表失败:', error)
    }
  }



  // 加载用户列表
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=100')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUsers(result.data.users || [])
        }
      }
    } catch (error) {
      console.error('加载用户列表失败:', error)
    }
  }

  // 创建部署任务
  const handleCreateDeployment = async (values: any) => {
    try {
      const response = await fetch('/api/cicd/deployments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          scheduledAt: values.scheduledAt ? values.scheduledAt.toISOString() : undefined,
          requireApproval: values.requireApproval || false,
          approvers: values.approvers || []
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          message.success(result.message || '部署任务创建成功')
          setCreateModalVisible(false)
          form.resetFields()
          loadDeployments(pagination.current)
        } else {
          message.error(result.error || '创建部署任务失败')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        message.error(errorData.error || '创建部署任务失败')
      }
    } catch (error) {
      console.error('创建部署任务失败:', error)
      message.error('创建部署任务失败')
    }
  }

  // 编辑部署任务
  const handleEditDeployment = async (values: any) => {
    if (!editingDeployment) return

    try {
      const response = await fetch(`/api/cicd/deployments/${editingDeployment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          scheduledAt: values.scheduledAt ? values.scheduledAt.toISOString() : null
        }),
      })

      if (response.ok) {
        const result = await response.json()
        message.success(result.message || '部署任务更新成功')
        setEditModalVisible(false)
        setEditingDeployment(null)
        editForm.resetFields()
        loadDeployments(pagination.current)
      } else {
        const errorData = await response.json().catch(() => ({}))
        message.error(errorData.error || '更新部署任务失败')
      }
    } catch (error) {
      console.error('更新部署任务失败:', error)
      message.error('更新部署任务失败')
    }
  }

  // 删除部署任务
  const handleDeleteDeployment = async (deploymentId: string) => {
    try {
      const response = await fetch(`/api/cicd/deployments/${deploymentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        message.success(result.message || '部署任务删除成功')
        loadDeployments(pagination.current)
      } else {
        const errorData = await response.json().catch(() => ({}))
        message.error(errorData.error || '删除部署任务失败')
      }
    } catch (error) {
      console.error('删除部署任务失败:', error)
      message.error('删除部署任务失败')
    }
  }

  // 开始部署
  const handleStartDeployment = async (deployment: Deployment) => {
    if (deployment.status !== 'approved' && deployment.status !== 'scheduled') {
      message.warning('只有已审批或已计划的部署任务才能开始部署')
      return
    }

    setDeployingIds(prev => new Set(prev).add(deployment.id))

    try {
      const response = await fetch(`/api/cicd/deployments/${deployment.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.success) {
        message.success('部署已开始')
        loadDeployments(pagination.current)
      } else {
        message.error(result.error || '启动部署失败')
      }
    } catch (error) {
      console.error('启动部署失败:', error)
      message.error('启动部署失败')
    } finally {
      setDeployingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(deployment.id)
        return newSet
      })
    }
  }

  // 停止部署
  const handleStopDeployment = async (deployment: Deployment) => {
    if (deployment.status !== 'deploying') {
      message.warning('只有正在部署的任务才能停止')
      return
    }

    try {
      const response = await fetch(`/api/cicd/deployments/${deployment.id}/stop`, {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        message.success('部署已停止')
        loadDeployments(pagination.current)
      } else {
        message.error(result.error || '停止部署失败')
      }
    } catch (error) {
      console.error('停止部署失败:', error)
      message.error('停止部署失败')
    }
  }

  // 回滚部署
  const handleRollbackDeployment = async (deployment: Deployment) => {
    if (deployment.status !== 'success' && deployment.status !== 'failed') {
      message.warning('只有成功或失败的部署才能回滚')
      return
    }

    try {
      const response = await fetch(`/api/cicd/deployments/${deployment.id}/rollback`, {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        message.success('回滚操作已开始')
        loadDeployments(pagination.current)
      } else {
        message.error(result.error || '回滚操作失败')
      }
    } catch (error) {
      console.error('回滚操作失败:', error)
      message.error('回滚操作失败')
    }
  }

  // 查看部署详情
  const handleViewDetail = (deployment: Deployment) => {
    setSelectedDeployment(deployment)
    setDetailModalVisible(true)
  }

  // 查看实时日志
  const handleViewLogs = (deployment: Deployment) => {
    setSelectedDeploymentForLogs(deployment)
    setLogViewerVisible(true)
  }

  // 状态标签渲染
  const renderStatusBadge = (status: string, deployment?: Deployment) => {
    const statusConfig = {
      pending: { color: 'orange', text: '等待审批' },
      approved: { color: 'green', text: '已审批' },
      rejected: { color: 'red', text: '已拒绝' },
      scheduled: { color: 'blue', text: '已计划' },
      deploying: { color: 'processing', text: '部署中' },
      success: { color: 'success', text: '部署成功' },
      failed: { color: 'error', text: '部署失败' },
      rolled_back: { color: 'warning', text: '已回滚' }
    }

    let config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status }

    // 如果是部署中状态，尝试从日志中提取当前阶段
    if (status === 'deploying' && deployment?.logs) {
      const currentStage = extractCurrentStage(deployment.logs)
      if (currentStage) {
        config = { color: 'processing', text: currentStage }
      }
    }

    return <Badge status={config.color as any} text={config.text} />
  }

  // 从部署日志中提取当前执行阶段
  const extractCurrentStage = (logs: string): string => {
    const lines = logs.split('\n').reverse() // 从最新的日志开始查找

    const stagePatterns = [
      { pattern: /🚀 开始完整部署流程/, stage: '初始化部署' },
      { pattern: /📁 准备工作目录/, stage: '准备工作目录' },
      { pattern: /📥 开始拉取代码/, stage: '拉取代码中' },
      { pattern: /🔨 开始本地构建/, stage: '本地构建中' },
      { pattern: /🚀 开始远程部署/, stage: '远程部署中' },
      { pattern: /📡 获取主机配置/, stage: '连接目标主机' },
      { pattern: /📤 开始传输构建产物/, stage: '传输文件中' },
      { pattern: /🔧 开始执行部署脚本/, stage: '执行部署脚本' },
      { pattern: /🔍 验证部署结果/, stage: '验证部署结果' },
      { pattern: /🧹 清理工作目录/, stage: '清理工作目录' },
      { pattern: /✅.*完成/, stage: '即将完成' }
    ]

    for (const line of lines) {
      for (const { pattern, stage } of stagePatterns) {
        if (pattern.test(line)) {
          return stage
        }
      }
    }

    return '部署中'
  }

  // 环境标签渲染
  const renderEnvironmentTag = (environment: string) => {
    const envConfig = {
      dev: { color: 'blue', text: '开发' },
      test: { color: 'orange', text: '测试' },
      prod: { color: 'red', text: '生产' }
    }

    const config = envConfig[environment as keyof typeof envConfig] || { color: 'default', text: environment }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 表格列定义
  const columns: ColumnsType<Deployment> = [
    {
      title: '部署名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div className="text-gray-500 text-sm">{record.description}</div>
          )}
        </div>
      )
    },
    {
      title: '项目',
      dataIndex: ['project', 'name'],
      key: 'project'
    },
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
      render: renderEnvironmentTag
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Deployment) => renderStatusBadge(status, record)
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (text) => text || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Deployment) => {
        const canStart = record.status === 'approved' || record.status === 'scheduled'
        const canStop = record.status === 'deploying'
        const canRollback = record.status === 'success' || record.status === 'failed'
        const isDeploying = deployingIds.has(record.id)

        return (
          <Space wrap>
            <Tooltip title="查看详情">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>

            <Tooltip title="查看实时日志">
              <Button
                type="text"
                icon={<FileTextOutlined />}
                onClick={() => handleViewLogs(record)}
              />
            </Tooltip>

            {canStart && (
              <Tooltip title="开始部署">
                <Button
                  type="text"
                  icon={<PlayCircleOutlined />}
                  loading={isDeploying}
                  onClick={() => handleStartDeployment(record)}
                  style={{ color: '#52c41a' }}
                />
              </Tooltip>
            )}

            {canStop && (
              <Tooltip title="停止部署">
                <Button
                  type="text"
                  icon={<PauseCircleOutlined />}
                  onClick={() => handleStopDeployment(record)}
                  style={{ color: '#fa8c16' }}
                />
              </Tooltip>
            )}

            {canRollback && (
              <Popconfirm
                title="确定要回滚这个部署吗？"
                onConfirm={() => handleRollbackDeployment(record)}
                okText="确定"
                cancelText="取消"
              >
                <Tooltip title="回滚">
                  <Button
                    type="text"
                    icon={<RollbackOutlined />}
                    style={{ color: '#fa541c' }}
                  />
                </Tooltip>
              </Popconfirm>
            )}

            <Tooltip title="编辑">
              <Button
                type="text"
                icon={<EditOutlined />}
                disabled={record.status === 'deploying'}
                onClick={() => {
                  setEditingDeployment(record)
                  editForm.setFieldsValue({
                    ...record,
                    scheduledAt: record.scheduledAt ? dayjs(record.scheduledAt) : undefined
                  })
                  setEditModalVisible(true)
                }}
              />
            </Tooltip>

            <Popconfirm
              title="确定要删除这个部署任务吗？"
              onConfirm={() => handleDeleteDeployment(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={record.status === 'deploying'}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        )
      }
    }
  ]

  // 初始化加载
  useEffect(() => {
    loadDeployments()
    loadProjects()
    loadUsers()

    // 设置定时刷新，每30秒检查一次状态更新
    const interval = setInterval(() => {
      loadDeployments(pagination.current)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // 监听页面焦点变化，实时更新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 页面重新获得焦点时刷新数据
        loadDeployments(pagination.current)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pagination.current])

  return (
    <div>
      {/* 操作栏 */}
      <Card className="glass-card mb-4">
        <div className="flex justify-between items-center">
          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建部署任务
            </Button>
          </div>
          <div>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadDeployments(pagination.current)}
              loading={loading}
            >
              刷新
            </Button>
          </div>
        </div>
      </Card>

      {/* 部署任务表格 */}
      <Card className="glass-card">
        <Table
          columns={columns}
          dataSource={deployments}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, pageSize: pageSize || 10 }))
              loadDeployments(page)
            },
          }}
        />
      </Card>

      {/* 创建部署任务模态框 */}
      <Modal
        title="创建部署任务"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateDeployment}
        >
          <Form.Item
            name="projectId"
            label="项目"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <Select
              placeholder="选择项目"
              onChange={(value) => {
                // 自动填充项目相关信息
                const selectedProject = projects.find(p => p.id === value)
                if (selectedProject) {
                  form.setFieldsValue({
                    environment: selectedProject.environment,
                    name: `${selectedProject.name} - 部署`,
                    description: `${selectedProject.name} 项目部署任务`
                  })
                }
              }}
            >
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 项目信息显示 */}
          {form.getFieldValue('projectId') && (
            <Card size="small" className="mb-4" title="项目配置信息">
              {(() => {
                const selectedProject = projects.find(p => p.id === form.getFieldValue('projectId'))
                if (!selectedProject) return null

                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Text strong>仓库地址：</Text>
                      <Text className="block text-gray-600">{selectedProject.repositoryUrl}</Text>
                    </div>
                    <div>
                      <Text strong>分支：</Text>
                      <Text className="block text-gray-600">{selectedProject.branch}</Text>
                    </div>
                    <div>
                      <Text strong>构建脚本：</Text>
                      <Text className="block text-gray-600 font-mono text-xs">
                        {selectedProject.buildScript || '未配置'}
                      </Text>
                    </div>
                    <div>
                      <Text strong>部署脚本：</Text>
                      <Text className="block text-gray-600 font-mono text-xs">
                        {selectedProject.deployScript || '未配置'}
                      </Text>
                    </div>
                  </div>
                )
              })()}
            </Card>
          )}

          <Form.Item
            name="name"
            label="部署名称"
            rules={[{ required: true, message: '请输入部署名称' }]}
          >
            <Input placeholder="输入部署名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="输入部署描述" />
          </Form.Item>

          <Form.Item
            name="environment"
            label="环境"
            rules={[{ required: true, message: '请选择环境' }]}
          >
            <Select placeholder="选择环境">
              <Option value="dev">开发环境</Option>
              <Option value="test">测试环境</Option>
              <Option value="prod">生产环境</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="version"
            label="版本号"
          >
            <Input placeholder="输入版本号" />
          </Form.Item>



          <Form.Item
            name="scheduledAt"
            label="计划部署时间"
          >
            <DatePicker
              showTime
              placeholder="选择计划部署时间（可选）"
              style={{ width: '100%' }}
            />
          </Form.Item>

          {/* 审批配置 */}
          <Form.Item
            name="requireApproval"
            valuePropName="checked"
          >
            <Checkbox onChange={(e) => setRequireApproval(e.target.checked)}>
              需要审批
            </Checkbox>
          </Form.Item>

          {requireApproval && (
            <Form.Item
              name="approvers"
              label="审批人"
              rules={[{ required: requireApproval, message: '请选择审批人' }]}
            >
              <Select
                mode="multiple"
                placeholder="选择审批人"
                style={{ width: '100%' }}
              >
                {users.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑部署任务模态框 */}
      <Modal
        title="编辑部署任务"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false)
          setEditingDeployment(null)
          editForm.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditDeployment}
        >
          <Form.Item
            name="name"
            label="部署名称"
            rules={[{ required: true, message: '请输入部署名称' }]}
          >
            <Input placeholder="输入部署名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea
              placeholder="输入部署描述（可选）"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="environment"
            label="环境"
            rules={[{ required: true, message: '请选择部署环境' }]}
          >
            <Select placeholder="选择部署环境">
              <Option value="dev">开发环境</Option>
              <Option value="test">测试环境</Option>
              <Option value="prod">生产环境</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="version"
            label="版本号"
          >
            <Input placeholder="输入版本号（可选）" />
          </Form.Item>



          <Form.Item
            name="scheduledAt"
            label="计划部署时间"
          >
            <DatePicker
              showTime
              placeholder="选择计划部署时间（可选）"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setEditModalVisible(false)
                setEditingDeployment(null)
                editForm.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 部署详情模态框 */}
      <Modal
        title={
          <Space>
            <InfoCircleOutlined />
            部署详情
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false)
          setSelectedDeployment(null)
        }}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {selectedDeployment && (
          <div>
            <Card size="small" className="mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text strong>部署名称：</Text>
                  <Text>{selectedDeployment.name}</Text>
                </div>
                <div>
                  <Text strong>状态：</Text>
                  {renderStatusBadge(selectedDeployment.status)}
                </div>
                <div>
                  <Text strong>环境：</Text>
                  {renderEnvironmentTag(selectedDeployment.environment)}
                </div>
                <div>
                  <Text strong>版本：</Text>
                  <Text>{selectedDeployment.version || '-'}</Text>
                </div>
                <div>
                  <Text strong>所属项目：</Text>
                  <Text>{selectedDeployment.project.name}</Text>
                </div>
                <div>
                  <Text strong>构建号：</Text>
                  <Text>{selectedDeployment.buildNumber || '-'}</Text>
                </div>
              </div>
            </Card>

            {selectedDeployment.description && (
              <Card size="small" title="描述" className="mb-4">
                <Text>{selectedDeployment.description}</Text>
              </Card>
            )}

            {selectedDeployment.approvals && selectedDeployment.approvals.length > 0 && (
              <Card size="small" title="审批信息" className="mb-4">
                <div className="space-y-2">
                  {selectedDeployment.approvals.map((approval) => (
                    <div key={approval.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <Text strong>审批人：</Text>
                        <Text>{approval.approver.username}</Text>
                        <Text className="ml-4 text-gray-500">级别 {approval.level}</Text>
                      </div>
                      <div>
                        {approval.status === 'approved' && (
                          <Tag color="green" icon={<CheckCircleOutlined />}>已通过</Tag>
                        )}
                        {approval.status === 'rejected' && (
                          <Tag color="red" icon={<CloseCircleOutlined />}>已拒绝</Tag>
                        )}
                        {approval.status === 'pending' && (
                          <Tag color="orange">待审批</Tag>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {selectedDeployment.logs && (
              <Card size="small" title="部署日志">
                <div
                  className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-64 overflow-y-auto"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {selectedDeployment.logs}
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* 优化的实时日志查看器 */}
      <OptimizedDeploymentLogViewer
        visible={logViewerVisible}
        onClose={() => setLogViewerVisible(false)}
        deploymentId={selectedDeploymentForLogs?.id || ''}
        deploymentName={selectedDeploymentForLogs?.name || ''}
      />
    </div>
  )
}

export default DeploymentManager
