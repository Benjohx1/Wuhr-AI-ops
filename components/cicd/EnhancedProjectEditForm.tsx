import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Tag,
  message,
  Tabs,
  Alert
} from 'antd'
import {
  SaveOutlined,
  EyeOutlined,
  CodeOutlined,
  SettingOutlined,
  TagsOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

interface Project {
  id: string
  name: string
  description?: string
  repositoryUrl: string
  branch: string
  buildScript?: string
  deployScript?: string
  serverId?: string
  tags?: string[]
  environmentVariables?: { [key: string]: string }
  preDeployScript?: string
  postDeployScript?: string
}

interface Server {
  id: string
  name: string
  hostname: string
  ip: string
}

interface EnhancedProjectEditFormProps {
  visible: boolean
  onClose: () => void
  onSave: (project: Partial<Project>) => Promise<void>
  project?: Project
  servers: Server[]
}

const EnhancedProjectEditForm: React.FC<EnhancedProjectEditFormProps> = ({
  visible,
  onClose,
  onSave,
  project,
  servers
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [deployScript, setDeployScript] = useState('')
  const [preDeployScript, setPreDeployScript] = useState('')
  const [postDeployScript, setPostDeployScript] = useState('')
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([])
  const [tags, setTags] = useState<string[]>([])

  // 初始化表单数据
  useEffect(() => {
    if (visible && project) {
      form.setFieldsValue({
        name: project.name,
        description: project.description || '',
        repositoryUrl: project.repositoryUrl,
        branch: project.branch,
        buildScript: project.buildScript || '',
        serverId: project.serverId || undefined
      })
      
      setDeployScript(project.deployScript || '')
      setPreDeployScript(project.preDeployScript || '')
      setPostDeployScript(project.postDeployScript || '')
      setTags(project.tags || [])
      
      // 转换环境变量格式
      const envVarArray = Object.entries(project.environmentVariables || {}).map(([key, value]) => ({
        key,
        value
      }))
      setEnvVars(envVarArray)
    } else if (visible && !project) {
      // 新建项目时的默认值
      form.resetFields()
      setDeployScript('#!/bin/bash\n# 部署脚本示例\necho "开始部署..."\n# 在这里添加您的部署命令\necho "部署完成"')
      setPreDeployScript('')
      setPostDeployScript('')
      setTags([])
      setEnvVars([])
    }
  }, [visible, project, form])

  // 处理保存
  const handleSave = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      
      // 转换环境变量格式
      const environmentVariables: { [key: string]: string } = {}
      envVars.forEach(({ key, value }) => {
        if (key && value) {
          environmentVariables[key] = value
        }
      })

      const projectData: Partial<Project> = {
        ...values,
        deployScript,
        preDeployScript,
        postDeployScript,
        tags,
        environmentVariables
      }

      await onSave(projectData)
      message.success('项目保存成功')
      onClose()
    } catch (error) {
      console.error('保存项目失败:', error)
      message.error('保存项目失败')
    } finally {
      setLoading(false)
    }
  }

  // 添加环境变量
  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }])
  }

  // 删除环境变量
  const removeEnvVar = (index: number) => {
    const newEnvVars = envVars.filter((_, i) => i !== index)
    setEnvVars(newEnvVars)
  }

  // 更新环境变量
  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvVars = [...envVars]
    newEnvVars[index][field] = value
    setEnvVars(newEnvVars)
  }

  // 添加标签
  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  // 删除标签
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // 预览配置
  const renderPreview = () => {
    const values = form.getFieldsValue()
    return (
      <div style={{ padding: '16px' }}>
        <Title level={4}>项目配置预览</Title>
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 8]}>
            <Col span={12}><Text strong>项目名称:</Text> {values.name}</Col>
            <Col span={12}><Text strong>分支:</Text> {values.branch}</Col>
            <Col span={24}><Text strong>描述:</Text> {values.description}</Col>
            <Col span={24}><Text strong>仓库地址:</Text> {values.repositoryUrl}</Col>
            <Col span={12}><Text strong>目标服务器:</Text> {servers.find(s => s.id === values.serverId)?.name || '本地'}</Col>
          </Row>
        </Card>

        <Card size="small" title="部署脚本" style={{ marginBottom: '16px' }}>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px', fontSize: '12px' }}>
            {deployScript || '未设置'}
          </pre>
        </Card>

        {tags.length > 0 && (
          <Card size="small" title="项目标签" style={{ marginBottom: '16px' }}>
            {tags.map(tag => (
              <Tag key={tag} color="blue">{tag}</Tag>
            ))}
          </Card>
        )}

        {envVars.length > 0 && (
          <Card size="small" title="环境变量">
            {envVars.map(({ key, value }, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <Text code>{key}</Text> = <Text code>{value}</Text>
              </div>
            ))}
          </Card>
        )}
      </div>
    )
  }

  return (
    <Modal
      title={
        <Space>
          <CodeOutlined />
          {project ? '编辑项目' : '新建项目'}
          <Button
            type={previewMode ? 'primary' : 'default'}
            icon={<EyeOutlined />}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? '编辑模式' : '预览模式'}
          </Button>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width="80%"
      style={{ top: 20 }}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={handleSave}
            disabled={previewMode}
          >
            保存项目
          </Button>
        </Space>
      }
    >
      {previewMode ? (
        renderPreview()
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'basic',
              label: <span><SettingOutlined />基本信息</span>,
              children: (
                <Form form={form} layout="vertical">
                  <Alert
                    message="项目基本配置"
                    description="设置项目的基本信息，包括名称、描述、仓库地址等。"
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="项目名称"
                        name="name"
                        rules={[{ required: true, message: '请输入项目名称' }]}
                      >
                        <Input placeholder="输入项目名称" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="分支"
                        name="branch"
                        rules={[{ required: true, message: '请输入分支名称' }]}
                      >
                        <Input placeholder="main" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label="项目描述"
                    name="description"
                  >
                    <TextArea rows={3} placeholder="输入项目描述（可选）" />
                  </Form.Item>

                  <Form.Item
                    label="仓库地址"
                    name="repositoryUrl"
                    rules={[
                      { required: true, message: '请输入仓库地址' },
                      { type: 'url', message: '请输入有效的URL地址' }
                    ]}
                  >
                    <Input placeholder="https://github.com/user/repo.git" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="目标服务器"
                        name="serverId"
                      >
                        <Select placeholder="选择目标服务器（留空为本地部署）" allowClear>
                          {servers.map(server => (
                            <Option key={server.id} value={server.id}>
                              {server.name} ({server.ip})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="构建脚本"
                        name="buildScript"
                      >
                        <Input placeholder="npm run build（可选）" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              )
            },
            {
              key: 'scripts',
              label: <span><CodeOutlined />部署脚本</span>,
              children: (
                <div>
                  <Alert
                    message="部署脚本配置"
                    description="配置项目的部署脚本。这是简化部署流程的核心配置，系统将直接执行这些脚本。"
                    type="warning"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />

                  <Card title="主部署脚本" size="small" style={{ marginBottom: '16px' }}>
                    <TextArea
                      rows={12}
                      value={deployScript}
                      onChange={(e) => setDeployScript(e.target.value)}
                      placeholder="#!/bin/bash&#10;# 部署脚本示例&#10;echo '开始部署...'&#10;# 在这里添加您的部署命令&#10;echo '部署完成'"
                      style={{
                        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                        fontSize: '13px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #d9d9d9'
                      }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                      主要的部署脚本，系统将执行此脚本进行部署
                    </Text>
                  </Card>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Card title="部署前脚本" size="small">
                        <TextArea
                          rows={6}
                          value={preDeployScript}
                          onChange={(e) => setPreDeployScript(e.target.value)}
                          placeholder="# 部署前执行的脚本（可选）&#10;echo '准备部署...'"
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          在主部署脚本执行前运行
                        </Text>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="部署后脚本" size="small">
                        <TextArea
                          rows={6}
                          value={postDeployScript}
                          onChange={(e) => setPostDeployScript(e.target.value)}
                          placeholder="# 部署后执行的脚本（可选）&#10;echo '部署完成，进行清理...'"
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          在主部署脚本执行后运行
                        </Text>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            {
              key: 'tags',
              label: <span><TagsOutlined />标签和变量</span>,
              children: (
                <div>
                  <Alert
                    message="项目标签和环境变量"
                    description="设置项目标签用于分类管理，配置环境变量用于部署时的参数传递。"
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />

                  <Card title="项目标签" size="small" style={{ marginBottom: '16px' }}>
                    <Space wrap style={{ marginBottom: '12px' }}>
                      {tags.map(tag => (
                        <Tag
                          key={tag}
                          closable
                          onClose={() => removeTag(tag)}
                          color="blue"
                        >
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                    <Input.Search
                      placeholder="输入标签名称"
                      enterButton="添加"
                      onSearch={addTag}
                      style={{ width: '300px' }}
                    />
                  </Card>

                  <Card title="环境变量" size="small">
                    {envVars.map((envVar, index) => (
                      <Row key={index} gutter={8} style={{ marginBottom: '8px' }}>
                        <Col span={10}>
                          <Input
                            placeholder="变量名"
                            value={envVar.key}
                            onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                          />
                        </Col>
                        <Col span={12}>
                          <Input
                            placeholder="变量值"
                            value={envVar.value}
                            onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                          />
                        </Col>
                        <Col span={2}>
                          <Button
                            type="text"
                            danger
                            onClick={() => removeEnvVar(index)}
                          >
                            删除
                          </Button>
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" onClick={addEnvVar} style={{ width: '100%' }}>
                      + 添加环境变量
                    </Button>
                  </Card>
                </div>
              )
            }
          ]}
        />
      )}
    </Modal>
  )
}

export default EnhancedProjectEditForm
