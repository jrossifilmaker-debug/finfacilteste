'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Cadastro() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [loading, setLoading] = useState(false)

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
      setSucesso(true)
    }
    setLoading(false)
  }

  if (sucesso) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Cadastro realizado!</h2>
          <p className="text-gray-500 mb-6">Verifique seu e-mail para confirmar o cadastro.</p>
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
          <p className="text-gray-500 mt-1">Crie a conta da sua empresa</p>
        </div>
        <form onSubmit={handleCadastro} className="flex flex-col gap-4">
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
          <div>
            <label className="text-sm text-gray-600 mb-1 block">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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