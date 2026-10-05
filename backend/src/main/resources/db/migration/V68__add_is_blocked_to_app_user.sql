ALTER TABLE app_user ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_app_user_is_blocked ON app_user(is_blocked);
