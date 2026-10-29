# SalvaAI

O SalvaAI é um projeto pessoal de gestão financeira, desenvolvido com React, Vite e Firebase. Permite registrar receitas e despesas, acompanhar cartões e contas recorrentes, importar extratos e organizar compromissos de contratos.

[Acessar o SalvaAI](https://salvaaifinc.netlify.app)

## O que está disponível

| Recurso | Como funciona |
|---|---|
| Contas e caixinhas | Registra saldos, receitas, despesas, aportes e estornos. |
| Cartões | Organiza compras parceladas, faturas e pagamentos registrados pelo usuário. |
| Contas recorrentes | Calcula vencimentos semanais, mensais e anuais, com edição a partir de uma data e histórico preservado. |
| Agenda de contas | Reúne vencimentos por semana ou mês, com filtros, total pendente e registro de pagamento ou vínculo com extrato. Usa as recorrências e parcelas de contratos existentes. |
| Extratos | Importa CSV, OFX bancário em reais e PDF. Você escolhe a conta e confere os lançamentos antes de confirmar. |
| Conciliação | Liga despesas importadas a vencimentos, com confirmação, para evitar registrar o mesmo pagamento duas vezes. |
| Contratos | Cadastra valores e condições, sugere cinco campos a partir de PDF ou OCR e gera parcelas iguais após revisão. Permite reajustar valores e encerrar o cadastro com prévia e confirmação. |
| Dashboard e assistente | Mantém as consultas locais e oferece perguntas livres com DeepSeek, usando um resumo do painel. Sem notícias ou cotações em tempo real. |

Login e dados em nuvem usam Firebase Authentication e Firestore. A integração opcional com DeepSeek acrescenta OCR de contratos, ajuda na leitura de extratos incompletos e chat de análises financeiras. As consultas locais continuam disponíveis. O aplicativo registra as operações informadas pelo usuário; não movimenta dinheiro em bancos nem paga boletos.

A integração DeepSeek foi publicada em 29/10/2026. Chat, OCR de contrato e ajuda na leitura de extrato responderam pelo site com uma conta temporária e dados fictícios. No extrato, data e valor foram lidos, mas a indicação de entrada ou saída ficou em branco para revisão. Esses testes confirmam a conexão e os exemplos conferidos; não medem a precisão em documentos reais.

## Guias de uso

- [Documentação](docs/README.md)
- [Saldos, cartões e projeções](docs/financas.md)
- [Importação de extratos](docs/importacao-extratos.md)
- [Contas recorrentes](docs/contas-recorrentes.md)
- [Agenda de contas](docs/agenda.md)
- [Edição de recorrências](docs/edicao-recorrencias.md)
- [Conciliação com extratos](docs/conciliacao-extratos.md)
- [Cadastro e leitura de contratos](docs/contratos.md)

## Limitações atuais

A importação de PDF oferece leitura genérica e revisão manual. Foram conferidas amostras de Itaú, Nubank e Banco do Brasil, mas outros layouts podem exigir correções. Não há garantia de leitura automática de todos os bancos.

Contratos aceitam PDF sem senha de até 10 MB: 50 páginas na leitura local ou 10 no OCR com DeepSeek. A extração sugere valor da parcela, quantidade de parcelas, vencimento, vigência e reajuste. Campos ausentes ou ambíguos ficam vazios. O OCR pode errar caracteres, valores e datas; confira o documento original antes de salvar. A precisão em contratos reais ainda não foi medida com gabarito independente.

Cada contrato pode ter um plano de parcelas inicialmente iguais. O [reajuste manual com prévia](docs/contratos.md#reajustar-parcelas) aplica um valor ou percentual às parcelas futuras. O [encerramento do cadastro](docs/contratos.md#encerrar-o-cadastro-de-contrato) cancela as parcelas futuras sem pagamento e preserva o histórico. Consulta automática de índices, mudanças no calendário do plano, exclusão, reabertura e armazenamento do PDF original continuam pendentes.

A interface se adapta a telas pequenas, mas o teste em celular físico permanece pendente. Também faltam aplicativo nativo, PWA completa, notificações com o app fechado e modo offline completo. Não há Open Finance, sincronização direta com bancos ou migração automática do SQLite antigo. O [backup de documentos do Firestore](scripts/backup/README.md) pode ser exportado com criptografia e restaurado para conferência em um emulador local. Recuperação de logins, armazenamento externo, agendamento e restauração em produção continuam pendentes.

## Executar localmente

O ambiente foi validado com Node.js 24.11.1. Para os testes do emulador, foi usado Java 25.0.1.

Na raiz do repositório:

```powershell
npm ci
Copy-Item .env.example .env.local
```

Não sobrescreva um `.env.local` já preenchido. Complete o arquivo com a configuração Web do seu projeto Firebase:

| Variável | Uso |
|---|---|
| `VITE_FIREBASE_API_KEY` | Chave pública do aplicativo Web |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação |
| `VITE_FIREBASE_PROJECT_ID` | Identificador do projeto |
| `VITE_FIREBASE_APP_ID` | Identificador do aplicativo Web |
| `VITE_FIREBASE_STORAGE_BUCKET` | Opcional para os serviços atuais |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Opcional para os serviços atuais |

Habilite os provedores de login desejados, autorize o domínio e configure o Firestore com as regras da aplicação. As variáveis `VITE_*` ficam visíveis no navegador; não use esse prefixo para credenciais privadas. O acesso aos dados depende da autenticação e das regras publicadas.

```powershell
npm run dev
```

Abra o endereço informado pelo Vite. Abrir `index.html` diretamente pelo sistema de arquivos não funciona. Reinicie o Vite depois de mudar as variáveis.

O servidor de desenvolvimento usa o Firebase de `.env.local`; ele não conecta a interface automaticamente ao emulador. O inicializador `Run_AgentFinanceiro.bat` pertence à versão antiga, que fica fora deste repositório.

## Testar e compilar

```powershell
npm test
npm run lint
npm run build
npm run preview
```

Para os testes de integração, instale o Java e deixe a porta 8080 livre:

```powershell
$env:FIREBASE_EMULATORS_PATH = Join-Path (Get-Location).Path '.firebase-emulators'
npm run test:firebase
```

Esses testes usam o projeto fictício `demo-salva-ai`. O emulador pode ser baixado na primeira execução. `npm run preview` serve o build localmente, sem publicar o site.

Na validação da integração de contratos, passaram 151 testes do aplicativo, seis de integração, o build e os testes no navegador. Em 26/10/2026, cadastro, edição, PDF/OCR e prévia também passaram em produção com uma conta temporária, removida depois. Confirmação de planos, pagamento e estorno foram verificados no emulador. Esses testes funcionais não medem a precisão da extração em contratos reais.

A atualização de reajustes passou em 159 testes do aplicativo e sete de integração com o Firestore. No navegador, foram conferidos reajustes por valor e percentual, conflito entre telas, histórico após recarga e pagamento com o valor atualizado, em larguras de 320, 390 e 1280 pixels. Essa rodada usou dados fictícios no emulador local.

Com o encerramento, a suíte passou a 167 testes do aplicativo e oito de integração, todos aprovados, além do build. O fluxo no navegador foi conferido nas mesmas larguras: contratos com e sem plano, prévia, cancelamento sem salvar, preservação de pagamento antecipado, bloqueio de edição do contrato encerrado e pagamento de pendência preservada. Os testes usaram o emulador local, sem alterar dados de produção.

Em 27/10/2026, foi corrigido um falso aviso de alteração em outra tela que bloqueava reajustes seguintes e podia impedir o encerramento. A comparação agora reconhece os mesmos dados mesmo quando o Firebase devolve os campos em outra ordem. Alterações reais continuam exigindo uma nova conferência. A correção passou nos 170 testes do aplicativo, nos oito de integração e no build.

No site publicado, foram confirmados um plano, dois reajustes seguidos e o encerramento de contratos com e sem plano. O pagamento antecipado foi preservado, as parcelas futuras sem pagamento foram canceladas e a parcela do dia continuou disponível para pagamento após o encerramento. A tentativa de editar o contrato encerrado por outra aba foi bloqueada. A prévia foi conferida em larguras de 320, 390 e 1280 pixels, sem teste em celular físico. Não houve erros JavaScript; a conta temporária e seus 15 registros fictícios foram removidos, com ausência verificada.

Em 29/10/2026, a integração DeepSeek passou nos 197 testes locais do aplicativo, nos oito de integração com Firestore e nos fluxos de navegador com respostas simuladas. Foram conferidos chat, origem da transcrição de contratos, ajuda em extratos incompletos, preservação das linhas locais e cancelamento. Após a liberação dos créditos, os três fluxos também responderam em chamadas reais à API com exemplos fictícios. O contrato retornou aluguel de R$ 120,00 e vencimento no dia 10; os demais campos permaneceram vazios. O extrato retornou uma saída de R$ 25,50 em 01/10/2026 e excluiu o saldo final. O chat recebeu definições dos totais do painel para distinguir saldo atual, compromissos e gastos por competência; a resposta conferida respeitou essa distinção. A suíte de 197 testes passou novamente após esse ajuste.

Na publicação de 29/10/2026, a agenda passou a recusar resultados vindos apenas do cache quando precisa confirmar os vencimentos no servidor. Isso evita mostrar zero contas após uma falha de conexão. Os 199 testes do aplicativo, o build e o teste de recuperação da agenda no navegador passaram. As regras do Firestore e a interface foram publicadas, e as variáveis de produção foram configuradas na Netlify.

Na conferência do site, a rota de IA recusou chamadas sem autenticação e respondeu às três chamadas autenticadas. O chat respondeu à pergunta; o OCR transcreveu o aluguel de R$ 120,00 e o vencimento no dia 10. A ajuda de extrato retornou uma movimentação de R$ 25,50 em 01/10/2026, sem importar o saldo final, mas não identificou a direção da movimentação. A linha permanece desmarcada e exige revisão antes de confirmar. A conta temporária foi removida; nenhum lançamento financeiro foi gravado nesse teste.

## Publicar na Netlify

Para cópias dos dados antes de uma manutenção, consulte o [guia de backup do Firestore](scripts/backup/README.md). A ferramenta passou em onze testes específicos e em um ensaio com o emulador, incluindo contratos, pagamentos, saldos, tipos de dados e documentos sem pai cadastrado. Na rodada do backup, a suíte do aplicativo tinha 181 testes aprovados. A recuperação completa de contas de acesso e do ambiente de produção ainda exige procedimentos separados.

O arquivo `netlify.toml` configura Node 24, o build `npm run build`, a pasta de saída `dist` e o fallback das rotas da interface.

1. Configure as variáveis `VITE_FIREBASE_*` no ambiente de build.
2. Autorize o domínio publicado no Firebase Authentication.
3. Autentique a CLI Firebase e publique as regras de `firestore.rules` no projeto correto antes da interface.
4. Publique o build e confira o resultado na Netlify. O envio ao GitHub só aciona o deploy se o repositório estiver conectado à hospedagem.

Variáveis alteradas depois do build exigem nova compilação. Para habilitar a IA, configure `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL=deepseek-flash`, `DEEPSEEK_VISION_MODEL=deepseek-flash` e `FIREBASE_PROJECT_ID` no contexto de produção da Netlify. Prefira o escopo Functions quando o plano permitir. No escopo padrão, essas variáveis também ficam acessíveis aos processos de build e pós-processamento; mantenha o acesso à hospedagem restrito. A chave nunca deve usar o prefixo `VITE_`. As variáveis Gemini não são usadas.

A rota `/api/ai` exige um token Firebase válido e limita as chamadas. Cada solicitação faz uma única tentativa, com prazo de 45 segundos no servidor. O limite em memória é de dez chamadas por usuário e sessenta por processo a cada minuto; a Netlify também limita chamadas por IP. Esses limites não equivalem a um orçamento diário global. Acompanhe os créditos na DeepSeek.

Publique as regras atualizadas do Firestore antes da interface: elas reconhecem a origem `PDF_DEEPSEEK_OCR_REVIEW`. Os trechos lidos pela IA ficam identificados como transcrição automática. Os campos e lançamentos continuam exigindo revisão. Consulte os detalhes de uso e envio de dados nos [contratos](docs/contratos.md) e na [importação de extratos](docs/importacao-extratos.md).

## Extrator de terminal

O repositório também contém o [extrator local de contratos](experiments/contracts/README.md), com saída JSON e execução pelo terminal. O aplicativo reutiliza suas regras, mas usa um leitor de PDF diferente; os resultados podem variar.

## Arquivos locais

Credenciais, `.env.local`, extratos e contratos reais, saídas de processamento e backups ficam fora do Git. A documentação interna de planejamento e acompanhamento também é ignorada. Os guias públicos estão no [índice da documentação](docs/README.md).
