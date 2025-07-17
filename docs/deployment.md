# 🚀 Wuhr AI Ops 部署指南

## 概述

本文档详细介绍了 Wuhr AI Ops 的各种部署方式、数据管理和配置选项。

## 系统要求

### 最低要求
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **内存**: >= 2GB
- **存储**: >= 10GB

### 推荐配置
- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0
- **内存**: >= 4GB
- **存储**: >= 20GB

## 🚀 一键部署（推荐）

### 快速开始

```bash
# 1. 克隆项目
git clone <repository-url>
cd wuhr-ai-ops

# 2. 一键部署
./deploy.sh
```

### 部署选项

```bash
# 全新安装（清除所有数据）
./deploy.sh --fresh-install

# 备份现有数据后部署
./deploy.sh --backup-first

# 开发模式（仅启动数据库）
./deploy.sh --dev

# 生产模式（启动所有服务）
./deploy.sh --prod

# 从备份恢复数据
./deploy.sh --restore-backup
```

### 访问地址

部署完成后，可以通过以下地址访问：

- **应用程序**: http://localhost:3000
- **pgAdmin**: http://localhost:5050
- **Redis**: localhost:6379

**默认管理员账号**:
- 邮箱: admin@wuhr.ai
- 密码: Admin123!

## 📊 数据管理

### 数据备份

```bash
# 备份数据库
./scripts/backup-database.sh

# 查看备份文件
ls -la data/backups/
```

### 数据恢复

```bash
# 恢复最新备份
./scripts/restore-database.sh

# 恢复指定备份
./scripts/restore-database.sh wuhr_ai_ops_backup_20250130.sql.gz

# 查看可用备份
./scripts/restore-database.sh --help
```

### 自动初始化

新部署时，系统会自动检查并导入备份数据：
- 优先使用 `data/backups/latest_backup.sql.gz`
- 备选使用 `docker/init-scripts/init-data.sql`
- 无备份时创建空数据库

### 数据目录结构

```
data/
├── backups/                    # 数据库备份文件
│   ├── latest_backup.sql.gz   # 最新备份（软链接）
│   └── wuhr_ai_ops_backup_*.sql.gz
└── deployments/               # 部署相关文件
```

## 开发环境部署

### 1. 环境准备

```bash
# 检查Node.js版本
node --version
npm --version

# 克隆项目
git clone <repository-url>
cd wuhr-ai-ops

# 安装依赖
npm install
```

### 2. 环境变量配置

创建 `.env.local` 文件：

```env
# 基础配置
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_API_TIMEOUT=30000

# Gemini CLI配置
GEMINI_CLI_PATH=../gemini-cli/dist/cli
GEMINI_CLI_TIMEOUT=60000

# 提供商API密钥（可选，用于测试）
# OPENAI_API_KEY=your_openai_api_key
# DEEPSEEK_API_KEY=your_deepseek_api_key
# GOOGLE_API_KEY=your_google_api_key

# 外部服务配置
NEXT_PUBLIC_BLOG_URL=https://wuhrai.com
NEXT_PUBLIC_API_SERVICE_URL=https://ai.wuhrai.com
NEXT_PUBLIC_CHAT_SERVICE_URL=https://gpt.wuhrai.com

# 调试配置
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

### 3. 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 服务器将在 http://localhost:3000 启动
```

### 4. 开发工具配置

```bash
# 运行代码检查
npm run lint

# 运行类型检查
npm run type-check

# 运行测试
npm run test
```

## 测试环境部署

### 1. 构建测试版本

```bash
# 安装依赖
npm ci

# 构建项目
npm run build

# 启动生产服务器
npm start
```

### 2. 测试环境变量

创建 `.env.production` 文件：

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://test-wuhr-ai-ops.example.com

# 禁用调试
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_LOG_LEVEL=warn

# 测试环境API配置
NEXT_PUBLIC_API_BASE_URL=https://test-wuhr-ai-ops.example.com/api
```

## 生产环境部署

### 方案一：直接部署

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2 (生产进程管理器)
sudo npm install -g pm2
```

#### 2. 应用部署

```bash
# 创建应用目录
sudo mkdir -p /var/www/wuhr-ai-ops
sudo chown $USER:$USER /var/www/wuhr-ai-ops

# 部署代码
cd /var/www/wuhr-ai-ops
git clone <repository-url> .

# 安装依赖和构建
npm ci --only=production
npm run build

# 配置PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'wuhr-ai-ops',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/wuhr-ai-ops',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3. Nginx反向代理

```nginx
# /etc/nginx/sites-available/wuhr-ai-ops
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/wuhr-ai-ops /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 方案二：Docker部署

#### 1. Dockerfile

```dockerfile
# wuhr-ai-ops/Dockerfile
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产镜像
FROM node:20-alpine AS runner

WORKDIR /app

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 设置权限
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 启动应用
CMD ["node", "server.js"]
```

#### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  wuhr-ai-ops:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - wuhr-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - wuhr-ai-ops
    restart: unless-stopped
    networks:
      - wuhr-network

networks:
  wuhr-network:
    driver: bridge
```

#### 3. 部署命令

```bash
# 构建和启动
docker-compose up -d

# 查看日志
docker-compose logs -f wuhr-ai-ops

# 更新部署
docker-compose pull
docker-compose up -d --force-recreate
```

### 方案三：云平台部署

#### Vercel部署

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署到Vercel
vercel --prod
```

#### Railway部署

```bash
# 安装Railway CLI
npm install -g @railway/cli

# 登录和部署
railway login
railway init
railway up
```

## 环境配置详解

### 1. 生产环境变量

```env
# 基础配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
PORT=3000

# 安全配置
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_LOG_LEVEL=error

# API配置
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api
NEXT_PUBLIC_API_TIMEOUT=30000

# SSL配置
NEXT_PUBLIC_FORCE_HTTPS=true

# 性能配置
NEXT_PUBLIC_CACHE_MAX_AGE=3600
NEXT_PUBLIC_CDN_URL=https://cdn.your-domain.com

# 监控配置
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 2. Next.js配置优化

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 输出配置
  output: 'standalone',
  
  // 压缩配置
  compress: true,
  
  // 静态优化
  poweredByHeader: false,
  generateEtags: false,
  
  // 图片优化
  images: {
    domains: ['wuhrai-wordpress.oss-cn-hangzhou.aliyuncs.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

## 监控和维护

### 1. 日志配置

```bash
# PM2日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 2. 性能监控

```bash
# 安装监控工具
npm install -g pm2-monitoring

# 启用监控
pm2 monitor
```

### 3. 健康检查

```bash
# 创建健康检查脚本
cat > health-check.sh << EOF
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/version)
if [ $response -eq 200 ]; then
    echo "Health check passed"
    exit 0
else
    echo "Health check failed"
    exit 1
fi
EOF

chmod +x health-check.sh

# 添加到crontab
echo "*/5 * * * * /path/to/health-check.sh" | crontab -
```

### 4. 备份策略

```bash
# 创建备份脚本
cat > backup.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/wuhr-ai-ops"

mkdir -p $BACKUP_DIR

# 备份应用代码
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/wuhr-ai-ops

# 备份配置文件
cp /var/www/wuhr-ai-ops/.env.production $BACKUP_DIR/env_$DATE

# 清理旧备份（保留7天）
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# 添加定时备份
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## 安全配置

### 1. 防火墙配置

```bash
# UFW配置
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000
```

### 2. SSL证书

```bash
# Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. 安全头部

```nginx
# 安全配置
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## 故障排除

### 常见问题

1. **端口占用**
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

2. **内存不足**
```bash
free -h
pm2 reload all
```

3. **权限问题**
```bash
sudo chown -R $USER:$USER /var/www/wuhr-ai-ops
chmod -R 755 /var/www/wuhr-ai-ops
```

### 日志分析

```bash
# PM2日志
pm2 logs

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 系统日志
journalctl -u nginx
journalctl -f
```

## 更新部署

### 零停机更新

```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
npm ci --only=production

# 构建新版本
npm run build

# 优雅重启
pm2 reload all
```

---

**维护联系**:
- 邮箱: 1139804291@qq.com
- 网站: wuhrai.com

更新日期: 2025-06-29 