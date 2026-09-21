ALTER TABLE test_attempt ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES app_user(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_test_attempt_user_id ON test_attempt(user_id);
