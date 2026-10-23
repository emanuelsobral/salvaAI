# Objetos do reajuste — 0.1.16

**17/10/2026. E04, nível Alto.** O extrator distingue menções a prestação, aluguel, mensalidade e contribuição de menções a saldo devedor, cota de amortização, seguro, tarifa administrativa, limites e bases de contribuição. A distinção serve para impedir a atribuição de um índice à obrigação inteira quando o texto trata de um componente.

## Comportamento

- Um reajuste explicitamente relacionado a saldo, seguro, tarifa, cota, limite ou base fica **pendente**, com evidência literal. Isoladamente, retorna `nao_identificado`: a regra da obrigação principal não foi estabelecida.
- Quando vários objetos aparecem no mesmo bloco ou em páginas diferentes, o resultado fica **ambíguo**, com valor nulo e justificativa dos objetos mencionados. Um índice encontrado em um trecho não é transferido a outro objeto.
- A presença de “prestações” na referência ao dia de vencimento do saldo não comprova reajuste da prestação. A regra conserva essa dúvida.
- Lacunas, negações e referências a anexos permanecem nas evidências. Nenhum candidato é descartado para favorecer uma resposta preenchida.
- Reajustes simples de aluguel, mensalidade, prestação ou contribuição continuam reconhecidos nas formas anteriores, quando não há componentes acessórios identificados.
- Limite da **taxa de reajuste**, como teto de 8%, não é confundido com limite da **contribuição** nos casos testados.

O esquema e o protocolo permanecem em 1.0.0. Não foi criada uma lista estruturada de índices por componente: isso exigiria nova versão do contrato de saída. O reconhecimento é lexical e conservador; menções incidentais podem provocar revisão adicional. A aplicação de cada índice a seu objeto ainda não é resolvida automaticamente. Também não há interpretação jurídica, consulta de índices ou cálculo de valores.

## Validação

Nove testes fictícios novos cobrem componentes isolados, mistura no mesmo trecho, páginas distintas, limite/base de contribuição, obrigação principal, referência a vencimento, negação, lacuna e teto da taxa. As falhas relevantes foram reproduzidas antes da correção. **177 testes Python e sete Node passaram: 184 no total.**

O lote de **18 documentos de desenvolvimento** foi executado novamente, preservando PDFs, catálogos e conjunto reservado. Os 18 JSONs passaram no esquema e na verificação literal de evidências.

| Documento | Diagnóstico interno antes → depois | Resultado final |
|---|---|---|
| `fin-01` | Nove candidatos e duas pendências → zero candidatos e 11 pendências. | Continua ambíguo; explica as menções a prestação, saldo, cota, seguro e administração. |
| `sau-09` | Três candidatos → dois candidatos e uma pendência. | O bloco da página 38 com limites/bases deixa de fornecer um candidato geral IPCA/12 meses. Continua ambíguo, com explicação de objetos e modalidades. |
| `sau-01` e `sau-07` | Sem mudança de candidatos ou pendências. | Saídas finais idênticas à 0.1.15. |

**88 dos 90 objetos de campo ficaram idênticos à versão anterior.** Nos dois reajustes alterados, mudaram o motivo e a ordem das evidências; todos os trechos foram preservados (11 em `fin-01`, três em `sau-09`). Nenhum estado ou valor final mudou. A ausência de resposta única continua deliberada, não representa contradição comprovada no contrato.

Permanecem **16 processamentos concluídos, duas falhas de leitura e quatro reajustes ambíguos**. Essas contagens não medem acerto: ainda falta gabarito independente congelado. A regra nova evita simplificações indevidas, mas não aumenta a quantidade de respostas preenchidas neste lote.

## Rastreabilidade

Artefatos privados e saídas estão fora do Git, na base local:

`C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/`

- Lote: `E04-lote-0116-20261018T021909837616Z/`.
- Diagnóstico: `E04-diagnostico-reajustes-0116-20261018T021928882675Z/`.
- Referência: `E04-lote-0115-20261018T021214989714Z/`.
- Regras SHA-256: `85d9f37df93be87ec0dfb5476b839da02529294a299367cafddd642a318678aa`.

Preservados código, protocolo, esquema, catálogos, resultados, páginas, erros, comparações e validação. O diagnóstico mantém os resultados antigos como referência; os arquivos `campos-reproduzidos.json`, `candidatos.json` e `objetos.json` representam o código atual. Pastas em UTC; data local 17/10/2026. Python local do runtime com `pypdf==6.10.0`; sem instalação adicional.

Verificações:

```powershell
python -m unittest discover -s experiments/contracts -p "test_*.py"
node --test experiments/contracts/test-gabarito.mjs
node experiments/contracts/validar-saidas.mjs "CAMINHO_DO_LOTE"
```

Nenhum PDF reservado foi processado, nenhum gabarito foi alterado e não houve integração ao aplicativo, chamada de IA ou deploy.

## Próximo passo e progresso

**E04 — revisar o cronograma de financiamento, com Alto:** verificar o que falta para associar carência, amortização, vencimentos e dia útil sem inventar datas ou quantidade de parcelas. Continuar a preparação E02/E03; a avaliação final depende do gabarito independente.

**Esta entrega: 100% (3/3 blocos — correção, validação e documentação). Experimento: 29% (2/7 etapas formais).**
