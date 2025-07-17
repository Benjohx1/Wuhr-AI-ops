#!/bin/bash

# 简化的Mac权限设置脚本
# 解决CICD部署时的权限问题

set -e

echo "🔧 设置Mac权限以支持CICD部署..."

# 用户密码
USER_PASSWORD="luozhihong"

# 1. 设置部署目录权限
echo ""
echo "📋 步骤1: 设置部署目录权限..."

DEPLOY_DIR="/Users/$(whoami)/Documents/job/gemini-cli/wuhr-ai-ops/deployments"

# 创建部署目录
mkdir -p "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/projects"

# 设置权限
chmod -R 755 "$DEPLOY_DIR"

echo "✅ 部署目录权限设置完成: $DEPLOY_DIR"

# 2. 配置SSH密钥权限
echo ""
echo "📋 步骤2: 配置SSH密钥权限..."

SSH_DIR="/Users/$(whoami)/.ssh"

if [ -d "$SSH_DIR" ]; then
    chmod 700 "$SSH_DIR"
    chmod 600 "$SSH_DIR"/* 2>/dev/null || true
    echo "✅ SSH密钥权限设置完成"
else
    echo "⚠️ SSH目录不存在，跳过SSH配置"
fi

# 3. 创建sudo免密码配置
echo ""
echo "📋 步骤3: 配置sudo免密码..."

# 创建sudoers配置
SUDOERS_FILE="/etc/sudoers.d/wuhr_cicd"

# 使用echo和管道来避免交互式输入
echo "$(whoami) ALL=(ALL) NOPASSWD: ALL" | echo "$USER_PASSWORD" | sudo -S tee "$SUDOERS_FILE" > /dev/null

if [ $? -eq 0 ]; then
    echo "$USER_PASSWORD" | sudo -S chmod 440 "$SUDOERS_FILE"
    echo "✅ sudo免密码配置成功"
else
    echo "❌ sudo免密码配置失败"
fi

# 4. 测试权限
echo ""
echo "📋 步骤4: 测试权限..."

# 测试sudo权限
if sudo -n true 2>/dev/null; then
    echo "✅ sudo免密码测试成功"
else
    echo "❌ sudo免密码测试失败，可能需要手动配置"
fi

# 测试目录权限
if [ -w "$DEPLOY_DIR" ]; then
    echo "✅ 部署目录写权限测试成功"
else
    echo "❌ 部署目录写权限测试失败"
fi

# 5. 创建部署配置文件
echo ""
echo "📋 步骤5: 创建部署配置..."

DEPLOY_CONFIG="/Users/$(whoami)/.wuhr_deploy_config"

cat > "$DEPLOY_CONFIG" << EOF
# WUHR AI Ops 部署配置
DEPLOY_USER=$(whoami)
DEPLOY_HOME=/Users/$(whoami)
DEPLOY_DIR=$DEPLOY_DIR
SSH_DIR=$SSH_DIR
SUDO_CONFIGURED=true
CREATED_AT=$(date)
EOF

echo "✅ 部署配置创建完成: $DEPLOY_CONFIG"

echo ""
echo "🎉 Mac权限设置完成！"

echo ""
echo "📊 配置摘要:"
echo "- 用户: $(whoami)"
echo "- 部署目录: $DEPLOY_DIR"
echo "- SSH目录: $SSH_DIR"
echo "- sudo免密码: 已配置"

echo ""
echo "⚠️ 安全提醒:"
echo "1. 此配置仅用于开发测试环境"
echo "2. 生产环境请使用更安全的权限配置"
echo "3. 测试完成后可以移除sudo免密码配置"

echo ""
echo "🔧 移除sudo免密码配置的命令:"
echo "sudo rm /etc/sudoers.d/wuhr_cicd"

echo ""
echo "🚀 现在可以重新尝试部署操作了！"
