#!/bin/bash

# 数据库备份脚本
# 用于备份PostgreSQL数据库到data目录

set -e

echo "🗄️ 开始备份数据库..."

# 配置变量
CONTAINER_NAME="wuhr-ai-ops-postgres"
DB_NAME="wuhr_ai_ops"
DB_USER="wuhr_admin"
BACKUP_DIR="./data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="wuhr_ai_ops_backup_${TIMESTAMP}.sql"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 检查容器是否运行
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ PostgreSQL容器未运行，请先启动docker-compose"
    exit 1
fi

echo "📦 备份数据库到: $BACKUP_DIR/$BACKUP_FILE"

# 执行备份
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 数据库备份成功: $BACKUP_FILE"
    
    # 压缩备份文件
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    echo "🗜️ 备份文件已压缩: ${BACKUP_FILE}.gz"
    
    # 创建最新备份的软链接
    ln -sf "${BACKUP_FILE}.gz" "$BACKUP_DIR/latest_backup.sql.gz"
    echo "🔗 创建最新备份链接: latest_backup.sql.gz"
    
    # 显示备份文件大小
    echo "📊 备份文件大小: $(du -h "$BACKUP_DIR/${BACKUP_FILE}.gz" | cut -f1)"
    
    # 清理超过7天的旧备份
    find "$BACKUP_DIR" -name "wuhr_ai_ops_backup_*.sql.gz" -mtime +7 -delete
    echo "🧹 已清理7天前的旧备份"
    
else
    echo "❌ 数据库备份失败"
    exit 1
fi

echo "🎉 备份完成！"
