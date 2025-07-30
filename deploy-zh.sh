#!/bin/bash

# Wuhr AI Ops 国内版一键部署脚本
# 作者: st-lzh
# 邮箱: 1139804291@qq.com
# 适用于中国大陆网络环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
REPO_URL="https://github.com/st-lzh/wuhr-ai-ops.git"
PROJECT_NAME="wuhr-ai-ops"
INSTALL_SCRIPT="install-zh.sh"

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

log_step() {
    echo -e "${PURPLE}[步骤]${NC} $1"
}

# 显示横幅
show_banner() {
    echo -e "${CYAN}"
    echo "██╗    ██╗██╗   ██╗██╗  ██╗██████╗      █████╗ ██╗"
    echo "██║    ██║██║   ██║██║  ██║██╔══██╗    ██╔══██╗██║"
    echo "██║ █╗ ██║██║   ██║███████║██████╔╝    ███████║██║"
    echo "██║███╗██║██║   ██║██╔══██║██╔══██╗    ██╔══██║██║"
    echo "╚███╔███╔╝╚██████╔╝██║  ██║██║  ██║    ██║  ██║██║"
    echo " ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝"
    echo -e "${NC}"
    echo -e "${GREEN}Wuhr AI Ops - 智能运维平台${NC}"
    echo -e "${BLUE}国内版一键部署脚本 v2.0${NC}"
    echo "=================================="
    echo ""
}

# 检查Git是否安装
check_git() {
    if ! command -v git &> /dev/null; then
        log_error "Git未安装，请先安装Git"
        echo "安装命令: sudo apt-get install git (Ubuntu/Debian) 或 sudo yum install git (CentOS/RHEL)"
        exit 1
    fi
}

# 检查网络连接
check_network() {
    log_step "检查网络连接"
    
    if ! ping -c 1 github.com &> /dev/null; then
        log_error "无法连接到GitHub，请检查网络连接"
        exit 1
    fi
    
    log_success "网络连接正常"
}

# 克隆代码仓库
clone_repository() {
    log_step "克隆代码仓库"
    
    # 检查是否已存在项目目录
    if [ -d "$PROJECT_NAME" ]; then
        log_warning "项目目录已存在，是否删除并重新克隆？(y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            log_info "删除现有项目目录..."
            rm -rf "$PROJECT_NAME"
        else
            log_info "使用现有项目目录"
            cd "$PROJECT_NAME"
            return
        fi
    fi
    
    log_info "正在克隆代码仓库..."
    if git clone "$REPO_URL" "$PROJECT_NAME"; then
        log_success "代码仓库克隆成功"
    else
        log_error "代码仓库克隆失败"
        exit 1
    fi
    
    cd "$PROJECT_NAME"
}

# 执行安装脚本
run_install_script() {
    log_step "执行安装脚本"
    
    if [ ! -f "$INSTALL_SCRIPT" ]; then
        log_error "安装脚本 $INSTALL_SCRIPT 不存在"
        exit 1
    fi
    
    log_info "开始执行安装脚本..."
    chmod +x "$INSTALL_SCRIPT"
    ./"$INSTALL_SCRIPT"
}

# 显示完成信息
show_completion() {
    echo ""
    echo -e "${GREEN}=================================="
    echo "🎉 部署完成！"
    echo "=================================="
    echo ""
    echo "📱 访问地址:"
    echo "   本地访问: http://localhost:3000"
    echo "   内网访问: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "🔑 默认管理员账户:"
    echo "   用户名: admin"
    echo "   邮箱: admin@wuhr.ai"
    echo "   密码: Admin123!"
    echo ""
    echo "📚 更多信息请查看:"
    echo "   README.md - 使用指南"
    echo "   INSTALL.md - 安装文档"
    echo ""
    echo "🛠️  服务管理:"
    echo "   ./restart.sh - 启动/重启服务"
    echo "   ./restart.sh stop - 停止服务"
    echo "   ./restart.sh status - 查看状态"
    echo -e "${NC}"
}

# 主函数
main() {
    show_banner
    
    log_info "开始一键部署 Wuhr AI Ops..."
    
    # 检查系统要求
    check_git
    check_network
    
    # 克隆代码
    clone_repository
    
    # 执行安装
    run_install_script
    
    # 显示完成信息
    show_completion
}

# 执行主函数
main "$@" 