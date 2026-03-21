'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const MENU_ITEMS = [
  { id: 'painel', label: 'Painel', icon: '⊞' },
  { id: 'fluxo', label: 'Fluxo de Caixa', icon: '↕' },
  { id: 'estoque', label: 'Estoque', icon: '□' },
  { id: 'contas', label: 'Contas', icon: '◎' },
  { id: 'metas', label: 'Metas', icon: '◈' },
  { id: 'dre', label: 'DRE', icon: '≡' },
  { id: 'clientes', label: 'Clientes', icon: '○○' },
]

export default function Dashboard() {
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [contas, setContas] = useState<any[]>([])
  const [metas, setMetas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [aba, setAba] = useState('painel')
  const [usuario, setUsuario] = useState<any>(null)
  const [busca, setBusca] = useState('')
  const [toast, setToast] = useState('')
  const [dark, setDark] = useState(false)
  const [menuAberto, setMenuAberto] = useState(true)
  const [lancamentoAberto, setLancamentoAberto] = useState<any>(null)
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [editandoCliente, setEditandoCliente] = useState<any>(null)
  const [novoCliente, setNovoCliente] = useState({ nome: '', email: '', telefone: '', cpf_cnpj: '', tipo: 'cliente', observacao: '' })

  const [novoLanc, setNovoLanc] = useState({ descricao: '', valor: '', tipo: 'entrada', categoria: 'Vendas', produto_id: '', quantidade_vendida: '', forma_pagamento: 'dinheiro', cliente_id: '', observacao: '' })
  const [novoProd, setNovoProd] = useState({ nome: '', quantidade: '', quantidade_minima: '', preco_custo: '', preco_venda: '' })
  const [novaConta, setNovaConta] = useState({ descricao: '', valor: '', tipo: 'pagar', categoria: 'Fornecedores', vencimento: '' })
  const [novaMeta, setNovaMeta] = useState({ descricao: '', valor_meta: '', mes: '', tipo: 'entrada' })

  const [editandoLanc, setEditandoLanc] = useState<any>(null)
  const [editandoProd, setEditandoProd] = useState<any>(null)
  const [editandoConta, setEditandoConta] = useState<any>(null)
  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim] = useState('')

  const [isMobile, setIsMobile] = useState(false)
useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < 768)
  check()
  window.addEventListener('resize', check)
  return () => window.removeEventListener('resize', check)
}, [])

const SIDEBAR_W = isMobile ? 0 : (menuAberto ? 224 : 64)

  // cores baseadas no tema
  const bg = dark ? '#111827' : '#f9fafb'
  const card = dark ? '#1f2937' : '#ffffff'
  const cardBorder = dark ? '#374151' : '#e5e7eb'
  const txt = dark ? '#f9fafb' : '#1f2937'
  const txt2 = dark ? '#d1d5db' : '#374151'
  const txt3 = dark ? '#9ca3af' : '#6b7280'
  const inputBg = dark ? '#374151' : '#ffffff'
  const inputBorder = dark ? '#4b5563' : '#e5e7eb'
  const rowHover = dark ? '#374151' : '#f9fafb'
  const subBg = dark ? '#374151' : '#f9fafb'

  useEffect(() => {
    carregarDados()
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') setDark(true)
  }, [])

  function mostrarToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function toggleDark() {
    setDark(d => {
      localStorage.setItem('darkMode', String(!d))
      return !d
    })
  }

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }
    setUsuario(user)
    const { data: lanc } = await supabase.from('lancamentos').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setLancamentos(lanc || [])
    const { data: prod } = await supabase.from('produtos').select('*').eq('user_id', user.id)
    setProdutos(prod || [])
    const { data: cont } = await supabase.from('contas').select('*').eq('user_id', user.id).order('vencimento', { ascending: true })
    setContas(cont || [])
    const { data: met } = await supabase.from('metas').select('*').eq('user_id', user.id)
    setMetas(met || [])
    const { data: cli } = await supabase.from('clientes').select('*').eq('user_id', user.id).order('nome')
    setClientes(cli || [])
  }

  async function adicionarLancamento(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const lancamento: any = {
      descricao: novoLanc.descricao,
      valor: parseFloat(novoLanc.valor),
      tipo: novoLanc.tipo,
      categoria: novoLanc.categoria,
      forma_pagamento: novoLanc.forma_pagamento,
      cliente_id: novoLanc.cliente_id ? parseInt(novoLanc.cliente_id) : null,
      observacao: novoLanc.observacao,
      user_id: user?.id,
      data: new Date().toISOString().split('T')[0]
    }
    if (novoLanc.tipo === 'saida' && novoLanc.produto_id && novoLanc.quantidade_vendida) {
      lancamento.produto_id = parseInt(novoLanc.produto_id)
      lancamento.quantidade_vendida = parseFloat(novoLanc.quantidade_vendida)
      const produto = produtos.find(p => p.id === parseInt(novoLanc.produto_id))
      if (produto) await supabase.from('produtos').update({ quantidade: produto.quantidade - parseFloat(novoLanc.quantidade_vendida) }).eq('id', produto.id)
    }
    await supabase.from('lancamentos').insert(lancamento)
    setNovoLanc({ descricao: '', valor: '', tipo: 'entrada', categoria: 'Vendas', produto_id: '', quantidade_vendida: '', forma_pagamento: 'dinheiro', cliente_id: '', observacao: '' })
    mostrarToast('Lançamento adicionado!')
    carregarDados()
  }

  async function salvarEdicaoLanc(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('lancamentos').update({
      descricao: editandoLanc.descricao,
      valor: parseFloat(editandoLanc.valor),
      tipo: editandoLanc.tipo,
      categoria: editandoLanc.categoria,
      forma_pagamento: editandoLanc.forma_pagamento,
      observacao: editandoLanc.observacao,
    }).eq('id', editandoLanc.id)
    setEditandoLanc(null)
    mostrarToast('Lançamento atualizado!')
    carregarDados()
  }

  async function excluirLanc(id: any) {
    if (!confirm('Deseja excluir este lançamento?')) return
    await supabase.from('lancamentos').delete().eq('id', id)
    mostrarToast('Lançamento excluído!')
    carregarDados()
  }

  async function adicionarProduto(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('produtos').insert({ ...novoProd, quantidade: parseFloat(novoProd.quantidade), quantidade_minima: parseFloat(novoProd.quantidade_minima), preco_custo: parseFloat(novoProd.preco_custo), preco_venda: parseFloat(novoProd.preco_venda), user_id: user?.id })
    setNovoProd({ nome: '', quantidade: '', quantidade_minima: '', preco_custo: '', preco_venda: '' })
    mostrarToast('Produto adicionado!')
    carregarDados()
  }

  async function salvarEdicaoProd(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('produtos').update({ nome: editandoProd.nome, quantidade: parseFloat(editandoProd.quantidade), quantidade_minima: parseFloat(editandoProd.quantidade_minima), preco_custo: parseFloat(editandoProd.preco_custo), preco_venda: parseFloat(editandoProd.preco_venda) }).eq('id', editandoProd.id)
    setEditandoProd(null)
    mostrarToast('Produto atualizado!')
    carregarDados()
  }

  async function excluirProd(id: any) {
    if (!confirm('Deseja excluir este produto?')) return
    await supabase.from('produtos').delete().eq('id', id)
    mostrarToast('Produto excluído!')
    carregarDados()
  }

  async function adicionarConta(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('contas').insert({ ...novaConta, valor: parseFloat(novaConta.valor), user_id: user?.id })
    setNovaConta({ descricao: '', valor: '', tipo: 'pagar', categoria: 'Fornecedores', vencimento: '' })
    mostrarToast('Conta adicionada!')
    carregarDados()
  }

  async function marcarPago(id: any, pago: boolean) {
    await supabase.from('contas').update({ pago: !pago }).eq('id', id)
    mostrarToast(!pago ? 'Conta paga!' : 'Pagamento desfeito!')
    carregarDados()
  }

  async function excluirConta(id: any) {
    if (!confirm('Deseja excluir esta conta?')) return
    await supabase.from('contas').delete().eq('id', id)
    mostrarToast('Conta excluída!')
    carregarDados()
  }

  async function salvarEdicaoConta(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('contas').update({ descricao: editandoConta.descricao, valor: parseFloat(editandoConta.valor), tipo: editandoConta.tipo, vencimento: editandoConta.vencimento }).eq('id', editandoConta.id)
    setEditandoConta(null)
    mostrarToast('Conta atualizada!')
    carregarDados()
  }

  async function adicionarMeta(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('metas').insert({ ...novaMeta, valor_meta: parseFloat(novaMeta.valor_meta), user_id: user?.id })
    setNovaMeta({ descricao: '', valor_meta: '', mes: '', tipo: 'entrada' })
    mostrarToast('Meta adicionada!')
    carregarDados()
  }

  async function excluirMeta(id: any) {
    if (!confirm('Deseja excluir esta meta?')) return
    await supabase.from('metas').delete().eq('id', id)
    mostrarToast('Meta excluída!')
    carregarDados()
  }

  function gerarPDF() {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('FinFácil — Relatório de Fluxo de Caixa', 14, 20)
    doc.setFontSize(11)
    doc.text(`Empresa: ${usuario?.user_metadata?.empresa || ''}`, 14, 30)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 37)
    doc.setFontSize(12)
    doc.text(`Entradas: R$ ${entradas.toFixed(2)}`, 14, 50)
    doc.text(`Saídas: R$ ${saidas.toFixed(2)}`, 14, 58)
    doc.text(`Saldo: R$ ${saldo.toFixed(2)}`, 14, 66)
    autoTable(doc, {
      startY: 75,
      head: [['Data', 'Descrição', 'Categoria', 'Pagamento', 'Tipo', 'Valor']],
      body: lancamentosFiltrados.map(l => [l.data, l.descricao, l.categoria, l.forma_pagamento || 'dinheiro', l.tipo === 'entrada' ? 'Entrada' : 'Saída', `R$ ${Number(l.valor).toFixed(2)}`]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] }
    })
    doc.save('relatorio-finfacil.pdf')
    mostrarToast('PDF gerado!')
  }

  function exportarExcel() {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lancamentosFiltrados.map(l => ({ Data: l.data, Descrição: l.descricao, Categoria: l.categoria, Pagamento: l.forma_pagamento || 'dinheiro', Tipo: l.tipo === 'entrada' ? 'Entrada' : 'Saída', Valor: Number(l.valor) }))), 'Fluxo de Caixa')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(produtos.map(p => ({ Produto: p.nome, Quantidade: p.quantidade, 'Qtd Mínima': p.quantidade_minima, 'Preço Custo': Number(p.preco_custo), 'Preço Venda': Number(p.preco_venda) }))), 'Estoque')
    XLSX.writeFile(wb, 'finfacil-dados.xlsx')
    mostrarToast('Excel exportado!')
  }

  async function sair() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const lancamentosFiltrados = lancamentos.filter(l => {
    if (filtroInicio && l.data < filtroInicio) return false
    if (filtroFim && l.data > filtroFim) return false
    if (busca && !l.descricao?.toLowerCase().includes(busca.toLowerCase()) && !l.categoria?.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  const produtosFiltrados = produtos.filter(p => !busca || p.nome?.toLowerCase().includes(busca.toLowerCase()))
  const entradas = lancamentosFiltrados.filter(l => l.tipo === 'entrada').reduce((a, l) => a + Number(l.valor), 0)
  const saidas = lancamentosFiltrados.filter(l => l.tipo === 'saida').reduce((a, l) => a + Number(l.valor), 0)
  const saldo = entradas - saidas
  const produtosCriticos = produtos.filter(p => p.quantidade < p.quantidade_minima)
  const contasVencidas = contas.filter(c => !c.pago && c.vencimento < new Date().toISOString().split('T')[0])
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const dadosGrafico = (() => {
    const meses: any = {}
    lancamentos.forEach(l => {
      const mes = l.data?.substring(0, 7)
      if (!mes) return
      if (!meses[mes]) meses[mes] = { mes, entradas: 0, saidas: 0 }
      if (l.tipo === 'entrada') meses[mes].entradas += Number(l.valor)
      else meses[mes].saidas += Number(l.valor)
    })
    return Object.values(meses).sort((a: any, b: any) => a.mes.localeCompare(b.mes))
  })()
  const mesAtual = new Date().toISOString().substring(0, 7)
  const metasDoMes = metas.filter(m => m.mes === mesAtual)
  const iniciais = usuario?.user_metadata?.empresa?.substring(0, 2).toUpperCase() || 'FF'
  const formasPagamento = ['dinheiro', 'pix', 'credito', 'debito', 'transferencia', 'outros']

  const inp = { width: '100%', border: `1px solid ${inputBorder}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, backgroundColor: inputBg, color: txt, outline: 'none' } as React.CSSProperties
  const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: txt3, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 }
  const cardStyle = { backgroundColor: card, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 20 } as React.CSSProperties

  // Modal de detalhes do lançamento
  const ModalLancamento = ({ l, onClose }: { l: any, onClose: () => void }) => (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
      <div style={{ backgroundColor: card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: txt, margin: 0 }}>Detalhes do lançamento</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: txt3 }}>✕</button>
        </div>
        <div style={{ backgroundColor: subBg, borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: l.tipo === 'entrada' ? '#16a34a' : '#ef4444' }}>
              {l.tipo === 'entrada' ? '+' : '-'}{fmt(Number(l.valor))}
            </span>
            <span style={{ backgroundColor: l.tipo === 'entrada' ? '#dcfce7' : '#fee2e2', color: l.tipo === 'entrada' ? '#15803d' : '#dc2626', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
              {l.tipo === 'entrada' ? 'Entrada' : 'Saída'}
            </span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: txt, margin: 0 }}>{l.descricao}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {[
            { label: 'Data', valor: l.data },
            { label: 'Categoria', valor: l.categoria },
            { label: 'Forma de pagamento', valor: l.forma_pagamento || 'dinheiro' },
            { label: 'Cliente', valor: clientes.find(c => c.id === l.cliente_id)?.nome || '-' },
          ].map(item => (
            <div key={item.label} style={{ backgroundColor: subBg, borderRadius: 8, padding: 12 }}>
              <p style={{ fontSize: 11, color: txt3, fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>{item.label}</p>
              <p style={{ fontSize: 14, color: txt2, fontWeight: 500, margin: 0, textTransform: 'capitalize' }}>{item.valor}</p>
            </div>
          ))}
        </div>
        {l.observacao && (
          <div style={{ backgroundColor: subBg, borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: txt3, fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Observação</p>
            <p style={{ fontSize: 14, color: txt2, margin: 0 }}>{l.observacao}</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setEditandoLanc(l); onClose() }} style={{ flex: 1, backgroundColor: subBg, color: txt2, border: `1px solid ${cardBorder}`, padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Editar</button>
          <button onClick={() => { excluirLanc(l.id); onClose() }} style={{ flex: 1, backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Excluir</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: bg }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, backgroundColor: '#16a34a', color: 'white', padding: '12px 20px', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: 14, fontWeight: 600 }}>
          ✓ {toast}
        </div>
      )}

      {/* Modal lançamento aberto */}
      {lancamentoAberto && <ModalLancamento l={lancamentoAberto} onClose={() => setLancamentoAberto(null)} />}

      {/* Sidebar — só desktop */}
      {!isMobile && <aside style={{ width: SIDEBAR_W, minHeight: '100vh', backgroundColor: '#166534', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 40, boxShadow: '4px 0 20px rgba(0,0,0,0.15)', transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: menuAberto ? 'space-between' : 'center', padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {menuAberto && <span style={{ color: 'white', fontWeight: 700, fontSize: 20, whiteSpace: 'nowrap' }}>FinFácil</span>}
          <button onClick={() => setMenuAberto(!menuAberto)} style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4 }}>
            {menuAberto ? '◀' : '▶'}
          </button>
        </div>

        <nav style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
          {MENU_ITEMS.map(item => (
            <button key={item.id} onClick={() => setAba(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'left', whiteSpace: 'nowrap', transition: 'all 0.15s ease', backgroundColor: aba === item.id ? 'white' : 'transparent', color: aba === item.id ? '#166534' : 'rgba(255,255,255,0.9)' }}
              onMouseEnter={e => { if (aba !== item.id) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { if (aba !== item.id) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}>
              <span style={{ fontSize: 15, minWidth: 20, textAlign: 'center' }}>{item.icon}</span>
              {menuAberto && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={sair} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#fca5a5', backgroundColor: 'transparent', width: '100%', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 15, minWidth: 20, textAlign: 'center' }}>↩</span>
            {menuAberto && <span>Sair</span>}
          </button>
        </div>
      </aside>}

      {/* Bottom nav — só mobile */}
      {isMobile && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 64, boxShadow: '0 -4px 20px rgba(0,0,0,0.2)' }}>
          {MENU_ITEMS.map(item => (
            <button key={item.id} onClick={() => setAba(item.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', color: aba === item.id ? 'white' : 'rgba(255,255,255,0.5)' }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: aba === item.id ? 700 : 400 }}>{item.label.split(' ')[0]}</span>
            </button>
          ))}
          <button onClick={sair} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ fontSize: 18 }}>↩</span>
            <span style={{ fontSize: 9 }}>Sair</span>
          </button>
        </nav>
      )}

      {/* Main */}
      <div style={{ marginLeft: SIDEBAR_W, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)', backgroundColor: bg }}>

        {/* Header */}
        <header style={{ backgroundColor: card, borderBottom: `1px solid ${cardBorder}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: txt, margin: 0 }}>
            {MENU_ITEMS.find(m => m.id === aba)?.label || 'Painel'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${cardBorder}`, borderRadius: 8, padding: '6px 12px', gap: 8, backgroundColor: subBg }}>
              <span style={{ color: txt3, fontSize: 14 }}>🔍</span>
              <input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: txt, width: 140 }} />
            </div>
            {/* Toggle dark mode */}
            <div onClick={toggleDark} style={{ width: 48, height: 26, borderRadius: 99, backgroundColor: dark ? '#16a34a' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background-color 0.3s ease', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: dark ? 24 : 3, width: 20, height: 20, borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.3s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                {dark ? '🌙' : '☀️'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700 }}>
                {iniciais}
              </div>
              {menuAberto && <span style={{ fontSize: 14, fontWeight: 500, color: txt }}>{usuario?.user_metadata?.empresa}</span>}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: isMobile ? 12 : 24, paddingBottom: isMobile ? 80 : 24, backgroundColor: bg }}>

          {/* PAINEL */}
          {aba === 'painel' && (
            <div className="page-enter">
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Entradas do mês', valor: fmt(entradas), cor: '#16a34a', bg: dark ? '#14532d' : '#f0fdf4', border: dark ? '#166534' : '#bbf7d0' },
                  { label: 'Saídas do mês', valor: fmt(saidas), cor: '#ef4444', bg: dark ? '#7f1d1d' : '#fef2f2', border: dark ? '#991b1b' : '#fecaca' },
                  { label: 'Saldo atual', valor: fmt(saldo), cor: saldo >= 0 ? '#16a34a' : '#ef4444', bg: dark ? '#1f2937' : '#ffffff', border: cardBorder },
                  { label: 'Estoque crítico', valor: `${produtosCriticos.length} itens`, cor: '#f97316', bg: dark ? '#431407' : '#fff7ed', border: dark ? '#7c2d12' : '#fed7aa' },
                ].map(c => (
                  <div key={c.label} style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: txt3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{c.label}</p>
                    <p style={{ fontSize: 22, fontWeight: 700, color: c.cor, margin: 0 }}>{c.valor}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'A receber', valor: fmt(contas.filter(c => c.tipo === 'receber' && !c.pago).reduce((a, c) => a + Number(c.valor), 0)), cor: '#16a34a', btnBg: '#16a34a' },
                  { label: 'A pagar', valor: fmt(contas.filter(c => c.tipo === 'pagar' && !c.pago).reduce((a, c) => a + Number(c.valor), 0)), cor: '#ef4444', btnBg: '#ef4444' },
                ].map(c => (
                  <div key={c.label} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ ...lbl, marginBottom: 4 }}>{c.label}</p>
                      <p style={{ fontSize: 22, fontWeight: 700, color: c.cor, margin: 0 }}>{c.valor}</p>
                    </div>
                    <button onClick={() => setAba('contas')} style={{ backgroundColor: c.btnBg, color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Ver contas</button>
                  </div>
                ))}
              </div>

              {dadosGrafico.length > 0 && (
                <div style={{ ...cardStyle, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: txt, marginBottom: 16 }}>Entradas x Saídas por mês</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f0f0f0'} />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: txt3 }} />
                      <YAxis tick={{ fontSize: 11, fill: txt3 }} />
                      <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ backgroundColor: card, border: `1px solid ${cardBorder}`, color: txt }} />
                      <Legend />
                      <Bar dataKey="entradas" name="Entradas" fill="#16a34a" radius={[4,4,0,0]} />
                      <Bar dataKey="saidas" name="Saídas" fill="#dc2626" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {(produtosCriticos.length > 0 || contasVencidas.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  {produtosCriticos.length > 0 && (
                    <div style={{ backgroundColor: dark ? '#431407' : '#fff7ed', border: `1px solid ${dark ? '#7c2d12' : '#fed7aa'}`, borderRadius: 12, padding: 16 }}>
                      <p style={{ color: '#f97316', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>⚠ Estoque baixo</p>
                      {produtosCriticos.map(p => <p key={p.id} style={{ color: '#fb923c', fontSize: 13, margin: 0 }}>• {p.nome} — {p.quantidade} un.</p>)}
                    </div>
                  )}
                  {contasVencidas.length > 0 && (
                    <div style={{ backgroundColor: dark ? '#7f1d1d' : '#fef2f2', border: `1px solid ${dark ? '#991b1b' : '#fecaca'}`, borderRadius: 12, padding: 16 }}>
                      <p style={{ color: '#ef4444', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>⚠ Contas vencidas</p>
                      {contasVencidas.map(c => <p key={c.id} style={{ color: '#f87171', fontSize: 13, margin: 0 }}>• {c.descricao} — {fmt(c.valor)}</p>)}
                    </div>
                  )}
                </div>
              )}

              <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: txt, margin: 0 }}>Últimas movimentações</h2>
                  <button onClick={() => setAba('fluxo')} style={{ color: '#16a34a', background: 'none', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Ver todas</button>
                </div>
                {lancamentos.length === 0 && <p style={{ color: txt3, fontSize: 13, padding: 20 }}>Nenhuma movimentação ainda.</p>}
                {lancamentos.slice(0, 6).map(l => (
                  <div key={l.id} onClick={() => setLancamentoAberto(l)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: `1px solid ${dark ? '#374151' : '#f9fafb'}`, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = rowHover}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: l.tipo === 'entrada' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: l.tipo === 'entrada' ? '#16a34a' : '#ef4444', fontSize: 16 }}>
                        {l.tipo === 'entrada' ? '↑' : '↓'}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: txt, margin: 0 }}>{l.descricao}</p>
                        <p style={{ fontSize: 12, color: txt3, margin: 0 }}>{l.data} • {l.categoria} • {l.forma_pagamento || 'dinheiro'}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: l.tipo === 'entrada' ? '#16a34a' : '#ef4444' }}>
                      {l.tipo === 'entrada' ? '+' : '-'}{fmt(Number(l.valor))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FLUXO */}
          {aba === 'fluxo' && (
            <div className="page-enter">
              {editandoLanc && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
                  <div style={{ backgroundColor: card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: txt, marginBottom: 20 }}>Editar lançamento</h2>
                    <form onSubmit={salvarEdicaoLanc} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div><label style={lbl}>Descrição</label><input style={inp} value={editandoLanc.descricao} onChange={e => setEditandoLanc({...editandoLanc, descricao: e.target.value})} /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><label style={lbl}>Valor (R$)</label><input type="number" step="0.01" style={inp} value={editandoLanc.valor} onChange={e => setEditandoLanc({...editandoLanc, valor: e.target.value})} /></div>
                        <div><label style={lbl}>Tipo</label><select style={inp} value={editandoLanc.tipo} onChange={e => setEditandoLanc({...editandoLanc, tipo: e.target.value})}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><label style={lbl}>Categoria</label><select style={inp} value={editandoLanc.categoria} onChange={e => setEditandoLanc({...editandoLanc, categoria: e.target.value})}>{['Vendas','Fornecedores','Salários','Aluguel','Impostos','Outros'].map(c => <option key={c}>{c}</option>)}</select></div>
                        <div><label style={lbl}>Pagamento</label><select style={inp} value={editandoLanc.forma_pagamento} onChange={e => setEditandoLanc({...editandoLanc, forma_pagamento: e.target.value})}>{formasPagamento.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}</select></div>
                      </div>
                      <div><label style={lbl}>Observação</label><textarea style={{...inp, resize: 'none'} as React.CSSProperties} rows={2} value={editandoLanc.observacao || ''} onChange={e => setEditandoLanc({...editandoLanc, observacao: e.target.value})} /></div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button type="button" onClick={() => setEditandoLanc(null)} style={{ flex: 1, backgroundColor: subBg, color: txt2, border: `1px solid ${cardBorder}`, padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                        <button type="submit" style={{ flex: 1, backgroundColor: '#16a34a', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: txt, margin: 0 }}>Período</h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={gerarPDF} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>PDF</button>
                    <button onClick={exportarExcel} style={{ backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Excel</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><label style={lbl}>Data início</label><input type="date" style={inp} value={filtroInicio} onChange={e => setFiltroInicio(e.target.value)} /></div>
                  <div style={{ flex: 1 }}><label style={lbl}>Data fim</label><input type="date" style={inp} value={filtroFim} onChange={e => setFiltroFim(e.target.value)} /></div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}><button onClick={() => { setFiltroInicio(''); setFiltroFim('') }} style={{ backgroundColor: subBg, color: txt2, border: `1px solid ${cardBorder}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Limpar</button></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                {[
                  { label: 'Entradas', valor: fmt(entradas), cor: '#16a34a', bg: dark ? '#14532d' : '#f0fdf4', border: dark ? '#166534' : '#bbf7d0' },
                  { label: 'Saídas', valor: fmt(saidas), cor: '#ef4444', bg: dark ? '#7f1d1d' : '#fef2f2', border: dark ? '#991b1b' : '#fecaca' },
                  { label: 'Saldo', valor: fmt(saldo), cor: saldo >= 0 ? '#16a34a' : '#ef4444', bg: card, border: cardBorder },
                ].map(c => (
                  <div key={c.label} style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: txt3, textTransform: 'uppercase', marginBottom: 4 }}>{c.label}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: c.cor, margin: 0 }}>{c.valor}</p>
                  </div>
                ))}
              </div>

              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: txt, marginBottom: 16 }}>Novo lançamento</h2>
                <form onSubmit={adicionarLancamento} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/3' }}><label style={lbl}>Descrição</label><input required placeholder="Ex: Venda do dia" style={inp} value={novoLanc.descricao} onChange={e => setNovoLanc({...novoLanc, descricao: e.target.value})} /></div>
                  <div><label style={lbl}>Valor (R$)</label><input required type="number" step="0.01" placeholder="0,00" style={inp} value={novoLanc.valor} onChange={e => setNovoLanc({...novoLanc, valor: e.target.value})} /></div>
                  <div><label style={lbl}>Tipo</label><select style={inp} value={novoLanc.tipo} onChange={e => setNovoLanc({...novoLanc, tipo: e.target.value, produto_id: '', quantidade_vendida: ''})}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div>
                  <div><label style={lbl}>Categoria</label><select style={inp} value={novoLanc.categoria} onChange={e => setNovoLanc({...novoLanc, categoria: e.target.value})}>{['Vendas','Fornecedores','Salários','Aluguel','Impostos','Outros'].map(c => <option key={c}>{c}</option>)}</select></div>
                  <div><label style={lbl}>Pagamento</label><select style={inp} value={novoLanc.forma_pagamento} onChange={e => setNovoLanc({...novoLanc, forma_pagamento: e.target.value})}>{formasPagamento.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}</select></div>
                  <div><label style={lbl}>Cliente</label><select style={inp} value={novoLanc.cliente_id} onChange={e => setNovoLanc({...novoLanc, cliente_id: e.target.value})}><option value="">Nenhum</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                  {novoLanc.tipo === 'saida' && <>
                    <div><label style={lbl}>Produto</label><select style={inp} value={novoLanc.produto_id} onChange={e => setNovoLanc({...novoLanc, produto_id: e.target.value})}><option value="">Nenhum</option>{produtos.map(p => <option key={p.id} value={p.id}>{p.nome} (qtd: {p.quantidade})</option>)}</select></div>
                    {novoLanc.produto_id && <div><label style={lbl}>Qtd vendida</label><input type="number" placeholder="0" style={inp} value={novoLanc.quantidade_vendida} onChange={e => setNovoLanc({...novoLanc, quantidade_vendida: e.target.value})} /></div>}
                  </>}
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Observação (opcional)</label><textarea placeholder="Ex: Pedido referente à venda..." style={{...inp, resize: 'none'} as React.CSSProperties} rows={2} value={novoLanc.observacao} onChange={e => setNovoLanc({...novoLanc, observacao: e.target.value})} /></div>
                  <div style={{ gridColumn: '1/-1' }}><button type="submit" style={{ width: '100%', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Adicionar lançamento</button></div>
                </form>
              </div>

              <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 700 }}>
                    <thead style={{ backgroundColor: subBg, borderBottom: `1px solid ${cardBorder}` }}>
                      <tr>{['Data','Descrição','Cliente','Categoria','Pagamento','Valor','Tipo','Ações'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {lancamentosFiltrados.map(l => (
                        <tr key={l.id} onClick={() => setLancamentoAberto(l)} style={{ borderTop: `1px solid ${dark ? '#374151' : '#f3f4f6'}`, cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = rowHover}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '12px 16px', color: txt3, fontSize: 12 }}>{l.data}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 500, color: txt }}>{l.descricao}</td>
                          <td style={{ padding: '12px 16px', color: txt2, fontSize: 12 }}>{clientes.find(c => c.id === l.cliente_id)?.nome || '-'}</td>
                          <td style={{ padding: '12px 16px', color: txt3, fontSize: 12 }}>{l.categoria}</td>
                          <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: dark ? '#374151' : '#f3f4f6', color: txt2, padding: '2px 8px', borderRadius: 4, fontSize: 11, textTransform: 'capitalize' }}>{l.forma_pagamento || 'dinheiro'}</span></td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: l.tipo === 'entrada' ? '#16a34a' : '#ef4444' }}>{fmt(Number(l.valor))}</td>
                          <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: l.tipo === 'entrada' ? '#dcfce7' : '#fee2e2', color: l.tipo === 'entrada' ? '#15803d' : '#dc2626', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{l.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                          <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => setEditandoLanc(l)} style={{ backgroundColor: subBg, color: txt2, border: `1px solid ${cardBorder}`, padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Editar</button>
                              <button onClick={() => excluirLanc(l.id)} style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Excluir</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {lancamentosFiltrados.length === 0 && <p style={{ textAlign: 'center', color: txt3, padding: 32, fontSize: 13 }}>Nenhum lançamento encontrado.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ESTOQUE */}
          {aba === 'estoque' && (
            <div className="page-enter">
              {editandoProd && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
                  <div style={{ backgroundColor: card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: txt, marginBottom: 20 }}>Editar produto</h2>
                    <form onSubmit={salvarEdicaoProd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div><label style={lbl}>Nome</label><input style={inp} value={editandoProd.nome} onChange={e => setEditandoProd({...editandoProd, nome: e.target.value})} /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><label style={lbl}>Quantidade</label><input type="number" style={inp} value={editandoProd.quantidade} onChange={e => setEditandoProd({...editandoProd, quantidade: e.target.value})} /></div>
                        <div><label style={lbl}>Qtd mínima</label><input type="number" style={inp} value={editandoProd.quantidade_minima} onChange={e => setEditandoProd({...editandoProd, quantidade_minima: e.target.value})} /></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><label style={lbl}>Preço custo</label><input type="number" step="0.01" style={inp} value={editandoProd.preco_custo} onChange={e => setEditandoProd({...editandoProd, preco_custo: e.target.value})} /></div>
                        <div><label style={lbl}>Preço venda</label><input type="number" step="0.01" style={inp} value={editandoProd.preco_venda} onChange={e => setEditandoProd({...editandoProd, preco_venda: e.target.value})} /></div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button type="button" onClick={() => setEditandoProd(null)} style={{ flex: 1, backgroundColor: subBg, color: txt2, border: `1px solid ${cardBorder}`, padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                        <button type="submit" style={{ flex: 1, backgroundColor: '#16a34a', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: txt, marginBottom: 16 }}>Novo produto</h2>
                <form onSubmit={adicionarProduto} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Nome do produto</label><input required placeholder="Ex: Farinha de trigo 1kg" style={inp} value={novoProd.nome} onChange={e => setNovoProd({...novoProd, nome: e.target.value})} /></div>
                  <div><label style={lbl}>Quantidade atual</label><input required type="number" style={inp} value={novoProd.quantidade} onChange={e => setNovoProd({...novoProd, quantidade: e.target.value})} /></div>
                  <div><label style={lbl}>Quantidade mínima</label><input required type="number" style={inp} value={novoProd.quantidade_minima} onChange={e => setNovoProd({...novoProd, quantidade_minima: e.target.value})} /></div>
                  <div><label style={lbl}>Preço de custo (R$)</label><input required type="number" step="0.01" style={inp} value={novoProd.preco_custo} onChange={e => setNovoProd({...novoProd, preco_custo: e.target.value})} /></div>
                  <div><label style={lbl}>Preço de venda (R$)</label><input required type="number" step="0.01" style={inp} value={novoProd.preco_venda} onChange={e => setNovoProd({...novoProd, preco_venda: e.target.value})} /></div>
                  <div style={{ gridColumn: '1/-1' }}><button type="submit" style={{ width: '100%', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Adicionar produto</button></div>
                </form>
              </div>
              <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 650 }}>
                    <thead style={{ backgroundColor: subBg, borderBottom: `1px solid ${cardBorder}` }}>
                      <tr>{['Produto','Qtd','Mín','Custo','Venda','Margem','Status','Ações'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {produtosFiltrados.map(p => {
                        const margem = p.preco_venda > 0 ? Math.round((p.preco_venda - p.preco_custo) / p.preco_venda * 100) : 0
                        const status = p.quantidade === 0 ? 'Sem estoque' : p.quantidade < p.quantidade_minima ? 'Baixo' : 'OK'
                        const sc = status === 'OK' ? { bg: '#dcfce7', text: '#15803d' } : status === 'Baixo' ? { bg: '#fef9c3', text: '#854d0e' } : { bg: '#fee2e2', text: '#dc2626' }
                        return (
                          <tr key={p.id} style={{ borderTop: `1px solid ${dark ? '#374151' : '#f3f4f6'}` }}
                            onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = rowHover}
                            onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}>
                            <td style={{ padding: '12px 16px', fontWeight: 500, color: txt }}>{p.nome}</td>
                            <td style={{ padding: '12px 16px', color: txt2 }}>{p.quantidade}</td>
                            <td style={{ padding: '12px 16px', color: txt3 }}>{p.quantidade_minima}</td>
                            <td style={{ padding: '12px 16px', color: txt2 }}>{fmt(Number(p.preco_custo))}</td>
                            <td style={{ padding: '12px 16px', color: txt2 }}>{fmt(Number(p.preco_venda))}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 700, color: txt }}>{margem}%</td>
                            <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: sc.bg, color: sc.text, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{status}</span></td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => setEditandoProd(p)} style={{ backgroundColor: subBg, color: txt2, border: `1px solid ${cardBorder}`, padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Editar</button>
                                <button onClick={() => excluirProd(p.id)} style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Excluir</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {produtosFiltrados.length === 0 && <p style={{ textAlign: 'center', color: txt3, padding: 32, fontSize: 13 }}>Nenhum produto encontrado.</p>}
                </div>
              </div>
            </div>
          )}

          {/* CONTAS */}
          {aba === 'contas' && (
            <div className="page-enter">
              {editandoConta && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
                  <div style={{ backgroundColor: card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: txt, marginBottom: 20 }}>Editar conta</h2>
                    <form onSubmit={salvarEdicaoConta} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div><label style={lbl}>Descrição</label><input style={inp} value={editandoConta.descricao} onChange={e => setEditandoConta({...editandoConta, descricao: e.target.value})} /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><label style={lbl}>Valor</label><input type="number" step="0.01" style={inp} value={editandoConta.valor} onChange={e => setEditandoConta({...editandoConta, valor: e.target.value})} /></div>
                        <div><label style={lbl}>Tipo</label><select style={inp} value={editandoConta.tipo} onChange={e => setEditandoConta({...editandoConta, tipo: e.target.value})}><option value="pagar">A pagar</option><option value="receber">A receber</option></select></div>
                      </div>
                      <div><label style={lbl}>Vencimento</label><input type="date" style={inp} value={editandoConta.vencimento} onChange={e => setEditandoConta({...editandoConta, vencimento: e.target.value})} /></div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button type="button" onClick={() => setEditandoConta(null)} style={{ flex: 1, backgroundColor: subBg, color: txt2, border: `1px solid ${cardBorder}`, padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                        <button type="submit" style={{ flex: 1, backgroundColor: '#16a34a', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ backgroundColor: dark ? '#7f1d1d' : '#fef2f2', border: `1px solid ${dark ? '#991b1b' : '#fecaca'}`, borderRadius: 12, padding: 16 }}>
                  <p style={{ ...lbl, marginBottom: 4 }}>A pagar</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#ef4444', margin: 0 }}>{fmt(contas.filter(c => c.tipo === 'pagar' && !c.pago).reduce((a, c) => a + Number(c.valor), 0))}</p>
                </div>
                <div style={{ backgroundColor: dark ? '#14532d' : '#f0fdf4', border: `1px solid ${dark ? '#166534' : '#bbf7d0'}`, borderRadius: 12, padding: 16 }}>
                  <p style={{ ...lbl, marginBottom: 4 }}>A receber</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#16a34a', margin: 0 }}>{fmt(contas.filter(c => c.tipo === 'receber' && !c.pago).reduce((a, c) => a + Number(c.valor), 0))}</p>
                </div>
              </div>
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: txt, marginBottom: 16 }}>Nova conta</h2>
                <form onSubmit={adicionarConta} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lbl}>Descrição</label><input required placeholder="Ex: Aluguel março" style={inp} value={novaConta.descricao} onChange={e => setNovaConta({...novaConta, descricao: e.target.value})} /></div>
                  <div><label style={lbl}>Valor (R$)</label><input required type="number" step="0.01" style={inp} value={novaConta.valor} onChange={e => setNovaConta({...novaConta, valor: e.target.value})} /></div>
                  <div><label style={lbl}>Tipo</label><select style={inp} value={novaConta.tipo} onChange={e => setNovaConta({...novaConta, tipo: e.target.value})}><option value="pagar">A pagar</option><option value="receber">A receber</option></select></div>
                  <div><label style={lbl}>Vencimento</label><input required type="date" style={inp} value={novaConta.vencimento} onChange={e => setNovaConta({...novaConta, vencimento: e.target.value})} /></div>
                  <div style={{ gridColumn: '1/-1' }}><button type="submit" style={{ width: '100%', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Adicionar conta</button></div>
                </form>
              </div>
              <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 550 }}>
                    <thead style={{ backgroundColor: subBg, borderBottom: `1px solid ${cardBorder}` }}>
                      <tr>{['Descrição','Valor','Tipo','Vencimento','Status','Ações'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {contas.map(c => {
                        const vencida = !c.pago && c.vencimento < new Date().toISOString().split('T')[0]
                        return (
                          <tr key={c.id} style={{ borderTop: `1px solid ${dark ? '#374151' : '#f3f4f6'}`, backgroundColor: vencida ? (dark ? 'rgba(127,29,29,0.3)' : '#fef2f2') : 'transparent' }}
                            onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = rowHover}
                            onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = vencida ? (dark ? 'rgba(127,29,29,0.3)' : '#fef2f2') : 'transparent'}>
                            <td style={{ padding: '12px 16px', fontWeight: 500, color: txt }}>{c.descricao}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 700, color: c.tipo === 'receber' ? '#16a34a' : '#ef4444' }}>{fmt(Number(c.valor))}</td>
                            <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: c.tipo === 'receber' ? '#dcfce7' : '#fee2e2', color: c.tipo === 'receber' ? '#15803d' : '#dc2626', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{c.tipo === 'receber' ? 'A receber' : 'A pagar'}</span></td>
                            <td style={{ padding: '12px 16px', color: txt3, fontSize: 12 }}>{c.vencimento}</td>
                            <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: c.pago ? '#dcfce7' : vencida ? '#fee2e2' : '#fef9c3', color: c.pago ? '#15803d' : vencida ? '#dc2626' : '#854d0e', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{c.pago ? 'Pago' : vencida ? 'Vencida' : 'Pendente'}</span></td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => marcarPago(c.id, c.pago)} style={{ backgroundColor: c.pago ? subBg : '#f0fdf4', color: c.pago ? txt2 : '#16a34a', border: `1px solid ${cardBorder}`, padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>{c.pago ? 'Desfazer' : 'Pago'}</button>
                                <button onClick={() => setEditandoConta(c)} style={{ backgroundColor: subBg, color: txt2, border: `1px solid ${cardBorder}`, padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Editar</button>
                                <button onClick={() => excluirConta(c.id)} style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Excluir</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {contas.length === 0 && <p style={{ textAlign: 'center', color: txt3, padding: 32, fontSize: 13 }}>Nenhuma conta ainda.</p>}
                </div>
              </div>
            </div>
          )}

          {/* METAS */}
          {aba === 'metas' && (
            <div className="page-enter">
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: txt, marginBottom: 16 }}>Nova meta</h2>
                <form onSubmit={adicionarMeta} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lbl}>Descrição</label><input required placeholder="Ex: Meta de vendas" style={inp} value={novaMeta.descricao} onChange={e => setNovaMeta({...novaMeta, descricao: e.target.value})} /></div>
                  <div><label style={lbl}>Valor da meta (R$)</label><input required type="number" step="0.01" style={inp} value={novaMeta.valor_meta} onChange={e => setNovaMeta({...novaMeta, valor_meta: e.target.value})} /></div>
                  <div><label style={lbl}>Mês</label><input required type="month" style={inp} value={novaMeta.mes} onChange={e => setNovaMeta({...novaMeta, mes: e.target.value})} /></div>
                  <div><label style={lbl}>Tipo</label><select style={inp} value={novaMeta.tipo} onChange={e => setNovaMeta({...novaMeta, tipo: e.target.value})}><option value="entrada">Entradas</option><option value="saida">Saídas</option></select></div>
                  <div style={{ gridColumn: '1/-1' }}><button type="submit" style={{ width: '100%', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Adicionar meta</button></div>
                </form>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {metas.map(m => {
                  const lancMes = lancamentos.filter(l => l.data?.substring(0, 7) === m.mes)
                  const atual = m.tipo === 'entrada' ? lancMes.filter(l => l.tipo === 'entrada').reduce((a, l) => a + Number(l.valor), 0) : lancMes.filter(l => l.tipo === 'saida').reduce((a, l) => a + Number(l.valor), 0)
                  const pct = Math.min(Math.round((atual / m.valor_meta) * 100), 100)
                  return (
                    <div key={m.id} style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <p style={{ fontWeight: 600, color: txt, margin: 0 }}>{m.descricao}</p>
                          <p style={{ fontSize: 12, color: txt3, margin: 0 }}>{m.mes} — {m.tipo === 'entrada' ? 'Entradas' : 'Saídas'}</p>
                        </div>
                        <button onClick={() => excluirMeta(m.id)} style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Excluir</button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                        <span style={{ color: txt2 }}>Atual: <strong style={{ color: '#16a34a' }}>{fmt(atual)}</strong></span>
                        <span style={{ color: txt2 }}>Meta: <strong style={{ color: txt }}>{fmt(m.valor_meta)}</strong></span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: dark ? '#374151' : '#f3f4f6', borderRadius: 99, height: 10 }}>
                        <div style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#16a34a' : '#4ade80', borderRadius: 99, height: 10, transition: 'width 0.5s ease' }}></div>
                      </div>
                      <p style={{ fontSize: 11, color: pct >= 100 ? '#16a34a' : txt3, marginTop: 4, fontWeight: 600 }}>{pct}% atingido {pct >= 100 ? '✓' : ''}</p>
                    </div>
                  )
                })}
                {metas.length === 0 && <p style={{ textAlign: 'center', color: txt3, padding: 32, fontSize: 13 }}>Nenhuma meta ainda.</p>}
              </div>
            </div>
          )}

          {/* DRE */}
          {aba === 'dre' && (
            <div className="page-enter">
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: txt, margin: 0 }}>Demonstrativo de Resultado</h2>
                    <p style={{ fontSize: 12, color: txt3, marginTop: 4 }}>Selecione o período para visualizar o DRE</p>
                  </div>
                  <input type="month" style={{ ...inp, width: 'auto' }} value={filtroInicio.substring(0,7) || new Date().toISOString().substring(0,7)}
                    onChange={e => { setFiltroInicio(e.target.value + '-01'); setFiltroFim(e.target.value + '-31') }} />
                </div>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${cardBorder}` }}>
                  <div style={{ backgroundColor: dark ? '#14532d' : '#f0fdf4', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${dark ? '#166534' : '#bbf7d0'}` }}>
                    <span style={{ fontWeight: 600, color: txt }}>Receita bruta (entradas)</span>
                    <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 16 }}>{fmt(entradas)}</span>
                  </div>
                  {['Fornecedores','Salários','Aluguel','Impostos','Outros'].map(cat => {
                    const val = lancamentosFiltrados.filter(l => l.tipo === 'saida' && l.categoria === cat).reduce((a, l) => a + Number(l.valor), 0)
                    return val > 0 ? (
                      <div key={cat} style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${cardBorder}`, backgroundColor: card }}>
                        <span style={{ color: txt2, fontSize: 14 }}>{cat}</span>
                        <span style={{ fontWeight: 600, color: '#ef4444', fontSize: 14 }}>- {fmt(val)}</span>
                      </div>
                    ) : null
                  })}
                  <div style={{ backgroundColor: '#1f2937', padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'white', fontSize: 16 }}>Resultado líquido</span>
                    <span style={{ fontWeight: 700, color: saldo >= 0 ? '#4ade80' : '#f87171', fontSize: 22 }}>{fmt(saldo)}</span>
                  </div>
                  <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', backgroundColor: subBg }}>
                    <span style={{ fontSize: 13, color: txt3 }}>Margem de lucro</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: saldo >= 0 ? '#16a34a' : '#ef4444' }}>{entradas > 0 ? Math.round((saldo / entradas) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CLIENTES */}
          {aba === 'clientes' && (
            <div className="page-enter">
              {clienteSelecionado ? (
                <div>
                  {lancamentoAberto && <ModalLancamento l={lancamentoAberto} onClose={() => setLancamentoAberto(null)} />}
                  <button onClick={() => setClienteSelecionado(null)} style={{ backgroundColor: subBg, color: txt2, border: `1px solid ${cardBorder}`, padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500, marginBottom: 16 }}>← Voltar</button>
                  <div style={{ ...cardStyle, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16 }}>
                          {clienteSelecionado.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h2 style={{ fontSize: 20, fontWeight: 700, color: txt, margin: 0 }}>{clienteSelecionado.nome}</h2>
                          <span style={{ backgroundColor: clienteSelecionado.tipo === 'cliente' ? '#dbeafe' : '#ede9fe', color: clienteSelecionado.tipo === 'cliente' ? '#1d4ed8' : '#7c3aed', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{clienteSelecionado.tipo === 'cliente' ? 'Cliente' : 'Fornecedor'}</span>
                        </div>
                      </div>
                      <button onClick={() => setEditandoCliente(clienteSelecionado)} style={{ backgroundColor: subBg, color: txt2, border: `1px solid ${cardBorder}`, padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Editar</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {clienteSelecionado.email && <div style={{ backgroundColor: subBg, borderRadius: 8, padding: 12 }}><p style={{ ...lbl, marginBottom: 2 }}>E-mail</p><p style={{ fontSize: 14, color: txt2, margin: 0 }}>{clienteSelecionado.email}</p></div>}
                      {clienteSelecionado.telefone && <div style={{ backgroundColor: subBg, borderRadius: 8, padding: 12 }}><p style={{ ...lbl, marginBottom: 2 }}>Telefone</p><p style={{ fontSize: 14, color: txt2, margin: 0 }}>{clienteSelecionado.telefone}</p></div>}
                      {clienteSelecionado.cpf_cnpj && <div style={{ backgroundColor: subBg, borderRadius: 8, padding: 12 }}><p style={{ ...lbl, marginBottom: 2 }}>CPF/CNPJ</p><p style={{ fontSize: 14, color: txt2, margin: 0 }}>{clienteSelecionado.cpf_cnpj}</p></div>}
                      {clienteSelecionado.observacao && <div style={{ backgroundColor: subBg, borderRadius: 8, padding: 12 }}><p style={{ ...lbl, marginBottom: 2 }}>Observação</p><p style={{ fontSize: 14, color: txt2, margin: 0 }}>{clienteSelecionado.observacao}</p></div>}
                    </div>
                  </div>

                  <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${cardBorder}` }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: txt, margin: 0 }}>Histórico de lançamentos</h3>
                      <p style={{ fontSize: 12, color: txt3, margin: 0, marginTop: 2 }}>Clique em um lançamento para ver detalhes</p>
                    </div>
                    {lancamentos.filter(l => l.cliente_id === clienteSelecionado.id).length === 0
                      ? <p style={{ textAlign: 'center', color: txt3, padding: 32, fontSize: 13 }}>Nenhum lançamento para este cliente.</p>
                      : lancamentos.filter(l => l.cliente_id === clienteSelecionado.id).map(l => (
                        <div key={l.id} onClick={() => setLancamentoAberto(l)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${dark ? '#374151' : '#f9fafb'}`, cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = rowHover}
                          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: l.tipo === 'entrada' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: l.tipo === 'entrada' ? '#16a34a' : '#ef4444', fontSize: 16 }}>
                              {l.tipo === 'entrada' ? '↑' : '↓'}
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 500, color: txt, margin: 0 }}>{l.descricao}</p>
                              <p style={{ fontSize: 12, color: txt3, margin: 0 }}>{l.data} • {l.categoria} • {l.forma_pagamento || 'dinheiro'}</p>
                              {l.observacao && <p style={{ fontSize: 11, color: txt3, margin: 0, fontStyle: 'italic' }}>{l.observacao}</p>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: l.tipo === 'entrada' ? '#16a34a' : '#ef4444', display: 'block' }}>
                              {l.tipo === 'entrada' ? '+' : '-'}{fmt(Number(l.valor))}
                            </span>
                            <span style={{ fontSize: 11, color: txt3 }}>clique para detalhes →</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ) : (
                <div>
                  {editandoCliente && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
                      <div style={{ backgroundColor: card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: txt, marginBottom: 20 }}>Editar cadastro</h2>
                        <form onSubmit={async (e) => {
                          e.preventDefault()
                          await supabase.from('clientes').update({ nome: editandoCliente.nome, email: editandoCliente.email, telefone: editandoCliente.telefone, cpf_cnpj: editandoCliente.cpf_cnpj, tipo: editandoCliente.tipo, observacao: editandoCliente.observacao }).eq('id', editandoCliente.id)
                          if (clienteSelecionado?.id === editandoCliente.id) setClienteSelecionado(editandoCliente)
                          setEditandoCliente(null)
                          mostrarToast('Cadastro atualizado!')
                          carregarDados()
                        }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div><label style={lbl}>Nome</label><input style={inp} value={editandoCliente.nome} onChange={e => setEditandoCliente({...editandoCliente, nome: e.target.value})} /></div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div><label style={lbl}>Tipo</label><select style={inp} value={editandoCliente.tipo} onChange={e => setEditandoCliente({...editandoCliente, tipo: e.target.value})}><option value="cliente">Cliente</option><option value="fornecedor">Fornecedor</option></select></div>
                            <div><label style={lbl}>Telefone</label><input style={inp} value={editandoCliente.telefone || ''} onChange={e => setEditandoCliente({...editandoCliente, telefone: e.target.value})} /></div>
                          </div>
                          <div><label style={lbl}>E-mail</label><input type="email" style={inp} value={editandoCliente.email || ''} onChange={e => setEditandoCliente({...editandoCliente, email: e.target.value})} /></div>
                          <div><label style={lbl}>CPF/CNPJ</label><input style={inp} value={editandoCliente.cpf_cnpj || ''} onChange={e => setEditandoCliente({...editandoCliente, cpf_cnpj: e.target.value})} /></div>
                          <div><label style={lbl}>Observação</label><input style={inp} value={editandoCliente.observacao || ''} onChange={e => setEditandoCliente({...editandoCliente, observacao: e.target.value})} /></div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button type="button" onClick={() => setEditandoCliente(null)} style={{ flex: 1, backgroundColor: subBg, color: txt2, border: `1px solid ${cardBorder}`, padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                            <button type="submit" style={{ flex: 1, backgroundColor: '#16a34a', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  <div style={{ ...cardStyle, marginBottom: 16 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: txt, marginBottom: 16 }}>Novo cadastro</h2>
                    <form onSubmit={async (e) => {
                      e.preventDefault()
                      const { data: { user } } = await supabase.auth.getUser()
                      await supabase.from('clientes').insert({ ...novoCliente, user_id: user?.id })
                      setNovoCliente({ nome: '', email: '', telefone: '', cpf_cnpj: '', tipo: 'cliente', observacao: '' })
                      mostrarToast('Cadastro adicionado!')
                      carregarDados()
                    }} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                      <div style={{ gridColumn: '1/3' }}><label style={lbl}>Nome completo</label><input required placeholder="Ex: João da Silva" style={inp} value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} /></div>
                      <div><label style={lbl}>Tipo</label><select style={inp} value={novoCliente.tipo} onChange={e => setNovoCliente({...novoCliente, tipo: e.target.value})}><option value="cliente">Cliente</option><option value="fornecedor">Fornecedor</option></select></div>
                      <div><label style={lbl}>E-mail</label><input type="email" placeholder="email@exemplo.com" style={inp} value={novoCliente.email} onChange={e => setNovoCliente({...novoCliente, email: e.target.value})} /></div>
                      <div><label style={lbl}>Telefone</label><input placeholder="(11) 99999-9999" style={inp} value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} /></div>
                      <div><label style={lbl}>CPF/CNPJ</label><input placeholder="000.000.000-00" style={inp} value={novoCliente.cpf_cnpj} onChange={e => setNovoCliente({...novoCliente, cpf_cnpj: e.target.value})} /></div>
                      <div style={{ gridColumn: '1/-1' }}><button type="submit" style={{ width: '100%', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Adicionar cadastro</button></div>
                    </form>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
                    {clientes.map(c => (
                      <div key={c.id} onClick={() => setClienteSelecionado(c)}
                        style={{ ...cardStyle, cursor: 'pointer', transition: 'all 0.15s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: c.tipo === 'cliente' ? '#dbeafe' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.tipo === 'cliente' ? '#1d4ed8' : '#7c3aed', fontWeight: 700, fontSize: 14 }}>
                              {c.nome.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, color: txt, margin: 0, fontSize: 14 }}>{c.nome}</p>
                              <span style={{ backgroundColor: c.tipo === 'cliente' ? '#dbeafe' : '#ede9fe', color: c.tipo === 'cliente' ? '#1d4ed8' : '#7c3aed', padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{c.tipo === 'cliente' ? 'Cliente' : 'Fornecedor'}</span>
                            </div>
                          </div>
                          <button onClick={async (ev) => { ev.stopPropagation(); if (!confirm('Excluir?')) return; await supabase.from('clientes').delete().eq('id', c.id); mostrarToast('Excluído!'); carregarDados() }}
                            style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {c.email && <p style={{ fontSize: 12, color: txt3, margin: 0 }}>✉ {c.email}</p>}
                          {c.telefone && <p style={{ fontSize: 12, color: txt3, margin: 0 }}>📞 {c.telefone}</p>}
                          <p style={{ fontSize: 12, color: '#16a34a', margin: 0, fontWeight: 500, marginTop: 4 }}>
                            {lancamentos.filter(l => l.cliente_id === c.id).length} lançamento(s)
                          </p>
                        </div>
                      </div>
                    ))}
                    {clientes.length === 0 && <p style={{ textAlign: 'center', color: txt3, padding: 32, fontSize: 13, gridColumn: '1/-1' }}>Nenhum cadastro ainda.</p>}
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}