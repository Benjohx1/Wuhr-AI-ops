#!/bin/bash

# Wuhr AI Ops International One-Click Deployment Script
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

# Configuration
REPO_URL="https://github.com/st-lzh/wuhr-ai-ops.git"
PROJECT_NAME="wuhr-ai-ops"
INSTALL_SCRIPT="install-en.sh"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Show banner
show_banner() {
    echo -e "${CYAN}"
    echo "██╗    ██╗██╗   ██╗██╗  ██╗██████╗      █████╗ ██╗"
    echo "██║    ██║██║   ██║██║  ██║██╔══██╗    ██╔══██╗██║"
    echo "██║ █╗ ██║██║   ██║███████║██████╔╝    ███████║██║"
    echo "██║███╗██║██║   ██║██╔══██║██╔══██╗    ██╔══██║██║"
    echo "╚███╔███╔╝╚██████╔╝██║  ██║██║  ██║    ██║  ██║██║"
    echo " ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝"
    echo -e "${NC}"
    echo -e "${GREEN}Wuhr AI Ops - Intelligent Operations Platform${NC}"
    echo -e "${BLUE}International One-Click Deployment Script v2.0${NC}"
    echo "=================================="
    echo ""
}

# Check if Git is installed
check_git() {
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed. Please install Git first."
        echo "Install command: sudo apt-get install git (Ubuntu/Debian) or sudo yum install git (CentOS/RHEL)"
        exit 1
    fi
}

# Check network connectivity
check_network() {
    log_step "Checking network connectivity"
    
    if ! ping -c 1 github.com &> /dev/null; then
        log_error "Cannot connect to GitHub. Please check your network connection."
        exit 1
    fi
    
    log_success "Network connectivity is normal"
}

# Clone code repository
clone_repository() {
    log_step "Cloning code repository"
    
    # Check if project directory already exists
    if [ -d "$PROJECT_NAME" ]; then
        log_warning "Project directory already exists. Delete and re-clone? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            log_info "Deleting existing project directory..."
            rm -rf "$PROJECT_NAME"
        else
            log_info "Using existing project directory"
            cd "$PROJECT_NAME"
            return
        fi
    fi
    
    log_info "Cloning code repository..."
    if git clone "$REPO_URL" "$PROJECT_NAME"; then
        log_success "Code repository cloned successfully"
    else
        log_error "Failed to clone code repository"
        exit 1
    fi
    
    cd "$PROJECT_NAME"
}

# Execute installation script
run_install_script() {
    log_step "Executing installation script"
    
    if [ ! -f "$INSTALL_SCRIPT" ]; then
        log_error "Installation script $INSTALL_SCRIPT does not exist"
        exit 1
    fi
    
    log_info "Starting installation script..."
    chmod +x "$INSTALL_SCRIPT"
    ./"$INSTALL_SCRIPT"
}

# Show completion information
show_completion() {
    echo ""
    echo -e "${GREEN}=================================="
    echo "🎉 Deployment completed!"
    echo "=================================="
    echo ""
    echo "📱 Access URLs:"
    echo "   Local access: http://localhost:3000"
    echo "   Network access: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "🔑 Default admin account:"
    echo "   Username: admin"
    echo "   Email: admin@wuhr.ai"
    echo "   Password: Admin123!"
    echo ""
    echo "📚 For more information, see:"
    echo "   README.md - User Guide"
    echo "   INSTALL.md - Installation Documentation"
    echo ""
    echo "🛠️  Service management:"
    echo "   ./restart.sh - Start/Restart service"
    echo "   ./restart.sh stop - Stop service"
    echo "   ./restart.sh status - View status"
    echo -e "${NC}"
}

# Main function
main() {
    show_banner
    
    log_info "Starting one-click deployment of Wuhr AI Ops..."
    
    # Check system requirements
    check_git
    check_network
    
    # Clone code
    clone_repository
    
    # Execute installation
    run_install_script
    
    # Show completion information
    show_completion
}

# Execute main function
main "$@" 