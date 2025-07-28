#!/bin/bash

# Wuhr AI Ops Systemd Service 安装脚本

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

# 系统检测函数
detect_system() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        OS_VERSION=$VERSION_ID
    elif type lsb_release >/dev/null 2>&1; then
        OS=$(lsb_release -si)
        OS_VERSION=$(lsb_release -sr)
    elif [ -f /etc/redhat-release ]; then
        OS=$(cat /etc/redhat-release | awk '{print $1}')
        OS_VERSION=$(cat /etc/redhat-release | awk '{print $3}')
    else
        OS=$(uname -s)
        OS_VERSION=$(uname -r)
    fi
    
    log_info "检测到系统: $OS $OS_VERSION"
    
    # 设置systemd路径和包管理器
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        SYSTEMD_PATH="/etc/systemd/system"
        PACKAGE_MANAGER="apt"
        SERVICE_USER="www-data"
        SERVICE_GROUP="www-data"
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"AlmaLinux"* ]]; then
        SYSTEMD_PATH="/etc/systemd/system"
        PACKAGE_MANAGER="yum"
        SERVICE_USER="nginx"
        SERVICE_GROUP="nginx"
    elif [[ "$OS" == *"Fedora"* ]]; then
        SYSTEMD_PATH="/etc/systemd/system"
        PACKAGE_MANAGER="dnf"
        SERVICE_USER="nginx"
        SERVICE_GROUP="nginx"
    elif [[ "$OS" == *"SUSE"* ]] || [[ "$OS" == *"openSUSE"* ]]; then
        SYSTEMD_PATH="/etc/systemd/system"
        PACKAGE_MANAGER="zypper"
        SERVICE_USER="wwwrun"
        SERVICE_GROUP="www"
    elif [[ "$OS" == *"Arch"* ]]; then
        SYSTEMD_PATH="/etc/systemd/system"
        PACKAGE_MANAGER="pacman"
        SERVICE_USER="http"
        SERVICE_GROUP="http"
    elif [[ "$OS" == *"Alpine"* ]]; then
        log_error "Alpine Linux 使用 OpenRC，不支持 systemd"
        exit 1
    else
        log_warning "未识别的系统，使用默认配置"
        SYSTEMD_PATH="/etc/systemd/system"
        PACKAGE_MANAGER="unknown"
        SERVICE_USER="root"
        SERVICE_GROUP="root"
    fi
    
    # 检查服务用户是否存在，不存在则使用root
    if ! id "$SERVICE_USER" &>/dev/null; then
        log_warning "用户 $SERVICE_USER 不存在，使用 root 用户运行服务"
        SERVICE_USER="root"
        SERVICE_GROUP="root"
    fi
    
    log_info "Systemd 路径: $SYSTEMD_PATH"
    log_info "包管理器: $PACKAGE_MANAGER"
    log_info "服务用户: $SERVICE_USER:$SERVICE_GROUP"
}

# 获取当前用户和目录
CURRENT_USER=$(whoami)
PROJECT_DIR=$(pwd)
SERVICE_NAME="wuhr-ai-ops"

log_info "开始安装 Wuhr AI Ops systemd 服务..."
echo "用户: $CURRENT_USER"
echo "项目目录: $PROJECT_DIR"
echo ""

# 检测系统
detect_system

# 检查是否为root用户
if [ "$CURRENT_USER" != "root" ]; then
    log_error "需要root权限来安装systemd服务"
    log_info "请使用: sudo ./scripts/install-systemd-service.sh"
    exit 1
fi

# 检查systemd是否可用
if ! command -v systemctl &> /dev/null; then
    log_error "systemd 不可用，无法安装服务"
    log_info "检测到的系统: $OS"
    if [[ "$OS" == *"Alpine"* ]]; then
        log_info "Alpine Linux 请使用 OpenRC 替代"
    fi
    exit 1
fi

# 检查必要文件
if [ ! -f "package.json" ]; then
    log_error "未找到 package.json，请在项目根目录运行此脚本"
    exit 1
fi

# 获取Node.js路径 - 需要在root环境下重新检测
log_info "检测Node.js环境..."

# 常见的Node.js安装路径
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

# 查找可用的Node.js
NODE_PATH=""
for path in "${NODE_PATHS[@]}"; do
    if [ -n "$path" ] && [ -x "$path" ]; then
        NODE_PATH="$path"
        break
    fi
done

# 查找可用的npm
NPM_PATH=""
for path in "${NPM_PATHS[@]}"; do
    if [ -n "$path" ] && [ -x "$path" ]; then
        NPM_PATH="$path"
        break
    fi
done

if [ -z "$NODE_PATH" ] || [ -z "$NPM_PATH" ]; then
    log_error "未找到可执行的 Node.js 或 npm"
    log_info "请确保 Node.js 安装在系统PATH中"
    log_info "或者创建符号链接: ln -s /path/to/node /usr/bin/node"
    exit 1
fi

log_info "Node.js 路径: $NODE_PATH"
log_info "npm 路径: $NPM_PATH"

# 验证Node.js版本
NODE_VERSION=$($NODE_PATH -v 2>/dev/null || echo "unknown")
log_info "Node.js 版本: $NODE_VERSION"

# 创建systemd服务文件
SERVICE_FILE="$SYSTEMD_PATH/${SERVICE_NAME}.service"

log_info "创建 systemd 服务文件: $SERVICE_FILE"

# 检查项目目录权限
log_info "检查项目目录权限..."
if [ ! -r "$PROJECT_DIR/package.json" ]; then
    log_warning "服务用户可能无法读取项目文件，调整权限..."
    chmod -R 755 "$PROJECT_DIR"
    chown -R $SERVICE_USER:$SERVICE_GROUP "$PROJECT_DIR" 2>/dev/null || {
        log_warning "无法更改所有权，使用root用户运行服务"
        SERVICE_USER="root"
        SERVICE_GROUP="root"
    }
fi

cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Wuhr AI Ops - 智能化运维管理平台
Documentation=https://github.com/st-lzh/Wuhr-AI-ops
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
Environment=PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/node/bin:$(dirname $NODE_PATH):$(dirname $NPM_PATH)
Environment=HOME=$PROJECT_DIR
ExecStartPre=/bin/bash -c 'cd $PROJECT_DIR && $NPM_PATH install --production --unsafe-perm'
ExecStartPre=/bin/bash -c 'cd $PROJECT_DIR && $NPM_PATH run build'
ExecStartPre=/bin/bash -c 'cd $PROJECT_DIR && $NPM_PATH exec prisma generate'
ExecStart=$NPM_PATH start
ExecReload=/bin/kill -USR2 \$MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=wuhr-ai-ops

# 安全设置 (放宽权限以避免启动问题)
NoNewPrivileges=false
PrivateTmp=false
ProtectSystem=false
ProtectHome=false
ReadWritePaths=$PROJECT_DIR
ReadWritePaths=/tmp
ReadWritePaths=/var/log
ReadWritePaths=/var/cache

# 资源限制
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

log_success "服务文件创建完成"

# 创建环境变量文件配置
ENV_DIR="$SYSTEMD_PATH/${SERVICE_NAME}.service.d"

log_info "创建环境变量配置目录: $ENV_DIR"
mkdir -p "$ENV_DIR"

cat > "$ENV_DIR/environment.conf" << EOF
[Service]
# 从项目目录加载环境变量
EnvironmentFile=$PROJECT_DIR/.env
EOF

log_success "环境变量配置创建完成"

# 确保项目文件权限正确
log_info "设置项目文件权限..."
chmod -R 755 "$PROJECT_DIR"

# 确保关键文件可执行
if [ -f "$PROJECT_DIR/node_modules/.bin/next" ]; then
    chmod +x "$PROJECT_DIR/node_modules/.bin/next"
fi

# 只在非root用户时尝试更改所有权
if [ "$SERVICE_USER" != "root" ]; then
    chown -R $SERVICE_USER:$SERVICE_GROUP "$PROJECT_DIR" 2>/dev/null || {
        log_warning "无法更改项目目录所有权，服务将以root用户运行"
        # 重新生成服务文件，改为root用户
        sed -i "s/User=$SERVICE_USER/User=root/" "$SERVICE_FILE"
        sed -i "s/Group=$SERVICE_GROUP/Group=root/" "$SERVICE_FILE"
    }
fi

# 重新加载systemd配置
log_info "重新加载 systemd 配置..."
systemctl daemon-reload

# 启用服务
log_info "启用 ${SERVICE_NAME} 服务..."
systemctl enable "$SERVICE_NAME"

log_success "✅ Wuhr AI Ops systemd 服务安装完成！"
echo ""
echo "🔧 服务管理命令："
echo "  启动服务: sudo systemctl start $SERVICE_NAME"
echo "  停止服务: sudo systemctl stop $SERVICE_NAME"
echo "  重启服务: sudo systemctl restart $SERVICE_NAME"
echo "  查看状态: sudo systemctl status $SERVICE_NAME"
echo "  查看日志: sudo journalctl -u $SERVICE_NAME -f"
echo "  开机启动: sudo systemctl enable $SERVICE_NAME"
echo "  取消开机启动: sudo systemctl disable $SERVICE_NAME"
echo ""
echo "📝 系统信息："
echo "  操作系统: $OS $OS_VERSION"
echo "  运行用户: $SERVICE_USER:$SERVICE_GROUP"
echo "  服务路径: $SERVICE_FILE"
echo ""
echo "📝 注意事项："
echo "  - 确保 .env 文件已正确配置"
echo "  - 确保 PostgreSQL 和 Redis 服务正在运行"
echo "  - 服务将在端口 3000 上运行"
echo "  - 日志可通过 journalctl 查看"
echo ""

# 询问是否立即启动服务
read -p "是否立即启动服务？[y/N]: " start_now
case $start_now in
    [Yy]*)
        log_info "启动 ${SERVICE_NAME} 服务..."
        if systemctl start "$SERVICE_NAME"; then
            log_success "服务启动成功！"
            echo ""
            systemctl status "$SERVICE_NAME" --no-pager
        else
            log_error "服务启动失败，请检查配置"
            log_info "查看错误日志: sudo journalctl -u $SERVICE_NAME -n 20"
        fi
        ;;
    *)
        log_info "服务已安装但未启动，可以手动启动: sudo systemctl start $SERVICE_NAME"
        ;;
esac

echo ""
log_success "🎉 安装完成！" 