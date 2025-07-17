#!/bin/bash

# Wuhr AI Ops 部署脚本
# 用于快速部署整个应用程序栈

set -e

echo "🚀 Wuhr AI Ops 部署脚本"
echo "========================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --fresh-install    全新安装（清除所有数据）"
    echo "  --backup-first     部署前先备份数据"
    echo "  --restore-backup   从备份恢复数据"
    echo "  --dev              开发模式部署"
    echo "  --prod             生产模式部署"
    echo "  -h, --help         显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                 # 标准部署"
    echo "  $0 --fresh-install # 全新安装"
    echo "  $0 --backup-first  # 备份后部署"
}

# 默认参数
FRESH_INSTALL=false
BACKUP_FIRST=false
RESTORE_BACKUP=false
DEV_MODE=false
PROD_MODE=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --fresh-install)
            FRESH_INSTALL=true
            shift
            ;;
        --backup-first)
            BACKUP_FIRST=true
            shift
            ;;
        --restore-backup)
            RESTORE_BACKUP=true
            shift
            ;;
        --dev)
            DEV_MODE=true
            shift
            ;;
        --prod)
            PROD_MODE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 检查Docker和Docker Compose
echo -e "${BLUE}🔍 检查系统依赖...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 环境检查通过${NC}"

# 备份现有数据
if [ "$BACKUP_FIRST" = true ]; then
    echo -e "${YELLOW}📦 备份现有数据...${NC}"
    if docker ps | grep -q "wuhr-ai-ops-postgres"; then
        ./scripts/backup-database.sh
    else
        echo -e "${YELLOW}⚠️ 数据库容器未运行，跳过备份${NC}"
    fi
fi

# 全新安装
if [ "$FRESH_INSTALL" = true ]; then
    echo -e "${YELLOW}🗑️ 执行全新安装，清除现有数据...${NC}"
    read -p "⚠️ 这将删除所有现有数据，是否继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ 操作已取消${NC}"
        exit 0
    fi
    
    docker-compose down -v
    docker volume prune -f
fi

# 创建必要目录
echo -e "${BLUE}📁 创建必要目录...${NC}"
mkdir -p data/backups
mkdir -p deployments
mkdir -p docker/init-scripts
mkdir -p docker/postgres-conf

# 启动服务
echo -e "${BLUE}🐳 启动Docker服务...${NC}"
if [ "$DEV_MODE" = true ]; then
    echo -e "${YELLOW}🔧 开发模式启动${NC}"
    docker-compose up -d postgres redis
elif [ "$PROD_MODE" = true ]; then
    echo -e "${GREEN}🏭 生产模式启动${NC}"
    docker-compose up -d
else
    echo -e "${BLUE}📊 标准模式启动${NC}"
    docker-compose up -d postgres redis pgadmin
fi

# 等待数据库启动
echo -e "${BLUE}⏳ 等待数据库启动...${NC}"
timeout=60
while [ $timeout -gt 0 ]; do
    if docker exec wuhr-ai-ops-postgres pg_isready -U wuhr_admin -d wuhr_ai_ops &> /dev/null; then
        echo -e "${GREEN}✅ 数据库已就绪${NC}"
        break
    fi
    sleep 2
    timeout=$((timeout-2))
done

if [ $timeout -le 0 ]; then
    echo -e "${RED}❌ 数据库启动超时${NC}"
    exit 1
fi

# 恢复备份数据
if [ "$RESTORE_BACKUP" = true ]; then
    echo -e "${YELLOW}🔄 恢复备份数据...${NC}"
    if [ -f "data/backups/latest_backup.sql.gz" ]; then
        ./scripts/restore-database.sh
    else
        echo -e "${YELLOW}⚠️ 未找到备份文件${NC}"
    fi
fi

# 安装依赖（如果在开发模式）
if [ "$DEV_MODE" = true ]; then
    echo -e "${BLUE}📦 安装Node.js依赖...${NC}"
    if [ -f "package.json" ]; then
        npm install
    fi
fi

# 显示部署信息
echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "========================"
echo -e "${BLUE}📊 服务状态:${NC}"
docker-compose ps

echo ""
echo -e "${BLUE}🔗 访问地址:${NC}"
echo "  • 应用程序: http://localhost:3000"
echo "  • pgAdmin:  http://localhost:5050"
echo "  • Redis:    localhost:6379"

echo ""
echo -e "${BLUE}📋 管理命令:${NC}"
echo "  • 查看日志: docker-compose logs -f"
echo "  • 停止服务: docker-compose down"
echo "  • 备份数据: ./scripts/backup-database.sh"
echo "  • 恢复数据: ./scripts/restore-database.sh"

if [ "$DEV_MODE" = true ]; then
    echo ""
    echo -e "${YELLOW}🔧 开发模式提示:${NC}"
    echo "  • 启动应用: npm run dev"
    echo "  • 数据库迁移: npx prisma migrate dev"
fi
