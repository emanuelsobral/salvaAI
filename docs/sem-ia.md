# Operação sem IA — 09/10/2026

O aplicativo não consulta modelos de IA. O resumo do dashboard é calculado a cada atualização dos dados. O assistente responde com regras locais a consultas específicas, sem interpretar linguagem livre ou usar o histórico para inferir uma pergunta.

## Consultas disponíveis

- Ajuda e saudações: explicação das funções, sem consulta ao banco.
- Resumo e saldo: conta principal, fatura e saldo após compromissos considerados pelo painel.
- Fatura: valor pendente do mês.
- Gastos: total e período considerados pelo painel, incluindo compras do mês e assinaturas.
- Maior categoria: maior valor positivo entre as categorias do período.
- Projeção: saldo ao final da projeção cadastrada. Não estima novas receitas nem despesas desconhecidas.

Consultas financeiras leem os dados atuais do Firestore. O modo sem IA não é um modo offline: login e dados em nuvem continuam dependendo do Firebase. Valores ausentes são informados como indisponíveis, sem inventar zeros.

## Recibos e contratos

O botão de leitura de recibos foi removido. O cadastro manual e a importação CSV permanecem disponíveis. Não há extração de contratos, OCR ou interpretação de cláusulas nesta versão.

## Proteção contra consumo

A Netlify Function e o middleware Vite usam `server/disabled-ai.js`, que responde HTTP 410 antes de qualquer consulta externa. A chave local existente não foi alterada; ela não é utilizada por esses endpoints. O código e os testes da integração anterior permanecem no repositório como histórico, sem ligação com os fluxos ativos.

É necessário publicar as alterações para interromper chamadas da versão antiga hospedada. Após o deploy, atualizar a página para carregar o assistente local. O administrador pode remover as variáveis Gemini da Netlify, pois não são mais necessárias.

## Validação

40 testes passaram, build aprovado e lint sem erros (avisos anteriores permanecem). Os novos testes cobrem dados ausentes, saldo zero/negativo, limites das respostas locais e endpoint desativado. Nenhuma chamada real ao Gemini foi feita nesta alteração.

Teste no navegador com dados fictícios aprovado: resumo local, saudação, consulta de maior categoria, pergunta não reconhecida e formulário manual. Nenhuma chamada a `/api/ai` foi disparada pela interface. O endpoint local respondeu 410.
