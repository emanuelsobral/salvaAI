# Vigência de contratos de saúde — 0.1.11

**14/10/2026 (America/Sao_Paulo).** O extrator passou a reconhecer o prazo mínimo nos dois casos de desenvolvimento revisados e o início explícito em um deles. A correção funciona localmente, sem IA. Não representa validação geral de contratos de saúde.

## Resultado nos documentos

| Documento | Antes: 0.1.10 | Depois: 0.1.11 | Limite preservado |
|---|---|---|---|
| `sau-01` | Vigência não identificada | Mínimo de 12 meses, com evidência na página física 9 | O início depende do primeiro entre assinatura do instrumento, assinatura da proposta e pagamento da mensalidade. Nenhum evento foi escolhido e nenhuma data foi calculada. Renovação automática preservada na regra. |
| `sau-07` | Vigência não identificada | Início em 01/12/2019 (página física 23) e mínimo de 12 meses (página física 24) | Vigência de cada beneficiário e portabilidade permanecem como condições textuais. A renovação por prazo indeterminado não substitui o prazo inicial; o fim continua nulo. |

O esquema congelado não tem atributo próprio para “mínimo”. `duracao_meses: 12` deve ser lido junto à `regra`, que preserva essa qualificação. `prazo: determinado` descreve o período inicial reconhecido, sem estabelecer término da relação contratual. Não se pode usar esse número isolado para criar 12 pagamentos ou uma data de encerramento.

## O que mudou

- Reconhecimento de “prazo mínimo de” e “vigência mínima de”, sem converter duração em número de parcelas.
- Reconhecimento da data ligada à expressão “início de vigência do contrato dar-se-á no dia”.
- Separação dos parágrafos de cláusulas intituladas “Duração do contrato”, para distinguir o contrato do beneficiário.
- Preservação literal da regra de início pelo primeiro evento de uma lista restrita de assinaturas/pagamento. Outras alternativas continuam sem seleção automática.
- Exclusão de rodapé D4Sign identificado por UUID e início do texto de verificação, somente na busca de vigência. As páginas brutas ficam intactas.

Os testes também cobrem data impossível, prazo zero, negação, durações concorrentes, ausência do critério de precedência, renovação, carência e evidências em páginas distintas. São oito testes novos: as falhas relevantes foram reproduzidas antes da correção. Ao final, **136 testes Python e sete Node passaram — 143 no total**.

## Conferência do lote

Reexecutados os 18 documentos de desenvolvimento, comparando os cinco objetos de campo completos com o lote 0.1.10: **somente as vigências de `sau-01` e `sau-07` mudaram; os outros 88 objetos ficaram idênticos**. Os 18 JSONs passaram na validação de esquema e localização literal das evidências. Os dois contratos institucionais complementares permaneceram integralmente iguais.

O processamento concluiu em 16 documentos. `sau-04` e `sau-05` continuam com falha de leitura, sem texto extraível nas 37 páginas de cada PDF. Não foi executado OCR.

| Campo | Encontrado | Não identificado | Ambíguo | Erro de leitura |
|---|---:|---:|---:|---:|
| Valor da parcela | 2 | 14 | 0 | 2 |
| Número de parcelas | 1 | 15 | 0 | 2 |
| Vencimento | 4 | 12 | 0 | 2 |
| Vigência | 5 | 10 | 1 | 2 |
| Reajuste | 3 | 9 | 4 | 2 |

Esses são estados declarados pelo extrator, não acertos medidos. A inspeção foi técnica sobre texto extraído, sem nova revisão visual integral ou gabarito humano independente. As regras ainda dependem de construções textuais específicas e podem omitir outras formas; blocos de condições podem incluir trechos extensos de rescisão. Não há interpretação jurídica geral nem garantia de completude.

## Rastreabilidade e sequência

- Rodada: `runs/E04-lote-0111-20261015T021701944241Z/` (nome em UTC; data local 14/10/2026).
- Referência: `runs/E04-lote-0110-20261015T020746051662Z/`.
- Regras SHA-256: `246011c7594deb68a9ab5f1d4f46eba35092305ef71f5d8bff7038423babc7df`.
- Identidade dos 18 PDFs conferida contra os catálogos e a referência. Versão e hash das regras conferidos nos manifestos e ao final do lote.
- Resultados, páginas, erros, manifestos, comparações, catálogos, rotina de execução e resumo preservados. Os dez documentos reservados não foram processados. Nenhuma ficha de gabarito foi preenchida ou alterada.

**Próximo passo: conferir a completude do vencimento de `fin-05`, com nível Alto.** A regra encontrada trata da primeira prestação quando não há carência. É necessário examinar as outras condições antes de considerar o campo completo. Depois seguem reajustes ambíguos, avaliação de OCR e ampliação/anotação independente da amostra.
