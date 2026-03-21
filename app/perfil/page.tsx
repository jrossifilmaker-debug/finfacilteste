'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [contas, setContas] = useState<any[]>([])
  const [metas, setMetas] = useState<any[]>([])
  const [aba, setAba] = useState('painel')
  const [usuario, setUsuario] = useState<any>(null)
  const [busca, setBusca] = useState('')
  const [toast, setToast] = useState('')

  const [novoLanc, setNovoLanc] = useState({ descricao: '', valor: '', tipo: 'entrada', categoria: 'Vendas', produto_id: '', quantidade_vendida: '' })
  const [novoProd, setNovoProd] = useState({ nome: '', quantidade: '', quantidade_minima: '', preco_custo: '', preco_venda: '' })
  const [novaConta, setNovaConta] = useState({ descricao: '', valor: '', tipo: 'pagar', categoria: 'Fornecedores', vencimento: '' })
  const [novaMeta, setNovaMeta] = useState({ descricao: '', valor_meta: '', mes: '', tipo: 'entrada' })

  const [editandoLanc, setEditandoLanc] = useState<any>(null)
  const [editandoProd, setEditandoProd] = useState<any>(null)
  const [editandoConta, setEditandoConta] = useState<any>(null)

  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim] = useState('')

  useEffect(() => { carregarDados() }, [])

  function mostrarToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
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
  }

  async function adicionarLancamento(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const lancamento: any = {
      descricao: novoLanc.descricao,
      valor: parseFloat(novoLanc.valor),
      tipo: novoLanc.tipo,
      categoria: novoLanc.categoria,
      user_id: user?.id,
      data: new Date().toISOString().split('T')[0]
    }
    if (novoLanc.tipo === 'saida' && novoLanc.produto_id && novoLanc.quantidade_vendida) {
      lancamento.produto_id = parseInt(novoLanc.produto_id)
      lancamento.quantidade_vendida = parseFloat(novoLanc.quantidade_vendida)
      const produto = produtos.find(p => p.id === parseInt(novoLanc.produto_id))
      if (produto) {
        await supabase.from('produtos').update({ quantidade: produto.quantidade - parseFloat(novoLanc.quantidade_vendida) }).eq('id', produto.id)
      }
    }
    await supabase.from('lancamentos').insert(lancamento)
    setNovoLanc({ descricao: '', valor: '', tipo: 'entrada', categoria: 'Vendas', produto_id: '', quantidade_vendida: '' })
    mostrarToast('Lançamento adicionado com sucesso!')
    carregarDados()
  }

  async function salvarEdicaoLanc(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('lancamentos').update({
      descricao: editandoLanc.descricao,
      valor: parseFloat(editandoLanc.valor),
      tipo: editandoLanc.tipo,
      categoria: editandoLanc.categoria,
    }).eq('id', editandoLanc.id)
    setEditandoLanc(null)
    mostrarToast('Lançamento atualizado!')
    carregarDados()
  }

  async function excluirLanc(id: string) {
    if (!confirm('Deseja excluir este lançamento?')) return
    await supabase.from('lancamentos').delete().eq('id', id)
    mostrarToast('Lançamento excluído!')
    carregarDados()
  }

  async function adicionarProduto(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('produtos').insert({
      ...novoProd,
      quantidade: parseFloat(novoProd.quantidade),
      quantidade_minima: parseFloat(novoProd.quantidade_minima),
      preco_custo: parseFloat(novoProd.preco_custo),
      preco_venda: parseFloat(novoProd.preco_venda),
      user_id: user?.id
    })
    setNovoProd({ nome: '', quantidade: '', quantidade_minima: '', preco_custo: '', preco_venda: '' })
    mostrarToast('Produto adicionado com sucesso!')
    carregarDados()
  }

  async function salvarEdicaoProd(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('produtos').update({
      nome: editandoProd.nome,
      quantidade: parseFloat(editandoProd.quantidade),
      quantidade_minima: parseFloat(editandoProd.quantidade_minima),
      preco_custo: parseFloat(editandoProd.preco_custo),
      preco_venda: parseFloat(editandoProd.preco_venda),
    }).eq('id', editandoProd.id)
    setEditandoProd(null)
    mostrarToast('Produto atualizado!')
    carregarDados()
  }

  async function excluirProd(id: string) {
    if (!confirm('Deseja excluir este produto?')) return
    await supabase.from('produtos').delete().eq('id', id)
    mostrarToast('Produto excluído!')
    carregarDados()
  }

  async function adicionarConta(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('contas').insert({
      ...novaConta,
      valor: parseFloat(novaConta.valor),
      user_id: user?.id
    })
    setNovaConta({ descricao: '', valor: '', tipo: 'pagar', categoria: 'Fornecedores', vencimento: '' })
    mostrarToast('Conta adicionada com sucesso!')
    carregarDados()
  }

  async function marcarPago(id: string, pago: boolean) {
    await supabase.from('contas').update({ pago: !pago }).eq('id', id)
    mostrarToast(!pago ? 'Conta marcada como paga!' : 'Pagamento desfeito!')
    carregarDados()
  }

  async function excluirConta(id: string) {
    if (!confirm('Deseja excluir esta conta?')) return
    await supabase.from('contas').delete().eq('id', id)
    mostrarToast('Conta excluída!')
    carregarDados()
  }

  async function salvarEdicaoConta(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('contas').update({
      descricao: editandoConta.descricao,
      valor: parseFloat(editandoConta.valor),
      tipo: editandoConta.tipo,
      categoria: editandoConta.categoria,
      vencimento: editandoConta.vencimento,
    }).eq('id', editandoConta.id)
    setEditandoConta(null)
    mostrarToast('Conta atualizada!')
    carregarDados()
  }

  async function adicionarMeta(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('metas').insert({
      ...novaMeta,
      valor_meta: parseFloat(novaMeta.valor_meta),
      user_id: user?.id
    })
    setNovaMeta({ descricao: '', valor_meta: '', mes: '', tipo: 'entrada' })
    mostrarToast('Meta adicionada com sucesso!')
    carregarDados()
  }

  async function excluirMeta(id: string) {
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
      head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
      body: lancamentosFiltrados.map(l => [
        l.data, l.descricao, l.categoria,
        l.tipo === 'entrada' ? 'Entrada' : 'Saída',
        `R$ ${Number(l.valor).toFixed(2)}`
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 163, 74] }
    })
    doc.save('relatorio-finfacil.pdf')
    mostrarToast('PDF gerado com sucesso!')
  }

  function exportarExcel() {
    const dadosLanc = lancamentosFiltrados.map(l => ({
      Data: l.data,
      Descrição: l.descricao,
      Categoria: l.categoria,
      Tipo: l.tipo === 'entrada' ? 'Entrada' : 'Saída',
      Valor: Number(l.valor)
    }))
    const dadosProd = produtos.map(p => ({
      Produto: p.nome,
      Quantidade: p.quantidade,
      'Qtd Mínima': p.quantidade_minima,
      'Preço Custo': Number(p.preco_custo),
      'Preço Venda': Number(p.preco_venda),
      'Margem %': p.preco_venda > 0 ? Math.round((p.preco_venda - p.preco_custo) / p.preco_venda * 100) : 0
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dadosLanc), 'Fluxo de Caixa')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dadosProd), 'Estoque')
    XLSX.writeFile(wb, 'finfacil-dados.xlsx')
    mostrarToast('Excel exportado com sucesso!')
  }

  async function sair() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const lancamentosFiltrados = lancamentos.filter(l => {
    if (filtroInicio && l.data < filtroInicio) return false
    if (filtroFim && l.data > filtroFim) return false
    if (busca && !l.descricao?.toLowerCase().includes(busca.toLowerCase()) &&
        !l.categoria?.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  const produtosFiltrados = produtos.filter(p =>
    !busca || p.nome?.toLowerCase().includes(busca.toLowerCase())
  )

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

  const inputClass = "w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-800 font-medium placeholder-gray-400 focus:outline-none focus:border-green-500 bg-white text-sm"
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1"

  return (
    <main className="min-h-screen bg-gray-50">
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-semibold animate-pulse">
          {toast}
        </div>
      )}

      <header className="bg-white shadow-sm px-4 md:px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-600">FinFácil</h1>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center border-2 border-gray-200 rounded-lg px-3 py-1.5 gap-2">
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="text-sm outline-none bg-transparent w-40 text-gray-700"
            />
          </div>
          <a href="/perfil" className="text-sm text-gray-500 hover:text-green-600 font-medium hidden md:block">Perfil</a>
          <span className="text-sm font-medium text-gray-600 hidden md:block">{usuario?.user_metadata?.empresa}</span>
          <button onClick={sair} className="text-sm text-red-500 hover:underline font-medium">Sair</button>
        </div>
      </header>

      <div className="md:hidden px-4 py-2 bg-white border-b">
        <input
          type="text"
          placeholder="Buscar lançamentos e produtos..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none text-gray-700"
        />
      </div>

      <nav className="bg-white border-b px-2 md:px-6 flex gap-1 md:gap-4 overflow-x-auto">
        {['painel', 'fluxo', 'estoque', 'contas', 'metas', 'dre'].map(a => (
          <button key={a} onClick={() => setAba(a)}
            className={`py-3 px-2 md:px-3 text-xs md:text-sm font-semibold border-b-2 transition whitespace-nowrap ${aba === a ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {a === 'painel' ? 'Painel' : a === 'fluxo' ? 'Fluxo de Caixa' : a === 'estoque' ? 'Estoque' : a === 'contas' ? 'Contas' : a === 'metas' ? 'Metas' : 'DRE'}
          </button>
        ))}
      </nav>

      <div className="p-4 md:p-6 max-w-5xl mx-auto">

        {aba === 'painel' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Entradas', valor: fmt(entradas), cor: 'text-green-600' },
                { label: 'Saídas', valor: fmt(saidas), cor: 'text-red-500' },
                { label: 'Saldo', valor: fmt(saldo), cor: saldo >= 0 ? 'text-green-600' : 'text-red-500' },
                { label: 'Estoque crítico', valor: produtosCriticos.length + ' itens', cor: 'text-orange-500' },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{c.label}</p>
                  <p className={`text-lg md:text-xl font-bold ${c.cor}`}>{c.valor}</p>
                </div>
              ))}
            </div>

            {dadosGrafico.length > 0 && (
              <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 mb-6">
                <h2 className="font-bold text-gray-700 mb-4">Entradas x Saídas por mês</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="entradas" name="Entradas" fill="#16a34a" radius={[4,4,0,0]} />
                    <Bar dataKey="saidas" name="Saídas" fill="#dc2626" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {metasDoMes.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                <h2 className="font-bold text-gray-700 mb-3">Metas do mês</h2>
                {metasDoMes.map(m => {
                  const atual = m.tipo === 'entrada' ? entradas : saidas
                  const pct = Math.min(Math.round((atual / m.valor_meta) * 100), 100)
                  return (
                    <div key={m.id} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{m.descricao}</span>
                        <span className="text-gray-500">{fmt(atual)} / {fmt(m.valor_meta)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{pct}% atingido</p>
                    </div>
                  )
                })}
              </div>
            )}

            {(produtosCriticos.length > 0 || contasVencidas.length > 0) && (
              <div className="flex flex-col gap-3 mb-6">
                {produtosCriticos.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-orange-700 font-semibold text-sm mb-1">Estoque baixo:</p>
                    {produtosCriticos.map(p => (
                      <p key={p.id} className="text-orange-600 text-sm">• {p.nome} — {p.quantidade} un. (mín: {p.quantidade_minima})</p>
                    ))}
                  </div>
                )}
                {contasVencidas.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 font-semibold text-sm mb-1">Contas vencidas:</p>
                    {contasVencidas.map(c => (
                      <p key={c.id} className="text-red-600 text-sm">• {c.descricao} — {fmt(c.valor)} (venceu: {c.vencimento})</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-700 mb-3">Últimas movimentações</h2>
              {lancamentos.length === 0 && <p className="text-gray-400 text-sm">Nenhuma movimentação ainda.</p>}
              {lancamentos.slice(0, 5).map(l => (
                <div key={l.id} className="flex justify-between py-2 border-b last:border-0">
                  <span className="text-sm font-medium text-gray-700">{l.descricao}</span>
                  <span className={`text-sm font-bold ${l.tipo === 'entrada' ? 'text-green-600' : 'text-red-500'}`}>
                    {l.tipo === 'entrada' ? '+' : '-'}{fmt(Number(l.valor))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === 'fluxo' && (
          <div>
            {editandoLanc && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                  <h2 className="font-bold text-gray-700 mb-4 text-lg">Editar lançamento</h2>
                  <form onSubmit={salvarEdicaoLanc} className="flex flex-col gap-3">
                    <div><label className={labelClass}>Descrição</label>
                      <input className={inputClass} value={editandoLanc.descricao} onChange={e => setEditandoLanc({...editandoLanc, descricao: e.target.value})} /></div>
                    <div><label className={labelClass}>Valor (R$)</label>
                      <input type="number" step="0.01" className={inputClass} value={editandoLanc.valor} onChange={e => setEditandoLanc({...editandoLanc, valor: e.target.value})} /></div>
                    <div><label className={labelClass}>Tipo</label>
                      <select className={inputClass} value={editandoLanc.tipo} onChange={e => setEditandoLanc({...editandoLanc, tipo: e.target.value})}>
                        <option value="entrada">Entrada</option><option value="saida">Saída</option>
                      </select></div>
                    <div><label className={labelClass}>Categoria</label>
                      <select className={inputClass} value={editandoLanc.categoria} onChange={e => setEditandoLanc({...editandoLanc, categoria: e.target.value})}>
                        {['Vendas','Fornecedores','Salários','Aluguel','Impostos','Outros'].map(c => <option key={c}>{c}</option>)}
                      </select></div>
                    <div className="flex gap-2 mt-2">
                      <button type="button" onClick={() => setEditandoLanc(null)} className="flex-1 border-2 border-gray-300 text-gray-600 rounded-lg py-2 font-semibold">Cancelar</button>
                      <button type="submit" className="flex-1 bg-green-600 text-white rounded-lg py-2 font-semibold">Salvar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 mb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <h2 className="font-bold text-gray-700">Filtrar por período</h2>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={gerarPDF} className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">PDF</button>
                  <button onClick={exportarExcel} className="flex-1 md:flex-none bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800">Excel</button>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1"><label className={labelClass}>Data início</label>
                  <input type="date" value={filtroInicio} onChange={e => setFiltroInicio(e.target.value)} className={inputClass} /></div>
                <div className="flex-1"><label className={labelClass}>Data fim</label>
                  <input type="date" value={filtroFim} onChange={e => setFiltroFim(e.target.value)} className={inputClass} /></div>
                <div className="flex items-end">
                  <button onClick={() => { setFiltroInicio(''); setFiltroFim('') }} className="w-full md:w-auto border-2 border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm font-semibold">Limpar</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Entradas', valor: fmt(entradas), cor: 'text-green-600' },
                { label: 'Saídas', valor: fmt(saidas), cor: 'text-red-500' },
                { label: 'Saldo', valor: fmt(saldo), cor: saldo >= 0 ? 'text-green-600' : 'text-red-500' },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                  <p className="text-xs font-semibold text-gray-500 uppercase">{c.label}</p>
                  <p className={`text-sm md:text-lg font-bold ${c.cor}`}>{c.valor}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 mb-4">
              <h2 className="font-bold text-gray-700 mb-4">Novo lançamento</h2>
              <form onSubmit={adicionarLancamento} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className={labelClass}>Descrição</label>
                  <input required placeholder="Ex: Venda do dia" value={novoLanc.descricao} onChange={e => setNovoLanc({...novoLanc, descricao: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Valor (R$)</label>
                  <input required type="number" step="0.01" placeholder="0,00" value={novoLanc.valor} onChange={e => setNovoLanc({...novoLanc, valor: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Tipo</label>
                  <select value={novoLanc.tipo} onChange={e => setNovoLanc({...novoLanc, tipo: e.target.value, produto_id: '', quantidade_vendida: ''})} className={inputClass}>
                    <option value="entrada">Entrada</option><option value="saida">Saída</option>
                  </select></div>
                <div><label className={labelClass}>Categoria</label>
                  <select value={novoLanc.categoria} onChange={e => setNovoLanc({...novoLanc, categoria: e.target.value})} className={inputClass}>
                    {['Vendas','Fornecedores','Salários','Aluguel','Impostos','Outros'].map(c => <option key={c}>{c}</option>)}
                  </select></div>
                {novoLanc.tipo === 'saida' && (<>
                  <div><label className={labelClass}>Produto usado (opcional)</label>
                    <select value={novoLanc.produto_id} onChange={e => setNovoLanc({...novoLanc, produto_id: e.target.value})} className={inputClass}>
                      <option value="">Nenhum</option>
                      {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} (estoque: {p.quantidade})</option>)}
                    </select></div>
                  {novoLanc.produto_id && (
                    <div><label className={labelClass}>Quantidade vendida</label>
                      <input type="number" placeholder="0" value={novoLanc.quantidade_vendida} onChange={e => setNovoLanc({...novoLanc, quantidade_vendida: e.target.value})} className={inputClass} /></div>
                  )}
                </>)}
                <div className="md:col-span-2">
                  <button type="submit" className="w-full bg-green-600 text-white rounded-lg px-4 py-3 font-bold hover:bg-green-700">+ Adicionar lançamento</button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Data','Descrição','Categoria','Valor','Tipo','Ações'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-bold text-gray-600 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {lancamentosFiltrados.map(l => (
                    <tr key={l.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-3 text-gray-600">{l.data}</td>
                      <td className="px-3 py-3 font-semibold text-gray-800">{l.descricao}</td>
                      <td className="px-3 py-3 text-gray-600">{l.categoria}</td>
                      <td className={`px-3 py-3 font-bold ${l.tipo === 'entrada' ? 'text-green-600' : 'text-red-500'}`}>{fmt(Number(l.valor))}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${l.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {l.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-3 py-3 flex gap-2">
                        <button onClick={() => setEditandoLanc(l)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-semibold">Editar</button>
                        <button onClick={() => excluirLanc(l.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg font-semibold">Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {lancamentosFiltrados.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">Nenhum lançamento encontrado.</p>}
            </div>
          </div>
        )}

        {aba === 'estoque' && (
          <div>
            {editandoProd && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                  <h2 className="font-bold text-gray-700 mb-4 text-lg">Editar produto</h2>
                  <form onSubmit={salvarEdicaoProd} className="flex flex-col gap-3">
                    <div><label className={labelClass}>Nome</label>
                      <input className={inputClass} value={editandoProd.nome} onChange={e => setEditandoProd({...editandoProd, nome: e.target.value})} /></div>
                    <div><label className={labelClass}>Quantidade</label>
                      <input type="number" className={inputClass} value={editandoProd.quantidade} onChange={e => setEditandoProd({...editandoProd, quantidade: e.target.value})} /></div>
                    <div><label className={labelClass}>Qtd mínima</label>
                      <input type="number" className={inputClass} value={editandoProd.quantidade_minima} onChange={e => setEditandoProd({...editandoProd, quantidade_minima: e.target.value})} /></div>
                    <div><label className={labelClass}>Preço de custo</label>
                      <input type="number" step="0.01" className={inputClass} value={editandoProd.preco_custo} onChange={e => setEditandoProd({...editandoProd, preco_custo: e.target.value})} /></div>
                    <div><label className={labelClass}>Preço de venda</label>
                      <input type="number" step="0.01" className={inputClass} value={editandoProd.preco_venda} onChange={e => setEditandoProd({...editandoProd, preco_venda: e.target.value})} /></div>
                    <div className="flex gap-2 mt-2">
                      <button type="button" onClick={() => setEditandoProd(null)} className="flex-1 border-2 border-gray-300 text-gray-600 rounded-lg py-2 font-semibold">Cancelar</button>
                      <button type="submit" className="flex-1 bg-green-600 text-white rounded-lg py-2 font-semibold">Salvar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 mb-4">
              <h2 className="font-bold text-gray-700 mb-4">Novo produto</h2>
              <form onSubmit={adicionarProduto} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2"><label className={labelClass}>Nome do produto</label>
                  <input required placeholder="Ex: Farinha de trigo 1kg" value={novoProd.nome} onChange={e => setNovoProd({...novoProd, nome: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Quantidade atual</label>
                  <input required type="number" placeholder="0" value={novoProd.quantidade} onChange={e => setNovoProd({...novoProd, quantidade: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Quantidade mínima</label>
                  <input required type="number" placeholder="0" value={novoProd.quantidade_minima} onChange={e => setNovoProd({...novoProd, quantidade_minima: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Preço de custo (R$)</label>
                  <input required type="number" step="0.01" placeholder="0,00" value={novoProd.preco_custo} onChange={e => setNovoProd({...novoProd, preco_custo: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Preço de venda (R$)</label>
                  <input required type="number" step="0.01" placeholder="0,00" value={novoProd.preco_venda} onChange={e => setNovoProd({...novoProd, preco_venda: e.target.value})} className={inputClass} /></div>
                <div className="md:col-span-2">
                  <button type="submit" className="w-full bg-green-600 text-white rounded-lg px-4 py-3 font-bold hover:bg-green-700">+ Adicionar produto</button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm min-w-[650px]">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Produto','Qtd','Mín','Custo','Venda','Margem','Status','Ações'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-bold text-gray-600 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map(p => {
                    const margem = p.preco_venda > 0 ? Math.round((p.preco_venda - p.preco_custo) / p.preco_venda * 100) : 0
                    const status = p.quantidade === 0 ? 'Sem estoque' : p.quantidade < p.quantidade_minima ? 'Baixo' : 'OK'
                    const corStatus = status === 'OK' ? 'bg-green-100 text-green-700' : status === 'Baixo' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    return (
                      <tr key={p.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-3 font-semibold text-gray-800">{p.nome}</td>
                        <td className="px-3 py-3">{p.quantidade}</td>
                        <td className="px-3 py-3 text-gray-500">{p.quantidade_minima}</td>
                        <td className="px-3 py-3">{fmt(Number(p.preco_custo))}</td>
                        <td className="px-3 py-3">{fmt(Number(p.preco_venda))}</td>
                        <td className="px-3 py-3 font-bold">{margem}%</td>
                        <td className="px-3 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${corStatus}`}>{status}</span></td>
                        <td className="px-3 py-3 flex gap-2">
                          <button onClick={() => setEditandoProd(p)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-semibold">Editar</button>
                          <button onClick={() => excluirProd(p.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg font-semibold">Excluir</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {produtosFiltrados.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">Nenhum produto encontrado.</p>}
            </div>
          </div>
        )}

        {aba === 'contas' && (
          <div>
            {editandoConta && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                  <h2 className="font-bold text-gray-700 mb-4 text-lg">Editar conta</h2>
                  <form onSubmit={salvarEdicaoConta} className="flex flex-col gap-3">
                    <div><label className={labelClass}>Descrição</label>
                      <input className={inputClass} value={editandoConta.descricao} onChange={e => setEditandoConta({...editandoConta, descricao: e.target.value})} /></div>
                    <div><label className={labelClass}>Valor</label>
                      <input type="number" step="0.01" className={inputClass} value={editandoConta.valor} onChange={e => setEditandoConta({...editandoConta, valor: e.target.value})} /></div>
                    <div><label className={labelClass}>Tipo</label>
                      <select className={inputClass} value={editandoConta.tipo} onChange={e => setEditandoConta({...editandoConta, tipo: e.target.value})}>
                        <option value="pagar">A pagar</option><option value="receber">A receber</option>
                      </select></div>
                    <div><label className={labelClass}>Vencimento</label>
                      <input type="date" className={inputClass} value={editandoConta.vencimento} onChange={e => setEditandoConta({...editandoConta, vencimento: e.target.value})} /></div>
                    <div className="flex gap-2 mt-2">
                      <button type="button" onClick={() => setEditandoConta(null)} className="flex-1 border-2 border-gray-300 text-gray-600 rounded-lg py-2 font-semibold">Cancelar</button>
                      <button type="submit" className="flex-1 bg-green-600 text-white rounded-lg py-2 font-semibold">Salvar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase">A pagar</p>
                <p className="text-lg font-bold text-red-500">{fmt(contas.filter(c => c.tipo === 'pagar' && !c.pago).reduce((a, c) => a + Number(c.valor), 0))}</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase">A receber</p>
                <p className="text-lg font-bold text-green-600">{fmt(contas.filter(c => c.tipo === 'receber' && !c.pago).reduce((a, c) => a + Number(c.valor), 0))}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 mb-4">
              <h2 className="font-bold text-gray-700 mb-4">Nova conta</h2>
              <form onSubmit={adicionarConta} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className={labelClass}>Descrição</label>
                  <input required placeholder="Ex: Aluguel março" value={novaConta.descricao} onChange={e => setNovaConta({...novaConta, descricao: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Valor (R$)</label>
                  <input required type="number" step="0.01" placeholder="0,00" value={novaConta.valor} onChange={e => setNovaConta({...novaConta, valor: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Tipo</label>
                  <select value={novaConta.tipo} onChange={e => setNovaConta({...novaConta, tipo: e.target.value})} className={inputClass}>
                    <option value="pagar">A pagar</option><option value="receber">A receber</option>
                  </select></div>
                <div><label className={labelClass}>Vencimento</label>
                  <input required type="date" value={novaConta.vencimento} onChange={e => setNovaConta({...novaConta, vencimento: e.target.value})} className={inputClass} /></div>
                <div className="md:col-span-2">
                  <button type="submit" className="w-full bg-green-600 text-white rounded-lg px-4 py-3 font-bold hover:bg-green-700">+ Adicionar conta</button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm min-w-[550px]">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Descrição','Valor','Tipo','Vencimento','Status','Ações'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-bold text-gray-600 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {contas.map(c => {
                    const vencida = !c.pago && c.vencimento < new Date().toISOString().split('T')[0]
                    return (
                      <tr key={c.id} className={`border-t hover:bg-gray-50 ${vencida ? 'bg-red-50' : ''}`}>
                        <td className="px-3 py-3 font-semibold text-gray-800">{c.descricao}</td>
                        <td className={`px-3 py-3 font-bold ${c.tipo === 'receber' ? 'text-green-600' : 'text-red-500'}`}>{fmt(Number(c.valor))}</td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.tipo === 'receber' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {c.tipo === 'receber' ? 'A receber' : 'A pagar'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-600">{c.vencimento}</td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.pago ? 'bg-green-100 text-green-700' : vencida ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {c.pago ? 'Pago' : vencida ? 'Vencida' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-3 py-3 flex gap-1 flex-wrap">
                          <button onClick={() => marcarPago(c.id, c.pago)} className={`text-xs px-2 py-1 rounded-lg font-semibold ${c.pago ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-600'}`}>
                            {c.pago ? 'Desfazer' : 'Pago'}
                          </button>
                          <button onClick={() => setEditandoConta(c)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-semibold">Editar</button>
                          <button onClick={() => excluirConta(c.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg font-semibold">Excluir</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {contas.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">Nenhuma conta ainda.</p>}
            </div>
          </div>
        )}

        {aba === 'metas' && (
          <div>
            <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 mb-4">
              <h2 className="font-bold text-gray-700 mb-4">Nova meta</h2>
              <form onSubmit={adicionarMeta} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className={labelClass}>Descrição</label>
                  <input required placeholder="Ex: Meta de vendas" value={novaMeta.descricao} onChange={e => setNovaMeta({...novaMeta, descricao: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Valor da meta (R$)</label>
                  <input required type="number" step="0.01" placeholder="0,00" value={novaMeta.valor_meta} onChange={e => setNovaMeta({...novaMeta, valor_meta: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Mês</label>
                  <input required type="month" value={novaMeta.mes} onChange={e => setNovaMeta({...novaMeta, mes: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Tipo</label>
                  <select value={novaMeta.tipo} onChange={e => setNovaMeta({...novaMeta, tipo: e.target.value})} className={inputClass}>
                    <option value="entrada">Entradas</option><option value="saida">Saídas</option>
                  </select></div>
                <div className="md:col-span-2">
                  <button type="submit" className="w-full bg-green-600 text-white rounded-lg px-4 py-3 font-bold hover:bg-green-700">+ Adicionar meta</button>
                </div>
              </form>
            </div>

            <div className="flex flex-col gap-4">
              {metas.map(m => {
                const lancMes = lancamentos.filter(l => l.data?.substring(0, 7) === m.mes)
                const atual = m.tipo === 'entrada'
                  ? lancMes.filter(l => l.tipo === 'entrada').reduce((a, l) => a + Number(l.valor), 0)
                  : lancMes.filter(l => l.tipo === 'saida').reduce((a, l) => a + Number(l.valor), 0)
                const pct = Math.min(Math.round((atual / m.valor_meta) * 100), 100)
                return (
                  <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-800">{m.descricao}</p>
                        <p className="text-xs text-gray-500">{m.mes} — {m.tipo === 'entrada' ? 'Entradas' : 'Saídas'}</p>
                      </div>
                      <button onClick={() => excluirMeta(m.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg font-semibold">Excluir</button>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Atual: <strong>{fmt(atual)}</strong></span>
                      <span className="text-gray-600">Meta: <strong>{fmt(m.valor_meta)}</strong></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className={`h-3 rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <p className={`text-xs mt-1 font-semibold ${pct >= 100 ? 'text-green-600' : 'text-blue-600'}`}>{pct}% atingido {pct >= 100 ? '✓' : ''}</p>
                  </div>
                )
              })}
              {metas.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">Nenhuma meta ainda.</p>}
            </div>
          </div>
        )}

        {aba === 'dre' && (
          <div>
            <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 mb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <h2 className="font-bold text-gray-700">DRE — Demonstrativo de Resultado</h2>
                <input type="month" value={filtroInicio.substring(0,7) || new Date().toISOString().substring(0,7)}
                  onChange={e => { setFiltroInicio(e.target.value + '-01'); setFiltroFim(e.target.value + '-31') }}
                  className={inputClass + ' w-auto'} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between py-3 border-b">
                  <span className="font-semibold text-gray-700">Receita bruta (entradas)</span>
                  <span className="font-bold text-green-600">{fmt(entradas)}</span>
                </div>
                {['Fornecedores','Salários','Aluguel','Impostos','Outros'].map(cat => {
                  const val = lancamentosFiltrados.filter(l => l.tipo === 'saida' && l.categoria === cat).reduce((a, l) => a + Number(l.valor), 0)
                  return val > 0 ? (
                    <div key={cat} className="flex justify-between py-3 border-b">
                      <span className="font-semibold text-gray-700">{cat}</span>
                      <span className="font-bold text-red-500">- {fmt(val)}</span>
                    </div>
                  ) : null
                })}
                <div className="flex justify-between py-4 mt-2 bg-gray-50 rounded-xl px-4">
                  <span className="font-bold text-gray-800 text-lg">Resultado líquido</span>
                  <span className={`font-bold text-xl ${saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(saldo)}</span>
                </div>
                <div className="flex justify-between py-2 px-4">
                  <span className="text-sm text-gray-500">Margem de lucro</span>
                  <span className={`text-sm font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {entradas > 0 ? Math.round((saldo / entradas) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}