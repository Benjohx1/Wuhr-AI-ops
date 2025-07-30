#!/bin/bash

# Wuhr AI Ops Global Installation Script
# Author: st-lzh
# Email: 1139804291@qq.com
# For international network environments

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global variables
PROJECT_DIR=$(pwd)
KUBELET_WUHRAI_PATH="$PROJECT_DIR/kubelet-wuhrai"
LOG_FILE="$PROJECT_DIR/install.log"

# Official source configuration
NPM_REGISTRY="https://registry.npmjs.org"
NODE_SOURCE="https://deb.nodesource.com"
KUBELET_DOWNLOAD_URLS=(
    "https://github.com/st-lzh/kubelet-wuhrai/releases/latest/download/kubelet-wuhrai"
)

# Logging functions
log_with_time() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1" | tee -a "$LOG_FILE"
}

# Display banner
show_banner() {
    echo -e "${CYAN}"
    echo "██╗    ██╗██╗   ██╗██╗  ██╗██████╗      █████╗ ██╗"
    echo "██║    ██║██║   ██║██║  ██║██╔══██╗    ██╔══██╗██║"
    echo "██║ █╗ ██║██║   ██║███████║██████╔╝    ███████║██║"
    echo "██║███╗██║██║   ██║██╔══██║██╔══██╗    ██╔══██║██║"
    echo "╚███╔███╔╝╚██████╔╝██║  ██║██║  ██║    ██║  ██║██║"
    echo " ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝"
    echo -e "${NC}"
    echo -e "${GREEN}Wuhr AI Ops - Intelligent DevOps Platform${NC}"
    echo -e "${BLUE}Global Installation Script v2.0${NC}"
    echo "=================================="
    echo ""
}

# Check system requirements
check_system_requirements() {
    log_step "Checking system requirements"
    
    # Check operating system
    if [[ "$OSTYPE" != "linux-gnu"* ]] && [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "This script only supports Linux and macOS systems"
        exit 1
    fi
    
    # Check memory (Linux only)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        local memory_gb=$(free -g | awk '/^Mem:/{print $2}')
        if [ "$memory_gb" -lt 4 ]; then
            log_warning "System memory is less than 4GB, performance may be affected"
        fi
        
        # Check disk space
        local disk_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
        if [ "$disk_space" -lt 10 ]; then
            log_error "Insufficient disk space, at least 10GB required"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS memory check
        local memory_gb=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
        if [ "$memory_gb" -lt 4 ]; then
            log_warning "System memory is less than 4GB, performance may be affected"
        fi
    fi
    
    log_success "System requirements check passed"
}

# Check network connectivity
check_network() {
    log_step "Checking network connectivity"
    
    # Test international network
    if ping -c 2 -W 3 www.google.com > /dev/null 2>&1; then
        log_success "Network connection is normal"
    elif ping -c 2 -W 3 www.github.com > /dev/null 2>&1; then
        log_success "Network connection is normal"
    else
        log_error "Network connection failed, please check network settings"
        exit 1
    fi
    
    # Test DNS resolution
    if nslookup registry.npmjs.org > /dev/null 2>&1; then
        log_success "DNS resolution is normal"
    else
        log_warning "DNS resolution may have issues, consider using public DNS"
    fi
}

# Install system dependencies
install_system_dependencies() {
    log_step "Installing system dependencies"
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux package installation
        log_info "Updating package lists..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update -y
            sudo apt-get install -y curl wget gnupg lsb-release ca-certificates software-properties-common apt-transport-https
        elif command -v yum &> /dev/null; then
            sudo yum update -y
            sudo yum install -y curl wget gnupg2 ca-certificates
        elif command -v dnf &> /dev/null; then
            sudo dnf update -y
            sudo dnf install -y curl wget gnupg2 ca-certificates
        else
            log_error "Unsupported Linux distribution"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - check if Homebrew is installed
        if ! command -v brew &> /dev/null; then
            log_info "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        log_info "Updating Homebrew..."
        brew update
    fi
    
    log_success "System dependencies installation completed"
}

# Install Docker
install_docker() {
    log_step "Installing Docker"
    
    if command -v docker &> /dev/null; then
        log_info "Docker is already installed, skipping installation"
        return 0
    fi
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux Docker installation
        if command -v apt-get &> /dev/null; then
            # Remove old versions
            sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
            
            # Install using official Docker repository
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            
        elif command -v yum &> /dev/null; then
            # CentOS/RHEL
            sudo yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true
            
            sudo yum install -y yum-utils
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            
        elif command -v dnf &> /dev/null; then
            # Fedora
            sudo dnf remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true
            
            sudo dnf install -y dnf-plugins-core
            sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
            sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        fi
        
        # Start Docker service
        sudo systemctl start docker
        sudo systemctl enable docker
        
        # Add user to docker group
        sudo usermod -aG docker $USER
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS Docker installation
        log_info "Installing Docker Desktop for macOS..."
        brew install --cask docker
        log_warning "Please start Docker Desktop application manually"
    fi
    
    log_success "Docker installation completed"
}

# Install Docker Compose
install_docker_compose() {
    log_step "Installing Docker Compose"
    
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose is already installed, skipping installation"
        return 0
    fi
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Download from official GitHub
        local compose_version="v2.24.0"
        sudo curl -L "https://github.com/docker/compose/releases/download/${compose_version}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        # Create symbolic link
        sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - Docker Compose comes with Docker Desktop
        log_info "Docker Compose is included with Docker Desktop"
    fi
    
    log_success "Docker Compose installation completed"
}

# Install Node.js
install_nodejs() {
    log_step "Installing Node.js"
    
    if command -v node &> /dev/null; then
        local node_version=$(node -v | sed 's/v//')
        local node_major=$(echo $node_version | cut -d. -f1)
        if [ "$node_major" -ge 18 ]; then
            log_info "Node.js version meets requirements ($node_version), skipping installation"
            return 0
        fi
    fi
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux Node.js installation using NodeSource
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
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS Node.js installation
        log_info "Installing Node.js using Homebrew..."
        brew install node@20
        brew link --force node@20
    fi
    
    log_success "Node.js installation completed"
}

# Configure npm official registry
configure_npm_registry() {
    log_step "Configuring npm official registry"
    
    npm config set registry $NPM_REGISTRY
    npm config set audit-level moderate
    npm config set fund false
    npm config set update-notifier false
    
    log_success "npm official registry configuration completed"
    log_info "Current npm registry: $(npm config get registry)"
}

# Download kubelet-wuhrai
download_kubelet_wuhrai() {
    log_step "Downloading kubelet-wuhrai tool"
    
    if [ -f "$KUBELET_WUHRAI_PATH" ]; then
        log_info "kubelet-wuhrai already exists, skipping download"
        chmod +x "$KUBELET_WUHRAI_PATH"
        return 0
    fi
    
    for url in "${KUBELET_DOWNLOAD_URLS[@]}"; do
        log_info "Attempting to download from $url"
        if curl -L --connect-timeout 30 --retry 3 -o "$KUBELET_WUHRAI_PATH" "$url"; then
            chmod +x "$KUBELET_WUHRAI_PATH"
            log_success "kubelet-wuhrai download completed"
            return 0
        else
            log_warning "Download from $url failed, trying next source..."
        fi
    done
    
    log_warning "All download sources failed, kubelet-wuhrai may need to be downloaded manually"
    return 1
}

# Check port availability
check_port_availability() {
    log_step "Checking port availability"
    
    local ports=(3000 5432 6379 5050)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -tlnp 2>/dev/null | grep -q ":$port " || lsof -i :$port &>/dev/null; then
            occupied_ports+=($port)
        fi
    done
    
    if [ ${#occupied_ports[@]} -gt 0 ]; then
        log_warning "The following ports are occupied: ${occupied_ports[*]}"
        log_info "Will attempt to stop related services or use alternative ports"
    else
        log_success "All required ports are available"
    fi
}

# Initialize project configuration
initialize_project_config() {
    log_step "Initializing project configuration"
    
    # Check required files
    local required_files=("package.json" "docker-compose.yml")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Missing required file: $file"
            exit 1
        fi
    done
    
    # Create .env file
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success "Created .env configuration file"
        else
            log_error "Missing .env.example template file"
            exit 1
        fi
    fi
    
    log_success "Project configuration initialization completed"
}

# Install project dependencies
install_project_dependencies() {
    log_step "Installing project dependencies"
    
    log_info "Cleaning npm cache..."
    npm cache clean --force
    
    log_info "Installing dependency packages..."
    if npm install --verbose; then
        log_success "Project dependencies installation completed"
    else
        log_error "Project dependencies installation failed"
        exit 1
    fi
}

# Start Docker services
start_docker_services() {
    log_step "Starting Docker services"
    
    # Ensure Docker service is running
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if ! systemctl is-active --quiet docker; then
            sudo systemctl start docker
        fi
    fi
    
    # Stop existing containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Start services
    if docker-compose up -d; then
        log_success "Docker services started successfully"
    else
        log_error "Docker services startup failed"
        exit 1
    fi
    
    # Wait for services to be ready
    log_info "Waiting for database service to start..."
    sleep 10
    
    # Check database connection
    local retry_count=0
    while [ $retry_count -lt 30 ]; do
        if docker-compose exec -T postgres pg_isready -U wuhr_admin -h localhost >/dev/null 2>&1; then
            log_success "Database service is ready"
            break
        fi
        echo -n "."
        sleep 2
        retry_count=$((retry_count + 1))
    done
    
    if [ $retry_count -eq 30 ]; then
        log_warning "Database startup timeout, continuing execution..."
    fi
}

# Initialize database
initialize_database() {
    log_step "Initializing database"
    
    log_info "Resetting and synchronizing database schema..."
    if npx prisma db push --force-reset; then
        log_success "Database schema synchronization completed"
    else
        log_error "Database schema synchronization failed"
        exit 1
    fi
    
    log_info "Generating Prisma client..."
    if npx prisma generate; then
        log_success "Prisma client generation completed"
    else
        log_error "Prisma client generation failed"
        exit 1
    fi
}

# Create admin user
create_admin_user() {
    log_step "Creating admin user"
    
    if [ -f "scripts/create-admin.js" ]; then
        if node scripts/create-admin.js; then
            log_success "Admin user creation completed"
        else
            log_warning "Admin user creation failed, may already exist"
        fi
    else
        log_warning "Admin creation script not found"
    fi
}

# Initialize permission system
initialize_permissions() {
    log_step "Initializing permission system"
    
    if [ -f "scripts/init-permissions.js" ]; then
        if node scripts/init-permissions.js >/dev/null 2>&1; then
            log_success "Permission system initialization completed"
        else
            log_warning "Permission system initialization failed, skipping this step"
        fi
    else
        log_warning "Permission initialization script not found"
    fi
}

# Initialize preset models
initialize_preset_models() {
    log_step "Initializing preset models"
    
    if [ -f "init-all-preset-models.js" ]; then
        if node init-all-preset-models.js >/dev/null 2>&1; then
            log_success "Preset models initialization completed"
        else
            log_warning "Preset models initialization failed, skipping this step"
        fi
    else
        log_warning "Preset models initialization script not found"
    fi
}

# Build and start application
build_and_start_application() {
    log_step "Building and starting application"
    
    log_info "Building application..."
    if npm run build; then
        log_success "Application build completed"
        
        log_info "Starting production server..."
        nohup npm start > app.log 2>&1 &
        local app_pid=$!
        echo $app_pid > app.pid
        
    else
        log_warning "Application build failed, starting development mode..."
        nohup npm run dev > app.log 2>&1 &
        local app_pid=$!
        echo $app_pid > app.pid
    fi
    
    # Wait for application to start
    log_info "Waiting for application to start..."
    sleep 15
    
    local retry_count=0
    while [ $retry_count -lt 20 ]; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            log_success "Application started successfully"
            return 0
        fi
        echo -n "."
        sleep 3
        retry_count=$((retry_count + 1))
    done
    
    log_warning "Application startup timeout, please check log files"
}

# Get access information
get_access_info() {
    # Get local IP
    local local_ip
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        local_ip=$(hostname -I | awk '{for(i=1;i<=NF;i++) if($i ~ /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) {print $i; exit}}')
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        local_ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
    
    # Get public IP
    local public_ip=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' || echo "Unable to retrieve")
    
    echo "$local_ip|$public_ip"
}

# Display completion information
show_completion_info() {
    local access_info=$(get_access_info)
    local local_ip=$(echo $access_info | cut -d'|' -f1)
    local public_ip=$(echo $access_info | cut -d'|' -f2)
    
    echo ""
    echo -e "${GREEN}🎉 Wuhr AI Ops Installation Completed!${NC}"
    echo "=================================="
    echo ""
    echo -e "${CYAN}🌐 Access URLs:${NC}"
    if [ -n "$local_ip" ] && [ "$local_ip" != "" ]; then
        echo "   Local Access: http://$local_ip:3000"
    fi
    if [ "$public_ip" != "Unable to retrieve" ] && [ -n "$public_ip" ]; then
        echo "   Public Access: http://$public_ip:3000"
    else
        echo "   Public Access: http://[your-public-ip]:3000"
    fi
    echo ""
    echo -e "${CYAN}👤 Default Admin Account:${NC}"
    echo "   Username: admin"
    echo "   Email: admin@wuhr.ai"
    echo "   Password: Admin123!"
    echo ""
    echo -e "${CYAN}🔧 Management Tools:${NC}"
    echo "   Database Admin: http://$local_ip:5050"
    echo "   Account: admin@wuhrai.com"
    echo "   Password: admin_password_2024"
    echo ""
    echo -e "${CYAN}📝 Important Files:${NC}"
    echo "   Application Log: tail -f app.log"
    echo "   Installation Log: tail -f install.log"
    echo "   Process ID: cat app.pid"
    echo ""
    echo -e "${CYAN}🛠️ Management Commands:${NC}"
    echo "   Stop Services: docker-compose down"
    echo "   Restart Services: docker-compose restart"
    echo "   Check Status: docker-compose ps"
    echo ""
    echo -e "${YELLOW}💡 Tips:${NC}"
    echo "   - First access may take 1-2 minutes to load"
    echo "   - If unable to access, check firewall settings: ufw allow 3000"
    echo "   - AI features require proper API key configuration"
    echo "   - Regular backup of database and config files is recommended"
    echo ""
    echo -e "${CYAN}📞 Technical Support:${NC}"
    echo "   Email: 1139804291@qq.com"
    echo "   Documentation: README.md"
    echo ""
}

# Cleanup function
cleanup_on_error() {
    log_error "An error occurred during installation, cleaning up..."
    docker-compose down --remove-orphans 2>/dev/null || true
    if [ -f app.pid ]; then
        local pid=$(cat app.pid)
        kill $pid 2>/dev/null || true
        rm -f app.pid
    fi
}

# Main installation process
main() {
    # Set error handling
    trap cleanup_on_error ERR
    
    # Display banner
    show_banner
    
    # Start installation
    log_with_time "Starting Wuhr AI Ops installation"
    
    # Check system requirements
    check_system_requirements
    
    # Check network connectivity
    check_network
    
    # Install system dependencies
    install_system_dependencies
    
    # Install Docker
    install_docker
    
    # Install Docker Compose
    install_docker_compose
    
    # Install Node.js
    install_nodejs
    
    # Configure npm registry
    configure_npm_registry
    
    # Download kubelet-wuhrai
    download_kubelet_wuhrai
    
    # Check port availability
    check_port_availability
    
    # Initialize project configuration
    initialize_project_config
    
    # Install project dependencies
    install_project_dependencies
    
    # Start Docker services
    start_docker_services
    
    # Initialize database
    initialize_database
    
    # Create admin user
    create_admin_user
    
    # Initialize permission system
    initialize_permissions
    
    # Initialize preset models
    initialize_preset_models
    
    # Build and start application
    build_and_start_application
    
    # Display completion information
    show_completion_info
    
    log_with_time "Installation completed"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_warning "Detected root privileges, it's recommended to run this script as a regular user"
    read -p "Do you want to continue? [y/N]: " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run main function
main "$@"
