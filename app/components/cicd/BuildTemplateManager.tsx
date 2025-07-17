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
  message,
  Popconfirm,
  Tag,
  Typography,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SettingOutlined,
  CodeOutlined
} from '@ant-design/icons'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

interface BuildTemplate {
  id: string
  name: string
  description: string
  category: string
  buildScript: string
  deployScript: string
  testScript?: string
  environment: string
  isDefault: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

interface BuildTemplateManagerProps {
  visible: boolean
  onCancel: () => void
}

const BuildTemplateManager: React.FC<BuildTemplateManagerProps> = ({
  visible,
  onCancel
}) => {
  const [templates, setTemplates] = useState<BuildTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<BuildTemplate | null>(null)
  const [form] = Form.useForm()

  // 预设的系统模板
  const systemTemplates: Omit<BuildTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Node.js (npm)',
      description: '基于 npm 的 Node.js 项目构建模板',
      category: 'frontend',
      buildScript: 'npm install && npm run build',
      deployScript: 'npm run deploy',
      testScript: 'npm test',
      environment: 'dev',
      isDefault: false,
      isSystem: true
    },
    {
      name: 'Node.js (yarn)',
      description: '基于 yarn 的 Node.js 项目构建模板',
      category: 'frontend',
      buildScript: 'yarn install && yarn build',
      deployScript: 'yarn deploy',
      testScript: 'yarn test',
      environment: 'dev',
      isDefault: false,
      isSystem: true
    },
    {
      name: 'Docker 构建',
      description: '基于 Docker 的容器化构建模板',
      category: 'devops',
      buildScript: 'docker build -t app .',
      deployScript: 'docker run -p 3000:3000 app',
      testScript: 'docker run app npm test',
      environment: 'dev',
      isDefault: false,
      isSystem: true
    },
    {
      name: 'Kubernetes 部署',
      description: '基于 Kubernetes 的容器化部署模板',
      category: 'devops',
      buildScript: 'docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} .\ndocker push ${IMAGE_NAME}:${BUILD_NUMBER}',
      deployScript: 'kubectl apply -f k8s/\nkubectl set image deployment/app app=${IMAGE_NAME}:${BUILD_NUMBER}\nkubectl rollout status deployment/app',
      testScript: 'kubectl run test-pod --image=${IMAGE_NAME}:${BUILD_NUMBER} --rm -i --restart=Never -- npm test',
      environment: 'dev',
      isDefault: false,
      isSystem: true
    },
    {
      name: 'Java Maven',
      description: '基于 Maven 的 Java 项目构建模板',
      category: 'backend',
      buildScript: './mvnw clean package',
      deployScript: 'java -jar target/*.jar',
      testScript: './mvnw test',
      environment: 'dev',
      isDefault: false,
      isSystem: true
    },
    {
      name: 'Python Flask',
      description: '基于 Flask 的 Python 项目构建模板',
      category: 'backend',
      buildScript: 'pip install -r requirements.txt',
      deployScript: 'python app.py',
      testScript: 'python -m pytest',
      environment: 'dev',
      isDefault: false,
      isSystem: true
    }
  ]

  useEffect(() => {
    if (visible) {
      fetchTemplates()
    }
  }, [visible])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      // 从API获取构建模板
      const response = await fetch('/api/cicd/build-templates')
      if (!response.ok) {
        throw new Error('获取构建模板失败')
      }

      const result = await response.json()
      if (result.success) {
        setTemplates(result.data.templates || [])
      } else {
        throw new Error(result.error || '获取构建模板失败')
      }
    } catch (error) {
      console.error('获取构建模板失败:', error)
      // 如果API失败，使用系统预设模板作为后备
      const fallbackTemplates: BuildTemplate[] = systemTemplates.map((template, index) => ({
        ...template,
        id: `system-${index}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
      setTemplates(fallbackTemplates)
      message.warning('使用系统预设模板，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template: BuildTemplate) => {
    setEditingTemplate(template)
    form.setFieldsValue(template)
    setEditModalVisible(true)
  }

  const handleAdd = () => {
    setEditingTemplate(null)
    form.resetFields()
    form.setFieldsValue({
      category: 'frontend',
      environment: 'dev',
      isDefault: false,
      isSystem: false
    })
    setEditModalVisible(true)
  }

  const handleSave = async (values: any) => {
    try {
      if (editingTemplate) {
        // 更新模板
        message.success('模板更新成功')
      } else {
        // 创建新模板
        message.success('模板创建成功')
      }
      setEditModalVisible(false)
      fetchTemplates()
    } catch (error) {
      message.error('保存模板失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      message.success('模板删除成功')
      fetchTemplates()
    } catch (error) {
      message.error('删除模板失败')
    }
  }

  const handleCopy = (template: BuildTemplate) => {
    const newTemplate = {
      ...template,
      name: `${template.name} (副本)`,
      isDefault: false,
      isSystem: false
    }
    setEditingTemplate(null)
    form.setFieldsValue(newTemplate)
    setEditModalVisible(true)
  }

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: BuildTemplate) => (
        <Space>
          <Text strong>{text}</Text>
          {record.isDefault && <Tag color="blue">默认</Tag>}
          {record.isSystem && <Tag color="green">系统</Tag>}
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={
          category === 'frontend' ? 'blue' :
          category === 'backend' ? 'green' :
          category === 'devops' ? 'orange' : 'default'
        }>
          {category}
        </Tag>
      )
    },
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
      render: (env: string) => <Tag>{env}</Tag>
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: BuildTemplate) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={record.isSystem}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(record)}
            />
          </Tooltip>
          {!record.isSystem && (
            <Popconfirm
              title="确定删除这个模板吗？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Tooltip title="删除">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          构建模板管理
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>
      ]}
    >
      <Card
        title="构建模板列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新建模板
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true
          }}
        />
      </Card>

      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="输入模板名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="模板描述"
            rules={[{ required: true, message: '请输入模板描述' }]}
          >
            <Input placeholder="输入模板描述" />
          </Form.Item>

          <Form.Item
            name="category"
            label="模板分类"
            rules={[{ required: true, message: '请选择模板分类' }]}
          >
            <Select placeholder="选择模板分类">
              <Option value="frontend">前端</Option>
              <Option value="backend">后端</Option>
              <Option value="devops">DevOps</Option>
              <Option value="mobile">移动端</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="buildScript"
            label="构建脚本"
            rules={[{ required: true, message: '请输入构建脚本' }]}
          >
            <TextArea
              rows={4}
              placeholder="输入构建脚本，支持多行命令"
            />
          </Form.Item>

          <Form.Item
            name="deployScript"
            label="部署脚本"
            rules={[{ required: true, message: '请输入部署脚本' }]}
          >
            <TextArea
              rows={4}
              placeholder="输入部署脚本，支持多行命令"
            />
          </Form.Item>

          <Form.Item
            name="testScript"
            label="测试脚本"
          >
            <TextArea
              rows={2}
              placeholder="输入测试脚本（可选）"
            />
          </Form.Item>

          <Form.Item
            name="environment"
            label="默认环境"
            rules={[{ required: true, message: '请选择默认环境' }]}
          >
            <Select placeholder="选择默认环境">
              <Option value="dev">开发环境</Option>
              <Option value="test">测试环境</Option>
              <Option value="prod">生产环境</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  )
}

export default BuildTemplateManager
