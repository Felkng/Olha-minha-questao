CREATE TABLE saved_question (
    id BIGSERIAL PRIMARY KEY,
    folder_id BIGINT NOT NULL REFERENCES folder(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_saved_question_folder_question UNIQUE (folder_id, question_id)
);
