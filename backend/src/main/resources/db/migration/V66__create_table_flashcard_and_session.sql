CREATE TABLE IF NOT EXISTS flashcard (
    id BIGSERIAL PRIMARY KEY,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    area_id BIGINT REFERENCES area(id) ON DELETE SET NULL,
    subject_id BIGINT REFERENCES subject(id) ON DELETE SET NULL,
    folder_id BIGINT REFERENCES folder(id) ON DELETE SET NULL,
    created_by_user_id BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flashcard_area_id ON flashcard(area_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_subject_id ON flashcard(subject_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_folder_id ON flashcard(folder_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_created_by_user_id ON flashcard(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_is_public ON flashcard(is_public);

CREATE TABLE IF NOT EXISTS flashcard_session (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    folder_id BIGINT REFERENCES folder(id) ON DELETE SET NULL,
    total_cards INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    wrong_count INT NOT NULL DEFAULT 0,
    skipped_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flashcard_session_item (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES flashcard_session(id) ON DELETE CASCADE,
    flashcard_id BIGINT NOT NULL REFERENCES flashcard(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flashcard_session_user_id ON flashcard_session(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_session_folder_id ON flashcard_session(folder_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_session_item_session_id ON flashcard_session_item(session_id);
