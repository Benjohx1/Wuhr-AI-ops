#!/bin/bash

# 修复TypeScript问题并安装systemd服务

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

echo "🔧 Wuhr AI Ops 修复并安装服务"
echo "================================"
echo ""

# 1. 强制清理现有服务
log_info "1. 清理现有服务..."
if [ -f "scripts/force-clean-systemd.sh" ]; then
    chmod +x scripts/force-clean-systemd.sh
    sudo ./scripts/force-clean-systemd.sh
else
    # 手动清理
    sudo systemctl stop wuhr-ai-ops 2>/dev/null || true
    sudo systemctl disable wuhr-ai-ops 2>/dev/null || true
    sudo pkill -f "wuhr-ai-ops" 2>/dev/null || true
    sudo rm -f /etc/systemd/system/wuhr-ai-ops.service
    sudo rm -rf /etc/systemd/system/wuhr-ai-ops.service.d
    sudo systemctl daemon-reload
    sudo systemctl reset-failed 2>/dev/null || true
fi

# 2. 安装依赖（包含类型声明）
log_info "2. 安装项目依赖..."
npm install

# 3. 验证TypeScript编译
log_info "3. 验证TypeScript编译..."
if npx tsc --noEmit; then
    log_success "TypeScript编译通过"
else
    log_error "TypeScript编译失败，请检查类型错误"
    exit 1
fi

# 4. 测试构建
log_info "4. 测试项目构建..."
if npm run build; then
    log_success "项目构建成功"
else
    log_error "项目构建失败"
    exit 1
fi

# 5. 安装systemd服务
log_info "5. 安装systemd服务..."
if sudo ./scripts/install-systemd-service.sh; then
    log_success "systemd服务安装完成"
else
    log_error "systemd服务安装失败"
    exit 1
fi

echo ""
log_success "🎉 修复和安装完成！"
echo ""
echo "📋 服务管理命令："
echo "  查看状态: sudo systemctl status wuhr-ai-ops"
echo "  查看日志: sudo journalctl -u wuhr-ai-ops -f"
echo "  重启服务: sudo systemctl restart wuhr-ai-ops"
echo "  停止服务: sudo systemctl stop wuhr-ai-ops"
echo "" 