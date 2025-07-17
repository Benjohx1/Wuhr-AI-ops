#!/bin/bash

# 数据导出脚本
# 用于将本地Docker数据库和Redis数据导出到服务器

set -e

echo "🚀 开始导出数据..."

# 创建导出目录
EXPORT_DIR="./data-export"
mkdir -p $EXPORT_DIR

# 获取当前时间戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "📁 导出目录: $EXPORT_DIR"
echo "⏰ 时间戳: $TIMESTAMP"

# 1. 导出PostgreSQL数据
echo ""
echo "📋 步骤1: 导出PostgreSQL数据..."

# 检查PostgreSQL容器是否运行
if docker ps | grep -q postgres; then
    echo "✅ 找到运行中的PostgreSQL容器"
    
    # 获取容器名称
    POSTGRES_CONTAINER=$(docker ps --format "table {{.Names}}" | grep postgres | head -n 1)
    echo "📦 容器名称: $POSTGRES_CONTAINER"
    
    # 导出数据库
    echo "💾 导出数据库..."
    docker exec $POSTGRES_CONTAINER pg_dump -U postgres wuhr_ai_ops > "$EXPORT_DIR/database_$TIMESTAMP.sql"
    
    if [ $? -eq 0 ]; then
        echo "✅ PostgreSQL数据导出成功: $EXPORT_DIR/database_$TIMESTAMP.sql"
        
        # 显示文件大小
        DB_SIZE=$(ls -lh "$EXPORT_DIR/database_$TIMESTAMP.sql" | awk '{print $5}')
        echo "📊 数据库文件大小: $DB_SIZE"
    else
        echo "❌ PostgreSQL数据导出失败"
        exit 1
    fi
else
    echo "⚠️ 没有找到运行中的PostgreSQL容器"
    echo "💡 请确保数据库容器正在运行"
fi

# 2. 导出Redis数据
echo ""
echo "📋 步骤2: 导出Redis数据..."

# 检查Redis容器是否运行
if docker ps | grep -q redis; then
    echo "✅ 找到运行中的Redis容器"
    
    # 获取容器名称
    REDIS_CONTAINER=$(docker ps --format "table {{.Names}}" | grep redis | head -n 1)
    echo "📦 容器名称: $REDIS_CONTAINER"
    
    # 导出Redis数据
    echo "💾 导出Redis数据..."
    docker exec $REDIS_CONTAINER redis-cli --rdb /data/dump.rdb
    docker cp $REDIS_CONTAINER:/data/dump.rdb "$EXPORT_DIR/redis_$TIMESTAMP.rdb"
    
    if [ $? -eq 0 ]; then
        echo "✅ Redis数据导出成功: $EXPORT_DIR/redis_$TIMESTAMP.rdb"
        
        # 显示文件大小
        REDIS_SIZE=$(ls -lh "$EXPORT_DIR/redis_$TIMESTAMP.rdb" | awk '{print $5}')
        echo "📊 Redis文件大小: $REDIS_SIZE"
    else
        echo "❌ Redis数据导出失败"
        exit 1
    fi
else
    echo "⚠️ 没有找到运行中的Redis容器"
    echo "💡 请确保Redis容器正在运行"
fi

# 3. 导出环境配置
echo ""
echo "📋 步骤3: 导出环境配置..."

if [ -f ".env" ]; then
    cp .env "$EXPORT_DIR/env_$TIMESTAMP.txt"
    echo "✅ 环境配置导出成功: $EXPORT_DIR/env_$TIMESTAMP.txt"
else
    echo "⚠️ 没有找到.env文件"
fi

# 4. 创建部署包
echo ""
echo "📋 步骤4: 创建部署包..."

# 创建docker-compose文件
cat > "$EXPORT_DIR/docker-compose.yml" << 'EOF'
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
    networks:
      - wuhr-network

  redis:
    image: redis:7-alpine
    container_name: wuhr-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./redis-data:/backup
    restart: unless-stopped
    networks:
      - wuhr-network
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:

networks:
  wuhr-network:
    driver: bridge
EOF

# 创建数据导入脚本
cat > "$EXPORT_DIR/import-data.sh" << 'EOF'
#!/bin/bash

# 数据导入脚本
set -e

echo "🚀 开始导入数据到服务器..."

# 1. 启动服务
echo "📋 步骤1: 启动数据库服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 2. 导入PostgreSQL数据
echo "📋 步骤2: 导入PostgreSQL数据..."

# 查找最新的数据库文件
DB_FILE=$(ls -t database_*.sql 2>/dev/null | head -n 1)

if [ -n "$DB_FILE" ]; then
    echo "📁 找到数据库文件: $DB_FILE"
    
    # 导入数据
    docker exec -i wuhr-postgres psql -U postgres -d wuhr_ai_ops < "$DB_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ PostgreSQL数据导入成功"
    else
        echo "❌ PostgreSQL数据导入失败"
        exit 1
    fi
else
    echo "⚠️ 没有找到数据库文件"
fi

# 3. 导入Redis数据
echo "📋 步骤3: 导入Redis数据..."

# 查找最新的Redis文件
REDIS_FILE=$(ls -t redis_*.rdb 2>/dev/null | head -n 1)

if [ -n "$REDIS_FILE" ]; then
    echo "📁 找到Redis文件: $REDIS_FILE"
    
    # 停止Redis服务
    docker-compose stop redis
    
    # 复制数据文件
    docker cp "$REDIS_FILE" wuhr-redis:/data/dump.rdb
    
    # 重启Redis服务
    docker-compose start redis
    
    echo "✅ Redis数据导入成功"
else
    echo "⚠️ 没有找到Redis文件"
fi

echo "🎉 数据导入完成！"
echo "💡 请检查服务状态: docker-compose ps"
EOF

# 创建README文件
cat > "$EXPORT_DIR/README.md" << 'EOF'
# 数据迁移包

本包包含了从本地Docker环境导出的数据库和Redis数据。

## 文件说明

- `database_*.sql` - PostgreSQL数据库导出文件
- `redis_*.rdb` - Redis数据导出文件
- `docker-compose.yml` - Docker Compose配置文件
- `import-data.sh` - 数据导入脚本
- `env_*.txt` - 环境配置文件

## 使用方法

1. 将整个文件夹上传到目标服务器
2. 修改 `docker-compose.yml` 中的密码配置
3. 运行导入脚本：
   ```bash
   chmod +x import-data.sh
   ./import-data.sh
   ```

## 注意事项

- 确保目标服务器已安装Docker和Docker Compose
- 修改数据库密码后需要更新应用配置
- 建议在导入前备份现有数据
EOF

chmod +x "$EXPORT_DIR/import-data.sh"

echo "✅ 部署包创建成功: $EXPORT_DIR/"

# 5. 显示导出结果
echo ""
echo "📊 导出结果汇总:"
echo "=================="
ls -lh "$EXPORT_DIR/"

echo ""
echo "🎯 下一步操作:"
echo "1. 将 $EXPORT_DIR 文件夹上传到目标服务器"
echo "2. 修改 docker-compose.yml 中的密码配置"
echo "3. 在服务器上运行: ./import-data.sh"

echo ""
echo "✅ 数据导出完成！"
