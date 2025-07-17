#!/bin/bash
set -e # 如果任何命令失败，脚本将立即退出

# ==============================================================
# Wuhr AI Ops 一键迁移和部署脚本
# ==============================================================

# ANSI 颜色代码
C_RED='\033[0;31m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_BLUE='\033[0;34m'
C_NC='\033[0m' # 无颜色

echo -e "${C_BLUE}=====================================================${C_NC}"
echo -e "${C_BLUE}      Wuhr AI Ops - 数据库与Redis迁移脚本        ${C_NC}"
echo -e "${C_BLUE}=====================================================${C_NC}"

# --- 从您的配置中提取的变量 ---
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="wuhr_ai_ops"
DB_USER="wuhr_admin"
DB_PASSWORD="wuhr_secure_password_2024"

REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="redis_password_2024"

PGADMIN_EMAIL="admin@wuhrai.com"
PGADMIN_PASSWORD="admin_password_2024"
# --- 结束变量定义 ---


# --- 备份文件和目录配置 ---
BACKUP_DIR="backups"
PG_DUMP_FILE="postgres_backup.dump"
REDIS_DUMP_FILE="dump.rdb" # Redis 默认的备份文件名


# 函数：检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${C_RED}错误: '$1' 命令未找到. 请先安装它再运行此脚本.${C_NC}"
        exit 1
    fi
}

# ==============================================================
# 步骤 0: 检查环境依赖
# ==============================================================
echo -e "\n${C_YELLOW}步骤 0: 正在检查所需工具...${C_NC}"
check_command "docker"
check_command "docker-compose"
check_command "pg_dump"
check_command "redis-cli"
echo -e "${C_GREEN}所有必需工具均已安装.${C_NC}"


# ==============================================================
# 步骤 1: 备份现有数据
# ==============================================================
echo -e "\n${C_YELLOW}步骤 1: 正在备份本地数据...${C_NC}"

# 创建备份目录
mkdir -p $BACKUP_DIR
echo "备份目录 '$BACKUP_DIR' 已创建或已存在."

# --- 1.1 备份 PostgreSQL ---
echo -e "${C_BLUE}  -> 1.1 正在从 PostgreSQL 导出数据...${C_NC}"
export PGPASSWORD="$DB_PASSWORD"
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -b -v -f "$BACKUP_DIR/$PG_DUMP_FILE"; then
    echo -e "${C_GREEN}  PostgreSQL 数据库 '$DB_NAME' 成功备份到 '$BACKUP_DIR/$PG_DUMP_FILE'${C_NC}"
else
    echo -e "${C_RED}  PostgreSQL 备份失败! 请检查数据库连接和凭据.${C_NC}"
    unset PGPASSWORD
    exit 1
fi
unset PGPASSWORD

# --- 1.2 备份 Redis ---
echo -e "${C_BLUE}  -> 1.2 正在从 Redis 导出数据...${C_NC}"
# 使用 --rdb 选项直接生成 rdb 文件，这是最安全和同步的方法
if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --rdb "$BACKUP_DIR/$REDIS_DUMP_FILE"; then
    echo -e "${C_GREEN}  Redis 数据成功备份到 '$BACKUP_DIR/$REDIS_DUMP_FILE'${C_NC}"
else
    echo -e "${C_RED}  Redis 备份失败! 请检查 Redis 连接和密码.${C_NC}"
    exit 1
fi


# ==============================================================
# 步骤 2: 生成 docker-compose.yml 文件
# ==============================================================
echo -e "\n${C_YELLOW}步骤 2: 正在生成 docker-compose.yml 文件...${C_NC}"

cat <<EOF > docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    container_name: wuhr_postgres
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "${DB_PORT}:5432"
    volumes:
      - ./pg_data:/var/lib/postgresql/data # 数据持久化
      - ./backups:/backups                 # 挂载备份目录用于恢复

  redis:
    image: redis:7-alpine
    container_name: wuhr_redis
    restart: always
    command: redis-server --save 60 1 --loglevel warning --requirepass ${REDIS_PASSWORD}
    ports:
      - "${REDIS_PORT}:6379"
    volumes:
      - ./redis_data:/data # 数据持久化
      - ./backups/${REDIS_DUMP_FILE}:/data/dump.rdb # 将备份文件映射到容器中，Redis启动时会自动加载

  pgadmin:
    image: dpage/pgadmin4
    container_name: wuhr_pgadmin
    restart: always
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
      PGADMIN_LISTEN_PORT: 80
    ports:
      - "5050:80" # 将 pgAdmin 映射到 5050 端口
    depends_on:
      - db

volumes:
  pg_data:
  redis_data:

EOF

echo -e "${C_GREEN}docker-compose.yml 文件已成功生成.${C_NC}"


# ==============================================================
# 步骤 3: 启动 Docker 容器
# ==============================================================
echo -e "\n${C_YELLOW}步骤 3: 正在使用 Docker Compose 启动服务...${C_NC}"
echo "这可能需要一些时间来下载镜像..."
docker-compose up -d

echo -e "${C_GREEN}所有服务已在后台启动.${C_NC}"
echo "正在等待 PostgreSQL 服务完全初始化 (等待15秒)..."
sleep 15


# ==============================================================
# 步骤 4: 将数据导入新容器
# ==============================================================
echo -e "\n${C_YELLOW}步骤 4: 正在将数据导入新容器...${C_NC}"

# --- 4.1 导入 PostgreSQL 数据 ---
echo -e "${C_BLUE}  -> 4.1 正在将数据导入到 PostgreSQL 容器...${C_NC}"
# 使用 docker exec 在容器内执行 pg_restore
# 使用 --clean --if-exists 确保可以重复执行
if docker exec -e PGPASSWORD="$DB_PASSWORD" wuhr_postgres pg_restore \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --clean \
    --if-exists \
    --verbose \
    "/backups/$PG_DUMP_FILE"; then
    echo -e "${C_GREEN}  PostgreSQL 数据成功导入!${C_NC}"
else
    echo -e "${C_RED}  PostgreSQL 数据导入失败! 请检查容器日志: docker logs wuhr_postgres${C_NC}"
    exit 1
fi


# --- 4.2 验证 Redis 数据 ---
# Redis 数据在启动时通过卷映射自动加载，我们这里只做验证
echo -e "${C_BLUE}  -> 4.2 Redis 数据在容器启动时已自动加载. 正在验证...${C_NC}"
DB_SIZE=$(docker exec wuhr_redis redis-cli -a "$REDIS_PASSWORD" DBSIZE)
if [ "$DB_SIZE" -gt 0 ]; then
    echo -e "${C_GREEN}  Redis 验证成功! 数据库中有 ${DB_SIZE} 个键.${C_NC}"
else
    echo -e "${C_YELLOW}  警告: Redis 数据库为空或验证失败. 请检查容器日志: docker logs wuhr_redis${C_NC}"
fi


# ==============================================================
# 完成
# ==============================================================
echo -e "\n${C_GREEN}=====================================================${C_NC}"
echo -e "${C_GREEN}           🚀 部署和迁移全部完成! 🚀           ${C_NC}"
echo -e "${C_GREEN}=====================================================${C_NC}"
echo -e "您可以访问以下服务:"
echo -e "  - ${C_BLUE}PostgreSQL:${C_NC}  Host: localhost, Port: ${DB_PORT}"
echo -e "  - ${C_BLUE}Redis:${C_NC}       Host: localhost, Port: ${REDIS_PORT}"
echo -e "  - ${C_BLUE}pgAdmin:${C_NC}     URL: http://localhost:5050"
echo -e "    - ${C_BLUE}用户:${C_NC}      ${PGADMIN_EMAIL}"
echo -e "    - ${C_BLUE}密码:${C_NC}      ${PGADMIN_PASSWORD}"
echo -e "\n要停止服务, 请运行: ${C_YELLOW}docker-compose down${C_NC}"
echo -e "要查看日志, 请运行: ${C_YELLOW}docker-compose logs -f${C_NC}"
echo -e "\n${C_BLUE}注意: 您的应用现在需要连接到 Docker 中的数据库和 Redis.${C_NC}"
echo -e "您可能需要更新应用的 .env 文件中的主机名(例如从 localhost 改为 db 或 redis，如果应用也容器化的话)或者保持 localhost 不变以连接到映射的端口。"
