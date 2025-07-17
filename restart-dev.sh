#!/bin/bash

echo "🔄 重启 Wuhr AI Ops 开发服务器..."

# 使用绝对路径进入项目目录
PROJECT_DIR="/root/wuhr-ai-ops"
cd "$PROJECT_DIR" || {
    echo "❌ 无法进入项目目录: $PROJECT_DIR"
    exit 1
}

echo "📍 当前目录: $(pwd)"

# 检查并杀死占用3000端口的进程
echo "📍 检查3000端口..."
PIDS=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PIDS" ]; then
    echo "⚠️  发现占用3000端口的进程: $PIDS"
    echo "🔪 正在杀死进程..."
    kill -9 $PIDS 2>/dev/null
    sleep 2
    echo "✅ 进程已清理"
else
    echo "✅ 3000端口空闲"
fi

# 确认端口已释放
sleep 1
REMAINING=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$REMAINING" ]; then
    echo "❌ 端口仍被占用，强制清理..."
    kill -9 $REMAINING 2>/dev/null
    sleep 2
fi

# 启动开发服务器
echo "🚀 启动开发服务器..."
npm run dev

echo "🎉 服务器启动完成！访问 http://localhost:3000" 