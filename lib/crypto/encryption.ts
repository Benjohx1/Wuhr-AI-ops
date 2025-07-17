import crypto from 'crypto'

// 加密配置
const ALGORITHM = 'aes-256-cbc'
const KEY_LENGTH = 32
const IV_LENGTH = 16

// 从环境变量获取加密密钥，如果不存在则生成一个
function getEncryptionKey(): Buffer {
  const keyString = process.env.ENCRYPTION_KEY
  if (keyString) {
    return Buffer.from(keyString, 'hex')
  }
  
  // 如果没有设置加密密钥，生成一个新的（仅用于开发环境）
  console.warn('⚠️  ENCRYPTION_KEY not set, generating a new one for development')
  const newKey = crypto.randomBytes(KEY_LENGTH)
  console.log('🔑 Generated encryption key (add to .env):', newKey.toString('hex'))
  return newKey
}

/**
 * 加密敏感数据
 * @param data 要加密的数据对象
 * @returns 加密后的字符串
 */
export function encryptCredentials(data: any): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    const plaintext = JSON.stringify(data)
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // 组合 IV + 加密数据
    const result = iv.toString('hex') + encrypted
    return result
  } catch (error) {
    console.error('❌ 加密失败:', error)
    throw new Error('数据加密失败')
  }
}

/**
 * 解密敏感数据
 * @param encryptedData 加密的字符串
 * @returns 解密后的数据对象
 */
export function decryptCredentials(encryptedData: string): any {
  try {
    const key = getEncryptionKey()

    // 提取 IV 和加密数据
    const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex')
    const encrypted = encryptedData.slice(IV_LENGTH * 2)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return JSON.parse(decrypted)
  } catch (error) {
    console.error('❌ 解密失败:', error)
    throw new Error('数据解密失败')
  }
}

/**
 * 验证加密数据的完整性
 * @param encryptedData 加密的字符串
 * @returns 是否有效
 */
export function validateEncryptedData(encryptedData: string): boolean {
  try {
    decryptCredentials(encryptedData)
    return true
  } catch {
    return false
  }
}

/**
 * 生成新的加密密钥
 * @returns 十六进制格式的密钥
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

// 认证信息类型定义
export interface GitCredentialData {
  // GitHub Personal Access Token
  token?: string
  
  // SSH 密钥
  privateKey?: string
  publicKey?: string
  passphrase?: string
  
  // 用户名密码
  username?: string
  password?: string
  
  // 其他配置
  email?: string
  gitConfig?: Record<string, string>
}

/**
 * 创建GitHub PAT认证数据
 */
export function createGitHubTokenCredentials(token: string, username?: string): GitCredentialData {
  return {
    token,
    username: username || 'token'
  }
}

/**
 * 创建SSH密钥认证数据
 */
export function createSSHCredentials(
  privateKey: string, 
  publicKey: string, 
  passphrase?: string
): GitCredentialData {
  return {
    privateKey,
    publicKey,
    passphrase
  }
}

/**
 * 创建用户名密码认证数据
 */
export function createUsernamePasswordCredentials(
  username: string, 
  password: string, 
  email?: string
): GitCredentialData {
  return {
    username,
    password,
    email
  }
}
