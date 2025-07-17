'use client'

import React, { useEffect, useState } from 'react'
import {
  Form,
  Input,
  Select,
  Card,
  Typography,
  Space,
  Button,
  Alert,
  Tooltip,
  Tag,
  Collapse
} from 'antd'
import {
  CodeOutlined,
  RocketOutlined,
  InfoCircleOutlined,
  BulbOutlined,
  CopyOutlined,
  SettingOutlined
} from '@ant-design/icons'
import BuildTemplateManager from './BuildTemplateManager'
import {
  ProjectTemplate,
  RepositoryInfo,
  ProjectDetectionResult
} from '../../types/project-template'
import { ServerInfo } from '../../types/server'
import HostSelector from './HostSelector'

const { TextArea } = Input
const { Text, Title } = Typography
const { Option } = Select
const { Panel } = Collapse

interface BuildConfigEditorProps {
  form: any
  template?: ProjectTemplate
  repositoryInfo?: RepositoryInfo | null
  detection?: ProjectDetectionResult | null
  onServerSelect?: (serverId: string | undefined, serverInfo: ServerInfo | null) => void
}

const BuildConfigEditor: React.FC<BuildConfigEditorProps> = ({
  form,
  template,
  repositoryInfo,
  detection,
  onServerSelect
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [templateManagerVisible, setTemplateManagerVisible] = useState(false)

  // 预设的构建脚本模板
  const buildScriptTemplates = {
    'npm': {
      build: 'npm install && npm run build',
      deploy: 'npm run deploy',
      test: 'npm test'
    },
    'yarn': {
      build: 'yarn install && yarn build',
      deploy: 'yarn deploy',
      test: 'yarn test'
    },
    'maven': {
      build: './mvnw clean package',
      deploy: 'java -jar target/*.jar',
      test: './mvnw test'
    },
    'gradle': {
      build: './gradlew build',
      deploy: 'java -jar build/libs/*.jar',
      test: './gradlew test'
    },
    'pip': {
      build: 'pip install -r requirements.txt',
      deploy: 'python app.py',
      test: 'python -m pytest'
    },
    'docker': {
      build: 'docker build -t app .',
      deploy: 'docker run -p 3000:3000 app',
      test: 'docker run app npm test'
    },
    'kubernetes': {
      build: 'docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} .\ndocker push ${IMAGE_NAME}:${BUILD_NUMBER}',
      deploy: 'kubectl apply -f k8s/\nkubectl set image deployment/app app=${IMAGE_NAME}:${BUILD_NUMBER}\nkubectl rollout status deployment/app',
      test: 'kubectl run test-pod --image=${IMAGE_NAME}:${BUILD_NUMBER} --rm -i --restart=Never -- npm test'
    }
  }

  // 根据检测结果或模板自动填充配置
  useEffect(() => {
    if (template && !form.getFieldValue('buildScript')) {
      form.setFieldsValue({
        buildScript: template.defaultConfig.buildScript,
        deployScript: template.defaultConfig.deployScript,
        environment: template.defaultConfig.environment
      })
    }
  }, [template, form])

  // 应用预设脚本
  const applyTemplate = (packageManager: string) => {
    const scripts = buildScriptTemplates[packageManager as keyof typeof buildScriptTemplates]
    if (scripts) {
      form.setFieldsValue({
        buildScript: scripts.build,
        deployScript: scripts.deploy
      })
    }
  }

  // 渲染智能建议
  const renderSuggestions = () => {
    if (!detection && !repositoryInfo) return null

    const suggestions = []

    // 基于检测结果的建议
    if (detection?.packageManager) {
      suggestions.push({
        type: 'packageManager',
        title: `检测到 ${detection.packageManager}`,
        description: `建议使用 ${detection.packageManager} 相关的构建脚本`,
        action: () => applyTemplate(detection.packageManager!)
      })
    }

    // Docker建议
    if (repositoryInfo?.hasDockerfile) {
      suggestions.push({
        type: 'docker',
        title: '检测到 Dockerfile',
        description: '建议使用 Docker 构建和部署',
        action: () => applyTemplate('docker')
      })
    }

    // CI/CD建议
    if (repositoryInfo?.hasCI) {
      suggestions.push({
        type: 'ci',
        title: '检测到 CI/CD 配置',
        description: '项目已有 CI/CD 配置，可参考现有脚本',
        action: null
      })
    }

    if (suggestions.length === 0) return null

    return (
      <Alert
        message="智能建议"
        description={
          <div>
            {suggestions.map((suggestion, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <Space>
                  <BulbOutlined style={{ color: '#faad14' }} />
                  <Text strong>{suggestion.title}</Text>
                  {suggestion.action && (
                    <Button 
                      type="link" 
                      size="small"
                      onClick={suggestion.action}
                    >
                      应用
                    </Button>
                  )}
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {suggestion.description}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
    )
  }

  // 渲染快速模板
  const renderQuickTemplates = () => {
    return (
      <Card
        size="small"
        title="快速模板"
        style={{ marginBottom: 16 }}
        extra={
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => setTemplateManagerVisible(true)}
          >
            管理模板
          </Button>
        }
      >
        <Space wrap>
          {Object.entries(buildScriptTemplates).map(([key, scripts]) => (
            <Button
              key={key}
              size="small"
              onClick={() => applyTemplate(key)}
              icon={<CopyOutlined />}
            >
              {key.toUpperCase()}
            </Button>
          ))}
        </Space>
      </Card>
    )
  }

  return (
    <div className="build-config-editor">
      {/* 智能建议 */}
      {renderSuggestions()}

      {/* 快速模板 */}
      {renderQuickTemplates()}

      {/* 基本配置 */}
      <Card title="构建配置" style={{ marginBottom: 16 }}>
        <Form.Item
          name="buildScript"
          label={
            <Space>
              <CodeOutlined />
              <span>构建脚本</span>
              <Tooltip title="用于编译、打包项目的命令">
                <InfoCircleOutlined style={{ color: '#999' }} />
              </Tooltip>
            </Space>
          }
          rules={[{ required: true, message: '请输入构建脚本' }]}
        >
          <TextArea
            placeholder="输入构建命令，如: npm install && npm run build"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="deployScript"
          label={
            <Space>
              <RocketOutlined />
              <span>部署脚本</span>
              <Tooltip title="用于启动、部署项目的命令">
                <InfoCircleOutlined style={{ color: '#999' }} />
              </Tooltip>
            </Space>
          }
          rules={[{ required: true, message: '请输入部署脚本' }]}
        >
          <TextArea
            placeholder="输入部署命令，如: npm start"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="environment"
          label="默认环境"
          rules={[{ required: true, message: '请选择默认环境' }]}
        >
          <Select placeholder="选择默认部署环境">
            <Option value="dev">开发环境</Option>
            <Option value="test">测试环境</Option>
            <Option value="prod">生产环境</Option>
          </Select>
        </Form.Item>
      </Card>

      {/* 主机选择 */}
      <Card title="部署配置" style={{ marginBottom: 16 }}>
        <HostSelector
          form={form}
          selectedServerId={form.getFieldValue('serverId')}
          onServerSelect={onServerSelect}
        />
      </Card>

      {/* 高级配置 */}
      <Collapse 
        ghost
        onChange={(keys) => setShowAdvanced(keys.length > 0)}
      >
        <Panel header="高级配置" key="advanced">
          <Card size="small">
            <Form.Item
              name="testScript"
              label="测试脚本"
            >
              <TextArea
                placeholder="输入测试命令，如: npm test（可选）"
                rows={2}
              />
            </Form.Item>

            <Form.Item
              name="dockerFile"
              label="Dockerfile 路径"
            >
              <Input
                placeholder="Dockerfile 文件路径，如: ./Dockerfile（可选）"
              />
            </Form.Item>

            <Form.Item
              name="workingDirectory"
              label="工作目录"
            >
              <Input
                placeholder="构建工作目录，如: ./（可选）"
              />
            </Form.Item>

            <Form.Item
              name="environmentVariables"
              label="环境变量"
            >
              <TextArea
                placeholder="环境变量配置，每行一个，格式: KEY=VALUE（可选）"
                rows={3}
              />
            </Form.Item>
          </Card>
        </Panel>
      </Collapse>

      {/* 帮助信息 */}
      <Alert
        message="配置说明"
        description={
          <div>
            <p>• <strong>构建脚本</strong>：用于编译、打包项目的命令序列</p>
            <p>• <strong>部署脚本</strong>：用于启动、部署项目的命令序列</p>
            <p>• <strong>环境变量</strong>：构建和部署过程中需要的环境变量</p>
            <p>• 多个命令可以用 <code>&&</code> 连接，如：<code>npm install && npm run build</code></p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />

      {/* 构建模板管理器 */}
      <BuildTemplateManager
        visible={templateManagerVisible}
        onCancel={() => setTemplateManagerVisible(false)}
      />
    </div>
  )
}

export default BuildConfigEditor
