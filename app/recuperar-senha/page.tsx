'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`
    })

    if (error) {
      setErro('Erro ao enviar e-mail. Verifique o endereço.')
    } else {
      setEnviado(true)
    }
    setLoading(false)
  }

  if (enviado) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">E-mail enviado!</h2>
          <p className="text-gray-500 mb-6">Verifique sua caixa de entrada e clique no link para redefinir sua senha.</p>
          <a href="/" className="text-green-600 font-medium hover:underline">Voltar ao login</a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">FinFácil</h1>
          <p className="text-gray-500 mt-1">Recuperar senha</p>
        </div>
        <form onSubmit={handleRecuperar} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-green-500"
            />
          </div>
          {erro && <p className="text-red-500 text-sm">{erro}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          <a href="/" className="text-green-600 font-medium hover:underline">Voltar ao login</a>
        </p>
      </div>
    </main>
  )
}