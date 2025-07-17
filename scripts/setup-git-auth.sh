#!/bin/bash

# Git认证配置脚本
# 解决Git HTTP认证失败问题

set -e

echo "🔧 配置Git认证..."

# Git服务器信息
GIT_SERVER="git.ope.ai:8999"
GIT_REPO_URL="http://git.ope.ai:8999/component/voicechat2.git"

echo "📋 Git服务器: $GIT_SERVER"
echo "📋 仓库地址: $GIT_REPO_URL"

# 1. 检查当前Git配置
echo ""
echo "📋 步骤1: 检查当前Git配置..."

echo "当前Git用户配置:"
git config --global user.name || echo "未设置用户名"
git config --global user.email || echo "未设置邮箱"

echo "当前Git凭据配置:"
git config --global credential.helper || echo "未设置凭据助手"

# 2. 配置Git凭据存储
echo ""
echo "📋 步骤2: 配置Git凭据存储..."

# 配置凭据助手
git config --global credential.helper store
echo "✅ Git凭据助手配置完成"

# 3. 创建Git凭据文件
echo ""
echo "📋 步骤3: 配置Git认证信息..."

# 提示用户输入认证信息
echo "请输入Git认证信息:"
read -p "用户名: " GIT_USERNAME
read -s -p "密码/Token: " GIT_PASSWORD
echo ""

# 验证输入
if [ -z "$GIT_USERNAME" ] || [ -z "$GIT_PASSWORD" ]; then
    echo "❌ 用户名或密码不能为空"
    exit 1
fi

# 创建凭据文件
CREDENTIALS_FILE="$HOME/.git-credentials"

# 检查是否已存在该服务器的凭据
if grep -q "$GIT_SERVER" "$CREDENTIALS_FILE" 2>/dev/null; then
    echo "⚠️ 发现已存在的凭据，将更新..."
    # 删除旧的凭据
    grep -v "$GIT_SERVER" "$CREDENTIALS_FILE" > "$CREDENTIALS_FILE.tmp" 2>/dev/null || touch "$CREDENTIALS_FILE.tmp"
    mv "$CREDENTIALS_FILE.tmp" "$CREDENTIALS_FILE"
fi

# 添加新凭据
echo "http://$GIT_USERNAME:$GIT_PASSWORD@$GIT_SERVER" >> "$CREDENTIALS_FILE"

# 设置文件权限
chmod 600 "$CREDENTIALS_FILE"

echo "✅ Git凭据配置完成"

# 4. 测试Git认证
echo ""
echo "📋 步骤4: 测试Git认证..."

# 创建临时目录进行测试
TEST_DIR="/tmp/git-auth-test-$(date +%s)"
mkdir -p "$TEST_DIR"

echo "🔍 测试克隆仓库..."
if git clone "$GIT_REPO_URL" "$TEST_DIR/test-repo" 2>/dev/null; then
    echo "✅ Git认证测试成功"
    rm -rf "$TEST_DIR"
else
    echo "❌ Git认证测试失败"
    echo "💡 可能的原因:"
    echo "   1. 用户名或密码错误"
    echo "   2. 需要使用Personal Access Token"
    echo "   3. 账户启用了2FA"
    echo "   4. 网络连接问题"
    
    rm -rf "$TEST_DIR"
    exit 1
fi

# 5. 配置项目级Git设置
echo ""
echo "📋 步骤5: 配置项目级Git设置..."

# 在项目目录中配置Git
if [ -d ".git" ]; then
    git config credential.helper store
    echo "✅ 项目级Git凭据配置完成"
else
    echo "⚠️ 当前目录不是Git仓库，跳过项目级配置"
fi

# 6. 创建Git配置备份
echo ""
echo "📋 步骤6: 创建配置备份..."

BACKUP_DIR="./git-config-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份Git配置
cp "$HOME/.gitconfig" "$BACKUP_DIR/gitconfig.backup" 2>/dev/null || echo "没有全局Git配置文件"
cp "$HOME/.git-credentials" "$BACKUP_DIR/git-credentials.backup" 2>/dev/null || echo "没有Git凭据文件"

echo "✅ Git配置备份完成: $BACKUP_DIR"

echo ""
echo "🎉 Git认证配置完成！"

echo ""
echo "📊 配置摘要:"
echo "- Git服务器: $GIT_SERVER"
echo "- 用户名: $GIT_USERNAME"
echo "- 凭据存储: ~/.git-credentials"
echo "- 凭据助手: store"

echo ""
echo "🔧 验证命令:"
echo "git clone $GIT_REPO_URL"

echo ""
echo "⚠️ 安全提醒:"
echo "1. 凭据文件包含敏感信息，请妥善保管"
echo "2. 建议使用Personal Access Token而非密码"
echo "3. 定期更新认证信息"

echo ""
echo "🚀 现在可以重新尝试部署操作了！"
