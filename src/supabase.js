// CONEXAO COM A SUPABASE - COPA BOLAO 26

// IMPORTA A BIBLIOTECA DO SUPABASE VIA CDN
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"

// CHAVES

// URL DO PROJETO
const SUPABASE_URL = "https://yijfshnogypmyqkcxzmn.supabase.co"

// CHAVE PUBLICA
const SUPABASE_ANON_KEY = "sb_publishable_CzzMb-1D_lRDoFro8WpsaQ_yeQd_ssm"

// INICIALIZA O CLIENTE

// CRIA CONEXAO COM O BANCO USANDO AS CHAVES ACIMA
// EXPORTA PARA TODOS OS OUTROS ARQUIVOS JS 
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)