# Interface mobile

Atualização de 14/09/2026.

- Cabeçalho compacto com marca e botão de menu; navegação lateral com fechamento explícito, Escape e contenção do foco pelo teclado.
- Botões de tema e configurações acessíveis por teclado; configurar IA fecha o menu antes de abrir o formulário.
- Nova transação em destaque, seguida de importação CSV e compra no cartão.
- Saldos organizados em duas colunas; fatura com valor e ações empilhados em telas pequenas.
- Histórico e últimas movimentações apresentados como cartões abaixo de 600 pixels, preservando descrição, data, conta, valor e ação de exclusão.
- Formulários com altura limitada à área visível, rolagem interna e controles adequados ao toque.
- Chat e projeção adaptados à altura dinâmica da tela; suporte às áreas seguras e à preferência por movimento reduzido.
- Conselheiro de IA posicionado após os indicadores financeiros, priorizando saldos e compromissos.

## Validação

Verificação no navegador Chromium do Edge com dados fictícios e serviços interceptados apenas no teste, sem acesso ao Firebase ou Gemini de produção. Larguras verificadas: 320, 390, 430, 768 e 1280 pixels. Foram conferidos overflow horizontal, menu/Escape, histórico, configurações de IA, chat, temas claro/escuro e alcance do botão de salvar em 320 × 480.

Build aprovado e lint sem erros, mantendo 5 avisos anteriores. A simulação de viewport não substitui testes em aparelhos reais, especialmente teclado virtual e Safari no iOS. Arquivos e capturas de revisão ficam em `.mobile-qa/`, ignorado pelo Git.
