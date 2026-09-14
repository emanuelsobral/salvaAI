# Gemini com chave do administrador

O usuário faz login e usa chat, conselheiro e recibos. O navegador chama `/api/ai` com um ID token Firebase. A Netlify Function verifica assinatura, validade e projeto desse token antes de consultar o Gemini. A chave Gemini permanece no servidor.

## Configurar localmente

No `.env.local` existente, preencher somente o campo vazio:

```dotenv
GEMINI_API_KEY=sua_chave_gemini
GEMINI_MODEL=gemini-3.8-flash
FIREBASE_PROJECT_ID=seu_projeto_firebase
```

O ID do projeto já foi copiado da configuração Firebase local. Deve ser o mesmo projeto usado pelo login. Não usar prefixo `VITE_` para a chave. Não enviar o `.env.local` ao Git.

Executar `npm install` para atualizar dependências e `npm run dev`. Reiniciar o Vite após alterar o ambiente. O middleware local atende `/api/ai` sem precisar iniciar outro terminal. `npm run preview` também oferece esse endpoint localmente. Sem chave, a aplicação continua disponível e as ações de IA exibem uma mensagem de indisponibilidade.

## Configurar na Netlify

Nas variáveis de ambiente do site, cadastrar `GEMINI_API_KEY`, `GEMINI_MODEL` e `FIREBASE_PROJECT_ID` com escopo **Functions**. Manter as variáveis públicas `VITE_FIREBASE_*` no escopo de build. Se a interface não oferecer escopos individuais, usar um escopo que inclua Functions para as três variáveis do servidor.

Executar novo deploy após salvar. O `netlify.toml` encaminha `/api/ai` à função antes do fallback React. Não colocar segredos nesse arquivo. O projeto usa Node 24, definido em `.node-version` e `NODE_VERSION` no build.

O runtime pode ser fixado no painel com `AWS_LAMBDA_JS_RUNTIME=nodejs24.x` (escopo de build). Essa variável não funciona no `netlify.toml`. Porém, mudar somente o Node não resolve o `ERR_REQUIRE_ESM`: o AWS Lambda desativa `require()` de ESM por padrão inclusive no Node 24.

A correção substitui o Firebase Admin por importação ESM direta de `jose`, eliminando `jwks-rsa` da função. A verificação mantém assinatura RS256, chaves públicas Google de origem fixa, emissor, projeto, expiração, datas de emissão/autenticação e subject. Não é necessário habilitar flags experimentais no painel.

Para publicar a correção, enviar juntos `server/firebase-auth.js`, `package.json` e `package-lock.json`, além dos demais arquivos alterados. Cadastrar `GEMINI_MODEL=gemini-3.8-flash` no escopo Functions e executar um novo deploy. Alterar `.env.local` não altera a Netlify. Após o deploy, um POST JSON sem token em `/api/ai` deve responder 401, e não 502; esse teste não consome Gemini.

Referências: [runtime Netlify](https://docs.netlify.com/build/functions/configuration/#node-js-version-for-runtime), [restrições de módulos no AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html), [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash).

Remover a variável antiga `VITE_GEMINI_MODEL` do painel: o servidor usa `GEMINI_MODEL`, cujo valor é um nome público e não deve ser marcado como segredo. O `netlify.toml` exclui somente esses dois nomes de variável da verificação de segredos para evitar o falso positivo observado no deploy. `GEMINI_API_KEY` continua sujeita à verificação e deve permanecer secreta, com escopo Functions. Referência: [configuração do scanner Netlify](https://docs.netlify.com/build/environment-variables/secrets-controller/#configure-secret-scanning).

Não é necessária chave privada Firebase Admin para essa verificação de ID token com projeto explícito: são usados os certificados públicos. Essa verificação não consulta revogação de tokens; um token emitido pode permanecer válido até expirar. O backend não possui acesso administrativo ao banco configurado por esta mudança.

## Limites e operação

- Netlify: regra de 10 solicitações por minuto por IP e domínio, aplicada pela plataforma após deploy.
- Limite adicional em memória: 10 por usuário/minuto e 60 totais/minuto por instância. Reinicia com a instância; não é cota diária persistente nem teto global de custos.
- Recibos: JPG, PNG ou WebP até 3 MB, para caber no limite de payload da função com base64.
- Mensagem: até 4.000 caracteres; histórico: até dez pares completos; resumo financeiro: até 30.000 caracteres.
- Saída do modelo limitada a 2.048 tokens; chamada ao Gemini com timeout de 45 segundos e espera no navegador de 55 segundos. O Gemini 3.8 Flash usa `thinkingLevel: low` para reduzir latência; outros modelos mantêm sua configuração padrão.
- Respostas não são armazenadas em cache. Erros do provedor são traduzidos sem retornar detalhes da chave.

A cota do Google é compartilhada. A função não ativa faturamento nem garante uso gratuito: consumo depende da configuração do projeto Google e do plano da hospedagem. Os limites diários persistentes sugeridos anteriormente não foram implementados nesta etapa.

## Compatibilidade e validação

O botão e o modal de configuração foram removidos, assim como o SDK Gemini do cliente. Entradas antigas `salva_ai_gemini_key` são apagadas ao carregar o serviço no navegador. Chat, insight e leitura de recibos mantêm seus contratos com os componentes.

A API recebe o resumo financeiro do próprio usuário autenticado e o trata como dados não confiáveis. A IA apenas responde ou preenche um formulário; não executa movimentações. A chave é controlada pelo administrador e o acesso ao endpoint exige login.

32 testes locais aprovados, incluindo assinatura e claims Firebase, inicialização com a restrição de módulos do Lambda, validação, limite, recibos e tratamento de erros. Não foi feita chamada real ao Gemini nem deploy nesta revisão. O Word e os guias anteriores descrevem etapas históricas; este documento substitui as instruções antigas de chave por usuário.

Referências: [Firebase ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [Gemini generateContent](https://ai.google.dev/api/generate-content), [Netlify Functions](https://docs.netlify.com/build/functions/api/).

## Timeout e avisos de login

O HTTP 504 com a mensagem genérica anterior podia ser gerado pelo timeout de 20 segundos do backend. Agora o timeout retorna uma mensagem específica, sem repetição automática da chamada. Os testes simulam a demora; não garantem a latência do provedor em produção. O limite síncrono documentado da Netlify é de 60 segundos, deixando margem para autenticação e resposta. Referências: [limites Netlify](https://docs.netlify.com/build/functions/configuration/), [raciocínio Gemini](https://ai.google.dev/gemini-api/docs/generate-content/thinking).

Os avisos `Cross-Origin-Opener-Policy` sobre `window.closed` pertencem ao popup de login. Na inspeção do site publicado, a página não enviava cabeçalhos COOP e a função retornava corretamente 401 sem token. Esses avisos não identificam a causa do timeout da chamada Gemini.
