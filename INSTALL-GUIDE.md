# Wuhr AI Ops 安装指南

## 📋 脚本选择

根据您的网络环境选择合适的安装脚本：

### 🇨🇳 国内用户（推荐）
```bash
./install-zh.sh
```
- **语言**: 中文界面
- **镜像源**: 国内镜像源（阿里云、网易、百度等）
- **npm源**: 淘宝镜像 (registry.npmmirror.com)
- **Docker镜像**: 阿里云Docker镜像仓库
- **kubelet-wuhrai**: 阿里云OSS + Gitee备用
- **优势**: 下载速度快，网络稳定

### 🌍 国外用户（推荐）
```bash
./install-en.sh
```
- **语言**: 英文界面
- **镜像源**: 官方源
- **npm源**: 官方npm仓库 (registry.npmjs.org)
- **Docker镜像**: 官方Docker Hub
- **kubelet-wuhrai**: GitHub Releases
- **优势**: 版本最新，稳定可靠

## 🚀 一键部署

### 快速安装（推荐）

**国内用户一键部署:**
```bash
curl -fsSL https://raw.githubusercontent.com/st-lzh/wuhr-ai-ops/main/install-zh.sh | bash
```

**国外用户一键部署:**
```bash
curl -fsSL https://raw.githubusercontent.com/st-lzh/wuhr-ai-ops/main/install-en.sh | bash
```

### 手动安装

**国内用户:**
```bash
# 下载项目
git clone https://github.com/st-lzh/wuhr-ai-ops.git
cd wuhr-ai-ops

# 运行中文版安装脚本
./install-zh.sh
```

**国外用户:**
```bash
# Download project
git clone https://github.com/st-lzh/wuhr-ai-ops.git
cd wuhr-ai-ops

# Run English installation script
./install-en.sh
```

## 🚀 快速开始

### 1. 检查系统要求
- **操作系统**: Linux (Ubuntu 18.04+, CentOS 7+) / macOS 10.15+
- **内存**: 最少 4GB，推荐 8GB+
- **磁盘**: 最少 10GB 可用空间
- **网络**: 稳定的互联网连接

### 2. 选择并运行脚本

**国内用户:**
```bash
# 下载项目
git clone https://github.com/st-lzh/wuhr-ai-ops.git
cd wuhr-ai-ops

# 运行中文版安装脚本
./install-zh.sh
```

**国外用户:**
```bash
# Download project
git clone https://github.com/st-lzh/wuhr-ai-ops.git
cd wuhr-ai-ops

# Run English installation script
./install-en.sh
```

### 3. 等待安装完成
- 安装过程约需 10-30 分钟（取决于网络速度）
- 安装日志保存在 `install.log` 文件中
- 应用日志保存在 `app.log` 文件中

## 🌐 访问应用

安装完成后，您可以通过以下地址访问：

- **主应用**: http://localhost:3000
- **数据库管理**: http://localhost:5050

### 默认管理员账户
- **用户名**: admin
- **邮箱**: admin@wuhr.ai  
- **密码**: Admin123!

## 🛠️ 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看应用日志
tail -f app.log

# 查看安装日志
tail -f install.log

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 完全清理（删除数据）
docker-compose down -v
```

## 🔧 故障排除

### 常见问题

**1. 端口被占用**
```bash
# 检查端口占用
netstat -tlnp | grep :3000
# 或
lsof -i :3000

# 停止占用进程
sudo kill -9 [进程ID]
```

**2. Docker服务未启动**
```bash
# 启动Docker服务
sudo systemctl start docker

# 设置开机自启
sudo systemctl enable docker
```

**3. 权限问题**
```bash
# 添加用户到docker组
sudo usermod -aG docker $USER

# 重新登录或运行
newgrp docker
```

**4. 网络连接问题**
```bash
# 测试网络连接
ping www.google.com  # 国外用户
ping www.baidu.com   # 国内用户

# 检查DNS
nslookup registry.npmjs.org
```

## 📊 功能特性对比

| 功能 | install-zh.sh | install-en.sh |
|------|------------------|-------------------|
| 界面语言 | 中文 | 英文 |
| npm源 | 国内镜像 | 官方源 |
| Docker镜像 | 国内镜像 | 官方源 |
| Node.js源 | NodeSource镜像 | 官方NodeSource |
| kubelet-wuhrai | 多源下载 | GitHub下载 |
| 网络优化 | 国内优化 | 标准配置 |
| 错误处理 | 完善 | 完善 |
| 日志记录 | 详细 | 详细 |
| 自动恢复 | 支持 | 支持 |

## 📞 技术支持

如果安装过程中遇到问题：

1. 查看安装日志：`tail -f install.log`
2. 查看应用日志：`tail -f app.log`  
3. 联系技术支持：1139804291@qq.com
4. 查看项目文档：README.md

## 🔄 更新日志

### v2.0.0
- ✅ 分离国内外版本脚本
- ✅ 优化网络环境适配
- ✅ 完善错误处理机制
- ✅ 增强日志记录功能
- ✅ 支持多平台安装
- ✅ 自动环境检测
- ✅ 智能依赖管理
- ✅ 一键部署支持

---

**项目地址**: https://github.com/st-lzh/wuhr-ai-ops  
**作者**: st-lzh  
**邮箱**: 1139804291@qq.com 