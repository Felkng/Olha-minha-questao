CREATE TABLE IF NOT EXISTS alternative_image (
    id BIGSERIAL PRIMARY KEY,
    alternative_id BIGINT NOT NULL REFERENCES alternative(id) ON DELETE CASCADE,
    image_id BIGINT NOT NULL REFERENCES image(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_alternative_image UNIQUE (alternative_id, image_id)
);
