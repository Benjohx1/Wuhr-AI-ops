#!/usr/bin/env node

/**
 * Git认证问题诊断脚本
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

async function executeCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 执行命令: ${command} ${args.join(' ')}`)
    
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
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`命令执行失败 (退出码: ${code}): ${stderr}`))
      }
    })

    child.on('error', (error) => {
      reject(new Error(`命令执行异常: ${error.message}`))
    })
  })
}

async function diagnoseGitAuth() {
  console.log('🔍 开始Git认证问题诊断...')
  
  try {
    // 1. 检查环境变量
    console.log('\n📋 步骤1: 检查环境变量')
    const gitUsername = process.env.GIT_USERNAME
    const gitToken = process.env.GIT_TOKEN
    const githubToken = process.env.GITHUB_TOKEN
    const gitlabToken = process.env.GITLAB_TOKEN
    
    console.log(`GIT_USERNAME: ${gitUsername ? '✅ 已设置' : '❌ 未设置'}`)
    console.log(`GIT_TOKEN: ${gitToken ? '✅ 已设置' : '❌ 未设置'}`)
    console.log(`GITHUB_TOKEN: ${githubToken ? '✅ 已设置' : '❌ 未设置'}`)
    console.log(`GITLAB_TOKEN: ${gitlabToken ? '✅ 已设置' : '❌ 未设置'}`)
    
    // 2. 检查.env文件
    console.log('\n📋 步骤2: 检查.env文件')
    const envPath = path.join(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      console.log('✅ .env文件存在')
      const envContent = fs.readFileSync(envPath, 'utf8')
      
      const hasGitUsername = envContent.includes('GIT_USERNAME=')
      const hasGitToken = envContent.includes('GIT_TOKEN=')
      
      console.log(`GIT_USERNAME配置: ${hasGitUsername ? '✅ 存在' : '❌ 缺失'}`)
      console.log(`GIT_TOKEN配置: ${hasGitToken ? '✅ 存在' : '❌ 缺失'}`)
    } else {
      console.log('❌ .env文件不存在')
      console.log('💡 建议: 复制.env.example为.env并配置认证信息')
    }
    
    // 3. 测试Git连接
    console.log('\n📋 步骤3: 测试Git连接')
    
    // 测试仓库URL
    const testRepoUrl = 'http://git.ope.ai:8999/component/voicechat2.git'
    console.log(`测试仓库: ${testRepoUrl}`)
    
    // 测试无认证访问
    console.log('\n🔍 测试无认证访问...')
    try {
      const tempDir = path.join(process.cwd(), 'temp-git-test')
      if (fs.existsSync(tempDir)) {
        await executeCommand('rm', ['-rf', tempDir])
      }
      
      await executeCommand('git', ['clone', '--depth', '1', testRepoUrl, tempDir])
      console.log('✅ 无认证访问成功')
      
      // 清理测试目录
      await executeCommand('rm', ['-rf', tempDir])
    } catch (error) {
      console.log('❌ 无认证访问失败')
      console.log(`错误: ${error.message}`)
    }
    
    // 测试认证访问
    if (gitUsername && gitToken) {
      console.log('\n🔍 测试认证访问...')
      try {
        const authUrl = testRepoUrl.replace('http://', `http://${encodeURIComponent(gitUsername)}:${encodeURIComponent(gitToken)}@`)
        const tempDir = path.join(process.cwd(), 'temp-git-auth-test')
        
        if (fs.existsSync(tempDir)) {
          await executeCommand('rm', ['-rf', tempDir])
        }
        
        await executeCommand('git', ['clone', '--depth', '1', authUrl, tempDir])
        console.log('✅ 认证访问成功')
        
        // 清理测试目录
        await executeCommand('rm', ['-rf', tempDir])
      } catch (error) {
        console.log('❌ 认证访问失败')
        console.log(`错误: ${error.message}`)
      }
    } else {
      console.log('⚠️ 跳过认证测试（缺少认证信息）')
    }
    
    // 4. 检查网络连接
    console.log('\n📋 步骤4: 检查网络连接')
    try {
      const { exec } = require('child_process')
      const util = require('util')
      const execPromise = util.promisify(exec)
      
      const { stdout } = await execPromise('curl -I http://git.ope.ai:8999 --connect-timeout 10')
      console.log('✅ 网络连接正常')
      console.log('服务器响应头:', stdout.split('\n')[0])
    } catch (error) {
      console.log('❌ 网络连接失败')
      console.log(`错误: ${error.message}`)
    }
    
    // 5. 生成修复建议
    console.log('\n📋 步骤5: 修复建议')
    
    if (!gitUsername || !gitToken) {
      console.log('\n🔧 建议1: 配置Git认证信息')
      console.log('在.env文件中添加:')
      console.log('GIT_USERNAME=your-actual-username')
      console.log('GIT_TOKEN=your-actual-token')
      console.log('')
      console.log('然后重启应用: npm run dev')
    }
    
    console.log('\n🔧 建议2: 检查Token权限')
    console.log('确保您的Git Token具有以下权限:')
    console.log('- 读取仓库权限')
    console.log('- 克隆权限')
    console.log('- 如果是组织仓库，确保有组织访问权限')
    
    console.log('\n🔧 建议3: 联系Git管理员')
    console.log('如果问题仍然存在，请联系Git服务器管理员确认:')
    console.log('- 服务器是否正常运行')
    console.log('- 您的账户是否有访问权限')
    console.log('- 仓库是否存在且可访问')
    
    console.log('\n✅ 诊断完成')
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error.message)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  diagnoseGitAuth()
}

module.exports = { diagnoseGitAuth }
