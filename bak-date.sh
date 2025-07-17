#!/bin/bash
set -e

# ==============================================================
#      Wuhr AI Ops - 从 Docker 容器迁移打包脚本
# ==============================================================

# ANSI 颜色代码
C_RED='\033[0;31m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_BLUE='\033[0;34m'
C_NC='\033[0m'

echo -e "${C_BLUE}=====================================================${C_NC}"
echo -e "${C_BLUE}     从 Docker 容器迁移打包脚本 (在 Mac 上运行)     ${C_NC}"
echo -e "${C_BLUE}=====================================================${C_NC}"

# ==============================================================
# 【已根据您的 'docker ps' 输出进行配置】
# ==============================================================
POSTGRES_CONTAINER_NAME="wuhr-ai-ops-postgres" # <--- 已根据您的环境更新
REDIS_CONTAINER_NAME="wuhr-ai-ops-redis"       # <--- 已根据您的环境更新

# 从您的配置文件中提取的目标环境配置 (用于生成新的 docker-compose.yml)
DB_USER="wuhr_admin"
DB_PASSWORD="wuhr_secure_password_2024"
DB_NAME="wuhr_ai_ops"
REDIS_PASSWORD="redis_password_2024"
DB_PORT="5432"
REDIS_PORT="6379"
PGADMIN_EMAIL="admin@wuhrai.com"
PGADMIN_PASSWORD="admin_password_2024"
# ==============================================================

# 文件和目录定义
MIGRATION_DIR="migration_package"
BACKUP_DIR_NAME="backups"
PG_DUMP_FILE="postgres_backup.dump"
REDIS_DUMP_FILE="dump.rdb"
FINAL_PACKAGE_NAME="wuhr_ai_ops_migration.tar.gz"

# 函数：检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${C_RED}错误: '$1' 命令未找到. 请先安装 Docker Desktop for Mac.${C_NC}"
        exit 1
    fi
}

# 函数：检查容器是否在运行
check_container_running() {
    if ! docker ps -q -f name=^/${1}$ | grep -q .; then
        echo -e "${C_RED}错误: 容器 '$1' 未在运行. 请先启动它再进行备份.${C_NC}"
        echo -e "${C_YELLOW}请使用 'docker ps' 检查正在运行的容器, 并更新脚本中的容器名配置.${C_NC}"
        exit 1
    fi
}

# ==============================================================
# 步骤 1: 检查环境
# ==============================================================
echo -e "\n${C_YELLOW}步骤 1: 正在检查打包环境...${C_NC}"
check_command "docker"
check_command "tar"
echo -e "${C_GREEN}  -> Docker 环境正常.${C_NC}"
check_container_running "$POSTGRES_CONTAINER_NAME"
echo -e "${C_GREEN}  -> PostgreSQL 容器 '$POSTGRES_CONTAINER_NAME' 正在运行.${C_NC}"
check_container_running "$REDIS_CONTAINER_NAME"
echo -e "${C_GREEN}  -> Redis 容器 '$REDIS_CONTAINER_NAME' 正在运行.${C_NC}"

# ==============================================================
# 步骤 2: 创建打包目录并从容器备份数据
# ==============================================================
echo -e "\n${C_YELLOW}步骤 2: 正在从 Docker 容器备份数据...${C_NC}"

# 清理并创建工作目录
rm -rf "$MIGRATION_DIR" "$FINAL_PACKAGE_NAME"
mkdir -p "$MIGRATION_DIR/$BACKUP_DIR_NAME"
echo "  -> 创建了干净的打包目录: '$MIGRATION_DIR'"

# --- 2.1 备份 PostgreSQL ---
echo -e "${C_BLUE}  -> 正在从容器 '$POSTGRES_CONTAINER_NAME' 备份 PostgreSQL...${C_NC}"
# 使用 docker exec 在容器内执行 pg_dump, 并将输出重定向到本地文件
if docker exec -e PGPASSWORD="$DB_PASSWORD" "$POSTGRES_CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -b -v > "$MIGRATION_DIR/$BACKUP_DIR_NAME/$PG_DUMP_FILE"; then
    echo -e "${C_GREEN}     PostgreSQL 备份成功.${C_NC}"
else
    echo -e "${C_RED}     PostgreSQL 备份失败! 请检查容器日志和配置.${C_NC}"
    exit 1
fi

# --- 2.2 备份 Redis ---
echo -e "${C_BLUE}  -> 正在从容器 '$REDIS_CONTAINER_NAME' 备份 Redis...${C_NC}"
# 首先，在容器内触发一次 SAVE 操作，确保数据已写入磁盘
docker exec "$REDIS_CONTAINER_NAME" redis-cli -a "$REDIS_PASSWORD" SAVE
echo "     在 Redis 容器内触发了 SAVE 命令."
# 然后，从容器中复制 dump.rdb 文件到本地
if docker cp "$REDIS_CONTAINER_NAME":/data/dump.rdb "$MIGRATION_DIR/$BACKUP_DIR_NAME/$REDIS_DUMP_FILE"; then
    echo -e "${C_GREEN}     Redis 备份成功.${C_NC}"
else
    echo -e "${C_RED}     Redis 备份失败! 请检查 Redis 容器的持久化配置和路径.${C_NC}"
    echo -e "${C_YELLOW}     提示: Redis 容器内的数据文件路径可能不是 '/data/dump.rdb'. 请用 'docker inspect $REDIS_CONTAINER_NAME' 检查卷挂载点.${C_NC}"
    exit 1
fi

# ==============================================================
# 步骤 3: 生成部署文件 (docker-compose.yml 和 deploy_on_server.sh)
# ==============================================================
echo -e "\n${C_YELLOW}步骤 3: 正在生成部署所需的文件...${C_NC}"

# --- 3.1 生成 docker-compose.yml ---
cat <<EOF > "$MIGRATION_DIR/docker-compose.yml"
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
      - ./pg_data:/var/lib/postgresql/data
      - ./backups:/backups

  redis:
    image: redis:7-alpine
    container_name: wuhr_redis
    restart: always
    command: redis-server --save 60 1 --loglevel warning --requirepass ${REDIS_PASSWORD}
    ports:
      - "${REDIS_PORT}:6379"
    volumes:
      - ./redis_data:/data
      - ./backups/${REDIS_DUMP_FILE}:/data/dump.rdb

  pgadmin:
    image: dpage/pgadmin4
    container_name: wuhr_pgadmin
    restart: always
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
      PGADMIN_LISTEN_PORT: 80
    ports:
      - "5050:80"
    depends_on:
      - db

volumes:
  pg_data:
  redis_data:
EOF
echo -e "${C_GREEN}  -> docker-compose.yml 已生成.${C_NC}"

# --- 3.2 生成服务器部署脚本 ---
cat <<'EOT' > "$MIGRATION_DIR/deploy_on_server.sh"
#!/bin/bash
set -e

C_RED='\033[0;31m'; C_GREEN='\033[0;32m'; C_YELLOW='\033[0;33m'; C_BLUE='\033[0;34m'; C_NC='\033[0m'

echo -e "${C_BLUE}=====================================================${C_NC}"
echo -e "${C_BLUE}   Wuhr AI Ops - 服务器部署脚本 (在 Linux 上运行)    ${C_NC}"
echo -e "${C_BLUE}=====================================================${C_NC}"

DB_USER=$(grep 'POSTGRES_USER:' docker-compose.yml | awk '{print $2}')
DB_PASSWORD=$(grep 'POSTGRES_PASSWORD:' docker-compose.yml | awk '{print $2}')
DB_NAME=$(grep 'POSTGRES_DB:' docker-compose.yml | awk '{print $2}')
PG_DUMP_FILE="postgres_backup.dump"
REDIS_PASSWORD=$(grep 'requirepass' docker-compose.yml | awk '{print $NF}')

check_command_linux() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${C_RED}错误: '$1' 命令未找到. 请先安装.${C_NC}"
        exit 1
    fi
}

echo -e "\n${C_YELLOW}步骤 1: 正在检查服务器环境依赖...${C_NC}"
check_command_linux "docker"
check_command_linux "docker-compose"
echo -e "${C_GREEN}Docker 和 Docker Compose 已安装.${C_NC}"

echo -e "\n${C_YELLOW}步骤 2: 正在使用 Docker Compose 启动服务...${C_NC}"
docker-compose down --remove-orphans # 先清理可能存在的旧容器
docker-compose up -d
echo "等待20秒，确保 PostgreSQL 服务完全启动..."
sleep 20

echo -e "\n${C_YELLOW}步骤 3: 正在将数据导入新容器...${C_NC}"

echo -e "${C_BLUE}  -> 3.1 正在导入 PostgreSQL 数据...${C_NC}"
# 注意: 在Linux服务器上，docker-compose会创建名为 wuhr_postgres 的容器
docker exec -e PGPASSWORD="$DB_PASSWORD" wuhr_postgres pg_restore \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --clean --if-exists --verbose \
    "/backups/$PG_DUMP_FILE"
echo -e "${C_GREEN}     PostgreSQL 数据导入成功!${C_NC}"

echo -e "${C_BLUE}  -> 3.2 验证 Redis 数据...${C_NC}"
# 注意: 在Linux服务器上，docker-compose会创建名为 wuhr_redis 的容器
DB_SIZE=$(docker exec wuhr_redis redis-cli -a "$REDIS_PASSWORD" DBSIZE)
if [ "$DB_SIZE" -gt 0 ]; then
    echo -e "${C_GREEN}     Redis 数据已自动加载! 数据库中有 ${DB_SIZE} 个键.${C_NC}"
else
    echo -e "${C_YELLOW}     警告: Redis 数据库为空. 请检查日志: docker logs wuhr_redis${C_NC}"
fi

EOT
chmod +x "$MIGRATION_DIR/deploy_on_server.sh"
echo -e "${C_GREEN}  -> deploy_on_server.sh 已生成.${C_NC}"

# ==============================================================
# 步骤 4 & 5: 打包、清理和后续指令
# ==============================================================
echo -e "\n${C_YELLOW}步骤 4: 正在创建最终的迁移压缩包...${C_NC}"
(cd "$MIGRATION_DIR" && tar -czf "../$FINAL_PACKAGE_NAME" .)
echo -e "${C_GREEN}  -> 成功创建迁移包: ${FINAL_PACKAGE_NAME}${C_NC}"

echo -e "\n${C_YELLOW}步骤 5: 清理临时文件...${C_NC}"
rm -rf "$MIGRATION_DIR"
echo -e "${C_GREEN}  -> 临时目录已删除.${C_NC}"

echo -e "\n${C_GREEN}=====================================================${C_NC}"
echo -e "${C_GREEN}           📦 Mac 上的打包工作已完成! 📦           ${C_NC}"
echo -e "${C_GREEN}=====================================================${C_NC}"
echo -e "下一步操作:"
echo -e "1. 将压缩包 ${C_YELLOW}${FINAL_PACKAGE_NAME}${C_NC} 上传到您的 Linux 服务器."
echo -e "   例如: ${C_BLUE}scp ./${FINAL_PACKAGE_NAME} user@your_server_ip:~/   (请替换 user 和 your_server_ip)${C_NC}"
echo -e "\n2. SSH 登录到您的 Linux 服务器并执行以下命令:"
echo -e "   a) 解压: ${C_YELLOW}tar -xzf ${FINAL_PACKAGE_NAME}${C_NC}"
echo -e "   b) 进入目录: ${C_YELLOW}cd migration_package${C_NC}"
echo -e "   c) 授予执行权限: ${C_YELLOW}chmod +x deploy_on_server.sh${C_NC}"
echo -e "   d) 运行部署: ${C_YELLOW}./deploy_on_server.sh${C_NC}"
