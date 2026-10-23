# Lote completo de desenvolvimento — 0.1.10

**Atualização posterior:** a vigência de saúde priorizada neste diagnóstico foi tratada na [0.1.11](vigencia-saude-0111.md). Este relatório preserva os resultados e pendências da rodada 0.1.10.

**14/10/2026 (America/Sao_Paulo).** Os 18 contratos de desenvolvimento foram executados: **16 concluíram o processamento e dois falharam por ausência de texto extraível**. Todos os 18 JSONs passaram no esquema e na localização literal das evidências, inclusive os registros das falhas. Isso valida o formato, não a correção financeira.

Foram usados os 16 PDFs do piloto original e os dois contratos institucionais complementares. Os dez documentos reservados não foram executados. As regras permaneceram em **0.1.10**, sem ajustes durante a rodada. Não há gabarito independente ou métricas formais.

## Estados das saídas

Cada linha soma 18 documentos. “Encontrado” é a declaração do extrator e não comprova acerto ou completude.

| Campo | Encontrado | Não identificado | Ambíguo | Erro de leitura |
|---|---:|---:|---:|---:|
| Valor da parcela | 2 | 14 | 0 | 2 |
| Número de parcelas | 1 | 15 | 0 | 2 |
| Vencimento | 4 | 12 | 0 | 2 |
| Vigência | 3 | 12 | 1 | 2 |
| Reajuste | 3 | 9 | 4 | 2 |

As falhas continuam em `sau-04` e `sau-05`, com `SEM_CAMADA_TEXTO` nas 37 páginas de cada arquivo. OCR não foi executado. Os campos desses documentos são idênticos aos da rodada anterior.

## Comparação com as referências

As referências são diferentes por documento e estão identificadas nos arquivos de comparação:

- Dez documentos foram comparados à conferência anterior da própria 0.1.10: **todos os 50 objetos de campo ficaram integralmente idênticos**, incluindo os contratos de Mafra e Cruz das Almas.
- Oito documentos ainda tinham como referência o lote 0.1.8. Seis deles tiveram nove objetos de campo alterados, sendo seis mudanças de estado e três mudanças de evidência sem mudança de estado. Isso compara o conjunto das correções 0.1.9–0.1.10, não apenas uma alteração isolada.

| Documento/campo | Estado anterior → atual | Leitura técnica |
|---|---|---|
| `alu-02`, vigência | Ambíguo → não identificado | Quadro de prazo está preenchido com marcadores, e cláusulas remetem a ele. Nenhum prazo foi calculado. |
| `fin-05`, vencimento | Ambíguo → encontrado | Restou a regra condicional da primeira prestação, no dia 15 subsequente à liberação, caso não haja carência. Referências a entrega de seguro deixaram de competir. Não comprova identificação de todo o cronograma. |
| `fin-05`, vigência | Ambíguo → não identificado | Obrigações de cadastro durante a vigência não estabelecem seu prazo principal. |
| `sau-01`, `sau-07`, `sau-09`, vigência | Ambíguo → não identificado | A filtragem retirou conflitos incidentais, mas ainda omite formas relevantes de vigência. Não tratar a mudança como acerto confirmado. |

Nos campos de vencimento de `alu-02`, `edu-05` e `sau-01`, o estado permaneceu não identificado; evidências de reparo de imóvel, confecção de material e duração contratual deixaram de ser candidatas. A inspeção foi técnica, baseada no texto extraído, sem nova anotação humana independente ou revisão visual integral.

## Pendências priorizadas

| Ordem | Pendência | Evidência / limite | Próxima ação |
|---|---|---|---|
| 1 | Vigência de contratos de saúde | `sau-01`, página 9: prazo mínimo de 12 meses e eventos alternativos de início. `sau-07`, página 23: início explícito em 01/12/2019; há também vigência mínima e renovação na página 3, com texto mal ordenado. | Com **Alto**, reproduzir as formas em testes e preservar mínimo, alternativas e renovação. Não transformar carência de cobertura em prazo contratual. |
| 2 | Completude do vencimento de financiamento | `fin-05` retornou regra da primeira prestação, condicionada à ausência de carência. | Conferir as outras situações de pagamento antes de considerar o campo completo. Não gerar parcelas automaticamente. |
| 3 | Reajustes ainda ambíguos | `fin-01`, `sau-01`, `sau-07` e `sau-09`. | Inspecionar candidatos e separar índice, encargos, carência e condições antes de alterar regras. |
| 4 | Documentos sem texto | `sau-04` e `sau-05`. | Avaliar OCR local em etapa própria; preservar falha de leitura até lá. |
| 5 | Avaliação e representatividade | Há muitos modelos com lacunas e somente dois complementares institucionais. Não há gabarito independente congelado. | Continuar E02/E03: contratos preenchidos e anotação humana com procedência registrada, antes de E05/E06. |

**Próximo passo técnico: vigência mínima e início explícito nos contratos de saúde. Nível recomendado: Alto.** Nenhuma das contagens acima é precisão, revocação ou taxa de acerto. Não foram preenchidos gabaritos nem usadas saídas como se fossem anotações independentes.

## Rastreabilidade

- Rodada final: `runs/E04-lote-0110-20261015T020746051662Z/` (UTC no nome; data local 14/10/2026).
- Referências: `E04-regressao-0110-20261015T020505276377Z` para os dez já conferidos; `E04-lote-018-20261014T092254285030Z` para os outros oito.
- Regras SHA-256: `48c83da9e608040a07a88a7414d4dee0b12ba4a1e4c81ebd61fbde6fca1d90e6`.
- Identidade dos PDFs conferida com catálogos e resultados anteriores. Código estável confirmado em todos os manifestos e ao final do lote.
- Preservados resultados brutos, páginas, erros, manifestos, comparações e hashes; na raiz do lote, catálogos, rotina, resumo e log de validação. Os totais e a unicidade dos 18 IDs foram conferidos.
- Tentativa inicial `E04-lote-0110-20261015T020735269078Z` preservada: interrompida por caminho incorreto da referência na rotina do lote, após gerar duas saídas. Corrigido apenas o caminho da rotina; extrator inalterado. A rodada final foi criada em pasta nova.
- A suíte de 135 testes foi aprovada na etapa anterior e não foi repetida nesta execução sem alteração de código. Sem chamadas de IA, integração ao aplicativo ou deploy.
