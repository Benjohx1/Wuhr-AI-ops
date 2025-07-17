# 部署配置示例

本文档提供了各种类型项目的部署脚本配置示例。

## Node.js 应用部署

### 基本 Node.js 应用

**构建脚本:**
```bash
# 安装依赖
npm ci

# 运行测试
npm test

# 构建应用
npm run build
```

**部署脚本:**
```bash
# 停止现有服务
pm2 stop app || true

# 备份当前版本
cp -r /var/www/app /var/www/app.backup.$(date +%Y%m%d_%H%M%S) || true

# 复制新版本
cp -r . /var/www/app/

# 安装生产依赖
cd /var/www/app && npm ci --only=production

# 启动服务
pm2 start /var/www/app/ecosystem.config.js

# 验证服务状态
sleep 5
pm2 status app
```

### Next.js 应用

**构建脚本:**
```bash
# 安装依赖
npm ci

# 构建应用
npm run build

# 导出静态文件（如果需要）
npm run export
```

**部署脚本:**
```bash
# 停止现有服务
pm2 stop nextjs-app || true

# 备份当前版本
mv /var/www/nextjs-app /var/www/nextjs-app.backup.$(date +%Y%m%d_%H%M%S) || true

# 创建新目录
mkdir -p /var/www/nextjs-app

# 复制构建文件
cp -r .next /var/www/nextjs-app/
cp -r public /var/www/nextjs-app/
cp package.json /var/www/nextjs-app/
cp next.config.js /var/www/nextjs-app/

# 安装生产依赖
cd /var/www/nextjs-app && npm ci --only=production

# 启动服务
pm2 start npm --name "nextjs-app" -- start

# 验证服务
curl -f http://localhost:3000/api/health || exit 1
```

## Docker 容器化部署

### 基本 Docker 部署

**构建脚本:**
```bash
# 构建 Docker 镜像
docker build -t myapp:${BUILD_NUMBER} .

# 推送到镜像仓库
docker push myapp:${BUILD_NUMBER}
```

**部署脚本:**
```bash
# 停止现有容器
docker stop myapp || true
docker rm myapp || true

# 拉取最新镜像
docker pull myapp:${BUILD_NUMBER}

# 启动新容器
docker run -d \
  --name myapp \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  myapp:${BUILD_NUMBER}

# 验证容器状态
sleep 10
docker ps | grep myapp
curl -f http://localhost:3000/health || exit 1
```

### Docker Compose 部署

**构建脚本:**
```bash
# 构建所有服务
docker-compose build

# 推送镜像（如果需要）
docker-compose push
```

**部署脚本:**
```bash
# 停止现有服务
docker-compose down

# 拉取最新镜像
docker-compose pull

# 启动服务
docker-compose up -d

# 验证服务状态
sleep 15
docker-compose ps
docker-compose logs --tail=50
```

## Kubernetes 部署

### 基本 K8s 部署

**构建脚本:**
```bash
# 构建镜像
docker build -t registry.example.com/myapp:${BUILD_NUMBER} .

# 推送镜像
docker push registry.example.com/myapp:${BUILD_NUMBER}
```

**部署脚本:**
```bash
# 更新部署配置中的镜像版本
sed -i "s|image: registry.example.com/myapp:.*|image: registry.example.com/myapp:${BUILD_NUMBER}|g" k8s/deployment.yaml

# 应用配置
kubectl apply -f k8s/

# 等待部署完成
kubectl rollout status deployment/myapp

# 验证部署
kubectl get pods -l app=myapp
kubectl get services myapp
```

### Helm 部署

**构建脚本:**
```bash
# 构建镜像
docker build -t registry.example.com/myapp:${BUILD_NUMBER} .
docker push registry.example.com/myapp:${BUILD_NUMBER}

# 打包 Helm Chart
helm package helm/myapp --version ${BUILD_NUMBER}
```

**部署脚本:**
```bash
# 升级或安装应用
helm upgrade --install myapp ./helm/myapp \
  --set image.tag=${BUILD_NUMBER} \
  --set environment=${NODE_ENV} \
  --namespace production \
  --create-namespace

# 验证部署
helm status myapp -n production
kubectl get pods -n production -l app.kubernetes.io/name=myapp
```

## 静态网站部署

### Nginx 静态部署

**构建脚本:**
```bash
# 安装依赖
npm ci

# 构建静态文件
npm run build

# 压缩文件
tar -czf dist.tar.gz dist/
```

**部署脚本:**
```bash
# 备份当前版本
cp -r /var/www/html /var/www/html.backup.$(date +%Y%m%d_%H%M%S) || true

# 清空目标目录
rm -rf /var/www/html/*

# 解压新版本
tar -xzf dist.tar.gz -C /var/www/html --strip-components=1

# 设置权限
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# 重新加载 Nginx
nginx -t && nginx -s reload

# 验证部署
curl -f http://localhost/ || exit 1
```

## 数据库迁移

### 带数据库迁移的部署

**构建脚本:**
```bash
# 安装依赖
npm ci

# 运行测试
npm test

# 构建应用
npm run build
```

**部署脚本:**
```bash
# 备份数据库
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 停止应用服务
pm2 stop app

# 运行数据库迁移
npm run migrate

# 部署新版本
cp -r . /var/www/app/
cd /var/www/app && npm ci --only=production

# 启动服务
pm2 start app

# 验证服务和数据库
sleep 10
pm2 status app
npm run db:check || exit 1
```

## 回滚脚本示例

### 基本回滚脚本

```bash
# 停止当前服务
pm2 stop app || true

# 恢复备份版本
BACKUP_DIR=$(ls -t /var/www/app.backup.* | head -1)
if [ -n "$BACKUP_DIR" ]; then
  rm -rf /var/www/app
  cp -r $BACKUP_DIR /var/www/app
  echo "已回滚到版本: $BACKUP_DIR"
else
  echo "未找到备份版本"
  exit 1
fi

# 重启服务
cd /var/www/app && pm2 start app

# 验证回滚
sleep 5
pm2 status app
curl -f http://localhost:3000/health || exit 1
```

### Docker 回滚脚本

```bash
# 获取上一个镜像版本
PREVIOUS_TAG=$(docker images myapp --format "table {{.Tag}}" | sed -n '2p')

if [ -z "$PREVIOUS_TAG" ]; then
  echo "未找到上一个版本"
  exit 1
fi

# 停止当前容器
docker stop myapp
docker rm myapp

# 启动上一个版本
docker run -d \
  --name myapp \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  myapp:$PREVIOUS_TAG

echo "已回滚到版本: $PREVIOUS_TAG"

# 验证回滚
sleep 10
docker ps | grep myapp
curl -f http://localhost:3000/health || exit 1
```

## 环境变量配置

### 生产环境变量示例

```bash
# 应用配置
export NODE_ENV=production
export PORT=3000
export DATABASE_URL=postgresql://user:pass@localhost:5432/myapp

# 构建配置
export BUILD_NUMBER=${BUILD_NUMBER:-$(date +%Y%m%d_%H%M%S)}
export GIT_COMMIT=${GIT_COMMIT:-$(git rev-parse HEAD)}

# 部署配置
export DEPLOY_USER=deploy
export DEPLOY_HOST=production.example.com
export DEPLOY_PATH=/var/www/myapp
```

## 最佳实践

1. **健康检查**: 每个部署脚本都应该包含健康检查
2. **备份策略**: 部署前自动备份当前版本
3. **原子性部署**: 使用符号链接或蓝绿部署确保原子性
4. **日志记录**: 详细记录部署过程和结果
5. **回滚准备**: 准备快速回滚机制
6. **权限控制**: 使用最小权限原则
7. **环境隔离**: 不同环境使用不同的配置和脚本
8. **监控告警**: 部署后监控关键指标
