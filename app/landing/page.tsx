export default function Landing() {
  return (
    <main className="min-h-screen bg-white">

      {/* Header */}
      <header className="fixed top-0 w-full bg-white border-b border-gray-100 z-50 px-4 md:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-600">FinFácil</h1>
        <div className="flex gap-3">
          <a href="/" className="text-sm font-semibold text-gray-600 hover:text-green-600 px-4 py-2">Entrar</a>
          <a href="/cadastro" className="text-sm font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Começar grátis</a>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto text-center">
        <span className="inline-block bg-green-50 text-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-6">
          Sistema financeiro para pequenas empresas
        </span>
        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Controle financeiro<br />
          <span className="text-green-600">simples e poderoso</span>
        </h2>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Chega de planilhas e cadernos. Gerencie seu fluxo de caixa, estoque, contas e muito mais em um só lugar.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <a href="/cadastro" className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition">
            Começar gratuitamente
          </a>
          <a href="#funcionalidades" className="border-2 border-gray-200 text-gray-600 px-8 py-4 rounded-xl font-bold text-lg hover:border-green-600 hover:text-green-600 transition">
            Ver funcionalidades
          </a>
        </div>
        <p className="text-sm text-gray-400 mt-4">Sem cartão de crédito • Grátis por 14 dias</p>
      </section>

      {/* Stats */}
      <section className="bg-green-600 py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { num: '500+', label: 'Empresas ativas' },
            { num: 'R$ 2M+', label: 'Gerenciados' },
            { num: '99%', label: 'Satisfação' },
            { num: '24/7', label: 'Disponível' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-bold">{s.num}</p>
              <p className="text-green-100 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Por que escolher o FinFácil?</h3>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Desenvolvido especialmente para o pequeno e médio empreendedor brasileiro</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '💰', titulo: 'Fluxo de caixa completo', desc: 'Registre entradas e saídas, filtre por período e exporte relatórios em PDF e Excel com um clique.' },
            { icon: '📦', titulo: 'Controle de estoque', desc: 'Gerencie seus produtos, receba alertas de estoque baixo e vincule vendas ao estoque automaticamente.' },
            { icon: '📊', titulo: 'DRE automático', desc: 'Veja seu demonstrativo de resultado gerado automaticamente com margem de lucro em tempo real.' },
            { icon: '📅', titulo: 'Contas a pagar e receber', desc: 'Nunca mais esqueça um vencimento. Gerencie todas as suas contas com alertas de vencimento.' },
            { icon: '🎯', titulo: 'Metas financeiras', desc: 'Defina metas mensais de faturamento e acompanhe seu progresso com gráficos visuais.' },
            { icon: '📱', titulo: 'Funciona no celular', desc: 'Acesse de qualquer dispositivo. Sistema 100% responsivo, funciona no celular, tablet e computador.' },
          ].map(b => (
            <div key={b.titulo} className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition">
              <div className="text-4xl mb-4">{b.icon}</div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">{b.titulo}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="bg-gray-50 py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tudo que sua empresa precisa</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'Fluxo de caixa com entradas e saídas',
              'Controle de estoque com alertas',
              'Contas a pagar e receber',
              'Metas financeiras mensais',
              'DRE — Demonstrativo de Resultado',
              'Relatórios em PDF e Excel',
              'Gráficos de desempenho',
              'Busca global de lançamentos',
              'Venda vinculada ao estoque',
              'Margem de lucro automática',
              'Filtro por período',
              'Acesso pelo celular',
            ].map(f => (
              <div key={f} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                </div>
                <span className="text-gray-700 font-medium text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="py-20 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Preço simples e justo</h3>
          <p className="text-gray-500 text-lg">Sem taxas escondidas. Cancele quando quiser.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border-2 border-gray-200 rounded-2xl p-8">
            <h4 className="text-xl font-bold text-gray-800 mb-2">Gratuito</h4>
            <p className="text-4xl font-bold text-gray-900 mb-1">R$ 0</p>
            <p className="text-gray-400 text-sm mb-6">por 14 dias</p>
            <ul className="flex flex-col gap-3 mb-8">
              {['Fluxo de caixa','Controle de estoque','Contas a pagar/receber','Metas financeiras','Suporte por e-mail'].map(i => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500 font-bold">✓</span> {i}
                </li>
              ))}
            </ul>
            <a href="/cadastro" className="block text-center border-2 border-green-600 text-green-600 py-3 rounded-xl font-bold hover:bg-green-50 transition">
              Começar grátis
            </a>
          </div>

          <div className="border-2 border-green-600 rounded-2xl p-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-4 py-1 rounded-full">
              MAIS POPULAR
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">Profissional</h4>
            <p className="text-4xl font-bold text-gray-900 mb-1">R$ 99</p>
            <p className="text-gray-400 text-sm mb-6">por mês</p>
            <ul className="flex flex-col gap-3 mb-8">
              {[
                'Tudo do plano gratuito',
                'DRE automático',
                'Relatórios PDF e Excel',
                'Gráficos de desempenho',
                'Busca global',
                'Suporte prioritário',
                'Atualizações incluídas',
              ].map(i => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500 font-bold">✓</span> {i}
                </li>
              ))}
            </ul>
            <a href="/cadastro" className="block text-center bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition">
              Assinar agora
            </a>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="bg-gray-50 py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">O que nossos clientes dizem</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { nome: 'João Silva', empresa: 'Padaria do João', texto: 'Antes eu usava caderno para controlar o caixa. Agora sei exatamente quanto entrou e saiu todo dia. Recomendo muito!' },
              { nome: 'Maria Santos', empresa: 'Boutique da Maria', texto: 'O controle de estoque me salvou várias vezes. Agora recebo alertas quando o produto está acabando e nunca fico sem estoque.' },
              { nome: 'Carlos Oliveira', empresa: 'Auto Peças Oliveira', texto: 'Por R$ 99 por mês tenho tudo que preciso. Já tentei outros sistemas muito mais caros e complicados. O FinFácil é perfeito.' },
            ].map(d => (
              <div key={d.nome} className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{d.texto}"</p>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{d.nome}</p>
                  <p className="text-gray-400 text-xs">{d.empresa}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 md:px-8 text-center bg-green-600">
        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Pronto para organizar suas finanças?</h3>
        <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">Junte-se a centenas de empreendedores que já usam o FinFácil para crescer com mais controle.</p>
        <a href="/cadastro" className="inline-block bg-white text-green-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition">
          Criar conta gratuita agora
        </a>
        <p className="text-green-200 text-sm mt-4">14 dias grátis • Sem cartão de crédito</p>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h4 className="text-white font-bold text-xl">FinFácil</h4>
            <p className="text-sm mt-1">Gestão financeira para pequenas empresas</p>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="/landing#funcionalidades" className="hover:text-white">Funcionalidades</a>
            <a href="/landing#precos" className="hover:text-white">Preços</a>
            <a href="/cadastro" className="hover:text-white">Cadastrar</a>
            <a href="/" className="hover:text-white">Entrar</a>
          </div>
          <p className="text-xs">© 2026 FinFácil. Todos os direitos reservados.</p>
        </div>
      </footer>

    </main>
  )
}