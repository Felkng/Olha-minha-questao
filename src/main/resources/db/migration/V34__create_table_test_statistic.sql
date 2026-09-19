CREATE TABLE test_statistic (
    test_id BIGINT PRIMARY KEY REFERENCES test(id) ON DELETE CASCADE,
    total_attempts BIGINT NOT NULL DEFAULT 0,
    average_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    difficulty_level VARCHAR(20) NOT NULL DEFAULT 'SEM_DADOS',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_statistic (test_id, total_attempts, average_score, difficulty_level)
SELECT id, 0, 0.0, 'SEM_DADOS' FROM test
ON CONFLICT (test_id) DO NOTHING;
