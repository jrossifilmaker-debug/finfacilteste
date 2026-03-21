export default function Termos() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 md:px-8 py-4 flex justify-between items-center">
        <a href="/landing" className="text-2xl font-bold text-green-600">FinFácil</a>
        <a href="/" className="text-sm text-gray-500 hover:text-green-600">Voltar ao login</a>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso e Política de Privacidade</h1>
        <p className="text-gray-400 text-sm mb-8">Última atualização: março de 2026</p>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col gap-8 text-gray-600 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">1. Aceitação dos termos</h2>
            <p>Ao criar uma conta e utilizar o FinFácil, você concorda com estes Termos de Uso e nossa Política de Privacidade. Caso não concorde, não utilize o serviço.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">2. Descrição do serviço</h2>
            <p>O FinFácil é uma plataforma de gestão financeira para pequenas e médias empresas, oferecendo controle de fluxo de caixa, estoque, contas a pagar e receber, metas financeiras e relatórios gerenciais.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">3. Cadastro e conta</h2>
            <p>Você é responsável por manter a confidencialidade de suas credenciais de acesso. Você concorda em notificar imediatamente o FinFácil sobre qualquer uso não autorizado de sua conta. O FinFácil não será responsável por perdas decorrentes do uso não autorizado de sua conta.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">4. Planos e pagamentos</h2>
            <p>O FinFácil oferece um período de teste gratuito de 14 dias. Após esse período, é necessária a assinatura de um plano pago. Os valores estão disponíveis na página de preços. O cancelamento pode ser feito a qualquer momento, sem multa.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">5. Proteção de dados (LGPD)</h2>
            <p>O FinFácil está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Coletamos apenas os dados necessários para a prestação do serviço. Seus dados nunca serão vendidos ou compartilhados com terceiros sem sua autorização.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">6. Dados coletados</h2>
            <p>Coletamos as seguintes informações:</p>
            <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
              <li>Nome e e-mail para criação de conta</li>
              <li>Dados financeiros inseridos na plataforma (fluxo de caixa, estoque, contas)</li>
              <li>Dados de uso para melhorar o serviço</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">7. Segurança dos dados</h2>
            <p>Utilizamos criptografia e infraestrutura de nível empresarial para proteger seus dados. Os dados são armazenados em servidores seguros com backup automático. Cada empresa acessa apenas seus próprios dados.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">8. Seus direitos</h2>
            <p>Você tem direito a:</p>
            <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incorretos</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Exportar seus dados a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">9. Limitação de responsabilidade</h2>
            <p>O FinFácil é uma ferramenta de apoio à gestão financeira e não substitui a consultoria de um contador ou profissional financeiro. Não nos responsabilizamos por decisões tomadas com base nas informações do sistema.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">10. Contato</h2>
            <p>Para dúvidas sobre estes termos ou sobre o tratamento de seus dados, entre em contato pelo e-mail: <strong className="text-green-600">contato@finfacil.com.br</strong></p>
          </section>

        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm mt-12">
        <p>© 2026 FinFácil. Todos os direitos reservados.</p>
      </footer>
    </main>
  )
}