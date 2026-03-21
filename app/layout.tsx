import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <title>FinFácil — Gestão financeira para pequenas empresas</title>
        <meta name="description" content="Controle seu fluxo de caixa, estoque, contas e muito mais." />
      </head>
      <body>{children}</body>
    </html>
  );
}