#!/bin/bash

# 强制清理 wuhr-ai-ops systemd 服务

SERVICE_NAME="wuhr-ai-ops"

echo "🧹 强制清理 $SERVICE_NAME 服务..."

# 停止服务（如果正在运行）
systemctl stop $SERVICE_NAME 2>/dev/null || true

# 禁用服务
systemctl disable $SERVICE_NAME 2>/dev/null || true

# 杀死所有相关进程
pkill -f "wuhr-ai-ops" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true
pkill -f "next.*start" 2>/dev/null || true

# 删除服务文件
rm -f /etc/systemd/system/${SERVICE_NAME}.service
rm -rf /etc/systemd/system/${SERVICE_NAME}.service.d

# 重新加载systemd
systemctl daemon-reload

# 重置失败状态
systemctl reset-failed 2>/dev/null || true

echo "✅ 清理完成！"

# 验证清理结果
if systemctl list-unit-files | grep -q "$SERVICE_NAME"; then
    echo "❌ 服务文件仍然存在"
else
    echo "✅ 服务文件已完全删除"
fi 