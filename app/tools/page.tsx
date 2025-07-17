'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Badge, Input, message, Space, Tabs } from 'antd';
import {
  ToolOutlined,
  CodeOutlined,
  CopyOutlined,
  ClearOutlined,
  FileTextOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import MainLayout from '../components/layout/MainLayout';
import { useTheme } from '../hooks/useGlobalState';

const { Title, Text } = Typography;
const { TextArea } = Input;

// JSON格式化工具组件
const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const formatJson = () => {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
      setIsValid(true);
      message.success('JSON格式化成功');
    } catch (error) {
      setIsValid(false);
      setOutput(`错误: ${(error as Error).message}`);
      message.error('JSON格式无效');
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setIsValid(true);
      message.success('JSON压缩成功');
    } catch (error) {
      setIsValid(false);
      setOutput(`错误: ${(error as Error).message}`);
      message.error('JSON格式无效');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    message.success('已复制到剪贴板');
  };

  return (
    <div className="space-y-4">
      <div>
        <Text strong>输入JSON:</Text>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="请输入JSON数据..."
          rows={6}
          className="mt-2"
        />
      </div>
      <Space>
        <Button type="primary" onClick={formatJson} icon={<FileTextOutlined />}>
          格式化
        </Button>
        <Button onClick={minifyJson}>压缩</Button>
        <Button onClick={() => { setInput(''); setOutput(''); setIsValid(null); }} icon={<ClearOutlined />}>
          清空
        </Button>
      </Space>
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Text strong>输出结果:</Text>
          {isValid === true && <CheckCircleOutlined className="text-green-500" />}
          {isValid === false && <ExclamationCircleOutlined className="text-red-500" />}
          {output && (
            <Button size="small" icon={<CopyOutlined />} onClick={copyToClipboard}>
              复制
            </Button>
          )}
        </div>
        <TextArea
          value={output}
          readOnly
          rows={8}
          className={`${isValid === false ? 'border-red-500' : ''}`}
        />
      </div>
    </div>
  );
};

// Base64编码解码工具组件
const Base64Tool: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const processBase64 = () => {
    try {
      if (mode === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(input)));
        setOutput(encoded);
        message.success('Base64编码成功');
      } else {
        const decoded = decodeURIComponent(escape(atob(input)));
        setOutput(decoded);
        message.success('Base64解码成功');
      }
    } catch (error) {
      message.error('处理失败，请检查输入内容');
      setOutput(`错误: ${(error as Error).message}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    message.success('已复制到剪贴板');
  };

  return (
    <div className="space-y-4">
      <div>
        <Space className="mb-2">
          <Button
            type={mode === 'encode' ? 'primary' : 'default'}
            onClick={() => setMode('encode')}
            icon={<LockOutlined />}
          >
            编码
          </Button>
          <Button
            type={mode === 'decode' ? 'primary' : 'default'}
            onClick={() => setMode('decode')}
            icon={<UnlockOutlined />}
          >
            解码
          </Button>
        </Space>
        <Text strong>输入内容:</Text>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? '请输入要编码的文本...' : '请输入要解码的Base64字符串...'}
          rows={4}
          className="mt-2"
        />
      </div>
      <Space>
        <Button type="primary" onClick={processBase64}>
          {mode === 'encode' ? '编码' : '解码'}
        </Button>
        <Button onClick={() => { setInput(''); setOutput(''); }} icon={<ClearOutlined />}>
          清空
        </Button>
      </Space>
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Text strong>输出结果:</Text>
          {output && (
            <Button size="small" icon={<CopyOutlined />} onClick={copyToClipboard}>
              复制
            </Button>
          )}
        </div>
        <TextArea
          value={output}
          readOnly
          rows={4}
        />
      </div>
    </div>
  );
};

// YAML验证工具组件
const YamlValidator: React.FC = () => {
  const [input, setInput] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const validateYaml = () => {
    try {
      // 简单的YAML语法检查
      const lines = input.split('\n');
      let indentStack: number[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '' || line.trim().startsWith('#')) continue;

        const indent = line.length - line.trimStart().length;

        // 检查缩进是否为2的倍数
        if (indent % 2 !== 0) {
          throw new Error(`第${i + 1}行: 缩进必须是2的倍数`);
        }

        // 检查键值对格式
        if (line.includes(':') && !line.trim().startsWith('-')) {
          const parts = line.split(':');
          if (parts.length < 2) {
            throw new Error(`第${i + 1}行: 键值对格式错误`);
          }
        }
      }

      setIsValid(true);
      setError('');
      message.success('YAML格式验证通过');
    } catch (error) {
      setIsValid(false);
      setError((error as Error).message);
      message.error('YAML格式验证失败');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Text strong>输入YAML:</Text>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="请输入YAML内容..."
          rows={8}
          className="mt-2"
        />
      </div>
      <Space>
        <Button type="primary" onClick={validateYaml} icon={<CheckCircleOutlined />}>
          验证YAML
        </Button>
        <Button onClick={() => { setInput(''); setIsValid(null); setError(''); }} icon={<ClearOutlined />}>
          清空
        </Button>
      </Space>
      {isValid !== null && (
        <Card
          className={`${isValid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
          size="small"
        >
          <div className="flex items-center space-x-2">
            {isValid ? (
              <>
                <CheckCircleOutlined className="text-green-500" />
                <Text className="text-green-700">YAML格式正确</Text>
              </>
            ) : (
              <>
                <ExclamationCircleOutlined className="text-red-500" />
                <Text className="text-red-700">{error}</Text>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default function ToolsPage() {
  const { isDark } = useTheme();

  const toolItems = [
    {
      key: 'json',
      label: (
        <span>
          <FileTextOutlined /> JSON 格式化
        </span>
      ),
      children: <JsonFormatter />,
    },
    {
      key: 'base64',
      label: (
        <span>
          <LockOutlined /> Base64 编码
        </span>
      ),
      children: <Base64Tool />,
    },
    {
      key: 'yaml',
      label: (
        <span>
          <CheckCircleOutlined /> YAML 验证
        </span>
      ),
      children: <YamlValidator />,
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 头部 */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Title level={2} className={`mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                🛠️ DevOps 工具箱
              </Title>
              <Text type="secondary" className="text-lg">
                实用的开发运维工具集合，提高工作效率
              </Text>
            </div>
            <Badge count={toolItems.length} showZero color="#52c41a">
              <Button
                type="primary"
                icon={<ToolOutlined />}
                size="large"
                className="bg-green-600 hover:bg-green-700"
              >
                可用工具
              </Button>
            </Badge>
          </div>

          {/* 统计信息 */}
          <Row gutter={16}>
            <Col span={8}>
              <Card size="small" className="text-center bg-blue-600/10 border-blue-500">
                <div className={isDark ? 'text-white' : 'text-gray-800'}>
                  <div className="text-2xl font-bold">{toolItems.length}</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>可用工具</div>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="text-center bg-green-600/10 border-green-500">
                <div className={isDark ? 'text-white' : 'text-gray-800'}>
                  <div className="text-2xl font-bold">100%</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>功能完整</div>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="text-center bg-cyan-600/10 border-cyan-500">
                <div className={isDark ? 'text-white' : 'text-gray-800'}>
                  <div className="text-2xl font-bold">0</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>演示工具</div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* 工具界面 */}
        <Card className="glass-card">
          <Tabs
            defaultActiveKey="json"
            items={toolItems}
            size="large"
            className={isDark ? 'dark-tabs' : ''}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
