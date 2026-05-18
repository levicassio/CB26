// ============================================
// APP.JS — INDEX.HTML
// ============================================

import { supabase, getUsuarioAtual, getPerfil, logout, login, cadastrar, getJogos, getRanking } from './supabase.js'

// Garante que o overlay começa fechado sempre
document.getElementById('modal-overlay').style.display = 'none'
document.getElementById('modal-login').style.display = 'none'


// ============================================
// MODAL — ABRIR E FECHAR
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

document.getElementById('btn-login').addEventListener('click', () => {
  abrirModal()
})

document.getElementById('modal-overlay').addEventListener('click', () => {
  fecharModal()
})


// ============================================
// BLOCO 1 — ESTADO DE LOGIN
// ============================================

async function verificarLogin() {

  const user = await getUsuarioAtual()

  if (user) {
    const { data: perfil } = await getPerfil(user.id)

    document.getElementById('header-logado').style.display = 'flex'
    document.getElementById('header-visitante').style.display = 'none'
    document.getElementById('hero-logado').style.display = 'block'
    document.getElementById('hero-visitante').style.display = 'none'

    if (perfil) {
      document.getElementById('header-nome').textContent = perfil.username
      document.getElementById('hero-nome').textContent = perfil.username

      const fotoEl = document.getElementById('header-foto')
      fotoEl.src = perfil.foto_url ||
        'https://ui-avatars.com/api/?name=' + perfil.username + '&background=random'

      // Clique na foto — vai para o perfil
      document.getElementById('header-foto').addEventListener('click', () => {
        window.location.href = `perfil.html?id=${user.id}`
      })

      // Clique no nome — vai para o perfil
      document.getElementById('header-nome').addEventListener('click', () => {
        window.location.href = `perfil.html?id=${user.id}`
      })
    }

  } else {
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
  fecharModal()
  await logout()
  window.location.reload()
})


// ============================================
// BLOCO 1.2 — LINK PALPITAR
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
// ============================================

// Converte nome do time para nome do arquivo da bandeira
function nomeBandeira(time) {
  return time
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
}

async function carregarJogosDoDia() {

  const { data: jogos, error } = await getJogos()
  if (error || !jogos) return

  const hoje = new Date().toISOString().split('T')[0]
  const jogosDoDia = jogos.filter(jogo => jogo.data_hora.startsWith(hoje))

  const container = document.getElementById('jogos-hoje')

  if (jogosDoDia.length === 0) {
    container.innerHTML = '<p>Nenhum jogo hoje.</p>'
    return
  }

  container.innerHTML = jogosDoDia.map(jogo => {

    const horario = new Date(jogo.data_hora).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    let statusHTML = ''
    if (jogo.status === 'ao_vivo') {
      statusHTML = '<span class="status-ao-vivo">● Ao Vivo</span>'
    } else if (jogo.status === 'finalizado') {
      statusHTML = `<span class="status-finalizado">Finalizado</span>`
    } else {
      statusHTML = `<span class="status-horario">${horario}</span>`
    }

    let placarHTML = ''
    if (jogo.status === 'ao_vivo' || jogo.status === 'finalizado') {
      placarHTML = `<span class="placar">${jogo.gols_casa ?? 0} x ${jogo.gols_fora ?? 0}</span>`
    } else {
      placarHTML = `<span class="placar-vs">vs</span>`
    }

    return `
      <div class="jogo-card">
        <div class="jogo-times">
          <div class="time">
            <img
              class="bandeira"
              src="./src/assets/images/${nomeBandeira(jogo.time_casa)}.png"
              alt="${jogo.time_casa}"
              onerror="this.style.display='none'"
            >
            <span class="time-casa">${jogo.time_casa}</span>
          </div>
          ${placarHTML}
          <div class="time">
            <span class="time-fora">${jogo.time_fora}</span>
            <img
              class="bandeira"
              src="./src/assets/images/${nomeBandeira(jogo.time_fora)}.png"
              alt="${jogo.time_fora}"
              onerror="this.style.display='none'"
            >
          </div>
        </div>
        <div class="jogo-info">
          ${statusHTML}
          <span class="jogo-fase">${jogo.fase} ${jogo.grupo ? '· Grupo ' + jogo.grupo : ''}</span>
        </div>
      </div>
    `
  }).join('')
}


// ============================================
// BLOCO 4 — TOP 3 DO HERO
// ============================================

async function carregarTop3() {

  const { data: ranking, error } = await getRanking()
  if (error || !ranking) return

  const container = document.getElementById('top3-container')

  if (ranking.length === 0) {
    container.innerHTML = '<p>Nenhum participante ainda.</p>'
    return
  }

  const top3 = ranking.slice(0, 3)
  const medalhas = ['🥇', '🥈', '🥉']
  const classes = ['primeiro', 'segundo', 'terceiro']

  container.innerHTML = top3.map((item, index) => {

    const username = item.usuarios?.username || 'Usuário'
    const foto = item.usuarios?.foto_url || ''
    const pontos = item.total_pontos || 0
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
        <img class="top3-foto" src="${avatarUrl}" alt="${username}">
        <span class="top3-nome">${username}</span>
        <span class="top3-pontos">${pontos} pts</span>
      </div>
    `
  }).join('')

  document.querySelectorAll('.top3-card').forEach(card => {

    card.addEventListener('mouseenter', (e) => {
      const modal = document.getElementById('modal-perfil-hover')
      document.getElementById('perfil-hover-foto').src = card.dataset.foto
      document.getElementById('perfil-hover-nome').textContent = card.dataset.username
      document.getElementById('perfil-hover-pontos').textContent = card.dataset.pontos + ' pontos'
      modal.style.display = 'block'
      modal.style.left = e.pageX + 15 + 'px'
      modal.style.top = e.pageY + 15 + 'px'
    })

    card.addEventListener('mouseleave', () => {
      document.getElementById('modal-perfil-hover').style.display = 'none'
    })

    card.addEventListener('click', () => {
      window.location.href = `perfil.html?id=${card.dataset.usuarioId}`
    })
  })
}


// ============================================
// INICIALIZA
// ============================================

verificarLogin()
carregarJogosDoDia()
carregarTop3()