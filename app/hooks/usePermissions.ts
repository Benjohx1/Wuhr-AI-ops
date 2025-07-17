'use client'

import { useCallback } from 'react'
import { useGlobalState } from '../contexts/GlobalStateContext'
import { AuthUser } from '../types/global'

// 角色层级定义
const ROLE_HIERARCHY = {
  admin: 4,
  manager: 3,
  developer: 2,
  viewer: 1,
} as const

// 路径权限映射
const ROLE_PATH_PERMISSIONS = {
  admin: ['/admin', '/config', '/monitor', '/servers', '/tools', '/ai'],
  manager: ['/monitor', '/servers', '/tools', '/ai'],
  developer: ['/tools', '/ai'],
  viewer: ['/monitor', '/ai'],
} as const

// 权限检查Hook
export function usePermissions() {
  const { state } = useGlobalState()
  const { auth } = state

  // 基础权限检查
  const hasPermission = useCallback((permission: string): boolean => {
    if (!auth.isAuthenticated || !auth.user) return false
    if (auth.user.role === 'admin') return true // 管理员拥有所有权限
    return auth.permissions.includes(permission)
  }, [auth.isAuthenticated, auth.user, auth.permissions])

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }, [hasPermission])

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }, [hasPermission])

  const hasRole = useCallback((role: AuthUser['role']): boolean => {
    return auth.user?.role === role
  }, [auth.user])

  const canAccess = useCallback((resource: string, action: string): boolean => {
    return hasPermission(`${resource}:${action}`)
  }, [hasPermission])

  // 检查角色权限（支持层级）
  const checkRole = useCallback((requiredRole: AuthUser['role']): boolean => {
    if (!auth.isAuthenticated || !auth.user) return false
    
    const userRoleLevel = ROLE_HIERARCHY[auth.user.role as keyof typeof ROLE_HIERARCHY] || 0
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0
    
    return userRoleLevel >= requiredRoleLevel
  }, [auth.isAuthenticated, auth.user])

  // 检查具体权限
  const checkPermission = useCallback((permission: string): boolean => {
    return hasPermission(permission)
  }, [hasPermission])

  // 检查资源访问权限
  const checkResourceAccess = useCallback((resourcePath: string): boolean => {
    if (!auth.isAuthenticated || !auth.user) return false
    if (auth.user.role === 'admin') return true
    
    const allowedPaths = ROLE_PATH_PERMISSIONS[auth.user.role as keyof typeof ROLE_PATH_PERMISSIONS] || []
    return allowedPaths.some(path => resourcePath.startsWith(path))
  }, [auth.isAuthenticated, auth.user])

  // 检查是否为当前用户的资源
  const checkOwnership = useCallback((resourceUserId: string): boolean => {
    if (!auth.isAuthenticated || !auth.user) return false
    return auth.user.id === resourceUserId || auth.user.role === 'admin'
  }, [auth.isAuthenticated, auth.user])

  // 获取用户可访问的路径列表
  const getAccessiblePaths = useCallback((): string[] => {
    if (!auth.isAuthenticated || !auth.user) return []
    return [...(ROLE_PATH_PERMISSIONS[auth.user.role as keyof typeof ROLE_PATH_PERMISSIONS] || [])]
  }, [auth.isAuthenticated, auth.user])

  // 检查是否可以执行特定操作
  const canExecuteAction = useCallback((action: string, context?: any): boolean => {
    if (!auth.isAuthenticated || !auth.user) return false
    
    switch (action) {
      case 'create_user':
      case 'delete_user':
      case 'modify_permissions':
        return auth.user.role === 'admin'
      
      case 'view_system_logs':
      case 'manage_servers':
        return checkRole('manager')
      
      case 'deploy_code':
      case 'run_scripts':
        return checkRole('developer')
      
      case 'view_monitoring':
      case 'use_ai_chat':
        return checkRole('viewer')
      
      default:
        return hasPermission(action)
    }
  }, [auth.isAuthenticated, auth.user, checkRole, hasPermission])

  // 权限验证组合函数
  const verifyAccess = useCallback((
    options: {
      requiredRole?: AuthUser['role']
      requiredPermissions?: string[]
      resourcePath?: string
      resourceUserId?: string
      action?: string
      mode?: 'all' | 'any'
    }
  ): boolean => {
    if (!auth.isAuthenticated || !auth.user) return false

    const {
      requiredRole,
      requiredPermissions = [],
      resourcePath,
      resourceUserId,
      action,
      mode = 'all'
    } = options

    // 检查角色权限
    if (requiredRole && !checkRole(requiredRole)) {
      return false
    }

    // 检查具体权限
    if (requiredPermissions.length > 0) {
      const hasPermissions = mode === 'all'
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions)
      
      if (!hasPermissions) {
        return false
      }
    }

    // 检查资源访问权限
    if (resourcePath && !checkResourceAccess(resourcePath)) {
      return false
    }

    // 检查资源所有权
    if (resourceUserId && !checkOwnership(resourceUserId)) {
      return false
    }

    // 检查操作权限
    if (action && !canExecuteAction(action)) {
      return false
    }

    return true
  }, [
    auth.isAuthenticated,
    auth.user,
    checkRole,
    hasAllPermissions,
    hasAnyPermission,
    checkResourceAccess,
    checkOwnership,
    canExecuteAction
  ])

  // 获取权限摘要信息
  const getPermissionSummary = useCallback(() => {
    if (!auth.isAuthenticated || !auth.user) {
      return {
        role: null,
        roleLevel: 0,
        accessiblePaths: [],
        permissions: [],
        canManageUsers: false,
        canManageServers: false,
        canDeploy: false,
        canViewLogs: false,
      }
    }

    const roleLevel = ROLE_HIERARCHY[auth.user.role as keyof typeof ROLE_HIERARCHY] || 0

    return {
      role: auth.user.role,
      roleLevel,
      accessiblePaths: getAccessiblePaths(),
      permissions: auth.permissions,
      canManageUsers: canExecuteAction('create_user'),
      canManageServers: canExecuteAction('manage_servers'),
      canDeploy: canExecuteAction('deploy_code'),
      canViewLogs: canExecuteAction('view_system_logs'),
    }
  }, [auth.isAuthenticated, auth.user, auth.permissions, getAccessiblePaths, canExecuteAction])

  return {
    // 基础权限检查
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canAccess,
    
    // 增强权限检查
    checkRole,
    checkPermission,
    checkResourceAccess,
    checkOwnership,
    canExecuteAction,
    verifyAccess,
    
    // 工具方法
    getAccessiblePaths,
    getPermissionSummary,
    
    // 状态信息
    permissions: auth.permissions,
    role: auth.user?.role,
    roleLevel: auth.user ? ROLE_HIERARCHY[auth.user.role as keyof typeof ROLE_HIERARCHY] || 0 : 0,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
  }
} 