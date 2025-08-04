# Wuhr AI Ops Dockerfile
# 基于Ubuntu 22.04构建Node.js应用镜像
FROM ubuntu:22.04

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=20.11.0
ENV PNPM_VERSION=8.15.0
ENV TZ=Asia/Shanghai

# 设置工作目录
WORKDIR /app

# 配置APT使用阿里云镜像源
RUN sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list && \
    sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list && \
    sed -i 's/ports.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list

# 安装系统依赖 - 分步骤安装以避免超时
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    lsb-release \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y \
    software-properties-common \
    build-essential \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y \
    git \
    openssh-client \
    postgresql-client \
    redis-tools \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# 设置时区
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 方案1：使用官方NodeSource仓库安装Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# 方案2（备选）：直接从二进制包安装Node.js
# RUN curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz -o node.tar.xz && \
#     tar -xJf node.tar.xz -C /usr/local --strip-components=1 && \
#     rm node.tar.xz

# 方案3（备选）：使用Ubuntu官方包管理器（版本可能较老）
# RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# 配置npm使用淘宝镜像
RUN npm config set registry https://registry.npmmirror.com/

# 安装pnpm并配置镜像源
RUN npm install -g pnpm@${PNPM_VERSION} && \
    pnpm config set registry https://registry.npmmirror.com/

# 复制package.json和pnpm-lock.yaml（如果存在）
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install

# 复制应用代码
COPY . .

# 复制环境变量文件
COPY .env.docker .env

# 生成Prisma客户端
RUN pnpm prisma generate

# 构建应用
RUN pnpm build

# 创建非root用户
RUN groupadd -r wuhr && useradd -r -g wuhr -s /bin/bash wuhr
RUN chown -R wuhr:wuhr /app
USER wuhr

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 启动命令
CMD ["pnpm", "start"]
