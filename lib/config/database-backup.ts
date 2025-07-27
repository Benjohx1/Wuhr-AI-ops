import { PrismaClient } from '../generated/prisma';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  minConnections: number;      // 最小连接数
  maxConnections: number;      // 最大连接数
  initialConnections: number;  // 初始连接数
  connectionTimeout: number;   // 连接超时（毫秒）
  idleTimeout: number;         // 空闲超时（毫秒）
}

export interface PrismaConfig {
  datasources: {
    db: {
      url: string;
    };
  };
  log: ('query' | 'info' | 'warn' | 'error')[];
}

// 全局单例Prisma客户端
let globalPrisma: PrismaClient | undefined;

// 移除自定义连接池状态追踪，使用Prisma内置管理
// let connectionPoolStats = {
//   // 已移除自定义连接池状态追踪
// };

class DatabaseManager {
  private static instance: DatabaseManager;
  private config: DatabaseConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private loadConfig(): DatabaseConfig {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'wuhr_ai_ops',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true',
      minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '1'),        // 最小连接数：1（紧急降级）
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '3'),       // 最大连接数：3（紧急降级）
      initialConnections: parseInt(process.env.DB_INITIAL_CONNECTIONS || '1'), // 初始连接数：1（紧急降级）
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'), // 连接超时：10秒
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '300000'),         // 空闲超时：5分钟
    };
  }

  private buildConnectionString(): string {
    const { host, port, database, username, password, ssl } = this.config;

    // 构建基础连接字符串，添加连接池参数
    const params = new URLSearchParams()
    if (ssl) params.set('sslmode', 'require')

    // 连接池设置，支持3个连接（紧急降级）
    params.set('connect_timeout', '30') // 30秒连接超时
    params.set('connection_limit', '3') // 限制连接数为3（紧急降级）
    params.set('application_name', 'wuhr_ai_ops')

    const paramString = params.toString()
    return `postgresql://${username}:${password}@${host}:${port}/${database}${paramString ? '?' + paramString : ''}`;
  }

  public async getClient(): Promise<PrismaClient> {
    if (!globalPrisma) {
      const connectionString = this.buildConnectionString();

      // 设置连接池环境变量
      process.env.DATABASE_CONNECTION_LIMIT = this.config.maxConnections.toString()
      process.env.DATABASE_MIN_CONNECTIONS = this.config.minConnections.toString()
      process.env.DATABASE_INITIAL_CONNECTIONS = this.config.initialConnections.toString()
      process.env.DATABASE_POOL_TIMEOUT = Math.floor(this.config.connectionTimeout / 1000).toString()
      process.env.DATABASE_IDLE_TIMEOUT = this.config.idleTimeout.toString()

      globalPrisma = new PrismaClient({
        datasources: {
          db: {
            url: connectionString,
          },
        },
        log: process.env.NODE_ENV === 'development'
          ? ['warn', 'error']  // 减少日志输出
          : ['error'],
        errorFormat: 'minimal',
        // 添加连接池配置
        __internal: {
          engine: {
            connectTimeout: this.config.connectionTimeout,
            queryTimeout: 30000,
          }
        }
      } as any);

      // 移除自定义连接池监控，使用Prisma内置管理
      // this.setupConnectionPoolMonitoring();

      // 移除自定义连接池事件监听，使用Prisma内置管理
      // this.setupConnectionPoolEvents();

      // 简化配置输出
      console.log('🔧 数据库连接池配置: connection_limit=3 (紧急降级)');

      // 移除连接测试，避免额外连接创建
      // await this.testConnection();

      console.log('✅ Database client initialized (no test)');
    }

    // 移除健康检查，避免恶性循环
    // 健康检查会导致更多连接创建，暂时禁用

    return globalPrisma;
  }

  // 重置连接池
  private async resetConnectionPool(): Promise<void> {
    try {
      if (globalPrisma) {
        console.log('🔄 断开现有连接...');
        await globalPrisma.$disconnect();
        globalPrisma = undefined;
      }

      // 等待连接完全关闭
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('🔄 重新创建连接池...');
      // 递归调用getClient来重新创建连接
      const connectionString = this.buildConnectionString();

      globalPrisma = new PrismaClient({
        datasources: {
          db: {
            url: connectionString,
          },
        },
        log: ['error'],
        errorFormat: 'minimal',
      });

      await this.testConnection();
      console.log('✅ 连接池重置完成');

    } catch (error) {
      console.error('❌ 重置连接池失败:', error);
      throw error;
    }
  }

  // 移除自定义连接池监控，使用Prisma内置管理
  // private setupConnectionPoolMonitoring(): void {
  //   // 已移除自定义连接池监控逻辑
  // }

  // 移除自定义连接池健康检查，使用Prisma内置管理
  // private async checkConnectionPoolHealth(): Promise<void> {
  //   // 已移除自定义连接池健康检查逻辑
  // }

  // 移除自定义连接池清理逻辑，使用Prisma内置管理
  // private async cleanupConnectionPool(): Promise<void> {
  //   // 已移除自定义连接池清理逻辑
  // }

  // 移除自定义空闲连接清理逻辑，使用Prisma内置管理
  // private async forceCleanupIdleConnections(): Promise<void> {
  //   // 已移除自定义空闲连接清理逻辑
  // }

  // 移除自定义连接检查和预热逻辑，使用Prisma内置管理
  // private async checkInitialConnectionCount(): Promise<void> {
  //   // 已移除自定义连接检查逻辑
  // }

  // private async warmupConnectionPool(): Promise<void> {
  //   // 已移除自定义连接池预热逻辑
  // }

  // 移除自定义连接池事件监听，使用Prisma内置管理
  // private setupConnectionPoolEvents(): void {
  //   // 已移除自定义连接池事件监听逻辑
  // }

  // 移除自定义连接池统计，使用Prisma内置管理
  // private async logConnectionPoolStats(): Promise<void> {
  //   // 已移除自定义连接池统计逻辑
  // }

  // 移除自定义连接失败处理，使用Prisma内置管理
  // private async handleConnectionFailure(): Promise<void> {
  //   // 已移除自定义连接失败处理逻辑
  // }

  public async testConnection(): Promise<boolean> {
    try {
      if (!globalPrisma) {
        throw new Error('Prisma client not initialized');
      }

      await globalPrisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (globalPrisma) {
      await globalPrisma.$disconnect();
      globalPrisma = undefined;
      console.log('🔌 Database disconnected');
    }
  }

  public getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  public isConfigured(): boolean {
    return !!(this.config.host && this.config.database && this.config.username);
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();

// Export Prisma client getter for direct use
export const getPrismaClient = async (): Promise<PrismaClient> => {
  return await databaseManager.getClient();
};

// Export connection test utility
export const testDatabaseConnection = async (): Promise<boolean> => {
  return await databaseManager.testConnection();
};

// Export configuration checker
export const isDatabaseConfigured = (): boolean => {
  return databaseManager.isConfigured();
};

// Graceful shutdown handler
export const gracefulShutdown = async (): Promise<void> => {
  await databaseManager.disconnect();
};

// Development utilities
export const getDatabaseConfig = (): DatabaseConfig => {
  return databaseManager.getConfig();
};

// 移除自定义连接池管理导出，使用Prisma内置管理
// export const getConnectionPoolStats = () => {
//   // 已移除自定义连接池状态获取
// };

// export const forceCleanupConnectionPool = async (): Promise<void> => {
//   // 已移除自定义连接池清理
// };