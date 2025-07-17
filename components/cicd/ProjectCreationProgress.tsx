'use client'

import React, { useState, useEffect } from 'react'
import { Card, Progress, Typography, Space, Alert, Button } from 'antd'
import { 
  CheckCircleOutlined, 
  LoadingOutlined, 
  ExclamationCircleOutlined,
  CloseCircleOutlined 
} from '@ant-design/icons'
import ProjectLogViewer from './ProjectLogViewer'

const { Title, Text } = Typography

interface ProjectCreationProgressProps {
  projectId?: string
  projectName?: string
  onComplete?: (success: boolean) => void
  onCancel?: () => void
}

interface LogEntry {
  timestamp: string
  level: string
  action: string
  message: string
  details?: any
}

interface CreationStep {
  key: string
  title: string
  status: 'waiting' | 'running' | 'success' | 'error'
  message?: string
}

const ProjectCreationProgress: React.FC<ProjectCreationProgressProps> = ({
  projectId,
  projectName,
  onComplete,
  onCancel
}) => {
  const [steps, setSteps] = useState<CreationStep[]>([
    { key: 'validation', title: '验证项目配置', status: 'waiting' },
    { key: 'git_check', title: '检查Git仓库', status: 'waiting' },
    { key: 'build_setup', title: '配置构建脚本', status: 'waiting' },
    { key: 'deploy_setup', title: '配置部署脚本', status: 'waiting' },
    { key: 'completed', title: '项目创建完成', status: 'waiting' }
  ])

  const [currentStep, setCurrentStep] = useState(0)
  const [overallStatus, setOverallStatus] = useState<'running' | 'success' | 'error'>('running')
  const [progress, setProgress] = useState(0)

  // 监听日志更新，根据日志内容更新步骤状态
  const handleLogUpdate = (log: LogEntry) => {
    if (log.details?.step) {
      const stepKey = log.details.step
      const stepIndex = steps.findIndex(s => s.key === stepKey)
      
      if (stepIndex !== -1) {
        setSteps(prevSteps => {
          const newSteps = [...prevSteps]
          
          // 更新当前步骤状态
          if (log.level === 'success') {
            newSteps[stepIndex].status = 'success'
            newSteps[stepIndex].message = log.message
          } else if (log.level === 'error') {
            newSteps[stepIndex].status = 'error'
            newSteps[stepIndex].message = log.message
          } else {
            newSteps[stepIndex].status = 'running'
            newSteps[stepIndex].message = log.message
          }
          
          return newSteps
        })
        
        // 更新当前步骤索引
        setCurrentStep(stepIndex)
        
        // 更新进度
        const newProgress = ((stepIndex + 1) / steps.length) * 100
        setProgress(newProgress)
        
        // 检查是否完成
        if (stepKey === 'completed') {
          if (log.level === 'success') {
            setOverallStatus('success')
            setTimeout(() => onComplete?.(true), 1000)
          } else if (log.level === 'error') {
            setOverallStatus('error')
            setTimeout(() => onComplete?.(false), 1000)
          }
        }
      }
    }
  }

  // 获取步骤图标
  const getStepIcon = (step: CreationStep) => {
    switch (step.status) {
      case 'running':
        return <LoadingOutlined className="text-blue-500" />
      case 'success':
        return <CheckCircleOutlined className="text-green-500" />
      case 'error':
        return <CloseCircleOutlined className="text-red-500" />
      default:
        return <ExclamationCircleOutlined className="text-gray-400" />
    }
  }

  // 获取整体状态颜色
  const getProgressColor = () => {
    switch (overallStatus) {
      case 'success':
        return '#52c41a'
      case 'error':
        return '#ff4d4f'
      default:
        return '#1890ff'
    }
  }

  return (
    <div className="project-creation-progress">
      {/* 整体进度 */}
      <Card size="small" className="mb-4">
        <div className="text-center mb-4">
          <Title level={4}>
            {overallStatus === 'running' && '正在创建项目...'}
            {overallStatus === 'success' && '项目创建成功！'}
            {overallStatus === 'error' && '项目创建失败'}
          </Title>
          {projectName && (
            <Text type="secondary">项目名称: {projectName}</Text>
          )}
        </div>

        <Progress
          percent={progress}
          strokeColor={getProgressColor()}
          status={overallStatus === 'error' ? 'exception' : 'active'}
          showInfo={true}
        />

        {/* 步骤详情 */}
        <div className="mt-4 space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`flex items-center p-2 rounded ${
                index === currentStep ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="mr-3">
                {getStepIcon(step)}
              </div>
              <div className="flex-1">
                <div className="font-medium">{step.title}</div>
                {step.message && (
                  <div className="text-sm text-gray-500">{step.message}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 状态提示 */}
        {overallStatus === 'success' && (
          <Alert
            message="项目创建成功"
            description="您的项目已成功创建，可以开始使用CI/CD功能了。"
            type="success"
            showIcon
            className="mt-4"
          />
        )}

        {overallStatus === 'error' && (
          <Alert
            message="项目创建失败"
            description="项目创建过程中出现错误，请检查配置后重试。"
            type="error"
            showIcon
            className="mt-4"
            action={
              <Button size="small" onClick={onCancel}>
                返回修改
              </Button>
            }
          />
        )}
      </Card>

      {/* 实时日志 */}
      {projectId && (
        <ProjectLogViewer
          projectId={projectId}
          height={300}
          realtime={true}
          showControls={false}
          onNewLog={handleLogUpdate}
        />
      )}
    </div>
  )
}

export default ProjectCreationProgress
