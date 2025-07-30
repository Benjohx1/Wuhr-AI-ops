# Wuhr AI Ops 安装指南

## 📋 概述

Wuhr AI Ops 提供了两个专门的安装脚本来适应不同的网络环境：

1. **`install-zh.sh`** - 国内环境专用脚本（中文）
2. **`install-en.sh`** - 国外环境专用脚本（英文）

## 🚀 快速开始

### 克隆部署

```bash
# 克隆项目
git clone https://github.com/st-lzh/wuhr-ai-ops.git
cd wuhr-ai-ops

# 国内用户使用中文安装脚本
./install-zh.sh

# 国外用户使用英文安装脚本
./install-en.sh
```

## 📖 脚本详细说明

### 1. install-zh.sh - 国内环境专用安装脚本

**功能特性：**
- 🇨🇳 专为中国大陆网络环境优化
- 🚀 自动配置国内镜像源
- 📦 自动下载 kubelet-wuhrai
- 🔧 优化Docker镜像源配置
- ⚡ 提升下载和安装速度
- 🤖 自动初始化16个主流AI模型预设

**国内镜像源配置：**
- **npm**: https://registry.npmmirror.com/
- **Docker**: 阿里云、网易、百度镜像源
- **Node.js**: 国内NodeSource镜像

**kubelet-wuhrai 下载源：**
1. 阿里云OSS（主要）
2. GitHub Releases（备用）
3. Gitee Releases（备用）

**适用场景：**
- 中国大陆网络环境
- 需要快速下载依赖包
- 希望使用国内镜像源

### 2. install-en.sh - 国外环境专用安装脚本

**功能特性：**
- 🌍 适用于全球网络环境
- 🔧 使用官方源和标准配置
- 🛡️ 增强的错误处理
- 📊 端口冲突检测
- 🔍 Docker服务状态检查
- 🤖 自动初始化16个主流AI模型预设

**官方源配置：**
- **npm**: https://registry.npmjs.org/
- **Docker**: 官方Docker Hub
- **Node.js**: 官方NodeSource

**适用场景：**
- 海外网络环境
- 希望使用官方源
- 网络连接稳定

**新增功能：**
- 端口占用检测
- Docker服务状态监控
- 改进的网络信息获取
- 更详细的错误信息

**适用场景：**
- 海外网络环境
- 需要稳定可靠的安装
- 对网络速度要求不高

## 🔧 系统要求

### 基础要求
- **操作系统**: Linux (Ubuntu 18.04+, CentOS 7+, Fedora) / macOS 10.15+
- **内存**: 最少 4GB，推荐 8GB+
- **磁盘空间**: 最少 10GB 可用空间
- **网络**: 稳定的互联网连接

### 软件要求
- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0

## 📦 安装流程

### 1. 环境检查
- 检测操作系统类型
- 验证网络连接
- 检查必要工具是否安装

### 2. 环境安装（如需要）
- 自动安装缺失的Docker
- 自动安装缺失的Node.js
- 配置相应的镜像源

### 3. 项目配置
- 检查项目文件完整性
- 创建环境配置文件
- 配置npm源

### 4. 服务启动
- 启动Docker容器（PostgreSQL、Redis、pgAdmin）
- 等待数据库服务就绪

### 5. 数据库初始化
- 重置和同步数据库架构
- 生成Prisma客户端
- 验证数据库连接

### 6. 用户和权限初始化
- 创建管理员用户（admin@wuhr.ai）
- 初始化权限系统
- 设置用户角色和权限

### 7. 预设模型初始化
- 初始化17个主流AI模型预设
- 包含OpenAI、DeepSeek、Gemini、Qwen、Doubao等
- 支持多种功能特性标记

### 8. 应用部署
- 安装Node.js依赖
- 构建应用
- 启动Web服务器

### 9. 服务验证
- 验证应用启动状态
- 检查端口可用性
- 确认服务正常运行

## 🌐 访问信息

安装完成后，您可以通过以下地址访问：

### 主应用
- **内网访问**: http://[内网IP]:3000
- **外网访问**: http://[外网IP]:3000

### 数据库管理
- **pgAdmin**: http://[IP]:5050
  - 邮箱: admin@wuhrai.com
  - 密码: admin_password_2024

### 默认管理员账户
- **用户名**: admin
- **邮箱**: admin@wuhr.ai
- **密码**: Admin123!

## 🔧 手动部署步骤

如果您需要手动部署或了解详细的安装过程，请按照以下步骤操作：

### 1. 环境准备
```bash
# 克隆项目
git clone https://github.com/st-lzh/wuhr-ai-ops.git
cd wuhr-ai-ops

# 确保安装了必要的工具
sudo apt update
sudo apt install -y curl wget git
```

### 2. 安装Docker和Docker Compose
```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker
```

### 3. 安装Node.js
```bash
# 安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 4. 启动数据库服务
```bash
# 启动Docker容器
docker-compose up -d postgres redis pgadmin

# 等待服务启动
sleep 30

# 检查服务状态
docker-compose ps
```

### 5. 安装项目依赖
```bash
# 安装npm依赖
npm install

# 清理npm缓存（可选）
npm cache clean --force
```

### 6. 数据库初始化
```bash
# 重置数据库架构
npx prisma migrate reset --force

# 生成Prisma客户端
npx prisma generate

# 验证数据库连接
npx prisma db push
```

### 7. 初始化用户和权限
```bash
# 创建管理员用户
node scripts/ensure-admin-user.js

# 初始化权限系统
node scripts/init-permissions.js

# 初始化超级管理员
node scripts/init-super-admin.ts
```

### 8. 初始化预设模型
```bash
# 初始化预设模型数据
node scripts/init-preset-models.js
```

### 9. 构建和启动应用
```bash
# 构建应用
npm run build

# 启动生产服务器
npm start

# 或者启动开发模式
npm run dev
```

### 10. 验证部署
```bash
# 检查应用状态
curl http://localhost:3000

# 检查数据库连接
curl http://localhost:5050

# 查看日志
tail -f app.log
```

## 🔍 故障排除

#### 1. 端口冲突
```bash
# 检查端口占用
netstat -tlnp | grep :3000

# 停止占用端口的进程
sudo kill -9 [进程ID]
```

#### 2. Docker服务问题
```bash
# 检查Docker状态
sudo systemctl status docker

# 重启Docker服务
sudo systemctl restart docker
```

#### 3. 网络连接问题
```bash
# 检查网络连接
ping www.baidu.com

# 检查防火墙设置
sudo ufw status
sudo ufw allow 3000
```

#### 4. 权限问题
```bash
# 添加用户到docker组
sudo usermod -aG docker $USER

# 重新登录或运行
newgrp docker
```

### 日志查看

```bash
# 应用日志
tail -f app.log

# Docker容器日志
docker-compose logs

# 特定服务日志
docker-compose logs postgres
docker-compose logs redis
```

### 重置安装

```bash
# 停止所有服务
docker-compose down

# 清理数据卷
docker-compose down -v

# 删除node_modules
rm -rf node_modules

# 重新运行安装脚本（根据您的网络环境选择）
./install-zh.sh  # 国内用户
# 或
./install-en.sh  # 国外用户
```

## 📞 技术支持

如果您遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查项目日志文件
3. 联系技术支持：1139804291@qq.com

## 🔄 更新说明

### v2.1.0 更新内容
- ✅ 重构为双脚本架构（install-zh.sh / install-en.sh）
- ✅ 移除智能选择器，简化部署流程
- ✅ 新增kubelet-wuhrai自动部署功能
- ✅ 新增智能K8s/Linux模式识别
- ✅ 自动初始化16个主流AI模型预设
- ✅ 改进错误处理和日志记录
- ✅ 优化网络信息获取和显示
- ✅ 增强Docker服务状态检查

---

**作者**: st-lzh  
**邮箱**: 1139804291@qq.com  
**项目地址**: https://github.com/st-lzh/wuhr-ai-ops 