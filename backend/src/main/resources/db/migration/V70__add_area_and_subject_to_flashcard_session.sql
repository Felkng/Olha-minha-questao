ALTER TABLE flashcard_session ADD COLUMN IF NOT EXISTS area_id BIGINT REFERENCES area(id) ON DELETE SET NULL;
ALTER TABLE flashcard_session ADD COLUMN IF NOT EXISTS subject_id BIGINT REFERENCES subject(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_flashcard_session_area_id ON flashcard_session(area_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_session_subject_id ON flashcard_session(subject_id);
