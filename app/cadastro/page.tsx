'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Cadastro() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [loading, setLoading] = useState(false)
  const [conviteToken, setConviteToken] = useState('')
  const [conviteValido, setConviteValido] = useState<boolean | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('convite')
    const emailParam = params.get('email')
    if (emailParam) setEmail(decodeURIComponent(emailParam))
    if (token) {
      setConviteToken(token)
      verificarConvite(token)
    } else {
      setConviteValido(false)
    }
  }, [])

  async function verificarConvite(token: string) {
    const { data } = await supabase.from('convites').select('*').eq('token', token).eq('usado', false).single()
    setConviteValido(!!data)
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { empresa } }
    })
    if (error) {
      setErro('Erro ao cadastrar. Tente novamente.')
    } else {
      if (conviteToken) {
        await supabase.from('convites').update({ usado: true }).eq('token', conviteToken)
        await supabase.from('membros').update({ ativo: true }).eq('email', email)
      }
      setSucesso(true)
    }
    setLoading(false)
  }

  if (conviteValido === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p style={{ color: '#6b7280' }}>Verificando convite...</p>
      </main>
    )
  }

  if (conviteValido === false) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
          <p style={{ fontSize: 48, marginBottom: 16 }}>🔒</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2535', marginBottom: 8 }}>Acesso restrito</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
            O cadastro na plataforma FinFácil é feito apenas por convite.<br />
            Entre em contato com o administrador da sua empresa.
          </p>
          <a href="/" style={{ backgroundColor: '#2d6a4f', color: 'white', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Voltar ao login</a>
        </div>
      </main>
    )
  }

  if (sucesso) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
          <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
          <h2 className="text-2xl font-bold text-green-600 mb-4">Cadastro realizado!</h2>
          <p className="text-gray-500 mb-6">Sua conta foi criada com sucesso!</p>
          <a href="/" className="text-green-600 font-medium hover:underline">Ir para o login</a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">FinFácil</h1>
          <p className="text-gray-500 mt-1">
            {conviteToken ? 'Complete seu cadastro' : 'Crie a conta da sua empresa'}
          </p>
        </div>
        <form onSubmit={handleCadastro} className="flex flex-col gap-4">
          {!conviteToken && (
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Nome da empresa</label>
              <input
                type="text"
                placeholder="Ex: Padaria do João"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          )}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={!!conviteToken}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Senha</label>
            <input
              type="password"
              placeholder="mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          {erro && <p className="text-red-500 text-sm">{erro}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition mt-2 disabled:opacity-50"
          >
            {loading ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{' '}
          <a href="/" className="text-green-600 font-medium hover:underline">Entrar</a>
        </p>
      </div>
    </main>
  )
}
