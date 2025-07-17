#!/bin/bash

# 数据库恢复脚本
# 用于从备份文件恢复PostgreSQL数据库

set -e

# 配置变量
CONTAINER_NAME="wuhr-ai-ops-postgres"
DB_NAME="wuhr_ai_ops"
DB_USER="wuhr_admin"
BACKUP_DIR="./data/backups"

# 显示用法
show_usage() {
    echo "用法: $0 [backup_file]"
    echo ""
    echo "参数:"
    echo "  backup_file  备份文件名（可选，默认使用最新备份）"
    echo ""
    echo "示例:"
    echo "  $0                                    # 使用最新备份"
    echo "  $0 wuhr_ai_ops_backup_20250130.sql.gz  # 使用指定备份"
    echo ""
    echo "可用备份文件:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  无备份文件"
    else
        echo "  备份目录不存在"
    fi
}

# 检查参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
fi

echo "🔄 开始恢复数据库..."

# 确定备份文件
if [ -n "$1" ]; then
    BACKUP_FILE="$BACKUP_DIR/$1"
else
    BACKUP_FILE="$BACKUP_DIR/latest_backup.sql.gz"
fi

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 备份文件不存在: $BACKUP_FILE"
    echo ""
    show_usage
    exit 1
fi

# 检查容器是否运行
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ PostgreSQL容器未运行，请先启动docker-compose"
    exit 1
fi

echo "📁 使用备份文件: $BACKUP_FILE"
echo "📊 备份文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"

# 确认操作
read -p "⚠️  这将覆盖现有数据库，是否继续？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 操作已取消"
    exit 0
fi

echo "🗄️ 正在恢复数据库..."

# 解压并恢复数据库
if [[ "$BACKUP_FILE" == *.gz ]]; then
    # 压缩文件
    gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"
else
    # 未压缩文件
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "✅ 数据库恢复成功！"
    echo "🔄 建议重启应用程序以确保数据一致性"
else
    echo "❌ 数据库恢复失败"
    exit 1
fi

echo "🎉 恢复完成！"
