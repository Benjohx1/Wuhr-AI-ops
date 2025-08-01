#!/bin/bash

# Wuhr AI Ops Platform Docker 启动脚本
# Docker startup script for Wuhr AI Ops Platform

set -e

echo "🚀 启动 Wuhr AI Ops Platform Docker 服务..."
echo "🚀 Starting Wuhr AI Ops Platform Docker services..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
echo "📁 Creating necessary directories..."
mkdir -p data/backups
mkdir -p deployments/projects
mkdir -p logs

# 检查环境变量文件
if [ ! -f .env.docker ]; then
    echo "⚠️  .env.docker 文件不存在，将使用默认配置"
    echo "⚠️  .env.docker file not found, using default configuration"
fi

# 停止现有服务（如果运行中）
echo "🛑 停止现有服务..."
echo "🛑 Stopping existing services..."
docker-compose down --remove-orphans || true

# 构建并启动服务
echo "🔨 构建应用镜像..."
echo "🔨 Building application image..."
docker-compose build app

echo "🚀 启动所有服务..."
echo "🚀 Starting all services..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
echo "⏳ Waiting for services to start..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
echo "🔍 Checking service status..."
docker-compose ps

# 等待数据库就绪
echo "⏳ 等待数据库就绪..."
echo "⏳ Waiting for database to be ready..."
timeout=60
counter=0
while ! docker-compose exec -T postgres pg_isready -U wuhr_admin -d wuhr_ai_ops > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "❌ 数据库启动超时"
        echo "❌ Database startup timeout"
        exit 1
    fi
    echo "⏳ 等待数据库启动... ($counter/$timeout)"
    echo "⏳ Waiting for database... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

# 导入数据库SQL文件
echo "📥 导入数据库SQL文件..."
echo "📥 Importing database SQL file..."
if [ -f "prisma/sql/wuhr_ai_ops.sql" ]; then
    echo "🔄 正在导入 prisma/sql/wuhr_ai_ops.sql..."
    echo "🔄 Importing prisma/sql/wuhr_ai_ops.sql..."

    # 首先清空数据库（如果有数据）
    echo "🧹 清空现有数据库结构..."
    echo "🧹 Cleaning existing database structure..."
    docker-compose exec -T postgres psql -U wuhr_admin -d wuhr_ai_ops -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;" || true

    # 导入SQL文件
    echo "📤 导入完整数据库结构和数据..."
    echo "📤 Importing complete database structure and data..."
    if docker-compose exec -T postgres psql -U wuhr_admin -d wuhr_ai_ops < prisma/sql/wuhr_ai_ops.sql > /dev/null 2>&1; then
        echo "✅ 数据库SQL文件导入成功"
        echo "✅ Database SQL file imported successfully"
    else
        echo "❌ 数据库SQL文件导入失败"
        echo "❌ Database SQL file import failed"
        echo "📋 查看详细错误信息："
        echo "📋 Check detailed error information:"
        docker-compose exec -T postgres psql -U wuhr_admin -d wuhr_ai_ops < prisma/sql/wuhr_ai_ops.sql
        exit 1
    fi
else
    echo "❌ 未找到 prisma/sql/wuhr_ai_ops.sql 文件"
    echo "❌ prisma/sql/wuhr_ai_ops.sql file not found"
    echo "请确保该文件存在后重新运行脚本"
    echo "Please ensure the file exists and rerun the script"
    exit 1
fi

# 生成 Prisma 客户端
echo "🔧 生成 Prisma 客户端..."
echo "🔧 Generating Prisma client..."
docker-compose exec app npx prisma generate || echo "⚠️ Prisma 客户端可能已经生成过了"

# 检查应用健康状态
echo "🏥 检查应用健康状态..."
echo "🏥 Checking application health..."
timeout=60
counter=0
while ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "❌ 应用健康检查超时"
        echo "❌ Application health check timeout"
        echo "📋 查看应用日志："
        echo "📋 Check application logs:"
        docker-compose logs app
        exit 1
    fi
    echo "⏳ 等待应用就绪... ($counter/$timeout)"
    echo "⏳ Waiting for application... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

echo ""
echo "✅ Wuhr AI Ops Platform 启动成功！"
echo "✅ Wuhr AI Ops Platform started successfully!"
echo ""
echo "🌐 访问地址 / Access URLs:"
echo "   - 主应用 / Main App: http://localhost:3000"
echo "   - pgAdmin: http://localhost:5050"
echo "     用户名 / Username: admin@wuhrai.com"
echo "     密码 / Password: admin_password_2024"
echo ""
echo "📊 服务状态 / Service Status:"
docker-compose ps
echo ""
echo "📝 查看日志 / View Logs:"
echo "   docker-compose logs -f app"
echo ""
echo "🛑 停止服务 / Stop Services:"
echo "   docker-compose down"
echo ""
echo "🔄 重启服务 / Restart Services:"
echo "   docker-compose restart"
