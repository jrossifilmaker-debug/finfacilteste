'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NovaSenha() {
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleNovaSenha(e: React.FormEvent) {
    e.preventDefault()
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }
    if (senha.length < 6) { setErro('Mínimo 6 caracteres.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) { setErro('Erro ao atualizar senha.') }
    else { setSucesso(true) }
    setLoading(false)
  }

  if (sucesso) return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Senha atualizada!</h2>
        <a href="/" className="text-green-600 font-medium hover:underline">Ir para o login</a>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">FinFácil</h1>
          <p className="text-gray-500 mt-1">Criar nova senha</p>
        </div>
        <form onSubmit={handleNovaSenha} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Nova senha</label>
            <input type="password" placeholder="mínimo 6 caracteres" value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Confirmar senha</label>
            <input type="password" placeholder="repita a senha" value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-green-500" />
          </div>
          {erro && <p className="text-red-500 text-sm">{erro}</p>}
          <button type="submit" disabled={loading}
            className="bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </main>
  )
}