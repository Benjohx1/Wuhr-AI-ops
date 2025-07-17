#!/usr/bin/env node

/**
 * 部署功能使用示例
 * 展示如何使用优化后的远程部署功能
 */

const { executeDeployment } = require('../lib/deployment/deploymentExecutor')

async function deploymentExample() {
  console.log('🚀 部署功能使用示例\n')

  // 示例1: 远程项目目录模式部署
  console.log('📋 示例1: 远程项目目录模式部署')
  console.log('=' .repeat(50))

  const remoteProjectDeployment = {
    deploymentId: 'example-remote-001',
    hostId: 'production-server',
    
    // Git配置
    repositoryUrl: 'https://github.com/company/webapp.git',
    branch: 'main',
    gitCredentials: {
      type: 'token',
      token: process.env.GITHUB_TOKEN
    },

    // 构建和部署脚本
    buildScript: `
      echo "🔧 开始构建..."
      npm ci
      npm run build
      npm run test
      echo "✅ 构建完成"
    `,
    
    deployScript: `
      echo "🚀 开始部署..."
      
      # 安装生产依赖
      npm ci --only=production
      
      # 重启应用
      pm2 restart webapp
      
      # 等待服务启动
      sleep 5
      
      # 健康检查
      if curl -f http://localhost:3000/health; then
        echo "✅ 部署成功，服务正常运行"
      else
        echo "❌ 部署失败，服务健康检查未通过"
        exit 1
      fi
    `,

    // 远程项目配置
    useRemoteProject: true,
    remoteProjectPath: '/var/www/webapp',

    // 环境变量
    environment: {
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: process.env.DATABASE_URL
    },

    // 超时设置
    timeout: 600000 // 10分钟
  }

  console.log('配置说明:')
  console.log(`- 部署模式: 远程项目目录`)
  console.log(`- 远程路径: ${remoteProjectDeployment.remoteProjectPath}`)
  console.log(`- 仓库地址: ${remoteProjectDeployment.repositoryUrl}`)
  console.log(`- 目标分支: ${remoteProjectDeployment.branch}`)
  console.log('')

  // 示例2: 传统传输模式部署
  console.log('📋 示例2: 传统传输模式部署')
  console.log('=' .repeat(50))

  const traditionalDeployment = {
    deploymentId: 'example-traditional-001',
    hostId: 'legacy-server',
    
    repositoryUrl: 'https://github.com/company/legacy-app.git',
    branch: 'main',
    
    buildScript: `
      npm ci
      npm run build
      npm run package
    `,
    
    deployScript: `
      # 停止现有服务
      systemctl stop legacy-app
      
      # 备份当前版本
      cp -r /opt/legacy-app /opt/legacy-app.backup.$(date +%Y%m%d_%H%M%S)
      
      # 部署新版本
      cp -r . /opt/legacy-app/
      
      # 安装依赖
      cd /opt/legacy-app
      npm ci --only=production
      
      # 启动服务
      systemctl start legacy-app
      
      # 验证部署
      sleep 10
      systemctl is-active legacy-app
    `,

    useRemoteProject: false,
    
    environment: {
      NODE_ENV: 'production',
      APP_PORT: '8080'
    }
  }

  console.log('配置说明:')
  console.log(`- 部署模式: 传统传输`)
  console.log(`- 仓库地址: ${traditionalDeployment.repositoryUrl}`)
  console.log(`- 目标分支: ${traditionalDeployment.branch}`)
  console.log('')

  // 示例3: Docker容器部署
  console.log('📋 示例3: Docker容器部署')
  console.log('=' .repeat(50))

  const dockerDeployment = {
    deploymentId: 'example-docker-001',
    hostId: 'docker-server',
    
    repositoryUrl: 'https://github.com/company/docker-app.git',
    branch: 'main',
    
    buildScript: `
      # 构建Docker镜像
      docker build -t myapp:\${BUILD_NUMBER} .
      
      # 推送到镜像仓库（可选）
      # docker push registry.company.com/myapp:\${BUILD_NUMBER}
    `,
    
    deployScript: `
      # 停止现有容器
      docker stop myapp || true
      docker rm myapp || true
      
      # 启动新容器
      docker run -d \\
        --name myapp \\
        --restart unless-stopped \\
        -p 3000:3000 \\
        -e NODE_ENV=production \\
        myapp:\${BUILD_NUMBER}
      
      # 验证部署
      sleep 10
      docker ps | grep myapp
      curl -f http://localhost:3000/health
    `,

    useRemoteProject: true,
    remoteProjectPath: '/opt/docker-app',
    
    environment: {
      BUILD_NUMBER: '${DEPLOYMENT_ID}',
      DOCKER_REGISTRY: 'registry.company.com'
    }
  }

  console.log('配置说明:')
  console.log(`- 部署模式: Docker容器`)
  console.log(`- 远程路径: ${dockerDeployment.remoteProjectPath}`)
  console.log(`- 构建方式: Docker镜像`)
  console.log('')

  // 示例4: 多环境部署函数
  console.log('📋 示例4: 多环境部署函数')
  console.log('=' .repeat(50))

  function createEnvironmentConfig(environment) {
    const baseConfig = {
      repositoryUrl: 'https://github.com/company/webapp.git',
      buildScript: 'npm ci && npm run build',
      deployScript: 'npm ci --only=production && pm2 restart webapp',
      useRemoteProject: true,
      timeout: 300000
    }

    const envConfigs = {
      development: {
        ...baseConfig,
        deploymentId: `dev-deploy-${Date.now()}`,
        hostId: 'dev-server',
        branch: 'develop',
        remoteProjectPath: '/var/www/webapp-dev',
        environment: {
          NODE_ENV: 'development',
          PORT: '3002',
          DEBUG: 'true'
        }
      },
      
      staging: {
        ...baseConfig,
        deploymentId: `staging-deploy-${Date.now()}`,
        hostId: 'staging-server',
        branch: 'staging',
        remoteProjectPath: '/var/www/webapp-staging',
        environment: {
          NODE_ENV: 'staging',
          PORT: '3001'
        }
      },
      
      production: {
        ...baseConfig,
        deploymentId: `prod-deploy-${Date.now()}`,
        hostId: 'production-server',
        branch: 'main',
        remoteProjectPath: '/var/www/webapp',
        environment: {
          NODE_ENV: 'production',
          PORT: '3000'
        },
        timeout: 600000 // 生产环境更长的超时时间
      }
    }

    return envConfigs[environment]
  }

  // 使用示例
  const devConfig = createEnvironmentConfig('development')
  const prodConfig = createEnvironmentConfig('production')

  console.log('多环境配置生成完成:')
  console.log(`- 开发环境: ${devConfig.hostId} (${devConfig.branch})`)
  console.log(`- 生产环境: ${prodConfig.hostId} (${prodConfig.branch})`)
  console.log('')

  // 实际执行部署的示例代码
  console.log('💡 实际执行部署的代码示例:')
  console.log('=' .repeat(50))
  
  console.log(`
// 执行远程项目目录模式部署
try {
  console.log('🚀 开始部署...')
  const result = await executeDeployment(remoteProjectDeployment)
  
  if (result.success) {
    console.log('✅ 部署成功!')
    console.log('部署日志:', result.logs)
    console.log('部署耗时:', result.duration, 'ms')
  } else {
    console.error('❌ 部署失败:', result.error)
  }
} catch (error) {
  console.error('部署过程中发生异常:', error.message)
}

// 批量部署多个环境
const environments = ['development', 'staging', 'production']
for (const env of environments) {
  const config = createEnvironmentConfig(env)
  console.log(\`🚀 部署到 \${env} 环境...\`)
  
  try {
    const result = await executeDeployment(config)
    console.log(\`✅ \${env} 环境部署成功\`)
  } catch (error) {
    console.error(\`❌ \${env} 环境部署失败:\`, error.message)
  }
}
  `)

  console.log('')
  console.log('🔧 使用步骤:')
  console.log('1. 根据需求选择合适的部署模式')
  console.log('2. 配置主机信息和认证方式')
  console.log('3. 编写构建和部署脚本')
  console.log('4. 设置环境变量和超时时间')
  console.log('5. 调用executeDeployment函数执行部署')
  console.log('')
  
  console.log('✅ 部署功能使用示例完成!')
}

// 如果直接运行此脚本
if (require.main === module) {
  deploymentExample().catch(console.error)
}

module.exports = { deploymentExample }
