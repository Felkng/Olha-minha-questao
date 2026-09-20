CREATE TABLE question_statistic (
    question_id BIGINT PRIMARY KEY REFERENCES question(id) ON DELETE CASCADE,
    total_attempts BIGINT NOT NULL DEFAULT 0,
    first_attempts BIGINT NOT NULL DEFAULT 0,
    first_attempt_correct BIGINT NOT NULL DEFAULT 0,
    first_attempt_accuracy DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    difficulty_level VARCHAR(20) NOT NULL DEFAULT 'SEM_DADOS',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO question_statistic (question_id, total_attempts, first_attempts, first_attempt_correct, first_attempt_accuracy, difficulty_level)
SELECT id, 0, 0, 0, 0.0, 'SEM_DADOS' FROM question
ON CONFLICT (question_id) DO NOTHING;
