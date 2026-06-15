// ============================================
// ADMIN.JS — ADMIN.HTML
// ============================================

import { supabase, getUsuarioAtual, getPerfil, logout, getJogos, recalcularJogo } from './supabase.js'

// ============================================
// BLOCO 1 — PROTEÇÃO DE ACESSO
// ============================================

async function verificarAdmin() {

  const user = await getUsuarioAtual()

  if (!user) {
    window.location.href = 'index.html'
    return null
  }

  const { data: perfil } = await getPerfil(user.id)

  if (!perfil || !perfil.is_admin) {
    window.location.href = 'index.html'
    return null
  }

  return user
}


// ============================================
// BLOCO 2 — HEADER
// ============================================

async function iniciarHeader(user) {

  const { data: perfil } = await getPerfil(user.id)

  document.getElementById('header-logado').style.display = 'flex'
  document.getElementById('header-visitante').style.display = 'none'

  if (perfil) {
    document.getElementById('header-nome').textContent = perfil.username

    const fotoEl = document.getElementById('header-foto')
    fotoEl.src = perfil.foto_url ||
      'https://ui-avatars.com/api/?name=' + perfil.username + '&background=random'
  }

  document.getElementById('btn-logout').addEventListener('click', async () => {
    await logout()
    window.location.href = 'index.html'
  })
}


// ============================================
// BLOCO 3 — CADASTRAR JOGO
// ============================================

function iniciarCadastrarJogo() {

  document.getElementById('admin-btn-salvar-jogo')
    .addEventListener('click', async () => {

      const timeCasa = document.getElementById('admin-time-casa').value.trim()
      const timeFora = document.getElementById('admin-time-fora').value.trim()
      const dataHora = document.getElementById('admin-data-hora').value
      const fase = document.getElementById('admin-fase').value
      const grupo = document.getElementById('admin-grupo').value.trim().toUpperCase() || null
      const msg = document.getElementById('admin-msg-jogo')

      msg.textContent = ''

      if (!timeCasa || !timeFora || !dataHora || !fase) {
        msg.textContent = 'Preencha todos os campos obrigatórios.'
        msg.style.color = 'red'
        return
      }

      const { error } = await supabase
        .from('jogos')
        .insert({
          time_casa: timeCasa,
          time_fora: timeFora,
          data_hora: new Date(dataHora).toISOString(),
          fase,
          grupo,
          status: 'aguardando'
        })

      if (error) {
        msg.textContent = 'Erro ao cadastrar jogo.'
        msg.style.color = 'red'
        return
      }

      msg.textContent = '✓ Jogo cadastrado com sucesso!'
      msg.style.color = 'green'

      document.getElementById('admin-time-casa').value = ''
      document.getElementById('admin-time-fora').value = ''
      document.getElementById('admin-data-hora').value = ''
      document.getElementById('admin-grupo').value = ''

      carregarJogosNoSelect()
    })
}


// ============================================
// BLOCO 4 — CARREGAR JOGOS NO SELECT
// ============================================

async function carregarJogosNoSelect() {

  const { data: jogos } = await getJogos()
  const select = document.getElementById('admin-select-jogo')

  select.innerHTML = '<option value="">Selecione um jogo</option>'

  if (!jogos) return

  const jogosAtivos = jogos.filter(j => j.status !== 'finalizado')

  jogosAtivos.forEach(jogo => {

    const data = new Date(jogo.data_hora).toLocaleDateString('pt-BR')
    const horario = new Date(jogo.data_hora).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    const option = document.createElement('option')
    option.value = jogo.id
    option.textContent = `${jogo.time_casa} x ${jogo.time_fora} — ${data} ${horario}`
    select.appendChild(option)
  })
}


// ============================================
// BLOCO 5 — LANÇAR RESULTADO
// ============================================

function iniciarLancarResultado() {

  document.getElementById('admin-btn-resultado')
    .addEventListener('click', async () => {

      const jogoId = document.getElementById('admin-select-jogo').value
      const golsCasa = Number(document.getElementById('admin-gols-casa').value)
      const golsFora = Number(document.getElementById('admin-gols-fora').value)
      const golsCasa90 = Number(document.getElementById('admin-gols-casa-90min').value)
      const golsFora90 = Number(document.getElementById('admin-gols-fora-90min').value)
      const foiProrroga = document.getElementById('admin-foi-prorroga').checked
      const status = document.getElementById('admin-status-jogo').value
      const msg = document.getElementById('admin-msg-resultado')

      msg.textContent = ''

      if (!jogoId) {
        msg.textContent = 'Selecione um jogo.'
        msg.style.color = 'red'
        return
      }

      // Atualiza o jogo no banco
      const { error } = await supabase
        .from('jogos')
        .update({
          gols_casa: golsCasa,
          gols_fora: golsFora,
          gols_casa_90min: golsCasa90,
          gols_fora_90min: golsFora90,
          foi_prorrogacao: foiProrroga,
          status
        })
        .eq('id', jogoId)

      if (error) {
        msg.textContent = 'Erro ao salvar resultado.'
        msg.style.color = 'red'
        return
      }

      if (status === 'finalizado') {

        msg.textContent = 'Criando palpites automáticos...'
        msg.style.color = 'orange'

        // Busca todos os usuários exceto admin
        const { data: usuarios } = await supabase
          .from('usuarios')
          .select('id')
          .eq('is_admin', false)

        if (usuarios && usuarios.length > 0) {
          for (const usuario of usuarios) {

            // Verifica se já tem palpite
            const { data: palpiteExistente } = await supabase
              .from('palpites')
              .select('id')
              .eq('usuario_id', usuario.id)
              .eq('jogo_id', jogoId)
              .maybeSingle()

            // Se não tem — cria 0x0
            if (!palpiteExistente) {
              await supabase
                .from('palpites')
                .insert({
                  usuario_id: usuario.id,
                  jogo_id: jogoId,
                  gols_casa: 0,
                  gols_fora: 0,
                  prorrogacao: false
                })
            }
          }
        }

        msg.textContent = 'Recalculando pontos...'
        msg.style.color = 'orange'

        const { error: erroCalculo } = await recalcularJogo(jogoId)

        if (erroCalculo) {
          msg.textContent = 'Resultado salvo mas erro ao recalcular pontos.'
          msg.style.color = 'red'
          return
        }

        msg.textContent = '✓ Resultado salvo e pontos recalculados!'
        msg.style.color = 'green'

        carregarJogosNoSelect()

      } else {
        msg.textContent = '✓ Status atualizado com sucesso!'
        msg.style.color = 'green'
      }
    })
}


// ============================================
// BLOCO 6 — GESTÃO DE USUÁRIOS
// ============================================

async function carregarUsuarios() {

  const { data: usuarios, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('username', { ascending: true })

  const lista = document.getElementById('admin-lista-usuarios')

  if (error || !usuarios) {
    lista.innerHTML = '<p>Erro ao carregar usuários.</p>'
    return
  }

  lista.innerHTML = usuarios.map(u => `
    <div class="admin-usuario-item" id="usuario-item-${u.id}">

      <div class="admin-usuario-info">
        <img
          class="admin-usuario-foto"
          src="${u.foto_url || 'https://ui-avatars.com/api/?name=' + u.username + '&background=random'}"
          alt="${u.username}"
        >
        <span class="admin-usuario-nome">${u.username}</span>
      </div>

      <div class="admin-usuario-acoes">

        <input
          class="admin-input-nome"
          id="input-nome-${u.id}"
          type="text"
          value="${u.username}"
          placeholder="Novo nome"
        >

        <button
          class="admin-btn-alterar-nome"
          onclick="alterarNome('${u.id}')"
        >
          Alterar nome
        </button>

        <button
          class="admin-btn-excluir"
          onclick="excluirUsuario('${u.id}')"
        >
          Excluir
        </button>

      </div>

    </div>
  `).join('')
}

window.alterarNome = async function(usuarioId) {

  const novoNome = document.getElementById(`input-nome-${usuarioId}`).value.trim()

  if (!novoNome) return

  const regex = /^[a-zA-ZÀ-ú_]{3,20}$/
  if (!regex.test(novoNome)) {
    alert('Nome inválido. Use apenas letras e underscore, entre 3 e 20 caracteres.')
    return
  }

  const { error } = await supabase
    .from('usuarios')
    .update({ username: novoNome })
    .eq('id', usuarioId)

  if (error) {
    alert('Erro ao alterar nome.')
    return
  }

  alert(`Nome alterado para "${novoNome}" com sucesso!`)
  carregarUsuarios()
}

window.excluirUsuario = async function(usuarioId) {

  const confirmar = confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')
  if (!confirmar) return

  await supabase.from('ranking').delete().eq('usuario_id', usuarioId)
  await supabase.from('palpites').delete().eq('usuario_id', usuarioId)
  await supabase.from('usuarios').delete().eq('id', usuarioId)

  alert('Usuário removido do sistema. Para remover completamente da autenticação, delete no painel do Supabase em Authentication → Users.')

  carregarUsuarios()
}


// ============================================
// INICIALIZA
// ============================================

async function iniciar() {

  const user = await verificarAdmin()
  if (!user) return

  await iniciarHeader(user)
  await carregarJogosNoSelect()

  iniciarCadastrarJogo()
  iniciarLancarResultado()
  carregarUsuarios()
}

iniciar()