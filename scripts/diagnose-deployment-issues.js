#!/usr/bin/env node

/**
 * 部署问题诊断脚本
 * 帮助诊断和解决部署过程中的常见问题
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

async function executeCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 执行: ${command} ${args.join(' ')}`)
    
    const child = spawn(command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({ code, stdout, stderr })
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}

async function diagnoseDeploymentIssues() {
  console.log('🔍 部署问题诊断工具\n')

  console.log('📋 1. 检查Git连接')
  console.log('=' .repeat(50))

  // 测试Git连接
  const gitUrl = 'http://git.ope.ai:8999/component/voicechat2.git'
  console.log(`测试Git仓库连接: ${gitUrl}`)

  try {
    const result = await executeCommand('git', ['ls-remote', '--heads', gitUrl])
    
    if (result.code === 0) {
      console.log('✅ Git仓库连接正常')
      console.log('📋 可用分支:')
      const branches = result.stdout.split('\n')
        .filter(line => line.includes('refs/heads/'))
        .map(line => line.split('refs/heads/')[1])
        .filter(branch => branch)
      
      branches.forEach(branch => {
        console.log(`   - ${branch}`)
      })
    } else {
      console.log('❌ Git仓库连接失败')
      console.log('错误信息:', result.stderr)
    }
  } catch (error) {
    console.log('❌ Git命令执行失败:', error.message)
  }

  console.log('')
  console.log('📋 2. 检查Git输出处理')
  console.log('=' .repeat(50))

  // 模拟Git fetch输出
  const gitOutputs = [
    'From http://git.ope.ai:8999/component/voicechat2',
    'remote: Counting objects: 100, done.',
    'Receiving objects: 100% (100/100), done.',
    'fatal: repository not found',
    'error: failed to push some refs'
  ]

  gitOutputs.forEach(output => {
    const isNormalOutput = isGitNormalOutput(output)
    const status = isNormalOutput ? '✅ 正常输出' : '❌ 错误输出'
    console.log(`${status}: ${output}`)
  })

  console.log('')
  console.log('📋 3. 检查SSH连接（如果配置了远程主机）')
  console.log('=' .repeat(50))

  // 这里可以添加SSH连接测试
  console.log('💡 SSH连接测试建议:')
  console.log('1. 手动测试SSH连接:')
  console.log('   ssh user@your-host "echo \'SSH连接正常\'"')
  console.log('2. 检查SSH密钥:')
  console.log('   ssh-add -l')
  console.log('3. 测试免密码登录:')
  console.log('   ssh -o PasswordAuthentication=no user@your-host')

  console.log('')
  console.log('📋 4. 检查部署配置')
  console.log('=' .repeat(50))

  const sampleConfigs = {
    remoteProject: {
      useRemoteProject: true,
      remoteProjectPath: '/var/www/myapp',
      deployScript: 'npm ci --only=production && pm2 restart myapp'
    },
    traditional: {
      useRemoteProject: false,
      deployScript: 'systemctl restart myapp'
    }
  }

  console.log('✅ 推荐的远程项目目录配置:')
  console.log(JSON.stringify(sampleConfigs.remoteProject, null, 2))
  console.log('')
  console.log('✅ 传统传输模式配置:')
  console.log(JSON.stringify(sampleConfigs.traditional, null, 2))

  console.log('')
  console.log('📋 5. 常见问题解决方案')
  console.log('=' .repeat(50))

  console.log('🔧 问题1: Git输出被误判为错误')
  console.log('解决方案:')
  console.log('- 已修复：Git的"From ..."输出现在被正确识别为正常信息')
  console.log('- 进度信息不再被标记为错误')
  console.log('')

  console.log('🔧 问题2: 远程部署命令未执行')
  console.log('检查项目:')
  console.log('- useRemoteProject 是否设置为 true')
  console.log('- remoteProjectPath 是否正确配置')
  console.log('- 主机配置是否存在于数据库')
  console.log('- SSH连接是否正常')
  console.log('')

  console.log('🔧 问题3: 部署脚本执行失败')
  console.log('检查项目:')
  console.log('- 脚本语法是否正确')
  console.log('- 远程主机是否有必要的依赖')
  console.log('- 用户权限是否足够')
  console.log('- 环境变量是否正确设置')
  console.log('')

  console.log('📋 6. 调试建议')
  console.log('=' .repeat(50))

  console.log('🔍 启用详细日志:')
  console.log('- 查看部署执行器的详细输出')
  console.log('- 检查每个阶段的执行状态')
  console.log('- 关注SSH命令的具体执行')
  console.log('')

  console.log('🧪 分步测试:')
  console.log('1. 先测试Git操作:')
  console.log('   git clone http://git.ope.ai:8999/component/voicechat2.git test-repo')
  console.log('2. 再测试SSH连接:')
  console.log('   ssh user@host "pwd && ls -la"')
  console.log('3. 最后测试完整部署')
  console.log('')

  console.log('📝 日志分析:')
  console.log('- 查找"错误输出"标记的内容')
  console.log('- 确认是否为Git的正常输出')
  console.log('- 检查远程脚本执行的具体命令')
  console.log('- 验证部署脚本的执行结果')
  console.log('')

  console.log('✅ 诊断完成!')
  console.log('')
  console.log('🚀 下一步操作建议:')
  console.log('1. 根据诊断结果修复发现的问题')
  console.log('2. 使用测试配置验证修复效果')
  console.log('3. 逐步增加部署的复杂度')
  console.log('4. 建立监控和告警机制')
}

// Git正常输出判断函数（与部署执行器中的逻辑一致）
function isGitNormalOutput(output) {
  const normalPatterns = [
    /^From\s+https?:\/\//, // Git fetch的远程仓库信息
    /^From\s+git@/, // SSH方式的远程仓库信息
    /^\s*\*\s+\[new branch\]/, // 新分支信息
    /^\s*\*\s+branch\s+/, // 分支信息
    /^remote:\s+/, // 远程仓库信息
    /^Receiving objects:/, // 接收对象进度
    /^Resolving deltas:/, // 解析增量进度
    /^Counting objects:/, // 计算对象进度
    /^Compressing objects:/, // 压缩对象进度
    /^\d+%\s+\(\d+\/\d+\)/, // 进度百分比
    /^Total\s+\d+/, // 总计信息
    /^Unpacking objects:/, // 解包对象
    /^Already up to date/, // 已经是最新
    /^Already up-to-date/, // 已经是最新（旧版本Git）
    /^Fast-forward/, // 快进合并
    /^Updating\s+[a-f0-9]+\.\.[a-f0-9]+/, // 更新提交范围
    /^\s+[a-f0-9]+\.\.[a-f0-9]+\s+/, // 提交范围
    /^HEAD is now at/, // HEAD位置信息
    /^Switched to branch/, // 切换分支
    /^Switched to a new branch/, // 切换到新分支
    /^Your branch is up to date/, // 分支是最新的
    /^Note:/, // Git提示信息
    /^hint:/, // Git提示信息
    /^warning: redirecting to/, // 重定向警告（通常不是错误）
  ]

  return normalPatterns.some(pattern => pattern.test(output.trim()))
}

// 如果直接运行此脚本
if (require.main === module) {
  diagnoseDeploymentIssues().catch(console.error)
}

module.exports = { diagnoseDeploymentIssues }
