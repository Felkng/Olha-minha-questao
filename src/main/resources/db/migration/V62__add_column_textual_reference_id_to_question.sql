ALTER TABLE question ADD COLUMN textual_reference_id BIGINT REFERENCES textual_reference(id) ON DELETE SET NULL;

CREATE INDEX idx_question_textual_reference_id ON question(textual_reference_id);
