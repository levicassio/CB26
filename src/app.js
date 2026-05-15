// ============================================
// APP.JS — INDEX.HTML
// ============================================

import { supabase, getUsuarioAtual, getPerfil, logout, login, cadastrar, getJogos, getRanking } from './supabase.js'


// ============================================
// MODAL — ABRIR E FECHAR
// Declarado primeiro porque outros blocos usam
// ============================================

function abrirModal() {
  document.getElementById('modal-login').style.display = 'flex'
  document.getElementById('modal-overlay').style.display = 'block'
}

function fecharModal() {
  document.getElementById('modal-login').style.display = 'none'
  document.getElementById('modal-overlay').style.display = 'none'
  document.getElementById('input-email').value = ''
  document.getElementById('input-senha').value = ''
  document.getElementById('msg-erro-login').textContent = ''
  document.getElementById('msg-sucesso-login').textContent = ''
}

// Abre modal ao clicar em fazer login
document.getElementById('btn-login').addEventListener('click', () => {
  abrirModal()
})

// Fecha modal ao clicar no overlay
document.getElementById('modal-overlay').addEventListener('click', () => {
  fecharModal()
})


// ============================================
// BLOCO 1 — ESTADO DE LOGIN
// Decide o que mostrar no header e no hero
// ============================================

async function verificarLogin() {

  const user = await getUsuarioAtual()

  if (user) {
    // Usuário logado
    const { data: perfil } = await getPerfil(user.id)

    document.getElementById('header-logado').style.display = 'flex'
    document.getElementById('header-visitante').style.display = 'none'
    document.getElementById('hero-logado').style.display = 'block'
    document.getElementById('hero-visitante').style.display = 'none'

    if (perfil) {
      document.getElementById('header-nome').textContent = perfil.username
      document.getElementById('hero-nome').textContent = perfil.username
      if (perfil.foto_url) {
        document.getElementById('header-foto').src = perfil.foto_url
      }
    }

  } else {
    // Visitante
    document.getElementById('header-visitante').style.display = 'flex'
    document.getElementById('header-logado').style.display = 'none'
    document.getElementById('hero-visitante').style.display = 'block'
    document.getElementById('hero-logado').style.display = 'none'
  }
}


// ============================================
// BLOCO 1.1 — LOGOUT
// ============================================

document.getElementById('btn-logout').addEventListener('click', async () => {
  await logout()
  window.location.reload()
})


// ============================================
// BLOCO 1.2 — LINK PALPITAR
// Visitante abre modal, logado vai para palpites
// ============================================

document.getElementById('link-palpitar').addEventListener('click', async (e) => {
  e.preventDefault()
  const user = await getUsuarioAtual()
  if (user) {
    window.location.href = 'palpites.html'
  } else {
    abrirModal()
  }
})

document.getElementById('hero-btn-palpite').addEventListener('click', async (e) => {
  e.preventDefault()
  const user = await getUsuarioAtual()
  if (user) {
    window.location.href = 'palpites.html'
  } else {
    abrirModal()
  }
})


// ============================================
// BLOCO 2 — LOGIN E CADASTRO
// ============================================

document.getElementById('btn-entrar').addEventListener('click', async () => {

  const email = document.getElementById('input-email').value.trim()
  const senha = document.getElementById('input-senha').value.trim()
  const msgErro = document.getElementById('msg-erro-login')
  const msgSucesso = document.getElementById('msg-sucesso-login')

  msgErro.textContent = ''
  msgSucesso.textContent = ''

  if (!email || !senha) {
    msgErro.textContent = 'Preencha o email e a senha.'
    return
  }

  const { data, error } = await login(email, senha)

  if (error) {
    msgErro.textContent = 'Email ou senha incorretos.'
    return
  }

  // Login ok — fecha modal e atualiza o header
  fecharModal()
  verificarLogin()
})


document.getElementById('btn-cadastrar').addEventListener('click', async () => {

  const email = document.getElementById('input-email').value.trim()
  const senha = document.getElementById('input-senha').value.trim()
  const msgErro = document.getElementById('msg-erro-login')
  const msgSucesso = document.getElementById('msg-sucesso-login')

  msgErro.textContent = ''
  msgSucesso.textContent = ''

  if (!email || !senha) {
    msgErro.textContent = 'Preencha o email e a senha.'
    return
  }

  if (senha.length < 6) {
    msgErro.textContent = 'A senha precisa ter pelo menos 6 caracteres.'
    return
  }

  const { data, error } = await cadastrar(email, senha)

  if (error) {
    msgErro.textContent = 'Erro ao cadastrar. Tente novamente.'
    return
  }

  msgSucesso.textContent = 'Enviamos um link de confirmação para seu email. Confirme para ativar sua conta.'
})

// ============================================
// BLOCO 3 — JOGOS DO DIA
// Busca e exibe os jogos que acontecem hoje
// ============================================


async function carregarJogosDoDia() {

  const { data: jogos, error } = await getJogos()

  if (error || !jogos) return

  // Pega a data de hoje no formato YYYY-MM-DD
  const hoje = new Date().toISOString().split('T')[0]

  // Filtra só os jogos que acontecem hoje
  const jogosDoDia = jogos.filter(jogo => {
    return jogo.data_hora.startsWith(hoje)
  })

  const container = document.getElementById('jogos-hoje')

  // Se não tiver jogos hoje mostra uma mensagem
  if (jogosDoDia.length === 0) {
    container.innerHTML = '<p>Nenhum jogo hoje.</p>'
    return
  }

  // Renderiza cada jogo do dia
  container.innerHTML = jogosDoDia.map(jogo => {

    // Formata o horário do jogo
    const horario = new Date(jogo.data_hora).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // Define o status visual do jogo
    let statusHTML = ''
    if (jogo.status === 'ao_vivo') {
      statusHTML = '<span class="status-ao-vivo">● Ao Vivo</span>'
    } else if (jogo.status === 'finalizado') {
      statusHTML = `<span class="status-finalizado">Finalizado</span>`
    } else {
      statusHTML = `<span class="status-horario">${horario}</span>`
    }

    // Define o placar — só mostra se o jogo começou
    let placarHTML = ''
    if (jogo.status === 'ao_vivo' || jogo.status === 'finalizado') {
      placarHTML = `
        <span class="placar">${jogo.gols_casa ?? 0} x ${jogo.gols_fora ?? 0}</span>
      `
    } else {
      placarHTML = `<span class="placar-vs">vs</span>`
    }

    return `
      <div class="jogo-card">
        <div class="jogo-times">
          <span class="time-casa">${jogo.time_casa}</span>
          ${placarHTML}
          <span class="time-fora">${jogo.time_fora}</span>
        </div>
        <div class="jogo-info">
          ${statusHTML}
          <span class="jogo-fase">${jogo.fase} ${jogo.grupo ? '· Grupo ' + jogo.grupo : ''}</span>
        </div>
      </div>
    `
  }).join('')
}

carregarJogosDoDia()

// ============================================
// BLOCO 4 — TOP 3 DO HERO
// Busca os 3 primeiros do ranking e exibe
// com destaque ouro, prata e bronze
// ============================================

async function carregarTop3() {

  const { data: ranking, error } = await getRanking()

  if (error || !ranking) return

  const container = document.getElementById('top3-container')

  // Se não tiver ninguém no ranking ainda
  if (ranking.length === 0) {
    container.innerHTML = '<p>Nenhum participante ainda.</p>'
    return
  }

  // Pega só os 3 primeiros
  const top3 = ranking.slice(0, 3)

  // Medalhas e classes para cada posição
  const medalhas = ['🥇', '🥈', '🥉']
  const classes = ['primeiro', 'segundo', 'terceiro']

  container.innerHTML = top3.map((item, index) => {

    const username = item.usuarios?.username || 'Usuário'
    const foto = item.usuarios?.foto_url || ''
    const pontos = item.total_pontos || 0

    // Gera avatar com iniciais se não tiver foto
    const avatarUrl = foto || 
      'https://ui-avatars.com/api/?name=' + username + '&background=random'

    return `
      <div 
        class="top3-card ${classes[index]}"
        data-usuario-id="${item.usuario_id}"
        data-username="${username}"
        data-pontos="${pontos}"
        data-foto="${avatarUrl}"
      >
        <span class="top3-medalha">${medalhas[index]}</span>
        <img 
          class="top3-foto" 
          src="${avatarUrl}" 
          alt="${username}"
        >
        <span class="top3-nome">${username}</span>
        <span class="top3-pontos">${pontos} pts</span>
      </div>
    `
  }).join('')

  // Adiciona evento de hover em cada card do top 3
  document.querySelectorAll('.top3-card').forEach(card => {

    // Mouse entra no card — mostra o modal de perfil
    card.addEventListener('mouseenter', (e) => {
      const modal = document.getElementById('modal-perfil-hover')
      const foto = card.dataset.foto
      const username = card.dataset.username
      const pontos = card.dataset.pontos

      document.getElementById('perfil-hover-foto').src = foto
      document.getElementById('perfil-hover-nome').textContent = username
      document.getElementById('perfil-hover-pontos').textContent = pontos + ' pontos'

      // Posiciona o modal perto do cursor
      modal.style.display = 'block'
      modal.style.left = e.pageX + 15 + 'px'
      modal.style.top = e.pageY + 15 + 'px'
    })

    // Mouse sai do card — esconde o modal
    card.addEventListener('mouseleave', () => {
      document.getElementById('modal-perfil-hover').style.display = 'none'
    })

    // Clique no card — vai para o perfil completo
    card.addEventListener('click', () => {
      window.location.href = `perfil.html?id=${card.dataset.usuarioId}`
    })
  })
}

carregarTop3()

// ============================================
// INICIALIZA
// ============================================

verificarLogin()
