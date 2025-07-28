#!/bin/bash

# Wuhr AI Ops Systemd 服务诊断脚本

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

SERVICE_NAME="wuhr-ai-ops"

echo "🔍 Wuhr AI Ops Systemd 服务诊断"
echo "================================"
echo ""

# 1. 检查服务状态
log_info "1. 检查服务状态..."
if systemctl is-active --quiet "$SERVICE_NAME"; then
    log_success "服务正在运行"
else
    log_error "服务未运行"
fi

if systemctl is-enabled --quiet "$SERVICE_NAME"; then
    log_success "服务已启用（开机自启）"
else
    log_warning "服务未启用"
fi

echo ""

# 2. 显示服务状态详情
log_info "2. 服务状态详情:"
systemctl status "$SERVICE_NAME" --no-pager -l || true
echo ""

# 3. 显示最近日志
log_info "3. 最近的错误日志:"
journalctl -u "$SERVICE_NAME" -n 20 --no-pager || true
echo ""

# 4. 检查服务文件
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
log_info "4. 检查服务文件: $SERVICE_FILE"
if [ -f "$SERVICE_FILE" ]; then
    log_success "服务文件存在"
    echo "服务文件内容:"
    echo "------------------------"
    cat "$SERVICE_FILE"
    echo "------------------------"
else
    log_error "服务文件不存在"
fi
echo ""

# 5. 检查Node.js环境
log_info "5. 检查Node.js环境:"
NODE_PATHS=(
    "/usr/bin/node"
    "/usr/local/bin/node"
    "/opt/node/bin/node"
    "$(which node 2>/dev/null)"
)

NPM_PATHS=(
    "/usr/bin/npm"
    "/usr/local/bin/npm"
    "/opt/node/bin/npm"
    "$(which npm 2>/dev/null)"
)

echo "可用的Node.js路径:"
for path in "${NODE_PATHS[@]}"; do
    if [ -n "$path" ] && [ -x "$path" ]; then
        version=$($path -v 2>/dev/null || echo "unknown")
        echo "  ✅ $path ($version)"
    elif [ -n "$path" ]; then
        echo "  ❌ $path (不可执行)"
    fi
done

echo "可用的npm路径:"
for path in "${NPM_PATHS[@]}"; do
    if [ -n "$path" ] && [ -x "$path" ]; then
        version=$($path -v 2>/dev/null || echo "unknown")
        echo "  ✅ $path ($version)"
    elif [ -n "$path" ]; then
        echo "  ❌ $path (不可执行)"
    fi
done
echo ""

# 6. 检查项目目录
PROJECT_DIR=$(pwd)
log_info "6. 检查项目目录: $PROJECT_DIR"

if [ -f "$PROJECT_DIR/package.json" ]; then
    log_success "package.json 存在"
else
    log_error "package.json 不存在"
fi

if [ -f "$PROJECT_DIR/.env" ]; then
    log_success ".env 文件存在"
else
    log_warning ".env 文件不存在"
fi

if [ -d "$PROJECT_DIR/node_modules" ]; then
    log_success "node_modules 目录存在"
else
    log_warning "node_modules 目录不存在"
fi

if [ -d "$PROJECT_DIR/.next" ]; then
    log_success ".next 构建目录存在"
else
    log_warning ".next 构建目录不存在"
fi

# 检查关键文件权限
echo "文件权限检查:"
ls -la "$PROJECT_DIR/package.json" 2>/dev/null || echo "  ❌ package.json 权限检查失败"
ls -la "$PROJECT_DIR/.env" 2>/dev/null || echo "  ⚠️  .env 文件不存在"
if [ -f "$PROJECT_DIR/node_modules/.bin/next" ]; then
    ls -la "$PROJECT_DIR/node_modules/.bin/next" || echo "  ❌ next 可执行文件权限检查失败"
else
    echo "  ⚠️  next 可执行文件不存在"
fi
echo ""

# 7. 测试手动启动
log_info "7. 建议的修复步骤:"
echo ""
echo "如果服务启动失败，尝试以下步骤："
echo ""
echo "1. 手动测试应用启动:"
echo "   cd $PROJECT_DIR"
echo "   npm install"
echo "   npm run build"
echo "   npm start"
echo ""
echo "2. 如果Node.js路径有问题，创建符号链接:"
echo "   sudo ln -sf \$(which node) /usr/bin/node"
echo "   sudo ln -sf \$(which npm) /usr/bin/npm"
echo ""
echo "3. 重新安装服务:"
echo "   sudo systemctl stop $SERVICE_NAME"
echo "   sudo ./scripts/uninstall-systemd-service.sh"
echo "   sudo ./scripts/install-systemd-service.sh"
echo ""
echo "4. 查看实时日志:"
echo "   sudo journalctl -u $SERVICE_NAME -f"
echo ""

# 8. 环境变量检查
log_info "8. 环境变量检查:"
if [ -f "$PROJECT_DIR/.env" ]; then
    echo "环境变量文件存在，检查关键配置:"
    if grep -q "DATABASE_URL" "$PROJECT_DIR/.env"; then
        log_success "DATABASE_URL 已配置"
    else
        log_warning "DATABASE_URL 未配置"
    fi
    
    if grep -q "REDIS_URL" "$PROJECT_DIR/.env"; then
        log_success "REDIS_URL 已配置"
    else
        log_warning "REDIS_URL 未配置"
    fi
else
    log_error ".env 文件不存在，请复制 .env.example"
fi
echo ""

log_info "诊断完成！请根据上述信息进行问题排查。" 