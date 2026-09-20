CREATE TABLE IF NOT EXISTS question_image (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    image_id BIGINT NOT NULL REFERENCES image(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_question_image UNIQUE (question_id, image_id)
);
