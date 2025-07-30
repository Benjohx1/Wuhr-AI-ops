# Wuhr AI Ops 安装指南

## 📋 概述

Wuhr AI Ops 提供了两个专门的安装脚本来适应不同的网络环境：

1. **`install-zh.sh`** - 国内环境专用脚本（中文）
2. **`install-en.sh`** - 国外环境专用脚本（英文）

## 🚀 快速开始

### 方法一：一键部署（推荐）

**国内用户一键部署:**
```bash
curl -fsSL https://raw.githubusercontent.com/st-lzh/wuhr-ai-ops/main/deploy-zh.sh | bash
```

**国外用户一键部署:**
```bash
curl -fsSL https://raw.githubusercontent.com/st-lzh/wuhr-ai-ops/main/deploy-en.sh | bash
```

### 方法二：手动克隆部署

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

### 1. deploy-zh.sh - 国内环境一键部署脚本

**功能特性：**
- 🚀 真正的一键部署，自动克隆代码
- 🇨🇳 专为中国大陆网络环境优化
- 🔍 自动检查Git和网络连接
- 📦 自动下载并执行安装脚本
- ⚡ 完整的部署流程自动化

**部署流程：**
1. 检查Git是否安装
2. 检查网络连接到GitHub
3. 自动克隆代码仓库
4. 执行install-zh.sh安装脚本
5. 显示部署完成信息

**适用场景：**
- 全新服务器部署
- 中国大陆网络环境
- 需要完全自动化部署

### 2. deploy-en.sh - 国外环境一键部署脚本

**功能特性：**
- 🚀 真正的一键部署，自动克隆代码
- 🌍 适用于全球网络环境
- 🔍 自动检查Git和网络连接
- 📦 自动下载并执行安装脚本
- ⚡ 完整的部署流程自动化

**部署流程：**
1. 检查Git是否安装
2. 检查网络连接到GitHub
3. 自动克隆代码仓库
4. 执行install-en.sh安装脚本
5. 显示部署完成信息

**适用场景：**
- 全新服务器部署
- 海外网络环境
- 需要完全自动化部署

### 3. install-zh.sh - 国内环境专用安装脚本

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

### 4. install-en.sh - 国外环境专用安装脚本

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
- 初始化数据库
- 创建管理员账户
- 初始化权限系统

### 5. 应用部署
- 安装Node.js依赖
- 构建应用
- 启动Web服务器

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

## 🔍 故障排除

### 常见问题

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