# 远程部署配置指南

本文档说明如何配置和使用优化后的远程部署功能，支持直接在远程主机的项目目录执行部署命令。

## 功能概述

新的远程部署功能提供两种部署模式：

1. **远程项目目录模式**（推荐）：直接在远程主机的项目目录执行部署命令
2. **传统传输模式**：将构建产物传输到远程主机后执行部署

## 配置参数

### 新增配置项

```typescript
interface DeploymentConfig {
  // ... 其他配置
  
  // 远程部署配置
  remoteProjectPath?: string  // 远程主机上的项目路径
  useRemoteProject?: boolean  // 是否直接在远程主机的项目目录执行部署
}
```

### 配置示例

#### 1. 远程项目目录模式配置

```json
{
  "deploymentId": "deploy-001",
  "hostId": "prod-server-01",
  "repositoryUrl": "https://github.com/company/project.git",
  "branch": "main",
  "buildScript": "npm ci && npm run build",
  "deployScript": "npm ci --only=production && pm2 restart app",
  "useRemoteProject": true,
  "remoteProjectPath": "/var/www/myapp",
  "environment": {
    "NODE_ENV": "production",
    "PORT": "3000"
  }
}
```

#### 2. 传统传输模式配置

```json
{
  "deploymentId": "deploy-002", 
  "hostId": "prod-server-01",
  "repositoryUrl": "https://github.com/company/project.git",
  "branch": "main",
  "buildScript": "npm ci && npm run build",
  "deployScript": "npm ci --only=production && pm2 restart app",
  "useRemoteProject": false,
  "environment": {
    "NODE_ENV": "production"
  }
}
```

## 部署流程

### 远程项目目录模式流程

1. **本地代码拉取**：在本地拉取最新代码（用于构建）
2. **本地构建**：执行构建脚本（如果配置）
3. **远程代码更新**：直接在远程主机更新项目代码
4. **远程部署**：在远程项目目录执行部署脚本

### 传统传输模式流程

1. **本地代码拉取**：在本地拉取最新代码
2. **本地构建**：执行构建脚本
3. **文件传输**：将构建产物传输到远程主机
4. **远程部署**：在远程临时目录执行部署脚本

## 优势对比

### 远程项目目录模式优势

✅ **保留代码历史**：不删除远程项目目录，保持Git历史
✅ **增量更新**：支持Git增量更新，部署更快
✅ **配置持久化**：远程配置文件不会丢失
✅ **简化流程**：直接在项目目录操作，更符合常规部署习惯
✅ **支持分支切换**：可以轻松切换不同分支部署

### 传统模式适用场景

- 需要复杂的构建产物处理
- 远程主机没有Git环境
- 需要严格的文件传输控制

## 部署脚本示例

### Node.js 应用部署脚本

```bash
#!/bin/bash
# 远程项目目录模式部署脚本

# 安装依赖
npm ci --only=production

# 构建应用（如果需要）
npm run build

# 停止现有服务
pm2 stop myapp || true

# 启动服务
pm2 start ecosystem.config.js

# 验证部署
sleep 5
curl -f http://localhost:3000/health || exit 1

echo "✅ 部署完成"
```

### Docker 应用部署脚本

```bash
#!/bin/bash
# Docker应用部署脚本

# 构建新镜像
docker build -t myapp:latest .

# 停止现有容器
docker stop myapp || true
docker rm myapp || true

# 启动新容器
docker run -d \
  --name myapp \
  --restart unless-stopped \
  -p 3000:3000 \
  myapp:latest

# 验证部署
sleep 10
docker ps | grep myapp
curl -f http://localhost:3000/health || exit 1

echo "✅ Docker部署完成"
```

## 错误处理和恢复

### 代码更新失败处理

系统会自动尝试多种恢复策略：

1. **Git重置**：尝试强制重置到最新提交
2. **重新初始化**：删除.git目录重新初始化
3. **备份恢复**：备份重要配置文件后重新克隆

### 常见问题解决

#### 1. 远程项目目录不存在

```bash
# 系统会自动创建目录
mkdir -p /var/www/myapp
```

#### 2. Git权限问题

```bash
# 确保部署用户有Git操作权限
chown -R deploy:deploy /var/www/myapp
```

#### 3. 分支切换失败

```bash
# 系统会自动处理分支切换
git fetch origin main
git checkout -B main origin/main
```

## 最佳实践

### 1. 目录结构建议

```
/var/www/myapp/          # 项目根目录
├── .git/                # Git仓库
├── src/                 # 源代码
├── dist/                # 构建产物
├── node_modules/        # 依赖
├── .env                 # 环境配置
├── ecosystem.config.js  # PM2配置
└── deploy.sh           # 部署脚本
```

### 2. 权限配置

```bash
# 创建部署用户
useradd -m -s /bin/bash deploy

# 设置目录权限
chown -R deploy:deploy /var/www/myapp
chmod 755 /var/www/myapp

# 配置sudo权限（如需要）
echo "deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart myapp" >> /etc/sudoers.d/deploy
```

### 3. 环境变量管理

```bash
# 在远程项目目录创建.env文件
cat > /var/www/myapp/.env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/myapp
EOF
```

### 4. 监控和日志

```bash
# 部署脚本中添加监控
#!/bin/bash

# 记录部署开始时间
echo "$(date): 开始部署" >> /var/log/deploy.log

# 执行部署操作
npm ci --only=production
pm2 restart myapp

# 验证部署结果
if curl -f http://localhost:3000/health; then
    echo "$(date): 部署成功" >> /var/log/deploy.log
else
    echo "$(date): 部署失败" >> /var/log/deploy.log
    exit 1
fi
```

## 配置迁移指南

### 从传统模式迁移到远程项目模式

1. **备份现有配置**
2. **在远程主机创建项目目录**
3. **更新部署配置**
4. **测试部署流程**

```bash
# 迁移步骤
# 1. 在远程主机创建项目目录
ssh user@remote-host "mkdir -p /var/www/myapp"

# 2. 克隆项目到远程目录
ssh user@remote-host "cd /var/www && git clone https://github.com/company/project.git myapp"

# 3. 更新部署配置
# 设置 useRemoteProject: true
# 设置 remoteProjectPath: "/var/www/myapp"
```

通过使用新的远程项目目录模式，您可以实现更高效、更可靠的自动化部署流程。
