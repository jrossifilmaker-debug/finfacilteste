'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const MENU_ITEMS = [
  { id: 'painel', label: 'Painel', icon: '▦' },
  { id: 'fluxo', label: 'Fluxo de Caixa', icon: '⇅' },
  { id: 'estoque', label: 'Estoque', icon: '▤' },
  { id: 'contas', label: 'Contas', icon: '◉' },
  { id: 'metas', label: 'Metas', icon: '◇' },
  { id: 'dre', label: 'DRE', icon: '▤' },
  { id: 'clientes', label: 'Clientes', icon: '◎' },
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

  const SIDEBAR_W = menuAberto ? 220 : 60

  // Paleta de cores
  const c = {
    // Backgrounds
    bg: dark ? '#0a1628' : '#e8f0e9',
    sidebar: dark ? 'rgba(13,21,32,0.85)' : 'rgba(26,71,49,0.92)',
    card: dark ? '#1a2535' : '#ffffff',
    cardAlt: dark ? '#1f2d40' : '#faf7f4',
    subCard: dark ? '#243044' : '#f5f0eb',
    // Texto
    txt: dark ? '#edf2f7' : '#1a2535',
    txt2: dark ? '#a0aec0' : '#4a5568',
    txt3: dark ? '#718096' : '#718096',
    // Bordas
    border: dark ? '#2d3f55' : '#e8e0d8',
    // Acentos
    green: '#2d6a4f',
    greenLight: dark ? '#1a3d2b' : '#e8f5ee',
    greenText: '#2d9b6a',
    red: '#c0392b',
    redLight: dark ? '#3d1a1a' : '#fdf0ef',
    amber: '#d4820a',
    amberLight: dark ? '#3d2e0a' : '#fef8ee',
    blue: '#2563eb',
    // Header
    header: dark ? 'rgba(17,24,39,0.8)' : 'rgba(255,255,255,0.75)',
    headerBorder: dark ? '#1e2d3d' : '#ede8e2',
  }

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
    setDark(d => { localStorage.setItem('darkMode', String(!d)); return !d })
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
      descricao: novoLanc.descricao, valor: parseFloat(novoLanc.valor),
      tipo: novoLanc.tipo, categoria: novoLanc.categoria,
      forma_pagamento: novoLanc.forma_pagamento,
      cliente_id: novoLanc.cliente_id ? parseInt(novoLanc.cliente_id) : null,
      observacao: novoLanc.observacao, user_id: user?.id,
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
    await supabase.from('lancamentos').update({ descricao: editandoLanc.descricao, valor: parseFloat(editandoLanc.valor), tipo: editandoLanc.tipo, categoria: editandoLanc.categoria, forma_pagamento: editandoLanc.forma_pagamento, observacao: editandoLanc.observacao }).eq('id', editandoLanc.id)
    setEditandoLanc(null); mostrarToast('Lançamento atualizado!'); carregarDados()
  }

  async function excluirLanc(id: any) {
    if (!confirm('Deseja excluir?')) return
    await supabase.from('lancamentos').delete().eq('id', id)
    mostrarToast('Excluído!'); carregarDados()
  }

  async function adicionarProduto(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('produtos').insert({ ...novoProd, quantidade: parseFloat(novoProd.quantidade), quantidade_minima: parseFloat(novoProd.quantidade_minima), preco_custo: parseFloat(novoProd.preco_custo), preco_venda: parseFloat(novoProd.preco_venda), user_id: user?.id })
    setNovoProd({ nome: '', quantidade: '', quantidade_minima: '', preco_custo: '', preco_venda: '' }); mostrarToast('Produto adicionado!'); carregarDados()
  }

  async function salvarEdicaoProd(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('produtos').update({ nome: editandoProd.nome, quantidade: parseFloat(editandoProd.quantidade), quantidade_minima: parseFloat(editandoProd.quantidade_minima), preco_custo: parseFloat(editandoProd.preco_custo), preco_venda: parseFloat(editandoProd.preco_venda) }).eq('id', editandoProd.id)
    setEditandoProd(null); mostrarToast('Produto atualizado!'); carregarDados()
  }

  async function excluirProd(id: any) {
    if (!confirm('Deseja excluir?')) return
    await supabase.from('produtos').delete().eq('id', id); mostrarToast('Excluído!'); carregarDados()
  }

  async function adicionarConta(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('contas').insert({ ...novaConta, valor: parseFloat(novaConta.valor), user_id: user?.id })
    setNovaConta({ descricao: '', valor: '', tipo: 'pagar', categoria: 'Fornecedores', vencimento: '' }); mostrarToast('Conta adicionada!'); carregarDados()
  }

  async function marcarPago(id: any, pago: boolean) {
    await supabase.from('contas').update({ pago: !pago }).eq('id', id)
    mostrarToast(!pago ? 'Pago!' : 'Desfeito!'); carregarDados()
  }

  async function excluirConta(id: any) {
    if (!confirm('Deseja excluir?')) return
    await supabase.from('contas').delete().eq('id', id); mostrarToast('Excluído!'); carregarDados()
  }

  async function salvarEdicaoConta(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('contas').update({ descricao: editandoConta.descricao, valor: parseFloat(editandoConta.valor), tipo: editandoConta.tipo, vencimento: editandoConta.vencimento }).eq('id', editandoConta.id)
    setEditandoConta(null); mostrarToast('Conta atualizada!'); carregarDados()
  }

  async function adicionarMeta(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('metas').insert({ ...novaMeta, valor_meta: parseFloat(novaMeta.valor_meta), user_id: user?.id })
    setNovaMeta({ descricao: '', valor_meta: '', mes: '', tipo: 'entrada' }); mostrarToast('Meta adicionada!'); carregarDados()
  }

  async function excluirMeta(id: any) {
    if (!confirm('Deseja excluir?')) return
    await supabase.from('metas').delete().eq('id', id); mostrarToast('Excluído!'); carregarDados()
  }

  function gerarPDF() {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text('FinFácil — Relatório de Fluxo de Caixa', 14, 20)
    doc.setFontSize(11); doc.text(`Empresa: ${usuario?.user_metadata?.empresa || ''}`, 14, 30)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 37)
    doc.setFontSize(12); doc.text(`Entradas: R$ ${entradas.toFixed(2)}`, 14, 50)
    doc.text(`Saídas: R$ ${saidas.toFixed(2)}`, 14, 58); doc.text(`Saldo: R$ ${saldo.toFixed(2)}`, 14, 66)
    autoTable(doc, { startY: 75, head: [['Data', 'Descrição', 'Categoria', 'Pagamento', 'Tipo', 'Valor']], body: lancamentosFiltrados.map(l => [l.data, l.descricao, l.categoria, l.forma_pagamento || 'dinheiro', l.tipo === 'entrada' ? 'Entrada' : 'Saída', `R$ ${Number(l.valor).toFixed(2)}`]), styles: { fontSize: 9 }, headStyles: { fillColor: [45, 106, 79] } })
    doc.save('relatorio-finfacil.pdf'); mostrarToast('PDF gerado!')
  }

  function exportarExcel() {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lancamentosFiltrados.map(l => ({ Data: l.data, Descrição: l.descricao, Categoria: l.categoria, Pagamento: l.forma_pagamento || 'dinheiro', Tipo: l.tipo === 'entrada' ? 'Entrada' : 'Saída', Valor: Number(l.valor) }))), 'Fluxo de Caixa')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(produtos.map(p => ({ Produto: p.nome, Quantidade: p.quantidade, 'Qtd Mínima': p.quantidade_minima, 'Preço Custo': Number(p.preco_custo), 'Preço Venda': Number(p.preco_venda) }))), 'Estoque')
    XLSX.writeFile(wb, 'finfacil-dados.xlsx'); mostrarToast('Excel exportado!')
  }

  async function sair() { await supabase.auth.signOut(); window.location.href = '/' }

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
  const contasVencidas = contas.filter(ct => !ct.pago && ct.vencimento < new Date().toISOString().split('T')[0])
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const dadosGrafico = (() => {
    const meses: any = {}
    lancamentos.forEach(l => {
      const mes = l.data?.substring(0, 7); if (!mes) return
      if (!meses[mes]) meses[mes] = { mes, entradas: 0, saidas: 0 }
      if (l.tipo === 'entrada') meses[mes].entradas += Number(l.valor); else meses[mes].saidas += Number(l.valor)
    })
    return Object.values(meses).sort((a: any, b: any) => a.mes.localeCompare(b.mes))
  })()
  const mesAtual = new Date().toISOString().substring(0, 7)
  const metasDoMes = metas.filter(m => m.mes === mesAtual)
  const iniciais = usuario?.user_metadata?.empresa?.substring(0, 2).toUpperCase() || 'FF'
  const formasPagamento = ['dinheiro', 'pix', 'credito', 'debito', 'transferencia', 'outros']

  // Estilos base
  const inp: React.CSSProperties = { width: '100%', border: `1.5px solid ${c.border}`, borderRadius: 10, padding: '9px 13px', fontSize: 14, backgroundColor: c.card, color: c.txt, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: c.txt3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }
  const card: React.CSSProperties = { backgroundColor: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'box-shadow 0.2s ease, transform 0.2s ease' }
  const btn = (bg: string, color = 'white'): React.CSSProperties => ({ backgroundColor: bg, color, border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' })

  const Modal = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
      <div style={{ backgroundColor: c.card, borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: `1px solid ${c.border}` }}>
        {children}
      </div>
    </div>
  )

  const ModalLancamento = ({ l, onClose }: { l: any, onClose: () => void }) => (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: c.txt, margin: 0 }}>Detalhes do lançamento</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: c.txt3 }}>✕</button>
      </div>
      <div style={{ backgroundColor: l.tipo === 'entrada' ? c.greenLight : c.redLight, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: l.tipo === 'entrada' ? c.greenText : c.red }}>{l.tipo === 'entrada' ? '+' : '-'}{fmt(Number(l.valor))}</span>
          <span style={{ backgroundColor: l.tipo === 'entrada' ? '#dcfce7' : '#fee2e2', color: l.tipo === 'entrada' ? '#15803d' : c.red, padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{l.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span>
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: c.txt, margin: 0 }}>{l.descricao}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {[
          { label: 'Data', valor: l.data },
          { label: 'Categoria', valor: l.categoria },
          { label: 'Pagamento', valor: l.forma_pagamento || 'dinheiro' },
          { label: 'Cliente', valor: clientes.find(cl => cl.id === l.cliente_id)?.nome || '-' },
        ].map(item => (
          <div key={item.label} style={{ backgroundColor: c.subCard, borderRadius: 10, padding: 12 }}>
            <p style={{ fontSize: 10, color: c.txt3, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 3px' }}>{item.label}</p>
            <p style={{ fontSize: 14, color: c.txt2, fontWeight: 500, margin: 0, textTransform: 'capitalize' }}>{item.valor}</p>
          </div>
        ))}
      </div>
      {l.observacao && (
        <div style={{ backgroundColor: c.subCard, borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <p style={{ fontSize: 10, color: c.txt3, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 3px' }}>Observação</p>
          <p style={{ fontSize: 14, color: c.txt2, margin: 0 }}>{l.observacao}</p>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button onClick={() => { setEditandoLanc(l); onClose() }} style={{ ...btn(c.subCard, c.txt2), flex: 1, border: `1px solid ${c.border}` }}>Editar</button>
        <button onClick={() => { excluirLanc(l.id); onClose() }} style={{ ...btn('#fef2f2', c.red), flex: 1 }}>Excluir</button>
      </div>
    </Modal>
  )

  const TabelaHeader = ({ cols }: { cols: string[] }) => (
    <thead>
      <tr style={{ backgroundColor: c.cardAlt, borderBottom: `1px solid ${c.border}` }}>
        {cols.map(h => <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 10, fontWeight: 700, color: c.txt3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>)}
      </tr>
    </thead>
  )

  const BtnAcao = ({ label, danger, onClick }: { label: string, danger?: boolean, onClick: () => void }) => (
    <button onClick={onClick} style={{ backgroundColor: danger ? '#fef2f2' : c.subCard, color: danger ? c.red : c.txt2, border: `1px solid ${danger ? '#fecaca' : c.border}`, padding: '4px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>{label}</button>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: c.bg, fontFamily: "'Inter', -apple-system, sans-serif", backgroundImage: dark ? 'radial-gradient(ellipse at 10% 20%, rgba(45,155,106,0.25) 0%, transparent 50%), radial-gradient(ellipse at 90% 80%, rgba(20,83,45,0.3) 0%, transparent 50%)' : 'radial-gradient(ellipse at 10% 20%, rgba(45,155,106,0.2) 0%, transparent 50%), radial-gradient(ellipse at 90% 80%, rgba(134,239,172,0.25) 0%, transparent 50%)' }}>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, backgroundColor: c.green, color: 'white', padding: '12px 20px', borderRadius: 12, boxShadow: '0 8px 24px rgba(45,106,79,0.4)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          ✓ {toast}
        </div>
      )}

      {lancamentoAberto && <ModalLancamento l={lancamentoAberto} onClose={() => setLancamentoAberto(null)} />}

      {/* Sidebar */}
      <aside style={{ width: SIDEBAR_W, minHeight: '100vh', backgroundColor: c.sidebar, display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 40, boxShadow: '4px 0 24px rgba(0,0,0,0.2)', transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: menuAberto ? 'space-between' : 'center', padding: '22px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {menuAberto && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/logo.png" alt="FinFácil" style={{ width: 32, height: 32, borderRadius: 9, objectFit: 'contain' }} />
              <span style={{ color: 'white', fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>FinFácil</span>
            </div>
          )}
          <button onClick={() => setMenuAberto(!menuAberto)} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, borderRadius: 6 }}>
            {menuAberto ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {MENU_ITEMS.map(item => (
            <button key={item.id} onClick={() => setAba(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, textAlign: 'left', whiteSpace: 'nowrap', transition: 'all 0.15s ease', backgroundColor: aba === item.id ? 'rgba(255,255,255,0.15)' : 'transparent', color: aba === item.id ? 'white' : 'rgba(255,255,255,0.65)', borderLeft: aba === item.id ? '3px solid #2d9b6a' : '3px solid transparent' }}
              onMouseEnter={e => { if (aba !== item.id) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(4px)' }}}
              onMouseLeave={e => { if (aba !== item.id) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(0)' }}}>
              <span style={{ fontSize: 14, minWidth: 18, textAlign: 'center' }}>{item.icon}</span>
              {menuAberto && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Sair */}
        <div style={{ padding: '8px 8px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={sair} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'rgba(255,100,100,0.8)', backgroundColor: 'transparent', width: '100%', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 14, minWidth: 18, textAlign: 'center' }}>↩</span>
            {menuAberto && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: SIDEBAR_W, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>

        {/* Header */}
        <header style={{ backgroundColor: c.header, borderBottom: `1px solid ${c.headerBorder}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30, backdropFilter: 'blur(8px)' }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: c.txt, margin: 0, letterSpacing: '-0.2px' }}>
            {MENU_ITEMS.find(m => m.id === aba)?.label || 'Painel'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${c.border}`, borderRadius: 10, padding: '7px 12px', gap: 8, backgroundColor: c.card }}>
              <span style={{ color: c.txt3, fontSize: 13 }}>🔍</span>
              <input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: c.txt, width: 130 }} />
            </div>
            {/* Toggle dark */}
            <div onClick={toggleDark} style={{ width: 50, height: 27, borderRadius: 99, backgroundColor: dark ? c.green : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background-color 0.3s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3.5, left: dark ? 26 : 3.5, width: 20, height: 20, borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.3s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                {dark ? '🌙' : '☀️'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #2d9b6a, #1a4731)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 800, boxShadow: '0 2px 8px rgba(45,155,106,0.4)' }}>
                {iniciais}
              </div>
              {menuAberto && <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: c.txt, margin: 0 }}>{usuario?.user_metadata?.empresa}</p>
                <p style={{ fontSize: 11, color: c.txt3, margin: 0 }}>Administrador</p>
              </div>}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: 24, backgroundColor: 'transparent' }}>

          {/* PAINEL */}
          {aba === 'painel' && (
            <div className="page-enter">
              {/* Cards topo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
                {[
                  { label: 'Entradas do mês', valor: fmt(entradas), cor: c.greenText, bg: c.greenLight, seta: '↗', setaCor: c.greenText },
                  { label: 'Saídas do mês', valor: fmt(saidas), cor: c.red, bg: c.redLight, seta: '↘', setaCor: c.red },
                  { label: 'Saldo atual', valor: fmt(saldo), cor: saldo >= 0 ? c.greenText : c.red, bg: c.card, seta: saldo >= 0 ? '↗' : '↘', setaCor: saldo >= 0 ? c.greenText : c.red },
                  { label: 'Estoque crítico', valor: `${produtosCriticos.length} itens`, cor: c.amber, bg: c.amberLight, seta: '⚠', setaCor: c.amber },
                ].map(ct => (
                  <div key={ct.label} style={{ backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)', border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)'}`, borderRadius: 16, padding: '16px 18px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: c.txt3, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{ct.label}</p>
                      <span style={{ fontSize: 16, color: ct.setaCor }}>{ct.seta}</span>
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 800, color: ct.cor, margin: 0, letterSpacing: '-0.5px' }}>{ct.valor}</p>
                  </div>
                ))}
              </div>

              {/* Contas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[
                  { label: 'A receber', valor: fmt(contas.filter(ct => ct.tipo === 'receber' && !ct.pago).reduce((a, ct) => a + Number(ct.valor), 0)), cor: c.greenText, btnBg: c.green },
                  { label: 'A pagar', valor: fmt(contas.filter(ct => ct.tipo === 'pagar' && !ct.pago).reduce((a, ct) => a + Number(ct.valor), 0)), cor: c.red, btnBg: c.red },
                ].map(ct => (
                  <div key={ct.label} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
                    <div>
                      <p style={{ ...lbl, marginBottom: 6 }}>{ct.label}</p>
                      <p style={{ fontSize: 22, fontWeight: 800, color: ct.cor, margin: 0 }}>{ct.valor}</p>
                    </div>
                    <button onClick={() => setAba('contas')} style={{ ...btn(ct.btnBg), borderRadius: 10, fontSize: 12 }}>Ver contas</button>
                  </div>
                ))}
              </div>

              {/* Gráfico + Movimentações lado a lado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 20 }}>
                {dadosGrafico.length > 0 && (
                  <div style={card}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: c.txt, marginBottom: 16, marginTop: 0 }}>Entradas x Saídas por mês</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={dadosGrafico} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: c.txt3 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: c.txt3 }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ backgroundColor: c.card, border: `1px solid ${c.border}`, borderRadius: 10, color: c.txt }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="entradas" name="Entradas" fill="#2d9b6a" radius={[6,6,0,0]} />
                        <Bar dataKey="saidas" name="Saídas" fill="#c0392b" radius={[6,6,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: c.txt, margin: 0 }}>Últimas movimentações</h2>
                    <button onClick={() => setAba('fluxo')} style={{ color: c.greenText, background: 'none', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Ver todas</button>
                  </div>
                  {lancamentos.length === 0 && <p style={{ color: c.txt3, fontSize: 13, padding: 20 }}>Nenhuma movimentação.</p>}
                  {lancamentos.slice(0, 6).map(l => (
                    <div key={l.id} onClick={() => setLancamentoAberto(l)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: `1px solid ${c.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = c.cardAlt}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: l.tipo === 'entrada' ? c.greenLight : c.redLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: l.tipo === 'entrada' ? c.greenText : c.red, fontSize: 14, fontWeight: 700 }}>
                          {l.tipo === 'entrada' ? '↑' : '↓'}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: c.txt, margin: 0 }}>{l.descricao}</p>
                          <p style={{ fontSize: 11, color: c.txt3, margin: 0 }}>{l.data} • {l.categoria}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: l.tipo === 'entrada' ? c.greenText : c.red }}>
                        {l.tipo === 'entrada' ? '+' : '-'}{fmt(Number(l.valor))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alertas */}
              {(produtosCriticos.length > 0 || contasVencidas.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {produtosCriticos.length > 0 && (
                    <div style={{ backgroundColor: c.amberLight, border: `1px solid ${dark ? '#5a3a0a' : '#fde68a'}`, borderRadius: 14, padding: 16 }}>
                      <p style={{ color: c.amber, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>⚠ Estoque baixo</p>
                      {produtosCriticos.map(p => <p key={p.id} style={{ color: c.amber, fontSize: 13, margin: '2px 0' }}>• {p.nome} — {p.quantidade} un.</p>)}
                    </div>
                  )}
                  {contasVencidas.length > 0 && (
                    <div style={{ backgroundColor: c.redLight, border: `1px solid ${dark ? '#5a1a1a' : '#fecaca'}`, borderRadius: 14, padding: 16 }}>
                      <p style={{ color: c.red, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>⚠ Contas vencidas</p>
                      {contasVencidas.map(ct => <p key={ct.id} style={{ color: c.red, fontSize: 13, margin: '2px 0' }}>• {ct.descricao} — {fmt(ct.valor)}</p>)}
                    </div>
                  )}
                </div>
              )}

              {/* Metas */}
              {metasDoMes.length > 0 && (
                <div style={{ ...card, marginTop: 16 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: c.txt, marginBottom: 16, marginTop: 0 }}>Metas do mês</h2>
                  {metasDoMes.map(m => {
                    const atual = m.tipo === 'entrada' ? entradas : saidas
                    const pct = Math.min(Math.round((atual / m.valor_meta) * 100), 100)
                    return (
                      <div key={m.id} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: c.txt }}>{m.descricao}</span>
                          <span style={{ color: c.txt3 }}>{fmt(atual)} / {fmt(m.valor_meta)}</span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: c.subCard, borderRadius: 99, height: 8 }}>
                          <div style={{ width: `${pct}%`, background: pct >= 100 ? `linear-gradient(90deg, ${c.green}, #2d9b6a)` : `linear-gradient(90deg, #4ade80, #2d9b6a)`, borderRadius: 99, height: 8, transition: 'width 0.5s ease' }}></div>
                        </div>
                        <p style={{ fontSize: 11, color: pct >= 100 ? c.greenText : c.txt3, marginTop: 3, fontWeight: 600 }}>{pct}% atingido {pct >= 100 ? '✓' : ''}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* FLUXO */}
          {aba === 'fluxo' && (
            <div className="page-enter">
              {editandoLanc && (
                <Modal onClose={() => setEditandoLanc(null)}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: c.txt, marginBottom: 20 }}>Editar lançamento</h2>
                  <form onSubmit={salvarEdicaoLanc} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div><label style={lbl}>Descrição</label><input style={inp} value={editandoLanc.descricao} onChange={e => setEditandoLanc({...editandoLanc, descricao: e.target.value})} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div><label style={lbl}>Valor</label><input type="number" step="0.01" style={inp} value={editandoLanc.valor} onChange={e => setEditandoLanc({...editandoLanc, valor: e.target.value})} /></div>
                      <div><label style={lbl}>Tipo</label><select style={inp} value={editandoLanc.tipo} onChange={e => setEditandoLanc({...editandoLanc, tipo: e.target.value})}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div><label style={lbl}>Categoria</label><select style={inp} value={editandoLanc.categoria} onChange={e => setEditandoLanc({...editandoLanc, categoria: e.target.value})}>{['Vendas','Fornecedores','Salários','Aluguel','Impostos','Outros'].map(ct => <option key={ct}>{ct}</option>)}</select></div>
                      <div><label style={lbl}>Pagamento</label><select style={inp} value={editandoLanc.forma_pagamento} onChange={e => setEditandoLanc({...editandoLanc, forma_pagamento: e.target.value})}>{formasPagamento.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}</select></div>
                    </div>
                    <div><label style={lbl}>Observação</label><textarea style={{...inp, resize: 'none'} as React.CSSProperties} rows={2} value={editandoLanc.observacao || ''} onChange={e => setEditandoLanc({...editandoLanc, observacao: e.target.value})} /></div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                      <button type="button" onClick={() => setEditandoLanc(null)} style={{ ...btn(c.subCard, c.txt2), flex: 1, border: `1px solid ${c.border}` }}>Cancelar</button>
                      <button type="submit" style={{ ...btn(c.green), flex: 1 }}>Salvar</button>
                    </div>
                  </form>
                </Modal>
              )}

              <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: c.txt, margin: 0 }}>Período</h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={gerarPDF} style={btn('#2563eb')}>PDF</button>
                    <button onClick={exportarExcel} style={btn(c.green)}>Excel</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><label style={lbl}>Data início</label><input type="date" style={inp} value={filtroInicio} onChange={e => setFiltroInicio(e.target.value)} /></div>
                  <div style={{ flex: 1 }}><label style={lbl}>Data fim</label><input type="date" style={inp} value={filtroFim} onChange={e => setFiltroFim(e.target.value)} /></div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}><button onClick={() => { setFiltroInicio(''); setFiltroFim('') }} style={{ ...btn(c.subCard, c.txt2), border: `1px solid ${c.border}` }}>Limpar</button></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                {[
                  { label: 'Entradas', valor: fmt(entradas), cor: c.greenText, bg: c.greenLight },
                  { label: 'Saídas', valor: fmt(saidas), cor: c.red, bg: c.redLight },
                  { label: 'Saldo', valor: fmt(saldo), cor: saldo >= 0 ? c.greenText : c.red, bg: c.card },
                ].map(ct => (
                  <div key={ct.label} style={{ backgroundColor: ct.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '14px 16px' }}>
                    <p style={{ ...lbl, marginBottom: 6 }}>{ct.label}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: ct.cor, margin: 0 }}>{ct.valor}</p>
                  </div>
                ))}
              </div>

              <div style={{ ...card, marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: c.txt, marginBottom: 16, marginTop: 0 }}>Novo lançamento</h2>
                <form onSubmit={adicionarLancamento} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/3' }}><label style={lbl}>Descrição</label><input required placeholder="Ex: Venda do dia" style={inp} value={novoLanc.descricao} onChange={e => setNovoLanc({...novoLanc, descricao: e.target.value})} /></div>
                  <div><label style={lbl}>Valor (R$)</label><input required type="number" step="0.01" placeholder="0,00" style={inp} value={novoLanc.valor} onChange={e => setNovoLanc({...novoLanc, valor: e.target.value})} /></div>
                  <div><label style={lbl}>Tipo</label><select style={inp} value={novoLanc.tipo} onChange={e => setNovoLanc({...novoLanc, tipo: e.target.value, produto_id: '', quantidade_vendida: ''})}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div>
                  <div><label style={lbl}>Categoria</label><select style={inp} value={novoLanc.categoria} onChange={e => setNovoLanc({...novoLanc, categoria: e.target.value})}>{['Vendas','Fornecedores','Salários','Aluguel','Impostos','Outros'].map(ct => <option key={ct}>{ct}</option>)}</select></div>
                  <div><label style={lbl}>Pagamento</label><select style={inp} value={novoLanc.forma_pagamento} onChange={e => setNovoLanc({...novoLanc, forma_pagamento: e.target.value})}>{formasPagamento.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}</select></div>
                  <div><label style={lbl}>Cliente</label><select style={inp} value={novoLanc.cliente_id} onChange={e => setNovoLanc({...novoLanc, cliente_id: e.target.value})}><option value="">Nenhum</option>{clientes.map(cl => <option key={cl.id} value={cl.id}>{cl.nome}</option>)}</select></div>
                  {novoLanc.tipo === 'saida' && <>
                    <div><label style={lbl}>Produto</label><select style={inp} value={novoLanc.produto_id} onChange={e => setNovoLanc({...novoLanc, produto_id: e.target.value})}><option value="">Nenhum</option>{produtos.map(p => <option key={p.id} value={p.id}>{p.nome} (qtd: {p.quantidade})</option>)}</select></div>
                    {novoLanc.produto_id && <div><label style={lbl}>Qtd vendida</label><input type="number" placeholder="0" style={inp} value={novoLanc.quantidade_vendida} onChange={e => setNovoLanc({...novoLanc, quantidade_vendida: e.target.value})} /></div>}
                  </>}
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Observação</label><textarea placeholder="Detalhes adicionais..." style={{...inp, resize: 'none'} as React.CSSProperties} rows={2} value={novoLanc.observacao} onChange={e => setNovoLanc({...novoLanc, observacao: e.target.value})} /></div>
                  <div style={{ gridColumn: '1/-1' }}><button type="submit" style={{ ...btn(c.green), width: '100%', padding: '12px', fontSize: 14 }}>+ Adicionar lançamento</button></div>
                </form>
              </div>

              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 700 }}>
                    <TabelaHeader cols={['Data','Descrição','Cliente','Categoria','Pagamento','Valor','Tipo','Ações']} />
                    <tbody>
                      {lancamentosFiltrados.map(l => (
                        <tr key={l.id} onClick={() => setLancamentoAberto(l)} style={{ borderTop: `1px solid ${c.border}`, cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = c.cardAlt}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '12px 16px', color: c.txt3, fontSize: 12 }}>{l.data}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: c.txt }}>{l.descricao}</td>
                          <td style={{ padding: '12px 16px', color: c.txt2, fontSize: 12 }}>{clientes.find(cl => cl.id === l.cliente_id)?.nome || '-'}</td>
                          <td style={{ padding: '12px 16px', color: c.txt3, fontSize: 12 }}>{l.categoria}</td>
                          <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: c.subCard, color: c.txt2, padding: '3px 9px', borderRadius: 7, fontSize: 11, textTransform: 'capitalize', border: `1px solid ${c.border}` }}>{l.forma_pagamento || 'dinheiro'}</span></td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: l.tipo === 'entrada' ? c.greenText : c.red }}>{fmt(Number(l.valor))}</td>
                          <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: l.tipo === 'entrada' ? c.greenLight : c.redLight, color: l.tipo === 'entrada' ? c.greenText : c.red, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{l.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                          <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <BtnAcao label="Editar" onClick={() => setEditandoLanc(l)} />
                              <BtnAcao label="Excluir" danger onClick={() => excluirLanc(l.id)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {lancamentosFiltrados.length === 0 && <p style={{ textAlign: 'center', color: c.txt3, padding: 32, fontSize: 13 }}>Nenhum lançamento encontrado.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ESTOQUE */}
          {aba === 'estoque' && (
            <div className="page-enter">
              {editandoProd && (
                <Modal onClose={() => setEditandoProd(null)}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: c.txt, marginBottom: 20 }}>Editar produto</h2>
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
                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                      <button type="button" onClick={() => setEditandoProd(null)} style={{ ...btn(c.subCard, c.txt2), flex: 1, border: `1px solid ${c.border}` }}>Cancelar</button>
                      <button type="submit" style={{ ...btn(c.green), flex: 1 }}>Salvar</button>
                    </div>
                  </form>
                </Modal>
              )}
              <div style={{ ...card, marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: c.txt, marginBottom: 16, marginTop: 0 }}>Novo produto</h2>
                <form onSubmit={adicionarProduto} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Nome do produto</label><input required placeholder="Ex: Farinha de trigo 1kg" style={inp} value={novoProd.nome} onChange={e => setNovoProd({...novoProd, nome: e.target.value})} /></div>
                  <div><label style={lbl}>Quantidade atual</label><input required type="number" style={inp} value={novoProd.quantidade} onChange={e => setNovoProd({...novoProd, quantidade: e.target.value})} /></div>
                  <div><label style={lbl}>Qtd mínima</label><input required type="number" style={inp} value={novoProd.quantidade_minima} onChange={e => setNovoProd({...novoProd, quantidade_minima: e.target.value})} /></div>
                  <div><label style={lbl}>Preço custo (R$)</label><input required type="number" step="0.01" style={inp} value={novoProd.preco_custo} onChange={e => setNovoProd({...novoProd, preco_custo: e.target.value})} /></div>
                  <div><label style={lbl}>Preço venda (R$)</label><input required type="number" step="0.01" style={inp} value={novoProd.preco_venda} onChange={e => setNovoProd({...novoProd, preco_venda: e.target.value})} /></div>
                  <div style={{ gridColumn: '1/-1' }}><button type="submit" style={{ ...btn(c.green), width: '100%', padding: '12px', fontSize: 14 }}>+ Adicionar produto</button></div>
                </form>
              </div>
              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 650 }}>
                    <TabelaHeader cols={['Produto','Qtd','Mín','Custo','Venda','Margem','Status','Ações']} />
                    <tbody>
                      {produtosFiltrados.map(p => {
                        const margem = p.preco_venda > 0 ? Math.round((p.preco_venda - p.preco_custo) / p.preco_venda * 100) : 0
                        const status = p.quantidade === 0 ? 'Sem estoque' : p.quantidade < p.quantidade_minima ? 'Baixo' : 'OK'
                        const sc = status === 'OK' ? { bg: c.greenLight, text: c.greenText } : status === 'Baixo' ? { bg: c.amberLight, text: c.amber } : { bg: c.redLight, text: c.red }
                        return (
                          <tr key={p.id} style={{ borderTop: `1px solid ${c.border}` }}
                            onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = c.cardAlt}
                            onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: c.txt }}>{p.nome}</td>
                            <td style={{ padding: '12px 16px', color: c.txt2 }}>{p.quantidade}</td>
                            <td style={{ padding: '12px 16px', color: c.txt3 }}>{p.quantidade_minima}</td>
                            <td style={{ padding: '12px 16px', color: c.txt2 }}>{fmt(Number(p.preco_custo))}</td>
                            <td style={{ padding: '12px 16px', color: c.txt2 }}>{fmt(Number(p.preco_venda))}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 700, color: c.txt }}>{margem}%</td>
                            <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: sc.bg, color: sc.text, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{status}</span></td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <BtnAcao label="Editar" onClick={() => setEditandoProd(p)} />
                                <BtnAcao label="Excluir" danger onClick={() => excluirProd(p.id)} />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {produtosFiltrados.length === 0 && <p style={{ textAlign: 'center', color: c.txt3, padding: 32, fontSize: 13 }}>Nenhum produto.</p>}
                </div>
              </div>
            </div>
          )}

          {/* CONTAS */}
          {aba === 'contas' && (
            <div className="page-enter">
              {editandoConta && (
                <Modal onClose={() => setEditandoConta(null)}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: c.txt, marginBottom: 20 }}>Editar conta</h2>
                  <form onSubmit={salvarEdicaoConta} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div><label style={lbl}>Descrição</label><input style={inp} value={editandoConta.descricao} onChange={e => setEditandoConta({...editandoConta, descricao: e.target.value})} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div><label style={lbl}>Valor</label><input type="number" step="0.01" style={inp} value={editandoConta.valor} onChange={e => setEditandoConta({...editandoConta, valor: e.target.value})} /></div>
                      <div><label style={lbl}>Tipo</label><select style={inp} value={editandoConta.tipo} onChange={e => setEditandoConta({...editandoConta, tipo: e.target.value})}><option value="pagar">A pagar</option><option value="receber">A receber</option></select></div>
                    </div>
                    <div><label style={lbl}>Vencimento</label><input type="date" style={inp} value={editandoConta.vencimento} onChange={e => setEditandoConta({...editandoConta, vencimento: e.target.value})} /></div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                      <button type="button" onClick={() => setEditandoConta(null)} style={{ ...btn(c.subCard, c.txt2), flex: 1, border: `1px solid ${c.border}` }}>Cancelar</button>
                      <button type="submit" style={{ ...btn(c.green), flex: 1 }}>Salvar</button>
                    </div>
                  </form>
                </Modal>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ backgroundColor: c.redLight, border: `1px solid ${dark ? '#5a1a1a' : '#fecaca'}`, borderRadius: 14, padding: 16 }}><p style={{ ...lbl, marginBottom: 6 }}>A pagar</p><p style={{ fontSize: 22, fontWeight: 800, color: c.red, margin: 0 }}>{fmt(contas.filter(ct => ct.tipo === 'pagar' && !ct.pago).reduce((a, ct) => a + Number(ct.valor), 0))}</p></div>
                <div style={{ backgroundColor: c.greenLight, border: `1px solid ${dark ? '#1a3d2b' : '#86efac'}`, borderRadius: 14, padding: 16 }}><p style={{ ...lbl, marginBottom: 6 }}>A receber</p><p style={{ fontSize: 22, fontWeight: 800, color: c.greenText, margin: 0 }}>{fmt(contas.filter(ct => ct.tipo === 'receber' && !ct.pago).reduce((a, ct) => a + Number(ct.valor), 0))}</p></div>
              </div>
              <div style={{ ...card, marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: c.txt, marginBottom: 16, marginTop: 0 }}>Nova conta</h2>
                <form onSubmit={adicionarConta} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lbl}>Descrição</label><input required placeholder="Ex: Aluguel março" style={inp} value={novaConta.descricao} onChange={e => setNovaConta({...novaConta, descricao: e.target.value})} /></div>
                  <div><label style={lbl}>Valor (R$)</label><input required type="number" step="0.01" style={inp} value={novaConta.valor} onChange={e => setNovaConta({...novaConta, valor: e.target.value})} /></div>
                  <div><label style={lbl}>Tipo</label><select style={inp} value={novaConta.tipo} onChange={e => setNovaConta({...novaConta, tipo: e.target.value})}><option value="pagar">A pagar</option><option value="receber">A receber</option></select></div>
                  <div><label style={lbl}>Vencimento</label><input required type="date" style={inp} value={novaConta.vencimento} onChange={e => setNovaConta({...novaConta, vencimento: e.target.value})} /></div>
                  <div style={{ gridColumn: '1/-1' }}><button type="submit" style={{ ...btn(c.green), width: '100%', padding: '12px', fontSize: 14 }}>+ Adicionar conta</button></div>
                </form>
              </div>
              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 550 }}>
                    <TabelaHeader cols={['Descrição','Valor','Tipo','Vencimento','Status','Ações']} />
                    <tbody>
                      {contas.map(ct => {
                        const vencida = !ct.pago && ct.vencimento < new Date().toISOString().split('T')[0]
                        return (
                          <tr key={ct.id} style={{ borderTop: `1px solid ${c.border}`, backgroundColor: vencida ? (dark ? 'rgba(192,57,43,0.1)' : '#fef2f2') : 'transparent' }}
                            onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = c.cardAlt}
                            onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = vencida ? (dark ? 'rgba(192,57,43,0.1)' : '#fef2f2') : 'transparent'}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: c.txt }}>{ct.descricao}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 700, color: ct.tipo === 'receber' ? c.greenText : c.red }}>{fmt(Number(ct.valor))}</td>
                            <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: ct.tipo === 'receber' ? c.greenLight : c.redLight, color: ct.tipo === 'receber' ? c.greenText : c.red, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{ct.tipo === 'receber' ? 'A receber' : 'A pagar'}</span></td>
                            <td style={{ padding: '12px 16px', color: c.txt3, fontSize: 12 }}>{ct.vencimento}</td>
                            <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: ct.pago ? c.greenLight : vencida ? c.redLight : c.amberLight, color: ct.pago ? c.greenText : vencida ? c.red : c.amber, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{ct.pago ? 'Pago' : vencida ? 'Vencida' : 'Pendente'}</span></td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => marcarPago(ct.id, ct.pago)} style={{ backgroundColor: ct.pago ? c.subCard : c.greenLight, color: ct.pago ? c.txt2 : c.greenText, border: `1px solid ${c.border}`, padding: '4px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{ct.pago ? 'Desfazer' : 'Pago'}</button>
                                <BtnAcao label="Editar" onClick={() => setEditandoConta(ct)} />
                                <BtnAcao label="Excluir" danger onClick={() => excluirConta(ct.id)} />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {contas.length === 0 && <p style={{ textAlign: 'center', color: c.txt3, padding: 32, fontSize: 13 }}>Nenhuma conta.</p>}
                </div>
              </div>
            </div>
          )}

          {/* METAS */}
          {aba === 'metas' && (
            <div className="page-enter">
              <div style={{ ...card, marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: c.txt, marginBottom: 16, marginTop: 0 }}>Nova meta</h2>
                <form onSubmit={adicionarMeta} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={lbl}>Descrição</label><input required placeholder="Ex: Meta de vendas" style={inp} value={novaMeta.descricao} onChange={e => setNovaMeta({...novaMeta, descricao: e.target.value})} /></div>
                  <div><label style={lbl}>Valor da meta (R$)</label><input required type="number" step="0.01" style={inp} value={novaMeta.valor_meta} onChange={e => setNovaMeta({...novaMeta, valor_meta: e.target.value})} /></div>
                  <div><label style={lbl}>Mês</label><input required type="month" style={inp} value={novaMeta.mes} onChange={e => setNovaMeta({...novaMeta, mes: e.target.value})} /></div>
                  <div><label style={lbl}>Tipo</label><select style={inp} value={novaMeta.tipo} onChange={e => setNovaMeta({...novaMeta, tipo: e.target.value})}><option value="entrada">Entradas</option><option value="saida">Saídas</option></select></div>
                  <div style={{ gridColumn: '1/-1' }}><button type="submit" style={{ ...btn(c.green), width: '100%', padding: '12px', fontSize: 14 }}>+ Adicionar meta</button></div>
                </form>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {metas.map(m => {
                  const lancMes = lancamentos.filter(l => l.data?.substring(0, 7) === m.mes)
                  const atual = m.tipo === 'entrada' ? lancMes.filter(l => l.tipo === 'entrada').reduce((a, l) => a + Number(l.valor), 0) : lancMes.filter(l => l.tipo === 'saida').reduce((a, l) => a + Number(l.valor), 0)
                  const pct = Math.min(Math.round((atual / m.valor_meta) * 100), 100)
                  return (
                    <div key={m.id} style={card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div><p style={{ fontWeight: 700, color: c.txt, margin: 0 }}>{m.descricao}</p><p style={{ fontSize: 12, color: c.txt3, margin: 0 }}>{m.mes} — {m.tipo === 'entrada' ? 'Entradas' : 'Saídas'}</p></div>
                        <BtnAcao label="Excluir" danger onClick={() => excluirMeta(m.id)} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                        <span style={{ color: c.txt2 }}>Atual: <strong style={{ color: c.greenText }}>{fmt(atual)}</strong></span>
                        <span style={{ color: c.txt2 }}>Meta: <strong style={{ color: c.txt }}>{fmt(m.valor_meta)}</strong></span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: c.subCard, borderRadius: 99, height: 10 }}>
                        <div style={{ width: `${pct}%`, background: pct >= 100 ? `linear-gradient(90deg, ${c.green}, #2d9b6a)` : `linear-gradient(90deg, #4ade80, #2d9b6a)`, borderRadius: 99, height: 10, transition: 'width 0.5s ease' }}></div>
                      </div>
                      <p style={{ fontSize: 11, color: pct >= 100 ? c.greenText : c.txt3, marginTop: 4, fontWeight: 600 }}>{pct}% atingido {pct >= 100 ? '✓' : ''}</p>
                    </div>
                  )
                })}
                {metas.length === 0 && <p style={{ textAlign: 'center', color: c.txt3, padding: 32, fontSize: 13 }}>Nenhuma meta.</p>}
              </div>
            </div>
          )}

          {/* DRE */}
          {aba === 'dre' && (
            <div className="page-enter">
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: c.txt, margin: 0 }}>Demonstrativo de Resultado</h2>
                    <p style={{ fontSize: 12, color: c.txt3, marginTop: 4 }}>Selecione o período</p>
                  </div>
                  <input type="month" style={{ ...inp, width: 'auto' }} value={filtroInicio.substring(0,7) || new Date().toISOString().substring(0,7)} onChange={e => { setFiltroInicio(e.target.value + '-01'); setFiltroFim(e.target.value + '-31') }} />
                </div>
                <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${c.border}` }}>
                  <div style={{ backgroundColor: c.greenLight, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ fontWeight: 700, color: c.txt }}>Receita bruta (entradas)</span>
                    <span style={{ fontWeight: 800, color: c.greenText, fontSize: 16 }}>{fmt(entradas)}</span>
                  </div>
                  {['Fornecedores','Salários','Aluguel','Impostos','Outros'].map(cat => {
                    const val = lancamentosFiltrados.filter(l => l.tipo === 'saida' && l.categoria === cat).reduce((a, l) => a + Number(l.valor), 0)
                    return val > 0 ? (
                      <div key={cat} style={{ padding: '13px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${c.border}`, backgroundColor: c.card }}>
                        <span style={{ color: c.txt2, fontSize: 14 }}>{cat}</span>
                        <span style={{ fontWeight: 700, color: c.red, fontSize: 14 }}>- {fmt(val)}</span>
                      </div>
                    ) : null
                  })}
                  <div style={{ background: `linear-gradient(135deg, #1a4731, #0d3320)`, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: 'white', fontSize: 16 }}>Resultado líquido</span>
                    <span style={{ fontWeight: 800, color: saldo >= 0 ? '#4ade80' : '#f87171', fontSize: 24 }}>{fmt(saldo)}</span>
                  </div>
                  <div style={{ padding: '13px 20px', display: 'flex', justifyContent: 'space-between', backgroundColor: c.cardAlt }}>
                    <span style={{ fontSize: 13, color: c.txt3 }}>Margem de lucro</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: saldo >= 0 ? c.greenText : c.red }}>{entradas > 0 ? Math.round((saldo / entradas) * 100) : 0}%</span>
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
                  <button onClick={() => setClienteSelecionado(null)} style={{ ...btn(c.subCard, c.txt2), border: `1px solid ${c.border}`, marginBottom: 16 }}>← Voltar</button>
                  <div style={{ ...card, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, ${c.green}, #2d9b6a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18, boxShadow: '0 4px 12px rgba(45,106,79,0.3)' }}>
                          {clienteSelecionado.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h2 style={{ fontSize: 20, fontWeight: 800, color: c.txt, margin: 0 }}>{clienteSelecionado.nome}</h2>
                          <span style={{ backgroundColor: clienteSelecionado.tipo === 'cliente' ? '#dbeafe' : '#ede9fe', color: clienteSelecionado.tipo === 'cliente' ? '#1d4ed8' : '#7c3aed', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{clienteSelecionado.tipo === 'cliente' ? 'Cliente' : 'Fornecedor'}</span>
                        </div>
                      </div>
                      <button onClick={() => setEditandoCliente(clienteSelecionado)} style={{ ...btn(c.subCard, c.txt2), border: `1px solid ${c.border}` }}>Editar</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { label: 'E-mail', valor: clienteSelecionado.email },
                        { label: 'Telefone', valor: clienteSelecionado.telefone },
                        { label: 'CPF/CNPJ', valor: clienteSelecionado.cpf_cnpj },
                        { label: 'Observação', valor: clienteSelecionado.observacao },
                      ].filter(f => f.valor).map(f => (
                        <div key={f.label} style={{ backgroundColor: c.subCard, borderRadius: 10, padding: 12 }}>
                          <p style={{ fontSize: 10, color: c.txt3, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 3px' }}>{f.label}</p>
                          <p style={{ fontSize: 14, color: c.txt2, margin: 0 }}>{f.valor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}` }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: c.txt, margin: 0 }}>Histórico de lançamentos</h3>
                      <p style={{ fontSize: 12, color: c.txt3, margin: '3px 0 0' }}>Clique para ver detalhes</p>
                    </div>
                    {lancamentos.filter(l => l.cliente_id === clienteSelecionado.id).length === 0
                      ? <p style={{ textAlign: 'center', color: c.txt3, padding: 32, fontSize: 13 }}>Nenhum lançamento para este cliente.</p>
                      : lancamentos.filter(l => l.cliente_id === clienteSelecionado.id).map(l => (
                        <div key={l.id} onClick={() => setLancamentoAberto(l)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: `1px solid ${c.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = c.cardAlt}
                          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: l.tipo === 'entrada' ? c.greenLight : c.redLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: l.tipo === 'entrada' ? c.greenText : c.red, fontSize: 16, fontWeight: 700 }}>
                              {l.tipo === 'entrada' ? '↑' : '↓'}
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 600, color: c.txt, margin: 0 }}>{l.descricao}</p>
                              <p style={{ fontSize: 11, color: c.txt3, margin: 0 }}>{l.data} • {l.categoria} • {l.forma_pagamento || 'dinheiro'}</p>
                              {l.observacao && <p style={{ fontSize: 11, color: c.txt3, margin: 0, fontStyle: 'italic' }}>{l.observacao}</p>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: l.tipo === 'entrada' ? c.greenText : c.red, display: 'block' }}>{l.tipo === 'entrada' ? '+' : '-'}{fmt(Number(l.valor))}</span>
                            <span style={{ fontSize: 11, color: c.txt3 }}>ver detalhes →</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ) : (
                <div>
                  {editandoCliente && (
                    <Modal onClose={() => setEditandoCliente(null)}>
                      <h2 style={{ fontSize: 18, fontWeight: 700, color: c.txt, marginBottom: 20 }}>Editar cadastro</h2>
                      <form onSubmit={async (e) => {
                        e.preventDefault()
                        await supabase.from('clientes').update({ nome: editandoCliente.nome, email: editandoCliente.email, telefone: editandoCliente.telefone, cpf_cnpj: editandoCliente.cpf_cnpj, tipo: editandoCliente.tipo, observacao: editandoCliente.observacao }).eq('id', editandoCliente.id)
                        if (clienteSelecionado?.id === editandoCliente.id) setClienteSelecionado(editandoCliente)
                        setEditandoCliente(null); mostrarToast('Atualizado!'); carregarDados()
                      }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div><label style={lbl}>Nome</label><input style={inp} value={editandoCliente.nome} onChange={e => setEditandoCliente({...editandoCliente, nome: e.target.value})} /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div><label style={lbl}>Tipo</label><select style={inp} value={editandoCliente.tipo} onChange={e => setEditandoCliente({...editandoCliente, tipo: e.target.value})}><option value="cliente">Cliente</option><option value="fornecedor">Fornecedor</option></select></div>
                          <div><label style={lbl}>Telefone</label><input style={inp} value={editandoCliente.telefone || ''} onChange={e => setEditandoCliente({...editandoCliente, telefone: e.target.value})} /></div>
                        </div>
                        <div><label style={lbl}>E-mail</label><input type="email" style={inp} value={editandoCliente.email || ''} onChange={e => setEditandoCliente({...editandoCliente, email: e.target.value})} /></div>
                        <div><label style={lbl}>CPF/CNPJ</label><input style={inp} value={editandoCliente.cpf_cnpj || ''} onChange={e => setEditandoCliente({...editandoCliente, cpf_cnpj: e.target.value})} /></div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                          <button type="button" onClick={() => setEditandoCliente(null)} style={{ ...btn(c.subCard, c.txt2), flex: 1, border: `1px solid ${c.border}` }}>Cancelar</button>
                          <button type="submit" style={{ ...btn(c.green), flex: 1 }}>Salvar</button>
                        </div>
                      </form>
                    </Modal>
                  )}
                  <div style={{ ...card, marginBottom: 16 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: c.txt, marginBottom: 16, marginTop: 0 }}>Novo cadastro</h2>
                    <form onSubmit={async (e) => {
                      e.preventDefault()
                      const { data: { user } } = await supabase.auth.getUser()
                      await supabase.from('clientes').insert({ ...novoCliente, user_id: user?.id })
                      setNovoCliente({ nome: '', email: '', telefone: '', cpf_cnpj: '', tipo: 'cliente', observacao: '' })
                      mostrarToast('Cadastro adicionado!'); carregarDados()
                    }} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                      <div style={{ gridColumn: '1/3' }}><label style={lbl}>Nome completo</label><input required placeholder="Ex: João da Silva" style={inp} value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} /></div>
                      <div><label style={lbl}>Tipo</label><select style={inp} value={novoCliente.tipo} onChange={e => setNovoCliente({...novoCliente, tipo: e.target.value})}><option value="cliente">Cliente</option><option value="fornecedor">Fornecedor</option></select></div>
                      <div><label style={lbl}>E-mail</label><input type="email" placeholder="email@exemplo.com" style={inp} value={novoCliente.email} onChange={e => setNovoCliente({...novoCliente, email: e.target.value})} /></div>
                      <div><label style={lbl}>Telefone</label><input placeholder="(11) 99999-9999" style={inp} value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} /></div>
                      <div><label style={lbl}>CPF/CNPJ</label><input placeholder="000.000.000-00" style={inp} value={novoCliente.cpf_cnpj} onChange={e => setNovoCliente({...novoCliente, cpf_cnpj: e.target.value})} /></div>
                      <div style={{ gridColumn: '1/-1' }}><button type="submit" style={{ ...btn(c.green), width: '100%', padding: '12px', fontSize: 14 }}>+ Adicionar cadastro</button></div>
                    </form>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
                    {clientes.map(cl => (
                      <div key={cl.id} onClick={() => setClienteSelecionado(cl)}
                        style={{ ...card, cursor: 'pointer', transition: 'all 0.2s ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 42, height: 42, borderRadius: '50%', background: cl.tipo === 'cliente' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14 }}>
                              {cl.nome.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: c.txt, margin: 0, fontSize: 14 }}>{cl.nome}</p>
                              <span style={{ backgroundColor: cl.tipo === 'cliente' ? '#dbeafe' : '#ede9fe', color: cl.tipo === 'cliente' ? '#1d4ed8' : '#7c3aed', padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{cl.tipo === 'cliente' ? 'Cliente' : 'Fornecedor'}</span>
                            </div>
                          </div>
                          <button onClick={async (ev) => { ev.stopPropagation(); if (!confirm('Excluir?')) return; await supabase.from('clientes').delete().eq('id', cl.id); mostrarToast('Excluído!'); carregarDados() }}
                            style={{ backgroundColor: c.redLight, color: c.red, border: 'none', padding: '4px 8px', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {cl.email && <p style={{ fontSize: 12, color: c.txt3, margin: 0 }}>✉ {cl.email}</p>}
                          {cl.telefone && <p style={{ fontSize: 12, color: c.txt3, margin: 0 }}>📞 {cl.telefone}</p>}
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${c.border}` }}>
                            <p style={{ fontSize: 12, color: c.greenText, margin: 0, fontWeight: 600 }}>
                              {lancamentos.filter(l => l.cliente_id === cl.id).length} lançamento(s) • {fmt(lancamentos.filter(l => l.cliente_id === cl.id).reduce((a, l) => a + Number(l.valor), 0))}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {clientes.length === 0 && <p style={{ textAlign: 'center', color: c.txt3, padding: 32, fontSize: 13, gridColumn: '1/-1' }}>Nenhum cadastro ainda.</p>}
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