// ============================================
// PERFIL.JS — PERFIL.HTML
// ============================================

import { getUsuarioAtual, getPerfil, logout, getPalpites, getRanking } from './supabase.js'

// ============================================
// BLOCO 0 — HEADER
// ============================================

async function iniciarHeader() {

  const user = await getUsuarioAtual()

  if (user) {
    const { data: perfil } = await getPerfil(user.id)

    document.getElementById('header-logado').style.display = 'flex'
    document.getElementById('header-visitante').style.display = 'none'

    if (perfil) {
      document.getElementById('header-nome').textContent = perfil.username

      const fotoEl = document.getElementById('header-foto')
      fotoEl.src = perfil.foto_url ||
        'https://ui-avatars.com/api/?name=' + perfil.username + '&background=random'

      fotoEl.addEventListener('click', () => {
        window.location.href = `perfil.html?id=${user.id}`
      })

      document.getElementById('header-nome').addEventListener('click', () => {
        window.location.href = `perfil.html?id=${user.id}`
      })
    }

    document.getElementById('btn-logout').addEventListener('click', async () => {
      await logout()
      window.location.href = 'index.html'
    })

  } else {
    document.getElementById('header-visitante').style.display = 'flex'
    document.getElementById('header-logado').style.display = 'none'

    document.getElementById('btn-login').addEventListener('click', () => {
      window.location.href = 'index.html'
    })
  }
}

// ============================================
// BLOCO 1 — PEGA O ID DA URL
// perfil.html?id=xxx — busca o perfil desse ID
// Se não tiver ID na URL usa o usuário logado
// ============================================

function getIdDaUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('id')
}


// ============================================
// BLOCO 2 — PAÍS DA SORTE
// Calcula qual país o usuário mais pontuou
// ============================================

function calcularPaisDaSorte(palpites) {

  const pontosPorPais = {}

  palpites.forEach(p => {

    if (!p.jogos || p.pontos === null || p.pontos === undefined) return
    if (p.pontos === 0) return

    const casa = p.jogos.time_casa
    const fora = p.jogos.time_fora

    // Determina em qual time o usuário acertou mais
    const palCasa = p.gols_casa
    const palFora = p.gols_fora
    const resCasa = p.jogos.gols_casa
    const resFora = p.jogos.gols_fora

    // Acertou gols do time da casa
    if (palCasa === resCasa) {
      pontosPorPais[casa] = (pontosPorPais[casa] || 0) + p.pontos
    }

    // Acertou gols do time de fora
    if (palFora === resFora) {
      pontosPorPais[fora] = (pontosPorPais[fora] || 0) + p.pontos
    }
  })

  if (Object.keys(pontosPorPais).length === 0) return null

  // Retorna o país com mais pontos
  return Object.entries(pontosPorPais)
    .sort((a, b) => b[1] - a[1])[0][0]
}


// ============================================
// BLOCO 3 — POSIÇÃO NO RANKING
// Busca a posição do usuário na classificação
// ============================================

async function getPosicaoNoRanking(usuarioId) {

  const { data: ranking } = await getRanking()
  if (!ranking) return null

  // Ordena igual ao ranking.js
  ranking.sort((a, b) => {
    if (b.total_pontos !== a.total_pontos) return b.total_pontos - a.total_pontos
    if (b.acertos_exatos !== a.acertos_exatos) return b.acertos_exatos - a.acertos_exatos
    const nomeA = a.usuarios?.username || ''
    const nomeB = b.usuarios?.username || ''
    return nomeA.localeCompare(nomeB)
  })

  const posicao = ranking.findIndex(r => r.usuario_id === usuarioId)
  return posicao >= 0 ? posicao + 1 : null
}


// ============================================
// BLOCO 4 — CARREGAR PERFIL
// ============================================

async function carregarPerfil() {

  const userLogado = await getUsuarioAtual()
  const idDaUrl = getIdDaUrl()

  // Define qual ID carregar
  const idAlvo = idDaUrl || userLogado?.id

  // Se não tiver ID nenhum vai para index
  if (!idAlvo) {
    window.location.href = 'index.html'
    return
  }

  // Busca o perfil do ID alvo
  const { data: perfil } = await getPerfil(idAlvo)

  if (!perfil) {
    document.getElementById('perfil-dados').innerHTML =
      '<p>Perfil não encontrado.</p>'
    return
  }

  // Busca palpites do usuário alvo
  const { data: palpites } = await getPalpites(idAlvo)

  // Busca posição no ranking
  const posicao = await getPosicaoNoRanking(idAlvo)

  // Busca dados do ranking
  const { data: ranking } = await getRanking()
  const dadosRanking = ranking?.find(r => r.usuario_id === idAlvo)

  const totalPontos = dadosRanking?.total_pontos || 0
  const acertosExatos = dadosRanking?.acertos_exatos || 0

  // Foto ou avatar com iniciais
  const fotoUrl = perfil.foto_url ||
    'https://ui-avatars.com/api/?name=' + perfil.username + '&background=random'

  // País da sorte
  const paisDaSorte = palpites ? calcularPaisDaSorte(palpites) : null

  // É o próprio perfil?
  const eProprioPerfil = userLogado && userLogado.id === idAlvo

  // ── Renderiza os dados do perfil ──
  document.getElementById('perfil-dados').innerHTML = `
    <div class="perfil-card">

      <img class="perfil-foto" src="${fotoUrl}" alt="${perfil.username}">

      <div class="perfil-info">
        <h1 class="perfil-username">${perfil.username}</h1>

        <div class="perfil-stats">
          <div class="stat">
            <span class="stat-valor">${posicao ? '#' + posicao : '--'}</span>
            <span class="stat-label">Posição</span>
          </div>
          <div class="stat">
            <span class="stat-valor">${totalPontos}</span>
            <span class="stat-label">Pontos</span>
          </div>
          <div class="stat">
            <span class="stat-valor">${acertosExatos}</span>
            <span class="stat-label">Acertos Exatos</span>
          </div>
        </div>

        ${paisDaSorte ? `
          <div class="pais-sorte">
            🍀 País da sorte: <strong>${paisDaSorte}</strong>
          </div>
        ` : ''}

        ${eProprioPerfil ? `
          <a href="palpites.html" class="btn-ir-palpites">
            Fazer Palpites
          </a>
        ` : ''}
      </div>

    </div>
  `

  // ── Renderiza histórico dos últimos 5 jogos ──
  if (!palpites || palpites.length === 0) {
    document.getElementById('perfil-historico').innerHTML =
      '<p class="sem-historico">Nenhum palpite feito ainda.</p>'
    return
  }

  // Filtra só jogos finalizados e pega os últimos 5
  const finalizados = palpites
    .filter(p => p.jogos?.status === 'finalizado')
    .sort((a, b) => new Date(b.jogos.data_hora) - new Date(a.jogos.data_hora))
    .slice(0, 5)

  if (finalizados.length === 0) {
    document.getElementById('perfil-historico').innerHTML =
      '<p class="sem-historico">Nenhum jogo finalizado ainda.</p>'
    return
  }

  document.getElementById('perfil-historico').innerHTML = `
    <h2 class="historico-titulo">Últimos jogos</h2>
    <div class="historico-lista">
      ${finalizados.map(p => {

        const jogo = p.jogos
        const pontos = p.pontos ?? 0

        // Cor por pontuação
        let classePontos = 'pts-zero'
        if (pontos === 5) classePontos = 'pts-exato'
        else if (pontos >= 3) classePontos = 'pts-bom'
        else if (pontos === 1) classePontos = 'pts-parcial'

        return `
          <div class="historico-item">

            <div class="historico-jogo">
              <span class="historico-time">${jogo.time_casa}</span>
              <span class="historico-placar">
                ${jogo.gols_casa} x ${jogo.gols_fora}
              </span>
              <span class="historico-time">${jogo.time_fora}</span>
            </div>

            <div class="historico-palpite">
              Seu palpite: ${p.gols_casa} x ${p.gols_fora}
            </div>

            <span class="historico-pontos ${classePontos}">
              ${pontos} pts
            </span>

          </div>
        `
      }).join('')}
    </div>
  `
}


// ============================================
// INICIALIZA
// ============================================

iniciarHeader ()
carregarPerfil()