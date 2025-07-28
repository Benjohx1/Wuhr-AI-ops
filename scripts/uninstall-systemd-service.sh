#!/bin/bash

# Wuhr AI Ops Systemd Service 卸载脚本

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
CURRENT_USER=$(whoami)

log_info "开始卸载 Wuhr AI Ops systemd 服务..."

# 检查是否为root用户
if [ "$CURRENT_USER" != "root" ]; then
    log_error "需要root权限来卸载systemd服务"
    log_info "请使用: sudo ./scripts/uninstall-systemd-service.sh"
    exit 1
fi

# 检查服务是否存在
if ! systemctl list-unit-files | grep -q "$SERVICE_NAME.service"; then
    log_warning "服务 $SERVICE_NAME 不存在，无需卸载"
    exit 0
fi

# 停止服务
log_info "停止服务..."
if systemctl is-active --quiet "$SERVICE_NAME"; then
    systemctl stop "$SERVICE_NAME"
    log_success "服务已停止"
else
    log_info "服务未运行"
fi

# 禁用服务
log_info "禁用服务..."
if systemctl is-enabled --quiet "$SERVICE_NAME"; then
    systemctl disable "$SERVICE_NAME"
    log_success "服务已禁用"
else
    log_info "服务未启用"
fi

# 删除服务文件
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
SERVICE_DIR="/etc/systemd/system/${SERVICE_NAME}.service.d"

if [ -f "$SERVICE_FILE" ]; then
    rm -f "$SERVICE_FILE"
    log_success "删除服务文件: $SERVICE_FILE"
fi

if [ -d "$SERVICE_DIR" ]; then
    rm -rf "$SERVICE_DIR"
    log_success "删除服务配置目录: $SERVICE_DIR"
fi

# 重新加载systemd配置
log_info "重新加载 systemd 配置..."
systemctl daemon-reload

log_success "✅ Wuhr AI Ops systemd 服务卸载完成！"
echo ""
log_info "如需重新安装服务，请运行: sudo ./scripts/install-systemd-service.sh" 