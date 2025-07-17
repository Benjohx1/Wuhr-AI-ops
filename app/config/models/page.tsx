'use client'

import React, { useState, useEffect } from 'react'
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
  Tag,
  Tooltip,
  message,
  Avatar
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
  LoadingOutlined,
  BulbOutlined
} from '@ant-design/icons'
import MainLayout from '../../components/layout/MainLayout'

const { Title } = Typography
const { Option } = Select

// 模型配置接口
interface ModelConfig {
  id: string
  modelName: string
  displayName: string
  provider: string
  apiKey: string
  baseUrl?: string
  description?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface ModelFormData {
  modelName: string
  displayName: string
  provider: string
  apiKey: string
  baseUrl?: string
  description?: string
  isDefault: boolean
}

export default function ModelsPage() {
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>('all')
  const [testingId, setTestingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; responseTime?: number; error?: string }>>({})
  const [form] = Form.useForm<ModelFormData>()

  // 提供商选项
  const providers = [
    { id: 'openai-compatible', name: 'OpenAI Compatible' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'qwen', name: 'Qwen' },
    { id: 'doubao', name: 'Doubao' },
    { id: 'custom', name: '自定义' }
  ]

  // 获取模型配置列表
  const fetchModelConfigs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/config/model-configs', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setModelConfigs(data.models || [])

      } else {
        message.error('获取模型配置失败')
      }
    } catch (error) {
      console.error('获取模型配置失败:', error)
      message.error('获取模型配置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModelConfigs()
  }, [])

  // 保存模型配置
  const saveModelConfig = async (values: ModelFormData) => {
    try {
      const url = '/api/config/model-configs'
      const method = editingModel ? 'PUT' : 'POST'
      const body = editingModel 
        ? { ...values, id: editingModel.id }
        : values

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        message.success(editingModel ? '模型配置更新成功' : '模型配置创建成功')
        setIsModalVisible(false)
        setEditingModel(null)
        form.resetFields()
        fetchModelConfigs()
      } else {
        const error = await response.text()
        message.error(`${editingModel ? '更新' : '创建'}模型配置失败: ${error}`)
      }
    } catch (error) {
      console.error('保存模型配置失败:', error)
      message.error(`${editingModel ? '更新' : '创建'}模型配置失败`)
    }
  }

  // 删除模型配置
  const deleteModelConfig = async (id: string) => {
    try {
      const response = await fetch(`/api/config/model-configs?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        message.success('模型配置删除成功')
        fetchModelConfigs()
      } else {
        const error = await response.text()
        message.error(`删除模型配置失败: ${error}`)
      }
    } catch (error) {
      console.error('删除模型配置失败:', error)
      message.error('删除模型配置失败')
    }
  }

  // 测试API连接
  const testModelAPI = async (model: ModelConfig) => {
    setTestingId(model.id)
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/config/model-configs/test', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: model.id,
          provider: model.provider,
          modelName: model.modelName,
          apiKey: model.apiKey,
          baseUrl: model.baseUrl
        })
      })

      const responseTime = Date.now() - startTime
      const result = await response.json()

      if (response.ok && result.success) {
        setTestResults(prev => ({
          ...prev,
          [model.id]: { success: true, responseTime }
        }))
        message.success(`API测试成功 (${responseTime}ms)`)
      } else {
        setTestResults(prev => ({
          ...prev,
          [model.id]: { success: false, error: result.error || '测试失败' }
        }))
        message.error(`API测试失败: ${result.error || '未知错误'}`)
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      setTestResults(prev => ({
        ...prev,
        [model.id]: { success: false, error: (error as Error).message }
      }))
      message.error(`API测试失败: ${(error as Error).message}`)
    } finally {
      setTestingId(null)
    }
  }

  // 过滤模型
  const filteredModels = modelConfigs.filter(model => {
    if (selectedProvider === 'all') return true
    return model.provider === selectedProvider
  })

  // 表格列定义
  const columns = [
    {
      title: '模型信息',
      key: 'info',
      render: (record: ModelConfig) => (
        <div className="flex items-center space-x-3">
          <Avatar
            icon={<BulbOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <div className="font-medium">{record.displayName}</div>
            <div className="text-sm text-gray-500">{record.modelName}</div>
          </div>
        </div>
      ),
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => (
        <Tag color="blue">{providers.find(p => p.id === provider)?.name || provider}</Tag>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (record: ModelConfig) => (
        <Tag color={record.isDefault ? 'green' : 'default'}>
          {record.isDefault ? '默认' : '普通'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: ModelConfig) => (
        <Space>
          <Tooltip title="测试API">
            <Button
              type="text"
              icon={testingId === record.id ? <LoadingOutlined /> : <ApiOutlined />}
              loading={testingId === record.id}
              onClick={() => testModelAPI(record)}
              disabled={testingId !== null}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingModel(record)
                form.setFieldsValue({
                  modelName: record.modelName,
                  displayName: record.displayName,
                  provider: record.provider,
                  apiKey: record.apiKey,
                  baseUrl: record.baseUrl || '',
                  description: record.description || '',
                  isDefault: record.isDefault
                })
                setIsModalVisible(true)
              }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定要删除模型 "${record.displayName}" 吗？`,
                  onOk: () => deleteModelConfig(record.id)
                })
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Title level={2}>模型配置管理</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingModel(null)
              form.resetFields()
              setIsModalVisible(true)
            }}
          >
            添加模型
          </Button>
        </div>

        <Card>
          <div className="mb-4">
            <Select
              value={selectedProvider}
              onChange={setSelectedProvider}
              style={{ width: 200 }}
            >
              <Option value="all">所有提供商</Option>
              {providers.map(provider => (
                <Option key={provider.id} value={provider.id}>
                  {provider.name}
                </Option>
              ))}
            </Select>
          </div>

          <Table
            columns={columns}
            dataSource={filteredModels}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个模型`
            }}
          />
        </Card>

        <Modal
          title={editingModel ? '编辑模型配置' : '添加模型配置'}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false)
            setEditingModel(null)
            form.resetFields()
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={saveModelConfig}
          >
            <Form.Item
              name="displayName"
              label="显示名称"
              rules={[{ required: true, message: '请输入显示名称' }]}
            >
              <Input placeholder="例如：GPT-4" />
            </Form.Item>

            <Form.Item
              name="modelName"
              label="模型名称"
              rules={[{ required: true, message: '请输入模型名称' }]}
            >
              <Input placeholder="例如：gpt-4" />
            </Form.Item>

            <Form.Item
              name="provider"
              label="提供商"
              rules={[{ required: true, message: '请选择提供商' }]}
            >
              <Select placeholder="选择提供商">
                {providers.map(provider => (
                  <Option key={provider.id} value={provider.id}>
                    {provider.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="apiKey"
              label="API密钥"
              rules={[{ required: true, message: '请输入API密钥' }]}
            >
              <Input.Password placeholder="输入API密钥" />
            </Form.Item>

            <Form.Item
              name="baseUrl"
              label="Base URL"
            >
              <Input placeholder="可选，自定义API地址" />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea placeholder="可选，模型描述" />
            </Form.Item>

            <div className="flex justify-end space-x-2">
              <Button onClick={() => {
                setIsModalVisible(false)
                setEditingModel(null)
                form.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingModel ? '更新' : '创建'}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  )
}
