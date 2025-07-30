#!/usr/bin/env node

const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

// 预设模型数据
const PRESET_MODELS = [
  // OpenAI Compatible 模型
  {
    name: 'gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai-compatible',
    description: 'OpenAI最新的多模态模型，支持文本、图像、音频输入',
    contextLength: 128000,
    maxTokens: 4096,
    supportedFeatures: ['chat', 'completion', 'vision', 'tools', 'streaming', 'json_mode'],
    isActive: true
  },
  {
    name: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    provider: 'openai-compatible',
    description: 'GPT-4o的轻量级版本，性价比更高',
    contextLength: 128000,
    maxTokens: 4096,
    supportedFeatures: ['chat', 'completion', 'vision', 'tools', 'streaming', 'json_mode'],
    isActive: true
  },
  {
    name: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    provider: 'openai-compatible',
    description: 'GPT-4的优化版本，响应更快',
    contextLength: 128000,
    maxTokens: 4096,
    supportedFeatures: ['chat', 'completion', 'tools', 'streaming', 'json_mode'],
    isActive: true
  },
  {
    name: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    provider: 'openai-compatible',
    description: '快速且经济的对话模型',
    contextLength: 16385,
    maxTokens: 4096,
    supportedFeatures: ['chat', 'completion', 'streaming', 'json_mode'],
    isActive: true
  },

  // DeepSeek 模型
  {
    name: 'deepseek-chat',
    displayName: 'DeepSeek Chat',
    provider: 'deepseek',
    description: 'DeepSeek的对话模型，支持中文优化',
    contextLength: 32768,
    maxTokens: 4096,
    supportedFeatures: ['chat', 'completion', 'streaming'],
    isActive: true
  },
  {
    name: 'deepseek-coder',
    displayName: 'DeepSeek Coder',
    provider: 'deepseek',
    description: '专为代码生成优化的模型',
    contextLength: 16384,
    maxTokens: 4096,
    supportedFeatures: ['chat', 'completion', 'streaming'],
    isActive: true
  },
  {
    name: 'deepseek-vision',
    displayName: 'DeepSeek Vision',
    provider: 'deepseek',
    description: '支持视觉理解的多模态模型',
    contextLength: 32768,
    maxTokens: 4096,
    supportedFeatures: ['chat', 'completion', 'vision', 'streaming'],
    isActive: true
  },

  // Google Gemini 模型
  {
    name: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    provider: 'gemini',
    description: 'Google最新的多模态模型，支持超长上下文',
    contextLength: 1000000,
    maxTokens: 8192,
    supportedFeatures: ['chat', 'completion', 'vision', 'tools', 'streaming'],
    isActive: true
  },
  {
    name: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    provider: 'gemini',
    description: 'Gemini 1.5的快速版本，性价比更高',
    contextLength: 1000000,
    maxTokens: 8192,
    supportedFeatures: ['chat', 'completion', 'vision', 'tools', 'streaming'],
    isActive: true
  },
  {
    name: 'gemini-pro',
    displayName: 'Gemini Pro',
    provider: 'gemini',
    description: 'Google的文本生成模型',
    contextLength: 32768,
    maxTokens: 2048,
    supportedFeatures: ['chat', 'completion', 'streaming'],
    isActive: true
  },

  // Qwen 模型
  {
    name: 'qwen-turbo',
    displayName: 'Qwen Turbo',
    provider: 'qwen',
    description: '阿里云Qwen的快速对话模型',
    contextLength: 8192,
    maxTokens: 1500,
    supportedFeatures: ['chat', 'completion', 'streaming'],
    isActive: true
  },
  {
    name: 'qwen-plus',
    displayName: 'Qwen Plus',
    provider: 'qwen',
    description: 'Qwen的高性能对话模型',
    contextLength: 32768,
    maxTokens: 1500,
    supportedFeatures: ['chat', 'completion', 'streaming'],
    isActive: true
  },
  {
    name: 'qwen-max',
    displayName: 'Qwen Max',
    provider: 'qwen',
    description: 'Qwen的最强对话模型',
    contextLength: 32768,
    maxTokens: 1500,
    supportedFeatures: ['chat', 'completion', 'streaming'],
    isActive: true
  },
  {
    name: 'qwen-vl-plus',
    displayName: 'Qwen VL Plus',
    provider: 'qwen',
    description: 'Qwen的多模态视觉语言模型',
    contextLength: 32768,
    maxTokens: 1500,
    supportedFeatures: ['chat', 'completion', 'vision', 'streaming'],
    isActive: true
  },

  // Doubao 模型
  {
    name: 'doubao-pro-4k',
    displayName: 'Doubao Pro 4K',
    provider: 'doubao',
    description: '豆包Pro 4K上下文模型',
    contextLength: 4096,
    maxTokens: 2048,
    supportedFeatures: ['chat', 'completion', 'streaming'],
    isActive: true
  },
  {
    name: 'doubao-pro-32k',
    displayName: 'Doubao Pro 32K',
    provider: 'doubao',
    description: '豆包Pro 32K上下文模型',
    contextLength: 32768,
    maxTokens: 2048,
    supportedFeatures: ['chat', 'completion', 'streaming'],
    isActive: true
  },
  {
    name: 'doubao-lite',
    displayName: 'Doubao Lite',
    provider: 'doubao',
    description: '豆包轻量级模型，快速响应',
    contextLength: 4096,
    maxTokens: 1024,
    supportedFeatures: ['chat', 'completion', 'streaming'],
    isActive: true
  }
];

async function initializePresetModels() {
  try {
    console.log('🚀 开始初始化预设模型...');
    
    // 检查是否已有预设模型
    const existingCount = await prisma.presetModel.count();
    if (existingCount > 0) {
      console.log(`✅ 已存在 ${existingCount} 个预设模型，跳过初始化`);
      return;
    }

    // 批量创建预设模型
    const createdModels = await prisma.presetModel.createMany({
      data: PRESET_MODELS,
      skipDuplicates: true
    });

    console.log(`✅ 成功创建 ${createdModels.count} 个预设模型`);

    // 显示创建的模型统计
    const modelStats = await prisma.presetModel.groupBy({
      by: ['provider'],
      _count: {
        provider: true
      }
    });

    console.log('\n📊 预设模型统计:');
    modelStats.forEach(stat => {
      console.log(`  ${stat.provider}: ${stat._count.provider} 个模型`);
    });

    console.log('\n🎉 预设模型初始化完成！');
    console.log('💡 用户现在可以在模型配置中选择这些预设模型');

  } catch (error) {
    console.error('❌ 初始化预设模型失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializePresetModels()
    .then(() => {
      console.log('✅ 预设模型初始化脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 预设模型初始化脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { initializePresetModels }; 