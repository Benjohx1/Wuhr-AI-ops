# 🤖 Wuhr AI Ops

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**面向运维工程师的AI助手Web系统** - 基于 Next.js 14 + React 18 + TypeScript + Ant Design 5 构建的现代化运维AI助手平台。

## 🌟 项目特色

- 🤖 **智能AI助手**: 集成多种AI提供商（OpenAI、DeepSeek、Gemini），提供专业运维建议
- 🖥️ **服务器管理**: 全面的服务器监控、状态管理和告警系统
- 📊 **实时监控**: 系统性能监控、数据可视化和趋势分析
- 🛠️ **运维工具箱**: 集成常用运维工具和脚本执行器，提升工作效率
- ⚙️ **配置管理**: 灵活的多环境配置和项目管理
- 🎨 **现代界面**: 响应式设计，支持深色/浅色主题切换
- 🔒 **安全可靠**: 完善的错误处理、数据验证和安全机制

## 📸 系统截图

### 🏠 仪表盘
- 统计概览和快速操作入口
- 实时系统状态监控
- 最近活动记录

### 🤖 AI助手 
- 智能对话和专业建议
- 文件上传和分析
- 历史记录管理

### 🖥️ 服务器管理
- 服务器列表和状态监控
- 实时性能数据展示
- 告警管理和日志查看

### 🛠️ 工具箱
- 内置运维工具集合
- 脚本执行器
- 工具分类和历史记录

## 🚀 技术架构

### 核心技术栈
```
Frontend Stack:
├── Next.js 14 (App Router)
├── React 18 + TypeScript
├── Ant Design 5 + Tailwind CSS
├── @ant-design/charts (数据可视化)
└── React Context + Custom Hooks (状态管理)

Backend Integration:
├── Next.js API Routes
├── Gemini CLI 集成
└── 多提供商API支持
```

### 项目结构
```
wuhr-ai-ops/
├── app/                          # Next.js App Router
│   ├── components/               # React组件库
│   │   ├── ai/                  # AI助手组件
│   │   ├── layout/              # 布局组件
│   │   ├── monitoring/          # 监控组件
│   │   ├── pages/               # 页面组件
│   │   ├── providers/           # Context提供者
│   │   ├── servers/             # 服务器管理组件
│   │   └── tools/               # 工具组件
│   ├── contexts/                # 全局状态管理
│   ├── hooks/                   # 自定义Hooks
│   ├── types/                   # TypeScript类型定义
│   ├── utils/                   # 工具函数
│   └── api/                     # API路由
├── docs/                        # 完整文档
│   ├── development.md           # 开发指南
│   ├── deployment.md            # 部署指南
│   └── user-guide.md            # 用户手册
└── public/                      # 静态资源
```

## 🛠️ 核心功能

### 1. 🤖 AI助手系统
- **多提供商支持**: OpenAI兼容、DeepSeek、Gemini
- **实时对话**: 流式响应和智能建议
- **文件分析**: 支持多文件上传和内容分析
- **历史管理**: 对话记录保存和搜索
- **快捷命令**: `/help`、`@file`、`!command` 等

### 2. 🖥️ 服务器管理
- **状态监控**: 实时服务器状态和性能指标
- **告警系统**: 智能告警和处理流程
- **日志管理**: 多维度日志筛选和实时查看
- **操作控制**: 服务器启动、重启、配置管理

### 3. 📊 系统监控
- **性能指标**: CPU、内存、磁盘、网络使用率
- **数据可视化**: 实时图表和趋势分析
- **告警面板**: 活跃告警管理和详情查看
- **健康状态**: 系统整体健康度监控

### 4. 🛠️ 运维工具箱
- **内置工具**: 时间戳转换、JSON格式化、Base64编码、Ping测试、端口扫描、密码生成
- **脚本执行器**: 支持Bash、Python、JavaScript、PowerShell
- **工具分类**: 系统、网络、安全、文本工具
- **历史记录**: 工具使用历史和收藏管理

### 5. ⚙️ 配置管理
- **API管理**: 多提供商API密钥和配置
- **模型配置**: AI模型参数和自定义配置
- **项目设置**: 多环境项目管理和配置
- **导入导出**: 配置文件的备份和恢复

## 🚀 快速部署

### 环境要求
- Node.js >= 18.0.0
- Docker & Docker Compose
- Git

### 一键部署

```bash
# 克隆项目
git clone <repository-url>
cd wuhr-ai-ops

# 一键部署
./deploy.sh
```

### 部署选项

```bash
# 全新安装（清除所有数据）
./deploy.sh --fresh-install

# 备份后部署
./deploy.sh --backup-first

# 开发模式
./deploy.sh --dev

# 生产模式
./deploy.sh --prod
```

### 手动部署

1. **克隆项目**
```bash
git clone <repository-url>
cd wuhr-ai-ops
```

2. **安装依赖**
```bash
npm install
```

3. **启动数据库服务**
```bash
docker-compose up -d postgres redis
```

4. **数据库迁移**
```bash
npx prisma migrate dev
```

5. **启动应用**
```bash
npm run dev
```

### 访问地址

- **应用程序**: http://localhost:3000
- **pgAdmin**: http://localhost:5050
- **Redis**: localhost:6379

**默认管理员账号**:
- 邮箱: admin@wuhr.ai
- 密码: Admin123!

## 📊 数据管理

### 数据备份

```bash
# 备份数据库
./scripts/backup-database.sh

# 查看备份文件
ls -la data/backups/
```

### 数据恢复

```bash
# 恢复最新备份
./scripts/restore-database.sh

# 恢复指定备份
./scripts/restore-database.sh wuhr_ai_ops_backup_20250130.sql.gz

# 查看可用备份
./scripts/restore-database.sh --help
```

### 自动初始化

新部署时，系统会自动检查并导入备份数据：
- 优先使用 `data/backups/latest_backup.sql.gz`
- 备选使用 `docker/init-scripts/init-data.sql`
- 无备份时创建空数据库

### 数据目录结构

```
data/
├── backups/                    # 数据库备份文件
│   ├── latest_backup.sql.gz   # 最新备份（软链接）
│   └── wuhr_ai_ops_backup_*.sql.gz
└── deployments/               # 部署相关文件
```

详细部署指南请参考: [docs/deployment.md](docs/deployment.md)

## 📋 使用指南

### 1. 配置AI提供商
1. 访问 **项目配置** → **API 密钥管理**
2. 点击 **添加提供商** 并填写配置
3. 测试连接确保配置正确

### 2. 使用AI助手
1. 访问 **AI 助手** → **System Chat**
2. 在输入框中输入问题或使用快捷命令
3. 支持文件上传和历史记录查看

### 3. 监控服务器
1. 访问 **服务器管理** → **监控面板**
2. 查看实时性能指标和告警信息
3. 管理告警和查看详细日志

### 4. 使用工具箱
1. 访问 **工具箱** 查看所有可用工具
2. 点击工具卡片使用相应功能
3. 使用脚本执行器运行自定义脚本

更多详细使用说明请参考: [docs/user-guide.md](docs/user-guide.md)

## 🔧 配置说明

### API提供商配置示例

**OpenAI兼容**:
```env
提供商类型: OpenAI 兼容
API 密钥: sk-xxxxxxxxxxxxxxxx
基础 URL: https://api.openai.com/v1
```

**DeepSeek**:
```env
提供商类型: DeepSeek
API 密钥: sk-xxxxxxxxxxxxxxxx
```

**Gemini**:
```env
提供商类型: Gemini
API 密钥: AIxxxxxxxxxxxxxxxx
```

## 📚 文档

- 📖 [开发指南](docs/development.md) - 详细的开发文档和架构说明
- 🚀 [部署指南](docs/deployment.md) - 完整的部署配置和运维说明
- 👥 [用户手册](docs/user-guide.md) - 功能使用和配置指南
- 🔌 [API文档](docs/api-integration.md) - API集成和开发接口

## 🔄 更新日志

### v1.0.0 (2025-06-29)
- 🎉 首次发布
- ✨ 完整的AI助手功能
- 🖥️ 服务器管理和监控
- 🛠️ 运维工具箱
- ⚙️ 配置管理系统
- 🎨 现代化响应式界面
- 📱 移动端适配
- 🔒 安全性和错误处理

## 🤝 贡献指南

欢迎贡献代码和建议！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 规则
- 编写有意义的提交信息
- 添加必要的注释和文档

## 🛡️ 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- **🌐 官网**: [wuhrai.com](https://wuhrai.com)
- **🤖 API服务**: [ai.wuhrai.com](https://ai.wuhrai.com)  
- **💬 在线聊天**: [gpt.wuhrai.com](https://gpt.wuhrai.com)
- **📧 邮箱**: 1139804291@qq.com

## 🙏 致谢

感谢以下开源项目的支持：
- [Next.js](https://nextjs.org/) - React 全栈框架
- [Ant Design](https://ant.design/) - 企业级UI组件库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [TypeScript](https://www.typescriptlang.org/) - JavaScript的超集

---

**⭐ 如果这个项目对您有帮助，请给我们一个 Star！**

<div align="center">
  <img src="https://wuhrai-wordpress.oss-cn-hangzhou.aliyuncs.com/%E5%9B%BE%E6%A0%87/%E5%88%9B%E5%BB%BA%E8%B5%9B%E5%8D%9A%E6%9C%8B%E5%85%8B%E5%9B%BE%E6%A0%87%20%283%29.png" alt="Wuhr AI Logo" width="64" height="64">
  
  **Wuhr AI Ops - 让运维更智能** ✨
</div>