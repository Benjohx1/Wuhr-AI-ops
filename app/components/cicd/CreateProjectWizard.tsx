'use client'

import React, { useState, useRef } from 'react'
import {
  Modal,
  Steps,
  Form,
  Input,
  Button,
  Space,
  message,
  Typography,
  Alert
} from 'antd'
import {
  ProjectOutlined,
  BranchesOutlined,
  SettingOutlined,
  CheckOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons'
import ProjectTemplateSelector from './ProjectTemplateSelector'
import RepositoryValidator from './RepositoryValidator'
import BuildConfigEditor from './BuildConfigEditor'
import ProjectSummary from './ProjectSummary'
import ProjectCreationProgress from '../../../components/cicd/ProjectCreationProgress'
import { 
  ProjectTemplate, 
  CreateProjectWizardData, 
  RepositoryInfo, 
  ProjectDetectionResult 
} from '../../types/project-template'

const { Title, Text } = Typography

interface CreateProjectWizardProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
}

const CreateProjectWizard: React.FC<CreateProjectWizardProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [wizardData, setWizardData] = useState<Partial<CreateProjectWizardData>>({})
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [repositoryInfo, setRepositoryInfo] = useState<RepositoryInfo | null>(null)
  const [detection, setDetection] = useState<ProjectDetectionResult | null>(null)
  const [selectedServer, setSelectedServer] = useState<any>(null)

  // 步骤配置
  const steps = [
    {
      title: '基本信息',
      icon: <ProjectOutlined />,
      description: '项目名称和模板选择'
    },
    {
      title: '仓库配置',
      icon: <BranchesOutlined />,
      description: '代码仓库设置'
    },
    {
      title: '构建配置',
      icon: <SettingOutlined />,
      description: '构建和部署脚本'
    },
    {
      title: '确认创建',
      icon: <CheckOutlined />,
      description: '确认配置并创建项目'
    },
    ...(showProgress ? [{
      title: '创建进度',
      icon: <CheckOutlined />,
      description: '项目创建进度'
    }] : [])
  ]

  // 重置向导
  const resetWizard = () => {
    setCurrentStep(0)
    setWizardData({})
    setRepositoryInfo(null)
    setDetection(null)
    setCreatedProjectId(null)
    setShowProgress(false)
    form.resetFields()
  }

  // 处理取消
  const handleCancel = () => {
    resetWizard()
    onCancel()
  }

  // 下一步
  const handleNext = async () => {
    try {
      // 验证当前步骤的表单
      const values = await form.validateFields()
      
      // 更新向导数据
      setWizardData(prev => ({ ...prev, ...values }))

      // 特殊处理：第一步选择模板后，自动填充构建配置
      if (currentStep === 0 && values.template) {
        const template = values.template as ProjectTemplate
        form.setFieldsValue({
          buildScript: template.defaultConfig.buildScript,
          deployScript: template.defaultConfig.deployScript,
          environment: template.defaultConfig.environment,
          repositoryType: template.defaultConfig.repositoryType,
          branch: template.defaultConfig.branch
        })
      }

      setCurrentStep(prev => prev + 1)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 上一步
  const handlePrev = () => {
    setCurrentStep(prev => prev - 1)
  }

  // 完成创建
  const handleFinish = async () => {
    try {
      setLoading(true)
      
      // 获取最终的表单数据
      const values = await form.validateFields()
      const finalData = { ...wizardData, ...values }

      console.log('创建项目:', finalData)

      // 调用创建项目API
      const response = await fetch('/api/cicd/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: finalData.name,
          description: finalData.description,
          repositoryUrl: finalData.repositoryUrl,
          repositoryType: finalData.repositoryType,
          branch: finalData.branch,
          buildScript: finalData.buildScript,
          deployScript: finalData.deployScript,
          environment: finalData.environment,
          serverId: finalData.serverId
        })
      })

      const result = await response.json()

      if (result.success) {
        // 显示项目创建进度
        setCreatedProjectId(result.data.id)
        setShowProgress(true)
        setCurrentStep(steps.length) // 移动到进度步骤
      } else {
        message.error(result.error || '项目创建失败')
      }
    } catch (error) {
      console.error('创建项目失败:', error)
      message.error('创建项目失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理模板选择
  const handleTemplateSelect = (template: ProjectTemplate) => {
    form.setFieldsValue({ template })
    setWizardData(prev => ({ ...prev, template }))
  }

  // 处理仓库验证完成
  const handleRepositoryValidation = (repoInfo: RepositoryInfo, detectionResult?: ProjectDetectionResult) => {
    setRepositoryInfo(repoInfo)
    setDetection(detectionResult || null)

    // 如果检测到项目类型，提供模板建议
    if (detectionResult && detectionResult.suggestions.length > 0 && currentStep === 0) {
      // 可以在这里显示推荐模板的提示
    }
  }

  // 处理主机选择
  const handleServerSelect = (serverId: string | undefined, serverInfo: any) => {
    setSelectedServer(serverInfo)
    setWizardData(prev => ({ ...prev, serverId }))
  }

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>选择项目模板</Title>
              <Text type="secondary">
                选择最适合您项目的模板，我们会为您预配置构建和部署脚本
              </Text>
            </div>

            <Form.Item
              name="name"
              label="项目名称"
              rules={[
                { required: true, message: '请输入项目名称' },
                { min: 2, max: 50, message: '项目名称长度应在2-50个字符之间' }
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder="输入项目名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="项目描述"
              style={{ marginBottom: 24 }}
            >
              <Input.TextArea
                placeholder="简要描述项目功能和用途（可选）"
                rows={3}
              />
            </Form.Item>

            <Form.Item name="template">
              <ProjectTemplateSelector
                selectedTemplate={wizardData.template}
                onSelect={handleTemplateSelect}
                showRecommendations={!!detection}
                recommendations={detection?.suggestions}
              />
            </Form.Item>
          </div>
        )

      case 1:
        return (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>配置代码仓库</Title>
              <Text type="secondary">
                连接您的代码仓库，我们会验证连接并检测项目类型
              </Text>
            </div>

            <RepositoryValidator
              form={form}
              onValidationComplete={handleRepositoryValidation}
            />
          </div>
        )

      case 2:
        return (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>构建和部署配置</Title>
              <Text type="secondary">
                配置项目的构建脚本和部署命令
              </Text>
            </div>

            <BuildConfigEditor
              form={form}
              template={wizardData.template}
              repositoryInfo={repositoryInfo}
              detection={detection}
              onServerSelect={handleServerSelect}
            />
          </div>
        )

      case 3:
        return (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>确认项目配置</Title>
              <Text type="secondary">
                请确认以下配置信息，确认无误后点击创建项目
              </Text>
            </div>

            <ProjectSummary
              data={{ ...wizardData, ...form.getFieldsValue() }}
              repositoryInfo={repositoryInfo}
              detection={detection}
              selectedServer={selectedServer}
            />
          </div>
        )

      case 4:
        return (
          <div>
            <ProjectCreationProgress
              projectId={createdProjectId || undefined}
              projectName={wizardData.name}
              onComplete={(success) => {
                if (success) {
                  message.success('项目创建成功')
                  resetWizard()
                  onSuccess()
                } else {
                  message.error('项目创建失败')
                  setCurrentStep(3) // 返回到确认步骤
                  setShowProgress(false)
                }
              }}
              onCancel={() => {
                setCurrentStep(3) // 返回到确认步骤
                setShowProgress(false)
              }}
            />
          </div>
        )

      default:
        return null
    }
  }

  // 渲染底部按钮
  const renderFooter = () => {
    return (
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={handleCancel}>
            取消
          </Button>
          
          {currentStep > 0 && (
            <Button icon={<LeftOutlined />} onClick={handlePrev}>
              上一步
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button 
              type="primary" 
              icon={<RightOutlined />}
              onClick={handleNext}
            >
              下一步
            </Button>
          ) : (
            <Button 
              type="primary" 
              icon={<CheckOutlined />}
              loading={loading}
              onClick={handleFinish}
            >
              创建项目
            </Button>
          )}
        </Space>
      </div>
    )
  }

  return (
    <Modal
      title="创建新项目"
      open={visible}
      onCancel={handleCancel}
      footer={renderFooter()}
      width={800}
      destroyOnClose
      maskClosable={false}
    >
      <div style={{ marginBottom: 24 }}>
        <Steps current={currentStep} items={steps} />
      </div>

      <div style={{ minHeight: 400 }}>
        <Form
          form={form}
          layout="vertical"
          preserve={false}
        >
          {renderStepContent()}
        </Form>
      </div>
    </Modal>
  )
}

export default CreateProjectWizard
