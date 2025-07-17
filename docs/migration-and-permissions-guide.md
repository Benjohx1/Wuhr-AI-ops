# 数据迁移和权限问题解决指南

本文档提供了完整的数据库迁移和Mac权限问题解决方案。

## 🎯 **问题1: 数据库和Redis迁移**

### **解决方案: 自动化迁移脚本**

#### **步骤1: 数据导出**
```bash
# 运行数据导出脚本
chmod +x scripts/export-data.sh
./scripts/export-data.sh
```

**脚本功能:**
- 自动检测运行中的PostgreSQL和Redis容器
- 导出数据库SQL文件
- 导出Redis RDB文件
- 创建完整的部署包

#### **步骤2: 服务器部署**
导出完成后，会在`data-export`目录中生成：
- `database_*.sql` - PostgreSQL数据
- `redis_*.rdb` - Redis数据
- `docker-compose.yml` - 服务配置
- `import-data.sh` - 导入脚本
- `README.md` - 使用说明

#### **步骤3: 服务器端导入**
```bash
# 在服务器上执行
chmod +x import-data.sh
./import-data.sh
```

### **Docker Compose配置**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: wuhr-postgres
    environment:
      POSTGRES_DB: wuhr_ai_ops
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_postgres_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: wuhr-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
```

## 🔧 **问题2: Mac权限问题解决**

### **问题描述**
CICD执行时遇到Mac电脑权限问题，需要输入密码：`luozhihong`

### **解决方案: 自动化权限配置**

#### **方案1: 运行权限设置脚本**
```bash
# 运行简化权限设置脚本
chmod +x scripts/setup-mac-permissions-simple.sh
./scripts/setup-mac-permissions-simple.sh
```

#### **方案2: 手动配置sudo免密码**
```bash
# 创建sudoers配置文件
echo "$(whoami) ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/wuhr_cicd

# 设置正确权限
sudo chmod 440 /etc/sudoers.d/wuhr_cicd
```

#### **方案3: 设置部署目录权限**
```bash
# 创建并设置部署目录权限
DEPLOY_DIR="/Users/$(whoami)/Documents/job/gemini-cli/wuhr-ai-ops/deployments"
mkdir -p "$DEPLOY_DIR/projects"
chmod -R 755 "$DEPLOY_DIR"
```

### **代码层面的修复**

#### **部署执行器权限处理**
```typescript
// 处理Mac系统的sudo权限问题
if (process.platform === 'darwin' && command === 'sudo') {
  // Mac系统下，如果是sudo命令，添加-n参数尝试免密码执行
  finalArgs.unshift('-n')
}

// 检查是否是权限问题
if (stderr.includes('Password:') || stderr.includes('sudo:')) {
  this.log('🔐 检测到权限问题，建议运行权限设置脚本:')
  this.log('   chmod +x scripts/setup-mac-permissions-simple.sh')
  this.log('   ./scripts/setup-mac-permissions-simple.sh')
}
```

## 🚀 **完整操作流程**

### **阶段1: 数据迁移准备**
1. **确保本地服务运行**
   ```bash
   docker-compose ps
   ```

2. **运行数据导出**
   ```bash
   ./scripts/export-data.sh
   ```

3. **检查导出结果**
   ```bash
   ls -la data-export/
   ```

### **阶段2: 权限问题解决**
1. **运行权限设置脚本**
   ```bash
   ./scripts/setup-mac-permissions-simple.sh
   ```

2. **测试sudo权限**
   ```bash
   sudo -n true && echo "权限配置成功" || echo "权限配置失败"
   ```

3. **验证部署目录权限**
   ```bash
   ls -la ~/Documents/job/gemini-cli/wuhr-ai-ops/deployments/
   ```

### **阶段3: 服务器部署**
1. **上传迁移包到服务器**
   ```bash
   scp -r data-export/ user@server:/path/to/deployment/
   ```

2. **在服务器上执行导入**
   ```bash
   cd /path/to/deployment/data-export/
   ./import-data.sh
   ```

3. **验证服务状态**
   ```bash
   docker-compose ps
   docker-compose logs
   ```

### **阶段4: 应用配置更新**
1. **更新数据库连接配置**
   ```env
   DATABASE_URL=postgresql://postgres:password@server_ip:5432/wuhr_ai_ops
   REDIS_URL=redis://server_ip:6379
   ```

2. **重启应用服务**
   ```bash
   npm run build
   npm start
   ```

## 🔍 **故障排查**

### **数据导出问题**
```bash
# 检查Docker容器状态
docker ps

# 检查PostgreSQL连接
docker exec postgres_container psql -U postgres -l

# 检查Redis连接
docker exec redis_container redis-cli ping
```

### **权限问题排查**
```bash
# 检查sudo配置
sudo -n true

# 检查文件权限
ls -la ~/Documents/job/gemini-cli/wuhr-ai-ops/deployments/

# 查看sudoers配置
sudo cat /etc/sudoers.d/wuhr_cicd
```

### **服务器部署问题**
```bash
# 检查Docker服务
docker --version
docker-compose --version

# 检查端口占用
netstat -tlnp | grep -E "(5432|6379)"

# 查看容器日志
docker-compose logs postgres
docker-compose logs redis
```

## 📊 **验证清单**

### **数据迁移验证**
- [ ] 本地数据成功导出
- [ ] 导出文件大小合理
- [ ] 服务器Docker环境就绪
- [ ] 数据成功导入服务器
- [ ] 应用连接新数据库正常

### **权限问题验证**
- [ ] sudo免密码配置成功
- [ ] 部署目录权限正确
- [ ] SSH密钥权限正确
- [ ] CICD部署不再要求密码
- [ ] 部署流程正常执行

## 🛡️ **安全注意事项**

### **开发环境**
- sudo免密码配置仅用于开发测试
- 定期检查和清理权限配置
- 避免在生产环境使用相同配置

### **生产环境**
- 使用专用部署用户
- 配置最小权限原则
- 使用SSH密钥认证
- 定期审计权限配置

## 🔧 **清理命令**

### **移除sudo免密码配置**
```bash
sudo rm /etc/sudoers.d/wuhr_cicd
```

### **清理临时文件**
```bash
rm -rf data-export/
rm ~/.wuhr_deploy_config
```

## 📚 **相关文件**

### **脚本文件**
- `scripts/export-data.sh` - 数据导出脚本
- `scripts/setup-mac-permissions-simple.sh` - 权限设置脚本

### **配置文件**
- `data-export/docker-compose.yml` - 服务器Docker配置
- `data-export/import-data.sh` - 数据导入脚本

### **文档文件**
- `docs/migration-and-permissions-guide.md` - 本指南
- `data-export/README.md` - 迁移包使用说明

通过这个完整的解决方案，您可以顺利完成数据库迁移和解决Mac权限问题，确保CICD部署流程正常运行。
