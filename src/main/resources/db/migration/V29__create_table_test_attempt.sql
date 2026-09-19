CREATE TABLE test_attempt (
    id BIGSERIAL PRIMARY KEY,
    test_id BIGINT NOT NULL REFERENCES test(id) ON DELETE CASCADE,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    score_percentage DOUBLE PRECISION NOT NULL,
    time_spent_seconds INTEGER,
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
