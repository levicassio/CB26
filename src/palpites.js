// ============================================
// PALPITES.JS — PALPITES.HTML
// ============================================

import { getUsuarioAtual, getPerfil, logout, getJogos, getPalpites, salvarPalpite } from './supabase.js'


// ============================================
// BLOCO 1 — HEADER
// Preenche foto e nome do usuário logado
// ============================================

async function iniciarHeader() {

  const user = await getUsuarioAtual()

  // Proteção de rota — se não estiver logado vai para index
  if (!user) {
    window.location.href = 'index.html'
    return
  }

  const { data: perfil } = await getPerfil(user.id)

  // Mostra o header logado
  document.getElementById('header-logado').style.display = 'flex'

  if (perfil) {
    document.getElementById('header-nome').textContent = perfil.username

    const fotoEl = document.getElementById('header-foto')
    fotoEl.src = perfil.foto_url ||
      'https://ui-avatars.com/api/?name=' + perfil.username + '&background=random'

    // Clique na foto — vai para o perfil
    fotoEl.addEventListener('click', () => {
      window.location.href = `perfil.html?id=${user.id}`
    })

    // Clique no nome — vai para o perfil
    document.getElementById('header-nome').addEventListener('click', () => {
      window.location.href = `perfil.html?id=${user.id}`
    })
  }

  // Logout
  document.getElementById('btn-logout').addEventListener('click', async () => {
    await logout()
    window.location.href = 'index.html'
  })

  // Carrega os palpites passando o user
  carregarPalpites(user)
}


// ============================================
// BLOCO 2 — BANDEIRAS
// Converte nome do time para nome do arquivo
// ============================================

function nomeBandeira(time) {
  return time
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
}


// ============================================
// BLOCO 3 — CARREGAR PALPITES
// Busca jogos e palpites do usuário e renderiza
// ============================================

async function carregarPalpites(user) {

  const lista = document.getElementById('lista-palpites')

  // Busca todos os jogos ordenados por data
  const { data: jogos, error: erroJogos } = await getJogos()
  if (erroJogos || !jogos) return

  // Busca palpites já salvos do usuário
  const { data: palpites } = await getPalpites(user.id)

  // Monta um mapa jogoId → palpite para acesso rápido
  const palpitesMap = {}
  if (palpites) {
    palpites.forEach(p => {
      palpitesMap[p.jogo_id] = p
    })
  }

  lista.innerHTML = ''

  // Renderiza cada jogo
  jogos.forEach(jogo => {

    const agora = new Date()
    const dataJogo = new Date(jogo.data_hora)
    const travado = agora >= dataJogo

    // Formata data e horário
    const horario = dataJogo.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
    const data = dataJogo.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })

    // Palpite já salvo ou padrão 0x0
    const palpiteSalvo = palpitesMap[jogo.id]
    const golsCasa = palpiteSalvo?.gols_casa ?? 0
    const golsFora = palpiteSalvo?.gols_fora ?? 0
    const prorrogacaoSalva = palpiteSalvo?.prorrogacao ?? false

    // Status visual
    let statusHTML = `<span class="status-horario">${data} • ${horario}</span>`
    if (jogo.status === 'ao_vivo') {
      statusHTML = `<span class="status-ao-vivo">● Ao Vivo</span>`
    } else if (jogo.status === 'finalizado') {
      statusHTML = `<span class="status-finalizado">Finalizado</span>`
    }

    // Fase ou grupo
    const faseLabel = jogo.grupo
      ? `GRUPO ${jogo.grupo}`
      : jogo.fase.toUpperCase()

    // Checkbox de prorrogação — só em eliminatórios
    const fasesEliminatorias = ['oitavas', 'quartas', 'semi', 'terceiro', 'final']
    const ehEliminatorio = fasesEliminatorias.includes(jogo.fase)

    const prorrogacaoHTML = ehEliminatorio ? `
      <div class="card-prorroga">
        <input
          type="checkbox"
          id="check-prorroga-${jogo.id}"
          ${prorrogacaoSalva ? 'checked' : ''}
          ${travado ? 'disabled' : ''}
        >
        <label for="check-prorroga-${jogo.id}">Vai para prorrogação</label>
        <span
          class="tooltip-prorroga"
          title="Se marcado, seu palpite vale até o fim da prorrogação. Se não marcado, vale apenas os 90 minutos."
        >?</span>
      </div>
    ` : ''

    // Resultado real — só mostra se finalizado
    const resultadoHTML = jogo.status === 'finalizado' ? `
      <div class="card-resultado">
        <span>Resultado: ${jogo.gols_casa} x ${jogo.gols_fora}</span>
        ${jogo.foi_prorrogacao ? '<span class="foi-prorroga">· Prorrogação</span>' : ''}
        <span class="pontos-obtidos" id="pontos-${jogo.id}">
          ${palpiteSalvo?.pontos !== null && palpiteSalvo?.pontos !== undefined
            ? palpiteSalvo.pontos + ' pts'
            : ''}
        </span>
      </div>
    ` : ''

    lista.innerHTML += `
      <div class="palpite-card ${travado ? 'travado' : ''}" id="card-${jogo.id}">

        <div class="card-header">
          <span class="card-fase">${faseLabel}</span>
          ${statusHTML}
        </div>

        <div class="card-times">

          <div class="card-time">
            <img
              class="bandeira"
              src="./src/assets/images/${nomeBandeira(jogo.time_casa)}.png"
              alt="${jogo.time_casa}"
              onerror="this.style.display='none'"
            >
            <span class="time-nome">${jogo.time_casa}</span>
          </div>

          <div class="card-controle">
            <button class="seta-cima" id="seta-cima-casa-${jogo.id}" ${travado ? 'disabled' : ''}>▲</button>
            <span class="gols-display" id="gols-casa-${jogo.id}">${golsCasa}</span>
            <button class="seta-baixo" id="seta-baixo-casa-${jogo.id}" ${travado ? 'disabled' : ''}>▼</button>
          </div>

          <span class="card-x">x</span>

          <div class="card-controle">
            <button class="seta-cima" id="seta-cima-fora-${jogo.id}" ${travado ? 'disabled' : ''}>▲</button>
            <span class="gols-display" id="gols-fora-${jogo.id}">${golsFora}</span>
            <button class="seta-baixo" id="seta-baixo-fora-${jogo.id}" ${travado ? 'disabled' : ''}>▼</button>
          </div>

          <div class="card-time direita">
            <span class="time-nome">${jogo.time_fora}</span>
            <img
              class="bandeira"
              src="./src/assets/images/${nomeBandeira(jogo.time_fora)}.png"
              alt="${jogo.time_fora}"
              onerror="this.style.display='none'"
            >
          </div>

        </div>

        ${prorrogacaoHTML}
        ${resultadoHTML}

        <div class="card-acoes" id="acoes-${jogo.id}" style="display:none">
          <button class="btn-salvar" id="btn-salvar-${jogo.id}">Salvar</button>
          <button class="btn-descartar" id="btn-descartar-${jogo.id}">Descartar</button>
        </div>

        <span class="msg-palpite" id="msg-${jogo.id}"></span>

        <div class="card-travado">
          🔒 Palpite encerrado
        </div>

      </div>
    `
  })

  // Adiciona interatividade nos jogos não travados
  jogos.forEach(jogo => {

    const travado = new Date() >= new Date(jogo.data_hora)
    if (travado) return

    const golsCasaEl = document.getElementById(`gols-casa-${jogo.id}`)
    const golsForaEl = document.getElementById(`gols-fora-${jogo.id}`)
    const acoes = document.getElementById(`acoes-${jogo.id}`)
    const msg = document.getElementById(`msg-${jogo.id}`)

    // Guarda valores originais para descartar
    const valorInicialCasa = Number(golsCasaEl.textContent)
    const valorInicialFora = Number(golsForaEl.textContent)

    function mostrarAcoes() {
      acoes.style.display = 'flex'
      msg.textContent = ''
    }

    function alterar(el, delta) {
      let atual = Number(el.textContent) + delta
      if (atual < 0) atual = 0
      if (atual > 15) atual = 15
      el.textContent = atual
      mostrarAcoes()
    }

    // Setas
    document.getElementById(`seta-cima-casa-${jogo.id}`)
      .addEventListener('click', () => alterar(golsCasaEl, 1))
    document.getElementById(`seta-baixo-casa-${jogo.id}`)
      .addEventListener('click', () => alterar(golsCasaEl, -1))
    document.getElementById(`seta-cima-fora-${jogo.id}`)
      .addEventListener('click', () => alterar(golsForaEl, 1))
    document.getElementById(`seta-baixo-fora-${jogo.id}`)
      .addEventListener('click', () => alterar(golsForaEl, -1))

    // Descartar
    document.getElementById(`btn-descartar-${jogo.id}`)
      .addEventListener('click', () => {
        golsCasaEl.textContent = valorInicialCasa
        golsForaEl.textContent = valorInicialFora
        acoes.style.display = 'none'
        msg.textContent = 'Alterações descartadas.'
      })

    // Salvar
    document.getElementById(`btn-salvar-${jogo.id}`)
      .addEventListener('click', async () => {

        const golsCasa = Number(golsCasaEl.textContent)
        const golsFora = Number(golsForaEl.textContent)

        // Pega o valor da prorrogação se for eliminatório
        const checkProrroga = document.getElementById(`check-prorroga-${jogo.id}`)
        const prorrogacao = checkProrroga ? checkProrroga.checked : false

        const { error } = await salvarPalpite(
          user.id,
          jogo.id,
          golsCasa,
          golsFora,
          prorrogacao
        )

        if (error) {
          msg.textContent = 'Erro ao salvar. Tente novamente.'
          return
        }

        msg.textContent = 'Palpite salvo com sucesso! ✓'
        acoes.style.display = 'none'
      })
  })
}


// ============================================
// INICIALIZA
// ============================================

iniciarHeader()