INSERT INTO app_user (id, name, email, password_hash, role, created_at, updated_at)
VALUES 
(1, 'Administrador', 'admin@olhaminhaquestao.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Fulano de Tal', 'fulano@olhaminhaquestao.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'GENERAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

SELECT setval('app_user_id_seq', GREATEST((SELECT MAX(id) FROM app_user), 1));
