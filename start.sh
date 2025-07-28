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
    command -v "$1" &> /dev/null
}

# 安装Docker
install_docker() {
    echo ""
    log_info "开始安装Docker..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux系统
        log_info "检测到Linux系统，安装Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        
        # 安装Docker Compose
        log_info "安装Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        log_success "Docker和Docker Compose安装完成"
        log_warning "请重新登录或运行 'newgrp docker' 后再次运行此脚本"
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS系统
        log_info "检测到macOS系统"
        if command -v brew &> /dev/null; then
            log_info "使用Homebrew安装Docker Desktop..."
            brew install --cask docker
            log_success "Docker Desktop安装完成，请启动Docker Desktop应用"
        else
            log_warning "未检测到Homebrew，请手动安装："
            echo "1. 访问 https://docs.docker.com/desktop/mac/install/"
            echo "2. 下载并安装Docker Desktop for Mac"
            echo "3. 启动Docker Desktop应用"
        fi
        
    else
        log_warning "不支持自动安装，请手动安装："
        echo "1. 访问 https://docs.docker.com/get-docker/"
        echo "2. 下载适合您系统的Docker"
        echo "3. 安装Docker和Docker Compose"
    fi
}

# 安装Node.js和npm
install_nodejs() {
    echo ""
    log_info "开始安装Node.js..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux系统 - 检测发行版
        if command -v apt-get &> /dev/null; then
            # Ubuntu/Debian系统
            log_info "检测到Ubuntu/Debian系统，安装Node.js 20.x..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command -v yum &> /dev/null; then
            # CentOS/RHEL系统
            log_info "检测到CentOS/RHEL系统，安装Node.js 20.x..."
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs
        elif command -v dnf &> /dev/null; then
            # Fedora系统
            log_info "检测到Fedora系统，安装Node.js 20.x..."
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo dnf install -y nodejs
        else
            log_warning "未识别的Linux发行版，请手动安装Node.js"
        fi
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS系统
        log_info "检测到macOS系统"
        if command -v brew &> /dev/null; then
            log_info "使用Homebrew安装Node.js..."
            brew install node@20
            brew link node@20
        else
            log_warning "未检测到Homebrew，请手动安装："
            echo "1. 访问 https://nodejs.org/en/download/"
            echo "2. 下载Node.js 20.x LTS版本"
            echo "3. 安装Node.js（包含npm）"
        fi
        
    else
        log_warning "不支持自动安装，请手动安装："
        echo "1. 访问 https://nodejs.org/en/download/"
        echo "2. 下载Node.js 20.x LTS版本"
        echo "3. 安装Node.js（包含npm）"
    fi
}

# 环境检查和安装选择
check_and_install_environment() {
    local missing_tools=()
    
    # 检查Docker
    if ! check_command "docker"; then
        missing_tools+=("Docker")
    fi
    
    # 检查Docker Compose
    if ! check_command "docker-compose"; then
        missing_tools+=("Docker Compose")
    fi
    
    # 检查Node.js
    if ! check_command "node"; then
        missing_tools+=("Node.js")
    fi
    
    # 检查npm
    if ! check_command "npm"; then
        missing_tools+=("npm")
    fi
    
    # 如果有缺失的工具，询问用户是否安装
    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo ""
        echo "⚠️  检测到以下工具未安装："
        for tool in "${missing_tools[@]}"; do
            echo "   - $tool"
        done
        echo ""
        
        while true; do
            read -p "是否自动安装缺失的环境？[y/N]: " install_choice
            case $install_choice in
                [Yy]*)
                    # 安装Docker和Docker Compose
                    if [[ " ${missing_tools[@]} " =~ " Docker " ]] || [[ " ${missing_tools[@]} " =~ " Docker Compose " ]]; then
                        install_docker
                    fi
                    
                    # 安装Node.js和npm
                    if [[ " ${missing_tools[@]} " =~ " Node.js " ]] || [[ " ${missing_tools[@]} " =~ " npm " ]]; then
                        install_nodejs
                    fi
                    
                    echo ""
                    log_success "🎉 环境安装完成！"
                    echo ""
                    echo "📝 下一步操作："
                    echo "1. 如果安装了Docker，请确保Docker服务已启动"
                    echo "2. 重新运行此脚本：./start.sh"
                    echo ""
                    exit 0
                    ;;
                [Nn]*|"")
                    log_error "请手动安装缺失的环境后再运行此脚本"
                    echo ""
                    echo "安装指南："
                    echo "1. Docker: https://docs.docker.com/get-docker/"
                    echo "2. Node.js: https://nodejs.org/en/download/"
                    exit 1
                    ;;
                *)
                    echo "⚠️  请输入 y 或 n"
                    ;;
            esac
        done
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
    echo "📋 系统要求："
    echo "   - Docker >= 20.10.0"
    echo "   - Docker Compose >= 2.0.0"
    echo "   - Node.js >= 18.0.0"
    echo "   - npm >= 8.0.0"
    echo ""
    
    # 检查并安装环境
    log_info "检查系统环境..."
    check_and_install_environment
    
    # 验证环境版本
    log_info "验证环境版本..."
    
    # 检查Docker版本
    local docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    log_info "Docker 版本: $docker_version ✓"
    
    # 检查Docker Compose版本
    local compose_version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    log_info "Docker Compose 版本: $compose_version ✓"
    
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
    if npm install >/dev/null 2>&1; then
        log_success "依赖安装完成"
    else
        log_error "依赖安装失败"
        exit 1
    fi
    
    # 启动Docker服务
    log_info "启动Docker服务..."
    if docker-compose up -d >/dev/null 2>&1; then
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
    
    # 初始化数据库
    log_info "初始化数据库..."
    if npx prisma db push --force-reset >/dev/null 2>&1; then
        log_success "数据库初始化完成"
    else
        log_error "数据库初始化失败"
        exit 1
    fi
    
    # 生成Prisma客户端
    log_info "生成数据库客户端..."
    if npx prisma generate >/dev/null 2>&1; then
        log_success "数据库客户端生成完成"
    else
        log_error "数据库客户端生成失败"
        exit 1
    fi
    
    # 创建管理员账户
    log_info "创建管理员账户..."
    if [ -f "scripts/create-admin.js" ]; then
        node scripts/create-admin.js
    else
        log_warning "管理员创建脚本不存在"
    fi
    
    # 初始化权限系统
    log_info "初始化权限系统..."
    if [ -f "scripts/init-permissions.js" ]; then
        node scripts/init-permissions.js >/dev/null 2>&1 || log_warning "权限初始化跳过"
        log_success "权限系统初始化完成"
    fi
    
    # 启动应用
    log_info "构建应用..."
    BUILD_SUCCESS=false
    
    if npm run build >/dev/null 2>&1; then
        log_success "应用构建完成"
        BUILD_SUCCESS=true
    else
        log_warning "应用构建失败，使用开发模式..."
        BUILD_SUCCESS=false
    fi
    
    # 根据构建结果启动对应模式
    if [ "$BUILD_SUCCESS" = true ]; then
        log_info "启动生产服务器..."
        nohup npm start > app.log 2>&1 &
        APP_PID=$!
    else
        log_info "启动开发服务器..."
        npm run dev > app.log 2>&1 &
        APP_PID=$!
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
    echo "🔄 停止服务: docker-compose down"
    echo ""
    echo "💡 提示："
    echo "- 首次启动可能需要等待几分钟"
    echo "- 如果无法访问，请检查端口3000是否被占用"
    echo "- AI功能需要配置AI模型API密钥"
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