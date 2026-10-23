# Pendências do lote de desenvolvimento — diagnóstico 0.1.21

**20/10/2026.** O próximo ajuste será reconhecer vigências ligadas ao curso e à sua conclusão, conservando a regra literal e sem inventar datas. A triagem também identificou conflito entre valores numéricos e por extenso, opções de pagamento, tabelas e remissões que exigem tratamentos distintos.

Esta etapa apenas diagnostica e prioriza. O extrator permanece em **0.1.21**. Foram inventariados os cinco campos de cada um dos **18 documentos de desenvolvimento** a partir da rodada preservada em 19/10/2026; os PDFs não foram reextraídos. A conferência dos hashes, do esquema e das evidências foi repetida. Os dez documentos reservados não foram acessados.

## Situação atual

| Campo | Encontrado | Não identificado | Ambíguo | Erro de leitura |
|---|---:|---:|---:|---:|
| Valor da parcela | 2 | 14 | 0 | 2 |
| Número de parcelas | 1 | 15 | 0 | 2 |
| Vencimento | 3 | 12 | 1 | 2 |
| Vigência | 5 | 10 | 1 | 2 |
| Reajuste | 3 | 9 | 4 | 2 |
| **Total** | **14** | **60** | **6** | **10** |

São **76 campos pendentes de resolução técnica ou esclarecimento**, em 90. “Encontrado” é a declaração do protótipo, não um acerto confirmado. “Não identificado” não prova ausência no documento. Os estados não medem precisão, revocação ou conclusão do projeto.

Os dez erros de leitura pertencem a dois PDFs (sau-04 e sau-05): cada arquivo tem 37 páginas registradas como sem camada de texto. Os outros 16 concluíram o processamento. A conferência estrutural aprova também as saídas que registram falhas; não transforma falha em sucesso de extração.

## Inventário por documento

| Documento | Encontrado | Não identificado | Ambíguo | Erro de leitura |
|---|---:|---:|---:|---:|
| alu-01 | 0 | 4 | 1 | 0 |
| alu-02 | 1 | 4 | 0 | 0 |
| edu-01 | 1 | 4 | 0 | 0 |
| edu-04 | 0 | 5 | 0 | 0 |
| edu-05 | 0 | 5 | 0 | 0 |
| edu-06 | 0 | 5 | 0 | 0 |
| edu-07 | 0 | 5 | 0 | 0 |
| edu-09 | 2 | 3 | 0 | 0 |
| fin-01 | 0 | 4 | 1 | 0 |
| fin-04 | 0 | 5 | 0 | 0 |
| fin-05 | 0 | 4 | 1 | 0 |
| pub-alu-02 | 4 | 1 | 0 | 0 |
| pub-alu-03 | 4 | 1 | 0 | 0 |
| sau-01 | 1 | 3 | 1 | 0 |
| sau-04 | 0 | 0 | 0 | 5 |
| sau-05 | 0 | 0 | 0 | 5 |
| sau-07 | 1 | 3 | 1 | 0 |
| sau-09 | 0 | 4 | 1 | 0 |

O inventário local contém as 90 combinações documento/campo, motivo fornecido pelo extrator, páginas de evidência e origem. Os 60 campos não identificados continuam com causa específica não confirmada individualmente. As observações abaixo são uma triagem dirigida do texto já extraído e dos diagnósticos anteriores, não revisão visual integral ou gabarito.

## O que explica as pendências observadas

| Grupo | Evidência técnica | Tratamento indicado |
|---|---|---|
| Lacunas explícitas | alu-01, p. 1: valor, dia e duração em branco. alu-02, p. 1: valor e prazo com marcadores. edu-01, p. 1: marcadores em valores, quantidade e vencimento. | Manter abstenção nos campos sem conteúdo; não preencher por contexto ou cálculo. Não atribuir automaticamente essa causa aos demais campos desses documentos. |
| Remissão a outra informação | edu-05, p. 4: valor remetido a anexo. fin-04, pp. 1–2: primeira parcela e valor dependem do quadro do crédito. sau-01, p. 30: formulário de vencimento/mensalidade sem preenchimento evidente no texto. | Registrar dependência; não substituir por multa, valor de material ou prazo incidental. Confirmar layout antes de declarar ausência definitiva. |
| Vigência relacionada ao curso | edu-05, p. 7: duração equivalente ao curso/plano escolhido. edu-07, p. 7: conclusão das atividades e recebimento dos documentos finais, com possibilidade de rescisão. | Reconhecer regra literal, preservando dependências e condições. Datas e duração numérica continuam nulas quando não explícitas. |
| Opções de pagamento e tabelas | edu-04, p. 2: pagamento à vista ou seis parcelas, primeira na matrícula e tabela das demais datas. edu-07, pp. 2–3: preços por perfil/formação, matrícula e opções de pagamento. edu-09, pp. 2–3: anuidades por modalidade. | Não assumir qual opção foi escolhida nem dividir anuidade para inventar parcela. Preservar alternativas antes de ampliar extração. |
| Divergência no próprio texto extraído | edu-06, p. 1: adesão de 197,00 acompanhada de “cento e cinquenta”; prestação de 289,00 acompanhada de “duzentos e cinquenta”. | Antes de reconhecer esses valores, reproduzir o conflito em teste e abster-se de escolher automaticamente entre algarismos e extenso. A relação entre taxa e dez pagamentos também deve ser preservada. |
| Cronograma por fases | fin-05, p. 3 e condições complementares: carência, amortização, liberação e dia útil; fin-04 depende de quadro externo à regra principal. | Separar eventos/fases. Não promover um vencimento parcial a calendário completo. |
| Modalidades e objetos de reajuste | fin-01: prestação, saldo, seguro e administração. sau-01: anual e faixa etária. sau-07: anual, técnico e faixa etária. sau-09: contribuição, limites e bases. | Preservar abstenção até vincular cada critério ao seu objeto; o esquema atual não permite um conjunto estruturado de modalidades. |
| Leitura do PDF | sau-04 e sau-05: ausência de camada de texto em todas as páginas. sau-07 e edu-07 também mostram trechos com ordem/espaçamento problemáticos. | Tratar OCR e qualidade de texto separadamente; não compensar leitura incompleta com suposições financeiras. |

As seis ambiguidades atuais são: vigência de alu-01; vencimento de fin-05; reajuste de fin-01, sau-01, sau-07 e sau-09. Não há motivo para forçar um resultado nos seis: lacuna, dependência ou múltiplas modalidades podem justificar abstenção.

Os dois contratos complementares de aluguel continuam com quatro campos encontrados e número de parcelas não identificado em cada um. Não converter duração de vigência ou divisão de valores em quantidade expressamente contratada.

## Ordem das próximas entregas

| Prioridade | Trabalho | Critério de conclusão | Nível |
|---|---|---|---|
| 1 — próxima | Vigência por curso/evento em edu-05 e edu-07 | Regras literais com condições, sem inventar datas/meses; testes de negação, evento incidental e rescisão; regressão dos 18 documentos. | Alto |
| 2 | Divergências entre algarismos e extenso, antes de ampliar valores | Caso edu-06 reproduzido; nenhuma escolha silenciosa de valor; taxa de adesão separada de prestação. | Alto |
| 3 | Alternativas e tabelas escolares | Casos edu-04/edu-07 preservam escolha não informada e cronograma, sem assumir plano ou valor único. | Alto |
| 4 | Cronogramas financeiros e reajustes por objeto | Relações entre fases/objetos explícitas; abstenção mantida quando houver dependência não resolvida. | Alto |
| 5 | OCR local para contratos | Saída OCR separada da camada original, com evidências e falhas preservadas; primeiro piloto nos dois documentos de desenvolvimento sem texto. | Alto |
| 6 | Ampliar a amostra preenchida | Novos documentos com procedência e divisão registradas, sem reutilizar os dez reservados para ajustes. | Alto |

As prioridades são técnicas, não prazos. Avaliação independente continua separada; sua pendência não bloqueia o desenvolvimento assistido autorizado pelo usuário.

## Verificação e progresso

Conferidos os arquivos do manifesto da rodada, os hashes dos 18 PDFs e a igualdade do código/protocolo/esquema atual com suas cópias na rodada. As 18 saídas passaram novamente na validação do esquema e localização literal das evidências. A contagem fecha em 18 × 5 = 90, sem repetição de documento/campo.

A suíte de **259 testes aprovada em 19/10/2026** continua sendo a última execução de testes; não foi repetida nesta etapa documental, pois não houve alteração no extrator. Não houve atualização de gabarito, chamada de API, integração ao aplicativo ou deploy.

**Diagnóstico concluído: 100% (3/3: inventário, triagem/priorização, documentação/verificação). Experimento original: 29% (2/7 etapas).** Este percentual não representa acurácia nem percentual global do SalvaAI.

## Rastreabilidade

Rodada de origem: `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E04-lote-0121-final-20261019-8bb8d9`.

Inventário e conferência desta etapa: `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E04-diagnostico-0121-20261020-fc8eae`.

## Atualização posterior — 20/10/2026

A prioridade 1 foi implementada na [versão 0.1.22](vigencia-curso-0122.md): edu-05 e edu-07 passam a reconhecer vigência por regra literal. Os números acima preservam o diagnóstico da 0.1.21; o novo lote tem 16 campos encontrados e 58 não identificados, mantendo seis ambíguos e dez com erro de leitura. Próxima prioridade: divergências entre números e extenso.

A prioridade 2 foi tratada na [versão 0.1.23](valores-extenso-0123.md), com conferência restrita de extenso e separação de taxas parceladas. Próximo: alternativas e tabelas escolares.

A prioridade 3 recebeu o tratamento conservador da [versão 0.1.24](opcoes-escolares-0124.md): opções e tabelas são preservadas/conferidas, mas a seleção do plano permanece não resolvida. Próximo: cronogramas de financiamento por fase.

## Atualização posterior — 23/10/2026

A parte de cronogramas da prioridade 4 recebeu diagnóstico auxiliar na [versão 0.1.25](cronograma-fases-0125.md), disponível no comando normal. Condições, eventos e dependências são preservados, sem resolver quadros nem gerar calendário. Reajustes por objeto e demais vínculos ainda não resolvidos continuam pendentes. Próximo recorte: piloto de OCR local da prioridade 5. O experimento permanece em 29%; esta entrega técnica terminou em 100%.
