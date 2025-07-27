-- 为管理员账号添加CICD权限的SQL脚本
-- 确保admin@wuhr.ai账号拥有完整的CICD权限

-- 查看当前管理员账号的权限
SELECT 
    id, 
    email, 
    username, 
    role, 
    permissions
FROM "User" 
WHERE email = 'admin@wuhr.ai';

-- 更新管理员账号的权限，确保包含所有必要的权限
UPDATE "User" 
SET permissions = ARRAY[
    'users:read',
    'users:write',
    'permissions:read', 
    'permissions:write',
    'servers:read',
    'servers:write',
    'cicd:read',
    'cicd:write',
    'approvals:read',
    'approvals:write',
    'notifications:read',
    'notifications:write',
    'config:read',
    'config:write',
    'ai:read',
    'ai:write',
    'monitoring:read',
    'monitoring:write'
]
WHERE email = 'admin@wuhr.ai';

-- 验证更新结果
SELECT 
    id, 
    email, 
    username, 
    role, 
    permissions,
    CASE 
        WHEN 'cicd:write' = ANY(permissions) THEN '✅ 有CICD写权限'
        ELSE '❌ 无CICD写权限'
    END as cicd_write_status
FROM "User" 
WHERE email = 'admin@wuhr.ai';
