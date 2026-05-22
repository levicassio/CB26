// ============================================
// RANKING.JS — RANKING.HTML
// ============================================

import { getUsuarioAtual, getPerfil, logout, getRanking } from './supabase.js'


// ============================================
// BLOCO 1 — HEADER
// Visitante pode ver o ranking — não redireciona
// ============================================

async function iniciarHeader() {

  const user = await getUsuarioAtual()

  if (user) {
    // Logado — mostra foto e nome
    const { data: perfil } = await getPerfil(user.id)

    document.getElementById('header-logado').style.display = 'flex'
    document.getElementById('header-visitante').style.display = 'none'

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
      window.location.reload()
    })

  } else {
    // Visitante — mostra botão de login
    document.getElementById('header-visitante').style.display = 'flex'
    document.getElementById('header-logado').style.display = 'none'

    // Clique em fazer login — vai para index que tem o modal
    document.getElementById('btn-login').addEventListener('click', () => {
      window.location.href = 'index.html'
    })
  }
}


// ============================================
// BLOCO 2 — RANKING
// Busca e renderiza a tabela completa
// ============================================

async function carregarRanking() {

  const tabela = document.getElementById('tabela-ranking')
  const user = await getUsuarioAtual()

  const { data: ranking, error } = await getRanking()

  if (error || !ranking) {
    tabela.innerHTML = '<p>Erro ao carregar o ranking.</p>'
    return
  }

  if (ranking.length === 0) {
    tabela.innerHTML = '<p>Nenhum participante ainda.</p>'
    return
  }

  // Ordena por pontos — desempate por acertos exatos — depois alfabético
  ranking.sort((a, b) => {
    if (b.total_pontos !== a.total_pontos) return b.total_pontos - a.total_pontos
    if (b.acertos_exatos !== a.acertos_exatos) return b.acertos_exatos - a.acertos_exatos
    const nomeA = a.usuarios?.username || ''
    const nomeB = b.usuarios?.username || ''
    return nomeA.localeCompare(nomeB)
  })

  tabela.innerHTML = `
    <table class="ranking-tabela">
      <thead>
        <tr>
          <th>#</th>
          <th>Participante</th>
          <th>Pontos</th>
          <th>Acertos Exatos</th>
        </tr>
      </thead>
      <tbody>
        ${ranking.map((item, index) => {

          const posicao = index + 1
          const username = item.usuarios?.username || 'Usuário'
          const foto = item.usuarios?.foto_url ||
            'https://ui-avatars.com/api/?name=' + username + '&background=random'
          const pontos = item.total_pontos || 0
          const acertos = item.acertos_exatos || 0

          // Define a classe de destaque
          let classeDestaque = ''
          if (posicao === 1) classeDestaque = 'pos-ouro'
          else if (posicao === 2) classeDestaque = 'pos-prata'
          else if (posicao === 3) classeDestaque = 'pos-bronze'
          else if (posicao === ranking.length) classeDestaque = 'pos-ultimo'

          // Destaca o usuário logado
          const eUsuarioLogado = user && item.usuario_id === user.id
          if (eUsuarioLogado) classeDestaque += ' pos-logado'

          // Medalha por posição
          const medalha =
            posicao === 1 ? '🥇' :
            posicao === 2 ? '🥈' :
            posicao === 3 ? '🥉' : posicao

          return `
            <tr
              class="ranking-linha ${classeDestaque}"
              onclick="window.location.href='perfil.html?id=${item.usuario_id}'"
            >
              <td class="ranking-pos">${medalha}</td>
              <td class="ranking-usuario">
                <img
                  class="ranking-foto"
                  src="${foto}"
                  alt="${username}"
                >
                <span class="ranking-nome">${username}</span>
                ${eUsuarioLogado ? '<span class="voce-badge">você</span>' : ''}
              </td>
              <td class="ranking-pontos">${pontos}</td>
              <td class="ranking-acertos">${acertos}</td>
            </tr>
          `
        }).join('')}
      </tbody>
    </table>
  `
}


// ============================================
// INICIALIZA
// ============================================

iniciarHeader()
carregarRanking()