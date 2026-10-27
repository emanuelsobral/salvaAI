# SalvaAI

O SalvaAI é um projeto pessoal de gestão financeira, desenvolvido com React, Vite e Firebase. Permite registrar receitas e despesas, acompanhar cartões e contas recorrentes, importar extratos e organizar compromissos de contratos.

[Acessar o SalvaAI](https://salvaaifinc.netlify.app)

## O que está disponível

| Recurso | Como funciona |
|---|---|
| Contas e caixinhas | Registra saldos, receitas, despesas, aportes e estornos. |
| Cartões | Organiza compras parceladas, faturas e pagamentos registrados pelo usuário. |
| Contas recorrentes | Calcula vencimentos semanais, mensais e anuais, com edição a partir de uma data e histórico preservado. |
| Extratos | Importa CSV, OFX bancário em reais e PDF. Você escolhe a conta e confere os lançamentos antes de confirmar. |
| Conciliação | Liga despesas importadas a vencimentos, com confirmação, para evitar registrar o mesmo pagamento duas vezes. |
| Contratos | Cadastra valores e condições, sugere cinco campos a partir de PDF ou OCR e gera parcelas iguais após revisão. Permite reajustar valores e encerrar o cadastro com prévia e confirmação. |
| Dashboard e assistente | Consulta saldo, fatura, gastos, categorias e projeção de 12 meses com cálculos locais. |

Login e dados em nuvem usam Firebase Authentication e Firestore. O assistente e a leitura de documentos funcionam sem APIs de IA ou chave Gemini. O aplicativo registra as operações informadas pelo usuário; não movimenta dinheiro em bancos nem paga boletos.

## Guias de uso

- [Documentação](docs/README.md)
- [Saldos, cartões e projeções](docs/financas.md)
- [Importação de extratos](docs/importacao-extratos.md)
- [Contas recorrentes](docs/contas-recorrentes.md)
- [Edição de recorrências](docs/edicao-recorrencias.md)
- [Conciliação com extratos](docs/conciliacao-extratos.md)
- [Cadastro e leitura de contratos](docs/contratos.md)

## Limitações atuais

A importação de PDF oferece leitura genérica e revisão manual. Foram conferidas amostras de Itaú, Nubank e Banco do Brasil, mas outros layouts podem exigir correções. Não há garantia de leitura automática de todos os bancos.

Contratos aceitam PDF sem senha de até 10 MB e 50 páginas. A extração sugere valor da parcela, quantidade de parcelas, vencimento, vigência e reajuste. Campos ausentes ou ambíguos ficam vazios. O OCR pode errar caracteres, valores e datas; confira o documento original antes de salvar. A precisão em contratos reais ainda não foi medida com gabarito independente.

Cada contrato pode ter um plano de parcelas inicialmente iguais. O [reajuste manual com prévia](docs/contratos.md#reajustar-parcelas) aplica um valor ou percentual às parcelas futuras. O [encerramento do cadastro](docs/contratos.md#encerrar-o-cadastro-de-contrato) cancela as parcelas futuras sem pagamento e preserva o histórico. Consulta automática de índices, mudanças no calendário do plano, exclusão, reabertura e armazenamento do PDF original continuam pendentes.

A interface se adapta a telas pequenas, mas o teste em celular físico permanece pendente. Também faltam aplicativo nativo, PWA completa, notificações com o app fechado e modo offline completo. Não há Open Finance, sincronização direta com bancos, migração automática do SQLite antigo ou backup e restauração completos.

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

Em 27/10/2026, foi corrigido um falso aviso de alteração em outra tela que bloqueava reajustes seguintes e podia impedir o encerramento. A comparação agora reconhece os mesmos dados mesmo quando o Firebase devolve os campos em outra ordem. Alterações reais continuam exigindo uma nova conferência. A correção passou nos 170 testes do aplicativo, nos oito de integração e no build; a conferência dessa correção no site publicado ainda está pendente.

## Publicar na Netlify

O arquivo `netlify.toml` configura Node 24, o build `npm run build`, a pasta de saída `dist` e o fallback das rotas da interface.

1. Configure as variáveis `VITE_FIREBASE_*` no ambiente de build.
2. Autorize o domínio publicado no Firebase Authentication.
3. Autentique a CLI Firebase e publique as regras de `firestore.rules` no projeto correto antes da interface.
4. Publique o build e confira o resultado na Netlify. O envio ao GitHub só aciona o deploy se o repositório estiver conectado à hospedagem.

Variáveis alteradas depois do build exigem nova compilação. A rota antiga `/api/ai` retorna HTTP 410 no Vite e na Netlify, sem consultar o provedor; as variáveis Gemini são dispensáveis.

## Extrator de terminal

O repositório também contém o [extrator local de contratos](experiments/contracts/README.md), com saída JSON e execução pelo terminal. O aplicativo reutiliza suas regras, mas usa um leitor de PDF diferente; os resultados podem variar.

## Arquivos locais

Credenciais, `.env.local`, extratos e contratos reais, saídas de processamento e backups ficam fora do Git. A documentação interna de planejamento e acompanhamento também é ignorada. Os guias públicos estão no [índice da documentação](docs/README.md).
