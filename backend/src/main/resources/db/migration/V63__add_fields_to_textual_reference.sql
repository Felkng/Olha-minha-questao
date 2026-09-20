-- Torna title e content opcionais
ALTER TABLE textual_reference ALTER COLUMN title DROP NOT NULL;
ALTER TABLE textual_reference ALTER COLUMN content DROP NOT NULL;

-- Adiciona os novos campos solicitados
ALTER TABLE textual_reference
    ADD COLUMN subtitle VARCHAR(500),
    ADD COLUMN reference VARCHAR(1000),
    ADD COLUMN caption VARCHAR(1000);
