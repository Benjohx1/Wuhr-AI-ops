#!/usr/bin/env node

const { PrismaClient } = require('../lib/generated/prisma')

async function fixJenkinsConfigFormat() {
  console.log('🔧 修复Jenkins配置格式...')
  
  const prisma = new PrismaClient()
  
  try {
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 获取所有Jenkins配置
    const configs = await prisma.jenkinsConfig.findMany({
      select: {
        id: true,
        name: true,
        serverUrl: true,
        username: true,
        apiToken: true
      }
    })
    
    console.log(`\n📋 找到 ${configs.length} 个Jenkins配置`)
    
    for (const config of configs) {
      console.log(`\n🔍 检查配置: ${config.name} (${config.id})`)
      console.log(`   用户名: ${config.username}`)
      console.log(`   Token格式: ${config.apiToken ? config.apiToken.substring(0, 8) + '...' : '无'}`)
      console.log(`   包含冒号: ${config.apiToken ? config.apiToken.includes(':') : false}`)
      
      let needsUpdate = false
      let newApiToken = config.apiToken
      
      // 检查是否需要修复格式
      if (config.username && config.apiToken && !config.apiToken.includes(':')) {
        // 格式2 -> 格式1: 将分开的username和token合并
        newApiToken = `${config.username}:${config.apiToken}`
        needsUpdate = true
        console.log(`   ✅ 需要修复: 合并为 ${config.username}:${config.apiToken.substring(0, 4)}***`)
      } else if (config.apiToken && config.apiToken.includes(':')) {
        console.log(`   ✅ 格式正确: 已包含用户名`)
      } else {
        console.log(`   ❌ 配置不完整: 缺少用户名或Token`)
        continue
      }
      
      if (needsUpdate) {
        try {
          await prisma.jenkinsConfig.update({
            where: { id: config.id },
            data: { apiToken: newApiToken }
          })
          console.log(`   ✅ 配置已更新`)
        } catch (updateError) {
          console.log(`   ❌ 更新失败:`, updateError.message)
        }
      }
    }
    
    console.log('\n🎯 修复完成！重新检查所有配置...')
    
    // 重新检查所有配置
    const updatedConfigs = await prisma.jenkinsConfig.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        apiToken: true
      }
    })
    
    console.log('\n📋 修复后的配置状态:')
    updatedConfigs.forEach((config, index) => {
      const hasColon = config.apiToken ? config.apiToken.includes(':') : false
      const status = hasColon ? '✅ 正确' : '❌ 错误'
      console.log(`   ${index + 1}. ${config.name}: ${status}`)
      
      if (hasColon && config.apiToken) {
        const parts = config.apiToken.split(':')
        console.log(`      用户名: ${parts[0]}`)
        console.log(`      Token长度: ${parts[1] ? parts[1].length : 0}`)
      }
    })
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n✅ 修复完成')
  }
}

// 运行修复
fixJenkinsConfigFormat()
