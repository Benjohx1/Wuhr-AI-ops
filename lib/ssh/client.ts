import { NodeSSH } from 'node-ssh'

// SSH连接配置接口
export interface SSHConfig {
  host: string
  port?: number
  username: string
  password?: string
  privateKey?: string
  passphrase?: string
  timeout?: number
}

// SSH执行结果接口
export interface SSHResult {
  success: boolean
  stdout: string
  stderr: string
  code: number | null
  signal: string | null
}

// SSH客户端类
export class SSHClient {
  private ssh: NodeSSH
  private config: SSHConfig

  constructor(config: SSHConfig) {
    this.ssh = new NodeSSH()
    this.config = {
      timeout: 30000, // 默认30秒超时
      port: 22, // 默认SSH端口
      ...config
    }
  }

  // 连接到远程主机
  async connect(): Promise<void> {
    try {
      await this.ssh.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        privateKey: this.config.privateKey,
        passphrase: this.config.passphrase,
        readyTimeout: this.config.timeout,
        algorithms: {
          kex: [
            'diffie-hellman-group1-sha1',
            'diffie-hellman-group14-sha1',
            'diffie-hellman-group-exchange-sha1',
            'diffie-hellman-group-exchange-sha256',
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384',
            'ecdh-sha2-nistp521'
          ],
          cipher: [
            'aes128-ctr',
            'aes192-ctr',
            'aes256-ctr',
            'aes128-gcm',
            'aes256-gcm'
          ],
          hmac: [
            'hmac-sha2-256',
            'hmac-sha2-512',
            'hmac-sha1'
          ]
        }
      })
    } catch (error) {
      throw new Error(`SSH连接失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 执行命令
  async executeCommand(command: string, options?: { cwd?: string }): Promise<SSHResult> {
    try {
      const result = await this.ssh.execCommand(command, {
        cwd: options?.cwd
      })

      return {
        success: result.code === 0,
        stdout: result.stdout,
        stderr: result.stderr,
        code: result.code,
        signal: result.signal
      }
    } catch (error) {
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : '命令执行失败',
        code: -1,
        signal: null
      }
    }
  }

  // 检查命令是否存在
  async commandExists(command: string): Promise<boolean> {
    try {
      const result = await this.executeCommand(`which ${command}`)
      return result.success && result.stdout.trim().length > 0
    } catch {
      return false
    }
  }

  // 检查文件是否存在
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const result = await this.executeCommand(`test -f "${filePath}" && echo "exists"`)
      return result.success && result.stdout.trim() === 'exists'
    } catch {
      return false
    }
  }

  // 检查目录是否存在
  async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const result = await this.executeCommand(`test -d "${dirPath}" && echo "exists"`)
      return result.success && result.stdout.trim() === 'exists'
    } catch {
      return false
    }
  }

  // 获取系统信息
  async getSystemInfo(): Promise<{
    os: string
    kernel: string
    arch: string
    hostname: string
  }> {
    try {
      const [osResult, kernelResult, archResult, hostnameResult] = await Promise.all([
        this.executeCommand('uname -s'),
        this.executeCommand('uname -r'),
        this.executeCommand('uname -m'),
        this.executeCommand('hostname')
      ])

      return {
        os: osResult.stdout.trim(),
        kernel: kernelResult.stdout.trim(),
        arch: archResult.stdout.trim(),
        hostname: hostnameResult.stdout.trim()
      }
    } catch (error) {
      throw new Error(`获取系统信息失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 断开连接
  async disconnect(): Promise<void> {
    try {
      this.ssh.dispose()
    } catch (error) {
      console.warn('SSH断开连接时出现警告:', error)
    }
  }

  // 检查连接状态
  isConnected(): boolean {
    return this.ssh.isConnected()
  }
}

// 便捷函数：执行SSH命令
export async function executeSSHCommand(
  config: SSHConfig,
  command: string,
  options?: { cwd?: string }
): Promise<SSHResult> {
  const client = new SSHClient(config)
  
  try {
    await client.connect()
    const result = await client.executeCommand(command, options)
    return result
  } finally {
    await client.disconnect()
  }
}

// 便捷函数：检查SSH连接
export async function testSSHConnection(config: SSHConfig): Promise<{
  success: boolean
  error?: string
  systemInfo?: any
}> {
  const client = new SSHClient(config)
  
  try {
    await client.connect()
    const systemInfo = await client.getSystemInfo()
    
    return {
      success: true,
      systemInfo
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '连接测试失败'
    }
  } finally {
    await client.disconnect()
  }
}

// 便捷函数：检查远程命令是否存在
export async function checkRemoteCommand(
  config: SSHConfig,
  command: string
): Promise<boolean> {
  const client = new SSHClient(config)
  
  try {
    await client.connect()
    return await client.commandExists(command)
  } catch {
    return false
  } finally {
    await client.disconnect()
  }
}

export default SSHClient
