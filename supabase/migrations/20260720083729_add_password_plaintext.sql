-- ============================================
-- 新增 password_plaintext 列，用于 admin 编辑时回显密码
-- ============================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS password_plaintext VARCHAR(255);
