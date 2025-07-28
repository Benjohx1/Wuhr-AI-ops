# Wuhr AI Ops 智能运维平台

<div align="center">

**🚀 智能化运维管理平台 - 让AI为运维赋能**

[![GitHub stars](https://img.shields.io/github/stars/st-lzh/Wuhr-AI-ops?style=social)](https://github.com/st-lzh/Wuhr-AI-ops/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/st-lzh/Wuhr-AI-ops?style=social)](https://github.com/st-lzh/Wuhr-AI-ops/network/members)
[![GitHub issues](https://img.shields.io/github/issues/st-lzh/Wuhr-AI-ops)](https://github.com/st-lzh/Wuhr-AI-ops/issues)
[![GitHub license](https://img.shields.io/github/license/st-lzh/Wuhr-AI-ops)](https://github.com/st-lzh/Wuhr-AI-ops/blob/main/LICENSE)

[English](./README_EN.md) | 简体中文

</div>

## 📋 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [部署指南](#部署指南)
- [使用文档](#使用文档)
- [API文档](#api文档)
- [贡献指南](#贡献指南)
- [许可证](#许可证)
- [联系我们](#联系我们)

## 🎯 项目简介

**Wuhr AI Ops** 是一个现代化的AI驱动智能运维管理平台，集成了多模态AI助手、实时监控、日志分析、CI/CD管理和用户权限管理等功能。平台通过人工智能技术简化复杂的运维任务，为运维团队提供一站式解决方案。

### 🌟 核心亮点

- 🤖 **智能AI助手** - 集成GPT-4o、Gemini等多模态AI模型，支持自然语言运维操作
- 🔧 **多模式命令执行** - 支持K8s集群和Linux系统命令的智能切换
- 📊 **实时监控** - 集成ELK日志分析和Grafana性能监控
- 🚀 **CI/CD管理** - 自动化部署流水线和Jenkins集成
- 👥 **权限管理** - 基于角色的访问控制和审批流程
- 🌐 **多环境支持** - 本地和远程主机统一管理

## ✨ 功能特性

### 🤖 AI智能助手

- **多模态交互** - 支持文本、图像等多种输入方式
- **命令模式切换** - 一键切换K8s集群和Linux系统命令环境
- **智能命令建议** - AI自动分析并建议最佳运维操作
- **上下文理解** - 支持连续对话和上下文关联
- **自动执行** - 可选的命令自动执行功能

### 📊 监控与分析

- **ELK日志分析** - 基于Elasticsearch的实时日志搜索和分析
- **Grafana监控** - 系统性能和应用指标实时监控
- **自定义仪表板** - 可配置的监控面板和告警规则
- **日志聚合** - 多主机日志统一收集和分析

### 🚀 CI/CD管理

- **流水线管理** - 可视化的部署流水线配置
- **Jenkins集成** - 完整的Jenkins任务管理和执行
- **容器化部署** - Docker和Kubernetes部署支持
- **审批流程** - 部署前审批和权限控制

### 🔐 用户权限管理

- **角色权限** - 细粒度的功能模块访问控制
- **用户审批** - 新用户注册审批机制
- **操作审计** - 完整的用户操作日志记录
- **通知系统** - 实时消息推送和工作流通知

### 🛠️ 系统管理

- **多主机管理** - 统一管理本地和远程服务器
- **配置管理** - AI模型配置和API密钥管理
- **数据备份** - 自动化数据备份和恢复
- **健康检查** - 系统组件健康状态监控

## 🚀 快速开始

### 系统要求

- **操作系统**: Linux/macOS/Windows
- **Node.js**: >= 18.0.0 (推荐 20.0+)
- **npm**: >= 8.0.0 (推荐 10.0+)
- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0
- **内存**: >= 4GB
- **硬盘**: >= 20GB 可用空间

### 一键启动

```bash
# 克隆项目
git clone https://github.com/st-lzh/Wuhr-AI-ops.git
cd Wuhr-AI-ops

# 一键启动（自动检测环境、安装依赖、启动服务）
./install.sh
```

> **🔧 智能环境检测**：脚本会自动检测系统环境，如果缺少Docker、Node.js等必需组件，会询问是否自动安装
> 
> **⚙️ 启动方式选择**：
> - **前台运行模式**：开发测试使用，可查看实时日志
> - **系统服务模式**：生产环境使用，开机自启，后台运行

### 手动部署

```bash
# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库和AI API密钥

# 安装依赖
npm install

# 启动Docker服务
docker-compose up -d

# 数据库迁移
npx prisma migrate deploy
npx prisma generate

# 启动应用
npm run build
npm start
```

### 访问地址

- **主应用**: http://localhost:3000

### 默认账户

- **用户名**: admin
- **邮箱**: admin@wuhr.ai
- **密码**: Admin123!

## ⚙️ 系统服务管理

### 服务管理

```bash
# 启动服务（后台运行）
./restart.sh

# 停止服务
./restart.sh stop

# 查看日志
tail -f app.log

# 清理构建缓存（解决构建问题）
./scripts/clean-build.sh

# 完全清理重建（包括依赖）
./scripts/clean-build.sh --full
```

**功能特性**：
- 🚀 **快速启动**：跳过构建步骤，快速重启
- 🔄 **智能降级**：构建失败时自动切换到开发模式
- 🧹 **自动清理**：构建失败时自动清理缓存重试
- 📱 **进程管理**：自动管理PID文件和进程清理
- 🌐 **多IP显示**：自动显示内网和外网访问地址
- 📝 **日志管理**：统一日志输出到app.log文件

## 📦 部署指南

### 手动部署

1. **环境准备**
```bash
# 克隆项目
git clone https://github.com/st-lzh/Wuhr-AI-ops.git
cd Wuhr-AI-ops

# 安装Docker和Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

2. **配置环境**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
vim .env
```

3. **启动服务**
```bash
# 后台启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

### 传统部署

1. **安装依赖**
```bash
# 安装Node.js依赖
npm install

# 安装并配置PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# 安装并配置Redis
sudo apt-get install redis-server
```

2. **配置数据库**
```bash
# 创建数据库
sudo -u postgres createdb wuhr_ai_ops

# 运行数据库迁移
npx prisma migrate deploy

# 初始化数据
npm run db:seed
```

3. **启动应用**
```bash
# 构建应用
npm run build

# 启动生产服务器
npm start
```

## 📖 使用文档

### AI助手使用

1. **访问AI助手页面** - 导航到 "AI助手" 模块
2. **选择模型** - 在设置中配置AI模型和API密钥
3. **模式切换** - 使用K8s按钮或快捷键(Ctrl+K)切换命令环境
4. **发送指令** - 输入自然语言运维指令
5. **查看结果** - AI助手将自动执行命令并返回结果

### 主机管理

1. **添加主机** - 在主机管理页面添加远程服务器
2. **配置连接** - 设置SSH连接信息和认证方式
3. **测试连接** - 验证主机连接状态
4. **监控配置** - 配置ELK和Grafana监控

### 用户权限管理

1. **用户注册** - 新用户注册需要管理员审批
2. **角色分配** - 为用户分配相应的权限角色
3. **权限控制** - 基于角色的功能模块访问控制
4. **审计日志** - 查看用户操作历史记录

### 快捷键

- `Ctrl + K` - 切换K8s/Linux命令模式
- `Ctrl + L` - 强制切换到Linux模式
- `Enter` - 发送消息
- `Shift + Enter` - 换行

## 📚 API文档

### 认证API

```typescript
// 用户登录
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

// 获取用户信息
GET /api/auth/profile
Authorization: Bearer <token>
```

### AI助手API

```typescript
// 发送AI指令
POST /api/system/chat
{
  "message": "检查系统状态",
  "model": "gpt-4o",
  "isK8sMode": false,
  "autoExecution": true
}
```

### 主机管理API

```typescript
// 获取主机列表
GET /api/servers

// 添加主机
POST /api/servers
{
  "name": "服务器名称",
  "ip": "192.168.1.100",
  "port": 22,
  "username": "root"
}
```

更多API文档请参考: [API Documentation](./docs/API.md)

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 开发环境设置

```bash
# Fork项目到你的GitHub账户
# 克隆你的Fork
git clone https://github.com/YOUR-USERNAME/Wuhr-AI-ops.git
cd Wuhr-AI-ops

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test
```

### 提交规范

- 使用有意义的commit message
- 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范
- 提交前运行 `npm run lint` 检查代码规范

### Pull Request流程

1. Fork项目并创建功能分支
2. 进行开发并编写测试
3. 确保所有测试通过
4. 提交Pull Request并描述变更内容
5. 等待代码审查和合并

## 📝 更新日志

### v1.0.0 (2025-01-30)

- 🎉 初始版本发布
- 🤖 AI助手核心功能
- 📊 ELK日志分析集成
- 🚀 CI/CD管理模块
- 👥 用户权限管理系统
- 🔧 多主机管理功能

查看完整更新日志: [CHANGELOG.md](./CHANGELOG.md)

## ❓ 常见问题

### Q: 如何添加新的AI模型？
A: 在模型管理页面点击"添加模型"，选择提供商类型并配置API信息。

### Q: 为什么AI助手执行命令失败？
A: 请检查主机连接状态、用户权限和命令模式是否正确。

### Q: 如何配置远程主机监控？
A: 在主机管理页面添加服务器后，配置相应的ELK和Grafana连接信息。

更多问题请查看: [FAQ](./docs/FAQ.md)

## 🔒 安全说明

- 请定期更新系统组件和依赖
- 使用强密码和双因素认证
- 定期备份重要数据
- 限制网络访问和端口开放
- 审查用户权限和操作日志

## 📄 许可证

本项目采用 [MIT License (Modified)](./LICENSE) 开源协议。

### 🏢 商用说明

- **个人学习和非商业用途**: 完全免费使用
- **商业用途**: 请联系作者获得授权 (1139804291@qq.com)
- **二次开发和重新分发**: 请联系作者获得授权 (1139804291@qq.com)
- **教育机构**: 可免费用于教学和学术研究

### 📝 署名要求

使用本软件时，请保留以下署名信息：
```
技术支持：Wuhr AI Ops - https://github.com/st-lzh/Wuhr-AI-ops
```

## 🙏 致谢

感谢以下开源项目的支持：

- [Next.js](https://nextjs.org/) - React框架
- [Ant Design](https://ant.design/) - UI组件库
- [Prisma](https://www.prisma.io/) - 数据库ORM
- [Docker](https://www.docker.com/) - 容器化平台
- [ELK Stack](https://www.elastic.co/) - 日志分析套件

## 📞 联系我们

- **开发者**: st-lzh
- **邮箱**: 1139804291@qq.com
- **博客**: [wuhrai.com](https://wuhrai.com)
- **AI接口**: [ai.wuhrai.com](https://ai.wuhrai.com)
- **Chat服务**: [gpt.wuhrai.com](https://gpt.wuhrai.com)

### 技术支持

- **GitHub Issues**: [提交问题](https://github.com/st-lzh/Wuhr-AI-ops/issues)
- **讨论区**: [GitHub Discussions](https://github.com/st-lzh/Wuhr-AI-ops/discussions)
- **文档**: [项目文档](./docs/)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个星标！**

Made with ❤️ by [st-lzh](https://github.com/st-lzh)

</div>