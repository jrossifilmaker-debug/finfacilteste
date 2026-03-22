'use client'
import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro('E-mail ou senha incorretos.')
    } else {
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a4731 50%, #0a1628 100%)' }}>
      <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(45,155,106,0.3)', borderRadius: 20, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 0 0 1px rgba(45,155,106,0.15), 0 25px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(45,155,106,0.2)' }}>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="FinFácil" style={{ width: 56, height: 56, margin: '0 auto 12px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>FinFácil</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 6, fontSize: 14 }}>Gestão financeira para sua empresa</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(45,155,106,0.3)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Senha</label>
              <a href="/recuperar-senha" style={{ fontSize: 12, color: '#2d9b6a', fontWeight: 600, textDecoration: 'none' }}>Esqueceu a senha?</a>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(45,155,106,0.3)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {erro && (
            <div style={{ backgroundColor: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>⚠ {erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: '#2d6a4f', color: 'white', padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginTop: 8, boxShadow: '0 4px 15px rgba(45,106,79,0.4)', transition: 'all 0.2s ease' }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2d9b6a' }}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2d6a4f'}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 24, paddingTop: 20, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Não tem conta?{' '}
            <a href="/cadastro" style={{ color: '#2d9b6a', fontWeight: 600, textDecoration: 'none' }}>
              Cadastre sua empresa
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
