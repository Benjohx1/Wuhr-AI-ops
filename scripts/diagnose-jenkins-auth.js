#!/usr/bin/env node

const { PrismaClient } = require('../lib/generated/prisma')

async function diagnoseJenkinsAuth() {
  console.log('🔍 诊断Jenkins认证问题...')
  
  const prisma = new PrismaClient()
  
  try {
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 获取指定的Jenkins配置
    const targetConfigId = 'cmczv7pj40001fr8453ukb4rr'
    const config = await prisma.jenkinsConfig.findUnique({
      where: { id: targetConfigId }
    })
    
    if (!config) {
      console.log(`❌ 未找到配置: ${targetConfigId}`)
      return
    }
    
    console.log('\n📋 Jenkins配置详细信息:')
    console.log(`   ID: ${config.id}`)
    console.log(`   名称: ${config.name}`)
    console.log(`   服务器: ${config.serverUrl}`)
    console.log(`   用户名: ${config.username}`)
    console.log(`   API Token长度: ${config.apiToken ? config.apiToken.length : 0}`)
    console.log(`   API Token前缀: ${config.apiToken ? config.apiToken.substring(0, 12) : '无'}`)
    console.log(`   包含冒号: ${config.apiToken ? config.apiToken.includes(':') : false}`)
    
    if (config.apiToken && config.apiToken.includes(':')) {
      const parts = config.apiToken.split(':')
      console.log(`   冒号分割后: ${parts.length} 部分`)
      console.log(`   第一部分: ${parts[0]}`)
      console.log(`   第二部分长度: ${parts[1] ? parts[1].length : 0}`)
    }
    
    // 分析认证格式
    console.log('\n🔐 认证格式分析:')
    
    let authString = ''
    let authMethod = ''
    
    if (config.apiToken && config.apiToken.includes(':')) {
      // 如果apiToken包含冒号，说明是 username:token 格式
      authString = config.apiToken
      authMethod = 'apiToken包含完整认证信息'
    } else if (config.username && config.apiToken) {
      // 如果分开存储，需要组合
      authString = `${config.username}:${config.apiToken}`
      authMethod = '用户名和Token分开存储'
    } else {
      console.log('❌ 认证信息不完整')
      return
    }
    
    console.log(`   认证方法: ${authMethod}`)
    console.log(`   认证字符串: ${authString}`)
    
    // 生成Base64编码
    const base64Auth = Buffer.from(authString).toString('base64')
    console.log(`   Base64编码: ${base64Auth}`)
    console.log(`   Authorization头: Basic ${base64Auth}`)
    
    // 测试Jenkins连接
    console.log('\n🌐 测试Jenkins连接...')
    
    const fetch = require('node-fetch')
    const testUrl = `${config.serverUrl}/api/json`
    
    console.log(`   测试URL: ${testUrl}`)
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${base64Auth}`,
          'Accept': 'application/json',
          'User-Agent': 'Wuhr-AI-Ops/1.0'
        },
        timeout: 15000
      })
      
      console.log(`   响应状态: ${response.status} ${response.statusText}`)
      console.log(`   响应头:`)
      for (const [key, value] of response.headers.entries()) {
        console.log(`     ${key}: ${value}`)
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Jenkins连接成功!')
        console.log(`   Jenkins版本: ${data.version || '未知'}`)
        console.log(`   节点名称: ${data.nodeName || '未知'}`)
        console.log(`   任务数量: ${data.jobs ? data.jobs.length : 0}`)
        
        if (data.jobs && data.jobs.length > 0) {
          console.log('   前3个任务:')
          data.jobs.slice(0, 3).forEach((job, index) => {
            console.log(`     ${index + 1}. ${job.name} (${job.color})`)
          })
        }
      } else {
        console.log('❌ Jenkins连接失败')
        const errorText = await response.text()
        console.log(`   错误响应: ${errorText.substring(0, 500)}`)
        
        // 分析常见错误
        if (response.status === 401) {
          console.log('\n🔍 401错误分析:')
          console.log('   可能原因:')
          console.log('   1. API Token已过期或无效')
          console.log('   2. 用户名不正确')
          console.log('   3. Jenkins安全配置问题')
          console.log('   4. 认证格式错误')
        }
      }
      
    } catch (fetchError) {
      console.log('❌ 网络连接失败:', fetchError.message)
      console.log('   可能原因:')
      console.log('   1. 网络连接问题')
      console.log('   2. 服务器地址错误')
      console.log('   3. 防火墙阻止')
      console.log('   4. SSL证书问题')
    }
    
  } catch (error) {
    console.error('❌ 诊断过程中出错:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n✅ 诊断完成')
  }
}

// 运行诊断
diagnoseJenkinsAuth()
