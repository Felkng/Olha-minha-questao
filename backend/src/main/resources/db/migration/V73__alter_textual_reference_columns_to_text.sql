-- Altera colunas de referência textual para TEXT, permitindo URLs longas e citações completas
ALTER TABLE textual_reference ALTER COLUMN source TYPE TEXT;
ALTER TABLE textual_reference ALTER COLUMN reference TYPE TEXT;
ALTER TABLE textual_reference ALTER COLUMN caption TYPE TEXT;
ALTER TABLE textual_reference ALTER COLUMN media_url TYPE TEXT;
