'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { GlobalState, GlobalAction, GlobalContextType, ApiKeyConfig, ModelConfig, AuthState } from '../types/global'

// 默认认证状态
const defaultAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  permissions: [],
  loading: false,
  error: null,
  lastLoginAt: undefined,
  sessionExpiresAt: undefined
}

// 默认状态
const defaultState: GlobalState = {
  theme: 'dark',
  user: null,
  // 认证状态
  auth: defaultAuthState,
  apiKeys: [],
  selectedApiKey: null,
  models: [
    {
      id: 'gpt-4o',
      name: 'gpt-4o',
      displayName: 'GPT-4o (推荐)',
      provider: 'openai-compatible',
      maxTokens: 4000,
      temperature: 0.7,
      isDefault: true
    },
    {
      id: 'gpt-4',
      name: 'gpt-4',
      displayName: 'GPT-4',
      provider: 'openai-compatible',
      maxTokens: 8000,
      temperature: 0.7
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'gpt-3.5-turbo',
      displayName: 'GPT-3.5 Turbo',
      provider: 'openai-compatible',
      maxTokens: 4000,
      temperature: 0.7
    }
  ],
  selectedModel: 'gpt-4o',
  preferences: {
    language: 'zh-CN',
    autoSave: true,
    notifications: true,
    soundEnabled: false,
    compactMode: false
  },
  loading: false,
  error: null
}

// Reducer 函数
function globalReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    
    case 'SET_USER':
      return { ...state, user: action.payload }

    // 认证相关Actions
    case 'AUTH_LOGIN_START':
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: true,
          error: null
        }
      }

    case 'AUTH_LOGIN_SUCCESS':
      return {
        ...state,
        auth: {
          ...state.auth,
          isAuthenticated: true,
          user: action.payload.user,
          accessToken: action.payload.accessToken,
          permissions: action.payload.user.permissions || [],
          sessionExpiresAt: new Date(Date.now() + action.payload.expiresIn * 1000),
          lastLoginAt: new Date(),
          loading: false,
          error: null
        }
      }

    case 'AUTH_LOGIN_FAILURE':
      return {
        ...state,
        auth: {
          ...state.auth,
          isAuthenticated: false,
          user: null,
          accessToken: null,
          permissions: [],
          sessionExpiresAt: undefined,
          lastLoginAt: undefined,
          loading: false,
          error: action.payload
        }
      }

    case 'AUTH_LOGOUT':
      return {
        ...state,
        auth: {
          ...defaultAuthState
        }
      }

    case 'AUTH_REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        auth: {
          ...state.auth,
          accessToken: action.payload.accessToken,
          sessionExpiresAt: new Date(Date.now() + action.payload.expiresIn * 1000),
          loading: false,
          error: null
        }
      }

    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        auth: {
          ...state.auth,
          user: state.auth.user ? { ...state.auth.user, ...action.payload } : null
        }
      }

    case 'AUTH_UPDATE_PERMISSIONS':
      return {
        ...state,
        auth: {
          ...state.auth,
          permissions: action.payload
        }
      }

    case 'AUTH_SET_LOADING':
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: action.payload
        }
      }

    case 'AUTH_SET_ERROR':
      return {
        ...state,
        auth: {
          ...state.auth,
          error: action.payload,
          loading: false
        }
      }

    case 'AUTH_CHECK_SESSION':
      return {
        ...state,
        auth: {
          ...state.auth,
          loading: true
        }
      }

    case 'AUTH_SESSION_EXPIRED':
      return {
        ...state,
        auth: {
          ...defaultAuthState,
          error: '会话已过期，请重新登录'
        }
      }

    case 'SET_API_KEYS':
      return {
        ...state,
        apiKeys: action.payload
      }

    case 'ADD_API_KEY':
      return {
        ...state,
        apiKeys: [...state.apiKeys, action.payload]
      }
    
    case 'UPDATE_API_KEY':
      return {
        ...state,
        apiKeys: state.apiKeys.map(key =>
          key.id === action.payload.id ? action.payload : key
        )
      }
    
    case 'DELETE_API_KEY':
      return {
        ...state,
        apiKeys: state.apiKeys.filter(key => key.id !== action.payload),
        selectedApiKey: state.selectedApiKey === action.payload ? null : state.selectedApiKey
      }
    
    case 'SET_SELECTED_API_KEY':
      return { ...state, selectedApiKey: action.payload }
    
    case 'ADD_MODEL':
      return {
        ...state,
        models: [...state.models, action.payload]
      }
    
    case 'UPDATE_MODEL':
      return {
        ...state,
        models: state.models.map(model =>
          model.id === action.payload.id ? action.payload : model
        )
      }
    
    case 'DELETE_MODEL':
      return {
        ...state,
        models: state.models.filter(model => model.id !== action.payload),
        selectedModel: state.selectedModel === action.payload ? null : state.selectedModel
      }
    
    case 'SET_SELECTED_MODEL':
      return { ...state, selectedModel: action.payload }
    
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      }
    
    case 'SET_LOADING':
      const { loading, key } = action.payload
      if (key) {
        // 设置特定 key 的加载状态
        return {
          ...state,
          loadingStates: {
            ...state.loadingStates,
            [key]: loading
          }
        }
      } else {
        // 设置全局加载状态
        return { ...state, loading }
      }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'RESET_STATE':
      return defaultState
    
    case 'LOAD_FROM_STORAGE':
      return { ...state, ...action.payload }
    
    default:
      return state
  }
}

// 创建 Context
export const GlobalStateContext = createContext<GlobalContextType | undefined>(undefined)

// localStorage 工具函数
const STORAGE_KEY = 'wuhr-ai-ops-state'

const saveToStorage = (state: GlobalState) => {
  try {
    const stateToSave = {
      theme: state.theme,
      apiKeys: state.apiKeys,
      selectedApiKey: state.selectedApiKey,
      models: state.models,
      selectedModel: state.selectedModel,
      preferences: state.preferences
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
  } catch (error) {
    console.error('保存状态到 localStorage 失败:', error)
  }
}

const loadFromStorage = (): Partial<GlobalState> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('从 localStorage 加载状态失败:', error)
    return null
  }
}

// Provider 组件
interface GlobalStateProviderProps {
  children: ReactNode
}

export const GlobalStateProvider: React.FC<GlobalStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(globalReducer, defaultState)

  // 初始化时从 localStorage 加载状态
  useEffect(() => {
    const storedState = loadFromStorage()
    if (storedState) {
      dispatch({ type: 'LOAD_FROM_STORAGE', payload: storedState })
    }
  }, [])

  // 状态变更时保存到 localStorage
  useEffect(() => {
    saveToStorage(state)
  }, [state])

  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStateContext.Provider>
  )
}

// 自定义 Hook
export const useGlobalState = () => {
  const context = useContext(GlobalStateContext)
  if (context === undefined) {
    throw new Error('useGlobalState 必须在 GlobalStateProvider 内部使用')
  }
  return context
} 