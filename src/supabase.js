// ============================================
// CONEXAO COM O SUPABASE - BOLAO COPA 26
// ============================================

// Importa a biblioteca do Supabase via CDN
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"

// URL do projeto — 
const SUPABASE_URL = "https://yijfshnogypmyqkcxzmn.supabase.co"

// Chave pública — 
const SUPABASE_ANON_KEY = "sb_publishable_CzzMb-1D_lRDoFro8WpsaQ_yeQd_ssm"

// Inicializa a conexão com o banco
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)


// ============================================
// AUTENTICAÇÃO
// ============================================

// Retorna o usuário logado no momento
// Retorna null se não tiver ninguém logado
export async function getUsuarioAtual() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Faz login com email e senha
export async function login(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  })
  return { data, error }
}

// Cadastra novo usuário com email e senha
// Supabase envia email de confirmação automaticamente
export async function cadastrar(email, senha) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha
  })
  return { data, error }
}

// Faz logout do usuário atual
export async function logout() {
  const { error } = await supabase.auth.signOut()
  return { error }
}


// ============================================
// USUÁRIOS
// ============================================

// Busca o perfil completo de um usuário pelo ID
export async function getPerfil(usuarioId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', usuarioId)
    .single()
  return { data, error }
}

// Cria o perfil do usuário após confirmar o email
// Chamado na tela de definição de nome de usuário
export async function criarPerfil(usuarioId, username) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert({ id: usuarioId, username })
  return { data, error }
}

// Atualiza a foto de perfil do usuário
export async function atualizarFoto(usuarioId, fotoUrl) {
  const { data, error } = await supabase
    .from('usuarios')
    .update({ foto_url: fotoUrl })
    .eq('id', usuarioId)
  return { data, error }
}

// Verifica se um nome de usuário já existe no sistema
// Retorna true se disponível, false se já está em uso
export async function usernameDisponivel(username) {
  const { data } = await supabase
    .from('usuarios')
    .select('username')
    .eq('username', username)

  // Se não achou nada significa que está disponível
  return data.length === 0
}


// ============================================
// JOGOS
// ============================================

// Busca todos os jogos ordenados por data
export async function getJogos() {
  const { data, error } = await supabase
    .from('jogos')
    .select('*')
    .order('data_hora', { ascending: true })
  return { data, error }
}

// Busca jogos de uma fase específica
// Exemplo: getJogosPorFase('grupos')
export async function getJogosPorFase(fase) {
  const { data, error } = await supabase
    .from('jogos')
    .select('*')
    .eq('fase', fase)
    .order('data_hora', { ascending: true })
  return { data, error }
}


// ============================================
// PALPITES
// ============================================

// Busca todos os palpites de um usuário
export async function getPalpites(usuarioId) {
  const { data, error } = await supabase
    .from('palpites')
    .select('*, jogos(*)')
    .eq('usuario_id', usuarioId)
  return { data, error }
}

// Salva ou atualiza um palpite
// Se já existe palpite para esse jogo atualiza, se não cria novo
export async function salvarPalpite(usuarioId, jogoId, golsCasa, golsFora, prorrogacao = false) {

  const { data, error } = await supabase
    .from('palpites')
    .upsert({
      usuario_id: usuarioId,
      jogo_id: jogoId,
      gols_casa: golsCasa,
      gols_fora: golsFora,
      prorrogacao,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'usuario_id, jogo_id'
    })
  return { data, error }
}


// ============================================
// RANKING
// ============================================

// Busca o ranking completo ordenado por pontos
// Critério de desempate: acertos exatos
// Segundo critério: alfabético por nome (feito no JS)
export async function getRanking() {
  const { data, error } = await supabase
    .from('ranking')
    .select('*, usuarios!inner(username, foto_url, is_admin)')
    .eq('usuarios.is_admin', false)
    .order('total_pontos', { ascending: false })
    .order('acertos_exatos', { ascending: false })
  return { data, error }
}

// ============================================
// PONTUAÇÃO
// ============================================
export function calcularPontos(palpite, resultado) {

  const palCasa = palpite.gols_casa
  const palFora = palpite.gols_fora

  let resCasa, resFora

  if (resultado.foi_prorrogacao && !palpite.prorrogacao) {
    resCasa = resultado.gols_casa_90min
    resFora = resultado.gols_fora_90min
  } else {
    resCasa = resultado.gols_casa
    resFora = resultado.gols_fora
  }

  // Determina vencedor do palpite
  const vencedorPalpite =
    palCasa > palFora ? 'casa' :
    palCasa < palFora ? 'fora' : 'empate'

  // Determina vencedor real
  const vencedorReal =
    resCasa > resFora ? 'casa' :
    resCasa < resFora ? 'fora' : 'empate'

  // 5 pontos — placar exato
  if (palCasa === resCasa && palFora === resFora) return 5

  // 3 pontos — acertou empate mas não o placar exato
  // Verifica ANTES das outras condições para não ser sobrescrito
  if (vencedorPalpite === 'empate' && vencedorReal === 'empate') return 3

  // 4 pontos — acertou vencedor + gols de um time
  if (vencedorPalpite === vencedorReal) {
    if (palCasa === resCasa || palFora === resFora) return 4
  }

  // 3 pontos — acertou só o vencedor
  if (vencedorPalpite === vencedorReal) return 3

  // 1 ponto — acertou gols de um time mas errou o vencedor
  if (palCasa === resCasa || palFora === resFora) return 1

  // 0 pontos — errou tudo
  return 0
}

// ============================================
// RECÁLCULO DE PONTOS
// ============================================

// Recalcula os pontos de todos os palpites de um jogo
// Chamado pelo admin após lançar o resultado oficial
// Atualiza a tabela palpites e a tabela ranking
export async function recalcularJogo(jogoId) {

  // Busca o resultado oficial do jogo incluindo placar dos 90min
  const { data: jogo, error: erroJogo } = await supabase
    .from('jogos')
    .select('*')
    .eq('id', jogoId)
    .single()

  if (erroJogo) return { error: erroJogo }

  // Busca todos os palpites desse jogo
  const { data: palpites, error: erroPalpites } = await supabase
    .from('palpites')
    .select('*')
    .eq('jogo_id', jogoId)

  if (erroPalpites) return { error: erroPalpites }

  // Para cada palpite calcula os pontos e atualiza no banco
  for (const palpite of palpites) {
    const pontos = calcularPontos(palpite, jogo)

    // Atualiza os pontos desse palpite específico
    await supabase
      .from('palpites')
      .update({ pontos })
      .eq('id', palpite.id)

    // Busca o total atual do ranking desse usuário
    const { data: rankingAtual } = await supabase
      .from('ranking')
      .select('*')
      .eq('usuario_id', palpite.usuario_id)
      .single()

    if (rankingAtual) {
      // Usuário já tem linha no ranking — soma os novos pontos
      await supabase
        .from('ranking')
        .update({
          total_pontos: rankingAtual.total_pontos + pontos,
          // Incrementa acertos exatos somente se fez placar exato
          acertos_exatos: pontos === 5
            ? rankingAtual.acertos_exatos + 1
            : rankingAtual.acertos_exatos,
          total_palpites: rankingAtual.total_palpites + 1,
          updated_at: new Date().toISOString()
        })
        .eq('usuario_id', palpite.usuario_id)
    } else {
      // Usuário ainda não tem linha no ranking — cria uma nova
      await supabase
        .from('ranking')
        .insert({
          usuario_id: palpite.usuario_id,
          total_pontos: pontos,
          acertos_exatos: pontos === 5 ? 1 : 0,
          total_palpites: 1
        })
    }
  }

  return { success: true }
}