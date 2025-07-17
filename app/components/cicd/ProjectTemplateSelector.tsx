'use client'

import React, { useState } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Button, 
  Input, 
  Select, 
  Space,
  Tooltip,
  Badge
} from 'antd'
import {
  SearchOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  LinkOutlined
} from '@ant-design/icons'
import { ProjectTemplate, PROJECT_TEMPLATES } from '../../types/project-template'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

interface ProjectTemplateSelectorProps {
  selectedTemplate?: ProjectTemplate
  onSelect: (template: ProjectTemplate) => void
  showRecommendations?: boolean
  recommendations?: Array<{
    template: ProjectTemplate
    reason: string
    confidence: number
  }>
}

const ProjectTemplateSelector: React.FC<ProjectTemplateSelectorProps> = ({
  selectedTemplate,
  onSelect,
  showRecommendations = false,
  recommendations = []
}) => {
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // 过滤模板
  const filteredTemplates = PROJECT_TEMPLATES.filter(template => {
    const matchesSearch = !searchText || 
      template.name.toLowerCase().includes(searchText.toLowerCase()) ||
      template.description.toLowerCase().includes(searchText.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  // 获取推荐模板
  const recommendedTemplates = recommendations.map(rec => rec.template.id)

  // 分类选项
  const categoryOptions = [
    { value: 'all', label: '全部' },
    { value: 'frontend', label: '前端' },
    { value: 'backend', label: '后端' },
    { value: 'fullstack', label: '全栈' },
    { value: 'mobile', label: '移动端' },
    { value: 'devops', label: 'DevOps' }
  ]

  const renderTemplateCard = (template: ProjectTemplate) => {
    const isSelected = selectedTemplate?.id === template.id
    const isRecommended = recommendedTemplates.includes(template.id)
    const recommendation = recommendations.find(rec => rec.template.id === template.id)

    return (
      <Col xs={24} sm={12} lg={8} xl={6} key={template.id}>
        <Card
          hoverable
          className={`template-card ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelect(template)}
          style={{
            height: '100%',
            border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
            position: 'relative'
          }}
          bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          {/* 推荐标识 */}
          {isRecommended && (
            <Badge.Ribbon 
              text={`推荐 ${Math.round((recommendation?.confidence || 0) * 100)}%`}
              color="gold"
            />
          )}

          {/* 选中标识 */}
          {isSelected && (
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />
            </div>
          )}

          <div style={{ flex: 1 }}>
            {/* 图标和标题 */}
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>
                {template.icon}
              </div>
              <Title level={5} style={{ margin: 0 }}>
                {template.name}
              </Title>
            </div>

            {/* 描述 */}
            <Paragraph 
              style={{ 
                fontSize: 12, 
                color: '#666', 
                textAlign: 'center',
                marginBottom: 12,
                minHeight: 40
              }}
            >
              {template.description}
            </Paragraph>

            {/* 推荐原因 */}
            {isRecommended && recommendation && (
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  💡 {recommendation.reason}
                </Text>
              </div>
            )}

            {/* 标签 */}
            <div style={{ marginBottom: 12 }}>
              {template.tags.slice(0, 3).map(tag => (
                <Tag key={tag} style={{ fontSize: 10, margin: '2px' }}>
                  {tag}
                </Tag>
              ))}
              {template.tags.length > 3 && (
                <Tag style={{ fontSize: 10, margin: '2px' }}>
                  +{template.tags.length - 3}
                </Tag>
              )}
            </div>

            {/* 要求 */}
            {template.requirements && template.requirements.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 10 }}>
                  要求: {template.requirements.slice(0, 2).join(', ')}
                  {template.requirements.length > 2 && '...'}
                </Text>
              </div>
            )}
          </div>

          {/* 底部操作 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tag color={getCategoryColor(template.category)}>
              {getCategoryLabel(template.category)}
            </Tag>
            
            {template.documentation && (
              <Tooltip title="查看文档">
                <Button
                  type="text"
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(template.documentation, '_blank')
                  }}
                />
              </Tooltip>
            )}
          </div>
        </Card>
      </Col>
    )
  }

  return (
    <div className="project-template-selector">
      {/* 搜索和过滤 */}
      <div style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="搜索模板名称、描述或技术栈..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: 120 }}
            >
              {categoryOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </div>

      {/* 推荐提示 */}
      {showRecommendations && recommendations.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            <Text type="secondary">
              基于仓库分析，为您推荐了 {recommendations.length} 个模板
            </Text>
          </Space>
        </div>
      )}

      {/* 模板网格 */}
      <Row gutter={[16, 16]}>
        {filteredTemplates.map(renderTemplateCard)}
      </Row>

      {/* 无结果提示 */}
      {filteredTemplates.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">
            没有找到匹配的模板，请尝试调整搜索条件
          </Text>
        </div>
      )}

      <style jsx>{`
        .template-card {
          transition: all 0.3s ease;
        }
        
        .template-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .template-card.selected {
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
        }
      `}</style>
    </div>
  )
}

// 获取分类颜色
function getCategoryColor(category: string): string {
  const colors = {
    frontend: 'blue',
    backend: 'green',
    fullstack: 'purple',
    mobile: 'orange',
    devops: 'red'
  }
  return colors[category as keyof typeof colors] || 'default'
}

// 获取分类标签
function getCategoryLabel(category: string): string {
  const labels = {
    frontend: '前端',
    backend: '后端',
    fullstack: '全栈',
    mobile: '移动端',
    devops: 'DevOps'
  }
  return labels[category as keyof typeof labels] || category
}

export default ProjectTemplateSelector
