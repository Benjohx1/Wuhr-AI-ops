# 部署主机配置指南

本文档说明如何在Wuhr AI Ops平台中配置和使用部署主机功能。

## 功能概述

部署主机配置允许您指定项目部署的目标服务器，实现真正的远程部署而不仅仅是本地执行。

## 配置流程

### 1. 添加主机

首先在主机管理模块中添加目标服务器：

1. 访问 **主机管理** → **添加主机**
2. 填写主机信息：
   - **主机名称**: 便于识别的名称
   - **主机地址**: IP地址或域名
   - **SSH端口**: 默认22
   - **用户名**: SSH登录用户名
   - **认证方式**: 密码或SSH密钥

### 2. 项目配置

在创建或编辑项目时配置部署主机：

1. 访问 **CI/CD** → **项目管理**
2. 创建新项目或编辑现有项目
3. 在 **构建配置** 步骤中选择 **部署主机**
4. 从下拉列表中选择已配置的主机

### 3. 部署执行

配置完成后，部署将自动在指定主机上执行：

- **有主机配置**: 在远程主机执行构建和部署脚本
- **无主机配置**: 在本地环境执行（默认行为）

## 技术实现

### 数据库关联

```sql
-- 项目表中的serverId字段关联到Server表
CICDProject {
  serverId: String? // 可选的主机ID
}

Server {
  id: String
  name: String
  hostname: String
  ip: String
  port: Int
  username: String
  password: String?
  keyPath: String?
}
```

### 部署执行逻辑

```typescript
// 1. 获取项目配置的主机ID
const hostId = deployment.project.serverId || 'localhost'

// 2. 从数据库获取主机信息
const hostInfo = await prisma.server.findUnique({
  where: { id: hostId }
})

// 3. 根据主机类型选择执行方式
if (hostInfo && hostInfo.authType !== 'local') {
  // 远程执行：ssh user@host "script"
  command = 'ssh'
  args = buildSSHArgs(script)
} else {
  // 本地执行：sh -c "script"
  command = 'sh'
  args = ['-c', script]
}
```

## 支持的认证方式

### 1. SSH密钥认证（推荐）

```bash
# 生成SSH密钥对
ssh-keygen -t rsa -b 4096 -C "deploy@yourcompany.com"

# 将公钥添加到目标主机
ssh-copy-id -i ~/.ssh/id_rsa.pub user@target-host
```

### 2. 密码认证

直接使用用户名和密码进行SSH连接。

**注意**: 密码认证安全性较低，建议使用SSH密钥。

## 部署脚本示例

### 基本Node.js应用部署

```bash
#!/bin/bash
# 构建脚本
npm ci
npm run build
npm test

# 部署脚本
# 停止现有服务
pm2 stop myapp || true

# 备份当前版本
cp -r /var/www/myapp /var/www/myapp.backup.$(date +%Y%m%d_%H%M%S)

# 部署新版本
cp -r . /var/www/myapp/
cd /var/www/myapp
npm ci --only=production

# 启动服务
pm2 start ecosystem.config.js

# 验证部署
sleep 5
curl -f http://localhost:3000/health || exit 1
```

### Docker容器部署

```bash
#!/bin/bash
# 构建脚本
docker build -t myapp:${BUILD_NUMBER} .
docker push registry.company.com/myapp:${BUILD_NUMBER}

# 部署脚本
# 停止现有容器
docker stop myapp || true
docker rm myapp || true

# 拉取新镜像
docker pull registry.company.com/myapp:${BUILD_NUMBER}

# 启动新容器
docker run -d \
  --name myapp \
  --restart unless-stopped \
  -p 3000:3000 \
  registry.company.com/myapp:${BUILD_NUMBER}

# 验证部署
sleep 10
docker ps | grep myapp
curl -f http://localhost:3000/health || exit 1
```

## 环境变量

部署执行时会自动设置以下环境变量：

- `NODE_ENV`: 部署环境（dev/test/prod）
- `DEPLOYMENT_ID`: 当前部署任务ID
- `PROJECT_NAME`: 项目名称

## 故障排除

### 常见问题

1. **SSH连接失败**
   - 检查主机地址和端口是否正确
   - 验证SSH密钥是否已添加到目标主机
   - 确认防火墙设置允许SSH连接

2. **权限不足**
   - 确保SSH用户有执行部署脚本的权限
   - 检查目标目录的写入权限
   - 验证sudo权限配置（如需要）

3. **脚本执行失败**
   - 检查脚本语法是否正确
   - 验证依赖软件是否已安装
   - 确认环境变量设置正确

### 调试方法

1. **查看部署日志**
   ```
   部署管理 → 查看详情 → 部署日志
   ```

2. **手动测试SSH连接**
   ```bash
   ssh -o StrictHostKeyChecking=no user@host "echo 'Connection test'"
   ```

3. **验证脚本执行**
   ```bash
   # 在目标主机上手动执行脚本
   ssh user@host "cd /path/to/project && ./deploy.sh"
   ```

## 最佳实践

1. **安全性**
   - 使用SSH密钥而不是密码认证
   - 定期轮换SSH密钥
   - 限制SSH用户权限

2. **可靠性**
   - 编写幂等性部署脚本
   - 实现健康检查和回滚机制
   - 保留多个版本备份

3. **监控**
   - 设置部署失败告警
   - 监控部署后的应用状态
   - 记录详细的部署日志

4. **测试**
   - 在测试环境验证部署脚本
   - 定期测试回滚流程
   - 验证不同环境的配置

## 示例配置

### 开发环境
- **主机**: dev-server.company.com
- **用户**: deploy
- **认证**: SSH密钥
- **部署目录**: /var/www/dev

### 生产环境
- **主机**: prod-server.company.com
- **用户**: deploy
- **认证**: SSH密钥
- **部署目录**: /var/www/prod
- **需要审批**: 是

通过正确配置部署主机，您可以实现真正的自动化CI/CD流程，将应用部署到实际的服务器环境中。
