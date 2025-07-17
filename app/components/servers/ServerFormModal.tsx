'use client'

import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Button,
  message,
  Alert
} from 'antd'
import {
  PlusOutlined,
  SaveOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { ServerInfo, ServerFormData } from '../../types/access-management'
import ServerFormFields from './ServerFormFields'
import ServerTagManager from './ServerTagManager'
import ServerConnectionTest from './ServerConnectionTest'

interface ServerFormModalProps {
  visible: boolean
  mode: 'add' | 'edit'
  server?: ServerInfo | null
  onCancel: () => void
  onSuccess: (server: ServerInfo) => void
  onDelete?: (serverId: string) => void
}

const ServerFormModal: React.FC<ServerFormModalProps> = ({
  visible,
  mode,
  server,
  onCancel,
  onSuccess,
  onDelete
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  const isEdit = mode === 'edit'
  const title = isEdit ? `编辑主机 - ${server?.name || ''}` : '添加主机'

  // 初始化表单数据
  useEffect(() => {
    if (visible) {
      if (isEdit && server) {
        // 编辑模式：填充现有数据
        form.setFieldsValue({
          name: server.name,
          hostname: server.hostname,
          ip: server.ip,
          port: server.port,
          username: server.username || '',
          password: '', // 出于安全考虑，不回显密码
          keyPath: server.keyPath || '',
          os: server.os,
          version: server.version,
          location: server.location,
          description: server.description || ''
        })
        setTags(server.tags || [])
      } else {
        // 添加模式：设置默认值
        form.setFieldsValue({
          port: 22,
          os: 'Ubuntu 22.04 LTS',
          location: '北京机房'
        })
        setTags([])
      }
      setNewTag('')
    }
  }, [visible, isEdit, server, form])

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // 构建表单数据
      const formData: ServerFormData & { id?: string; tags: string[] } = {
        ...values,
        tags
      }

      if (isEdit && server) {
        formData.id = server.id
      }

      // 选择API方法和端点
      const method = isEdit ? 'PUT' : 'POST'
      const response = await fetch('/api/admin/servers', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `${isEdit ? '更新' : '添加'}主机失败`)
      }

      const result = await response.json()
      message.success(result.data.message)
      onSuccess(result.data.server)
      handleCancel()
    } catch (error) {
      console.error(`${isEdit ? '更新' : '添加'}主机失败:`, error)
      message.error(error instanceof Error ? error.message : `${isEdit ? '更新' : '添加'}主机失败，请重试`)
    } finally {
      setLoading(false)
    }
  }

  // 删除主机
  const handleDelete = async () => {
    if (!server || !onDelete) return

    try {
      setDeleteLoading(true)
      await onDelete(server.id)
      handleCancel()
    } catch (error) {
      console.error('删除主机失败:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  // 取消操作
  const handleCancel = () => {
    form.resetFields()
    setTags([])
    setNewTag('')
    onCancel()
  }

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <ServerConnectionTest
          key="test"
          form={form}
          loading={testLoading}
          onLoadingChange={setTestLoading}
          serverId={isEdit ? server?.id : undefined}
        />,
        ...(isEdit && onDelete ? [
          <Button
            key="delete"
            danger
            icon={<DeleteOutlined />}
            loading={deleteLoading}
            onClick={handleDelete}
          >
            删除主机
          </Button>
        ] : []),
        <Button
          key="submit"
          type="primary"
          icon={isEdit ? <SaveOutlined /> : <PlusOutlined />}
          loading={loading}
          onClick={handleSubmit}
        >
          {isEdit ? '保存更改' : '添加主机'}
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Alert
          message={isEdit ? "编辑主机信息" : "添加主机提示"}
          description={
            isEdit 
              ? "修改主机配置信息。密码字段留空表示不更改现有密码。"
              : "请确保目标主机已开启SSH服务，并且网络连通。建议先进行连接测试。"
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <ServerFormFields isEdit={isEdit} />

        <ServerTagManager
          tags={tags}
          newTag={newTag}
          onTagsChange={setTags}
          onNewTagChange={setNewTag}
        />
      </Form>
    </Modal>
  )
}

export default ServerFormModal
