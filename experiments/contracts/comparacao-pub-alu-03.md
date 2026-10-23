# Comparação de desenvolvimento — pub-alu-03

**13/10/2026, horário de São Paulo. Extrator 0.1.0, regras inalteradas.**

O protótipo conseguiu ler as cinco páginas, mas ainda não extrai os compromissos com qualidade suficiente para uso automático. O erro mais importante foi preencher o reajuste como mensal, embora a referência revisada informe intervalo mínimo de um ano.

Esta rodada usa um contrato de locação institucional do catálogo complementar de desenvolvimento. A referência foi gerada por IA externa e conferida pelo usuário. Não constitui anotação humana independente do protocolo e não foi usada para calcular acurácia, precisão ou revocação. E05 não foi iniciada.

## Resultado por campo

| Campo | Referência revisada | Saída do extrator | Diferença observada |
|---|---|---|---|
| Valor da parcela | R$ 2.200,00 por mês | Não identificado | Omissão do valor mensal. |
| Número de parcelas | Não expresso | Não identificado | Sem contradição observada; abstenção não comprova identificação de ausência. |
| Vencimento | Até o dia 20 do mês seguinte ao mês de referência | Não identificado | Omissão da regra de pagamento. |
| Vigência | 01/04/2022 a 01/04/2023, com condições | Ambíguo, sem valor | A regra não resolveu as informações; isso não demonstra ambiguidade no contrato. |
| Reajuste | IGP-M ou substituto; intervalo mínimo de 12 meses, com condições | IGP-M; **1 mês** | Índice coincide, mas a periodicidade estruturada está errada. A cláusula original permanece na evidência. |

## Diagnóstico no código e no texto extraído

1. **Reajuste:** o separador mantém as cláusulas 7.1–7.4 no mesmo bloco. A regra encontra “mensal” no aluguel e usa essa palavra como periodicidade do reajuste. Não reconhece “interregno mínimo de 01 (um) ano”. Isso produz um valor incorreto com confiança média, mesmo preservando a cláusula anual na evidência.
2. **Aluguel:** a camada de texto apresenta `RS` no lugar de `R$`, enquanto a regra exige o símbolo monetário. A construção “aluguel mensal do imóvel no valor de” também não é coberta pela associação direta atual. Normalização futura deve preservar a evidência original e evitar substituir `RS` indiscriminadamente.
3. **Vencimento:** o detector admite “pago até”, mas não “pago mensalmente até”. Sem reconhecer o contexto de pagamento, ele não chega à regra de mês subsequente.
4. **Vigência:** as datas por extenso não entram no padrão `DD/MM/AAAA`. Blocos diferentes sobre vigência, reajuste e aviso prévio geram candidatos distintos. A comparação por objeto inteiro resulta em abstenção, sem reunir as condições do mesmo contrato.

Esses diagnósticos explicam o comportamento observado nesta entrada. Não foi implementada correção nesta rodada e não há comprovação de generalização para outros contratos.

## Evidências preservadas

- Rodada: `runs/E04-20261014T022612542385Z-71a42a/`. O nome e o manifesto usam UTC; a execução ocorreu em 13/10/2026 em São Paulo.
- `resultado.json`, `paginas.json`, `stderr.log` e `manifesto.json`: saída original, camada de texto, erros e versões/hashes.
- `referencia-revisada.snapshot.json`: cópia exata da referência revisada antes da comparação.
- `catalogo-complementar.snapshot.json`: cópia do catálogo que classifica o PDF como desenvolvimento.
- `comparacao.json`: estados, valores, observações e hashes dos arquivos comparados. Métricas permanecem nulas.
- `registrar-comparacao.mjs`: registro reproduzível, recusando sobrescrita dos arquivos de comparação.

O resultado concluiu a leitura em 137 ms, sem erros de processamento registrados. Esse tempo é de uma execução local, não um benchmark. O JSON passou pelo esquema e pela conferência literal das evidências nas páginas. Validade estrutural não implica correção dos campos financeiros, como mostra o erro de periodicidade.

O hash do PDF coincide entre catálogo, referência e resultado. O catálogo complementar foi verificado, e a saída bruta foi preservada. Nenhum documento reservado foi executado. Sem chamadas de IA, mudança no aplicativo ou deploy. Não houve nova execução da suíte de testes, pois as regras não foram alteradas.

## Correção executada — versão 0.1.1

Em 13/10/2026, a periodicidade foi corrigida para exigir relação explícita com o reajuste. A nova rodada retornou **12 meses**, preservando a regra literal com o intervalo mínimo, índice substituto e negociação de preço. A saída anterior de um mês continua preservada.

| Verificação | Resultado |
|---|---|
| Periodicidade do reajuste | 1 mês na 0.1.0 → 12 meses na 0.1.1 |
| Regra literal e evidências | Idênticas entre as versões |
| Outros quatro campos | Idênticos entre as versões; omissões e ambiguidade continuam |
| Testes | 51 Python e sete Node aprovados; sete novos testes de regressão |
| JSON e evidências da nova rodada | Aprovados no esquema e na localização literal |
| Integridade | Hashes da saída anterior, referência e catálogo conferidos |

Nova rodada: `runs/E04-20261014T023218699152Z-ca30b1/`. Inclui saída/manifesto originais da execução, cópias da referência e do catálogo, `comparacao-versoes.json` e o registro reproduzível `comparar-versoes.mjs`. A versão foi incrementada para 0.1.1 e a regra de reajuste identificada como `reajuste-clausula-v2`.

O esquema expressa o número 12, mas a condição de intervalo **mínimo** continua na regra textual; o resultado não autoriza agendamento automático de reajustes. A referência permanece gerada por IA e revisada pelo usuário, sem avaliação formal de precisão. Não houve mudança nos outros extratores, no aplicativo ou no conjunto reservado.

## Correção executada — versão 0.1.2

A nova versão reconheceu o vencimento: pagamento mensal até o dia 20 do mês subsequente ao mês de referência. O JSON mantém `tipo: outra_regra`, com data e dia isolado nulos, preservando a cláusula completa da página 2. A evidência inclui o símbolo `20®` tal como está na camada de texto; não foi alterado para fabricar correspondência literal.

- Sete testes novos; **58 testes Python e sete Node aprovados**.
- Vencimento passou de `nao_identificado` para `encontrado`.
- Aluguel, parcelas, vigência e reajuste permaneceram idênticos à rodada 0.1.1; reajuste continua em 12 meses.
- JSON e localização literal das evidências aprovados; hashes anteriores, referência e catálogo preservados.
- Rodada: `runs/E04-20261014T023938843496Z-7f2909/`, com saída bruta, manifesto e `comparacao-versoes.json`.

A alteração também evita interpretar “vencimento do presente contrato” como pagamento e recusa dias explícitos inválidos. A negação no bloco mensal causa abstenção conservadora. Resultado de desenvolvimento, sem métricas formais nem acesso aos PDFs reservados.

## Correção executada — versão 0.1.3

A nova versão encontrou **BRL 2200.00** como valor mensal, mantendo como evidência a cláusula 7.1 da página 2. O valor global de 26400.00 não foi usado como parcela, nem dividido para obter o aluguel.

- Tratamento de `RS` exige associação ao aluguel/parcela, formato monetário com centavos e indicação de “reais” após o valor; a evidência original permanece com `RS`.
- Itens numerados separados para o campo de valor evitam que condições do reajuste bloqueiem a cláusula do aluguel.
- Oito testes novos; **66 testes Python e sete Node aprovados**.
- Vencimento, parcelas, vigência e reajuste ficaram idênticos à rodada 0.1.2.
- JSON e evidências aprovados, hashes anteriores íntegros, referência e catálogo preservados.
- Rodada: `runs/E04-20261014T024350407667Z-840e11/`, incluindo `comparacao-versoes.json`.

Neste contrato, valor, vencimento e reajuste estão preenchidos; a quantidade de parcelas continua não identificada e a vigência continua ambígua. Isso não constitui uma taxa de acerto nem comprova desempenho em novos contratos. Não houve acesso ao conjunto reservado, chamadas de IA ou deploy.

## Correção executada — versão 0.1.4

A nova versão reconheceu **01/04/2022 a 01/04/2023**, mantendo `duracao_meses: null` e as condições de posse, assinatura, prorrogação, permanência após o vencimento e rescisão. O período de restauração não foi somado à data final. A regra inclui o trecho que dispensa aluguel durante a permanência de 30 dias, mantendo água e energia.

- Onze testes novos; **77 testes Python e sete Node aprovados**.
- Primeira tentativa `runs/E04-20261014T024936255208Z-44aff8/` preservada: ainda retornava ambiguidade devido a carimbos digitais em cláusulas incidentais. Os hashes das regras no manifesto distinguem essa tentativa da versão final, embora ambas indiquem 0.1.4 durante o desenvolvimento.
- Rodada final: `runs/E04-20261014T025041458990Z-eaaf28/`. Vigência passou de `ambiguo` para `encontrado`, com datas coincidentes com a referência revisada.
- Valor, parcelas, vencimento e reajuste ficaram idênticos à 0.1.3. JSON e evidências aprovados; snapshots e hashes anteriores preservados em `comparacao-versoes.json`.

| Campo | Estado atual no contrato de desenvolvimento |
|---|---|
| Aluguel | R$ 2.200,00 |
| Número de parcelas | Não identificado; nenhuma quantidade calculada |
| Vencimento | Regra literal: até dia 20 do mês subsequente |
| Vigência | 01/04/2022 a 01/04/2023, com condições; duração não calculada |
| Reajuste | IGP-M, 12 meses; intervalo mínimo e demais condições no texto |

Isso não é “100% de acerto”: a referência foi gerada por IA e conferida pelo usuário, o documento foi usado no desenvolvimento e a regra de vigência reúne trechos adicionais. Não há métricas formais nem garantia de generalização. Nenhum documento reservado foi executado e não houve integração ao aplicativo ou deploy.

## Próxima verificação proposta após 0.1.4

**GPT recomendado: Médio.** Executar outro contrato do conjunto de desenvolvimento, preservando resultados e registrando campos não identificados ou divergentes. Usar Alto se forem necessárias novas mudanças nas regras. A avaliação formal continua dependendo de gabarito independente e versões congeladas.

Cada alteração deve preservar evidências, não inferir parcelas e ser verificada com exemplos distintos deste PDF. Reexecutar em pasta nova e comparar com esta saída original. Manter o conjunto reservado fora dos ajustes. A anotação independente E03 continua pendente para a avaliação formal.

## Verificação de regressão 0.1.5 — 14/10/2026

A rodada `E04-20261014T090254634508Z-b8f830` preservou integralmente os cinco campos da rodada final 0.1.4, incluindo valores, evidências, regras e motivos. JSON e evidências validados. Comparação de hashes e catálogo preservados na pasta da rodada. A correção de títulos aplicada a Mafra está descrita no [diagnóstico complementar](diagnostico-pub-alu-02.md); não representa nova avaliação de precisão.

## Verificação de regressão 0.1.6 — 14/10/2026

A rodada `E04-20261014T090729698879Z-8172e6` manteve integralmente os cinco campos da rodada final 0.1.5. JSON e evidências validados; catálogo, hashes e comparação preservados na pasta da rodada. A mudança de valor mensal de Mafra está no [diagnóstico complementar](diagnostico-pub-alu-02.md). Sem nova avaliação de precisão.

## Verificação de regressão 0.1.7 — 14/10/2026

A rodada `E04-20261014T091122874013Z-7cde81` manteve integralmente os cinco campos da rodada final 0.1.6. JSON e localização literal das evidências validados; catálogo, hashes e comparação preservados na rodada. A mudança no vencimento de Mafra está no [diagnóstico complementar](diagnostico-pub-alu-02.md). Sem avaliação formal de precisão.

## Verificação de regressão 0.1.8 — 14/10/2026

A rodada `E04-20261014T091642513760Z-f9833f` manteve integralmente os cinco campos da rodada final 0.1.7. JSON e localização literal das evidências validados; catálogo, hashes e comparação preservados. A correção de IVAR de Mafra está no [diagnóstico complementar](diagnostico-pub-alu-02.md). Sem avaliação formal de precisão.
