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

// 连接池状态
let connectionPoolStats = {
  totalConnections: 0,
  activeConnections: 0,
  idleConnections: 0,
  idleInTransaction: 0,
  lastChecked: 0
};

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
      minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '2'),        // 最小连接数：2
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '8'),        // 最大连接数：8
      initialConnections: parseInt(process.env.DB_INITIAL_CONNECTIONS || '3'), // 初始连接数：3
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'), // 连接超时：30秒
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '900000'),         // 空闲超时：15分钟
    };
  }

  private buildConnectionString(): string {
    const { host, port, database, username, password, ssl } = this.config;

    // 构建基础连接字符串，添加连接池参数
    const params = new URLSearchParams()
    if (ssl) params.set('sslmode', 'require')

    // 连接超时设置
    params.set('connect_timeout', Math.floor(this.config.connectionTimeout / 1000).toString()) // 转换为秒
    params.set('pool_timeout', Math.floor(this.config.connectionTimeout / 1000).toString())
    params.set('statement_timeout', this.config.connectionTimeout.toString())

    // 连接池设置 - 使用保守的连接数
    params.set('connection_limit', Math.min(this.config.maxConnections, 5).toString()) // 限制最大连接数
    params.set('pool_min_conns', Math.min(this.config.minConnections, 2).toString())   // 最小连接数
    params.set('pool_max_conns', Math.min(this.config.maxConnections, 5).toString())   // 最大连接数
    params.set('idle_in_transaction_session_timeout', this.config.idleTimeout.toString()) // 空闲超时
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

      // 添加连接池监控
      this.setupConnectionPoolMonitoring();

      // 添加连接池事件监听
      this.setupConnectionPoolEvents();

      // 输出连接池配置信息
      console.log('🔧 数据库连接池配置:', {
        minConnections: this.config.minConnections,
        maxConnections: this.config.maxConnections,
        initialConnections: this.config.initialConnections,
        connectionTimeout: `${this.config.connectionTimeout}ms`,
        idleTimeout: `${Math.floor(this.config.idleTimeout / 60000)}分钟`,
        actualConnectionLimit: Math.min(this.config.maxConnections, 5)
      });

      // 检查当前连接数
      await this.checkInitialConnectionCount();

      // 暂时禁用连接池预热，避免连接数过多问题
      // await this.warmupConnectionPool();

      // 只在开发环境测试连接
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Database client initialized');
      }
    }
    return globalPrisma;
  }

  private setupConnectionPoolMonitoring(): void {
    if (!globalPrisma) return;

    // 定期检查连接池状态（每5分钟）
    const checkInterval = setInterval(async () => {
      try {
        await this.checkConnectionPoolHealth();
      } catch (error) {
        console.error('❌ 连接池健康检查失败:', error);
      }
    }, 5 * 60 * 1000);

    // 定期强制清理空闲连接（每15分钟，与空闲超时时间一致）
    const cleanupInterval = setInterval(async () => {
      try {
        await this.forceCleanupIdleConnections();
      } catch (error) {
        console.error('❌ 连接池清理失败:', error);
      }
    }, 15 * 60 * 1000);

    // 监听进程退出事件，确保连接正确关闭
    const gracefulShutdown = async (signal: string) => {
      console.log(`📡 收到 ${signal} 信号，正在优雅关闭数据库连接...`)
      clearInterval(checkInterval);
      clearInterval(cleanupInterval);
      await this.disconnect()
      process.exit(0)
    }

    process.on('beforeExit', async () => {
      clearInterval(checkInterval);
      clearInterval(cleanupInterval);
      await this.disconnect();
    });

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }

  // 检查连接池健康状态
  private async checkConnectionPoolHealth(): Promise<void> {
    try {
      if (!globalPrisma) return;

      const now = Date.now();
      // 避免频繁检查，至少间隔1分钟
      if (now - connectionPoolStats.lastChecked < 60000) {
        return;
      }

      await this.logConnectionPoolStats();
      connectionPoolStats.lastChecked = now;

      // 如果连接数过多，尝试清理
      if (connectionPoolStats.totalConnections > this.config.maxConnections * 1.2) {
        console.warn('⚠️ 连接数过多，尝试清理连接池...');
        await this.cleanupConnectionPool();
      }

    } catch (error) {
      console.error('❌ 连接池健康检查失败:', error);
    }
  }

  // 清理连接池
  private async cleanupConnectionPool(): Promise<void> {
    try {
      if (!globalPrisma) return;

      // 断开并重新连接
      await globalPrisma.$disconnect();

      // 等待一段时间让连接完全关闭
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 重新初始化连接
      globalPrisma = undefined;
      await this.getClient();

      console.log('✅ 连接池已清理并重新初始化');

    } catch (error) {
      console.error('❌ 连接池清理失败:', error);
    }
  }

  // 强制清理空闲连接
  private async forceCleanupIdleConnections(): Promise<void> {
    try {
      if (!globalPrisma) return;

      // 执行一个简单的查询来检查连接状态
      await globalPrisma.$queryRaw`SELECT 1`;

      // 检查连接池状态
      const stats = await globalPrisma.$queryRaw<Array<{
        total_connections: string;
        active_connections: string;
        idle_connections: string;
        idle_in_transaction: string;
      }>>`
        SELECT
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      if (stats && stats.length > 0) {
        const connectionStats = stats[0];
        const totalConnections = parseInt(connectionStats.total_connections);
        const idleConnections = parseInt(connectionStats.idle_connections);

        // 如果空闲连接过多，强制断开一些
        // 使用更保守的阈值，避免连接数过多
        const maxIdleThreshold = Math.min(3, Math.floor(this.config.maxConnections * 0.4));
        if (idleConnections > maxIdleThreshold || totalConnections > 5) {
          console.log(`🧹 强制清理空闲连接: 总连接=${totalConnections}, 空闲=${idleConnections}, 阈值=${maxIdleThreshold}`);

          // 断开空闲连接，但保留最小连接数
          const targetIdleConnections = Math.max(1, Math.min(2, this.config.minConnections));
          const cleanupLimit = Math.max(0, idleConnections - targetIdleConnections);
          if (cleanupLimit > 0) {
            await globalPrisma.$queryRaw`
              SELECT pg_terminate_backend(pid)
              FROM pg_stat_activity
              WHERE datname = current_database()
              AND state = 'idle'
              AND pid != pg_backend_pid()
              LIMIT ${cleanupLimit}
            `;
          }
        }
      }

    } catch (error) {
      // 静默处理错误，避免影响正常业务
      if (error instanceof Error && !error.message.includes('database is closed')) {
        console.error('❌ 强制清理空闲连接失败:', error.message);
      }
    }
  }

  // 检查初始连接数
  private async checkInitialConnectionCount(): Promise<void> {
    try {
      if (!globalPrisma) return;

      // 执行一个简单查询来测试连接
      await globalPrisma.$queryRaw`SELECT 1 as connection_test`;
      console.log('✅ 数据库连接测试成功');

    } catch (error) {
      console.error('❌ 数据库连接测试失败:', error);

      // 如果是连接数过多的错误，给出具体建议
      if (error instanceof Error && error.message.includes('too many clients')) {
        console.error('💡 建议：PostgreSQL连接数已满，请检查：');
        console.error('   1. PostgreSQL的max_connections设置');
        console.error('   2. 是否有其他应用占用连接');
        console.error('   3. 考虑降低应用的连接池配置');
      }
    }
  }

  // 连接池预热 - 创建初始连接
  private async warmupConnectionPool(): Promise<void> {
    try {
      if (!globalPrisma) return;

      console.log(`🔥 预热连接池，创建 ${this.config.initialConnections} 个初始连接...`);

      // 并发创建初始连接数量的查询来预热连接池
      const warmupPromises = Array.from({ length: this.config.initialConnections }, async (_, index) => {
        try {
          // 执行简单查询来建立连接
          await globalPrisma!.$queryRaw`SELECT 1 as warmup_${index}`;
          console.log(`✅ 预热连接 ${index + 1}/${this.config.initialConnections} 完成`);
        } catch (error) {
          console.warn(`⚠️ 预热连接 ${index + 1} 失败:`, error);
        }
      });

      await Promise.allSettled(warmupPromises);
      console.log(`🔥 连接池预热完成，目标初始连接数: ${this.config.initialConnections}`);

    } catch (error) {
      console.error('❌ 连接池预热失败:', error);
      // 预热失败不应该阻止应用启动
    }
  }

  // 设置连接池事件监听
  private setupConnectionPoolEvents(): void {
    if (!globalPrisma) return;

    console.log('🔧 设置连接池管理...')

    // 移除定期重置，让Prisma自动管理连接池
    // 连接池会自动处理连接的生命周期和清理
  }

  // 记录连接池统计信息
  private async logConnectionPoolStats(): Promise<void> {
    try {
      if (!globalPrisma) return

      // 获取PostgreSQL连接统计
      const stats = await globalPrisma.$queryRaw`
        SELECT
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
          EXTRACT(EPOCH FROM max(now() - query_start))::integer as longest_query_duration_seconds
        FROM pg_stat_activity
        WHERE datname = current_database()
      ` as any[]

      const connectionStats = stats[0]

      // 更新全局连接池状态
      connectionPoolStats = {
        totalConnections: parseInt(connectionStats.total_connections),
        activeConnections: parseInt(connectionStats.active_connections),
        idleConnections: parseInt(connectionStats.idle_connections),
        idleInTransaction: parseInt(connectionStats.idle_in_transaction),
        lastChecked: Date.now()
      };

      console.log('📊 数据库连接池状态:', {
        total: connectionPoolStats.totalConnections,
        active: connectionPoolStats.activeConnections,
        idle: connectionPoolStats.idleConnections,
        idleInTransaction: connectionPoolStats.idleInTransaction,
        longestQueryDuration: connectionStats.longest_query_duration,
        maxAllowed: this.config.maxConnections
      })

      // 检查是否有异常情况
      if (connectionPoolStats.activeConnections > this.config.maxConnections * 0.8) {
        console.warn(`⚠️ 活跃连接数过高: ${connectionPoolStats.activeConnections}/${this.config.maxConnections}`)
      }

      if (connectionPoolStats.idleInTransaction > 3) {
        console.warn(`⚠️ 事务中空闲连接过多: ${connectionPoolStats.idleInTransaction}`)
      }

      if (connectionPoolStats.totalConnections > this.config.maxConnections) {
        console.warn(`⚠️ 总连接数超过限制: ${connectionPoolStats.totalConnections}/${this.config.maxConnections}`)
      }

    } catch (error) {
      console.error('❌ 获取连接池统计失败:', error)
    }
  }

  // 处理连接失败
  private async handleConnectionFailure(): Promise<void> {
    console.log('🔄 尝试重新建立数据库连接...')

    try {
      // 断开现有连接
      if (globalPrisma) {
        await globalPrisma.$disconnect()
        globalPrisma = undefined
      }

      // 等待一段时间后重新连接
      await new Promise(resolve => setTimeout(resolve, 5000))

      // 重新获取连接
      await this.getClient()
      console.log('✅ 数据库连接已恢复')

    } catch (error) {
      console.error('❌ 数据库连接恢复失败:', error)
    }
  }

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

// 获取连接池状态
export const getConnectionPoolStats = () => {
  return { ...connectionPoolStats };
};

// 强制清理连接池
export const forceCleanupConnectionPool = async (): Promise<void> => {
  const manager = DatabaseManager.getInstance();
  await (manager as any).cleanupConnectionPool();
};