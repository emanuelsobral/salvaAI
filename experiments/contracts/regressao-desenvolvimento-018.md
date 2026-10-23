# Rodada de desenvolvimento — extrator 0.1.8

**14/10/2026.** A execução dos 16 PDFs originais de desenvolvimento terminou: 14 processados e dois com falha de leitura. As 16 saídas passaram no esquema e na localização literal das evidências. A inspeção técnica encontrou problemas de vigência e vencimento; **a versão ainda precisa de correções antes de avaliação formal**.

Esta rodada compara saídas da 0.1.0 com a 0.1.8. Não é um teste isolado da última alteração, não usa gabarito independente e não mede precisão. Os dois contratos complementares já conferidos não entram nas contagens abaixo. Os dez documentos reservados não foram executados. Muitos documentos do piloto são modelos com lacunas.

## Contagem de estados, não de acertos

Cada linha tem 16 documentos. “Encontrado” é o estado declarado pelo extrator e pode incluir resposta inadequada.

| Campo | Encontrado | Não identificado | Ambíguo | Erro de leitura |
|---|---:|---:|---:|---:|
| Valor da parcela | 0 | 14 | 0 | 2 |
| Número de parcelas | 1 | 13 | 0 | 2 |
| Vencimento | 2 | 8 | 4 | 2 |
| Vigência | 1 | 4 | 9 | 2 |
| Reajuste | 1 | 9 | 4 | 2 |

Comparadas as 80 combinações documento/campo, 24 objetos de saída mudaram, distribuídos por 14 documentos. Dessas mudanças, nove alteraram o estado; as outras 15 alteraram evidências, motivos ou outros atributos mantendo o estado. Não interpretar essa contagem como ganhos ou perdas de acerto.

Os documentos `sau-04` e `sau-05` continuam com `SEM_CAMADA_TEXTO` em todas as 37 páginas de cada arquivo. Suas saídas de campos são idênticas às anteriores. Os erros e logs foram mantidos; OCR não foi executado.

## Achados que precisam de correção

| Prioridade | Caso | Constatação técnica | Encaminhamento |
|---|---|---|---|
| 1 | `alu-01`, vigência, página 1 | Passou de não identificado para encontrado, embora início, fim e duração continuem nulos. O trecho contém espaços em branco nas datas e duração e menciona posse/prorrogação após o prazo. A menção incidental a posse está sendo aceita como informação principal. | Reconhecer lacunas de espaços e barras e exigir vínculo explícito entre evento e início da vigência; não usar posse em cláusula de prorrogação para preencher o prazo principal. |
| 2 | `edu-09`, vencimento, página 3 | Passou de encontrado para não identificado. O trecho contém parcelas seguintes no dia 7 de cada mês e instrução bancária após o vencimento. O detector por evento reage a “paga”, “dia” e “após” sem exigir um prazo em dias ligado ao pagamento, bloqueando a regra mensal anterior. | Restringir a seleção da regra por evento. Preservar o texto com matrícula, início em fevereiro e instrução bancária; não reduzir toda a obrigação a um dia isolado. |
| 3 | `edu-07`, vencimento, página 2 | Passou de ambíguo para encontrado. O trecho selecionado remete a definição do vencimento ao ato da matrícula e contém números de parcelas e valores; não fornece por si só o vencimento concreto. | Evitar que um número qualquer e uma condição no mesmo bloco bastem para declarar vencimento encontrado. |
| 4 | `edu-01`, `edu-04`, `edu-06`, `fin-04`, vigência | Passaram de não identificado para ambíguo. Evidências incluem matrícula, pagamento, cobertura de obrigações e uso/posse de bens. Esses blocos podem mencionar contrato ou vigência sem estabelecer seu prazo. | Refinar o vínculo entre datas/eventos e prazo principal; não chamar toda menção incidental de conflito de vigência. |
| 5 | `fin-01`, vencimento e vigência | Vencimento passou de encontrado para ambíguo, incluindo obrigações de leilão/desocupação. Vigência passou de encontrada para não identificada; a resposta anterior se apoiava em cobertura securitária. | Rever o contexto das obrigações antes de decidir se uma mudança é regressão; não restaurar automaticamente a resposta da 0.1.0. |

As constatações acima resultam da inspeção do texto extraído, das saídas e das condições do código. Não são uma anotação humana independente nem uma revisão integral de todos os PDFs. Não foram geradas respostas de gabarito. Os problemas não foram corrigidos silenciosamente durante a execução.

## Próxima etapa

**GPT recomendado: Alto.** Corrigir os falsos reconhecimentos de vigência em branco e a seleção de vencimento por evento/mensal, começando por exemplos fictícios que reproduzam os achados. Verificar também o caso `edu-07`. Depois repetir os casos afetados e os dois contratos complementares em novas pastas, sem alterar as saídas desta rodada. A anotação independente E03 e a ampliação da coleta E02 continuam pendentes; esta rodada não inicia E05.

## Rastreabilidade

- Rodada atual: `runs/E04-lote-018-20261014T092254285030Z/`.
- Referência anterior: `runs/E04-validacao-20261013T182635728454Z/`, apenas os mesmos 16 IDs reais de desenvolvimento, versão 0.1.0.
- Seleção explícita: catálogo congelado, `status_coleta=baixado` e `divisao=desenvolvimento`; a rotina exige 16 itens antes de iniciar.
- SHA-256 do catálogo: `9bdd77fed742b15241653eaa419c6c44052b2c0890eb4d1d61840806ca7a1d30`.
- Identidade de cada PDF conferida entre catálogo, resultado anterior e resultado atual; hash das regras conferido em todos os manifestos e ao final do lote.
- Por documento: resultado bruto, páginas, log, manifesto e comparação completa com hashes. No lote: catálogo e rotina copiados, resumo estruturado e log da validação.
- Saídas e documentos reais ficam em pastas ignoradas pelo Git; este relatório contém somente metadados e sínteses técnicas.
- Código do extrator mantido em 0.1.8. A suíte de 120 testes passou na etapa anterior e não foi repetida nesta execução sem alterações nas regras. Sem chamadas de IA, integração ao aplicativo ou deploy.

## Acompanhamento — 14/10/2026

Os três achados prioritários foram tratados na [versão 0.1.9](correcoes-regressao-019.md), com testes e dez documentos reexecutados. As saídas desta rodada 0.1.8 permanecem intactas; três vigências educacionais ainda estão pendentes.
