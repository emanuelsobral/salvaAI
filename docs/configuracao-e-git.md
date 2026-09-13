# Configuração por ambiente e preparação para Git

## Desenvolvimento local

Em uma nova cópia do repositório, executar dentro da pasta da aplicação:

```powershell
npm ci
Copy-Item .env.example .env.local
```

Preencher `.env.local` com a configuração do aplicativo Web disponível nas configurações do projeto Firebase. Não sobrescrever um `.env.local` já preenchido. Nesta máquina, a configuração anterior foi preservada nesse arquivo automaticamente.

| Variável | Uso |
|---|---|
| `VITE_FIREBASE_API_KEY` | Chave pública do aplicativo Web |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação |
| `VITE_FIREBASE_PROJECT_ID` | Projeto Firestore e Firebase |
| `VITE_FIREBASE_APP_ID` | Identificação do aplicativo Web |
| `VITE_FIREBASE_STORAGE_BUCKET` | Opcional para os serviços atuais |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Opcional para os serviços atuais |
| `VITE_GEMINI_MODEL` | Modelo de IA; padrão definido no exemplo |

Executar `npm run dev` após preencher. Reiniciar o Vite quando mudar as variáveis. Configurações obrigatórias ausentes geram erro com os nomes das variáveis, sem imprimir seus valores. O build também rejeita configurações obrigatórias ausentes.

## Repositório e histórico

O repositório atual está em `salva-ai/`. O backend Python e o frontend antigo estão fora dele e não participam do build React.

Versionar `.env.example`, código, testes, configurações e lockfile. O `.gitignore` exclui `.env.local`, demais ambientes locais, dependências, build, caches, backups, bancos locais e intermediários da documentação Word. O DOCX final pode ser versionado; a pasta `docs/word-build/` é apenas material de geração e revisão.

```powershell
git status --short
git check-ignore .env.local
git diff --stat
```

O commit inicial já continha a configuração Firebase. A alteração atual não remove valores de commits anteriores. Não foi reescrito o histórico nem realizado push nesta revisão. O ignore também não remove arquivos que já estejam rastreados.

## Ambiente de build e hospedagem

Git armazena o código; a hospedagem executa e serve o build. No provedor escolhido, cadastrar as mesmas variáveis antes de compilar. Se o repositório contém diretamente esta pasta, usar sua raiz como diretório do projeto. Se um repositório futuro contiver o projeto inteiro, usar `salva-ai` como diretório da aplicação.

- Instalação reproduzível: `npm ci`.
- Build: `npm run build`.
- Pasta de saída: `dist`.
- Configurar fallback de rotas da SPA para `index.html`.
- Autorizar o domínio publicado no Firebase Authentication.
- Validar e publicar regras Firestore compatíveis com as coleções da aplicação.

Variáveis do processo de build têm prioridade sobre os arquivos de ambiente. Alterar variáveis depois do build exige compilar novamente. Não há configuração específica de hospedagem nem implantação executada por esta mudança. GitHub Pages, caso escolhido, exige definir a estratégia de rotas e o caminho base antes de publicar.

## Configuração pública e chaves privadas

Variáveis `VITE_*` são incorporadas ao JavaScript entregue ao navegador. Mover a configuração web do Firebase para ambiente remove valores fixos do código-fonte atual e permite trocar de projeto, mas não transforma esses valores em segredos. O acesso ao banco depende de Authentication e das regras Firestore.

A chave Gemini continua sendo fornecida individualmente em Configurar IA e armazenada no navegador por UID. Não existe chave Gemini fixa no código e não foi criada variável `VITE_GEMINI_API_KEY`. Credenciais Firebase Admin, contas de serviço e chaves privadas devem permanecer em um backend, nunca no bundle do navegador.

## Validação desta mudança

18 testes locais aprovados, incluindo configuração ausente e troca de projeto. Build aprovado com configuração local. Lint sem erros, com os mesmos 5 avisos React anteriores. A integração com emulador registrada na revisão anterior não foi reexecutada nesta alteração de configuração.

O documento Word anterior registra a revisão financeira; este guia complementa aquela fotografia com a preparação posterior do ambiente e do Git.
