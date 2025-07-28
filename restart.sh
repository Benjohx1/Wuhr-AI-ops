#!/bin/bash

# Wuhr AI Ops 服务管理脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

PROJECT_DIR=$(pwd)
LOG_FILE="$PROJECT_DIR/app.log"
PID_FILE="$PROJECT_DIR/service.pid"

# 停止服务函数
stop_service() {
    log_info "停止现有服务..."
    
    # 从PID文件停止
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            log_success "已停止服务 (PID: $PID)"
        fi
        rm -f "$PID_FILE"
    fi
    
    # 强制停止相关进程
    pkill -f "next start" 2>/dev/null || true
    pkill -f "npm start" 2>/dev/null || true
    sleep 2
}

# 启动服务函数
start_service() {
    log_info "启动服务..."
    
    # 检查端口
    if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
        log_warning "端口 3000 仍被占用，强制清理..."
        pkill -f ":3000" 2>/dev/null || true
        sleep 2
    fi
    
    # 后台启动
    nohup npm start > "$LOG_FILE" 2>&1 &
    SERVICE_PID=$!
    echo $SERVICE_PID > "$PID_FILE"
    
    sleep 3
    
    # 检查服务是否启动成功
    if kill -0 $SERVICE_PID 2>/dev/null; then
        log_success "🎉 服务启动成功！"
        echo ""
        echo "📋 服务信息:"
        echo "  进程ID: $SERVICE_PID"
        echo "  日志文件: $LOG_FILE"
        echo ""
        echo "🌐 访问地址:"
        
        # 获取IP地址
        LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 2>/dev/null | awk '{print $7; exit}' || echo "localhost")
        PUBLIC_IP=$(curl -s --connect-timeout 3 ifconfig.me 2>/dev/null || echo "获取失败")
        
        echo "  本地访问: http://localhost:3000"
        if [ "$LOCAL_IP" != "localhost" ]; then
            echo "  内网访问: http://$LOCAL_IP:3000"
        fi
        if [ "$PUBLIC_IP" != "获取失败" ]; then
            echo "  外网访问: http://$PUBLIC_IP:3000"
        fi
        echo ""
        echo "👤 管理员账户:"
        echo "  邮箱: admin@wuhr.ai"
        echo "  密码: Admin123!"
        echo ""
        echo "📝 管理命令:"
        echo "  查看日志: tail -f $LOG_FILE"
        echo "  重启服务: ./restart.sh"
        echo "  停止服务: ./restart.sh stop"
        echo ""
    else
        log_error "服务启动失败"
        echo "请查看日志: cat $LOG_FILE"
        rm -f "$PID_FILE"
        exit 1
    fi
}

echo "🚀 Wuhr AI Ops 服务管理"
echo "================================"
echo ""

# 检查参数
if [ "$1" = "stop" ]; then
    stop_service
    log_success "服务已停止"
    exit 0
fi

# 检查环境
log_info "检查运行环境..."
if ! command -v node >/dev/null 2>&1; then
    log_error "未找到 Node.js，请先安装"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    log_error "未找到 npm，请先安装"
    exit 1
fi

# 检查项目文件
if [ ! -f "package.json" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 停止现有服务
stop_service

# 快速启动（跳过构建）
log_info "快速重启模式（跳过构建步骤）"

# 确保依赖已安装
if [ ! -d "node_modules" ]; then
    log_info "安装项目依赖..."
    npm install
fi

# 确保.next目录存在
if [ ! -d ".next" ]; then
    log_warning ".next 目录不存在，需要构建项目"
    log_info "运行构建..."
    if ! npm run build; then
        log_warning "构建失败，清理缓存后重试..."
        rm -rf .next
        npm cache clean --force >/dev/null 2>&1
        
        if npm run build; then
            log_success "清理缓存后构建成功"
        else
            log_error "构建仍然失败，使用开发模式启动"
            nohup npm run dev > "$LOG_FILE" 2>&1 &
            SERVICE_PID=$!
            echo $SERVICE_PID > "$PID_FILE"
            sleep 3
            if kill -0 $SERVICE_PID 2>/dev/null; then
                log_success "🎉 开发模式启动成功！"
                echo "🌐 访问地址: http://localhost:3000"
                echo "📝 查看日志: tail -f $LOG_FILE"
                echo "💡 提示: 如需生产模式，请手动运行: ./scripts/clean-build.sh"
            else
                log_error "启动失败，请查看日志: cat $LOG_FILE"
                rm -f "$PID_FILE"
                exit 1
            fi
            exit 0
        fi
    fi
fi

# 启动服务
start_service 