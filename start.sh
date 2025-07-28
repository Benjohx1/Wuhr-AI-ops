#!/bin/bash

# Wuhr AI Ops 一键启动脚本
# 作者: st-lzh
# 邮箱: 1139804291@qq.com

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[信息]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[成功]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

log_error() {
    echo -e "${RED}[错误]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 未安装，请先安装后再运行此脚本"
        exit 1
    fi
}

# 检查文件是否存在
check_file() {
    if [ ! -f "$1" ]; then
        log_error "文件 $1 不存在"
        return 1
    fi
    return 0
}

# 检查Docker容器状态
check_container() {
    if docker ps -q -f name="$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# 等待服务启动
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    log_info "等待 $name 服务启动..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            log_success "$name 服务已启动"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo ""
    log_warning "$name 服务启动超时，请检查服务状态"
    return 1
}

# 主函数
main() {
    echo "🚀 Wuhr AI Ops 一键启动脚本"
    echo "================================"
    
    # 检查必要的命令和版本
    log_info "检查系统环境..."
    check_command "docker"
    check_command "docker-compose"
    check_command "node"
    check_command "npm"
    
    # 检查Node.js版本
    local node_version=$(node -v | sed 's/v//')
    local node_major=$(echo $node_version | cut -d. -f1)
    if [ "$node_major" -lt 18 ]; then
        log_error "Node.js 版本过低 ($node_version)，需要 >= 18.0.0"
        exit 1
    fi
    log_info "Node.js 版本: $node_version ✓"
    
    # 检查npm版本
    local npm_version=$(npm -v)
    local npm_major=$(echo $npm_version | cut -d. -f1)
    if [ "$npm_major" -lt 8 ]; then
        log_error "npm 版本过低 ($npm_version)，需要 >= 8.0.0"
        exit 1
    fi
    log_info "npm 版本: $npm_version ✓"
    
    # 检查必要文件
    log_info "检查项目文件..."
    check_file "package.json" || exit 1
    check_file "docker-compose.yml" || exit 1
    
    # 检查环境变量文件
    if [ ! -f ".env" ]; then
        log_info ".env 文件不存在，正在创建默认配置..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success "已创建 .env 文件，使用默认配置继续启动"
            log_info "如需自定义配置，可以编辑 .env 文件后重新启动"
        else
            log_error ".env.example 文件不存在，无法创建配置文件"
            exit 1
        fi
    fi
    
    # npm源配置
    echo ""
    echo "📦 npm源配置"
    echo "================================"
    echo "请选择npm源:"
    echo "1) 国内源 (淘宝镜像) - 推荐国内用户"
    echo "2) 官方源 (npmjs.org) - 推荐海外用户"
    echo ""
    
    while true; do
        read -p "请输入选择 [1-2]: " choice
        case $choice in
            1)
                log_info "配置国内镜像源..."
                npm config set registry https://registry.npmmirror.com/
                log_success "已配置为国内镜像源"
                break
                ;;
            2)
                log_info "配置官方源..."
                npm config set registry https://registry.npmjs.org/
                log_success "已配置为官方源"
                break
                ;;
            *)
                echo "⚠️  请输入 1 或 2"
                ;;
        esac
    done
    
    local current_registry=$(npm config get registry)
    log_info "当前npm源: $current_registry"
    
    # 安装依赖
    log_info "安装Node.js依赖..."
    if npm install; then
        log_success "依赖安装完成"
    else
        log_error "依赖安装失败"
        exit 1
    fi
    
    # 启动Docker服务
    log_info "启动Docker服务..."
    if docker-compose up -d; then
        log_success "Docker服务启动完成"
    else
        log_error "Docker服务启动失败"
        exit 1
    fi
    
    # 等待数据库启动
    log_info "等待数据库启动..."
    sleep 5
    
    # 检查数据库连接
    log_info "检查数据库连接..."
    local db_ready=false
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U wuhr_admin -h localhost >/dev/null 2>&1; then
            db_ready=true
            break
        fi
        echo -n "."
        sleep 2
    done
    
    if [ "$db_ready" = true ]; then
        log_success "数据库连接正常"
    else
        log_warning "数据库连接超时，继续尝试..."
    fi
    
    # 数据库迁移
    log_info "执行数据库迁移..."
    if npx prisma migrate deploy; then
        log_success "数据库迁移完成"
    else
        log_warning "数据库迁移失败，尝试清理并重新创建..."
        
        # 强制删除数据库并重新创建
        log_info "强制清理数据库..."
        docker-compose exec -T postgres psql -U wuhr_admin -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'wuhr_ai_ops';" 2>/dev/null || true
        docker-compose exec -T postgres psql -U wuhr_admin -d postgres -c "DROP DATABASE IF EXISTS wuhr_ai_ops;" 2>/dev/null || true
        docker-compose exec -T postgres psql -U wuhr_admin -d postgres -c "CREATE DATABASE wuhr_ai_ops;" 2>/dev/null || true
        
        # 清理Prisma迁移记录
        log_info "清理迁移记录..."
        find prisma/migrations -name "_*" -type d -exec rm -rf {} + 2>/dev/null || true
        rm -rf lib/generated/prisma/ 2>/dev/null || true
        
        # 重新尝试迁移
        log_info "重新执行数据库迁移..."
        if npx prisma migrate deploy; then
            log_success "数据库重新创建成功"
        else
            log_warning "使用开发模式迁移..."
            if npx prisma migrate dev --name init 2>/dev/null; then
                log_success "开发模式迁移完成"
            else
                log_warning "数据库操作失败，尝试直接推送Schema..."
                npx prisma db push --force-reset 2>/dev/null || true
            fi
        fi
    fi
    
    # 生成Prisma客户端
    log_info "生成数据库客户端..."
    if npx prisma generate; then
        log_success "数据库客户端生成完成"
    else
        log_error "数据库客户端生成失败"
        exit 1
    fi
    
    # 初始化数据
    log_info "初始化系统数据..."
    if [ -f "scripts/init-super-admin.js" ]; then
        node scripts/init-super-admin.js 2>/dev/null || log_warning "管理员初始化跳过"
    fi
    
    if [ -f "scripts/init-permissions.js" ]; then
        node scripts/init-permissions.js 2>/dev/null || log_warning "权限初始化跳过"
    fi
    
    # 启动应用
    log_info "构建应用..."
    if npm run build; then
        log_success "应用构建完成"
    else
        log_warning "应用构建失败，尝试开发模式..."
        npm run dev > app.log 2>&1 &
        DEV_PID=$!
        log_info "使用开发模式启动"
        sleep 5
    fi
    
    # 后台启动应用（如果构建成功）
    if [ -d ".next" ] && [ -f ".next/BUILD_ID" ]; then
        log_info "启动生产服务器..."
        nohup npm start > app.log 2>&1 &
        APP_PID=$!
    else
        log_info "应用已在开发模式运行"
        APP_PID=${DEV_PID:-$(pgrep -f "npm run dev" | head -1)}
    fi
    
    # 等待应用启动
    wait_for_service "http://localhost:3000" "主应用"
    
    echo ""
    echo "🎉 Wuhr AI Ops 启动完成！"
    echo "================================"
    echo "🌐 访问地址："
    echo "   主应用: http://localhost:3000"
    echo ""
    echo "👤 默认账户："
    echo "   用户名: admin"
    echo "   邮箱: admin@wuhr.ai"
    echo "   密码: Admin123!"
    echo ""
    echo "📝 日志文件: app.log"
    echo "🔄 停止服务: docker-compose down && kill $APP_PID"
    echo ""
    echo "💡 提示："
    echo "- 首次启动可能需要等待几分钟"
    echo "- 如果无法访问，请检查端口3000是否被占用"
    echo "- AI功能需要配置OpenAI API密钥"
    echo ""
    echo "如遇问题，请查看："
    echo "- 应用日志: tail -f app.log"
    echo "- Docker日志: docker-compose logs"
    echo "- 项目文档: README.md"
    echo ""
    echo "联系支持: 1139804291@qq.com"
}

# 运行主函数
main "$@" 