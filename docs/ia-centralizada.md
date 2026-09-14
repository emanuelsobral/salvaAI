# Gemini com chave do administrador

O usuário faz login e usa chat, conselheiro e recibos. O navegador chama `/api/ai` com um ID token Firebase. A Netlify Function verifica assinatura, validade e projeto desse token antes de consultar o Gemini. A chave Gemini permanece no servidor.

## Configurar localmente

No `.env.local` existente, preencher somente o campo vazio:

```dotenv
GEMINI_API_KEY=sua_chave_gemini
GEMINI_MODEL=gemini-2.5-flash
FIREBASE_PROJECT_ID=seu_projeto_firebase
```

O ID do projeto já foi copiado da configuração Firebase local. Deve ser o mesmo projeto usado pelo login. Não usar prefixo `VITE_` para a chave. Não enviar o `.env.local` ao Git.

Executar `npm install` para atualizar dependências e `npm run dev`. Reiniciar o Vite após alterar o ambiente. O middleware local atende `/api/ai` sem precisar iniciar outro terminal. `npm run preview` também oferece esse endpoint localmente. Sem chave, a aplicação continua disponível e as ações de IA exibem uma mensagem de indisponibilidade.

## Configurar na Netlify

Nas variáveis de ambiente do site, cadastrar `GEMINI_API_KEY`, `GEMINI_MODEL` e `FIREBASE_PROJECT_ID` com escopo **Functions**. Manter as variáveis públicas `VITE_FIREBASE_*` no escopo de build. Se a interface não oferecer escopos individuais, usar um escopo que inclua Functions para as três variáveis do servidor.

Executar novo deploy após salvar. O `netlify.toml` encaminha `/api/ai` à função antes do fallback React. Não colocar segredos nesse arquivo. O código usa Node 20 ou superior (ambiente local validado com Node 24).

Não é necessária chave privada Firebase Admin para essa verificação de ID token com projeto explícito: são usados os certificados públicos. Essa verificação não consulta revogação de tokens; um token emitido pode permanecer válido até expirar. O backend não possui acesso administrativo ao banco configurado por esta mudança.

## Limites e operação

- Netlify: regra de 10 solicitações por minuto por IP e domínio, aplicada pela plataforma após deploy.
- Limite adicional em memória: 10 por usuário/minuto e 60 totais/minuto por instância. Reinicia com a instância; não é cota diária persistente nem teto global de custos.
- Recibos: JPG, PNG ou WebP até 3 MB, para caber no limite de payload da função com base64.
- Mensagem: até 4.000 caracteres; histórico: até dez pares completos; resumo financeiro: até 30.000 caracteres.
- Saída do modelo limitada a 2.048 tokens; chamada com timeout de 20 segundos.
- Respostas não são armazenadas em cache. Erros do provedor são traduzidos sem retornar detalhes da chave.

A cota do Google é compartilhada. A função não ativa faturamento nem garante uso gratuito: consumo depende da configuração do projeto Google e do plano da hospedagem. Os limites diários persistentes sugeridos anteriormente não foram implementados nesta etapa.

## Compatibilidade e validação

O botão e o modal de configuração foram removidos, assim como o SDK Gemini do cliente. Entradas antigas `salva_ai_gemini_key` são apagadas ao carregar o serviço no navegador. Chat, insight e leitura de recibos mantêm seus contratos com os componentes.

A API recebe o resumo financeiro do próprio usuário autenticado e o trata como dados não confiáveis. A IA apenas responde ou preenche um formulário; não executa movimentações. A chave é controlada pelo administrador e o acesso ao endpoint exige login.

25 testes locais aprovados, incluindo autenticação, validação, limite, recibos e tratamento de erros. Não foi feita chamada real ao Gemini nem deploy nesta revisão. O Word e os guias anteriores descrevem etapas históricas; este documento substitui as instruções antigas de chave por usuário.

Referências: [Firebase ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [Gemini generateContent](https://ai.google.dev/api/generate-content), [Netlify Functions](https://docs.netlify.com/build/functions/api/).
