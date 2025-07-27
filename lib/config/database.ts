import { PrismaClient } from '../generated/prisma';

// 全局单例Prisma客户端 - 最简化版本
let globalPrisma: PrismaClient | undefined;

class MinimalDatabaseManager {
  private static instance: MinimalDatabaseManager;

  private constructor() {}

  public static getInstance(): MinimalDatabaseManager {
    if (!MinimalDatabaseManager.instance) {
      MinimalDatabaseManager.instance = new MinimalDatabaseManager();
    }
    return MinimalDatabaseManager.instance;
  }

  private buildConnectionString(): string {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '5432';
    const database = process.env.DB_NAME || 'wuhr_ai_ops';
    const username = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || '';

    // 最简化的连接字符串，只设置必要参数
    const params = new URLSearchParams();
    params.set('connect_timeout', '10'); // 减少连接超时
    params.set('connection_limit', '1'); // 极限降级到1个连接
    params.set('application_name', 'wuhr_ai_ops_minimal');

    const paramString = params.toString();
    return `postgresql://${username}:${password}@${host}:${port}/${database}?${paramString}`;
  }

  public async getClient(): Promise<PrismaClient> {
    if (!globalPrisma) {
      await this.createClient();
    }
    return globalPrisma!;
  }

  private async createClient(): Promise<void> {
    try {
      const connectionString = this.buildConnectionString();

      globalPrisma = new PrismaClient({
        datasources: {
          db: {
            url: connectionString,
          },
        },
        log: ['error'], // 只记录错误
        errorFormat: 'minimal',
      });

      console.log('🔧 数据库连接池配置: connection_limit=1 (极限降级)');
      console.log('✅ Minimal database client initialized');

    } catch (error) {
      console.error('❌ 创建数据库连接失败:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (globalPrisma) {
      await globalPrisma.$disconnect();
      globalPrisma = undefined;
      console.log('🔌 数据库连接已断开');
    }
  }
}

// 导出单例实例
export const minimalDb = MinimalDatabaseManager.getInstance();

// 导出Prisma客户端获取函数
export const getPrismaClient = async (): Promise<PrismaClient> => {
  return await minimalDb.getClient();
};

// 进程退出时优雅关闭
process.on('beforeExit', async () => {
  await minimalDb.disconnect();
});

process.on('SIGINT', async () => {
  await minimalDb.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await minimalDb.disconnect();
  process.exit(0);
});
