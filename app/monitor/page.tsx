'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Space,
  Typography,
  Select,
  Switch,
  Input,
  Form,
  Modal,
  message,
  Alert,
  Divider,
  Tooltip,
  Spin
} from 'antd';
import {
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  DashboardOutlined,
  MonitorOutlined,
  LinkOutlined,
  ExpandOutlined,
  ExclamationCircleOutlined,

} from '@ant-design/icons';
import MainLayout from '../components/layout/MainLayout';
import { useTheme } from '../hooks/useGlobalState';
import { apiClient } from '../utils/apiClient';

const { Title, Text } = Typography;
const { Option } = Select;

interface GrafanaDashboard {
  id: string;
  uid?: string;
  name: string;
  url: string;
  description?: string;
  category: 'system' | 'application' | 'network' | 'custom';
  tags?: string[];
  starred?: boolean;
  custom?: boolean;
}

interface GrafanaConfig {
  serverUrl: string;
  username: string;
  password: string;
  apiKey: string;
  orgId: number;
  enabled: boolean;
  dashboards: GrafanaDashboard[];
}

export default function MonitorPage() {
  const { isDark } = useTheme();
  const [dashboards, setDashboards] = useState<GrafanaDashboard[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<GrafanaDashboard | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('5s');
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [grafanaConfig, setGrafanaConfig] = useState<GrafanaConfig | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [form] = Form.useForm();

  // 获取Grafana配置
  const fetchGrafanaConfig = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/grafana/config')
      const data = response.data as any
      if (data.success) {
        setGrafanaConfig(data.data.config)
        setIsConfigured(data.data.isConfigured)
        return data.data.config
      }
    } catch (error) {
      console.error('获取Grafana配置失败:', error)
      message.error('获取Grafana配置失败')
    }
    return null
  }, [])

  // 获取仪表板列表
  const fetchDashboards = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/grafana/dashboards')
      const data = response.data as any
      if (data.success) {
        const dashboardList = data.data.dashboards
        setDashboards(dashboardList)
        if (dashboardList.length > 0 && !currentDashboard) {
          setCurrentDashboard(dashboardList[0])
        }
        if (data.data.warning) {
          message.warning(data.data.warning)
        }
      }
    } catch (error) {
      console.error('获取仪表板列表失败:', error)
      // 如果API失败，使用默认配置
      const defaultDashboards: GrafanaDashboard[] = [
        {
          id: 'system-overview',
          name: '系统概览',
          url: 'http://localhost:3000/d/system-overview?orgId=1&kiosk=1',
          description: '服务器CPU、内存、磁盘、网络等基础指标监控',
          category: 'system'
        }
      ]
      setDashboards(defaultDashboards)
      if (!currentDashboard) {
        setCurrentDashboard(defaultDashboards[0])
      }
    } finally {
      setLoading(false)
    }
  }, [currentDashboard])

  // Grafana配置已移至独立页面

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      setLoading(true)
      const config = await fetchGrafanaConfig()
      if (config && config.enabled) {
        await fetchDashboards()
      } else {
        setLoading(false)
      }
    }
    initData()
  }, [fetchGrafanaConfig, fetchDashboards])

  // 生成带参数的Grafana URL
  const getGrafanaUrl = useCallback((dashboard: GrafanaDashboard) => {
    const url = new URL(dashboard.url);
    
    // 添加主题参数
    url.searchParams.set('theme', isDark ? 'dark' : 'light');
    
    // 添加刷新间隔
    if (isAutoRefresh) {
      url.searchParams.set('refresh', refreshInterval);
    }
    
    // 确保kiosk模式（隐藏Grafana导航栏）
    url.searchParams.set('kiosk', '1');
    
    return url.toString();
  }, [isDark, isAutoRefresh, refreshInterval]);

  // 处理仪表板切换
  const handleDashboardChange = useCallback((dashboardId: string) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (dashboard) {
      setCurrentDashboard(dashboard);
      message.success(`已切换到 ${dashboard.name}`);
    }
  }, [dashboards]);

  // 处理自动刷新切换
  const handleAutoRefreshToggle = useCallback((enabled: boolean) => {
    setIsAutoRefresh(enabled);
    message.success(enabled ? '已启用自动刷新' : '已停用自动刷新');
  }, []);

  // 处理刷新间隔改变
  const handleRefreshIntervalChange = useCallback((interval: string) => {
    setRefreshInterval(interval);
    message.success(`刷新间隔已设置为 ${interval}`);
  }, []);

  // 手动刷新iframe
  const handleRefresh = useCallback(() => {
    const iframe = document.getElementById('grafana-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
      message.success('仪表板已刷新');
    }
  }, []);

  // 在新窗口打开Grafana
  const openInNewWindow = useCallback(() => {
    if (!currentDashboard) return;
    const url = currentDashboard.url.replace('&kiosk=1', '');
    window.open(url, '_blank');
  }, [currentDashboard]);

  // 保存自定义仪表板
  const handleSaveCustomDashboard = useCallback((values: any) => {
    const newDashboard: GrafanaDashboard = {
      id: `custom-${Date.now()}`,
      name: values.name,
      url: values.url,
      description: values.description,
      category: 'custom'
    };

    setDashboards(prev => [...prev, newDashboard]);
    setConfigModalVisible(false);
    form.resetFields();
    message.success('自定义仪表板已保存');
  }, [form]);

  // Grafana配置功能已移至独立页面 /config/grafana



  // 按类别分组的仪表板
  const dashboardsByCategory = dashboards.reduce((acc, dashboard) => {
    if (!acc[dashboard.category]) {
      acc[dashboard.category] = [];
    }
    acc[dashboard.category].push(dashboard);
    return acc;
  }, {} as Record<string, GrafanaDashboard[]>);

  const categoryNames = {
    system: '系统监控',
    application: '应用监控', 
    network: '网络监控',
    custom: '自定义'
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <MainLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>正在加载Grafana配置...</Text>
          </div>
        </div>
      </MainLayout>
    )
  }

  // 如果未配置Grafana，显示配置提示
  if (!isConfigured || !currentDashboard) {
    return (
      <MainLayout>
        <div style={{ padding: '24px' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
              <Title level={3}>Grafana 未配置</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                请先配置Grafana服务器连接信息，然后才能查看监控仪表板
              </Text>
              <Space direction="vertical" size="middle">
                <Button
                  type="primary"
                  icon={<SettingOutlined />}
                  size="large"
                  onClick={() => {
                    console.log('🔧 跳转到Grafana配置页面')
                    window.location.href = '/config/grafana'
                  }}
                  className="hover:scale-105 transition-transform duration-200"
                  style={{ pointerEvents: 'auto' }}
                >
                  立即配置
                </Button>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  点击按钮将跳转到Grafana配置页面
                </Text>
              </Space>
            </div>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题和控制栏 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <DashboardOutlined className="text-2xl text-blue-500" />
            <div>
              <Title level={2} style={{ margin: 0 }}>
                Grafana 监控中心
              </Title>
              <Text type="secondary">
                实时监控系统指标 - 数据来源：Prometheus
              </Text>
            </div>
          </div>
          
          <Space size="middle">
            {/* 仪表板选择器 */}
            <Select
              value={currentDashboard?.id}
              onChange={handleDashboardChange}
              style={{ width: 200 }}
              placeholder="选择仪表板"
            >
              {Object.entries(dashboardsByCategory).map(([category, dashboards]) => (
                <Select.OptGroup key={category} label={categoryNames[category as keyof typeof categoryNames]}>
                  {dashboards.map(dashboard => (
                    <Option key={dashboard.id} value={dashboard.id}>
                      <Space>
                        <MonitorOutlined />
                        {dashboard.name}
                      </Space>
                    </Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
            
            {/* 刷新间隔选择 */}
            <Select
              value={refreshInterval}
              onChange={handleRefreshIntervalChange}
              style={{ width: 100 }}
              disabled={!isAutoRefresh}
            >
              <Option value="5s">5秒</Option>
              <Option value="10s">10秒</Option>
              <Option value="30s">30秒</Option>
              <Option value="1m">1分钟</Option>
              <Option value="5m">5分钟</Option>
            </Select>
            
            {/* 自动刷新开关 */}
            <Space>
              <Text>自动刷新</Text>
              <Switch
                checked={isAutoRefresh}
                onChange={handleAutoRefreshToggle}
                checkedChildren={<PlayCircleOutlined />}
                unCheckedChildren={<PauseCircleOutlined />}
              />
            </Space>
            
            {/* 操作按钮 */}
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              刷新
            </Button>
            
            <Tooltip title="在新窗口打开完整Grafana界面">
              <Button
                icon={<ExpandOutlined />}
                onClick={openInNewWindow}
              >
                完整视图
              </Button>
            </Tooltip>
            
            <Button
              icon={<SettingOutlined />}
              onClick={() => setConfigModalVisible(true)}
            >
              配置
            </Button>
          </Space>
        </div>

        {/* 当前仪表板信息 */}
        <Alert
          message={
            <Space>
              <MonitorOutlined />
              <span><strong>{currentDashboard?.name}</strong></span>
              <Divider type="vertical" />
              <span>{currentDashboard?.description}</span>
            </Space>
          }
          type="info"
          showIcon={false}
          style={{ marginBottom: 16 }}
        />

        {/* Grafana仪表板嵌入区域 */}
        <Card
          styles={{ body: { padding: 0 } }}
          style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}
        >
          <iframe
            id="grafana-iframe"
            src={currentDashboard ? getGrafanaUrl(currentDashboard) : ''}
            width="100%"
            height="100%"
            style={{
              border: 'none',
              borderRadius: '8px'
            }}
            title={`Grafana Dashboard - ${currentDashboard?.name || 'Loading'}`}
          />
        </Card>

        {/* 快速操作面板 */}
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>当前仪表板</Text>
                <Text>{currentDashboard?.name}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  类别: {currentDashboard ? categoryNames[currentDashboard.category] : ''}
                </Text>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>刷新设置</Text>
                <Text>间隔: {refreshInterval}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  自动刷新: {isAutoRefresh ? '启用' : '停用'}
                </Text>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>主题同步</Text>
                <Text>当前: {isDark ? '暗色' : '亮色'}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  主题会自动同步到Grafana
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 配置模态框 */}
        <Modal
          title="Grafana仪表板配置"
          open={configModalVisible}
          onCancel={() => setConfigModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveCustomDashboard}
          >
            <Form.Item
              label="仪表板名称"
              name="name"
              rules={[{ required: true, message: '请输入仪表板名称' }]}
            >
              <Input placeholder="例如: 自定义系统监控" />
            </Form.Item>
            
            <Form.Item
              label="Grafana仪表板URL"
              name="url"
              rules={[
                { required: true, message: '请输入Grafana仪表板URL' },
                { type: 'url', message: '请输入有效的URL' }
              ]}
            >
              <Input 
                placeholder="http://localhost:3001/d/dashboard-id/dashboard-name?orgId=1"
                prefix={<LinkOutlined />}
              />
            </Form.Item>
            
            <Form.Item
              label="描述"
              name="description"
            >
              <Input.TextArea
                rows={3}
                placeholder="描述此仪表板的监控内容和用途"
              />
            </Form.Item>
            
            <Alert
              message="配置提示"
              description={
                <div>
                  <p>• 确保Grafana服务器可访问且已配置Prometheus数据源</p>
                  <p>• URL中会自动添加kiosk=1参数以隐藏Grafana导航栏</p>
                  <p>• 主题和刷新参数会自动根据当前设置添加</p>
                </div>
              }
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setConfigModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存仪表板
              </Button>
            </Space>
          </Form>
        </Modal>

        {/* Grafana配置已移至独立页面 /config/grafana */}


      </div>


    </MainLayout>
  );
}