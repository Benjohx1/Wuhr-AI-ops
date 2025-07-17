-- Add authType, isActive, and datacenter fields to servers table

-- Add authType field with default value
ALTER TABLE "servers" ADD COLUMN "authType" VARCHAR(50) NOT NULL DEFAULT 'password';

-- Add isActive field with default value
ALTER TABLE "servers" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Add datacenter field (optional)
ALTER TABLE "servers" ADD COLUMN "datacenter" VARCHAR(100);

-- Update existing records to have proper authType based on keyPath
UPDATE "servers" SET "authType" = 'key' WHERE "keyPath" IS NOT NULL AND "keyPath" != '';
UPDATE "servers" SET "authType" = 'password' WHERE "keyPath" IS NULL OR "keyPath" = '';

-- Create index for authType
CREATE INDEX "servers_authType_idx" ON "servers"("authType");

-- Create index for isActive
CREATE INDEX "servers_isActive_idx" ON "servers"("isActive");
