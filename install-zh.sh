#!/bin/bash

# Wuhr AI Ops 国内版一键安装脚本
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

# 全局变量
PROJECT_DIR=$(pwd)
KUBELET_WUHRAI_PATH="$PROJECT_DIR/kubelet-wuhrai"
LOG_FILE="$PROJECT_DIR/install.log"

# 国内镜像源配置
DOCKER_MIRRORS=(
    "https://docker.mirrors.ustc.edu.cn"
    "https://hub-mirror.c.163.com"
    "https://mirror.baidubce.com"
)
NPM_REGISTRY="https://registry.npmmirror.com"
NODE_MIRROR="https://npmmirror.com/mirrors/node"
KUBELET_DOWNLOAD_URLS=(
    "https://wuhrai-wordpress.oss-cn-hangzhou.aliyuncs.com/kubelet-wuhrai"
    "https://gitee.com/st-lzh/kubelet-wuhrai/releases/latest/download/kubelet-wuhrai"
    "https://github.com/st-lzh/kubelet-wuhrai/releases/download/v1.0.0/kubelet-wuhrai"
)

# 日志函数
log_with_time() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[信息]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[成功]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[警告]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[错误]${NC} $1" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "${PURPLE}[步骤]${NC} $1" | tee -a "$LOG_FILE"
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
    echo -e "${BLUE}国内版一键安装脚本 v2.0${NC}"
    echo "=================================="
    echo ""
}

# 检查系统要求
check_system_requirements() {
    log_step "检查系统要求"
    
    # 检查操作系统
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        log_error "此脚本仅支持Linux系统"
        exit 1
    fi
    
    # 检查内存
    local memory_gb=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$memory_gb" -lt 4 ]; then
        log_warning "系统内存少于4GB，可能影响性能"
    fi
    
    # 检查磁盘空间
    local disk_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$disk_space" -lt 10 ]; then
        log_error "磁盘可用空间不足10GB"
        exit 1
    fi
    
    log_success "系统要求检查通过"
}

# 检查网络连接
check_network() {
    log_step "检查网络连接"
    
    # 测试国内网络
    if ping -c 2 -W 3 www.baidu.com > /dev/null 2>&1; then
        log_success "网络连接正常"
    else
        log_error "网络连接异常，请检查网络设置"
        exit 1
    fi
    
    # 测试DNS解析
    if nslookup registry.npmmirror.com > /dev/null 2>&1; then
        log_success "DNS解析正常"
    else
        log_warning "DNS解析可能有问题，建议使用公共DNS"
    fi
}

# 安装系统依赖
install_system_dependencies() {
    log_step "安装系统依赖"
    
    # 更新软件包列表
    log_info "更新软件包列表..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update -y
        sudo apt-get install -y curl wget gnupg lsb-release ca-certificates software-properties-common
    elif command -v yum &> /dev/null; then
        sudo yum update -y
        sudo yum install -y curl wget gnupg2 ca-certificates
    elif command -v dnf &> /dev/null; then
        sudo dnf update -y
        sudo dnf install -y curl wget gnupg2 ca-certificates
    else
        log_error "不支持的Linux发行版"
        exit 1
    fi
    
    log_success "系统依赖安装完成"
}

# 配置Docker国内镜像源
configure_docker_daemon() {
    log_step "配置Docker国内镜像源"
    
    sudo mkdir -p /etc/docker
    
    cat > /tmp/daemon.json << EOF
{
    "registry-mirrors": [
        "${DOCKER_MIRRORS[0]}",
        "${DOCKER_MIRRORS[1]}",
        "${DOCKER_MIRRORS[2]}"
    ],
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "exec-opts": ["native.cgroupdriver=systemd"],
    "insecure-registries": [],
    "debug": false,
    "experimental": false
}
EOF
    
    sudo mv /tmp/daemon.json /etc/docker/daemon.json
    log_success "Docker镜像源配置完成"
}

# 安装Docker
install_docker() {
    log_step "安装Docker"
    
    if command -v docker &> /dev/null; then
        log_info "Docker已安装，跳过安装步骤"
        return 0
    fi
    
    # 卸载旧版本
    if command -v apt-get &> /dev/null; then
        sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
        
        # 使用阿里云镜像安装Docker
        curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
    elif command -v yum &> /dev/null; then
        sudo yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true
        
        # 使用阿里云镜像
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
    elif command -v dnf &> /dev/null; then
        sudo dnf remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true
        
        sudo dnf install -y dnf-plugins-core
        sudo dnf config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/fedora/docker-ce.repo
        sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    fi
    
    # 配置Docker镜像源
    configure_docker_daemon
    
    # 启动Docker服务
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # 添加用户到docker组
    sudo usermod -aG docker $USER
    
    # 重启Docker以应用配置
    sudo systemctl restart docker
    
    log_success "Docker安装完成"
}

# 安装Docker Compose
install_docker_compose() {
    log_step "安装Docker Compose"
    
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose已安装，跳过安装步骤"
        return 0
    fi
    
    # 从国内镜像下载
    local compose_version="v2.24.0"
    sudo curl -L "https://get.daocloud.io/docker/compose/releases/download/${compose_version}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # 创建符号链接
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    log_success "Docker Compose安装完成"
}

# 安装Node.js
install_nodejs() {
    log_step "安装Node.js"
    
    if command -v node &> /dev/null; then
        local node_version=$(node -v | sed 's/v//')
        local node_major=$(echo $node_version | cut -d. -f1)
        if [ "$node_major" -ge 18 ]; then
            log_info "Node.js版本满足要求 ($node_version)，跳过安装"
            return 0
        fi
    fi
    
    # 使用NodeSource国内镜像
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    elif command -v dnf &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo dnf install -y nodejs
    fi
    
    log_success "Node.js安装完成"
}

# 配置npm国内镜像源
configure_npm_mirrors() {
    log_step "配置npm国内镜像源"
    
    npm config set registry $NPM_REGISTRY
    npm config set cache ~/.npm-cache
    
    log_success "npm国内镜像源配置完成"
    log_info "当前npm源: $(npm config get registry)"
}

# 下载kubelet-wuhrai
download_kubelet_wuhrai() {
    log_step "下载kubelet-wuhrai工具"
    
    if [ -f "$KUBELET_WUHRAI_PATH" ]; then
        log_info "kubelet-wuhrai已存在，跳过下载"
        chmod +x "$KUBELET_WUHRAI_PATH"
        return 0
    fi
    
    for url in "${KUBELET_DOWNLOAD_URLS[@]}"; do
        log_info "尝试从 $url 下载..."
        if curl -L --connect-timeout 30 --retry 3 -o "$KUBELET_WUHRAI_PATH" "$url"; then
            chmod +x "$KUBELET_WUHRAI_PATH"
            log_success "kubelet-wuhrai下载完成"
            return 0
        else
            log_warning "从 $url 下载失败，尝试下一个源..."
        fi
    done
    
    log_error "所有下载源都失败，请手动下载kubelet-wuhrai"
    return 1
}

# 检查端口占用
check_port_availability() {
    log_step "检查端口占用情况"
    
    local ports=(3000 5432 6379 5050)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            occupied_ports+=($port)
        fi
    done
    
    if [ ${#occupied_ports[@]} -gt 0 ]; then
        log_warning "以下端口已被占用: ${occupied_ports[*]}"
        log_info "将尝试停止相关服务或使用其他端口"
    else
        log_success "所需端口都可用"
    fi
}

# 初始化项目配置
initialize_project_config() {
    log_step "初始化项目配置"
    
    # 检查必要文件
    local required_files=("package.json" "docker-compose.yml")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "缺少必要文件: $file"
            exit 1
        fi
    done
    
    # 创建.env文件
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success "已创建.env配置文件"
        else
            log_error "缺少.env.example模板文件"
            exit 1
        fi
    fi
    
    log_success "项目配置初始化完成"
}

# 安装项目依赖
install_project_dependencies() {
    log_step "安装项目依赖"
    
    log_info "清理npm缓存..."
    npm cache clean --force
    
    log_info "安装依赖包..."
    if npm install --registry=$NPM_REGISTRY --verbose; then
        log_success "项目依赖安装完成"
    else
        log_error "项目依赖安装失败"
        exit 1
    fi
}

# 启动Docker服务
start_docker_services() {
    log_step "启动Docker服务"
    
    # 确保Docker服务运行
    if ! systemctl is-active --quiet docker; then
        sudo systemctl start docker
    fi
    
    # 停止现有容器
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # 启动服务
    if docker-compose up -d; then
        log_success "Docker服务启动完成"
    else
        log_error "Docker服务启动失败"
        exit 1
    fi
    
    # 等待服务就绪
    log_info "等待数据库服务启动..."
    sleep 10
    
    # 检查数据库连接
    local retry_count=0
    while [ $retry_count -lt 30 ]; do
        if docker-compose exec -T postgres pg_isready -U wuhr_admin -h localhost >/dev/null 2>&1; then
            log_success "数据库服务已就绪"
            break
        fi
        echo -n "."
        sleep 2
        retry_count=$((retry_count + 1))
    done
    
    if [ $retry_count -eq 30 ]; then
        log_warning "数据库启动超时，继续执行..."
    fi
}

# 初始化数据库
initialize_database() {
    log_step "初始化数据库"
    
    log_info "重置并同步数据库架构..."
    if npx prisma db push --force-reset; then
        log_success "数据库架构同步完成"
    else
        log_error "数据库架构同步失败"
        exit 1
    fi
    
    log_info "生成Prisma客户端..."
    if npx prisma generate; then
        log_success "Prisma客户端生成完成"
    else
        log_error "Prisma客户端生成失败"
        exit 1
    fi
}

# 创建管理员用户
create_admin_user() {
    log_step "创建管理员用户"
    
    if [ -f "scripts/ensure-admin-user.js" ]; then
        if node scripts/ensure-admin-user.js; then
            log_success "管理员用户创建完成"
        else
            log_warning "管理员用户创建失败，可能已存在"
        fi
    else
        log_warning "管理员创建脚本不存在"
    fi
}

# 初始化权限系统
initialize_permissions() {
    log_step "初始化权限系统"
    
    if [ -f "scripts/init-permissions.js" ]; then
        if node scripts/init-permissions.js >/dev/null 2>&1; then
            log_success "权限系统初始化完成"
        else
            log_warning "权限系统初始化失败，跳过此步骤"
        fi
    else
        log_warning "权限初始化脚本不存在"
    fi
}

# 初始化预设模型
initialize_preset_models() {
    log_step "初始化预设模型"
    
    if [ -f "scripts/init-preset-models.js" ]; then
        if node scripts/init-preset-models.js >/dev/null 2>&1; then
            log_success "预设模型初始化完成"
        else
            log_warning "预设模型初始化失败，跳过此步骤"
        fi
    else
        log_warning "预设模型初始化脚本不存在"
    fi
}

# 构建和启动应用
build_and_start_application() {
    log_step "构建和启动应用"
    
    log_info "构建应用..."
    if npm run build; then
        log_success "应用构建完成"
        
        log_info "启动生产服务器..."
        nohup npm start > app.log 2>&1 &
        local app_pid=$!
        echo $app_pid > app.pid
        
    else
        log_warning "应用构建失败，启动开发模式..."
        nohup npm run dev > app.log 2>&1 &
        local app_pid=$!
        echo $app_pid > app.pid
    fi
    
    # 等待应用启动
    log_info "等待应用启动..."
    sleep 15
    
    local retry_count=0
    while [ $retry_count -lt 20 ]; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            log_success "应用启动完成"
            return 0
        fi
        echo -n "."
        sleep 3
        retry_count=$((retry_count + 1))
    done
    
    log_warning "应用启动超时，请检查日志文件"
}

# 获取访问信息
get_access_info() {
    # 获取内网IP
    local local_ip=$(hostname -I | awk '{for(i=1;i<=NF;i++) if($i ~ /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) {print $i; exit}}')
    
    # 获取外网IP
    local public_ip=$(curl -s --connect-timeout 5 ipinfo.io/ip 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' || echo "无法获取")
    
    echo "$local_ip|$public_ip"
}

# 显示安装完成信息
show_completion_info() {
    local access_info=$(get_access_info)
    local local_ip=$(echo $access_info | cut -d'|' -f1)
    local public_ip=$(echo $access_info | cut -d'|' -f2)
    
    echo ""
    echo -e "${GREEN}🎉 Wuhr AI Ops 安装完成！${NC}"
    echo "=================================="
    echo ""
    echo -e "${CYAN}🌐 访问地址：${NC}"
    if [ -n "$local_ip" ] && [ "$local_ip" != "" ]; then
        echo "   内网访问: http://$local_ip:3000"
    fi
    if [ "$public_ip" != "无法获取" ] && [ -n "$public_ip" ]; then
        echo "   外网访问: http://$public_ip:3000"
    else
        echo "   外网访问: http://[你的公网IP]:3000"
    fi
    echo ""
    echo -e "${CYAN}👤 默认管理员账户：${NC}"
    echo "   用户名: admin"
    echo "   邮箱: admin@wuhr.ai"
    echo "   密码: Admin123!"
    echo ""
    echo -e "${CYAN}🔧 管理工具：${NC}"
    echo "   数据库管理: http://$local_ip:5050"
    echo "   账户: admin@wuhrai.com"
    echo "   密码: admin_password_2024"
    echo ""
    echo -e "${CYAN}📝 重要文件：${NC}"
    echo "   应用日志: tail -f app.log"
    echo "   安装日志: tail -f install.log"
    echo "   进程ID: cat app.pid"
    echo ""
    echo -e "${CYAN}🛠️ 管理命令：${NC}"
    echo "   停止服务: docker-compose down"
    echo "   重启服务: docker-compose restart"
    echo "   查看状态: docker-compose ps"
    echo ""
    echo -e "${YELLOW}💡 温馨提示：${NC}"
    echo "   - 首次访问可能需要等待1-2分钟"
    echo "   - 如无法访问，请检查防火墙设置: ufw allow 3000"
    echo "   - AI功能需要配置相应的API密钥"
    echo "   - 建议定期备份数据库和配置文件"
    echo ""
    echo -e "${CYAN}📞 技术支持：${NC}"
    echo "   邮箱: 1139804291@qq.com"
    echo "   文档: README.md"
    echo ""
}

# 清理函数
cleanup_on_error() {
    log_error "安装过程中发生错误，正在清理..."
    docker-compose down --remove-orphans 2>/dev/null || true
    if [ -f app.pid ]; then
        local pid=$(cat app.pid)
        kill $pid 2>/dev/null || true
        rm -f app.pid
    fi
}

# 主安装流程
main() {
    # 设置错误处理
    trap cleanup_on_error ERR
    
    # 显示横幅
    show_banner
    
    # 开始安装
    log_with_time "开始安装 Wuhr AI Ops"
    
    # 检查系统要求
    check_system_requirements
    
    # 检查网络连接
    check_network
    
    # 安装系统依赖
    install_system_dependencies
    
    # 安装Docker
    install_docker
    
    # 安装Docker Compose
    install_docker_compose
    
    # 安装Node.js
    install_nodejs
    
    # 配置npm镜像源
    configure_npm_mirrors
    
    # 下载kubelet-wuhrai
    download_kubelet_wuhrai
    
    # 检查端口占用
    check_port_availability
    
    # 初始化项目配置
    initialize_project_config
    
    # 安装项目依赖
    install_project_dependencies
    
    # 启动Docker服务
    start_docker_services
    
    # 初始化数据库
    initialize_database
    
    # 创建管理员用户
    create_admin_user
    
    # 初始化权限系统
    initialize_permissions
    
    # 初始化预设模型
    initialize_preset_models
    
    # 构建和启动应用
    build_and_start_application
    
    # 显示完成信息
    show_completion_info
    
    log_with_time "安装完成"
}

# 检查是否以root权限运行
if [ "$EUID" -eq 0 ]; then
    log_warning "检测到root权限，建议使用普通用户运行此脚本"
    read -p "是否继续？[y/N]: " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 运行主函数
main "$@" 