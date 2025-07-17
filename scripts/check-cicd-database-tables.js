const { PrismaClient } = require('../lib/generated/prisma')

async function checkCICDDatabaseTables() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 检查CI/CD相关数据库表的使用情况...\n')
    
    // 检查CI/CD项目表
    console.log('📊 CICDProject表分析:')
    const projectCount = await prisma.cICDProject.count()
    console.log(`  - 总项目数: ${projectCount}`)
    
    if (projectCount > 0) {
      const recentProjects = await prisma.cICDProject.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          environment: true,
          isActive: true,
          updatedAt: true,
          _count: {
            select: { 
              deployments: true,
              pipelines: true,
              jenkinsConfigs: true
            }
          }
        }
      })
      
      console.log('  - 最近的项目:')
      recentProjects.forEach(project => {
        console.log(`    * ${project.name} (${project.environment}) - 部署:${project._count.deployments}, 流水线:${project._count.pipelines}, Jenkins:${project._count.jenkinsConfigs}`)
      })
    }
    
    // 检查Jenkins配置表
    console.log('\n📊 JenkinsConfig表分析:')
    const jenkinsCount = await prisma.jenkinsConfig.count()
    console.log(`  - 总配置数: ${jenkinsCount}`)
    
    if (jenkinsCount > 0) {
      const jenkinsStats = await prisma.jenkinsConfig.groupBy({
        by: ['testStatus'],
        _count: { testStatus: true }
      })
      
      console.log('  - 按测试状态分组:')
      jenkinsStats.forEach(stat => {
        console.log(`    * ${stat.testStatus || '未测试'}: ${stat._count.testStatus}个`)
      })
      
      const activeJenkins = await prisma.jenkinsConfig.count({
        where: { isActive: true }
      })
      console.log(`  - 活跃配置: ${activeJenkins}个`)
    }
    
    // 检查部署表
    console.log('\n📊 Deployment表分析:')
    const deploymentCount = await prisma.deployment.count()
    console.log(`  - 总部署数: ${deploymentCount}`)
    
    if (deploymentCount > 0) {
      const deploymentStats = await prisma.deployment.groupBy({
        by: ['status'],
        _count: { status: true }
      })
      
      console.log('  - 按状态分组:')
      deploymentStats.forEach(stat => {
        console.log(`    * ${stat.status}: ${stat._count.status}个`)
      })
      
      const envStats = await prisma.deployment.groupBy({
        by: ['environment'],
        _count: { environment: true }
      })
      
      console.log('  - 按环境分组:')
      envStats.forEach(stat => {
        console.log(`    * ${stat.environment}: ${stat._count.environment}个`)
      })
    }
    
    // 检查构建表
    console.log('\n📊 Build表分析:')
    const buildCount = await prisma.build.count()
    console.log(`  - 总构建数: ${buildCount}`)
    
    if (buildCount > 0) {
      const buildStats = await prisma.build.groupBy({
        by: ['status'],
        _count: { status: true }
      })
      
      console.log('  - 按状态分组:')
      buildStats.forEach(stat => {
        console.log(`    * ${stat.status}: ${stat._count.status}个`)
      })
    }
    
    // 检查流水线表
    console.log('\n📊 Pipeline表分析:')
    const pipelineCount = await prisma.pipeline.count()
    console.log(`  - 总流水线数: ${pipelineCount}`)
    
    if (pipelineCount > 0) {
      const activePipelines = await prisma.pipeline.count({
        where: { isActive: true }
      })
      console.log(`  - 活跃流水线: ${activePipelines}个`)
    }
    
    // 检查审批表
    console.log('\n📊 DeploymentApproval表分析:')
    const approvalCount = await prisma.deploymentApproval.count()
    console.log(`  - 总审批数: ${approvalCount}`)
    
    if (approvalCount > 0) {
      const approvalStats = await prisma.deploymentApproval.groupBy({
        by: ['status'],
        _count: { status: true }
      })
      
      console.log('  - 按状态分组:')
      approvalStats.forEach(stat => {
        console.log(`    * ${stat.status}: ${stat._count.status}个`)
      })
    }
    
    // 检查审批工作流表
    console.log('\n📊 ApprovalWorkflow表分析:')
    const workflowCount = await prisma.approvalWorkflow.count()
    console.log(`  - 总工作流数: ${workflowCount}`)
    
    if (workflowCount > 0) {
      const activeWorkflows = await prisma.approvalWorkflow.count({
        where: { isActive: true }
      })
      console.log(`  - 活跃工作流: ${activeWorkflows}个`)
    }
    
    // 分析数据完整性
    console.log('\n📈 数据完整性分析:')
    
    // 检查孤立的部署任务（没有关联项目）
    const orphanedDeployments = await prisma.deployment.count({
      where: {
        projectId: {
          notIn: await prisma.cICDProject.findMany({
            select: { id: true }
          }).then(projects => projects.map(p => p.id))
        }
      }
    })

    if (orphanedDeployments > 0) {
      console.log(`⚠️  发现 ${orphanedDeployments} 个孤立的部署任务（没有关联项目）`)
    } else {
      console.log('✅ 所有部署任务都有关联项目')
    }

    // 检查孤立的构建记录（没有关联Jenkins配置）
    const orphanedBuilds = await prisma.build.count({
      where: {
        jenkinsConfigId: {
          notIn: await prisma.jenkinsConfig.findMany({
            select: { id: true }
          }).then(configs => configs.map(c => c.id))
        }
      }
    })

    if (orphanedBuilds > 0) {
      console.log(`⚠️  发现 ${orphanedBuilds} 个孤立的构建记录（没有关联Jenkins配置）`)
    } else {
      console.log('✅ 所有构建记录都有关联Jenkins配置')
    }

    // 检查孤立的流水线（没有关联项目）
    const orphanedPipelines = await prisma.pipeline.count({
      where: {
        projectId: {
          notIn: await prisma.cICDProject.findMany({
            select: { id: true }
          }).then(projects => projects.map(p => p.id))
        }
      }
    })

    if (orphanedPipelines > 0) {
      console.log(`⚠️  发现 ${orphanedPipelines} 个孤立的流水线（没有关联项目）`)
    } else {
      console.log('✅ 所有流水线都有关联项目')
    }
    
    // 总结
    console.log('\n📋 总结:')
    const totalRecords = projectCount + jenkinsCount + deploymentCount + buildCount + pipelineCount + approvalCount + workflowCount
    console.log(`总记录数: ${totalRecords}`)
    
    if (totalRecords === 0) {
      console.log('💡 建议: 数据库中没有CI/CD数据，可以考虑清理相关的空表或保留用于未来使用')
    } else {
      console.log('💡 建议: CI/CD功能正在使用中，数据库表应该保留')
    }
    
    console.log('\n✅ 检查完成')
    
  } catch (error) {
    console.error('❌ 检查失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCICDDatabaseTables()
