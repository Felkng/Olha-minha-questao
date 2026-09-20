-- Torna area_id opcional na tabela question
ALTER TABLE question ALTER COLUMN area_id DROP NOT NULL;

-- Torna origin_id opcional na tabela test para compatibilidade com criação de provas por usuários comuns
ALTER TABLE test ALTER COLUMN origin_id DROP NOT NULL;

-- Garante unicidade de (test_id, year, identifier) para questões atreladas a uma prova
CREATE UNIQUE INDEX IF NOT EXISTS idx_question_test_year_identifier 
ON question (test_id, year, identifier);
