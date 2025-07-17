# Git认证配置指南

本文档说明如何为Wuhr AI Ops平台配置Git认证，以支持私有仓库的代码拉取。

## 🔐 **认证方式概述**

系统支持多种Git认证方式：

1. **用户名密码认证** - 适用于大多数Git平台
2. **Personal Access Token** - 推荐方式，更安全
3. **SSH密钥认证** - 适用于SSH协议的仓库

## ⚙️ **环境变量配置**

### **基本配置**

在`.env`文件中添加以下配置：

```bash
# Git认证配置
GIT_USERNAME=your-username
GIT_TOKEN=your-token-or-password
```

### **平台特定配置**

```bash
# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# GitLab
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx

# Gitee
GITEE_TOKEN=your-gitee-token

# 自建Git服务器
GIT_USERNAME=your-username
GIT_TOKEN=your-password-or-token
```

## 🔑 **各平台Token获取方法**

### **GitHub Personal Access Token**

1. 登录GitHub，进入 **Settings** → **Developer settings** → **Personal access tokens**
2. 点击 **Generate new token (classic)**
3. 设置Token名称和过期时间
4. 选择权限：
   - `repo` - 访问私有仓库
   - `read:org` - 读取组织信息（可选）
5. 点击 **Generate token** 并复制Token

### **GitLab Access Token**

1. 登录GitLab，进入 **User Settings** → **Access Tokens**
2. 填写Token名称和过期时间
3. 选择权限：
   - `read_repository` - 读取仓库
   - `read_user` - 读取用户信息
4. 点击 **Create personal access token** 并复制Token

### **Gitee Access Token**

1. 登录Gitee，进入 **设置** → **私人令牌**
2. 点击 **生成新令牌**
3. 填写令牌描述和选择权限
4. 点击 **提交** 并复制Token

## 🛠️ **配置示例**

### **示例1: GitHub私有仓库**

```bash
# .env文件配置
GIT_USERNAME=your-github-username
GIT_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# 或者使用GitHub专用配置
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

项目仓库URL：`https://github.com/company/private-repo.git`

### **示例2: 自建GitLab服务器**

```bash
# .env文件配置
GIT_USERNAME=your-gitlab-username
GIT_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
```

项目仓库URL：`http://git.company.com/group/project.git`

### **示例3: 您的情况（git.ope.ai）**

```bash
# .env文件配置
GIT_USERNAME=your-username
GIT_TOKEN=your-actual-token-here
```

项目仓库URL：`http://git.ope.ai:8999/component/voicechat2.git`

## 🔧 **故障排除**

### **常见错误及解决方案**

#### **1. HTTP Basic: Access denied**
```
错误信息: HTTP Basic: Access denied. The provided password or token is incorrect
```

**解决方案:**
- 检查用户名和Token是否正确
- 确认Token有足够的权限
- 验证Token是否已过期

#### **2. Empty reply from server**
```
错误信息: fatal: unable to access 'http://...': Empty reply from server
```

**解决方案:**
- 检查Git服务器是否正常运行
- 验证网络连接
- 确认仓库URL是否正确

#### **3. Authentication failed**
```
错误信息: Authentication failed for 'http://...'
```

**解决方案:**
- 检查环境变量是否正确设置
- 重启应用以加载新的环境变量
- 验证Token权限设置

### **调试步骤**

1. **检查环境变量**
   ```bash
   echo $GIT_USERNAME
   echo $GIT_TOKEN
   ```

2. **手动测试Git访问**
   ```bash
   git clone http://username:token@git.ope.ai:8999/component/voicechat2.git test-repo
   ```

3. **查看部署日志**
   - 检查日志中的认证信息构建过程
   - 确认URL是否正确构建

## 🔒 **安全最佳实践**

### **Token安全**
1. **定期轮换**: 定期更新Access Token
2. **最小权限**: 只授予必要的权限
3. **环境隔离**: 不同环境使用不同的Token
4. **安全存储**: 不要在代码中硬编码Token

### **网络安全**
1. **HTTPS优先**: 尽量使用HTTPS协议
2. **内网访问**: 自建Git服务器建议使用内网
3. **防火墙**: 配置适当的防火墙规则

## 📝 **配置检查清单**

- [ ] 已在`.env`文件中配置`GIT_USERNAME`
- [ ] 已在`.env`文件中配置`GIT_TOKEN`
- [ ] Token具有仓库读取权限
- [ ] Token未过期
- [ ] 重启了应用以加载新配置
- [ ] 手动测试Git克隆成功
- [ ] 部署日志显示认证成功

## 🚀 **快速修复您的问题**

基于您的错误日志，建议按以下步骤操作：

1. **设置正确的环境变量**
   ```bash
   # 在.env文件中添加
   GIT_USERNAME=your-actual-username
   GIT_TOKEN=your-actual-token
   ```

2. **重启应用**
   ```bash
   npm run dev
   ```

3. **测试部署**
   - 创建新的部署任务
   - 查看日志确认认证信息正确

如果问题仍然存在，请检查：
- Git服务器是否正常运行
- 网络连接是否正常
- Token权限是否足够

通过正确配置Git认证，您的部署系统将能够成功访问私有仓库并完成代码拉取。
