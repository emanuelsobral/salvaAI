# Operação, configuração e testes

[Índice](README.md) · [README da aplicação](../salva-ai/README.md) · [Validação registrada](CHANGELOG.md)

## 1. Ambiente validado

- Windows / PowerShell.
- Node.js **24.11.1**.
- Java **25.0.1** para o emulador instalado nesta revisão.
- Dependências declaradas em [package.json](../salva-ai/package.json), com resolução registrada em `package-lock.json`.

Essas versões descrevem o ambiente testado, não uma matriz de compatibilidade com outros sistemas.

## 2. Executar a versão atual

Na raiz do projeto:

```powershell
Set-Location .\salva-ai
npm ci
npm run dev
```

Abrir a URL que o Vite informar. A configuração padrão utiliza normalmente a porta 5173, mas pode selecionar outra porta disponível.

**O aplicativo de desenvolvimento usa o Firebase configurado em `src/services/firebase.js`.** Executar `npm run dev` não troca o app automaticamente para o emulador. Nesta rodada, os testes injetam o banco de demonstração; a interface continua com sua configuração Firebase normal.

Para preparar a saída estática e visualizar o resultado localmente:

```powershell
npm run build
npm run preview
```

`preview` não publica a aplicação. `dist/` é recriado pelo build. Não abrir o HTML do React diretamente como `file://`; usar Vite ou servidor HTTP configurado para a aplicação.

## 3. Firebase e identidade

O arquivo `src/services/firebase.js` inicializa o aplicativo, Auth, Firestore e provedor Google. O console do projeto precisa ter os provedores desejados habilitados, domínio autorizado e Firestore disponível.

O objeto público de configuração do Firebase não substitui autorização. A proteção dos dados depende das regras publicadas; esconder rotas no React não protege o banco.

As regras locais:

- Exigem que `request.auth.uid` corresponda ao UID do caminho.
- Validam tipos/limites básicos de contas, transações, parcelas e assinaturas.
- Conferem a referência de conta em novas transações.
- Impedem alteração/exclusão dos marcadores de operação e importação.
- Negam caminhos sem regra correspondente.

**Limite:** elas não comprovam todos os invariantes contábeis de um proprietário que escreva diretamente pelo SDK. As regras permitem ao dono atualizar seus próprios saldos e excluir registros autorizados. As operações atômicas e estornos completos estão implementados nos serviços da aplicação. Proteção contábil contra clientes modificados exigirá regras adicionais ou operações em backend confiável.

As regras foram testadas no emulador, mas não publicadas em produção. Antes de publicar, comparar com as regras já existentes, validar documentos legados em homologação e verificar acesso às novas coleções `invoices`, `operations` e `importRows`.

## 4. Gemini

O modelo padrão do código é `gemini-2.5-flash`; ele pode ser configurado por `VITE_GEMINI_MODEL`. A disponibilidade desse modelo foi conferida na [tabela oficial de modelos e desativações](https://ai.google.dev/gemini-api/docs/deprecations) em 13/09/2026. O antigo `gemini-1.5-flash` foi encerrado, conforme o [changelog oficial](https://ai.google.dev/gemini-api/docs/changelog#september-29-2025).

```powershell
Copy-Item .env.example .env.local
```

Editar `.env.local` apenas se for alterar o modelo e reiniciar o Vite. Variáveis `VITE_*` são incorporadas ao código do navegador; não colocar chaves secretas nelas.

Após o login, usar **Configurar IA** no menu. A chave fica em `localStorage` sob `salva_ai_gemini_key:{uid}`. Salvar vazio remove a chave daquele usuário. A configuração antiga precisa ser informada novamente, pois a entrada global deixou de ser usada.

Separação por UID evita reaproveitamento automático entre contas da aplicação, mas não é criptografia nem um cofre: scripts da mesma origem e acesso ao perfil do navegador podem ler o armazenamento. Resumos financeiros, perguntas e imagens selecionadas são enviados ao Google quando o usuário aciona os recursos. Não foi feita uma chamada real ao Gemini durante a validação desta rodada.

O SDK `@google/generative-ai` foi mantido. Sua modernização para a biblioteca recomendada atualmente fica registrada nas pendências; mudar o identificador do modelo não significa que o SDK inteiro foi migrado.

## 5. Testes locais

```powershell
npm test
npm run lint
npm run build
```

| Arquivo | Cobertura |
|---|---|
| `tests/financial.test.js` | Valores/datas, saldo e histórico atômicos, repetição, criação concorrente, aporte/estorno, pagamento e parcelamento |
| `tests/dashboard-csv.test.js` | Farol, atraso, dupla contagem, assinatura paga, CSV e reimportação |
| `tests/receipt-chat.test.js` | Validação de recibo e histórico de chat |
| `tests/firestoreHarness.js` | Banco simulado com commits atômicos, detecção de conflito e falha injetada; infraestrutura dos testes |

O comando usa módulos VM experimentais do Node e pode emitir o aviso `ExperimentalWarning`. Isso é uma característica do ambiente de testes, não do bundle do navegador.

## 6. Testes com Firestore Emulator

As dependências `firebase-tools` e `@firebase/rules-unit-testing` estão no projeto. O emulador exige Java, e seu primeiro uso pode precisar baixar o JAR.

```powershell
$env:FIREBASE_EMULATORS_PATH = Join-Path (Get-Location).Path '.firebase-emulators'
npm run test:firebase
```

Esse comando inicia o Firestore em `127.0.0.1:8080`, usa o projeto fictício **`demo-salva-ai`**, executa `tests/firebase.integration.js` e encerra o emulador. A porta 8080 precisa estar livre; o backend Python legado usa 8000.

O teste rejeita execução sem `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`. Ele injeta o banco autenticado de teste nos serviços reais, sem inicializar o Firebase de produção. O conteúdo do emulador é limpo entre os cenários.

Os testes verificam bloqueio de usuário diferente/anônimo, valores inválidos, uso dos serviços reais, pagamentos concorrentes e estornos. Mensagens `PERMISSION_DENIED` são esperadas nos testes negativos quando `assertFails` confirma a rejeição.

## 7. Alternativa quando o comando npm do Windows falha

Nesta máquina, uma invocação inicial de `npm` apontou para um `npm-cli.js` inexistente em outra instalação. As ferramentas foram executadas diretamente com Node. Se ocorrer o mesmo erro:

```powershell
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' ci
node --experimental-vm-modules --test tests/*.test.js
node node_modules/oxlint/bin/oxlint
node node_modules/vite/bin/vite.js build
```

Para o emulador:

```powershell
$env:FIREBASE_EMULATORS_PATH = Join-Path (Get-Location).Path '.firebase-emulators'
node node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --only firestore --project demo-salva-ai "node --experimental-vm-modules --test tests/firebase.integration.js"
```

O caminho do npm acima é específico desta instalação. Não copiar o caminho para outro computador sem verificar. A CLI Firebase também usa configuração no perfil do usuário, além da pasta do projeto; ambientes com sandbox podem precisar de permissão para acessá-la.

## 8. Executar o legado

O arquivo `Run_AgentFinanceiro.bat` continua iniciando o backend antigo e abrindo `frontend/index.html`. Ele não foi atualizado para React.

Execução manual do backend, partindo da raiz:

```powershell
Set-Location .\backend
python -m pip install -r requirements.txt
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

O frontend antigo chama `http://localhost:8000`. Não executar os scripts `patch_db.py` ou `patch_modals.py` como etapa normal da nova versão: eles pertencem à manutenção pontual do legado.

## 9. Publicação e backups

Ainda não há implantação configurada/validada nesta rodada. Antes de publicar: concluir conciliação dos dados, conferir regras de produção, configurar os provedores/domínios Firebase, executar os testes e configurar fallback das rotas SPA para `index.html` no provedor escolhido.

O backup `backups/salva-ai-before-fixes-20260913-154505.zip` preserva `src/` e arquivos de configuração antes das correções. Ele não contém exportação do Firestore nem cópia de `finance.db`. Um procedimento de backup/restore de dados continua pendente.

Fontes técnicas: [transações Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions), [testes de regras](https://firebase.google.com/docs/rules/unit-tests) e os arquivos locais vinculados neste guia.

## Atualização da configuração Firebase

A configuração fixa foi substituída por variáveis de ambiente. Antes de executar os comandos deste guia, preencher o arquivo local conforme [configuração e Git](configuracao-e-git.md). A chave do modelo Gemini deve ser ajustada no arquivo existente, sem sobrescrever os demais campos.

