#!/usr/bin/env node

/**
 * 调试部署卡住问题
 * 帮助排查部署在Git阶段后停止的原因
 */

const { DeploymentExecutor } = require('../lib/deployment/deploymentExecutor')

// 创建一个调试版本的部署执行器
class DebugDeploymentExecutor extends DeploymentExecutor {
  constructor() {
    super()
    this.debugMode = true
  }

  // 重写log方法，添加更详细的调试信息
  log(message) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}`
    this.logs.push(logMessage)
    console.log(`[DEBUG] ${logMessage}`)
  }

  // 重写execute方法，添加详细的阶段跟踪
  async execute(config) {
    const startTime = Date.now()
    
    try {
      this.log('🚀 [DEBUG] 开始完整部署流程...')
      this.log(`🔍 [DEBUG] 部署配置: ${JSON.stringify(config, null, 2)}`)

      // 阶段1: 准备工作目录
      this.log('📋 [DEBUG] === 阶段1: 准备工作目录 ===')
      await this.prepareWorkingDirectory()
      this.log('✅ [DEBUG] 阶段1完成')

      // 阶段2: 代码拉取
      this.log('📋 [DEBUG] === 阶段2: 代码拉取 ===')
      if (config.repositoryUrl) {
        try {
          this.log(`🔍 [DEBUG] 开始拉取代码: ${config.repositoryUrl}`)
          await this.pullCode(config)
          this.log('✅ [DEBUG] 代码拉取成功')
        } catch (error) {
          this.log(`❌ [DEBUG] 代码拉取失败: ${error instanceof Error ? error.message : '未知错误'}`)
          this.log(`🔍 [DEBUG] 错误堆栈: ${error instanceof Error ? error.stack : '无堆栈信息'}`)
          this.log('⚠️ [DEBUG] 跳过代码拉取，继续执行后续阶段...')

          // 创建一个空的代码目录以便后续阶段可以继续
          if (!require('fs').existsSync(this.codeDir)) {
            require('fs').mkdirSync(this.codeDir, { recursive: true })
            this.log('📁 [DEBUG] 创建空代码目录以继续部署流程')
          }
        }
      } else {
        this.log('⚠️ [DEBUG] 未配置Git仓库，跳过代码拉取阶段')
      }
      this.log('✅ [DEBUG] 阶段2完成')

      // 阶段3: 本地构建
      this.log('📋 [DEBUG] === 阶段3: 本地构建 ===')
      if (config.buildScript) {
        this.log(`🔍 [DEBUG] 开始本地构建: ${config.buildScript}`)
        await this.buildLocally(config)
        this.log('✅ [DEBUG] 本地构建成功')
      } else {
        this.log('⚠️ [DEBUG] 未配置构建脚本，跳过构建阶段')
      }
      this.log('✅ [DEBUG] 阶段3完成')

      // 阶段4: 远程部署
      this.log('📋 [DEBUG] === 阶段4: 远程部署 ===')
      this.log('📋 [DEBUG] 检查部署配置...')
      this.log(`🔧 [DEBUG] 部署脚本: ${config.deployScript ? '已配置' : '未配置'}`)
      this.log(`🔧 [DEBUG] 部署脚本内容: ${config.deployScript || '无'}`)
      this.log(`🎯 [DEBUG] 目标主机: ${config.hostId}`)
      this.log(`🏠 [DEBUG] 使用远程项目模式: ${config.useRemoteProject ? '是' : '否'}`)
      if (config.useRemoteProject && config.remoteProjectPath) {
        this.log(`📂 [DEBUG] 远程项目路径: ${config.remoteProjectPath}`)
      }

      if (config.deployScript) {
        this.log('🚀 [DEBUG] 开始远程部署阶段...')
        try {
          await this.deployRemotely(config)
          this.log('✅ [DEBUG] 远程部署阶段完成')
        } catch (error) {
          this.log(`❌ [DEBUG] 远程部署失败: ${error instanceof Error ? error.message : '未知错误'}`)
          this.log(`🔍 [DEBUG] 远程部署错误堆栈: ${error instanceof Error ? error.stack : '无堆栈信息'}`)
          throw error
        }
      } else {
        this.log('⚠️ [DEBUG] 未配置部署脚本，跳过部署阶段')
        this.log('💡 [DEBUG] 提示：请在项目配置中添加部署脚本以启用自动部署')
      }
      this.log('✅ [DEBUG] 阶段4完成')

      // 阶段5: 验证部署
      this.log('📋 [DEBUG] === 阶段5: 验证部署 ===')
      try {
        await this.verifyDeployment()
        this.log('✅ [DEBUG] 部署验证完成')
      } catch (error) {
        this.log(`⚠️ [DEBUG] 部署验证失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
      this.log('✅ [DEBUG] 阶段5完成')

      // 阶段6: 清理工作目录
      this.log('📋 [DEBUG] === 阶段6: 清理工作目录 ===')
      try {
        await this.cleanup()
        this.log('✅ [DEBUG] 清理完成')
      } catch (error) {
        this.log(`⚠️ [DEBUG] 清理失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
      this.log('✅ [DEBUG] 阶段6完成')

      const duration = Date.now() - startTime
      this.log(`🎉 [DEBUG] 完整部署流程成功完成，总耗时: ${Math.round(duration / 1000)}秒`)

      return {
        success: true,
        logs: this.logs.join('\n'),
        duration
      }

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      
      this.log(`❌ [DEBUG] 部署流程失败: ${errorMessage}`)
      this.log(`🔍 [DEBUG] 错误堆栈: ${error instanceof Error ? error.stack : '无堆栈信息'}`)

      return {
        success: false,
        logs: this.logs.join('\n'),
        duration,
        error: errorMessage
      }
    }
  }
}

async function debugDeploymentStuck() {
  console.log('🔍 调试部署卡住问题\n')

  // 创建测试配置
  const testConfig = {
    deploymentId: 'debug-test-001',
    hostId: 'test-server',
    repositoryUrl: 'http://git.ope.ai:8999/component/voicechat2.git',
    branch: 'main',
    buildScript: undefined, // 先不设置构建脚本
    deployScript: 'echo "测试部署脚本" && pwd && ls -la', // 简单的测试脚本
    useRemoteProject: true,
    remoteProjectPath: '/tmp/test-deployment',
    environment: {
      NODE_ENV: 'test'
    }
  }

  console.log('📋 测试配置:')
  console.log(JSON.stringify(testConfig, null, 2))
  console.log('')

  console.log('🚀 开始调试执行...')
  console.log('=' .repeat(60))

  const debugExecutor = new DebugDeploymentExecutor()
  
  try {
    const result = await debugExecutor.execute(testConfig)
    
    console.log('')
    console.log('📋 执行结果:')
    console.log('=' .repeat(60))
    console.log(`成功: ${result.success}`)
    console.log(`耗时: ${result.duration}ms`)
    if (result.error) {
      console.log(`错误: ${result.error}`)
    }
    
  } catch (error) {
    console.log('')
    console.log('❌ 调试执行失败:')
    console.log('=' .repeat(60))
    console.error(error)
  }

  console.log('')
  console.log('🔍 问题排查指南:')
  console.log('=' .repeat(60))
  console.log('1. 检查日志中是否有"阶段4: 远程部署"的开始标记')
  console.log('2. 确认deployScript是否已配置')
  console.log('3. 查看是否有异常被捕获但未正确处理')
  console.log('4. 检查主机配置是否存在')
  console.log('5. 验证SSH连接是否正常')
  console.log('')
  
  console.log('💡 常见原因:')
  console.log('- deployScript未配置或为空')
  console.log('- 主机配置不存在')
  console.log('- SSH连接失败')
  console.log('- 异步操作未正确等待')
  console.log('- 异常被静默捕获')
  console.log('')

  console.log('🔧 建议检查:')
  console.log('1. 确认部署配置中包含deployScript')
  console.log('2. 检查主机配置是否正确')
  console.log('3. 手动测试SSH连接')
  console.log('4. 查看完整的错误日志')
}

// 如果直接运行此脚本
if (require.main === module) {
  debugDeploymentStuck().catch(console.error)
}

module.exports = { debugDeploymentStuck, DebugDeploymentExecutor }
