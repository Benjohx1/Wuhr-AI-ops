# Wuhr AI Ops 开发文档

## 项目概述

Wuhr AI Ops 是一个面向运维工程师的AI助手Web系统，采用现代化技术栈构建，提供智能运维解决方案。

### 技术架构

```
Frontend (Next.js 14 + React 18)
├── UI Layer (Ant Design 5 + Tailwind CSS)
├── State Management (React Context + Custom Hooks)
├── API Layer (Next.js API Routes)
└── Backend Integration (Gemini CLI)
```

### 核心技术栈

- **框架**: Next.js 14 (App Router)
- **前端**: React 18 + TypeScript
- **UI组件**: Ant Design 5
- **样式**: Tailwind CSS
- **图表**: @ant-design/charts
- **状态管理**: React Context + Custom Hooks
- **图标**: @ant-design/icons + Lucide React

## 项目结构

```
wuhr-ai-ops/
├── app/                          # Next.js App Router
│   ├── components/               # React组件
│   │   ├── ai/                  # AI助手相关组件
│   │   ├── layout/              # 布局组件
│   │   ├── monitoring/          # 监控相关组件
│   │   ├── pages/               # 页面组件
│   │   ├── providers/           # Context提供者
│   │   ├── servers/             # 服务器管理组件
│   │   └── tools/               # 工具相关组件
│   ├── contexts/                # React Context
│   ├── hooks/                   # 自定义Hooks
│   ├── types/                   # TypeScript类型定义
│   ├── utils/                   # 工具函数
│   ├── api/                     # API路由
│   ├── globals.css              # 全局样式
│   ├── layout.tsx               # 根布局
│   └── page.tsx                 # 首页
├── docs/                        # 文档
├── public/                      # 静态资源
├── package.json                 # 项目配置
├── next.config.js               # Next.js配置
├── tailwind.config.js           # Tailwind配置
└── tsconfig.json                # TypeScript配置
```

## 核心功能模块

### 1. 全局状态管理 (`app/contexts/GlobalStateContext.tsx`)

```typescript
interface GlobalState {
  theme: 'light' | 'dark'
  providers: Provider[]
  currentProvider: Provider | null
  loading: boolean
  notifications: Notification[]
}
```

**特性**:
- 主题切换管理
- API提供商管理
- 全局加载状态
- 通知系统

### 2. AI助手模块 (`app/components/ai/`)

**核心组件**:
- `SystemChat.tsx`: 主要聊天界面
- `FileUpload.tsx`: 文件上传组件
- `MarkdownRenderer.tsx`: Markdown渲染组件
- `ReasoningChainRenderer.tsx`: 推理链渲染组件

**功能特性**:
- 实时AI对话
- 文件上传和分析
- 历史记录管理
- 流式响应支持
- 快捷命令

### 3. 服务器管理模块 (`app/servers/`)

**页面结构**:
- `/servers/list`: 服务器列表管理
- `/servers/monitor`: 监控面板
- `/servers/logs`: 日志查看

**功能特性**:
- 服务器状态监控
- 实时告警管理
- 日志查询和过滤
- 性能指标展示

### 4. 配置管理模块 (`app/config/`)

**页面结构**:
- `/config/api-keys`: API密钥管理
- `/config/models`: 模型配置
- `/config/projects`: 项目设置

**功能特性**:
- 多提供商支持
- 模型参数配置
- 连接测试验证
- 配置导入导出

### 5. 工具箱模块 (`app/tools/`)

**功能特性**:
- 内置运维工具
- 脚本执行器
- 工具分类管理
- 历史记录

## API设计

### API路由结构

```
/api/
├── gemini/
│   └── chat/              # Gemini CLI调用
├── test-provider/         # 提供商测试
├── models/               # 模型列表
└── version/              # 版本信息
```

### 核心类型定义

```typescript
// API请求类型
interface GeminiCliRequest {
  message: string
  provider: ProviderType
  model: string
  apiKey?: string
  baseUrl?: string
  temperature?: number
  maxTokens?: number
  autoExecution?: boolean
}

// API响应类型
interface GeminiCliResponse {
  success: boolean
  model: string
  timestamp: string
  response?: string
  error?: string
  details?: string
  usage?: TokenUsage
  toolCalls?: ToolCall[]
}
```

## 组件开发规范

### 1. 组件结构规范

```typescript
'use client'

import React from 'react'
import { ComponentProps } from './types'

interface Props extends ComponentProps {
  // 组件特定属性
}

const ComponentName: React.FC<Props> = ({
  // 解构props
}) => {
  // hooks
  // 状态管理
  // 事件处理函数
  // 渲染辅助函数
  
  return (
    // JSX
  )
}

export default ComponentName
```

### 2. 样式规范

**Tailwind CSS优先**:
```typescript
<div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800">
```

**Ant Design主题**:
```typescript
<Card className="glass-card">
  <Button className="btn-primary">
```

### 3. 状态管理规范

**使用Context + Hooks模式**:
```typescript
// Context定义
const StateContext = createContext<StateType | null>(null)

// Hook封装
export const useStateContext = () => {
  const context = useContext(StateContext)
  if (!context) {
    throw new Error('useStateContext must be used within StateProvider')
  }
  return context
}
```

### 4. 错误处理规范

**组件级错误边界**:
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

**API调用错误处理**:
```typescript
try {
  const result = await apiCall()
  // 处理成功响应
} catch (error) {
  console.error('API调用失败:', error)
  // 用户友好的错误提示
}
```

## 性能优化指南

### 1. 代码分割

```typescript
// 动态导入
const LazyComponent = dynamic(() => import('./Component'), {
  loading: () => <Spin />,
  ssr: false
})
```

### 2. 图片优化

```typescript
import Image from 'next/image'

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority // 重要图片
/>
```

### 3. 缓存策略

```typescript
// API响应缓存
export const revalidate = 60 // 60秒

// 静态生成
export async function generateStaticParams() {
  // 静态参数生成
}
```

## 测试策略

### 1. 单元测试
- 组件渲染测试
- Hook功能测试
- 工具函数测试

### 2. 集成测试
- API路由测试
- 用户交互流程测试
- 状态管理测试

### 3. E2E测试
- 完整用户流程
- 跨浏览器兼容性
- 性能测试

## 部署指南

### 1. 开发环境

```bash
npm install
npm run dev
```

### 2. 生产构建

```bash
npm run build
npm start
```

### 3. Docker部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 贡献指南

### 1. 开发流程
1. Fork项目
2. 创建功能分支
3. 提交变更
4. 创建Pull Request

### 2. 代码规范
- 使用TypeScript严格模式
- 遵循ESLint规则
- 编写有意义的提交信息
- 添加必要的注释和文档

### 3. 版本管理
- 使用语义化版本
- 主要功能发布标记里程碑
- 维护CHANGELOG.md

## 常见问题

### Q: 如何添加新的AI提供商？
A: 在`types/api.ts`中添加新的`ProviderType`，然后在相关组件中添加支持。

### Q: 如何自定义主题？
A: 修改`tailwind.config.js`和全局CSS变量，确保支持深色/浅色模式。

### Q: 如何添加新的工具？
A: 在`utils/tools.ts`中添加工具定义，在`ToolCard.tsx`中添加渲染逻辑。

## 联系信息

- **项目网址**: wuhrai.com
- **API服务**: ai.wuhrai.com
- **聊天服务**: gpt.wuhrai.com
- **邮箱**: 1139804291@qq.com

---

更新日期: 2025-06-29 