-- Relação N:N entre Flashcard e Pasta (Decks)
CREATE TABLE IF NOT EXISTS saved_flashcard (
    id BIGSERIAL PRIMARY KEY,
    folder_id BIGINT NOT NULL REFERENCES folder(id) ON DELETE CASCADE,
    flashcard_id BIGINT NOT NULL REFERENCES flashcard(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_saved_flashcard_folder_flashcard UNIQUE (folder_id, flashcard_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_flashcard_folder_id ON saved_flashcard(folder_id);
CREATE INDEX IF NOT EXISTS idx_saved_flashcard_flashcard_id ON saved_flashcard(flashcard_id);

-- Relação N:N entre Prova/Simulado e Questão
CREATE TABLE IF NOT EXISTS test_question (
    id BIGSERIAL PRIMARY KEY,
    test_id BIGINT NOT NULL REFERENCES test(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    order_index INT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_test_question_test_question UNIQUE (test_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_test_question_test_id ON test_question(test_id);
CREATE INDEX IF NOT EXISTS idx_test_question_question_id ON test_question(question_id);

-- Sincroniza vínculos legados existentes
INSERT INTO test_question (test_id, question_id)
SELECT test_id, id FROM question 
WHERE test_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO saved_flashcard (folder_id, flashcard_id)
SELECT folder_id, id FROM flashcard 
WHERE folder_id IS NOT NULL
ON CONFLICT DO NOTHING;
