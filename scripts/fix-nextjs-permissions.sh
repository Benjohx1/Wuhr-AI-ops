#!/bin/bash

# 修复Next.js权限问题脚本

set -e

echo "🔧 修复Next.js权限问题..."

# 用户密码
USER_PASSWORD="luozhihong"

# 1. 停止可能运行的开发服务器
echo "📋 步骤1: 停止开发服务器..."
pkill -f "next dev" || echo "没有运行的Next.js进程"

# 2. 删除.next目录
echo "📋 步骤2: 清理.next目录..."
if [ -d ".next" ]; then
    echo "$USER_PASSWORD" | sudo -S rm -rf .next
    echo "✅ .next目录已删除"
else
    echo "⚠️ .next目录不存在"
fi

# 3. 删除node_modules/.cache
echo "📋 步骤3: 清理缓存目录..."
if [ -d "node_modules/.cache" ]; then
    echo "$USER_PASSWORD" | sudo -S rm -rf node_modules/.cache
    echo "✅ 缓存目录已清理"
fi

# 4. 修复项目目录权限
echo "📋 步骤4: 修复项目权限..."
echo "$USER_PASSWORD" | sudo -S chown -R $(whoami):staff .
chmod -R 755 .

# 5. 设置特定目录权限
echo "📋 步骤5: 设置特定目录权限..."

# 确保关键目录存在并有正确权限
mkdir -p logs
mkdir -p uploads
mkdir -p deployments
mkdir -p deployments/projects

chmod 755 logs
chmod 755 uploads
chmod 755 deployments
chmod 755 deployments/projects

# 6. 修复package.json权限
echo "📋 步骤6: 修复package.json权限..."
chmod 644 package.json
chmod 644 package-lock.json 2>/dev/null || echo "package-lock.json不存在"

# 7. 修复脚本权限
echo "📋 步骤7: 修复脚本权限..."
find scripts -name "*.sh" -exec chmod +x {} \; 2>/dev/null || echo "scripts目录不存在"

# 8. 创建.next目录并设置权限
echo "📋 步骤8: 预创建.next目录..."
mkdir -p .next
chmod 755 .next
chown $(whoami):staff .next

echo "✅ Next.js权限修复完成"

echo ""
echo "📊 权限检查:"
echo "- 项目目录所有者: $(ls -ld . | awk '{print $3":"$4}')"
echo "- .next目录权限: $(ls -ld .next 2>/dev/null | awk '{print $1}' || echo '目录不存在')"
echo "- logs目录权限: $(ls -ld logs 2>/dev/null | awk '{print $1}' || echo '目录不存在')"

echo ""
echo "🚀 现在可以重新启动开发服务器了:"
echo "npm run dev"
echo "# 或者"
echo "./restart-dev.sh"
