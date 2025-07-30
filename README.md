<img width="1512" height="949" alt="截屏2025-07-31 00 34 53" src="https://github.com/user-attachments/assets/bdfb9e4f-ff6d-49fa-b72e-fbceef8050db" />
 Wuhr AI Ops 智能运维平台

<div align="center">

**🚀 智能化运维管理平台 - 让AI为运维赋能**

[![GitHub stars](https://img.shields.io/github/stars/st-lzh/Wuhr-AI-ops?style=social)](https://github.com/st-lzh/Wuhr-AI-ops/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/st-lzh/Wuhr-AI-ops?style=social)](https://github.com/st-lzh/Wuhr-AI-ops/network/members)
[![GitHub issues](https://img.shields.io/github/issues/st-lzh/Wuhr-AI-ops)](https://github.com/st-lzh/Wuhr-AI-ops/issues)
[![GitHub license](https://img.shields.io/github/license/st-lzh/Wuhr-AI-ops)](https://github.com/st-lzh/Wuhr-AI-ops/blob/main/LICENSE)

[English](./README_EN.md) | 简体中文

</div>



## 🎯 项目简介

**Wuhr AI Ops** 是一个现代化的AI驱动智能运维管理平台，集成了多模态AI助手、实时监控、日志分析、CI/CD管理和用户权限管理等功能。平台通过人工智能技术简化复杂的运维任务，为运维团队提供一站式解决方案。

### 🌟 核心亮点

- 🤖 **智能AI助手** - 集成GPT-4o、Gemini等多模态AI模型，支持自然语言运维操作
- 🔧 **多模式命令执行** - 支持K8s集群和Linux系统命令的智能切换
- 📊 **实时监控** - 集成ELK日志分析和Grafana性能监控
- 🚀 **CI/CD管理** - 自动化部署流水线和Jenkins集成
- 👥 **权限管理** - 基于角色的访问控制和审批流程
- 🌐 **多环境支持** - 本地和远程主机统一管理

## 📸 截图预览与菜单介绍

<details>
<summary>点击展开查看系统界面预览和功能介绍</summary>

### 🎯 主要功能模块

#### 📊 仪表盘
- **功能描述**: 系统总览页面，展示关键指标和快速访问入口
- **主要特性**:
  - 系统状态概览
  - 快速操作面板
  - 实时数据展示
  - 资源使用统计
<img width="1512" height="949" alt="截屏2025-07-31 00 34 53" src="https://github.com/user-attachments/assets/ff80c242-60c4-46e1-9145-c825f63adf06" />

#### 🤖 AI助手
- **功能描述**: 智能运维助手，支持自然语言交互执行运维命令
- **主要特性**:
  - 多模态AI模型支持（GPT-4o、deepseek等）
  - K8s集群和Linux系统模式智能切换
  - 快捷命令面板（系统监控、进程分析、存储管理等）
  - 远程主机命令执行，kubelet-wuhrai命令检测，没有安装会自动安装
  - 会话历史管理
  - 实时命令执行反馈
  <img width="1512" height="949" alt="截屏2025-07-31 00 35 10" src="https://github.com/user-attachments/assets/3232f58d-c4e2-4c7e-be4e-91b25fa12519" />


#### 🖥️ 主机管理
- **功能描述**: 统一管理本地和远程服务器资源
- **主要特性**:
  - SSH连接配置和测试
  - 服务器状态监控
  - 批量主机操作
  - 连接认证管理
  - 主机分组管理
<img width="1512" height="949" alt="截屏2025-07-31 00 36 09" src="https://github.com/user-attachments/assets/41838a1d-4b04-4c8d-aa85-288c60484652" />

#### 👥 用户管理
- **功能描述**: 完整的用户权限管理系统
- **子模块**:
  - **用户信息**: 用户账户管理、权限分配
  - **用户权限**: 基于角色的访问控制（RBAC）
  - **通知管理**: 系统通知、审批消息、工作流提醒
- **主要特性**:
  - 用户注册审批机制
  - 细粒度权限控制
  - 操作审计日志
  - 实时通知
    <img width="1512" height="949" alt="截屏2025-07-31 00 35 24" src="https://github.com/user-attachments/assets/54131833-1ea9-40f9-854d-6b182d13ea31" />

#### 🚀 CI/CD管理
- **功能描述**: 完整的持续集成和持续部署解决方案
- **子模块**:
  - **持续集成**: 代码构建、测试自动化
  - **持续部署**: 自动化部署流程管理
  - **Jenkins部署任务**: Jenkins集成和任务管理
  - **模板管理**: 部署模板配置（K8s、Docker、Shell、Ansible）
  - **审批管理**: 部署审批流程和历史记录
- **主要特性**:
  - 可视化流水线配置
  - 多环境部署支持
  - 审批工作流
  - 部署回滚机制
<img width="1512" height="949" alt="截屏2025-07-31 00 36 18" src="https://github.com/user-attachments/assets/63fb8237-e3f0-4334-9e5f-3cef255428cd" />

#### ⚙️ 模型管理
- **功能描述**: AI模型配置和API管理
- **子模块**:
  - **模型配置**: 自定义AI模型接入
  - **预设模型**: 系统预置的AI模型模板
- **主要特性**:
  - 多AI提供商支持
  - API密钥管理
  - 模型性能测试
  - 使用统计分析
<img width="1512" height="949" alt="截屏2025-07-31 00 35 38" src="https://github.com/user-attachments/assets/498cf1ba-6284-4355-b560-e0cdef530f28" />
<img width="1512" height="949" alt="截屏2025-07-31 00 35 52" src="https://github.com/user-attachments/assets/d27e490a-127a-491d-9124-17d6ff979400" />


#### 🔗 接入管理
- **功能描述**: 第三方系统集成和监控配置
- **子模块**:
  - **ELK日志**: Elasticsearch日志分析配置
  - **Grafana监控**: 性能监控面板配置
- **主要特性**:
  - 日志聚合和搜索
  - 自定义监控面板
  - 告警规则配置
  - 数据可视化
<img width="1512" height="949" alt="截屏2025-07-31 00 36 24" src="https://github.com/user-attachments/assets/f1542c91-c14a-4462-90f8-b7a8623458ea" />
<img width="1512" height="949" alt="截屏2025-07-31 00 36 29" src="https://github.com/user-attachments/assets/3be99a5b-a041-4468-afd0-ed78ff725f70" />

#### 🛠️ 工具箱
- **功能描述**: 常用运维工具集合
- **主要特性**:
  - 系统诊断工具
  - 网络测试工具
  - 文件传输工具
  - 批量操作工具

### 🎥 视频操作指南

> **📹 [完整操作演示视频](https://www.bilibili.com/video/BV1EK86ziE2y/?vd_source=56a061d9ef5994305d047165b2c6a3d5)**

> 视频内容将包括：
> - 系统安装部署演示
> - AI助手使用技巧
> - CI/CD流水线配置
> - 监控告警设置
> - 权限管理最佳实践

</details>

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

#### 📦 克隆部署

```bash
# 克隆项目
git clone https://github.com/st-lzh/wuhr-ai-ops.git
cd wuhr-ai-ops

# 国内用户使用中文安装脚本
./install-zh.sh

# 国外用户使用英文安装脚本  
./install-en.sh
```

> **🔧 智能环境检测**：脚本会自动检测系统环境，如果缺少Docker、Node.js等必需组件，会询问是否自动安装
> 
> **🌍 环境适配**：
> - **国内版本 (install-zh.sh)**：使用国内镜像源，优化网络下载速度
> - **国外版本 (install-en.sh)**：使用官方镜像源，适合国际网络环境
> 
> **⚙️ 启动方式选择**：
> - **前台运行模式**：开发测试使用，可查看实时日志
> - **系统服务模式**：生产环境使用，开机自启，后台运行

### 手动部署

```bash
# 1. 环境准备
git clone https://github.com/st-lzh/wuhr-ai-ops.git
cd wuhr-ai-ops

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库和AI API密钥

# 3. 配置npm镜像源（国内用户）
npm config set registry https://registry.npmmirror.com/

# 4. 下载kubelet-wuhrai工具
wget -O kubelet-wuhrai https://wuhrai-wordpress.oss-cn-hangzhou.aliyuncs.com/kubelet-wuhrai
chmod +x kubelet-wuhrai

# 5. 启动数据库服务
docker-compose up -d postgres redis pgadmin
sleep 30

# 6. 安装依赖
npm install

# 7. 数据库初始化
npx prisma migrate reset --force
npx prisma generate
npx prisma db push

# 8. 初始化用户和权限
node scripts/ensure-admin-user.js
node scripts/init-permissions.js
node scripts/init-super-admin.ts

# 9. 初始化预设模型
node scripts/init-preset-models.js

# 10. 初始化ELK模板
node scripts/init-elk-templates.js

# 11. 构建和启动应用
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

更多API文档请参考项目源码中的API路由实现

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

更多问题请通过GitHub Issues或邮件联系我们

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
- **文档**: [项目README](./README.md)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个星标！**

Made with ❤️ by [st-lzh](https://github.com/st-lzh)

</div>
