'use client'

import React from 'react'
import { Typography } from 'antd'
import { RocketOutlined } from '@ant-design/icons'
import MainLayout from '../../components/layout/MainLayout'
import DeploymentManager from '../../../components/cicd/DeploymentManager'

const { Title, Paragraph } = Typography

const DeploymentsPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="p-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} className="mb-2">
            <RocketOutlined className="mr-2" />
            部署管理
          </Title>
          <Paragraph className="text-gray-600 mb-0">
            管理CI/CD部署任务，执行和监控部署过程
          </Paragraph>
        </div>

        {/* 部署管理组件 */}
        <DeploymentManager />
      </div>
    </MainLayout>
  )
}

export default DeploymentsPage
