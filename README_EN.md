# Wuhr AI Ops - Intelligent Operations Platform

<div align="center">

**🚀 AI-Powered Intelligent Operations Management Platform**

[![GitHub stars](https://img.shields.io/github/stars/st-lzh/Wuhr-AI-ops?style=social)](https://github.com/st-lzh/Wuhr-AI-ops/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/st-lzh/Wuhr-AI-ops?style=social)](https://github.com/st-lzh/Wuhr-AI-ops/network/members)
[![GitHub issues](https://img.shields.io/github/issues/st-lzh/Wuhr-AI-ops)](https://github.com/st-lzh/Wuhr-AI-ops/issues)
[![GitHub license](https://img.shields.io/github/license/st-lzh/Wuhr-AI-ops)](https://github.com/st-lzh/Wuhr-AI-ops/blob/main/LICENSE)

English | [简体中文](./README.md)

</div>

## 📋 Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Deployment Guide](#deployment-guide)
- [User Guide](#user-guide)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## 🎯 Introduction

**Wuhr AI Ops** is a modern AI-driven intelligent operations management platform that integrates multimodal AI assistants, real-time monitoring, log analysis, CI/CD management, and user permission management. The platform simplifies complex operational tasks through artificial intelligence technology, providing a one-stop solution for operations teams.

### 🌟 Key Highlights

- 🤖 **Intelligent AI Assistant** - Integrates multimodal AI models like GPT-4o and Gemini, supporting natural language operations
- 🔧 **Multi-mode Command Execution** - Intelligent switching between K8s cluster and Linux system commands
- 📊 **Real-time Monitoring** - Integrated ELK log analysis and Grafana performance monitoring
- 🚀 **CI/CD Management** - Automated deployment pipelines and Jenkins integration
- 👥 **Permission Management** - Role-based access control and approval workflows
- 🌐 **Multi-environment Support** - Unified management of local and remote hosts

## ✨ Features

### 🤖 AI Assistant

- **Multimodal Interaction** - Support for text, image, and other input types
- **Command Mode Switching** - One-click switching between K8s cluster and Linux system command environments
- **Intelligent Command Suggestions** - AI automatically analyzes and suggests optimal operations
- **Context Understanding** - Support for continuous conversation and context correlation
- **Auto Execution** - Optional automatic command execution

### 📊 Monitoring & Analysis

- **ELK Log Analysis** - Real-time log search and analysis based on Elasticsearch
- **Grafana Monitoring** - Real-time monitoring of system performance and application metrics
- **Custom Dashboards** - Configurable monitoring panels and alert rules
- **Log Aggregation** - Unified collection and analysis of multi-host logs

### 🚀 CI/CD Management

- **Pipeline Management** - Visual deployment pipeline configuration
- **Jenkins Integration** - Complete Jenkins task management and execution
- **Containerized Deployment** - Docker and Kubernetes deployment support
- **Approval Workflows** - Pre-deployment approval and permission control

### 🔐 User Permission Management

- **Role Permissions** - Fine-grained access control for functional modules
- **User Approval** - New user registration approval mechanism
- **Operation Audit** - Complete user operation log recording
- **Notification System** - Real-time message push and workflow notifications

### 🛠️ System Management

- **Multi-host Management** - Unified management of local and remote servers
- **Configuration Management** - AI model configuration and API key management
- **Data Backup** - Automated data backup and recovery
- **Health Check** - System component health status monitoring

## 🚀 Quick Start

### System Requirements

- **OS**: Linux/macOS/Windows
- **Node.js**: >= 18.0.0 (Recommended 20.0+)
- **npm**: >= 8.0.0 (Recommended 10.0+)
- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0
- **Memory**: >= 4GB
- **Storage**: >= 20GB available space

### One-click Start

```bash
# Clone the project
git clone https://github.com/st-lzh/Wuhr-AI-ops.git
cd Wuhr-AI-ops

# One-click start (auto detect environment, install dependencies, start services)
./install.sh
```

> **🔧 Smart Environment Detection**: The script automatically detects system environment and asks if you want to auto-install missing components like Docker, Node.js, etc.

### Manual Deployment

```bash
# Configure environment variables
cp .env.example .env
# Edit .env file to configure database and AI API keys

# Install dependencies
npm install

# Start Docker services
docker-compose up -d

# Database migration
npx prisma migrate deploy
npx prisma generate

# Start application
npm run build
npm start
```

### Access URLs

- **Main Application**: http://localhost:3000

### Default Account

- **Username**: admin
- **Email**: admin@wuhr.ai
- **Password**: Admin123!

## 📦 Deployment Guide

### Docker Deployment (Recommended)

1. **Environment Setup**
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone project
git clone https://github.com/st-lzh/Wuhr-AI-ops.git
cd Wuhr-AI-ops
```

2. **Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit configuration file
vim .env
```

3. **Start Services**
```bash
# Start all services in background
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f app
```

### Manual Deployment

1. **Install Dependencies**
```bash
# Install Node.js dependencies
npm install

# Install and configure PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install and configure Redis
sudo apt-get install redis-server
```

2. **Configure Database**
```bash
# Create database
sudo -u postgres createdb wuhr_ai_ops

# Run database migrations
npx prisma migrate deploy

# Initialize data
npm run db:seed
```

3. **Start Application**
```bash
# Build application
npm run build

# Start production server
npm start
```

## 📖 User Guide

### AI Assistant Usage

1. **Access AI Assistant Page** - Navigate to "AI Assistant" module
2. **Select Model** - Configure AI model and API keys in settings
3. **Mode Switching** - Use K8s button or shortcut (Ctrl+K) to switch command environment
4. **Send Commands** - Input natural language operation commands
5. **View Results** - AI assistant will automatically execute commands and return results

### Host Management

1. **Add Host** - Add remote servers in host management page
2. **Configure Connection** - Set SSH connection information and authentication
3. **Test Connection** - Verify host connection status
4. **Monitor Configuration** - Configure ELK and Grafana monitoring

### User Permission Management

1. **User Registration** - New user registration requires admin approval
2. **Role Assignment** - Assign appropriate permission roles to users
3. **Permission Control** - Role-based functional module access control
4. **Audit Logs** - View user operation history

### Keyboard Shortcuts

- `Ctrl + K` - Switch K8s/Linux command mode
- `Ctrl + L` - Force switch to Linux mode
- `Enter` - Send message
- `Shift + Enter` - New line

## 📚 API Documentation

### Authentication API

```typescript
// User login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

// Get user info
GET /api/auth/profile
Authorization: Bearer <token>
```

### AI Assistant API

```typescript
// Send AI command
POST /api/system/chat
{
  "message": "Check system status",
  "model": "gpt-4o",
  "isK8sMode": false,
  "autoExecution": true
}
```

### Host Management API

```typescript
// Get host list
GET /api/servers

// Add host
POST /api/servers
{
  "name": "Server Name",
  "ip": "192.168.1.100",
  "port": 22,
  "username": "root"
}
```

For more API documentation, see: [API Documentation](./docs/API.md)

## 🤝 Contributing

We welcome all forms of contributions!

### Development Environment Setup

```bash
# Fork the project to your GitHub account
# Clone your fork
git clone https://github.com/YOUR-USERNAME/Wuhr-AI-ops.git
cd Wuhr-AI-ops

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

### Commit Guidelines

- Use meaningful commit messages
- Follow [Conventional Commits](https://www.conventionalcommits.org/) specification
- Run `npm run lint` before committing to check code standards

### Pull Request Process

1. Fork the project and create a feature branch
2. Develop and write tests
3. Ensure all tests pass
4. Submit Pull Request with description of changes
5. Wait for code review and merge

## 📝 Changelog

### v1.0.0 (2025-01-30)

- 🎉 Initial release
- 🤖 AI assistant core functionality
- 📊 ELK log analysis integration
- 🚀 CI/CD management module
- 👥 User permission management system
- 🔧 Multi-host management functionality

View full changelog: [CHANGELOG.md](./CHANGELOG.md)

## ❓ FAQ

### Q: How to add a new AI model?
A: Click "Add Model" in the model management page, select provider type and configure API information.

### Q: Why does the AI assistant command execution fail?
A: Please check host connection status, user permissions, and whether the command mode is correct.

### Q: How to configure remote host monitoring?
A: After adding a server in the host management page, configure the corresponding ELK and Grafana connection information.

For more questions, see: [FAQ](./docs/FAQ.md)

## 🔒 Security Notes

- Regularly update system components and dependencies
- Use strong passwords and two-factor authentication
- Regularly backup important data
- Limit network access and port exposure
- Review user permissions and operation logs

## 📄 License

This project is licensed under the [MIT License (Modified)](./LICENSE).

### 🏢 Commercial Use

- **Personal learning and non-commercial use**: Completely free
- **Commercial use**: Please contact the author for authorization (1139804291@qq.com)
- **Secondary development and redistribution**: Please contact the author for authorization (1139804291@qq.com)
- **Educational institutions**: Free for teaching and academic research

### 📝 Attribution Requirement

When using this software, please retain the following attribution:
```
Powered by Wuhr AI Ops - https://github.com/st-lzh/Wuhr-AI-ops
```

## 🙏 Acknowledgments

Thanks to the following open source projects:

- [Next.js](https://nextjs.org/) - React framework
- [Ant Design](https://ant.design/) - UI component library
- [Prisma](https://www.prisma.io/) - Database ORM
- [Docker](https://www.docker.com/) - Containerization platform
- [ELK Stack](https://www.elastic.co/) - Log analysis suite

## 📞 Contact

- **Developer**: st-lzh
- **Email**: 1139804291@qq.com
- **Blog**: [wuhrai.com](https://wuhrai.com)
- **AI API**: [ai.wuhrai.com](https://ai.wuhrai.com)
- **Chat Service**: [gpt.wuhrai.com](https://gpt.wuhrai.com)

### Technical Support

- **GitHub Issues**: [Submit Issues](https://github.com/st-lzh/Wuhr-AI-ops/issues)
- **Discussions**: [GitHub Discussions](https://github.com/st-lzh/Wuhr-AI-ops/discussions)
- **Documentation**: [Project Docs](./docs/)

---

<div align="center">

**⭐ If this project helps you, please give us a star!**

Made with ❤️ by [st-lzh](https://github.com/st-lzh)

</div> 