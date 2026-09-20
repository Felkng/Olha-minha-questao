ALTER TABLE question 
ADD COLUMN IF NOT EXISTS correct_alternative_id BIGINT REFERENCES alternative(id) ON DELETE SET NULL;
