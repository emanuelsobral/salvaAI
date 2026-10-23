# Modalidades de reajuste em saúde — 0.1.15

**17/10/2026. E04, nível Alto.** Retomada do experimento após a rodada de extratos. Nesta entrega, a distinção é interna e aparece na justificativa de abstenção; não foram acrescentados campos ao JSON nem alterado o protocolo 1.0.0. O extrator continua local e sem IA.

## O que mudou

| Situação | Comportamento da versão 0.1.15 |
|---|---|
| “Não haverá reajuste por faixa etária” | Preserva a restrição como regra literal. Não conclui que todo reajuste está proibido. |
| Percentual aplicado ao atingir determinada faixa etária | Preserva o percentual e a condição no texto; não transforma em taxa fixa geral. |
| Reajuste anual e por idade no mesmo bloco | Mantém a regra inteira, sem atribuir o índice ou a periodicidade anual também à mudança de idade. |
| Modalidades em trechos distintos | Mantém abstenção e evidências; a justificativa enumera as menções reconhecidas: anual, técnico e/ou faixa etária. |
| Negação de um índice ou do reajuste no primeiro ano | Não equivale a ausência global. Corrigida também a expectativa anterior que tratava IVAR negado como “sem reajuste”. |
| Declaração integral “Contrato sem reajuste” | Continua reconhecida como ausência explícita, nas formas restritas suportadas. |
| Referência a anexo, tabela com lacunas ou condições concorrentes | Continua pendente ou ambígua; nenhuma regra é escolhida por proximidade. |

As modalidades são **menções**, inclusive negativas, não confirmação de aplicação. O reconhecimento é lexical e não resolve todos os enunciados possíveis. A periodicidade de um reajuste anual com componente técnico continua preservada quando explicitamente reconhecida e sem mistura com evento etário. Período de apuração continua distinto de periodicidade.

## Verificação

Oito testes fictícios novos e uma expectativa antiga corrigida reproduziram as falhas antes da implementação. **168 testes Python e sete Node aprovados: 175 no total.** Os testes incluem evidência em páginas diferentes, condições, negação parcial, percentual etário, tabela incompleta, remissão e ausência global.

O lote de **18 documentos de desenvolvimento** foi reexecutado, com hashes conferidos contra os catálogos. Os 18 JSONs passaram na validação de esquema e localização literal das evidências.

| Documento | Mudança na saída final |
|---|---|
| `sau-01` | Justificativa identifica menções a anual e faixa etária. |
| `sau-07` | Justificativa identifica menções a anual, técnico e faixa etária. |
| `sau-09` | Justificativa identifica menções a anual e faixa etária. |

**Somente esses três motivos mudaram; os outros 87 objetos de campo ficaram idênticos à 0.1.14.** Estados, valores e evidências de todos os 90 campos permaneceram iguais. Os oito candidatos internos afetados receberam a identificação da regra nova, sem mudança de seus valores nesse lote. A correção de classificações indevidas é demonstrada nos casos fictícios, não por novos acertos medidos nos documentos reais.

Continuam quatro reajustes ambíguos, 16 processamentos concluídos e duas falhas de leitura (`sau-04` e `sau-05`). O bloco com limites e bases de contribuição de `sau-09` ainda precisa da distinção entre objetos: identificar modalidades não resolve essa limitação. Não há gabarito independente congelado nem métricas de precisão.

## Rastreabilidade

Resultados preservados na **C:**, fora do repositório, conforme preferência do usuário:

- Base local: `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/`.
- Lote: `E04-lote-0115-20261018T021214989714Z/`.
- Diagnóstico: `E04-diagnostico-reajustes-0115-20261018T021333680494Z/`.
- Referência preservada: `experiments/contracts/runs/E04-lote-0114-20261016T002737232729Z/`.
- Regras SHA-256: `b4cd69983e6edfc7d684b1a01b2bdf89197cd5276e63c8d7a5888091fb02bf2a`.

O lote preserva saídas, páginas, erros, manifestos, comparação, validação e cópias das regras/protocolo/esquema. O diagnóstico conserva as páginas/saídas antigas como referência; `campos-reproduzidos.json`, `candidatos.json` e `modalidades.json` registram a execução atual. Os nomes das pastas usam UTC; a data local é 17/10/2026.

Comandos de verificação, usando Python com `pypdf==6.10.0` e Node:

```powershell
python -m unittest discover -s experiments/contracts -p "test_*.py"
node --test experiments/contracts/test-gabarito.mjs
node experiments/contracts/validar-saidas.mjs "CAMINHO_DO_LOTE"
```

Nesta máquina foi usado o Python do runtime local do Codex, pois o Python padrão não contém `pypdf`. Não houve instalação de dependências, acesso aos dez PDFs reservados, alteração de gabarito, integração ao aplicativo ou deploy.

## Próximo passo

**E04 — distinguir o objeto do reajuste, com Alto:** saldo devedor, prestação, seguro e tarifa no financiamento; limites e bases de contribuição na saúde. Preservar abstenção enquanto esses critérios não puderem ser associados sem suposição. E02/E03 seguem pendentes de coleta ampliada e gabarito independente.

**Progresso geral: 29% (2/7 etapas formais). Esta entrega: 100% dos três blocos planejados — correção, testes/regressão e documentação.** Não representa precisão de extração nem conclusão da avaliação experimental.
