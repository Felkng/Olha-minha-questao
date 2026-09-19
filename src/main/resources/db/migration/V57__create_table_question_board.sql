CREATE TABLE question_board (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_question_board_user_question UNIQUE (user_id, question_id)
);
