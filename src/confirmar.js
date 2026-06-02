// ============================================
// CONFIRMAR.JS — CONFIRMAR.HTML
// Tela de definição de nome após confirmar email
// ============================================

import { supabase, getUsuarioAtual, criarPerfil, usernameDisponivel } from './supabase.js'


async function verificarPerfil() {

  // Aguarda a sessão ser estabelecida pelo Supabase
  // O link do email traz um token que precisa ser processado
  const { data: { session } } = await supabase.auth.getSession()

  let user = session?.user

  // Se não tiver sessão ainda aguarda o evento
  if (!user) {
    await new Promise((resolve) => {
      supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          user = session.user
          resolve()
        }
      })

      
    })
  }

  // Ainda sem usuário — vai para index
  if (!user) {
    window.location.href = 'index.html'
    return
  }

  // Verifica se já tem perfil criado
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  // Já tem perfil — vai para index
  if (perfil) {
    window.location.href = 'index.html'
    return
  }

  // Não tem perfil — mostra o formulário
  iniciarFormulario(user)
}


// ============================================
// BLOCO 2 — FORMULÁRIO DE NOME
// ============================================

function iniciarFormulario(user) {

  const input = document.getElementById('input-username')
  const msg = document.getElementById('msg-username')
  const btn = document.getElementById('btn-confirmar-nome')

  // Regex — só letras e underscore, 3 a 20 caracteres
  const regex = /^[a-zA-ZÀ-ú_]{3,20}$/

  // Lista de palavras bloqueadas
  const palavrasBloqueadas = [
    'admin', 'administrador', 'suporte', 'sistema',
    'moderador', 'root', 'superuser'
  ]

  // Valida em tempo real enquanto digita
  input.addEventListener('input', () => {

    const valor = input.value.trim()
    msg.textContent = ''

    if (valor.length === 0) return

    if (!regex.test(valor)) {
      msg.textContent = 'Use apenas letras e underscore, entre 3 e 20 caracteres.'
      msg.style.color = 'red'
      return
    }

    const bloqueado = palavrasBloqueadas.some(p =>
      valor.toLowerCase().includes(p)
    )

    if (bloqueado) {
      msg.textContent = 'Este nome não é permitido.'
      msg.style.color = 'red'
      return
    }

    msg.textContent = '✓ Nome válido'
    msg.style.color = 'green'
  })

  // Confirma o nome ao clicar no botão
  btn.addEventListener('click', async () => {

    const username = input.value.trim()
    msg.textContent = ''

    // Valida formato
    if (!regex.test(username)) {
      msg.textContent = 'Nome inválido. Use apenas letras e underscore, entre 3 e 20 caracteres.'
      msg.style.color = 'red'
      return
    }

    // Verifica palavras bloqueadas
    const bloqueado = palavrasBloqueadas.some(p =>
      username.toLowerCase().includes(p)
    )

    if (bloqueado) {
      msg.textContent = 'Este nome não é permitido. Escolha outro.'
      msg.style.color = 'red'
      return
    }

    // Verifica se o nome já está em uso
    msg.textContent = 'Verificando disponibilidade...'
    msg.style.color = 'orange'

    const disponivel = await usernameDisponivel(username)

    if (!disponivel) {
      msg.textContent = 'Este nome já está em uso. Escolha outro.'
      msg.style.color = 'red'
      return
    }

    // Cria o perfil no banco
    msg.textContent = 'Criando perfil...'
    msg.style.color = 'orange'

    const { error } = await criarPerfil(user.id, username)

    if (error) {
      msg.textContent = 'Erro ao criar perfil. Tente novamente.'
      msg.style.color = 'red'
      return
    }

    // Perfil criado — vai para o index
    msg.textContent = '✓ Perfil criado! Redirecionando...'
    msg.style.color = 'green'

    setTimeout(() => {
      window.location.href = 'index.html'
    }, 1500)
  })
}


// ============================================
// INICIALIZA
// ============================================

verificarPerfil()