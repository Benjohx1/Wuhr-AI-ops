#!/bin/bash

# 清理Next.js构建缓存脚本

echo "🧹 清理Next.js构建缓存..."

# 删除构建目录
echo "删除 .next 目录..."
rm -rf .next

# 删除node_modules（如果需要）
if [ "$1" = "--full" ]; then
    echo "删除 node_modules 目录..."
    rm -rf node_modules
    echo "重新安装依赖..."
    npm install
fi

# 清理npm缓存
echo "清理npm缓存..."
npm cache clean --force

# 重新构建
echo "重新构建项目..."
npm run build

echo "✅ 构建缓存清理完成！" 