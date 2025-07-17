# 代码保留、实时日志和权限问题解决方案

本文档总结了三个关键问题的解决方案：代码保留、实时日志显示和Next.js权限问题。

## 🎯 **问题1: 代码保留不删除**

### **需求**
希望拉下来的代码不要删除，下次更新可以更快速的发布。

### **解决方案**

#### **修改部署执行器逻辑**
```typescript
// 修改前：直接删除目录重新克隆
await this.safeRemoveDirectory(this.codeDir)
await this.cloneRepository(gitUrl, branch)

// 修改后：优先使用Git重置，保留目录结构
try {
  // 先尝试强制重置，保留目录结构以便下次快速更新
  this.log('🔧 执行强制重置...')
  await this.executeCommand('git', ['reset', '--hard', 'HEAD'], this.codeDir)
  await this.executeCommand('git', ['clean', '-fdx'], this.codeDir)
  await this.executeCommand('git', ['fetch', 'origin', branch, '--force'], this.codeDir)
  await this.executeCommand('git', ['reset', '--hard', `origin/${branch}`], this.codeDir)
  this.log('✅ 代码重置成功，目录结构已保留')
} catch (resetError) {
  // 只有在重置失败时才删除目录重新克隆
  await this.safeRemoveDirectory(this.codeDir)
  await this.cloneRepository(gitUrl, branch)
}
```

#### **优势**
- ✅ **保留目录结构**: 避免重复下载大量文件
- ✅ **快速更新**: 只下载变更的文件
- ✅ **容错机制**: 重置失败时自动回退到重新克隆
- ✅ **减少网络传输**: 显著提升部署速度

## 🎯 **问题2: 实时日志显示**

### **需求**
部署管理的查看详情是实时的显示日志，方便用户查看，显示日志需要中文注释最好颜色区分。

### **解决方案**

#### **创建实时日志查看器组件**
- **文件**: `components/cicd/DeploymentLogViewer.tsx`
- **功能**: 实时显示部署日志，中文注释，颜色区分

#### **核心特性**

##### **1. 实时日志更新**
```typescript
// 自动刷新机制
useEffect(() => {
  if (!visible || !autoRefresh) return

  const interval = setInterval(() => {
    // 只有在部署中时才自动刷新
    if (status === 'deploying') {
      fetchLogs()
    }
  }, 2000) // 每2秒刷新一次

  return () => clearInterval(interval)
}, [visible, autoRefresh, status, deploymentId])
```

##### **2. 智能日志解析**
```typescript
const parseLogEntry = (logLine: string): LogEntry => {
  // 检测日志级别
  let level: 'info' | 'error' | 'warning' | 'success' = 'info'
  
  if (logLine.includes('❌') || logLine.includes('错误') || logLine.includes('失败')) {
    level = 'error'
  } else if (logLine.includes('⚠️') || logLine.includes('警告')) {
    level = 'warning'
  } else if (logLine.includes('✅') || logLine.includes('成功') || logLine.includes('完成')) {
    level = 'success'
  }
  
  // 提取阶段信息
  const stagePatterns = [
    { pattern: /🚀.*开始.*部署/, stage: '初始化部署' },
    { pattern: /📁.*准备.*目录/, stage: '准备环境' },
    { pattern: /📥.*拉取.*代码/, stage: '拉取代码' },
    { pattern: /🔨.*构建/, stage: '本地构建' },
    { pattern: /🚀.*远程.*部署/, stage: '远程部署' },
    { pattern: /🎉.*完成/, stage: '部署完成' }
  ]
}
```

##### **3. 颜色区分显示**
```typescript
const getLogStyle = (entry: LogEntry) => {
  switch (entry.level) {
    case 'error':
      return { backgroundColor: '#fff2f0', color: '#cf1322', borderLeft: '3px solid #ff4d4f' }
    case 'warning':
      return { backgroundColor: '#fffbe6', color: '#d48806', borderLeft: '3px solid #faad14' }
    case 'success':
      return { backgroundColor: '#f6ffed', color: '#389e0d', borderLeft: '3px solid #52c41a' }
    default:
      return { backgroundColor: '#fafafa', color: '#595959', borderLeft: '3px solid #d9d9d9' }
  }
}
```

#### **用户界面特性**
- ✅ **实时更新**: 每2秒自动刷新部署中的日志
- ✅ **颜色区分**: 错误(红色)、警告(黄色)、成功(绿色)、信息(灰色)
- ✅ **阶段标签**: 显示当前执行阶段的中文标签
- ✅ **自动滚动**: 新日志自动滚动到底部
- ✅ **日志下载**: 支持下载完整日志文件
- ✅ **手动控制**: 可以停止/开启自动刷新

#### **集成到部署管理**
```typescript
// 在DeploymentManager中添加查看日志按钮
<Tooltip title="查看实时日志">
  <Button
    type="text"
    icon={<FileTextOutlined />}
    onClick={() => handleViewLogs(record)}
  />
</Tooltip>

// 添加日志查看器组件
<DeploymentLogViewer
  visible={logViewerVisible}
  onClose={() => setLogViewerVisible(false)}
  deploymentId={selectedDeploymentForLogs?.id || ''}
  deploymentName={selectedDeploymentForLogs?.name || ''}
/>
```

## 🎯 **问题3: Next.js权限错误**

### **错误信息**
```
Error: EACCES: permission denied, unlink '/Users/hyflog/Documents/job/gemini-cli/wuhr-ai-ops/.next/server/app-paths-manifest.json'
```

### **根本原因**
- Next.js构建文件权限问题
- .next目录权限不正确
- 可能由sudo操作导致的权限混乱

### **解决方案**

#### **创建权限修复脚本**
- **文件**: `scripts/fix-nextjs-permissions.sh`
- **功能**: 自动修复Next.js相关的权限问题

#### **修复步骤**
```bash
# 1. 停止开发服务器
pkill -f "next dev"

# 2. 删除.next目录
sudo rm -rf .next

# 3. 清理缓存
sudo rm -rf node_modules/.cache

# 4. 修复项目权限
sudo chown -R $(whoami):staff .
chmod -R 755 .

# 5. 预创建目录
mkdir -p .next logs uploads deployments
chmod 755 .next logs uploads deployments
```

#### **使用方法**
```bash
# 运行权限修复脚本
chmod +x scripts/fix-nextjs-permissions.sh
./scripts/fix-nextjs-permissions.sh

# 重新启动开发服务器
npm run dev
# 或者
./restart-dev.sh
```

## 🚀 **完整操作流程**

### **阶段1: 修复权限问题**
```bash
# 1. 修复Next.js权限
./scripts/fix-nextjs-permissions.sh

# 2. 重新启动开发服务器
./restart-dev.sh
```

### **阶段2: 验证代码保留功能**
```bash
# 1. 创建部署任务
# 2. 观察日志中的代码更新过程
# 3. 验证是否使用了Git重置而非重新克隆
```

### **阶段3: 测试实时日志功能**
```bash
# 1. 访问部署管理页面
# 2. 点击"查看实时日志"按钮
# 3. 观察日志实时更新和颜色区分
# 4. 测试自动刷新功能
```

## 📊 **功能对比**

### **代码保留功能**
| 方面 | 修改前 | 修改后 | 改进效果 |
|------|--------|--------|----------|
| 更新方式 | ❌ 删除重新克隆 | ✅ Git重置保留目录 | 🟢 速度提升 |
| 网络传输 | ❌ 下载完整仓库 | ✅ 只下载变更 | 🟢 流量节省 |
| 部署时间 | ❌ 每次都很慢 | ✅ 快速增量更新 | 🟢 效率提升 |

### **实时日志功能**
| 方面 | 修改前 | 修改后 | 改进效果 |
|------|--------|--------|----------|
| 日志查看 | ❌ 静态显示 | ✅ 实时更新 | 🟢 用户体验 |
| 颜色区分 | ❌ 单一颜色 | ✅ 多色区分 | 🟢 可读性 |
| 阶段提示 | ❌ 无阶段信息 | ✅ 中文阶段标签 | 🟢 进度可见 |
| 自动刷新 | ❌ 手动刷新 | ✅ 自动更新 | 🟢 便利性 |

### **权限问题修复**
| 方面 | 修改前 | 修改后 | 改进效果 |
|------|--------|--------|----------|
| 启动错误 | ❌ 权限拒绝错误 | ✅ 正常启动 | 🟢 稳定性 |
| 权限管理 | ❌ 手动修复 | ✅ 自动化脚本 | 🟢 便利性 |
| 错误恢复 | ❌ 复杂操作 | ✅ 一键修复 | 🟢 易用性 |

## 🔍 **验证清单**

### **代码保留验证**
- [ ] 第一次部署正常克隆代码
- [ ] 第二次部署使用Git重置
- [ ] 部署日志显示"代码重置成功，目录结构已保留"
- [ ] 部署速度明显提升

### **实时日志验证**
- [ ] 点击"查看实时日志"按钮正常打开
- [ ] 日志每2秒自动刷新
- [ ] 错误日志显示红色
- [ ] 成功日志显示绿色
- [ ] 阶段标签正确显示中文
- [ ] 可以下载日志文件

### **权限问题验证**
- [ ] 运行权限修复脚本无错误
- [ ] Next.js开发服务器正常启动
- [ ] 没有EACCES权限错误
- [ ] .next目录权限正确

## 📚 **相关文件**

### **代码保留**
- `lib/deployment/deploymentExecutor.ts` - 修改了代码更新逻辑

### **实时日志**
- `components/cicd/DeploymentLogViewer.tsx` - 实时日志查看器
- `components/cicd/DeploymentManager.tsx` - 集成日志查看功能

### **权限修复**
- `scripts/fix-nextjs-permissions.sh` - Next.js权限修复脚本

### **文档**
- `docs/code-preservation-realtime-logs-permissions-fix.md` - 本指南

## 🎉 **预期效果**

通过这些改进，您的部署系统现在具备了：

1. **高效的代码更新** - 保留代码目录，快速增量更新
2. **直观的日志监控** - 实时显示，颜色区分，中文阶段提示
3. **稳定的开发环境** - 自动修复权限问题，确保服务正常启动

这些改进显著提升了部署效率和用户体验，使整个CI/CD流程更加流畅和可靠。
