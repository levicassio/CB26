-- ============================================
-- SCRIPTS DO BOLÃO COPA 2026
-- ============================================


-- ============================================
-- RESETAR SENHA DE USUÁRIO
-- ============================================
-- UPDATE auth.users 
-- SET encrypted_password = crypt('nova_senha', gen_salt('bf'))
-- WHERE email = 'seu_email@aqui.com';


-- ============================================
-- USUÁRIOS DE TESTE
-- ============================================
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES 
--   ('11111111-1111-1111-1111-111111111111', 'teste2@teste.com', crypt('123456', gen_salt('bf')), NOW(), NOW(), NOW()),
--   ('22222222-2222-2222-2222-222222222222', 'teste3@teste.com', crypt('123456', gen_salt('bf')), NOW(), NOW(), NOW());

-- INSERT INTO usuarios (id, username)
-- VALUES 
--   ('11111111-1111-1111-1111-111111111111', 'Carlos'),
--   ('22222222-2222-2222-2222-222222222222', 'Ana');

-- INSERT INTO ranking (usuario_id, total_pontos, acertos_exatos, total_palpites)
-- VALUES 
--   ('11111111-1111-1111-1111-111111111111', 35, 2, 8),
--   ('22222222-2222-2222-2222-222222222222', 21, 1, 6);


-- ============================================
-- JOGOS DE TESTE
-- ============================================
-- INSERT INTO jogos (time_casa, time_fora, data_hora, fase, grupo, status, gols_casa, gols_fora)
-- VALUES 
--   ('Brasil', 'Argentina', NOW() + interval '2 hours', 'grupos', 'A', 'aguardando', null, null),
--   ('França', 'Espanha', NOW() - interval '30 minutes', 'grupos', 'B', 'ao_vivo', 1, 0),
--   ('Alemanha', 'Portugal', NOW() - interval '3 hours', 'grupos', 'C', 'finalizado', 2, 1);


-- ============================================
-- LIMPA TODOS OS DADOS DE TESTE
-- Rodar somente quando for lançar para usuários reais
-- ============================================
-- DELETE FROM jogos;
-- DELETE FROM ranking;
-- DELETE FROM palpites;
-- DELETE FROM usuarios;
-- DELETE FROM auth.users
-- WHERE email IN (
--   'leviconsultorluzespelho@gmail.com',
--   'teste2@teste.com',
--   'teste3@teste.com'
-- );