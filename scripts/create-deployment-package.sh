#!/bin/bash

# 创建一键部署包脚本
# 备份数据、创建Docker配置、打包成zip文件

set -e

echo "🚀 创建一键部署包..."

# 获取时间戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PACKAGE_NAME="wuhr-ai-ops-deployment-$TIMESTAMP"
PACKAGE_DIR="./$PACKAGE_NAME"

# 创建包目录
mkdir -p "$PACKAGE_DIR"

echo "📁 创建部署包目录: $PACKAGE_DIR"

# 1. 导出数据库数据
echo ""
echo "📋 步骤1: 导出数据库数据..."

if docker ps | grep -q postgres; then
    POSTGRES_CONTAINER=$(docker ps --format "table {{.Names}}" | grep postgres | head -n 1)
    echo "✅ 找到PostgreSQL容器: $POSTGRES_CONTAINER"
    
    # 导出数据库
    docker exec $POSTGRES_CONTAINER pg_dump -U postgres wuhr_ai_ops > "$PACKAGE_DIR/database.sql"
    
    if [ $? -eq 0 ]; then
        DB_SIZE=$(ls -lh "$PACKAGE_DIR/database.sql" | awk '{print $5}')
        echo "✅ 数据库导出成功，大小: $DB_SIZE"
    else
        echo "❌ 数据库导出失败"
        exit 1
    fi
else
    echo "⚠️ 没有找到PostgreSQL容器，创建空数据库文件"
    touch "$PACKAGE_DIR/database.sql"
fi

# 2. 导出Redis数据
echo ""
echo "📋 步骤2: 导出Redis数据..."

if docker ps | grep -q redis; then
    REDIS_CONTAINER=$(docker ps --format "table {{.Names}}" | grep redis | head -n 1)
    echo "✅ 找到Redis容器: $REDIS_CONTAINER"
    
    # 导出Redis数据
    docker exec $REDIS_CONTAINER redis-cli BGSAVE
    sleep 2
    docker cp $REDIS_CONTAINER:/data/dump.rdb "$PACKAGE_DIR/redis-dump.rdb"
    
    if [ $? -eq 0 ]; then
        REDIS_SIZE=$(ls -lh "$PACKAGE_DIR/redis-dump.rdb" | awk '{print $5}')
        echo "✅ Redis数据导出成功，大小: $REDIS_SIZE"
    else
        echo "❌ Redis数据导出失败"
        exit 1
    fi
else
    echo "⚠️ 没有找到Redis容器，跳过Redis导出"
fi

# 3. 复制环境配置
echo ""
echo "📋 步骤3: 复制环境配置..."

if [ -f ".env" ]; then
    cp .env "$PACKAGE_DIR/env.example"
    echo "✅ 环境配置复制成功"
else
    echo "⚠️ 没有找到.env文件"
fi

# 4. 创建Docker Compose配置
echo ""
echo "📋 步骤4: 创建Docker Compose配置..."

cat > "$PACKAGE_DIR/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: wuhr-postgres
    environment:
      POSTGRES_DB: wuhr_ai_ops
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-wuhr_postgres_2024}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d
    restart: unless-stopped
    networks:
      - wuhr-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: wuhr-redis
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD:-wuhr_redis_2024}
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
      - ./redis-data:/backup
    restart: unless-stopped
    networks:
      - wuhr-network
    command: redis-server --requirepass ${REDIS_PASSWORD:-wuhr_redis_2024} --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: wuhr-nginx
    ports:
      - "${HTTP_PORT:-80}:80"
      - "${HTTPS_PORT:-443}:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    restart: unless-stopped
    networks:
      - wuhr-network
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  wuhr-network:
    driver: bridge
EOF

echo "✅ Docker Compose配置创建成功"

# 5. 创建数据库初始化目录
mkdir -p "$PACKAGE_DIR/init-db"
if [ -f "$PACKAGE_DIR/database.sql" ] && [ -s "$PACKAGE_DIR/database.sql" ]; then
    cp "$PACKAGE_DIR/database.sql" "$PACKAGE_DIR/init-db/01-init.sql"
    echo "✅ 数据库初始化脚本创建成功"
fi

# 6. 创建Redis数据目录
mkdir -p "$PACKAGE_DIR/redis-data"
if [ -f "$PACKAGE_DIR/redis-dump.rdb" ]; then
    cp "$PACKAGE_DIR/redis-dump.rdb" "$PACKAGE_DIR/redis-data/dump.rdb"
    echo "✅ Redis数据文件复制成功"
fi

# 7. 创建Nginx配置
mkdir -p "$PACKAGE_DIR/nginx"

cat > "$PACKAGE_DIR/nginx/nginx.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server host.docker.internal:3000;
    }

    server {
        listen 80;
        server_name _;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

echo "✅ Nginx配置创建成功"

# 8. 创建环境配置模板
cat > "$PACKAGE_DIR/.env" << 'EOF'
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

# Git配置（如果需要）
GIT_USERNAME=your-git-username
GIT_TOKEN=your-git-token
EOF

echo "✅ 环境配置模板创建成功"

# 9. 创建一键安装脚本
cat > "$PACKAGE_DIR/install.sh" << 'EOF'
#!/bin/bash

# WUHR AI Ops 一键安装脚本

set -e

echo "🚀 开始安装 WUHR AI Ops..."

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 检查端口占用
check_port() {
    local port=$1
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        echo "⚠️ 端口 $port 已被占用"
        return 1
    fi
    return 0
}

echo "📋 检查端口占用..."
check_port 5432 || echo "PostgreSQL端口5432被占用，请修改POSTGRES_PORT"
check_port 6379 || echo "Redis端口6379被占用，请修改REDIS_PORT"
check_port 80 || echo "HTTP端口80被占用，请修改HTTP_PORT"

# 创建必要目录
mkdir -p logs
mkdir -p backups

# 设置权限
chmod +x install.sh
chmod +x backup.sh
chmod +x uninstall.sh

echo "📋 启动服务..."

# 启动服务
docker-compose up -d

echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

# 检查健康状态
echo "🔍 检查服务健康状态..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL服务正常"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL服务启动超时"
        exit 1
    fi
    sleep 2
done

for i in {1..30}; do
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis服务正常"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Redis服务启动超时"
        exit 1
    fi
    sleep 2
done

echo ""
echo "🎉 WUHR AI Ops 安装完成！"
echo ""
echo "📊 服务信息:"
echo "- PostgreSQL: localhost:$(grep POSTGRES_PORT .env | cut -d'=' -f2 || echo 5432)"
echo "- Redis: localhost:$(grep REDIS_PORT .env | cut -d'=' -f2 || echo 6379)"
echo "- HTTP: localhost:$(grep HTTP_PORT .env | cut -d'=' -f2 || echo 80)"
echo ""
echo "🔧 管理命令:"
echo "- 查看状态: docker-compose ps"
echo "- 查看日志: docker-compose logs"
echo "- 停止服务: docker-compose down"
echo "- 重启服务: docker-compose restart"
echo "- 备份数据: ./backup.sh"
echo "- 卸载服务: ./uninstall.sh"
echo ""
echo "📝 下一步:"
echo "1. 修改 .env 文件中的配置"
echo "2. 部署您的应用程序"
echo "3. 配置域名和SSL证书"
EOF

chmod +x "$PACKAGE_DIR/install.sh"

# 10. 创建备份脚本
cat > "$PACKAGE_DIR/backup.sh" << 'EOF'
#!/bin/bash

# 数据备份脚本

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 开始备份数据到: $BACKUP_DIR"

# 备份数据库
docker-compose exec -T postgres pg_dump -U postgres wuhr_ai_ops > "$BACKUP_DIR/database.sql"
echo "✅ 数据库备份完成"

# 备份Redis
docker-compose exec -T redis redis-cli BGSAVE
sleep 2
docker cp wuhr-redis:/data/dump.rdb "$BACKUP_DIR/redis-dump.rdb"
echo "✅ Redis备份完成"

# 备份配置
cp .env "$BACKUP_DIR/env.backup"
cp docker-compose.yml "$BACKUP_DIR/docker-compose.backup.yml"
echo "✅ 配置备份完成"

echo "🎉 备份完成: $BACKUP_DIR"
EOF

chmod +x "$PACKAGE_DIR/backup.sh"

# 11. 创建卸载脚本
cat > "$PACKAGE_DIR/uninstall.sh" << 'EOF'
#!/bin/bash

# 卸载脚本

echo "⚠️ 即将卸载 WUHR AI Ops，这将删除所有数据！"
read -p "确认卸载？(y/N): " confirm

if [[ $confirm == [yY] ]]; then
    echo "🗑️ 停止并删除服务..."
    docker-compose down -v
    
    echo "🧹 清理Docker镜像..."
    docker image prune -f
    
    echo "✅ 卸载完成"
else
    echo "❌ 取消卸载"
fi
EOF

chmod +x "$PACKAGE_DIR/uninstall.sh"

# 12. 创建README文件
cat > "$PACKAGE_DIR/README.md" << 'EOF'
# WUHR AI Ops 一键部署包

## 快速安装

1. 解压部署包
2. 进入目录：`cd wuhr-ai-ops-deployment-*`
3. 运行安装：`./install.sh`

## 配置说明

### 环境变量 (.env)
- `POSTGRES_PASSWORD`: PostgreSQL密码
- `REDIS_PASSWORD`: Redis密码
- `HTTP_PORT`: HTTP端口 (默认80)
- `HTTPS_PORT`: HTTPS端口 (默认443)

### 服务端口
- PostgreSQL: 5432
- Redis: 6379
- HTTP: 80
- HTTPS: 443

## 管理命令

- 查看状态: `docker-compose ps`
- 查看日志: `docker-compose logs`
- 停止服务: `docker-compose down`
- 重启服务: `docker-compose restart`
- 备份数据: `./backup.sh`
- 卸载服务: `./uninstall.sh`

## 目录结构

```
wuhr-ai-ops-deployment-*/
├── docker-compose.yml    # Docker服务配置
├── .env                  # 环境变量
├── install.sh           # 安装脚本
├── backup.sh            # 备份脚本
├── uninstall.sh         # 卸载脚本
├── init-db/             # 数据库初始化
├── redis-data/          # Redis数据
├── nginx/               # Nginx配置
└── README.md            # 说明文档
```

## 故障排查

1. 检查Docker服务状态
2. 查看容器日志
3. 检查端口占用
4. 验证配置文件

## 技术支持

如有问题，请查看日志文件或联系技术支持。
EOF

echo "✅ README文档创建成功"

# 13. 打包成zip文件
echo ""
echo "📋 步骤5: 打包部署包..."

ZIP_FILE="${PACKAGE_NAME}.zip"

if command -v zip &> /dev/null; then
    zip -r "$ZIP_FILE" "$PACKAGE_DIR"
    
    if [ $? -eq 0 ]; then
        ZIP_SIZE=$(ls -lh "$ZIP_FILE" | awk '{print $5}')
        echo "✅ 部署包打包成功: $ZIP_FILE (大小: $ZIP_SIZE)"
        
        # 清理临时目录
        rm -rf "$PACKAGE_DIR"
        echo "🧹 临时目录清理完成"
    else
        echo "❌ 打包失败"
        exit 1
    fi
else
    echo "⚠️ zip命令不可用，保留目录: $PACKAGE_DIR"
fi

echo ""
echo "🎉 一键部署包创建完成！"
echo ""
echo "📦 部署包信息:"
if [ -f "$ZIP_FILE" ]; then
    echo "- 文件: $ZIP_FILE"
    echo "- 大小: $(ls -lh "$ZIP_FILE" | awk '{print $5}')"
else
    echo "- 目录: $PACKAGE_DIR"
fi

echo ""
echo "🚀 服务器部署步骤:"
echo "1. 上传 $ZIP_FILE 到服务器"
echo "2. 解压: unzip $ZIP_FILE"
echo "3. 进入目录: cd $PACKAGE_NAME"
echo "4. 运行安装: ./install.sh"
echo ""
echo "✅ 部署包创建完成！"
