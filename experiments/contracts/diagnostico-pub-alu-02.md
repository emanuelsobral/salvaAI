# Diagnóstico de desenvolvimento — contrato de Mafra

Em **14/10/2026**, o extrator **0.1.4** processou `pub-alu-02` em 461 ms, mas não preencheu nenhum dos cinco valores: quatro ficaram não identificados e o reajuste ficou ambíguo. O JSON e a localização literal das evidências passaram na validação técnica. Isso não significa que a extração esteja correta.

## Conferência das informações

As páginas físicas 2 e 3 foram conferidas visualmente e comparadas ao texto extraído. Esta é uma análise técnica feita com apoio de IA, após conhecer a saída, **não um gabarito humano independente**. A ficha de anotação não foi preenchida nem alterada.

| Campo | Saída 0.1.4 | Informação observada e próximo cuidado |
|---|---|---|
| Valor da parcela | Não identificado | Página 2, cláusula quinta: valor mensal de **R$ 8.825,50** pela locação. Reconhecer essa associação sem usar o valor total da tabela. |
| Número de parcelas | Não identificado | A tabela da página 1 contém unidade mês e quantidade 12; isso não basta para declarar “12 parcelas”. Manter a abstenção até a anotação independente verificar o campo. |
| Vencimento | Não identificado | Página 2, cláusula sexta: pagamento no prazo de **30 dias após o protocolo da nota fiscal**, devidamente atestada. Preservar evento e condição; não inventar uma data de calendário nem o dia 30 do mês. |
| Vigência | Não identificado | Página 3, cláusula oitava: **12 meses a partir da assinatura**, com possibilidade de prorrogação por termo aditivo. Reconhecer duração e regra, sem calcular datas. |
| Reajuste | Ambíguo | Página 3, cláusula sétima: **IVAR**, com intervalo mínimo de um ano, condições de negociação e termo aditivo. A correção por atraso usa INPC em outra cláusula e não deve substituir o índice do reajuste. |

## Causas identificadas no código

1. **Vigência:** `trechos_vigencia` descarta trechos que começam por “CLÁUSULA”. Neste PDF, o título e o conteúdo vêm juntos, sem linha vazia entre eles. Assim, a cláusula oitava inteira deixa de chegar à regra de duração. A expressão de duração já contempla “vigência por 12 (doze) meses”; o primeiro ajuste deve ser na separação do título e do corpo.
2. **Valor:** as associações atuais exigem aluguel, mensalidade ou parcela/prestação. A redação “pela locação do imóvel o valor mensal de” não está contemplada. Além disso, a separação atual de itens do valor cobre numeração decimal, não todos os títulos de cláusulas.
3. **Vencimento:** o reconhecimento atual não cobre adequadamente pagamento em prazo contado após um evento, como protocolo da nota fiscal.
4. **Reajuste:** IVAR não está na lista de índices reconhecidos. Também há vários trechos relacionados ao reajuste que viram candidatos distintos; adicionar apenas o nome do índice não resolve necessariamente a ambiguidade. O texto extraído contém palavras partidas, como “anua is” e “míni mo”, que exigem cuidado adicional.

## Correção 0.1.5 — 14/10/2026

A vigência agora é reconhecida como **12 meses a partir da assinatura**, com condições de prorrogação preservadas. Início e término permanecem nulos: nenhuma data foi calculada. Os outros quatro campos ficaram integralmente idênticos à saída 0.1.4 e ainda precisam da análise indicada acima.

O extrator mantém título e corpo da cláusula no mesmo trecho literal, preservando o contexto que diferencia reajuste de prazo contratual. Títulos isolados, inclusive quebrados em linhas maiúsculas, não fornecem valores. Limitação conservadora: corpo inteiramente em maiúsculas nesse formato também não é reconhecido. Cláusulas sem quebra entre título e corpo permanecem fora deste ajuste. Evidências podem conter parágrafos acessórios e rodapés da mesma cláusula; ainda exigem revisão de relevância e completude.

Nove testes novos cobrem a falha, condições, títulos isolados/quebrados, reajuste, itens numerados, conflitos, negação, duração inválida e página física. **86 testes Python e sete Node aprovados (93 no total).** A falha foi reproduzida antes da correção. Os dois resultados finais passaram no esquema e na localização literal das evidências.

Rodadas finais:

- Mafra: `runs/E04-20261014T090253662658Z-1a594e/` — vigência reconhecida; quatro outros campos idênticos à 0.1.4.
- Cruz das Almas: `runs/E04-20261014T090254634508Z-b8f830/` — os cinco campos integralmente idênticos à 0.1.4.

Cada rodada preserva manifesto, saída, páginas, catálogo complementar e comparação de hashes/campos. As tentativas intermediárias `E04-20261014T090110483106Z-3bf55f` e `E04-20261014T090112159850Z-00bade` também foram preservadas: a segunda revelou um título quebrado incluído indevidamente entre as condições, corrigido antes das rodadas finais. Seus manifestos distinguem as revisões pelo hash das regras.

## Correção 0.1.6 — 14/10/2026

O valor mensal passou de não identificado para **BRL 8825.50**, com evidência literal da página 2. A nova associação reconhece “locação do imóvel o/no valor mensal de”. Itens de valor também são separados pelos títulos de cláusulas, sem modificar a segmentação dos demais campos.

A redação completa “não podendo este ser alterado durante a vigência do contrato, salvo os casos de reajustes anuais previstos neste instrumento” é tratada como manutenção do valor base até reajuste futuro. Essa exceção é restrita a um único candidato dessa nova associação e à ressalva no final do trecho; não elimina negações anteriores, descontos entre parênteses ou condições adicionais. A variante de texto extraído “anua is” é aceita somente nesse padrão. Toda a evidência original, incluindo a ressalva, permanece na saída. Não há reconciliação entre valores numéricos e por extenso nem compreensão geral de condições contratuais.

Oito testes novos; **94 Python e sete Node aprovados (101 no total)**. Cobertura: valor mensal versus total, cláusula vizinha, ressalva de reajuste, negação, desconto, multa, entrada, valores concorrentes, moeda malformada, indicação restrita de RS e evidência por página. Falhas de reconhecimento reproduzidas antes da correção.

- Mafra: `runs/E04-20261014T090728705105Z-be6fef/` — valor reconhecido; outros quatro campos integralmente idênticos à 0.1.5.
- Cruz das Almas: `runs/E04-20261014T090729698879Z-8172e6/` — cinco campos integralmente idênticos à 0.1.5.

Dois JSONs e localização literal das evidências validados. Catálogo, hashes e comparações preservados nas rodadas. Vencimento continua não identificado, reajuste ambíguo e número de parcelas não inferido. A execução não preenche gabarito nem mede precisão.

## Correção 0.1.7 — 14/10/2026

O vencimento passou de não identificado para **outra regra: pagamento no prazo de 30 dias após o protocolo da nota fiscal, devidamente atestada**. A saída mantém o trecho completo da página física 2, incluindo a condição de entrega e as instruções da nota fiscal presentes no mesmo bloco. `data` e `dia` permanecem nulos: o extrator não calcula uma data nem interpreta o prazo como dia 30 do mês.

A nova regra exige associação entre pagamento, prazo numérico em dias e protocolo, recebimento ou apresentação da nota fiscal. Reconhece dias úteis/corridos e as formas “após”, “a contar do/da” e “a partir do/da”, preservando-as literalmente. Prazo zero, número malformado, lacunas, negação, data inválida e eventos incompletos ou desconhecidos não fornecem valor; encargos e término contratual não viram vencimento. Prazos concorrentes em trechos distintos geram ambiguidade. Mais de um prazo reconhecido no mesmo trecho provoca abstenção.

Oito testes novos; **102 Python e sete Node aprovados (109 no total)**. As falhas foram reproduzidas antes da correção. Cobertura inclui condições, página física, unidades, data do evento sem cálculo, negação, multa/juros, informação incompleta, números de outras obrigações e concorrência.

- Mafra: `runs/E04-20261014T091121570273Z-4f480a/` — vencimento reconhecido; outros quatro campos integralmente idênticos à 0.1.6.
- Cruz das Almas: `runs/E04-20261014T091122874013Z-7cde81/` — cinco campos integralmente idênticos à 0.1.6.

Os dois JSONs e a localização literal das evidências foram validados. Saídas, manifesto, catálogo e comparação de hashes preservados. Limites: vocabulário restrito a esses eventos da nota fiscal, sem calendário de dias úteis, compreensão geral de condições, reconciliação entre numeral e extenso ou resolução de condições em outras páginas. Isso não constitui avaliação formal de precisão nem gabarito independente.

## Correção 0.1.8 — 14/10/2026

O reajuste passou de ambíguo para **IVAR, com periodicidade de 12 meses**, mantendo no texto a qualificação de intervalo mínimo, a contagem desde a assinatura ou último reajuste, a negociação em caso de desproporção ao mercado e a formalização por termo aditivo. A periodicidade não é uma data calculada nem promessa de aplicação automática: condições continuam na regra literal.

A extração de reajuste agora tem segmentação própria. Cláusulas com título explícito “DO REAJUSTE” reúnem seus parágrafos até o próximo título ou fim da página. A remissão anual específica na cláusula de valor é preservada como evidência complementar, em vez de competir com a cláusula principal. Períodos contraditórios continuam ambíguos. O INPC previsto para atraso não foi incorporado ao reajuste.

Onze testes novos; **113 Python e sete Node aprovados (120 no total)**. Cobertura inclui IVAR e seu nome, limites da sigla, cláusulas complementares, índice substituto, conflitos entre índices/períodos, título isolado, negação, periodicidade inválida, referência anual conflitante, evidências e páginas. As falhas foram reproduzidas antes da correção.

- Mafra: `runs/E04-20261014T091641028831Z-2f79b0/` — IVAR e 12 meses reconhecidos; outros quatro campos integralmente idênticos à 0.1.7.
- Cruz das Almas: `runs/E04-20261014T091642513760Z-f9833f/` — cinco campos integralmente idênticos à 0.1.7.

JSONs e localização literal das evidências validados. Saídas, manifestos, catálogo e comparações de hashes preservados. Nenhum gabarito foi preenchido e nenhuma métrica formal foi calculada.

Limites: títulos e conectores reconhecidos são restritos; não há associação automática entre páginas, compreensão jurídica geral, resolução de aditivos ou garantia de identificar toda contradição. A regra literal pode conter trechos acessórios. O esquema não separa “intervalo mínimo” em atributo próprio, por isso essa qualificação deve ser lida na regra. Número de parcelas continua não identificado, sem inferência pelo valor total ou duração.

## Sequência proposta

**Lote de desenvolvimento executado.** O [relatório da rodada 0.1.8](regressao-desenvolvimento-018.md) registra 14 processamentos e duas falhas de leitura nos 16 documentos originais, além de problemas de vigência/vencimento. Próximo passo: corrigir os achados com **Alto**, mantendo os dez documentos reservados fora dos ajustes.

Não inferir quantidade de parcelas a partir de duração ou divisão de valores. A anotação humana independente continua necessária para a avaliação formal.

## Rastreabilidade e limites

- Rodada: `runs/E04-20261014T085612705873Z-51c6e7/`.
- Preservados: resultado bruto, páginas extraídas, log de erros, manifesto e cópia do catálogo complementar.
- PDF SHA-256: `ff86412a437af5bf1d146c94b11feca5342c953f28a07f4c3f8ff9bfc17567f2`.
- Regras SHA-256: `4a7aa3ed6547e669d2945a8d20dbea462b129f6cae266b45984e1779cf1bfe67`.
- Catálogo complementar SHA-256: `3dd561aa1d38bbdd43edc34e38bcecbafc4a929504a9fec3ab5c78ec97dab947`.
- Fonte: contrato 054/2024 do Município de Mafra, no catálogo `amostra-preenchidos-v1.json`.
- Nenhuma regra alterada nesta rodada. A aprovação anterior dos 84 testes não equivale a cobertura deste contrato; a suíte não foi repetida nesta etapa de execução e documentação.
- Sem chamadas de API, métricas formais, execução dos dez PDFs reservados, alteração no aplicativo ou publicação. E03 continua pendente; esta rodada não inicia E05.
