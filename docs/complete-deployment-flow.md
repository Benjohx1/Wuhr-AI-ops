# 完整CI/CD部署流程文档

本文档详细说明Wuhr AI Ops平台中完整的CI/CD部署流程实现。

## 流程概述

完整的CI/CD部署流程包含四个主要阶段：

1. **代码拉取阶段** - 从Git仓库获取最新代码
2. **本地构建阶段** - 执行构建脚本生成部署产物
3. **远程部署阶段** - 传输产物到目标主机并执行部署
4. **状态更新阶段** - 实时更新部署状态和日志

## 详细流程

### 阶段1: 代码拉取

#### 工作目录准备
```bash
# 创建部署工作目录
/deployments/{deploymentId}/
├── code/           # 代码目录
└── logs/           # 日志目录（可选）
```

#### Git操作
```bash
# 克隆仓库到代码目录
git clone --branch {branch} --single-branch --depth 1 {repository_url} {code_dir}

# 显示最新提交信息
git log -1 --oneline
```

#### 认证处理
- **用户名密码**: 在URL中嵌入认证信息
- **Personal Access Token**: 使用token作为用户名
- **SSH密钥**: 使用SSH协议和密钥文件

### 阶段2: 本地构建

#### 执行环境
- **工作目录**: `/deployments/{deploymentId}/code/`
- **执行用户**: 当前系统用户
- **超时设置**: 5分钟（可配置）

#### 环境变量
```bash
NODE_ENV={deployment.environment}
DEPLOYMENT_ID={deploymentId}
PROJECT_NAME={project.name}
BUILD_NUMBER={deployment.buildNumber}
GIT_BRANCH={project.branch}
```

#### 构建脚本示例
```bash
#!/bin/bash
# Node.js项目构建脚本
npm ci                    # 安装依赖
npm run test             # 运行测试
npm run build            # 构建项目
npm run package          # 打包产物
```

### 阶段3: 远程部署

#### 主机连接
```bash
# SSH连接参数
ssh -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    -o LogLevel=ERROR \
    -p {port} \
    -i {keyPath} \
    {username}@{host}
```

#### 文件传输
```bash
# 使用rsync传输构建产物
rsync -avz --delete \
      -e "ssh -o StrictHostKeyChecking=no -p {port} -i {keyPath}" \
      {local_code_dir}/ \
      {username}@{host}:/tmp/deployment-{deploymentId}/
```

#### 远程执行
```bash
# 在远程主机执行部署脚本
ssh {connection_params} "cd /tmp/deployment-{deploymentId} && {deploy_script}"
```

### 阶段4: 状态更新

#### 状态流转
```
pending → deploying → success/failed
```

#### 日志管理
- **实时捕获**: stdout和stderr实时捕获
- **数据库存储**: 日志实时更新到数据库
- **格式化**: 带时间戳的结构化日志

#### 清理工作
```bash
# 清理本地工作目录
rm -rf /deployments/{deploymentId}/

# 清理远程临时目录（可选）
ssh {connection_params} "rm -rf /tmp/deployment-{deploymentId}/"
```

## 配置要求

### 项目配置
```typescript
interface ProjectConfig {
  repositoryUrl: string      // Git仓库URL
  branch: string            // 目标分支
  buildScript?: string      // 构建脚本
  deployScript?: string     // 部署脚本
  serverId?: string         // 目标主机ID
  gitCredentialId?: string  // Git认证配置ID
}
```

### 主机配置
```typescript
interface HostConfig {
  name: string              // 主机名称
  hostname: string          // 主机地址
  ip: string               // IP地址
  port: number             // SSH端口
  username: string         // SSH用户名
  authType: string         // 认证类型
  keyPath?: string         // SSH密钥路径
  password?: string        // SSH密码
}
```

### Git认证配置
```typescript
interface GitCredentials {
  type: 'username_password' | 'token' | 'ssh'
  username?: string
  password?: string
  token?: string
  privateKey?: string
}
```

## 脚本示例

### 构建脚本示例

#### Node.js应用
```bash
#!/bin/bash
set -e

echo "开始构建Node.js应用..."

# 安装依赖
npm ci

# 运行测试
npm run test

# 构建应用
npm run build

# 创建部署包
tar -czf dist.tar.gz dist/ package.json package-lock.json

echo "构建完成"
```

#### Docker应用
```bash
#!/bin/bash
set -e

echo "开始构建Docker镜像..."

# 构建镜像
docker build -t ${PROJECT_NAME}:${BUILD_NUMBER} .

# 推送到镜像仓库
docker push registry.company.com/${PROJECT_NAME}:${BUILD_NUMBER}

echo "Docker镜像构建完成"
```

### 部署脚本示例

#### Node.js应用部署
```bash
#!/bin/bash
set -e

echo "开始部署Node.js应用..."

# 停止现有服务
pm2 stop ${PROJECT_NAME} || true

# 备份当前版本
if [ -d "/var/www/${PROJECT_NAME}" ]; then
  cp -r /var/www/${PROJECT_NAME} /var/www/${PROJECT_NAME}.backup.$(date +%Y%m%d_%H%M%S)
fi

# 解压新版本
mkdir -p /var/www/${PROJECT_NAME}
tar -xzf dist.tar.gz -C /var/www/${PROJECT_NAME}

# 安装生产依赖
cd /var/www/${PROJECT_NAME}
npm ci --only=production

# 启动服务
pm2 start ecosystem.config.js

# 健康检查
sleep 5
curl -f http://localhost:3000/health || exit 1

echo "部署完成"
```

#### Docker应用部署
```bash
#!/bin/bash
set -e

echo "开始部署Docker应用..."

# 停止现有容器
docker stop ${PROJECT_NAME} || true
docker rm ${PROJECT_NAME} || true

# 拉取新镜像
docker pull registry.company.com/${PROJECT_NAME}:${BUILD_NUMBER}

# 启动新容器
docker run -d \
  --name ${PROJECT_NAME} \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=${NODE_ENV} \
  registry.company.com/${PROJECT_NAME}:${BUILD_NUMBER}

# 健康检查
sleep 10
docker ps | grep ${PROJECT_NAME}
curl -f http://localhost:3000/health || exit 1

echo "Docker部署完成"
```

## 错误处理

### 常见错误及解决方案

#### 代码拉取失败
```
错误: Authentication failed
解决: 检查Git认证配置是否正确

错误: Repository not found
解决: 验证仓库URL和访问权限

错误: Branch not found
解决: 确认分支名称是否正确
```

#### 构建失败
```
错误: npm install failed
解决: 检查package.json和网络连接

错误: Test failed
解决: 修复测试用例或跳过测试

错误: Build timeout
解决: 增加超时时间或优化构建脚本
```

#### 部署失败
```
错误: SSH connection failed
解决: 检查主机配置和网络连接

错误: Permission denied
解决: 验证SSH用户权限和密钥配置

错误: Deployment script failed
解决: 检查部署脚本语法和权限
```

## 监控和日志

### 日志格式
```
[2024-01-01T12:00:00.000Z] 🚀 开始完整部署流程...
[2024-01-01T12:00:01.000Z] 📁 准备工作目录...
[2024-01-01T12:00:02.000Z] ✅ 工作目录准备完成: /deployments/xxx
[2024-01-01T12:00:03.000Z] 📥 开始拉取代码...
[2024-01-01T12:00:10.000Z] ✅ 代码拉取完成
[2024-01-01T12:00:11.000Z] 🔨 开始本地构建...
[2024-01-01T12:01:30.000Z] ✅ 本地构建完成
[2024-01-01T12:01:31.000Z] 🚀 开始远程部署...
[2024-01-01T12:02:45.000Z] ✅ 远程部署完成
[2024-01-01T12:02:46.000Z] 🎉 完整部署流程成功完成，总耗时: 166秒
```

### 性能指标
- **代码拉取时间**: 通常1-30秒
- **构建时间**: 根据项目复杂度，1-10分钟
- **传输时间**: 根据产物大小和网络，10秒-2分钟
- **部署时间**: 根据部署复杂度，30秒-5分钟

## 最佳实践

1. **构建优化**
   - 使用缓存减少构建时间
   - 并行执行测试和构建
   - 增量构建避免重复工作

2. **部署安全**
   - 使用SSH密钥而不是密码
   - 限制部署用户权限
   - 定期轮换认证信息

3. **错误恢复**
   - 实现自动回滚机制
   - 保留多个版本备份
   - 设置健康检查和监控

4. **性能优化**
   - 使用增量传输
   - 压缩传输数据
   - 并行执行部署步骤

通过这个完整的CI/CD部署流程，您可以实现从代码提交到生产部署的全自动化流程。
