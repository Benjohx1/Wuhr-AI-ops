#!/bin/bash

# Mac权限设置脚本
# 解决CICD部署时的权限问题

set -e

echo "🔧 设置Mac权限以支持CICD部署..."

# 用户密码（仅用于测试）
USER_PASSWORD="luozhihong"

# 1. 设置sudo免密码（临时）
echo "📋 步骤1: 配置sudo免密码..."

# 创建临时sudoers文件
TEMP_SUDOERS="/tmp/wuhr_sudoers"
echo "$(whoami) ALL=(ALL) NOPASSWD: ALL" > $TEMP_SUDOERS

# 使用expect自动输入密码
expect << EOF
spawn sudo visudo -f $TEMP_SUDOERS
expect "Password:"
send "$USER_PASSWORD\r"
expect eof
EOF

# 将临时文件添加到sudoers.d
echo "$USER_PASSWORD" | sudo -S cp $TEMP_SUDOERS /etc/sudoers.d/wuhr_cicd
echo "$USER_PASSWORD" | sudo -S chmod 440 /etc/sudoers.d/wuhr_cicd

if [ $? -eq 0 ]; then
    echo "✅ sudo免密码配置成功"
else
    echo "❌ sudo免密码配置失败"
fi

# 2. 设置部署目录权限
echo ""
echo "📋 步骤2: 设置部署目录权限..."

DEPLOY_DIR="/Users/$(whoami)/Documents/job/gemini-cli/wuhr-ai-ops/deployments"

# 创建部署目录
mkdir -p "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/projects"

# 设置权限
echo "$USER_PASSWORD" | sudo -S chown -R $(whoami):staff "$DEPLOY_DIR"
echo "$USER_PASSWORD" | sudo -S chmod -R 755 "$DEPLOY_DIR"

echo "✅ 部署目录权限设置完成: $DEPLOY_DIR"

# 3. 配置SSH密钥权限
echo ""
echo "📋 步骤3: 配置SSH密钥权限..."

SSH_DIR="/Users/$(whoami)/.ssh"

if [ -d "$SSH_DIR" ]; then
    chmod 700 "$SSH_DIR"
    chmod 600 "$SSH_DIR"/* 2>/dev/null || true
    echo "✅ SSH密钥权限设置完成"
else
    echo "⚠️ SSH目录不存在，跳过SSH配置"
fi

# 4. 创建部署用户配置
echo ""
echo "📋 步骤4: 创建部署用户配置..."

# 创建部署配置文件
DEPLOY_CONFIG="/Users/$(whoami)/.wuhr_deploy_config"

cat > "$DEPLOY_CONFIG" << EOF
# WUHR AI Ops 部署配置
DEPLOY_USER=$(whoami)
DEPLOY_HOME=/Users/$(whoami)
DEPLOY_DIR=$DEPLOY_DIR
SSH_DIR=$SSH_DIR
CREATED_AT=$(date)
EOF

echo "✅ 部署配置创建完成: $DEPLOY_CONFIG"

# 5. 测试权限
echo ""
echo "📋 步骤5: 测试权限..."

# 测试sudo权限
if sudo -n true 2>/dev/null; then
    echo "✅ sudo免密码测试成功"
else
    echo "❌ sudo免密码测试失败"
fi

# 测试目录权限
if [ -w "$DEPLOY_DIR" ]; then
    echo "✅ 部署目录写权限测试成功"
else
    echo "❌ 部署目录写权限测试失败"
fi

echo ""
echo "🎉 Mac权限设置完成！"

echo ""
echo "⚠️ 安全提醒:"
echo "1. 此配置仅用于开发测试环境"
echo "2. 生产环境请使用更安全的权限配置"
echo "3. 测试完成后可以移除sudo免密码配置"

echo ""
echo "🔧 移除sudo免密码配置的命令:"
echo "sudo rm /etc/sudoers.d/wuhr_cicd"
