# SalvaAI

Versão atual do AgentFinanceiro, com React, Vite, Firebase Authentication, Firestore e Gemini. Gerencia receitas, despesas, contas, caixinhas, cartões parcelados, assinaturas e CSV, com dashboard e assistência por IA.

## Documentação

- [Índice completo](docs/README.md)
- [Mudanças do antigo para o novo](docs/evolucao-antigo-novo.md)
- [Arquitetura e funções](docs/arquitetura-salva-ai.md)
- [Regras financeiras](docs/regras-financeiras.md)
- [Dados e migração](docs/migracao-de-dados.md)
- [Operação e testes](docs/operacao-e-testes.md)
- [Changelog](docs/CHANGELOG.md) e [pendências](docs/pendencias.md)

## Desenvolvimento

Ambiente validado: Node.js 24.11.1 e Java 25.0.1 para o emulador. Dentro de `salva-ai/`:

```powershell
npm ci
npm run dev
```

Abrir o endereço informado pelo Vite. A interface usa a configuração Firebase das variáveis `VITE_FIREBASE_*` em `.env.local`; iniciar desenvolvimento não conecta o app automaticamente ao emulador. Habilitar provedores de login e domínios no projeto Firebase correspondente.

O inicializador `Run_AgentFinanceiro.bat` da raiz pertence ao sistema antigo.

## Configurar IA

Após login, abrir **Configurar IA** e informar a chave Gemini. Ela fica no navegador por UID; salvar vazio remove a configuração. Esse armazenamento não é um cofre de segredos.

Modelo padrão: `gemini-2.5-flash`. Para alterar, ajustar `VITE_GEMINI_MODEL` no `.env.local` existente e reiniciar Vite. Não colocar chaves secretas em variáveis `VITE_*`.

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

## Estado da revisão de 13/09/2026

16 testes locais e 2 com emulador aprovados; build aprovado; lint sem erros, com 5 avisos. Não foram executados migração real, publicação de regras, implantação, chamada real ao Gemini ou teste visual completo.

Pagamentos são registros internos, sem transação bancária real. Dados do SQLite não aparecem automaticamente no Firestore; seguir o plano de migração.

## Configuração e Git

Consulte [configuração por ambiente e preparação para Git](docs/configuracao-e-git.md). A configuração anterior foi preservada em `.env.local`, ignorado pelo Git. Em novas cópias, preencha o exemplo antes de iniciar ou compilar.

