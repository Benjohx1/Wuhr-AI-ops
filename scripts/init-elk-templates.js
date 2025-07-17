const { PrismaClient } = require('../lib/generated/prisma');

async function initializeELKTemplates() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 初始化ELK仪表板模板...');
    
    // 检查是否已有模板
    const existingTemplates = await prisma.kibanaDashboard.findMany({
      where: { isTemplate: true }
    });
    
    if (existingTemplates.length > 0) {
      console.log('⚠️ 模板已存在，跳过初始化');
      return;
    }
    
    // 创建系统管理员用户（如果不存在）
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@wuhr.ai' }
    });
    
    if (!adminUser) {
      console.log('❌ 未找到管理员用户，请先创建管理员用户');
      return;
    }
    
    // 预设模板数据
    const templates = [
      {
        name: '系统监控仪表板模板',
        description: '监控系统性能、错误日志和关键指标的标准模板',
        category: 'system',
        tags: ['monitoring', 'system', 'performance', 'template'],
        isTemplate: true,
        userId: adminUser.id,
        config: {
          layout: {
            panels: [
              {
                id: 'error-logs',
                type: 'logs',
                title: '错误日志',
                position: { x: 0, y: 0, w: 6, h: 4 },
                config: {
                  query: 'level:ERROR',
                  timeRange: { from: 'now-1h', to: 'now' },
                  columns: ['@timestamp', 'level', 'message', 'source']
                }
              },
              {
                id: 'log-levels',
                type: 'pie',
                title: '日志级别分布',
                position: { x: 6, y: 0, w: 3, h: 4 },
                config: {
                  aggregation: {
                    field: 'level',
                    type: 'terms'
                  }
                }
              },
              {
                id: 'timeline',
                type: 'histogram',
                title: '日志时间线',
                position: { x: 9, y: 0, w: 3, h: 4 },
                config: {
                  aggregation: {
                    field: '@timestamp',
                    type: 'date_histogram',
                    interval: '5m'
                  }
                }
              }
            ],
            grid: { columns: 12, rows: 10 }
          },
          filters: [
            { field: 'level', operator: 'exists', value: true }
          ],
          timeRange: { from: 'now-1h', to: 'now' },
          refreshInterval: 30000
        }
      },
      {
        name: '应用程序日志模板',
        description: '专注于应用程序日志分析和调试的模板',
        category: 'application',
        tags: ['application', 'debug', 'logs', 'template'],
        isTemplate: true,
        userId: adminUser.id,
        config: {
          layout: {
            panels: [
              {
                id: 'app-errors',
                type: 'logs',
                title: '应用程序错误',
                position: { x: 0, y: 0, w: 8, h: 5 },
                config: {
                  query: 'level:(ERROR OR FATAL) AND source:application',
                  timeRange: { from: 'now-2h', to: 'now' },
                  columns: ['@timestamp', 'level', 'message', 'stack_trace']
                }
              },
              {
                id: 'error-count',
                type: 'metric',
                title: '错误计数',
                position: { x: 8, y: 0, w: 2, h: 2 },
                config: {
                  aggregation: {
                    type: 'count',
                    filter: 'level:(ERROR OR FATAL)'
                  }
                }
              }
            ],
            grid: { columns: 12, rows: 10 }
          },
          filters: [
            { field: 'source', operator: 'is', value: 'application' }
          ],
          timeRange: { from: 'now-1h', to: 'now' },
          refreshInterval: 15000
        }
      },
      {
        name: '安全审计模板',
        description: '安全事件监控和审计日志分析模板',
        category: 'security',
        tags: ['security', 'audit', 'monitoring', 'template'],
        isTemplate: true,
        userId: adminUser.id,
        config: {
          layout: {
            panels: [
              {
                id: 'security-events',
                type: 'logs',
                title: '安全事件',
                position: { x: 0, y: 0, w: 6, h: 5 },
                config: {
                  query: 'category:security OR type:auth OR type:login',
                  timeRange: { from: 'now-24h', to: 'now' },
                  columns: ['@timestamp', 'event_type', 'user', 'ip_address', 'result']
                }
              },
              {
                id: 'failed-logins',
                type: 'logs',
                title: '登录失败',
                position: { x: 6, y: 0, w: 6, h: 5 },
                config: {
                  query: 'type:login AND result:failed',
                  timeRange: { from: 'now-24h', to: 'now' },
                  columns: ['@timestamp', 'user', 'ip_address', 'reason']
                }
              }
            ],
            grid: { columns: 12, rows: 10 }
          },
          filters: [
            { field: 'category', operator: 'is', value: 'security' }
          ],
          timeRange: { from: 'now-24h', to: 'now' },
          refreshInterval: 60000
        }
      }
    ];
    
    // 创建模板
    for (const template of templates) {
      const created = await prisma.kibanaDashboard.create({
        data: template
      });
      console.log(`✅ 创建模板: ${created.name}`);
    }
    
    console.log('🎉 ELK仪表板模板初始化完成');
    
  } catch (error) {
    console.error('❌ 初始化ELK模板失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeELKTemplates();
}

module.exports = { initializeELKTemplates };
