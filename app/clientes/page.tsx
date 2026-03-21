'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([])
  const [novo, setNovo] = useState({ nome: '', email: '', telefone: '', cpf_cnpj: '', tipo: 'cliente', observacao: '' })
  const [editando, setEditando] = useState<any>(null)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { carregarDados() }, [])

  function mostrarToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }
    const { data } = await supabase.from('clientes').select('*').eq('user_id', user.id).order('nome')
    setClientes(data || [])
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('clientes').insert({ ...novo, user_id: user?.id })
    setNovo({ nome: '', email: '', telefone: '', cpf_cnpj: '', tipo: 'cliente', observacao: '' })
    mostrarToast('Cadastro adicionado com sucesso!')
    carregarDados()
    setLoading(false)
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('clientes').update({
      nome: editando.nome,
      email: editando.email,
      telefone: editando.telefone,
      cpf_cnpj: editando.cpf_cnpj,
      tipo: editando.tipo,
      observacao: editando.observacao,
    }).eq('id', editando.id)
    setEditando(null)
    mostrarToast('Cadastro atualizado!')
    carregarDados()
  }

  async function excluir(id: number) {
    if (!confirm('Deseja excluir este cadastro?')) return
    await supabase.from('clientes').delete().eq('id', id)
    mostrarToast('Cadastro excluído!')
    carregarDados()
  }

  const filtrados = clientes.filter(c => {
    if (filtroTipo !== 'todos' && c.tipo !== filtroTipo) return false
    if (busca && !c.nome?.toLowerCase().includes(busca.toLowerCase()) &&
        !c.email?.toLowerCase().includes(busca.toLowerCase()) &&
        !c.telefone?.includes(busca)) return false
    return true
  })

  const inputClass = "w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-800 font-medium placeholder-gray-400 focus:outline-none focus:border-green-500 bg-white text-sm"
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1"

  return (
    <main className="min-h-screen bg-gray-50">
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-semibold">
          {toast}
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-gray-700 mb-4 text-lg">Editar cadastro</h2>
            <form onSubmit={salvarEdicao} className="flex flex-col gap-3">
              <div><label className={labelClass}>Nome</label>
                <input className={inputClass} value={editando.nome} onChange={e => setEditando({...editando, nome: e.target.value})} /></div>
              <div><label className={labelClass}>E-mail</label>
                <input type="email" className={inputClass} value={editando.email} onChange={e => setEditando({...editando, email: e.target.value})} /></div>
              <div><label className={labelClass}>Telefone</label>
                <input className={inputClass} value={editando.telefone} onChange={e => setEditando({...editando, telefone: e.target.value})} /></div>
              <div><label className={labelClass}>CPF/CNPJ</label>
                <input className={inputClass} value={editando.cpf_cnpj} onChange={e => setEditando({...editando, cpf_cnpj: e.target.value})} /></div>
              <div><label className={labelClass}>Tipo</label>
                <select className={inputClass} value={editando.tipo} onChange={e => setEditando({...editando, tipo: e.target.value})}>
                  <option value="cliente">Cliente</option>
                  <option value="fornecedor">Fornecedor</option>
                </select></div>
              <div><label className={labelClass}>Observação</label>
                <input className={inputClass} value={editando.observacao} onChange={e => setEditando({...editando, observacao: e.target.value})} /></div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setEditando(null)} className="flex-1 border-2 border-gray-300 text-gray-600 rounded-lg py-2 font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 bg-green-600 text-white rounded-lg py-2 font-semibold">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm px-4 md:px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-600">FinFácil</h1>
        <a href="/dashboard" className="text-sm text-gray-500 hover:text-green-600 font-medium">Voltar ao painel</a>
      </header>

      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-bold text-gray-700 mb-4">Novo cadastro</h2>
          <form onSubmit={adicionar} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={labelClass}>Nome completo</label>
              <input required placeholder="Ex: João da Silva" value={novo.nome} onChange={e => setNovo({...novo, nome: e.target.value})} className={inputClass} /></div>
            <div><label className={labelClass}>Tipo</label>
              <select value={novo.tipo} onChange={e => setNovo({...novo, tipo: e.target.value})} className={inputClass}>
                <option value="cliente">Cliente</option>
                <option value="fornecedor">Fornecedor</option>
              </select></div>
            <div><label className={labelClass}>E-mail</label>
              <input type="email" placeholder="email@exemplo.com" value={novo.email} onChange={e => setNovo({...novo, email: e.target.value})} className={inputClass} /></div>
            <div><label className={labelClass}>Telefone</label>
              <input placeholder="(11) 99999-9999" value={novo.telefone} onChange={e => setNovo({...novo, telefone: e.target.value})} className={inputClass} /></div>
            <div><label className={labelClass}>CPF / CNPJ</label>
              <input placeholder="000.000.000-00" value={novo.cpf_cnpj} onChange={e => setNovo({...novo, cpf_cnpj: e.target.value})} className={inputClass} /></div>
            <div><label className={labelClass}>Observação</label>
              <input placeholder="Opcional" value={novo.observacao} onChange={e => setNovo({...novo, observacao: e.target.value})} className={inputClass} /></div>
            <div className="md:col-span-2">
              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white rounded-lg px-4 py-3 font-bold hover:bg-green-700 disabled:opacity-50">
                {loading ? 'Salvando...' : '+ Adicionar cadastro'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-col md:flex-row gap-3">
          <input type="text" placeholder="Buscar por nome, e-mail ou telefone..." value={busca}
            onChange={e => setBusca(e.target.value)} className={inputClass + ' flex-1'} />
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={inputClass + ' md:w-40'}>
            <option value="todos">Todos</option>
            <option value="cliente">Clientes</option>
            <option value="fornecedor">Fornecedores</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtrados.map(c => (
            <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-gray-800">{c.nome}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.tipo === 'cliente' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {c.tipo === 'cliente' ? 'Cliente' : 'Fornecedor'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditando(c)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-semibold">Editar</button>
                  <button onClick={() => excluir(c.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg font-semibold">Excluir</button>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-sm text-gray-500">
                {c.email && <p>E-mail: {c.email}</p>}
                {c.telefone && <p>Tel: {c.telefone}</p>}
                {c.cpf_cnpj && <p>CPF/CNPJ: {c.cpf_cnpj}</p>}
                {c.observacao && <p className="text-gray-400 italic">{c.observacao}</p>}
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <div className="md:col-span-2 text-center py-12 text-gray-400">
              Nenhum cadastro encontrado.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}