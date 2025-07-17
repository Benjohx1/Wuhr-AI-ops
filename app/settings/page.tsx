'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  message,
  Spin,
  Divider
} from 'antd'
import {
  UserOutlined,
  SaveOutlined,
  EyeOutlined,
  MailOutlined
} from '@ant-design/icons'
import MainLayout from '../components/layout/MainLayout'

const { Title, Text } = Typography

interface UserProfile {
  id: string
  username: string
  email: string
  role: string
  permissions: string[]
  isActive: boolean
  approvalStatus: string
}

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // 获取当前用户资料
  const fetchProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/profile')
      const data = await response.json()
      
      if (data.success) {
        const userProfile = data.data.user
        setProfile(userProfile)

        // 设置表单初始值
        form.setFieldsValue({
          username: userProfile.username,
          email: userProfile.email
        })
      } else {
        message.error('获取用户资料失败')
      }
    } catch (error) {
      console.error('获取用户资料失败:', error)
      message.error('获取用户资料失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存用户资料
  const handleSave = async (values: any) => {
    setSaving(true)
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values)
      })

      const data = await response.json()

      if (data.success) {
        message.success('个人资料更新成功')
        setProfile(prev => prev ? { ...prev, ...values } : null)
      } else {
        message.error(data.error || '更新失败')
      }
    } catch (error) {
      console.error('更新用户资料失败:', error)
      message.error('更新失败')
    } finally {
      setSaving(false)
    }
  }



  useEffect(() => {
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </MainLayout>
    )
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <Text type="secondary">无法获取用户资料</Text>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <Title level={2} className="!mb-2">
              个人设置
            </Title>
            <Text type="secondary">
              编辑您的个人信息和偏好设置
            </Text>
          </div>
          <Button 
            icon={<EyeOutlined />}
            onClick={() => window.location.href = '/profile'}
          >
            查看资料
          </Button>
        </div>

        <Row gutter={24}>
          {/* 基本信息编辑 */}
          <Col span={24}>
            <Card title="基本信息" className="h-full">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                autoComplete="off"
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="用户名"
                      name="username"
                      rules={[
                        { required: true, message: '请输入用户名' },
                        { min: 3, message: '用户名至少3个字符' },
                        { max: 20, message: '用户名最多20个字符' }
                      ]}
                    >
                      <Input
                        prefix={<UserOutlined />}
                        placeholder="请输入用户名"
                        disabled // 用户名通常不允许修改
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="邮箱地址"
                      name="email"
                      rules={[
                        { required: true, message: '请输入邮箱地址' },
                        { type: 'email', message: '请输入有效的邮箱地址' }
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="请输入邮箱地址"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <Form.Item className="mb-0">
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={saving}
                    >
                      保存更改
                    </Button>
                    <Button
                      onClick={() => form.resetFields()}
                      disabled={saving}
                    >
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  )
}

export default SettingsPage
