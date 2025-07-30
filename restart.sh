#!/bin/bash

# Wuhr AI Ops 服务管理脚本
# 版本: 2.0.0
# 优化: 提高稳定性、安全性和可维护性

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 全局变量
PROJECT_DIR=$(pwd)
LOG_FILE="$PROJECT_DIR/app.log"
PID_FILE="$PROJECT_DIR/service.pid"
LOCK_FILE="$PROJECT_DIR/service.lock"
SERVICE_PORT=3000
SERVICE_NAME="Wuhr AI Ops"

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

log_debug() {
    echo -e "${PURPLE}[调试]${NC} $1"
}

# 清理函数
cleanup() {
    log_info "执行清理操作..."
    rm -f "$LOCK_FILE"
    # 只有在脚本异常退出时才删除PID文件
    # 正常启动时保留PID文件用于状态检查
}

# 信号处理
trap cleanup EXIT
trap 'log_error "收到中断信号，正在清理..."; cleanup; exit 1' INT TERM

# 检查锁文件，防止重复运行
check_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
        if [ -n "$lock_pid" ] && kill -0 "$lock_pid" 2>/dev/null; then
            log_error "服务管理脚本已在运行 (PID: $lock_pid)"
            exit 1
        else
            log_warning "发现过期的锁文件，正在清理..."
            rm -f "$LOCK_FILE"
        fi
    fi
    echo $$ > "$LOCK_FILE"
}

# 安全的端口检查函数
check_port() {
    local port=$1
    local timeout=${2:-5}
    
    # 使用多种方法检查端口
    for cmd in "lsof" "netstat" "ss"; do
        if command -v "$cmd" >/dev/null 2>&1; then
            case "$cmd" in
                "lsof")
                    if timeout "$timeout" lsof -i:"$port" >/dev/null 2>&1; then
                        return 0
                    fi
                    ;;
                "netstat")
                    if timeout "$timeout" netstat -tuln 2>/dev/null | grep -q ":$port "; then
                        return 0
                    fi
                    ;;
                "ss")
                    if timeout "$timeout" ss -tuln 2>/dev/null | grep -q ":$port "; then
                        return 0
                    fi
                    ;;
            esac
        fi
    done
    return 1
}

# 安全的端口清理函数
safe_clean_port() {
    local port=$1
    local max_attempts=3
    local attempt=1
    
    log_info "检查端口 $port 占用情况..."
    
    if ! check_port "$port"; then
        log_success "端口 $port 未被占用"
        return 0
    fi
    
    log_warning "端口 $port 被占用，尝试安全清理..."
    
    # 显示占用进程信息
    if command -v lsof >/dev/null 2>&1; then
        log_info "端口占用详情:"
        lsof -i:"$port" 2>/dev/null | head -5 || true
    fi
    
    # 尝试优雅停止相关进程
    local pids_to_kill=()
    
    # 查找相关进程
    if command -v lsof >/dev/null 2>&1; then
        pids_to_kill+=($(lsof -ti:"$port" 2>/dev/null || true))
    fi
    
    # 查找Node.js相关进程
    pids_to_kill+=($(pgrep -f "node.*next" 2>/dev/null || true))
    pids_to_kill+=($(pgrep -f "next-server" 2>/dev/null || true))
    pids_to_kill+=($(pgrep -f "npm.*start" 2>/dev/null || true))
    
    # 去重
    pids_to_kill=($(printf "%s\n" "${pids_to_kill[@]}" | sort -u))
    
    if [ ${#pids_to_kill[@]} -gt 0 ]; then
        log_info "找到 ${#pids_to_kill[@]} 个相关进程，尝试优雅停止..."
        
        for pid in "${pids_to_kill[@]}"; do
            if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                log_info "停止进程 $pid..."
                kill "$pid" 2>/dev/null || true
            fi
        done
        
        # 等待进程停止
        sleep 2
        
        # 检查是否还有进程在运行
        for pid in "${pids_to_kill[@]}"; do
            if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                log_warning "进程 $pid 仍在运行，强制停止..."
                kill -9 "$pid" 2>/dev/null || true
            fi
        done
        
        sleep 1
    fi
    
    # 最终检查
    if ! check_port "$port"; then
        log_success "端口 $port 清理成功"
        return 0
    else
        log_warning "端口 $port 可能仍有占用，但继续执行..."
        return 0
    fi
}

# 停止服务函数
stop_service() {
    log_info "停止 $SERVICE_NAME 服务..."
    
    # 从PID文件停止
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            log_info "停止进程 $pid..."
            kill "$pid" 2>/dev/null || true
            sleep 2
            
            # 检查是否还在运行
            if kill -0 "$pid" 2>/dev/null; then
                log_warning "进程 $pid 仍在运行，强制停止..."
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$PID_FILE"
    fi
    
    # 清理端口
    safe_clean_port "$SERVICE_PORT"
    
    log_success "服务已停止"
}

# 检查环境函数
check_environment() {
    log_info "检查运行环境..."
    
    # 检查Node.js
    if ! command -v node >/dev/null 2>&1; then
        log_error "未找到 Node.js，请先安装"
        exit 1
    fi
    
    local node_version=$(node --version 2>/dev/null || echo "unknown")
    log_info "Node.js 版本: $node_version"
    
    # 检查npm
    if ! command -v npm >/dev/null 2>&1; then
        log_error "未找到 npm，请先安装"
        exit 1
    fi
    
    local npm_version=$(npm --version 2>/dev/null || echo "unknown")
    log_info "npm 版本: $npm_version"
    
    # 检查项目文件
    if [ ! -f "package.json" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 检查package.json中的脚本
    if ! grep -q '"start"' package.json; then
        log_error "package.json 中未找到 start 脚本"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# 安装依赖函数
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        log_info "安装项目依赖..."
        if ! npm install; then
            log_error "依赖安装失败"
            exit 1
        fi
        log_success "依赖安装完成"
    else
        log_info "依赖已存在，跳过安装"
    fi
}

# 构建项目函数
build_project() {
    log_info "检查项目构建状态..."
    
    if [ ! -d ".next" ]; then
        log_info "构建项目..."
        if ! npm run build; then
            log_warning "构建失败，尝试清理缓存后重试..."
            rm -rf .next
            npm cache clean --force >/dev/null 2>&1
            
            if npm run build; then
                log_success "清理缓存后构建成功"
            else
                log_error "构建失败，无法启动服务"
                exit 1
            fi
        else
            log_success "项目构建完成"
        fi
    else
        log_info "项目已构建，跳过构建步骤"
    fi
}

# 启动服务函数
start_service() {
    local foreground_mode=${1:-false}
    
    log_info "启动 $SERVICE_NAME 服务..."
    
    # 确保端口可用
    if ! safe_clean_port "$SERVICE_PORT"; then
        log_error "无法清理端口 $SERVICE_PORT，启动失败"
        exit 1
    fi
    
    if [ "$foreground_mode" = "true" ]; then
        log_info "前台启动模式"
        npm start
    else
        # 后台启动
        log_info "后台启动模式"
        nohup npm start > "$LOG_FILE" 2>&1 &
        local service_pid=$!
        echo "$service_pid" > "$PID_FILE"
        
        # 等待服务启动
        log_info "等待服务启动..."
        local max_wait=30
        local wait_count=0
        
        while [ $wait_count -lt $max_wait ]; do
            if ! kill -0 "$service_pid" 2>/dev/null; then
                log_error "服务进程异常退出"
                rm -f "$PID_FILE"
                exit 1
            fi
            
            if check_port "$SERVICE_PORT"; then
                break
            fi
            
            sleep 1
            wait_count=$((wait_count + 1))
        done
        
        # 检查启动结果
        if kill -0 "$service_pid" 2>/dev/null && check_port "$SERVICE_PORT"; then
            log_success "🎉 $SERVICE_NAME 启动成功！"
            display_service_info "$service_pid"
        else
            log_error "服务启动失败"
            rm -f "$PID_FILE"
            log_info "查看启动日志: tail -20 $LOG_FILE"
            exit 1
        fi
    fi
}

# 显示服务信息函数
display_service_info() {
    local service_pid=$1
    
    echo ""
    echo "📋 服务信息:"
    echo "  进程ID: $service_pid"
    echo "  日志文件: $LOG_FILE"
    echo "  端口: $SERVICE_PORT"
    echo ""
    echo "🌐 访问地址:"
    
    # 获取IP地址
    local local_ip=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 2>/dev/null | awk '{print $7; exit}' || echo "localhost")
    local public_ip=$(curl -s --connect-timeout 3 ifconfig.me 2>/dev/null || echo "获取失败")
    
    echo "  本地访问: http://localhost:$SERVICE_PORT"
    if [ "$local_ip" != "localhost" ]; then
        echo "  内网访问: http://$local_ip:$SERVICE_PORT"
    fi
    echo ""
    echo "�� 管理员账户:"
    echo "  邮箱: admin@wuhr.ai"
    echo "  密码: Admin123!"
    echo ""
    echo "📝 管理命令:"
    echo "  查看日志: tail -f $LOG_FILE"
    echo "  重启服务: ./restart.sh"
    echo "  停止服务: ./restart.sh stop"
    echo "  前台启动: ./restart.sh --foreground"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "�� $SERVICE_NAME 服务管理脚本"
    echo "================================"
    echo ""
    echo "用法:"
    echo "  ./restart.sh              # 后台启动服务"
    echo "  ./restart.sh --foreground # 前台启动服务"
    echo "  ./restart.sh stop         # 停止服务"
    echo "  ./restart.sh status       # 查看服务状态"
    echo "  ./restart.sh logs         # 查看服务日志"
    echo "  ./restart.sh --help       # 显示帮助信息"
    echo ""
    echo "选项:"
    echo "  --foreground    前台启动模式（调试用）"
    echo "  --help, -h     显示帮助信息"
    echo "  stop           停止服务"
    echo "  status         查看服务状态"
    echo "  logs           查看服务日志"
    echo ""
}

# 查看服务状态
show_status() {
    echo "📊 $SERVICE_NAME 服务状态"
    echo "================================"
    echo ""
    
    # 检查PID文件
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "✅ 服务状态: 运行中"
            echo "   进程ID: $pid"
            echo "   启动时间: $(ps -o lstart= -p "$pid" 2>/dev/null || echo "未知")"
        else
            echo "❌ 服务状态: 异常（PID文件存在但进程不存在）"
            rm -f "$PID_FILE"
        fi
    else
        echo "❌ 服务状态: 未运行"
    fi
    
    # 检查端口
    if check_port "$SERVICE_PORT"; then
        echo "✅ 端口状态: $SERVICE_PORT 被占用"
        if command -v lsof >/dev/null 2>&1; then
            echo "   占用进程:"
            lsof -i:"$SERVICE_PORT" 2>/dev/null | tail -3 || true
        fi
    else
        echo "❌ 端口状态: $SERVICE_PORT 未被占用"
    fi
    
    # 检查日志文件
    if [ -f "$LOG_FILE" ]; then
        echo "📝 日志文件: $LOG_FILE"
        echo "   文件大小: $(du -h "$LOG_FILE" 2>/dev/null | cut -f1 || echo "未知")"
        echo "   最后修改: $(stat -c %y "$LOG_FILE" 2>/dev/null || echo "未知")"
    else
        echo "❌ 日志文件: 不存在"
    fi
    
    echo ""
}

# 查看服务日志
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "📝 $SERVICE_NAME 服务日志 (最后50行)"
        echo "================================"
        echo ""
        tail -50 "$LOG_FILE" 2>/dev/null || echo "无法读取日志文件"
    else
        echo "❌ 日志文件不存在: $LOG_FILE"
    fi
}

# 主函数
main() {
    echo "🚀 $SERVICE_NAME 服务管理"
    echo "================================"
    echo ""
    
    # 检查锁文件
    check_lock
    
    # 解析参数
    case "${1:-}" in
        "stop")
            stop_service
            exit 0
            ;;
        "status")
            show_status
            exit 0
            ;;
        "logs")
            show_logs
            exit 0
            ;;
        "--foreground")
            check_environment
            install_dependencies
            build_project
            stop_service
            start_service "true"
            ;;
        "--help"|"-h"|"help")
            show_help
            exit 0
            ;;
        "")
            # 默认后台启动
            check_environment
            install_dependencies
            build_project
            stop_service
            start_service "false"
            ;;
        *)
            log_error "未知参数: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
