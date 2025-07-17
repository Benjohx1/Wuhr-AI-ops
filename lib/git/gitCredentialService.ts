import { getPrismaClient } from '../config/database'
import { GitCredentialData, GitAuthType } from '../../app/types/access-management'

// 保持向后兼容的类型别名
export interface GitCredentials extends GitCredentialData {
  type: GitAuthType
}

/**
 * Git认证服务
 */
export class GitCredentialService {
  
  /**
   * 获取项目的Git认证信息
   */
  static async getProjectCredentials(projectId: string): Promise<GitCredentials | null> {
    const prisma = await getPrismaClient()
    
    try {
      // 获取项目信息
      const project = await prisma.cICDProject.findUnique({
        where: { id: projectId },
        select: { id: true }
      })

      if (!project) {
        return null
      }
      
      // 暂时返回null，因为gitCredentialId字段不存在
      return null

    } catch (error) {
      console.error('获取Git认证信息失败:', error)
      return null
    }
  }
  
  /**
   * 解密认证信息JSON
   */
  private static decryptCredentials(encryptedCredentials: string): Partial<GitCredentials> {
    try {
      // TODO: 实现真正的解密逻辑
      // 这里暂时直接解析JSON，实际应该先解密再解析
      const credentials = JSON.parse(encryptedCredentials)
      return credentials
    } catch (error) {
      console.error('解密认证信息失败:', error)
      return {}
    }
  }

  /**
   * 解密单个字段
   * 注意：这里需要实现真正的解密逻辑
   */
  private static decrypt(encryptedValue?: string): string | undefined {
    if (!encryptedValue) {
      return undefined
    }

    // TODO: 实现真正的解密逻辑
    // 这里暂时直接返回加密值，实际应该使用加密服务解密
    return encryptedValue
  }
  
  /**
   * 验证Git认证信息
   */
  static async validateCredentials(
    repositoryUrl: string, 
    credentials: GitCredentials
  ): Promise<boolean> {
    try {
      // 这里可以实现Git认证验证逻辑
      // 暂时返回true
      return true
    } catch (error) {
      console.error('Git认证验证失败:', error)
      return false
    }
  }
  
  /**
   * 构建带认证信息的Git URL
   */
  static buildAuthenticatedGitUrl(repositoryUrl: string, credentials: GitCredentials): string {
    if (!credentials) {
      return repositoryUrl
    }

    try {
      const url = new URL(repositoryUrl)
      
      switch (credentials.type) {
        case 'username_password':
          if (credentials.username && credentials.password) {
            url.username = encodeURIComponent(credentials.username)
            url.password = encodeURIComponent(credentials.password)
          }
          break
          
        case 'token':
          if (credentials.token) {
            // GitHub Personal Access Token
            if (url.hostname === 'github.com') {
              url.username = credentials.token
              url.password = 'x-oauth-basic'
            } else if (url.hostname === 'gitlab.com') {
              url.username = 'oauth2'
              url.password = credentials.token
            } else {
              // 其他平台，尝试使用token作为用户名
              url.username = credentials.token
            }
          }
          break
          
        case 'ssh':
          // SSH URL不需要在这里处理认证，由SSH配置处理
          return repositoryUrl
      }
      
      return url.toString()
    } catch (error) {
      console.warn(`Git URL构建失败，使用原始URL: ${error instanceof Error ? error.message : '未知错误'}`)
      return repositoryUrl
    }
  }
  
  /**
   * 为SSH认证创建临时密钥文件
   */
  static async createTempSSHKey(credentials: GitCredentials): Promise<string | null> {
    if (credentials.type !== 'ssh' || !credentials.privateKey) {
      return null
    }
    
    try {
      const fs = require('fs')
      const path = require('path')
      const os = require('os')
      
      // 创建临时密钥文件
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-ssh-'))
      const keyPath = path.join(tempDir, 'id_rsa')
      
      fs.writeFileSync(keyPath, credentials.privateKey, { mode: 0o600 })
      
      return keyPath
    } catch (error) {
      console.error('创建临时SSH密钥失败:', error)
      return null
    }
  }
  
  /**
   * 清理临时SSH密钥文件
   */
  static async cleanupTempSSHKey(keyPath: string): Promise<void> {
    try {
      const fs = require('fs')
      const path = require('path')
      
      if (fs.existsSync(keyPath)) {
        // 删除密钥文件
        fs.unlinkSync(keyPath)
        
        // 删除临时目录
        const tempDir = path.dirname(keyPath)
        fs.rmdirSync(tempDir)
      }
    } catch (error) {
      console.warn('清理临时SSH密钥失败:', error)
    }
  }
}
