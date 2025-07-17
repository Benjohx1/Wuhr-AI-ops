# 一键部署包和Git认证解决方案

本文档提供了完整的一键部署包创建和Git认证问题解决方案。

## 🎯 **问题1: 一键部署包创建**

### **需求**
创建包含数据备份、Docker配置的zip包，在服务器上解压后一键安装。

### **解决方案**

#### **步骤1: 创建部署包**
```bash
# 运行一键部署包创建脚本
chmod +x scripts/create-deployment-package.sh
./scripts/create-deployment-package.sh
```

#### **生成的部署包内容**
```
wuhr-ai-ops-deployment-YYYYMMDD_HHMMSS/
├── docker-compose.yml      # Docker服务配置
├── .env                    # 环境变量配置
├── install.sh             # 一键安装脚本
├── backup.sh              # 数据备份脚本
├── uninstall.sh           # 卸载脚本
├── database.sql           # PostgreSQL数据导出
├── redis-dump.rdb         # Redis数据导出
├── init-db/               # 数据库初始化目录
│   └── 01-init.sql        # 数据库初始化脚本
├── redis-data/            # Redis数据目录
│   └── dump.rdb           # Redis数据文件
├── nginx/                 # Nginx配置
│   └── nginx.conf         # Nginx配置文件
└── README.md              # 使用说明
```

#### **Docker Compose配置特性**
- **PostgreSQL 15**: 自动数据导入
- **Redis 7**: 持久化存储
- **Nginx**: 反向代理配置
- **健康检查**: 自动服务监控
- **数据卷**: 持久化数据存储
- **网络**: 内部服务通信

### **服务器部署流程**

#### **步骤1: 上传和解压**
```bash
# 上传zip文件到服务器
scp wuhr-ai-ops-deployment-*.zip user@server:/opt/

# 在服务器上解压
cd /opt/
unzip wuhr-ai-ops-deployment-*.zip
cd wuhr-ai-ops-deployment-*/
```

#### **步骤2: 一键安装**
```bash
# 运行安装脚本
./install.sh
```

**安装脚本功能:**
- 检查Docker环境
- 检查端口占用
- 启动所有服务
- 验证服务健康状态
- 自动导入数据

#### **步骤3: 验证安装**
```bash
# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs

# 检查数据库
docker-compose exec postgres psql -U postgres -d wuhr_ai_ops -c "\dt"

# 检查Redis
docker-compose exec redis redis-cli ping
```

## 🔧 **问题2: Git认证失败解决**

### **错误分析**
```
远程： HTTP基本认证：访问被拒绝
The provided password or token is incorrect or your account has 2FA enabled
致命错误： 认证失败 for 'http://git.ope.ai:8999/component/voicechat2.git/'
```

**根本原因:**
1. Git用户名或密码错误
2. 账户启用了2FA，需要使用Personal Access Token
3. 没有配置Git凭据存储

### **解决方案**

#### **方案1: 运行Git认证配置脚本**
```bash
# 运行Git认证配置脚本
chmod +x scripts/setup-git-auth.sh
./scripts/setup-git-auth.sh
```

**脚本功能:**
- 配置Git凭据存储
- 设置用户名和密码/Token
- 测试认证是否成功
- 创建配置备份

#### **方案2: 手动配置Git认证**
```bash
# 配置Git凭据助手
git config --global credential.helper store

# 手动添加凭据
echo "http://username:password@git.ope.ai:8999" >> ~/.git-credentials
chmod 600 ~/.git-credentials

# 测试认证
git clone http://git.ope.ai:8999/component/voicechat2.git /tmp/test
```

#### **方案3: 使用Personal Access Token**
如果账户启用了2FA：
1. 在Git服务器生成Personal Access Token
2. 使用Token替代密码
3. 格式: `http://username:token@git.ope.ai:8999`

### **代码层面修复**

#### **增强Git错误处理**
```typescript
// 检查是否是认证错误
if (errorMessage.includes('认证失败') || errorMessage.includes('Authentication failed') || 
    errorMessage.includes('access denied') || errorMessage.includes('访问被拒绝')) {
  this.log('🔐 检测到Git认证失败')
  this.log('💡 解决方案:')
  this.log('   1. 运行Git认证配置脚本: ./scripts/setup-git-auth.sh')
  this.log('   2. 检查用户名和密码是否正确')
  this.log('   3. 如果启用了2FA，请使用Personal Access Token')
  this.log('   4. 确认账户有仓库访问权限')
  
  throw new Error(`Git认证失败: ${errorMessage}`)
}
```

## 🚀 **完整操作流程**

### **阶段1: 本地准备**
1. **创建部署包**
   ```bash
   ./scripts/create-deployment-package.sh
   ```

2. **配置Git认证**
   ```bash
   ./scripts/setup-git-auth.sh
   ```

3. **测试部署功能**
   ```bash
   # 重新尝试部署，验证Git认证是否成功
   ```

### **阶段2: 服务器部署**
1. **上传部署包**
   ```bash
   scp wuhr-ai-ops-deployment-*.zip user@server:/opt/
   ```

2. **服务器安装**
   ```bash
   cd /opt/
   unzip wuhr-ai-ops-deployment-*.zip
   cd wuhr-ai-ops-deployment-*/
   ./install.sh
   ```

3. **验证服务**
   ```bash
   docker-compose ps
   docker-compose logs
   ```

### **阶段3: 应用配置**
1. **更新应用配置**
   ```env
   DATABASE_URL=postgresql://postgres:password@server_ip:5432/wuhr_ai_ops
   REDIS_URL=redis://:password@server_ip:6379
   ```

2. **部署应用**
   ```bash
   # 部署您的Next.js应用到服务器
   ```

## 📊 **配置参数说明**

### **环境变量 (.env)**
```env
# 数据库配置
POSTGRES_PASSWORD=wuhr_postgres_2024
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:wuhr_postgres_2024@localhost:5432/wuhr_ai_ops

# Redis配置
REDIS_PASSWORD=wuhr_redis_2024
REDIS_PORT=6379
REDIS_URL=redis://:wuhr_redis_2024@localhost:6379

# 服务端口
HTTP_PORT=80
HTTPS_PORT=443

# 应用配置
NODE_ENV=production
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://your-domain.com
```

### **服务端口映射**
- **PostgreSQL**: 5432 → 5432
- **Redis**: 6379 → 6379
- **HTTP**: 80 → 80
- **HTTPS**: 443 → 443

## 🔍 **故障排查**

### **部署包创建问题**
```bash
# 检查Docker容器状态
docker ps

# 手动导出数据库
docker exec postgres_container pg_dump -U postgres wuhr_ai_ops > database.sql

# 手动导出Redis
docker exec redis_container redis-cli BGSAVE
docker cp redis_container:/data/dump.rdb ./redis-dump.rdb
```

### **Git认证问题**
```bash
# 检查Git配置
git config --global --list

# 检查凭据文件
cat ~/.git-credentials

# 测试Git连接
git ls-remote http://git.ope.ai:8999/component/voicechat2.git
```

### **服务器部署问题**
```bash
# 检查Docker环境
docker --version
docker-compose --version

# 检查端口占用
netstat -tlnp | grep -E "(5432|6379|80|443)"

# 查看服务日志
docker-compose logs postgres
docker-compose logs redis
docker-compose logs nginx
```

## 🛡️ **安全建议**

### **Git认证安全**
1. 使用Personal Access Token而非密码
2. 定期更新认证信息
3. 限制Token权限范围
4. 保护凭据文件权限 (600)

### **服务器安全**
1. 修改默认密码
2. 配置防火墙规则
3. 启用SSL/TLS
4. 定期备份数据

## 📚 **相关文件**

### **脚本文件**
- `scripts/create-deployment-package.sh` - 一键部署包创建
- `scripts/setup-git-auth.sh` - Git认证配置

### **部署文件**
- `docker-compose.yml` - Docker服务配置
- `install.sh` - 一键安装脚本
- `backup.sh` - 数据备份脚本
- `uninstall.sh` - 卸载脚本

### **文档文件**
- `README.md` - 部署包使用说明
- `docs/deployment-package-and-git-auth-guide.md` - 本指南

## 🎉 **预期效果**

### **部署包特性**
- ✅ 一键创建完整部署包
- ✅ 自动备份所有数据
- ✅ 包含完整Docker配置
- ✅ 服务器一键安装
- ✅ 自动数据导入

### **Git认证修复**
- ✅ 自动检测认证错误
- ✅ 提供详细解决方案
- ✅ 支持Token认证
- ✅ 凭据安全存储

通过这个完整的解决方案，您可以轻松创建部署包并解决Git认证问题，实现真正的一键部署体验。
