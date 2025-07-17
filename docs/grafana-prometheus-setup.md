# Grafana + Prometheus 监控系统安装配置指南

## 快速安装 (推荐 Docker 方式)

### 第一步：创建配置文件

在您的项目根目录创建以下文件：

**1. docker-compose.monitoring.yml**
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"  # 使用3001端口避免与Next.js冲突
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    restart: unless-stopped
```

**2. prometheus.yml**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

### 第二步：启动服务

```bash
# 启动监控服务
docker-compose -f docker-compose.monitoring.yml up -d

# 检查状态
docker-compose -f docker-compose.monitoring.yml ps
```

## Grafana 配置 Prometheus 数据源

### 访问 Grafana
- 打开浏览器访问：http://localhost:3001
- 用户名：admin
- 密码：admin123

### 添加数据源的准确步骤

**新版本 Grafana (v8+)：**
1. 登录后，左侧边栏找到 **齿轮图标x ⚙️** (Administration)
2. 点击 **"Data sources"**
3. 点击 **"Add data source"** 按钮
4. 选择 **"Prometheus"**

**如果找不到齿轮图标，试试这些方法：**
1. 直接访问：http://localhost:3001/datasources
2. 或者左下角的头像 → Administration → Data sources

### 配置 Prometheus 连接
```
Name: Prometheus
URL: http://prometheus:9090
Access: Server (默认)
```

点击 **"Save & test"**，看到绿色的成功信息即可。

## 导入仪表板

### 推荐的仪表板 ID
- **1860** - Node Exporter Full (服务器监控)
- **315** - Kubernetes 监控
- **12006** - 系统概览

### 导入步骤
1. 左侧边栏 **"+" 号** → **"Import"**
2. 输入仪表板 ID (如：1860)
3. 选择 Prometheus 数据源
4. 点击 **"Import"**

## 验证配置

1. **Prometheus**: http://localhost:9090
2. **Grafana**: http://localhost:3001
3. **Node Exporter**: http://localhost:9100

全部能访问说明安装成功！

---

如果您遇到任何问题，请告诉我具体的错误信息，我会帮您解决。 