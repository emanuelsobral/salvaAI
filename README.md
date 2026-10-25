# SalvaAI

Versão atual do AgentFinanceiro, com React, Vite, Firebase Authentication, Firestore. Gerencia receitas, despesas, contas, caixinhas, cartões parcelados, assinaturas e importação CSV/OFX e PDF com revisão manual, com dashboard e consultas automáticas sem IA.

## Estado atual — 25/10/2026

Esta documentação descreve o código desta atualização. **Publicado em 24/10/2026:** interface e arquivos OCR confirmados pela API da Netlify, com regras Firestore publicadas previamente. Validação visual e teste autenticado em produção permanecem pendentes. Consulte [publicação de 23/10/2026](docs/deploy-2026-10-23.md).

**Atualização local posterior ao deploy:** contratos em `/contratos`, com cadastro, edição, PDF com OCR opcional e revisão, além de compromissos de valor fixo após prévia e confirmação. Integração inicial em **100% dos quatro marcos locais**; isso não representa precisão de leitura nem conclusão do projeto inteiro. Ainda não publicado; exige publicar as novas regras Firestore antes da interface. [Roteiro e validação](docs/contratos-mvp.md) · [Piloto de OCR](docs/contratos-ocr-validacao.md).

### Status da ferramenta de contratos

**Implementação inicial: 100% (4/4 marcos). Publicação desta atualização: em andamento em 25/10/2026.** Este percentual mede as entregas implementadas, não a precisão da extração nem a conclusão de todo o SalvaAI.

| Função | Status e comportamento |
|---|---|
| Cadastro e edição | Concluídos. Dados por usuário, campos opcionais e proteção contra edição desatualizada. |
| Compromissos financeiros | Concluídos para parcelas iguais, com prévia e confirmação. Salvar o contrato ou gerar compromissos não altera o saldo; o pagamento precisa ser registrado. |
| Leitura de PDF | Concluída nos formatos suportados, com sugestões para valor, parcelas, vencimento, vigência e reajuste; trechos e páginas disponíveis para revisão. |
| OCR de digitalizações | Concluído localmente, sem API paga ou envio do original. A transcrição pode conter erros e é identificada como OCR. |
| Precisão e avaliação | Ainda não medidas com gabarito independente. Campos ausentes ou ambíguos ficam vazios, sem estimativas automáticas. |
| Ainda pendente | Reajustes automáticos, alterações de planos contratuais, encerramento do cadastro e armazenamento do PDF original. |

Para usar: **Contratos → Novo contrato** ou **Importar PDF**. Para digitalizações, marcar **Ler páginas digitalizadas (OCR)** antes de escolher o arquivo. Limites: **10 MB e 50 páginas**; conferir tudo no original antes de salvar. Depois, usar **Planejar compromissos** para revisar as datas e confirmar parcelas fixas.

Validações: **151 testes do aplicativo, seis de integração, testes no navegador e build aprovados**. O piloto OCR processou 74 páginas de dois documentos de desenvolvimento; isso não representa acerto dos cinco campos. [Detalhes da integração](docs/contratos-mvp.md) · [Relatório do OCR](docs/contratos-ocr-validacao.md).

### Demais funcionalidades e limites

| Área | Disponível no código atual | Limites conhecidos |
|---|---|---|
| Login e nuvem | Firebase Authentication e dados por usuário no Firestore. | Exige configuração do projeto, provedores/domínios autorizados e regras publicadas; não há modo offline completo. |
| Finanças | Receitas, despesas, transferências, caixinhas, compras parceladas, registros de pagamento/estorno e dashboard. | Não movimenta dinheiro no banco. Migração do SQLite antigo não é automática. |
| Recorrências | Contas semanais, mensais e anuais; vencimentos, atrasos, pagamento, encerramento e projeção de 12 meses. | Agendar uma conta não paga um boleto. Assinaturas antigas do cartão têm tratamento próprio. |
| Edição de recorrências | Altera valor, frequência e término a partir de uma data, com prévia e preservação do histórico. | Alterações que conflitam com pagamentos futuros são recusadas. |
| Conciliação | Sugere vínculos entre despesas do extrato e vencimentos, com confirmação; permite vincular/desvincular sem novo débito. | Não resolve automaticamente duplicidades já gravadas, pagamentos parciais ou valores divergentes. |
| CSV e OFX | Upload, escolha da conta, prévia, importação atômica e prevenção de duplicidades nos formatos suportados. | OFX bancário em reais; não cobre qualquer variante ou produto financeiro. Linhas CSV idênticas podem ser ambíguas. |
| PDF bancário | Leitura genérica, revisão de linhas e regras verificadas em amostras de Itaú e Nubank. | Não há garantia para todos os bancos/layouts. Data, valor, tipo e conta precisam de conferência. |
| OCR de extratos | Leitura opcional de uma página por vez no navegador, com motor e idioma servidos pelo próprio site. | Qualidade da imagem afeta o resultado; dados incertos exigem correção. Amostra BB validada, sem cobertura universal. |
| Assistente e resumo | Consultas locais de saldo, fatura, gastos, categorias e projeção, sem consumo de Gemini. | Não é conversa aberta com IA. A rota antiga `/api/ai` retorna 410; leitura de recibos por IA foi retirada. |
| Mobile | Interface responsiva e revisão de extratos conferida em larguras de 320 e 390 pixels. | Teste em celular físico foi adiado. Não há app nativo, PWA completa ou notificações com o app fechado. |
| Cadastro de contratos | Tela local para listar, criar e editar título, valores, prazos e condições, com dados por usuário e proteção contra edição desatualizada. | Ainda não publicado. Salvar o cadastro não gera parcelas; encerramento do contrato pendente. |
| Compromissos contratuais | Prévia e confirmação de parcelas iguais, vinculadas a vencimentos, pagamentos, estorno e projeção existentes. | Um plano fixo por contrato; sem interpretar cláusulas, calcular juros/reajustes ou identificar contas equivalentes já cadastradas. Geração não altera saldo. |
| Extração de contratos | PDF com texto e OCR opcional de digitalizações, com sugestões para cinco campos, evidências por página, correção e confirmação antes de salvar. Regras locais 0.1.25; protótipo de terminal preservado. | Ainda não publicado. Até 10 MB/50 páginas, sem senha. Leitor inicial de cerca de 12 MB e recursos adicionais de OCR. Transcrições podem conter erros; sem garantia de identificação de todos os campos ou avaliação independente. |

As conferências de PDF/OCR cobrem amostras específicas, não uma taxa geral de acerto. Transferências próprias, resgates e pagamentos de cartão presentes no extrato não são automaticamente vinculados às outras operações do aplicativo. Reveja o saldo inicial para não somar novamente um período já contabilizado.

### Atualizações acumuladas para esta publicação

Desde a base de código `2b26e97` (14/09/2026), esta entrega reúne:

- Substituição do chat e insights Gemini por consultas locais; bloqueio do endpoint antigo sem chamada ao provedor.
- Importação CSV/OFX com escolha da conta, conferência, atomicidade e prevenção de duplicidades.
- Recorrências por calendário, edição com data de vigência e conciliação de pagamentos com extratos.
- Importação PDF com revisão manual, reconhecimento dos layouts amostrados e OCR local opcional.
- Melhorias na revisão em telas pequenas, cancelamento e descarte de resultados de arquivos anteriores.
- Experimento de contratos, protocolo, comparador e regras até 0.1.25, separados do aplicativo publicado.
- Guias de uso, limitações, validações e Kanban. Os documentos recebidos no GitHub até `45f3abb` foram preservados.

A Netlify confirmou que a versão anterior em produção era o commit `45f3abb`, publicado em 21/09/2026. A comparação com `2b26e97` inclui a mesma base funcional e a documentação remota acrescentada depois. O histórico detalhado está no [changelog](docs/CHANGELOG.md).

### Ainda não disponível

Open Finance/sincronização direta com bancos, pagamento real de contas/boletos, leitura universal de extratos/contratos, reajustes contratuais automáticos, migração automática do legado, backup/restauração completo, aplicativo nativo e uso offline completo. Os próximos passos estão no [Kanban](docs/kanban.md).

## Documentação

- [Índice completo](docs/README.md)
- [Kanban — próximos passos e andamento](docs/kanban.md)
- [Contratos — cadastro manual e roteiro de integração](docs/contratos-mvp.md)
- [Experimento de contratos — protocolo e formato do JSON](experiments/contracts/README.md)
- [Mudanças do antigo para o novo](docs/evolucao-antigo-novo.md)
- [Arquitetura e funções](docs/arquitetura-salva-ai.md)
- [Regras financeiras](docs/regras-financeiras.md)
- [Dados e migração](docs/migracao-de-dados.md)
- [Operação e testes](docs/operacao-e-testes.md)
- [Changelog](docs/CHANGELOG.md) e [pendências](docs/pendencias.md)

## Importação de extratos

Upload de CSV, OFX bancário em reais e PDF com revisão obrigatória, prévia e escolha da conta de destino. Para páginas sem texto legível, há OCR local opcional. Veja os formatos, limites e regras contra duplicidades no [guia de importação](docs/importacao-extratos.md).

## Contas recorrentes

Use **Editar recorrência** para ajustar valor, frequência e término a partir de uma data, com prévia antes/depois e histórico preservado. Veja [edição de recorrências](docs/edicao-recorrencias.md).

Durante a importação, revise as correspondências com contas recorrentes para evitar repetir pagamentos já registrados. Lançamentos já importados podem ser vinculados pela tela de recorrências sem alterar o saldo. Consulte [conciliação de extratos](docs/conciliacao-extratos.md), incluindo a atualização necessária das regras Firestore antes do deploy.

Cadastre contas semanais, mensais ou anuais com primeiro vencimento e término opcional. Acompanhe pendências e atrasos, registre pagamentos na conta corrente e consulte a projeção de 12 meses. As assinaturas antigas continuam na fatura do cartão. Veja [como usar e as regras de pagamento](docs/contas-recorrentes.md).

## Desenvolvimento local

Ambiente validado: Node.js 24.11.1 e Java 25.0.1 para o emulador. Dentro de `salva-ai/`:

```powershell
npm ci
Copy-Item .env.example .env.local
# Preencha as variáveis Firebase antes de iniciar. Não sobrescreva um .env.local existente.
npm run dev
```

Abrir o endereço informado pelo Vite. A interface usa a configuração Firebase das variáveis `VITE_FIREBASE_*` em `.env.local`; iniciar desenvolvimento não conecta o app automaticamente ao emulador. Habilitar provedores de login e domínios no projeto Firebase correspondente.

O inicializador `Run_AgentFinanceiro.bat` da raiz pertence ao sistema antigo.

## Operação sem IA — 09/10/2026

O resumo financeiro e o assistente usam cálculos e respostas locais. Não há consumo da API Gemini. O assistente consulta saldo, fatura, gastos do período, maior categoria e projeção; saudações e ajuda não consultam o banco. Perguntas fora dessas consultas recebem uma explicação dos limites.

A leitura de recibos por IA foi retirada da interface; o preenchimento manual e o CSV continuam disponíveis. A rota `/api/ai` retorna HTTP 410 sem chamar o provedor, tanto no Vite quanto na Netlify. Não é necessário configurar `GEMINI_API_KEY`. As variáveis Firebase continuam necessárias para login e dados em nuvem. Consulte [operação sem IA](docs/sem-ia.md).

## Verificar e compilar

```powershell
npm test
npm run lint
npm run build
npm run preview
```

Integração com Java instalado e porta 8080 disponível:

```powershell
$env:FIREBASE_EMULATORS_PATH = Join-Path (Get-Location).Path '.firebase-emulators'
npm run test:firebase
```

Os testes usam `demo-salva-ai`; o primeiro uso pode baixar o emulador. O [guia de operação](docs/operacao-e-testes.md) explica configuração e alternativa para npm com instalação quebrada no Windows.

## Validação desta atualização

Contratos e compromissos, em 24/10/2026: **141 testes do aplicativo, cinco testes no emulador e teste visual com cadastro, edição, prévia, confirmação e pagamento aprovados**. Formulário e prévia conferidos em 320/390 pixels; build aprovado. Validação local, sem publicação destas funcionalidades. [Detalhes](docs/contratos-mvp.md).

Em 23/10/2026: **129 testes do aplicativo e dois testes de integração no emulador Firestore aprovados**; build de produção aprovado; lint sem erros e com cinco avisos conhecidos. O build ainda emite aviso de tamanho de pacote. Os testes usam dados fictícios e não lançam operações em contas reais.

O experimento separado de contratos tem **327 testes aprovados** na última rodada (300 Python e 27 Node), com 18 saídas verificadas. Duas leituras de PDF continuam falhando por ausência de texto. Isso não mede precisão em contratos reais nem integra a extração à interface.

Progresso do experimento original: **29% (2/7 etapas formais)**; entrega técnica 0.1.25 concluída. Esse percentual não representa a conclusão global do SalvaAI. A anotação e a avaliação independentes permanecem pendentes.

## Configuração e Git

Consulte [configuração por ambiente e preparação para Git](docs/configuracao-e-git.md). A configuração anterior foi preservada em `.env.local`, ignorado pelo Git. Em novas cópias, preencha o exemplo antes de iniciar ou compilar.

## Publicação

A configuração de hospedagem está em `netlify.toml`: Node 24, build `npm run build`, pasta `dist`, função `/api/ai` desativada e fallback para as rotas da interface. Configure as variáveis `VITE_FIREBASE_*` no ambiente de build da Netlify; não é necessário fornecer chave Gemini.

As alterações de conciliação incluem novas regras em `firestore.rules`. Antes de publicar a interface, autentique a CLI Firebase e publique somente as regras no projeto correto. O envio do código ao GitHub só publica o site automaticamente se o repositório estiver conectado ao deploy da Netlify; confirme o resultado no registro de publicação.

Arquivos `.env.local`, credenciais, extratos/contratos reais, saídas de processamento e backups ficam fora do Git. O diretório `experiments/contracts/` contém o protótipo e a documentação; seus dados privados e rodadas são ignorados.
