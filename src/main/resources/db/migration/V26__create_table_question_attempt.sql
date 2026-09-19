CREATE TABLE question_attempt (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    selected_alternative_id BIGINT REFERENCES alternative(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL,
    is_first_attempt BOOLEAN NOT NULL DEFAULT true,
    time_spent_seconds INTEGER,
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
