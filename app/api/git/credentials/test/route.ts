import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/auth/apiHelpers-new'
import { z } from 'zod'
import { GitOperations } from '../../../../../lib/git/gitOperations'
import { createUsernamePasswordCredentials, createGitHubTokenCredentials, createSSHCredentials } from '../../../../../lib/crypto/encryption'
import { withLeakDetection } from '../../../../../lib/database/leakDetector'

// Git认证测试请求schema
const GitCredentialTestSchema = z.object({
  platform: z.enum(['github', 'gitlab', 'gitee', 'bitbucket', 'other']),
  authType: z.enum(['token', 'ssh', 'username_password']),
  credentials: z.object({
    // GitHub PAT
    token: z.string().optional(),
    
    // SSH密钥
    privateKey: z.string().optional(),
    publicKey: z.string().optional(),
    passphrase: z.string().optional(),
    
    // 用户名密码
    username: z.string().optional(),
    password: z.string().optional(),
    email: z.string().optional()
  }),
  testRepository: z.string().url('请输入有效的测试仓库URL').optional()
})

// 测试Git认证配置
export async function POST(request: NextRequest) {
  return await withLeakDetection('test-git-credentials', async () => {
    try {
      const authResult = await requireAuth(request)
      if (!authResult.success) {
        return authResult.response
      }

      const { user } = authResult
      const body = await request.json()

      console.log('🧪 开始测试Git认证配置:', { 
        userId: user.id, 
        email: user.email,
        platform: body.platform,
        authType: body.authType 
      })

      // 验证输入数据
      const validationResult = GitCredentialTestSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json({
          success: false,
          error: '输入数据验证失败',
          details: validationResult.error.errors
        }, { status: 400 })
      }

      const { platform, authType, credentials, testRepository } = validationResult.data

      // 验证认证信息完整性
      let credentialData
      let validationErrors: string[] = []

      switch (authType) {
        case 'token':
          if (!credentials.token) {
            validationErrors.push('Personal Access Token不能为空')
          } else {
            credentialData = createGitHubTokenCredentials(credentials.token, credentials.username)
          }
          break

        case 'ssh':
          if (!credentials.privateKey) {
            validationErrors.push('SSH私钥不能为空')
          } else {
            credentialData = createSSHCredentials(
              credentials.privateKey,
              credentials.publicKey || '',
              credentials.passphrase
            )
          }
          break

        case 'username_password':
          if (!credentials.username || !credentials.password) {
            validationErrors.push('用户名和密码不能为空')
          } else {
            // 特殊处理：检查是否是目标用户的邮箱
            if (credentials.username === 'lzh094285@gmail.com') {
              console.log('🔍 检测到目标用户邮箱，进行特殊验证')
            }
            credentialData = createUsernamePasswordCredentials(
              credentials.username,
              credentials.password,
              credentials.email
            )
          }
          break

        default:
          validationErrors.push('不支持的认证类型')
      }

      if (validationErrors.length > 0) {
        return NextResponse.json({
          success: false,
          error: '认证信息验证失败',
          details: validationErrors
        }, { status: 400 })
      }

      // 确定测试仓库URL
      let testUrl = testRepository
      if (!testUrl) {
        // 根据平台选择默认测试仓库
        switch (platform) {
          case 'github':
            testUrl = 'https://github.com/octocat/Hello-World.git'
            break
          case 'gitlab':
            testUrl = 'https://gitlab.com/gitlab-org/gitlab-test.git'
            break
          case 'gitee':
            testUrl = 'https://gitee.com/gitee-stars/hello-world.git'
            break
          default:
            testUrl = 'https://github.com/octocat/Hello-World.git'
        }
      }

      console.log('🔗 使用测试仓库:', testUrl)

      // 执行Git认证测试
      const gitOps = new GitOperations()
      
      try {
        const result = await gitOps.validateRepository(testUrl, {
          credentials: credentialData,
          platform,
          authType
        })

        console.log('📊 Git认证测试结果:', {
          accessible: result.accessible,
          error: result.error,
          branches: result.branches?.length
        })

        // 清理临时文件
        await gitOps.cleanup()

        if (result.accessible) {
          return NextResponse.json({
            success: true,
            data: {
              message: '认证配置验证成功',
              testRepository: testUrl,
              repositoryInfo: {
                accessible: result.accessible,
                branches: result.branches,
                defaultBranch: result.defaultBranch,
                projectType: result.projectType
              }
            }
          })
        } else {
          // 提供更详细的错误信息
          let errorMessage = result.error || '认证验证失败'
          let suggestions: string[] = []

          if (authType === 'username_password') {
            if (credentials.username === 'lzh094285@gmail.com') {
              suggestions.push('请确认GitHub用户名是否正确（通常不是邮箱地址）')
              suggestions.push('请检查密码是否正确，或考虑使用Personal Access Token')
              suggestions.push('如果启用了双因素认证，必须使用Personal Access Token而不是密码')
            }
            suggestions.push('确认用户名和密码是否正确')
            suggestions.push('检查是否启用了双因素认证（需要使用Token）')
          } else if (authType === 'token') {
            suggestions.push('确认Personal Access Token是否有效且未过期')
            suggestions.push('检查Token是否有足够的权限访问仓库')
          } else if (authType === 'ssh') {
            suggestions.push('确认SSH密钥是否已添加到Git平台')
            suggestions.push('检查SSH密钥格式是否正确')
          }

          return NextResponse.json({
            success: false,
            error: errorMessage,
            details: {
              testRepository: testUrl,
              authType,
              platform,
              suggestions
            }
          }, { status: 400 })
        }

      } catch (gitError) {
        console.error('❌ Git操作异常:', gitError)
        
        // 清理临时文件
        await gitOps.cleanup()

        let errorMessage = 'Git操作失败'
        let suggestions: string[] = []

        if (gitError instanceof Error) {
          if (gitError.message.includes('Authentication failed')) {
            errorMessage = '认证失败'
            if (authType === 'username_password' && credentials.username === 'lzh094285@gmail.com') {
              suggestions.push('GitHub用户名通常不是邮箱地址，请使用实际的GitHub用户名')
              suggestions.push('如果不确定用户名，请访问 https://github.com/settings/profile 查看')
            }
            suggestions.push('请检查认证信息是否正确')
          } else if (gitError.message.includes('Repository not found')) {
            errorMessage = '仓库不存在或无访问权限'
            suggestions.push('请检查仓库URL是否正确')
            suggestions.push('确认账户是否有访问该仓库的权限')
          } else if (gitError.message.includes('Network')) {
            errorMessage = '网络连接失败'
            suggestions.push('请检查网络连接')
            suggestions.push('确认防火墙设置是否允许Git操作')
          }
        }

        return NextResponse.json({
          success: false,
          error: errorMessage,
          details: {
            testRepository: testUrl,
            authType,
            platform,
            suggestions,
            originalError: gitError instanceof Error ? gitError.message : '未知错误'
          }
        }, { status: 400 })
      }

    } catch (error) {
      console.error('❌ Git认证测试失败:', error)
      return NextResponse.json({
        success: false,
        error: 'Git认证测试失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 })
    }
  })
}
