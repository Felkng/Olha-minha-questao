CREATE TABLE IF NOT EXISTS test_session (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    test_id BIGINT NOT NULL REFERENCES test(id) ON DELETE CASCADE,
    question_ids TEXT,
    timer_minutes INT NOT NULL DEFAULT 0,
    time_spent_seconds INT NOT NULL DEFAULT 0,
    active_question_index INT NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    test_attempt_id BIGINT REFERENCES test_attempt(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_session_item (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES test_session(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    selected_alternative_id BIGINT REFERENCES alternative(id) ON DELETE SET NULL,
    time_spent_seconds INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_session (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    folder_id BIGINT REFERENCES folder(id) ON DELETE SET NULL,
    origin_id BIGINT REFERENCES origin(id) ON DELETE SET NULL,
    area_id BIGINT REFERENCES area(id) ON DELETE SET NULL,
    subject_id BIGINT REFERENCES subject(id) ON DELETE SET NULL,
    title VARCHAR(255),
    question_ids TEXT NOT NULL,
    total_questions INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    wrong_count INT NOT NULL DEFAULT 0,
    skipped_count INT NOT NULL DEFAULT 0,
    time_spent_seconds INT NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_session_item (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES question_session(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    selected_alternative_id BIGINT REFERENCES alternative(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_session_user_id ON test_session(user_id);
CREATE INDEX IF NOT EXISTS idx_test_session_test_id ON test_session(test_id);
CREATE INDEX IF NOT EXISTS idx_test_session_completed ON test_session(completed);
CREATE INDEX IF NOT EXISTS idx_test_session_item_session_id ON test_session_item(session_id);

CREATE INDEX IF NOT EXISTS idx_question_session_user_id ON question_session(user_id);
CREATE INDEX IF NOT EXISTS idx_question_session_completed ON question_session(completed);
CREATE INDEX IF NOT EXISTS idx_question_session_item_session_id ON question_session_item(session_id);
