# Wuhr AI Ops 开发路线图

## 项目概述

基于已完成的 Wuhr AI Ops Web 系统 UI 框架，按照"先全局后局部"策略制定的完整功能开发计划。

**技术栈**: Next.js 14 + React 18 + TypeScript + Ant Design 5 + Tailwind CSS
**架构**: 纯转发架构，调用 Gemini CLI 进行 AI 功能处理
**目标**: 创建商业级运维 AI 助手平台

## 开发策略

### 核心原则
1. **先全局后局部** - 优先完成影响整个系统的核心功能
2. **纯转发架构** - 不做降级处理，直接调用 Gemini CLI
3. **商业级标准** - 保持高质量的 UI 设计和用户体验
4. **预留扩展性** - 支持未来项目（如 kubelet-ai）的集成

### 开发阶段
- **阶段一**: 全局核心功能（任务 1-4）
- **阶段二**: 核心业务功能（任务 5-6）  
- **阶段三**: 业务模块开发（任务 7-9）
- **阶段四**: 文档与优化（任务 10）

## 任务详细分解

### 🔥 阶段一：全局核心功能

#### 任务 1: 全局状态管理系统实现
**优先级**: 🔥🔥🔥 **状态**: 待开始

**目标**: 实现基于 React Context 的全局状态管理系统
**影响**: 整个系统的基础设施，影响所有后续功能模块

**关键文件**:
- `app/contexts/GlobalStateContext.tsx` - 全局状态上下文
- `app/hooks/useGlobalState.ts` - 状态管理 hooks
- `app/types/global.ts` - 全局类型定义

**实现要点**:
1. 创建 GlobalStateContext 和 GlobalStateProvider
2. 定义 GlobalState 接口：theme、user、apiConfig、preferences
3. 实现 useReducer 状态管理逻辑
4. 集成 localStorage 持久化存储
5. 在 app/layout.tsx 中包装 GlobalStateProvider

**验收标准**:
- [x] 状态在组件间正确共享
- [x] localStorage 持久化正常工作
- [x] TypeScript 类型安全无错误
- [x] 性能无明显影响

---

#### 任务 2: 主题系统完善与切换功能
**优先级**: 🔥🔥🔥 **状态**: 待开始
**依赖**: 任务 1

**目标**: 实现真正的深色/浅色主题切换功能
**问题**: 当前 MainLayout 中主题切换仅为本地状态

**关键文件**:
- `app/components/providers/ThemeProvider.tsx` - 主题提供者
- `app/components/layout/MainLayout.tsx` - 集成全局主题状态
- `app/globals.css` - 完善浅色主题样式

**实现要点**:
1. 扩展全局状态中的主题管理
2. 实现 ThemeProvider 组件，动态切换 Ant Design 主题
3. 修改 MainLayout.tsx 使用全局主题状态
4. 完善 globals.css 浅色主题样式

**验收标准**:
- [x] 主题切换正常工作
- [x] 状态持久化正确
- [x] 所有组件样式适配
- [x] 切换动画流畅

---

#### 任务 3: 全局错误处理与用户反馈系统
**优先级**: 🔥🔥 **状态**: 待开始
**依赖**: 任务 1

**目标**: 实现完整的错误处理机制，提升用户体验和系统稳定性

**关键文件**:
- `app/components/ErrorBoundary.tsx` - React 错误边界
- `app/utils/errorHandler.ts` - 全局错误处理工具
- `app/hooks/useLoading.ts` - 加载状态管理
- `app/utils/apiClient.ts` - 统一 API 客户端

**实现要点**:
1. 创建 ErrorBoundary 组件，捕获组件渲染错误
2. 实现全局错误处理器，API 错误统一处理
3. 创建 LoadingProvider，全局加载状态管理
4. 集成 Ant Design message 和 notification

**验收标准**:
- [x] 错误边界正确捕获异常
- [x] API 错误统一处理
- [x] 用户收到友好提示
- [x] 系统稳定性提升

---

#### 任务 4: API 配置管理与统一客户端
**优先级**: 🔥🔥 **状态**: 待开始
**依赖**: 任务 1, 任务 3

**目标**: 创建统一的 API 客户端，替换现有分散的 API 调用方式

**关键文件**:
- `app/utils/apiClient.ts` - 统一 API 客户端实现
- `app/hooks/useApiConfig.ts` - API 配置管理 hook
- `app/api/system/chat/route.ts` - 重构现有 API 路由
- `app/types/api.ts` - API 相关类型定义

**实现要点**:
1. 创建 ApiClient 类，封装 fetch 请求逻辑
2. 实现 API 配置管理，多密钥存储和切换
3. 重构现有 API 路由，统一请求格式
4. 参考 docs/providers-usage-guide.md 中的 API 调用方式

**验收标准**:
- [x] API 调用统一管理
- [x] 多密钥切换正常
- [x] 配置验证有效
- [x] 错误处理完善

---

### 🔥 阶段二：核心业务功能

#### 任务 5: System Chat 功能增强
**优先级**: 🔥🔥 **状态**: 待开始
**依赖**: 任务 4

**目标**: 将模拟响应替换为真实的 Gemini CLI 调用

**关键文件**:
- `app/components/ai/SystemChat.tsx` - 增强功能
- `app/hooks/useRedisChat.ts` - Redis对话管理 hook
- `app/utils/redisChatHistory.ts` - Redis对话历史管理
- `app/types/chat.ts` - 统一的聊天类型定义
- `app/components/ai/FileUpload.tsx` - 文件上传组件

**实现要点**:
1. 集成真实 API 调用，支持流式响应显示
2. 对话历史管理，本地存储对话历史
3. 消息功能增强，复制、删除、导出
4. 文件上传支持，文件拖拽上传

**验收标准**:
- [x] 真实 API 调用正常
- [x] 对话历史保存和加载
- [x] 导出功能正常
- [x] 文件上传支持

---

#### 任务 6: 项目配置模块开发
**优先级**: 🔥🔥 **状态**: 待开始
**依赖**: 任务 4, 任务 2

**目标**: 实现完整的项目配置管理模块

**关键文件**:
- `app/config/api-keys/page.tsx` - API 密钥管理页面
- `app/config/models/page.tsx` - 模型配置页面
- `app/config/projects/page.tsx` - 项目设置页面
- `app/components/config/ApiKeyManager.tsx` - API 密钥管理组件

**实现要点**:
1. API 密钥管理页面，密钥列表展示和 CRUD 操作
2. 模型配置页面，支持的模型列表和参数配置
3. 项目设置页面，项目环境管理和配置模板
4. 配置导入导出功能

**验收标准**:
- [x] 配置页面正常显示
- [x] CRUD 操作正常
- [x] 配置验证有效
- [x] 导入导出功能正常

---

### 🔥 阶段三：业务模块开发

#### 任务 7: 服务器管理模块开发
**优先级**: 🔥 **状态**: 待开始
**依赖**: 任务 1, 任务 2

**目标**: 实现服务器管理功能

**关键文件**:
- `app/servers/list/page.tsx` - 服务器列表页面
- `app/servers/monitor/page.tsx` - 服务器监控页面
- `app/servers/logs/page.tsx` - 日志查看页面
- `app/components/servers/ServerCard.tsx` - 服务器卡片组件

**实现要点**:
1. 服务器列表页面，服务器信息展示和状态监控
2. 监控面板页面，实时性能图表和告警信息
3. 日志查看页面，日志实时流和搜索过滤
4. 使用模拟数据，为后续真实集成预留接口

**验收标准**:
- [x] 服务器列表正常显示
- [x] 监控图表渲染正确
- [x] 日志查看功能正常
- [x] 响应式设计适配

---

#### 任务 8: 系统监控页面开发
**优先级**: 🔥 **状态**: 待开始
**依赖**: 任务 1, 任务 2

**目标**: 实现系统监控页面

**关键文件**:
- `app/monitor/page.tsx` - 系统监控页面
- `app/components/monitor/MetricsChart.tsx` - 指标图表组件
- `app/components/monitor/AlertPanel.tsx` - 告警面板组件
- `app/utils/mockData.ts` - 模拟监控数据生成

**实现要点**:
1. 监控仪表盘设计，系统性能实时图表
2. 性能指标监控，CPU、内存、磁盘、网络
3. 历史数据分析，时间范围选择和数据对比
4. 使用模拟数据和随机生成

**验收标准**:
- [x] 监控页面正常渲染
- [x] 图表数据更新正常
- [x] 告警功能正常
- [x] 历史数据查看正常

---

#### 任务 9: 工具箱模块开发
**优先级**: 🔥 **状态**: 待开始
**依赖**: 任务 1, 任务 4

**目标**: 实现运维工具箱功能

**关键文件**:
- `app/tools/page.tsx` - 工具箱主页面
- `app/components/tools/ToolCard.tsx` - 工具卡片组件
- `app/components/tools/ScriptExecutor.tsx` - 脚本执行组件
- `app/utils/tools.ts` - 工具函数集合

**实现要点**:
1. 工具分类管理，系统工具、网络工具、安全工具
2. 常用工具实现，端口扫描、ping 测试、文本处理
3. 自定义工具支持，脚本上传执行和工具模板管理
4. 确保安全性，避免恶意脚本执行

**验收标准**:
- [x] 工具列表正常显示
- [x] 工具执行功能正常
- [x] 自定义工具支持
- [x] 安全性验证通过

---

### 🔥 阶段四：文档与优化

#### 任务 10: 开发文档编写与项目优化
**优先级**: 🔥 **状态**: 待开始
**依赖**: 任务 5, 任务 6, 任务 7, 任务 8, 任务 9

**目标**: 编写完整的开发文档，进行代码优化和最终测试

**关键文件**:
- `issues/development-roadmap.md` - 开发路线图文档
- `docs/api-integration.md` - API 集成指南
- `docs/state-management.md` - 状态管理规范
- `README.md` - 更新项目说明文档

**实现要点**:
1. 创建开发文档，记录开发过程中的经验和最佳实践
2. 代码优化，TypeScript 类型完善和组件性能优化
3. 测试和验证，功能测试覆盖和响应式设计验证
4. 为后续维护和扩展提供指导

**验收标准**:
- [x] 文档完整准确
- [x] 代码质量达标
- [x] 功能测试通过
- [x] 性能满足要求

---

## CI/CD 模块预留

当前 CI/CD 模块在菜单中已预留但暂时禁用，后续开发将包括：

- **流水线管理**: Jenkins/GitLab CI 集成
- **部署管理**: K8s/Docker 部署
- **环境管理**: 开发/测试/生产环境

---

## 技术规范

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 配置规则
- 组件使用 React Hooks
- 样式使用 Tailwind CSS + Ant Design

### 架构规范
- 纯转发架构，不做降级处理
- 基于 React Context 的状态管理
- localStorage 持久化存储
- 统一的错误处理机制

### UI/UX 规范
- 保持 glass-card 样式系统
- 深色主题为主，浅色主题为辅
- 响应式设计，支持移动端
- 动画效果流畅自然

---

## 开发环境

**系统要求**:
- Node.js 18+
- macOS/Linux/Windows
- 现代浏览器支持

**开发工具**:
- VS Code + TypeScript 扩展
- Chrome DevTools
- Git 版本控制

**启动命令**:
```bash
npm install
npm run dev
```

---

## 项目里程碑

- [ ] **里程碑 1**: 全局核心功能完成 (任务 1-4)
- [ ] **里程碑 2**: 核心业务功能完成 (任务 5-6)
- [ ] **里程碑 3**: 业务模块开发完成 (任务 7-9)
- [ ] **里程碑 4**: 项目优化与发布 (任务 10)

---

## 风险评估

### 高风险项
1. **Gemini CLI 集成复杂性** - 需要确保转发架构稳定性
2. **状态管理性能** - 大量组件共享状态可能影响性能
3. **主题切换兼容性** - 确保所有组件适配主题切换

### 缓解措施
1. 充分测试 API 转发功能
2. 合理设计状态结构，避免不必要的重渲染
3. 建立完整的主题测试用例

---

*最后更新: 2025-01-29*
*版本: 1.0* 