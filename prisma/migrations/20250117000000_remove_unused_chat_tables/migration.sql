-- 删除未使用的聊天相关表
-- 这些表已被Redis存储替代，且数据库中无数据

-- 删除ChatMessage表（包含外键约束）
DROP TABLE IF EXISTS "chat_messages" CASCADE;

-- 删除ChatSession表
DROP TABLE IF EXISTS "chat_sessions" CASCADE;

-- 删除相关的枚举类型
DROP TYPE IF EXISTS "MessageType";
DROP TYPE IF EXISTS "MessageStatus";
