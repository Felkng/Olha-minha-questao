-- ==============================================================================
-- Seed inicial do projeto Olha Minha Questão
-- Popula Bancas (Origin), Áreas, Provas (Test), Questões e Alternativas
-- ==============================================================================

-- 1. Limpeza de dados prévios (mantendo integridade referencial)
TRUNCATE TABLE alternative_image CASCADE;
TRUNCATE TABLE question_image CASCADE;
TRUNCATE TABLE image CASCADE;
UPDATE question SET correct_alternative_id = NULL;
TRUNCATE TABLE alternative CASCADE;
TRUNCATE TABLE question CASCADE;
TRUNCATE TABLE test CASCADE;
TRUNCATE TABLE area CASCADE;
TRUNCATE TABLE origin CASCADE;

-- 2. Inserção de Bancas / Origens
INSERT INTO origin (id, name, description) VALUES
(1, 'ENEM', 'Exame Nacional do Ensino Médio'),
(2, 'FUVEST', 'Fundação Universitária para o Vestibular - USP'),
(3, 'VUNESP', 'Fundação para o Vestibular da UNESP'),
(4, 'CEBRASPE', 'Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos'),
(5, 'FGV', 'Fundação Getulio Vargas');

-- 3. Inserção de Áreas do Conhecimento
INSERT INTO area (id, name, description) VALUES
(1, 'Matemática e suas Tecnologias', 'Álgebra, Geometria, Trigonometria, Estatística e Matemática Financeira'),
(2, 'Ciências da Natureza (Biologia)', 'Ecologia, Genética, Citologia, Fisiologia e Evolução'),
(3, 'Ciências da Natureza (Física)', 'Mecânica, Termodinâmica, Ondulatória, Óptica e Eletromagnetismo'),
(4, 'Ciências da Natureza (Química)', 'Química Geral, Físico-Química, Química Orgânica e Meio Ambiente'),
(5, 'Linguagens e Códigos (Português)', 'Interpretação de Texto, Gramática, Literatura e Teoria Literária'),
(6, 'Ciências Humanas (História)', 'História do Brasil, História Geral, Idade Média e Contemporânea'),
(7, 'Ciências Humanas (Geografia)', 'Geografia Física, Geopolítica, Urbanização e Meio Ambiente');

-- 4. Inserção de Provas (Tests)
INSERT INTO test (id, name, year, origin_id, area_id) VALUES
(1, 'ENEM 2024 - Caderno Amarelo (2º Dia)', 2024, 1, 1),
(2, 'ENEM 2024 - Caderno Azul (1º Dia)', 2024, 1, 5),
(3, 'FUVEST 2024 - 1ª Fase', 2024, 2, 2),
(4, 'VUNESP 2023 - Conhecimentos Gerais', 2023, 3, 3),
(5, 'CEBRASPE 2023 - Concurso Público TJ', 2023, 4, 5);

-- 5. Inserção de Questões (Vinculadas a Provas e Avulsas com test_id NULL)
INSERT INTO question (id, enunciado, identifier, year, origin_id, area_id, test_id) VALUES
-- Questão 1 (Vinculada à Prova 1 - ENEM Matemática)
(1, 'Um arquiteto deseja construir um reservatório cilíndrico com capacidade de 31,4 m³. Sabendo que a altura do reservatório deve ser de 2,5 metros e utilizando π ≈ 3,14, qual deve ser a medida do raio da base desse reservatório, em metros?', '136', 2024, 1, 1, 1),

-- Questão 2 (Vinculada à Prova 1 - ENEM Matemática)
(2, 'Em uma loja de eletrônicos, um smartphone custa R$ 2.000,00 à vista. Para pagamentos a prazo em 10 parcelas iguais, há um acréscimo de 15% sobre o preço à vista. Qual é o valor de cada parcela no pagamento a prazo?', '137', 2024, 1, 1, 1),

-- Questão 3 (Vinculada à Prova 2 - ENEM Português)
(3, 'No romance Macunaíma, de Mário de Andrade, o protagonista é apresentado como "o herói sem nenhum caráter". Essa caracterização sintetiza a proposta modernista de:', '15', 2024, 1, 5, 2),

-- Questão 4 (Vinculada à Prova 3 - FUVEST Biologia)
(4, 'A fotossíntese é essencial para os ecossistemas terrestres. Durante a etapa fotoquímica (fase clara), qual processo gera o oxigênio liberado para a atmosfera?', '42', 2024, 2, 2, 3),

-- Questão 5 (Vinculada à Prova 4 - VUNESP Física)
(5, 'Um corpo de massa 2 kg é abandonado a partir do repouso do topo de um edifício de 45 metros de altura. Desprezando a resistência do ar e considerando g = 10 m/s², com que velocidade o corpo atinge o solo?', '18', 2023, 3, 3, 4),

-- Questão 6 (Vinculada à Prova 5 - CEBRASPE Português)
(6, 'Assinale a opção em que a concordância verbal está em perfeita conformidade com a norma-padrão da língua portuguesa:', '01', 2023, 4, 5, 5),

-- Questão 7 (AVULSA - Sem prova vinculada - História)
(7, 'A Proclamação da República no Brasil, em 15 de novembro de 1889, resultou de uma aliança de interesses entre diversos setores da sociedade da época. Dentre os fatores que contribuíram diretamente para a queda do Império, destaca-se:', 'HIST-01', 2024, 1, 6, NULL),

-- Questão 8 (AVULSA - Sem prova vinculada - Geografia)
(8, 'O processo de conurbação urbana é caracterizado principalmente por:', 'GEO-01', 2024, 3, 7, NULL),

-- Questão 9 (AVULSA - Sem prova vinculada - Química)
(9, 'Qual é o tipo de ligação química predominante no cloreto de sódio (NaCl) e qual propriedade dos compostos com essa ligação justifica seu alto ponto de fusão?', 'QUI-01', 2023, 2, 4, NULL),

-- Questão 10 (AVULSA - Sem prova vinculada - Matemática)
(10, 'Uma função afim f(x) = ax + b passa pelos pontos (2, 5) e (4, 11). Qual é o valor de f(6)?', 'MAT-01', 2024, 5, 1, NULL);

-- 6. Inserção de Alternativas
INSERT INTO alternative (id, question_id, identifier, text, is_correct) VALUES
-- Alternativas da Questão 1 (Correta: B / 2 metros)
(1, 1, 'A', '1,0 metro', false),
(2, 1, 'B', '2,0 metros', true),
(3, 1, 'C', '3,14 metros', false),
(4, 1, 'D', '4,0 metros', false),
(5, 1, 'E', '5,0 metros', false),

-- Alternativas da Questão 2 (Correta: C / R$ 230,00)
(6, 2, 'A', 'R$ 200,00', false),
(7, 2, 'B', 'R$ 215,00', false),
(8, 2, 'C', 'R$ 230,00', true),
(9, 2, 'D', 'R$ 245,00', false),
(10, 2, 'E', 'R$ 250,00', false),

-- Alternativas da Questão 3 (Correta: D / Ruptura com a visão idealizada)
(11, 3, 'A', 'Copiar os moldes dos romances clássicos franceses do século XIX.', false),
(12, 3, 'B', 'Exaltar a superioridade moral do indígena de acordo com o romantismo indianista.', false),
(13, 3, 'C', 'Defender uma identidade nacional homogênea e sem contradições.', false),
(14, 3, 'D', 'Romper com a idealização heroica do romantismo, retratando as ambiguidades da identidade brasileira.', true),
(15, 3, 'E', 'Padronizar a língua culta eliminando regionalismos e expressões orais.', false),

-- Alternativas da Questão 4 (Correta: A / Fotólise da água)
(16, 4, 'A', 'Fotólise da molécula de água (quebra de H₂O pela luz).', true),
(17, 4, 'B', 'Redução do gás carbônico no ciclo de Calvin.', false),
(18, 4, 'C', 'Oxidação da molécula de glicose durante a glicólise.', false),
(19, 4, 'D', 'Síntese de ATP a partir de fosfatos livres no estroma.', false),
(20, 4, 'E', 'Degradação da clorofila nos tilacoides.', false),

-- Alternativas da Questão 5 (Correta: C / 30 m/s)
(21, 5, 'A', '15 m/s', false),
(22, 5, 'B', '20 m/s', false),
(23, 5, 'C', '30 m/s', true),
(24, 5, 'D', '45 m/s', false),
(25, 5, 'E', '90 m/s', false),

-- Alternativas da Questão 6 (Correta: B / Haviam -> Havia; Fazem -> Faz; Trata-se de...)
(26, 6, 'A', 'Haviam muitos candidatos aguardando o início da prova.', false),
(27, 6, 'B', 'Trata-se de medidas urgentes que visam ao aperfeiçoamento da gestão pública.', true),
(28, 6, 'C', 'Fazem dois anos que o tribunal implementou o sistema eletrônico.', false),
(29, 6, 'D', 'Devem haver soluções mais viáveis para o caso apresentado.', false),
(30, 6, 'E', 'Precisa-se de novos servidores para atuarem nas comarcas.', false),

-- Alternativas da Questão 7 (Correta: A / Questão militar e descontentamento dos fazendeiros)
(31, 7, 'A', 'O descontentamento dos cafeicultores com a abolição da escravidão sem indenização e a insatisfação militar.', true),
(32, 7, 'B', 'A invasão de tropas estrangeiras na região platina em apoio aos republicanos.', false),
(33, 7, 'C', 'A tentativa de Dom Pedro II de instituir uma monarquia absolutista no Brasil.', false),
(34, 7, 'D', 'O apoio incondicional da Igreja Católica aos ideais positivistas dos generais.', false),
(35, 7, 'E', 'A unificação das províncias sob uma constituição confederada inspirada nos Estados Unidos.', false),

-- Alternativas da Questão 8 (Correta: C / União física de duas ou mais cidades vizinhas)
(36, 8, 'A', 'A saída em massa da população do campo em direção aos centros urbanos.', false),
(37, 8, 'B', 'A verticalização excessiva das áreas centrais das metrópoles.', false),
(38, 8, 'C', 'A expansão horizontal de cidades vizinhas que leva à sua união espacial e contínua.', true),
(39, 8, 'D', 'A segregação socioespacial gerada pela criação de condomínios fechados.', false),
(40, 8, 'E', 'O retorno de migrantes das grandes capitais para suas cidades natais.', false),

-- Alternativas da Questão 9 (Correta: A / Ligação iônica com forte atração eletrostática)
(41, 9, 'A', 'Ligação iônica, decorrente da forte atração eletrostática entre os íons Na⁺ e Cl⁻ no retículo cristalino.', true),
(42, 9, 'B', 'Ligação covalente apolar, originada pelo compartilhamento simétrico de elétrons.', false),
(43, 9, 'C', 'Ligação metálica, formada pela nuvem de elétrons livres entre os átomos.', false),
(44, 9, 'D', 'Ligação de hidrogênio, provocada pela alta polaridade das moléculas de sal.', false),
(45, 9, 'E', 'Forças de London, que mantêm as moléculas fracamente unidas.', false),

-- Alternativas da Questão 10 (Correta: D / 17)
(46, 10, 'A', '13', false),
(47, 10, 'B', '14', false),
(48, 10, 'C', '15', false),
(49, 10, 'D', '17', true),
(50, 10, 'E', '19', false);

-- 7. Associação da Alternativa Correta na Tabela question
UPDATE question SET correct_alternative_id = 2 WHERE id = 1;
UPDATE question SET correct_alternative_id = 8 WHERE id = 2;
UPDATE question SET correct_alternative_id = 14 WHERE id = 3;
UPDATE question SET correct_alternative_id = 16 WHERE id = 4;
UPDATE question SET correct_alternative_id = 23 WHERE id = 5;
UPDATE question SET correct_alternative_id = 27 WHERE id = 6;
UPDATE question SET correct_alternative_id = 31 WHERE id = 7;
UPDATE question SET correct_alternative_id = 38 WHERE id = 8;
UPDATE question SET correct_alternative_id = 41 WHERE id = 9;
UPDATE question SET correct_alternative_id = 49 WHERE id = 10;

-- 8. Inicialização de estatísticas padrão para questões e provas
INSERT INTO question_statistic (question_id, total_attempts, first_attempts, first_attempt_correct, first_attempt_accuracy, difficulty_level)
SELECT id, 0, 0, 0, 0.0, 'SEM_DADOS' FROM question
ON CONFLICT (question_id) DO NOTHING;

-- Popula dados demonstrativos de dificuldade (Fácil, Média, Difícil)
-- Questão 1: 85% de acerto -> FACIL
UPDATE question_statistic SET total_attempts = 25, first_attempts = 20, first_attempt_correct = 17, first_attempt_accuracy = 85.0, difficulty_level = 'FACIL' WHERE question_id = 1;
-- Questão 2: 60% de acerto -> MEDIA
UPDATE question_statistic SET total_attempts = 18, first_attempts = 15, first_attempt_correct = 9, first_attempt_accuracy = 60.0, difficulty_level = 'MEDIA' WHERE question_id = 2;
-- Questão 3: 40% de acerto -> DIFICIL
UPDATE question_statistic SET total_attempts = 12, first_attempts = 10, first_attempt_correct = 4, first_attempt_accuracy = 40.0, difficulty_level = 'DIFICIL' WHERE question_id = 3;
-- Questão 4: 92% de acerto -> FACIL
UPDATE question_statistic SET total_attempts = 30, first_attempts = 25, first_attempt_correct = 23, first_attempt_accuracy = 92.0, difficulty_level = 'FACIL' WHERE question_id = 4;
-- Questão 5: 35.3% de acerto -> DIFICIL
UPDATE question_statistic SET total_attempts = 20, first_attempts = 17, first_attempt_correct = 6, first_attempt_accuracy = 35.29, difficulty_level = 'DIFICIL' WHERE question_id = 5;

INSERT INTO test_statistic (test_id, total_attempts, average_score, difficulty_level)
SELECT id, 0, 0.0, 'SEM_DADOS' FROM test
ON CONFLICT (test_id) DO NOTHING;

-- Prova 1: 72.5% -> MEDIA
UPDATE test_statistic SET total_attempts = 14, average_score = 72.5, difficulty_level = 'MEDIA' WHERE test_id = 1;
-- Prova 2: 82.0% -> FACIL
UPDATE test_statistic SET total_attempts = 18, average_score = 82.0, difficulty_level = 'FACIL' WHERE test_id = 2;
-- Prova 3: 45.0% -> DIFICIL
UPDATE test_statistic SET total_attempts = 22, average_score = 45.0, difficulty_level = 'DIFICIL' WHERE test_id = 3;

-- 9. Inserção de Usuários Padrão (ADMIN e GENERAL)
INSERT INTO app_user (id, name, email, password_hash, role, created_at, updated_at) VALUES
(1, 'Administrador', 'admin@olhaminhaquestao.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Fulano de Tal', 'fulano@olhaminhaquestao.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'GENERAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- 10. Atualização das sequências das tabelas
SELECT setval('origin_id_seq', (SELECT MAX(id) FROM origin));
SELECT setval('area_id_seq', (SELECT MAX(id) FROM area));
SELECT setval('test_id_seq', (SELECT MAX(id) FROM test));
SELECT setval('question_id_seq', (SELECT MAX(id) FROM question));
SELECT setval('alternative_id_seq', (SELECT MAX(id) FROM alternative));
SELECT setval('app_user_id_seq', (SELECT MAX(id) FROM app_user));
