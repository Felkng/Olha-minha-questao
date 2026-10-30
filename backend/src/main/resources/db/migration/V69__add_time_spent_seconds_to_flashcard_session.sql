ALTER TABLE flashcard_session ADD COLUMN IF NOT EXISTS time_spent_seconds INT NOT NULL DEFAULT 0;
