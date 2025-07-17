# 故障排除指南

本文档提供了Wuhr AI Ops平台常见问题的解决方案，包括最新的CI/CD功能相关问题。

## CI/CD功能问题

### 问题：Jenkins配置连接测试失败
**症状**：在Jenkins配置页面点击"测试连接"后显示连接失败

**解决方案**：
1. 检查Jenkins服务器URL是否正确且可访问
2. 验证用户名和API Token是否有效
3. 确保Jenkins服务器允许API访问
4. 检查网络连接和防火墙设置

**示例错误**：
```
Jenkins连接测试失败: 连接超时
```

**调试步骤**：
```bash
# 测试网络连通性
curl -I https://your-jenkins-server.com

# 验证API Token
curl -u username:api_token https://your-jenkins-server.com/api/json
```

### 问题：部署管理页面编辑按钮无响应
**症状**：点击部署任务的编辑按钮没有任何反应

**解决方案**：
1. 检查浏览器控制台是否有JavaScript错误
2. 确保用户具有`cicd:write`权限
3. 验证编辑模态框组件是否正确加载
4. 检查API端点是否正常工作

**已修复**：在最新版本中已添加完整的编辑模态框和处理逻辑

### 问题：审批管理页面显示空数据
**症状**：审批管理页面没有显示任何待审批任务

**解决方案**：
1. 检查通知系统是否正常工作
2. 验证审批通知的数据格式
3. 确保用户有审批权限
4. 检查API数据转换逻辑

**已修复**：已集成真实的通知审批API，替换了模拟数据

### 问题：实时状态更新不工作
**症状**：构建状态不会自动更新，需要手动刷新页面

**解决方案**：
1. 检查实时状态API是否正常响应
2. 验证轮询机制是否启动
3. 确保Jenkins集成配置正确
4. 检查浏览器网络连接

**新增功能**：已实现完整的实时状态更新机制，包括：
- 自动轮询（3-5秒间隔）
- 进度显示
- Jenkins状态集成
- 构建详情页面

### 问题：日志记录功能异常
**症状**：CI/CD操作没有生成相应的日志记录

**解决方案**：
1. 检查日志记录器是否正确初始化
2. 验证API中是否集成了日志记录调用
3. 确保日志存储机制正常工作
4. 检查日志查看页面的API调用

**新增功能**：已实现统一的CI/CD日志记录系统

## 数据库连接问题

### 问题：连接池耗尽
**症状**：应用程序无法获取数据库连接，出现超时错误

**解决方案**：
1. 检查连接池配置
2. 确保所有数据库操作后正确关闭连接
3. 增加连接池大小（如果必要）

**已优化**：已系统性修复连接池管理问题

### 问题：连接泄漏
**症状**：长时间运行后数据库连接数持续增长

**解决方案**：
1. 审查代码中的Prisma客户端使用
2. 确保在finally块中关闭连接
3. 使用连接池监控工具

**已修复**：已全面审查并修复所有连接泄漏点

### 问题：数据库字段错误
**症状**：API调用时出现字段不存在的错误

**解决方案**：
1. 检查Prisma schema是否最新
2. 运行数据库迁移
3. 重新生成Prisma客户端

**示例错误**：
```
Unknown field `rollbacks` on model `Deployment`
```

**修复命令**：
```bash
npx prisma db push
npx prisma generate
```

## 认证和授权问题

### 问题：JWT令牌过期
**症状**：用户频繁需要重新登录

**解决方案**：
1. 检查令牌过期时间配置
2. 实现令牌自动刷新机制
3. 优化令牌存储策略

### 问题：权限验证失败
**症状**：用户无法访问某些功能

**解决方案**：
1. 检查用户角色和权限配置
2. 验证权限检查逻辑
3. 确保权限数据同步

**CI/CD权限**：
- `cicd:read` - 查看CI/CD功能
- `cicd:write` - 操作CI/CD功能
- `admin` - 所有权限

## 性能问题

### 问题：页面加载缓慢
**症状**：页面响应时间超过3秒

**解决方案**：
1. 优化数据库查询
2. 实现数据缓存
3. 使用分页加载
4. 压缩静态资源

**已优化**：CI/CD相关页面已实现分页和数据优化

### 问题：内存使用过高
**症状**：应用程序内存持续增长

**解决方案**：
1. 检查内存泄漏
2. 优化数据结构
3. 实现垃圾回收策略

### 问题：实时更新性能问题
**症状**：频繁的状态轮询导致性能下降

**解决方案**：
1. 调整轮询间隔（建议3-5秒）
2. 在构建完成后停止轮询
3. 使用WebSocket替代轮询（未来优化）

## 部署问题

### 问题：Docker容器启动失败
**症状**：容器无法正常启动

**解决方案**：
1. 检查Docker配置文件
2. 验证环境变量设置
3. 查看容器日志

### 问题：端口冲突
**症状**：应用程序无法绑定到指定端口

**解决方案**：
1. 检查端口占用情况
2. 修改端口配置
3. 停止冲突的服务

**快速解决**：
```bash
# 使用重启脚本解决端口3000冲突
./restart-dev.sh
```

## 常用命令

### 数据库操作
```bash
# 重置数据库
npx prisma db reset

# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma db push

# 验证CI/CD数据完整性
node scripts/verify-cicd-data.js
```

### 开发服务器
```bash
# 启动开发服务器
npm run dev

# 重启开发服务器（解决端口冲突）
./restart-dev.sh
```

### CI/CD功能测试
```bash
# 运行CI/CD功能测试
node scripts/test-cicd-features.js

# 检查测试覆盖率
npm run test:coverage
```

### 日志查看
```bash
# 查看应用程序日志
docker logs wuhr-ai-ops

# 查看数据库日志
docker logs postgres

# 查看CI/CD操作日志
# 访问 /cicd/logs 页面或使用API
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/cicd/logs
```

## 数据验证和修复

### 验证数据完整性
```bash
# 运行完整的数据验证
node scripts/verify-cicd-data.js
```

**预期输出**：
```
✅ 数据库连接正常
✅ 所有Jenkins配置数据完整
✅ 所有部署任务关联关系正确
✅ 所有审批记录关联关系正确
✅ 权限系统集成正常
✅ 日志记录功能正常
成功率: 100.0%
```

### 修复常见数据问题
```sql
-- 修复孤立的Jenkins配置
UPDATE jenkins_configs SET project_id = NULL WHERE project_id NOT IN (SELECT id FROM cicd_projects);

-- 清理无效的部署任务
DELETE FROM deployments WHERE project_id NOT IN (SELECT id FROM cicd_projects);

-- 重置审批状态
UPDATE deployment_approvals SET status = 'pending' WHERE status IS NULL;
```

## 监控和告警

### 健康检查端点
```bash
# 检查应用程序健康状态
curl http://localhost:3000/api/health

# 检查数据库连接
curl http://localhost:3000/api/health/database

# 检查CI/CD功能状态
curl http://localhost:3000/api/cicd/health
```

### 性能监控
```bash
# 查看连接池状态
curl http://localhost:3000/api/admin/pool-status

# 查看内存使用情况
docker stats wuhr-ai-ops
```

## 最新更新说明

### v1.2.0 (2025-01-04)
- ✅ 完善Jenkins配置管理功能
- ✅ 修复部署管理操作问题
- ✅ 优化审批管理界面
- ✅ 实现数据持久化验证
- ✅ 添加实时状态更新机制
- ✅ 完善系统日志记录
- ✅ 全面功能测试验证

### 已知问题
- [ ] 大量并发构建时可能出现性能瓶颈
- [ ] Jenkins插件兼容性需要进一步测试
- [ ] 日志存储机制需要优化（当前使用模拟数据）

### 计划改进
- [ ] 实现WebSocket实时通信
- [ ] 添加更多CI/CD工具支持
- [ ] 优化日志存储和查询性能

## 联系支持

如果以上解决方案无法解决您的问题，请联系技术支持团队：

- **技术支持邮箱**: support@wuhr.ai
- **开发团队**: dev@wuhr.ai
- **紧急联系**: 请查看内部联系方式

---

**文档版本**: v1.2.0  
**最后更新**: 2025-01-04  
**维护者**: Wuhr AI Ops开发团队
