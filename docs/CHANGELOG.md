# Registro de mudanças

## 24/10/2026 — Publicação das atualizações acumuladas

- Publicadas as regras Firestore validadas e a atualização de recorrências, conciliação, importação CSV/OFX/PDF, OCR local e operação sem IA na Netlify.
- README reorganizado com funcionalidades disponíveis, limites, mudanças e estado da publicação; protótipo de contratos permanece separado do aplicativo.
- Corrigido bloqueio do scanner causado pelo identificador público do projeto na documentação, sem desativar a verificação de segredos.
- 129 testes do aplicativo, dois testes no emulador e build aprovados; lint com cinco avisos conhecidos. Publicação confirmada pela API e arquivos OCR presentes. Validação visual pós-deploy pendente por bloqueio da revisão automática do navegador.
- [Registro da publicação](deploy-2026-10-23.md). Publicação concluída; K07 em validação dos fluxos de produção. Experimento de contratos permanece em 29%.

## 23/10/2026 — Contratos: diagnóstico de cronogramas por fase 0.1.25

- Comando de extração passa a salvar diagnóstico auxiliar de carência, amortização, eventos e dia útil, com evidências e dependências. Nenhum calendário gerado.
- Frequência de cobrança separada do cálculo de juros; prazos relativos com extenso conferidos no formato suportado. Leitura incompleta bloqueia o diagnóstico.
- Manifesto inclui os módulos auxiliares e o hash do novo arquivo; gravação consistente entre plataformas.
- 24 testes novos; 327 totais aprovados. 18 saídas validadas; os 90 campos oficiais permanecem idênticos à 0.1.24.
- [Detalhes e limites](../experiments/contracts/cronograma-fases-0125.md). Próximo: piloto de OCR local para contratos, com Alto. Entrega 100%; experimento original 29%.

## 20/10/2026 — Contratos: alternativas e tabelas escolares 0.1.24

- Reconhecidas alternativas de pagamento e preços por perfil, sem converter uma opção em plano confirmado. Matrícula e condições preservadas nas evidências.
- Conferência restrita de tabela: sequência, valores, datas, referência mensal, primeira parcela por matrícula e continuação entre páginas. Diagnóstico auxiliar preservado na rodada, sem alterar o esquema oficial.
- Opções de taxa, material e segunda via identificadas pelo contexto não definem o plano principal. Divergências de extenso mantêm prioridade.
- Dezesseis testes novos; 303 totais aprovados. 18 saídas validadas; seis campos com diagnóstico específico e 84/90 objetos idênticos à 0.1.23.
- [Detalhes e limites](../experiments/contracts/opcoes-escolares-0124.md). Próximo: cronogramas por fase, com Alto. Entrega 100%; experimento original 29%.

## 20/10/2026 — Contratos: conferência de valores por extenso 0.1.23

- Divergência entre quantia numérica e extenso associado à mensalidade/parcela provoca abstenção; extenso não suportado recebe motivo próprio, sem falsa confirmação de conflito.
- Taxas de adesão/matrícula parceladas identificadas pelo prefixo deixam de ser tratadas como mensalidade. A notação Nx é usada apenas para diagnóstico, sem ampliar extração de valores.
- Dezesseis testes novos; 287 totais aprovados. 18 saídas validadas; apenas dois campos alterados e 88/90 idênticos à 0.1.22.
- [Detalhes e limites](../experiments/contracts/valores-extenso-0123.md). Próximo: alternativas e tabelas escolares, com Alto. Entrega 100%; experimento original 29%.

## 20/10/2026 — Contratos: vigência por curso/evento 0.1.22

- Reconhecidas duração equivalente ao curso/plano e vigência até conclusão das atividades, mantendo condições e documentos finais na regra literal.
- Datas e meses não são inferidos. Separação de itens e títulos colados restrita às páginas com a nova declaração; negações, lacunas e prazos concorrentes provocam abstenção.
- Doze testes novos; 271 totais aprovados. 18 saídas validadas; apenas duas vigências alteradas, com 88/90 campos idênticos à 0.1.21.
- [Detalhes e limites](../experiments/contracts/vigencia-curso-0122.md). Próximo: divergências entre números e extenso, com Alto. Entrega 100%; experimento original 29%.

## 20/10/2026 — Contratos: diagnóstico de pendências da 0.1.21

- Inventariados 90 campos nos 18 documentos de desenvolvimento: 14 encontrados, 60 não identificados, seis ambíguos e dez com erro de leitura. Contagens de estado, sem métricas de acerto.
- Identificadas formas de vigência por curso/evento, alternativas de pagamento, divergências entre números e extenso e limitações de leitura para orientar próximas correções.
- Conferidos hashes, esquema e evidências das 18 saídas; código preservado na 0.1.21. Os 259 testes da entrega anterior não foram repetidos nesta etapa documental.
- [Diagnóstico e prioridades](../experiments/contracts/pendencias-desenvolvimento-0121.md). Próximo: vigência por curso/evento, com Alto. Etapa 100%; experimento original 29%.

## 19/10/2026 — Contratos: reajuste periódico e revisão excepcional 0.1.21

- Preservados critérios e requisitos das duas modalidades em regra literal, sem transferir a frequência anual para a revisão excepcional.
- Consolidação restrita a cláusulas distintas, índice coincidente, requerimento e comprovação; conflitos mantêm abstenção. Esquema 1.0.0 preservado.
- Doze testes novos; 259 totais aprovados. 18 saídas validadas, um reajuste consolidado e 89/90 campos idênticos à 0.1.20.
- [Detalhes e limites](../experiments/contracts/reajuste-revisao-0121.md). Próximo: diagnóstico das pendências no lote de desenvolvimento, com Alto. Entrega 100%; experimento original 29%, sem avaliação independente.

## 19/10/2026 — Contratos: consolidação documental do pagamento 0.1.20

- Consolidado prazo por nota fiscal com requisitos documentais reconhecidos entre páginas, preservando a regra literal e sem calcular datas.
- Casos concorrentes, novos prazos, lacunas e itens não reconhecidos mantêm abstenção.
- Doze testes novos; 247 totais aprovados. 18 saídas validadas, um vencimento consolidado e 89/90 campos idênticos.
- [Detalhes e limites](../experiments/contracts/pagamento-documental-0120.md). Próximo: separar reajuste periódico e revisão excepcional.

## 19/10/2026 — Contratos: condições de pagamento e revisão excepcional 0.1.19

- Preservados trechos de pagamento entre páginas e requisitos de revisão excepcional de preços.
- Respostas locais incompletas sinalizadas como pendentes, sem transferir índice/período entre modalidades.
- Quinze testes novos; 235 totais aprovados. 18 saídas validadas e 88/90 campos idênticos à 0.1.18.
- Desenvolvimento assistido, sem avaliação humana independente. [Detalhes](../experiments/contracts/condicoes-pagamento-revisao-0119.md).

## 19/10/2026 — Contratos: desenvolvimento assistido 0.1.18

- Continuidade sem revisão humana autorizada: referências assistidas preservadas, sem alegação de precisão independente.
- Evidências de vigência separadas de rodapé e cláusulas vizinhas; condições e listas dependentes preservadas.
- Nove testes novos, 220 totais aprovados; 18 resultados validados, 89/90 campos idênticos à versão anterior.
- Próximo: condições de pagamento entre páginas e revisão excepcional de preços. [Detalhes](../experiments/contracts/analise-assistida-0118.md).

## 18/10/2026 — Preparação da anotação independente de pub-alu-02

- Usuário escolheu fazer a leitura e declarou não ter consultado respostas de IA/protótipo desse contrato. Não foi registrada leitura concluída ou revisão independente por outra pessoa.
- Conferidos 28 rascunhos anteriores; um contém referência assistida por IA. Preparado pacote novo na C: com PDF de pub-alu-02, ficha/JSON vazios, instruções e manifesto, preservando arquivos antigos.
- Cópia do PDF verificada pelo hash do catálogo; os cinco campos permanecem vazios e a conferência mantém o formulário pendente. Contrato de desenvolvimento, não teste reservado.
- E03 em andamento: ficha 0/5 campos; progresso formal 29% (2/7). Nenhuma regra, métrica, gabarito aprovado ou deploy produzido nesta preparação.

[Procedimento e localização do pacote](../experiments/contracts/guia-anotacao.md).

## 18/10/2026 — Comparador sintético para preparar a avaliação dos contratos

- Criado comparador local dos cinco campos, com acerto exato/tolerante, precisão, revocação, omissões e erros de alta confiança; denominadores explícitos e agregação por campo/categoria/formato.
- Saídas inválidas e falhas preservadas na contagem; ambiguidades/ilegibilidade reportadas separadamente. Entrada restrita a exemplos; nenhuma avaliação real iniciada.
- Vinte testes novos, 211 totais aprovados e lint sem avisos nos arquivos novos. Demonstração dos quatro cenários do protocolo salva na C:, com entrada bruta, relatório e hashes; sem sobrescrever rodadas.
- Extrator continua 0.1.17; protocolo/esquema intactos. Entrega técnica 3/3 blocos, experimento 29% (2/7). Próximo: E03, anotação independente; E05/E06 reais continuam pendentes.

[Uso, validação e limites](../experiments/contracts/avaliacao-sintetica.md).

## 17/10/2026 — Contratos: condições do cronograma de financiamento

- Protótipo 0.1.17 preserva primeira cobrança de juros após liberação e frequências diferentes durante carência/amortização, sem calcular datas ou escolher calendário único.
- Sete testes novos: 191 testes do experimento aprovados. Dezoito saídas de desenvolvimento validadas; 88 campos idênticos. Acrescentadas uma evidência em fin-04 e duas em fin-05, mantendo estados e valores.
- Entrega 3/3 blocos; progresso formal 29% (2/7). Próximo: preparar comparador com casos fictícios, como apoio à E06, com Alto. Avaliação real continua dependente de gabarito independente e lote congelado.
- Resultados na C:, sem acesso ao conjunto reservado, alteração de gabarito, IA ou deploy.

[Resultados e limites](../experiments/contracts/cronograma-financiamento-0117.md).

## 17/10/2026 — Contratos: objetos do reajuste

- Protótipo 0.1.16 identifica menções a saldo, cota de amortização, seguro, administração, limites e bases de contribuição. Critérios desses componentes ficam pendentes; não são usados como índice geral da parcela.
- Blocos com objetos distintos exigem revisão, preservando texto e condições. Regras simples da obrigação principal continuam disponíveis.
- Nove testes novos: 184 testes aprovados. Dezoito saídas de desenvolvimento validadas; 88 campos idênticos, com apenas justificativas e ordem de evidências alteradas em dois reajustes. Estados e valores preservados.
- Resultados na C:, sem conjunto reservado, mudança de gabarito ou deploy. Entrega 3/3 blocos; experimento 29% (2/7). Próximo: revisar cronograma de financiamento, com Alto.

[Detalhes da validação](../experiments/contracts/objetos-reajuste-0116.md).

## 17/10/2026 — Retomada dos contratos: modalidades de reajuste

- Protótipo local 0.1.15 distingue menções a reajuste anual, técnico e por faixa etária. Negações restritas não viram ausência global, e percentual por idade não vira taxa fixa geral.
- Regra literal e condições preservadas; blocos mistos não recebem uma periodicidade comum por suposição. Justificativas de abstenção identificam as modalidades reconhecidas.
- Oito testes novos e uma expectativa corrigida: 175 testes do experimento aprovados. Lote de 18 documentos validado; apenas três justificativas mudaram, com os outros 87 campos idênticos. Duas falhas de leitura preservadas.
- Resultados na C:, sem IA, conjunto reservado, mudança de gabarito ou deploy. Progresso formal permanece em 29% (2/7); próximo passo: distinguir objetos do reajuste, com Alto. Teste físico de extratos adiado pelo usuário.

[Validação e limites](../experiments/contracts/modalidades-saude-0115.md).

## 17/10/2026 — Qualidade do OCR e revisão em telas pequenas

- Quatro cenários fictícios de imagem adicionados ao formulário local de teste. Resultados documentados: nítida 3/4 movimentos completos; reduzida 3/4 e um saldo pendente de exclusão; inclinada 4/4 após correção de inclinação; degradada 0/4 com orientação manual.
- Corrigida reconstrução de tabelas quando o OCR separa colunas em blocos, sem quebrar cabeçalhos já agrupados. Ativada correção de inclinação do motor. Amostra BB preservada em 6/6 movimentos.
- Aviso de campos vazios, fontes/áreas de toque maiores e revisão conferida em 320 e 390 pixels. Cancelamento preserva edição manual; troca de arquivo descarta resultados antigos.
- Dois testes novos: 129 testes e build aprovados, lint sem novos avisos. Cache/build na C:. Sem deploy ou gravação em contas reais. Teste em celular físico permanece pendente.

[Resultados e reprodução](validacao-ocr-qualidade.md).

## 17/10/2026 — Leitura local da imagem de extratos (OCR)

- Botão de leitura por página quando o PDF não tem texto utilizável, com progresso, cancelamento e revisão obrigatória. Motor e português servidos pelo próprio aplicativo; sem enviar o extrato ou chamar API paga.
- Página BB: 6/6 movimentos com data, valor e C/D conferidos; saldos descartados e seis registros válidos gerados no navegador, sem gravação. Descrições continuam sujeitas a erros de OCR e revisão.
- Recursos carregados sob demanda, imagem limitada e reconhecimento com prazo de 90 segundos. Resultados tardios são descartados após cancelamento/troca de arquivo.
- Oito testes novos; 127 testes, build e lint sem novos avisos. Validação usou cache/build na C: devido à falta de espaço temporária na H:. Sem deploy; amostras privadas fora do Git.

## 17/10/2026 — Extrato Nubank organizado por grupos diários

- Reconhecidos mês abreviado, data e entrada/saída no cabeçalho dos grupos. Totais não entram como movimentos; detalhes quebrados em linhas são reunidos conforme o alinhamento.
- Conferência da soma de cada grupo, com aviso e escolha manual do tipo quando houver divergência. Sem transportar datas entre páginas.
- Amostra com três páginas: 10/10 movimentações conferidas (100% deste arquivo), quatro entradas e seis saídas; totais e diferença entre saldos correspondentes ao original.
- Sete testes novos; 119 testes e build aprovados. Navegador gerou dez registros válidos sem gravar na conta. Amostras anteriores do Itaú preservadas; arquivos privados fora do Git. Sem deploy.

[Detalhes da validação](validacao-extratos-pdf.md).

## 16/10/2026 — Segundo layout Itaú: coluna única de valor e continuação de páginas

- Amostra de 2026 conferida em quatro páginas: 108/108 movimentações com datas, descrições, valores e sinais correspondentes; 36 saldos excluídos e efeito líquido conciliado com os saldos inicial/final.
- Data da coluna separada de referências presentes nas descrições; valores positivos/negativos tratados dentro da tabela reconhecida; continuidade das posições em páginas compatíveis sem repetir datas de outra página.
- Aviso na revisão explica a convenção de sinais. Amostras anteriores preservadas, incluindo o alerta de texto ilegível no BB.
- Seis testes novos: 112 testes do aplicativo e build aprovados; navegador confirmou 108 registros válidos. Arquivo e dados pessoais fora do Git; nenhum lançamento salvo nem deploy realizado.

[Detalhes da validação](validacao-extratos-pdf.md).


## 16/10/2026 — Primeira validação de PDF com Banco do Brasil e Itaú

- Amostra de três páginas conferida: 6 movimentações no BB, 10 no Itaú e uma página de notas. Nenhum lançamento gravado.
- Itaú: corrigidas leitura por colunas, exclusão de saldo/legenda, datas agrupadas e sinal negativo após valor. 10/10 sugestões correspondentes em dia/mês, valor e sinal, com ano confirmado manualmente e totais conferidos no navegador.
- BB: texto interno corrompido agora gera aviso específico; 0/6 sugestões. Mantida a necessidade de transcrição manual ou OCR local.
- Corrigidas omissões de descrições com Total/Saldo/Resumo e escolha indevida entre duas datas; datas inexistentes permanecem pendentes de correção.
- 21 testes novos; 106 testes do aplicativo aprovados, build aprovado e lint sem novos avisos. Amostra original mantida fora do Git; regressões usam dados fictícios. Sem deploy.

[Registro da validação e limites](validacao-extratos-pdf.md).


## 16/10/2026 — Importação genérica de extratos em PDF

- PDF aberto localmente, sem IA, com original por página e sugestões editáveis de lançamentos.
- Conferência obrigatória de datas, descrições, valores e entrada/saída; seleção manual quando há vários valores e inclusão de linhas ausentes.
- Páginas sem texto permitem transcrição manual. Até 10 MB, 50 páginas e 200 lançamentos; OCR e validação de layouts reais ficam pendentes.
- Integrado à importação atômica, deduplicação CSV/PDF e conciliação de contas recorrentes; regras Firebase atualizadas.
- 85 testes do aplicativo e dois no emulador aprovados; build aprovado e revisão no navegador com dados fictícios. Sem publicação.

Detalhes: [importação de extratos](importacao-extratos.md). Entrega genérica local concluída; cobertura de todos os bancos não comprovada. Contratos pausados em 29%.


## 15/10/2026 — Extrator 0.1.14: títulos e referências de reajuste

- Títulos isolados deixam de gerar candidatos; remissões e menções em garantia sem critério explícito permanecem como pendências, com evidências.
- Oito testes novos; 167 testes aprovados. Nos quatro casos diagnosticados, dois títulos filtrados e seis referências reclassificadas; todos continuam ambíguos.
- Lote de 18 documentos validado: apenas evidências de dois reajustes mudaram; os outros 88 campos permaneceram idênticos. Estados/valores finais preservados, assim como duas falhas de leitura.
- Próximo passo: distinguir modalidades de reajuste em saúde, com Alto. Sem alteração de esquema, gabarito, documentos reservados ou deploy.

Registro: [títulos e referências](../experiments/contracts/referencias-reajuste-0114.md).

## 15/10/2026 — Extrator 0.1.13: reajustes compostos

- Fórmulas e componentes técnicos permanecem como regra literal, sem reduzir IGPM + IRT a IGP-M. Percentuais de limite/condição não viram taxa fixa automaticamente; negação técnica não implica ausência global de reajuste.
- Nove testes novos; 159 testes aprovados. Quatro candidatos internos corrigidos em sau-07, com evidência literal preservada.
- Lote de 18 documentos validado: os 90 campos finais ficaram idênticos à 0.1.12; quatro reajustes continuam ambíguos e duas falhas de leitura foram preservadas.
- Próximo passo: separar títulos e referências de regras efetivas, com Alto. Sem mudança de esquema, gabarito, documentos reservados ou deploy.

Registro: [proteção de reajustes compostos](../experiments/contracts/reajustes-compostos-0113.md).

## 15/10/2026 — Diagnóstico dos quatro reajustes ambíguos

- Inspecionados fin-01, sau-01, sau-07 e sau-09 com rastreio dos candidatos. Identificadas modalidades distintas, referências sem regra própria e fragmentação de cláusulas; ambiguidade não comprova contradição no documento.
- Detectada classificação interna incompleta de IGPM + IRT como IGP-M. A saída final continua ambígua; próxima correção será proteger regras compostas, com Alto.
- Regras mantidas em 0.1.12. Os 20 objetos de campo reproduzidos ficaram idênticos; quatro JSONs e evidências validados. Sem nova extração de PDF, alteração de gabarito ou métricas formais.

Registro: [diagnóstico de reajustes](../experiments/contracts/diagnostico-reajustes-0112.md).

## 15/10/2026 — Extrator 0.1.12: vencimento parcial de financiamento

- Identificada omissão de condições de carência, amortização e dia útil em fin-05. O campo agora exige revisão, com valor nulo e evidências, em vez de retornar somente a exceção sem carência.
- Fin-04 mantém vencimento não identificado, com evidência adicional de dia útil. Os outros 88 objetos de campo ficaram idênticos no lote de 18 documentos; duas falhas de leitura preservadas.
- Sete testes novos; 150 testes aprovados. Os 18 JSONs e evidências passaram na validação. Sem métricas de precisão ou cronograma completo implementado.
- Próximo passo: diagnóstico dos quatro reajustes ambíguos, com Alto. Sem alteração de gabarito, execução de documentos reservados ou deploy.

Registro: [vencimento de financiamento](../experiments/contracts/vencimento-financiamento-0112.md).

## 14/10/2026 — Extrator 0.1.11: vigência de saúde

- Reconhecidos prazo mínimo e início explícito nos contratos de saúde revisados. Condições do beneficiário, eventos alternativos e renovação preservados; sem calcular término ou parcelas.
- Oito testes novos; 136 Python e sete Node aprovados. Lote de 18 documentos e evidências validados: duas vigências mudaram, e os outros 88 objetos de campo ficaram idênticos à 0.1.10.
- Duas falhas de leitura conhecidas preservadas. Resultados e comparações registrados; sem métricas formais, alteração de gabarito, execução do conjunto reservado ou deploy.
- Próximo passo: conferir a completude do vencimento de fin-05, com Alto.

Registro: [vigência de saúde e limites](../experiments/contracts/vigencia-saude-0111.md).

## 14/10/2026 — Lote completo de desenvolvimento 0.1.10

- Executados 16 PDFs originais e dois complementares: 16 processados e duas falhas de leitura preservadas. Os 18 JSONs e evidências passaram na validação.
- Dez documentos mantiveram todos os campos da conferência 0.1.10 anterior. Os outros oito foram comparados à 0.1.8, com nove objetos de campo alterados em seis documentos.
- Consolidadas pendências: vigência mínima/início em saúde, vencimento condicional de financiamento, reajustes ambíguos, OCR e gabarito independente. Próxima etapa técnica com Alto.
- Regras inalteradas; resultados, referências e comparações preservados. Sem métricas formais, documentos reservados, integração ou deploy.

Registro: [lote completo e pendências](../experiments/contracts/lote-completo-0110.md).

## 14/10/2026 — Extrator 0.1.10: vigência educacional

- Exigida declaração explícita de prazo/início contratual para interpretar vigência; datas de parcelas, início das aulas, vigência judicial e iniciativa privada deixam de causar conflitos incidentais nos casos revisados.
- Duração anual de edu-01 preservada como regra literal, sem calcular datas ou meses. Edu-04/edu-06 passam de ambíguos para não identificados, sem confirmar ausência documental.
- Sete testes novos; 128 Python e sete Node aprovados. Dez documentos e evidências validados: três vigências alteradas e 47 outros objetos de campo idênticos à 0.1.9.
- Saídas e comparações preservadas. Próximo passo: conferir lote completo de desenvolvimento com Médio. Sem métricas formais, gabarito preenchido, conjunto reservado ou deploy.

Registro: [vigência educacional](../experiments/contracts/vigencia-educacional-0110.md).

## 14/10/2026 — Extrator 0.1.9: regressões de vigência e vencimento

- Corrigidos reconhecimento de vigência em branco, uso incidental de assinatura/posse e seleção indevida de pagamento por evento. Vencimento condicional exige referência temporal, não apenas número financeiro.
- Oito testes novos; 121 Python e sete Node aprovados. Dez documentos reexecutados e JSONs/evidências validados.
- Casos prioritários alu-01, edu-07 e edu-09 corrigidos; cinco campos de cada contrato complementar preservados. Três vigências educacionais continuam ambíguas e foram registradas como próximo trabalho.
- Rodadas intermediária e final preservadas; sem métricas formais, gabarito preenchido, documentos reservados ou deploy.

Registro: [correções e limites](../experiments/contracts/correcoes-regressao-019.md).

## 14/10/2026 — Rodada ampliada de desenvolvimento 0.1.8

- Executados os 16 PDFs originais de desenvolvimento: 14 processados e dois sem camada de texto, com falhas preservadas. Os dez reservados não foram executados.
- Os 16 JSONs e evidências passaram na validação estrutural. Comparação com 0.1.0 registrou 24 objetos de campo alterados e nove mudanças de estado, sem tratar essas contagens como acertos.
- Inspeção identificou vigência em branco marcada como encontrada, bloqueio de regra mensal por detector de evento e vencimento com evidência insuficiente. Correções propostas com Alto.
- Resultados, comparações, manifestos, catálogo e rotina preservados; regras permaneceram em 0.1.8. Sem métricas formais, gabarito preenchido, integração ou deploy.

Registro: [rodada de desenvolvimento](../experiments/contracts/regressao-desenvolvimento-018.md).

## 14/10/2026 — Extrator 0.1.8: reajuste IVAR e condições

- Reconhecido IVAR por sigla/nome; parágrafos de cláusulas explicitamente intituladas de reajuste são reunidos até o próximo título ou fim da página.
- Intervalo mínimo anual e remissão na cláusula de valor tratados com preservação das condições; conflitos mantêm ambiguidade. INPC de atraso não foi incorporado ao reajuste de Mafra.
- Onze testes novos; 113 Python e sete Node aprovados. Mafra retorna IVAR/12 meses com negociação e termo aditivo; quatro outros campos inalterados. Cinco campos de Cruz das Almas idênticos à 0.1.7.
- Dois JSONs e evidências validados; saídas e comparações preservadas. Próximo passo: repetir o lote de desenvolvimento com Médio. Sem métricas formais, integração ou deploy.

Registro: [diagnóstico e comparação](../experiments/contracts/diagnostico-pub-alu-02.md).

## 14/10/2026 — Extrator 0.1.7: pagamento após evento

- Reconhecido pagamento com prazo numérico após protocolo, recebimento ou apresentação da nota fiscal. Evento, dias úteis/corridos e condições ficam no texto, sem data calculada.
- Casos com negação, valores inválidos, lacunas e eventos incompletos mantêm abstenção; multa, juros e término contratual não definem o vencimento.
- Oito testes novos; 102 Python e sete Node aprovados. Mafra retorna 30 dias após protocolo com exigência de nota atestada; quatro outros campos inalterados. Cinco campos de Cruz das Almas idênticos à 0.1.6.
- Dois JSONs e evidências validados, com saídas e comparações preservadas. Próximo ajuste: reajuste IVAR, com Alto. Sem métricas formais, integração ou deploy.

Registro: [diagnóstico e comparação](../experiments/contracts/diagnostico-pub-alu-02.md).

## 14/10/2026 — Extrator 0.1.6: valor mensal da locação

- Reconhecida a associação direta entre locação do imóvel e valor mensal; títulos de cláusulas separam condições do campo de valor.
- Ressalva terminal específica de reajustes anuais permite extrair o valor base, preservando toda a evidência e bloqueios para negação, descontos, encargos e condições adicionais.
- Oito testes novos; 94 Python e sete Node aprovados. Mafra retorna BRL 8825.50, mantendo outros quatro campos; cinco campos de Cruz das Almas idênticos à 0.1.5.
- Dois JSONs e evidências validados; saídas, hashes e comparações preservados. Próximo ajuste: prazo de pagamento por evento, com Alto. Sem métricas formais, integração ou deploy.

Registro: [diagnóstico e comparação](../experiments/contracts/diagnostico-pub-alu-02.md).

## 14/10/2026 — Extrator 0.1.5: títulos e conteúdo da vigência

- Corrigido descarte do conteúdo quando o título da cláusula vinha junto ao corpo. Contexto de reajuste preservado; títulos isolados e quebrados não fornecem valores.
- Nove testes novos; 86 Python e sete Node aprovados. Limites de diagramação documentados.
- Mafra passou a retornar 12 meses a partir da assinatura, com condições e sem datas calculadas. Quatro outros campos inalterados; cinco campos de Cruz das Almas idênticos à 0.1.4.
- Saídas intermediárias/finais e comparações preservadas; dois JSONs e evidências validados. Sem gabarito independente, métricas formais, integração ou deploy.

Registro: [diagnóstico e comparação](../experiments/contracts/diagnostico-pub-alu-02.md).

## 14/10/2026 — Diagnóstico do segundo contrato preenchido

- Executado o contrato de Mafra (`pub-alu-02`) com o extrator 0.1.4: quatro campos não identificados e reajuste ambíguo.
- JSON e localização das evidências validados; conferência visual das páginas 2 e 3 revelou omissões de informações explícitas.
- Saída bruta, manifesto e catálogo complementar preservados. Regras e ficha humana não foram alteradas.
- Próxima correção proposta: separar títulos e conteúdo da vigência, com testes de regressão e nível Alto. Sem métricas formais ou deploy.

Registro: [diagnóstico de Mafra](../experiments/contracts/diagnostico-pub-alu-02.md).

## 13/10/2026 — Extrator 0.1.4: datas e condições de vigência

- Reconhecidas datas com dia numérico e mês em português; início e término complementares são reunidos. Datas conflitantes/inválidas ou associações inseguras mantêm abstenção; datas e duração ausentes não são calculadas.
- Separadas condições de prorrogação, permanência e rescisão das datas principais. Evidências literais preservadas, incluindo isenção de aluguel na restauração. Carimbos digitais identificados não são usados como datas contratuais.
- Onze testes novos; 77 testes Python e sete Node aprovados. Primeira tentativa que ainda ficou ambígua preservada para diagnóstico, com hash das regras usadas.
- Rodada final de `pub-alu-03` reconheceu 01/04/2022 a 01/04/2023, preservando os outros quatro campos da 0.1.3. JSON, evidências, snapshots e hashes conferidos.
- Sem métricas formais, documentos reservados, alterações no aplicativo ou deploy. Próximo passo: verificar outro contrato de desenvolvimento.

Registro: [comparação antes/depois](../experiments/contracts/comparacao-pub-alu-03.md).

## 13/10/2026 — Extrator 0.1.3: valor mensal do aluguel

- Reconhecida a associação “aluguel mensal do imóvel no valor de”, com tratamento restrito de `RS`: exige centavos e indicação de reais após o valor. Texto e evidências originais preservados.
- Para o campo de valor, cláusulas numeradas são separadas para não misturar condições de reajuste com o aluguel. Totais/entradas, condições no mesmo item e conflitos mantêm proteções conservadoras.
- Oito testes novos; falhas reproduzidas antes da correção. 66 testes Python e sete Node aprovados.
- Nova execução de `pub-alu-03` encontrou BRL 2200.00 na página 2, sem usar o total. Outros quatro campos idênticos à 0.1.2; JSON, evidências e hashes conferidos e rodadas preservadas.
- Sem métricas formais, conjunto reservado, mudanças no aplicativo ou deploy. Vigência continua pendente.

Registro: [comparação antes/depois](../experiments/contracts/comparacao-pub-alu-03.md).

## 13/10/2026 — Extrator 0.1.2: vencimento do aluguel

- Reconhecido pagamento “pago mensalmente até” e variações de gênero/plural. Relações de mês subsequente/seguinte/posterior ficam na regra literal, sem gerar data ou dia isolado.
- Incluídas proteções para vencimento do presente contrato, dias explícitos inválidos e negação em blocos de pagamento mensal; evidências originais preservadas.
- Sete testes novos: falhas de reconhecimento e de término contratual reproduzidas antes da correção. 58 testes Python e sete Node aprovados.
- Nova execução de `pub-alu-03` encontrou a cláusula da página 2; os outros quatro campos permaneceram idênticos à 0.1.1. Saída, referência, catálogo e comparação preservados; JSON e evidências validados.
- Sem métricas formais, documentos reservados, mudanças no aplicativo ou deploy. Valor do aluguel e vigência continuam pendentes.

Registro: [comparação antes/depois](../experiments/contracts/comparacao-pub-alu-03.md).

## 13/10/2026 — Extrator 0.1.1: periodicidade do reajuste

- Corrigida a associação indevida entre frequência do aluguel e reajuste. Períodos agora exigem construção explicitamente ligada ao reajuste; formas desconhecidas ficam sem periodicidade e conflitos/valores inválidos geram abstenção.
- Reconhecidos intervalos explícitos em meses/anos, inclusive interregno mínimo, preservando condições e evidência literal. Sem mudança nas regras dos outros quatro campos.
- Sete testes de regressão adicionados e falhas reproduzidas antes da correção. 51 testes Python e sete Node aprovados após a alteração.
- Nova execução de `pub-alu-03` confirmou a mudança de 1 para 12 meses, com regra literal/evidências e demais campos preservados. Saídas, snapshots e comparação de hashes guardados em pastas separadas; JSON validado.
- Referência de IA revisada pelo usuário, sem métricas formais. Nenhum PDF reservado executado, chamada de IA ou deploy.

Registro: [comparação antes/depois](../experiments/contracts/comparacao-pub-alu-03.md).

## 13/10/2026 — Comparação de desenvolvimento de contrato preenchido

- Executado `pub-alu-03` com o extrator 0.1.0, sem alterar regras, usando PDF verificado do catálogo complementar de desenvolvimento.
- Comparado com referência gerada por IA externa e conferida pelo usuário, com procedência explícita. Preservados saída bruta, cópias da referência/catálogo, hashes e comparação por campo.
- Detectados valor e vencimento não identificados, vigência ambígua e periodicidade de reajuste incorreta: um mês em vez do intervalo mínimo de um ano. Número de parcelas não identificado, sem contradição com a referência de ausência.
- Leitura concluída; JSON e localização literal das evidências validados. Sem métricas formais, uso do conjunto reservado, alterações na aplicação ou deploy. Correção das regras permanece próxima etapa.

Relatório: [comparação pub-alu-03](../experiments/contracts/comparacao-pub-alu-03.md).

## 13/10/2026 — E02/E03: correção da seleção de contratos

- Corrigida a indicação de `alu-01` e `edu-04`: ambos são modelos com lacunas, inadequados como exemplos de contratação individual preenchida.
- Obtidos três novos PDFs de fontes oficiais. Dois contratos de locação institucional, com condições financeiras preenchidas e sinais visuais de assinatura, incluídos em catálogo complementar de desenvolvimento. Um terceiro permanece candidato.
- Preparadas duas fichas e dois JSONs vazios. Guia passa a indicar o contrato de Cruz das Almas, de cinco páginas. Anotação humana e coleta de contratos pessoais continuam pendentes.
- Ferramentas de preparação, verificação do catálogo e conferência de gabarito aceitam seleção explícita de catálogo. Piloto original e dez documentos reservados preservados; nenhuma regra de extração modificada.
- 44 testes Python e sete Node aprovados novamente. Sem chamadas de IA, execução do extrator nos novos PDFs ou deploy.

Entrega: [documentos preenchidos e limites da amostra](../experiments/contracts/coleta-preenchidos.md).

## 13/10/2026 — E04: protótipo local; E03: formulários humanos

- Implementado protótipo Python 0.1.0 para PDF → JSON de cinco campos, com evidências, regras, abstenções, confiança média e erros de leitura preservados. Sem API de IA ou integração com o produto.
- Rodadas guardam saída bruta, texto por página, erros e manifesto de hashes/versões. IDs e hashes conhecidos de teste ficam bloqueados nesta etapa.
- Validação técnica: 32 testes específicos do extrator; 16 documentos de desenvolvimento e cinco PDFs fictícios geraram 21 registros válidos no esquema e na posição literal das evidências. Entre os documentos reais, 14 leituras concluíram e duas falharam por ausência de texto. Baixa cobertura registrada, sem estimar acerto.
- Preparados 26 pares de fichas Markdown e rascunhos JSON para anotação humana. Nenhum campo recebeu resposta ou estado de ausência presumido. Conferência recusa pendências, inconsistências de data/página/hash e falsa revisão independente; não certifica conteúdo.
- Verificação acumulada do experimento: 44 testes Python e sete Node aprovados. Sem suíte da aplicação ou deploy. E04 concluída como baseline experimental; E03 aguardando leitura/revisão humana. Ampliação E02 e E05–E07 continuam pendentes.

Entregas: [protótipo](../experiments/contracts/prototipo.md) e [guia de anotação](../experiments/contracts/guia-anotacao.md).

## 13/10/2026 — E02: coleta inicial do experimento de contratos

- Consultadas 31 fontes públicas; obtidos 26 PDFs e preservadas cinco falhas de coleta. Catálogo com origem, data, SHA-256, categoria, páginas, tipo de texto e família.
- Piloto congelado em 16 documentos de desenvolvimento e dez de teste; famílias mantidas juntas. 23 PDFs no estrato principal e três complementares. Sem PDFs idênticos por hash.
- Inspeção visual das primeiras páginas e triagem de texto: 22 PDFs com texto em todas as páginas, um com capa em imagem e três sem texto útil. Originais e imagens permanecem ignorados pelo Git.
- Nove testes locais de integridade aprovados. A primeira execução foi bloqueada pelo acesso do Windows à pasta temporária; a execução autorizada fora do isolamento passou. Suíte da aplicação não executada nesta etapa.
- E02 continua em andamento: meta proposta de 40 não atingida e predominância de modelos/condições gerais. E04 disponível para iniciar (Alto) com a divisão de desenvolvimento. Sem extrator financeiro, gabarito humano, métricas de acerto, chamadas de IA ou deploy.

Entrega: [relatório da coleta](../experiments/contracts/relatorio-coleta.md).

## 13/10/2026 — E01: protocolo de extração de contratos

- Definido protocolo 1.0.0 para cinco campos, evidências, gabarito humano, separação desenvolvimento/teste, confiança e métricas com denominadores explícitos.
- Criado esquema JSON para extração e gabarito, exemplos fictícios identificados e casos de contagem esperados. Dados reais e resultados futuros ficam em pastas ignoradas pelo Git.
- Validação: 18 cenários de esquema aprovados, quatro casos de contagens recalculados e trechos sintéticos conferidos.
- E01 concluída; E02 pronta para iniciar com nível Médio. Sem coleta de contratos reais, implementação do extrator, chamadas de IA ou mudanças no produto/deploy.

Entrega: [experimento de contratos](../experiments/contracts/README.md).

## 13/10/2026 — Planejamento do experimento e níveis do GPT-6

- Acrescentadas sete etapas de um experimento local de extração de contratos, ainda sem implementação ou integração ao SalvaAI.
- Definido nível de raciocínio recomendado para as sete etapas e os 36 cartões existentes, com aviso ao usuário antes de iniciar cada etapa.
- Ultra reservado a investigação excepcional; configuração do modelo não foi alterada. O uso de GPT no desenvolvimento não reativa IA no produto.
- Atualização documental; sem execução de testes da aplicação ou deploy.

## 13/10/2026 — Organização do trabalho em Kanban

- Criado [quadro do projeto](kanban.md) com 36 próximos passos, prioridades, dependências e critérios de conclusão, além de oito entregas existentes agrupadas.
- Agenda de contas definida como próximo desenvolvimento. Backup, regras e publicação têm cartões próprios.
- Lista antiga de pendências atualizada para referenciar o quadro e corrigir recursos já entregues e planejamento de IA.
- Alteração documental: sem mudanças na aplicação, execução de testes ou publicação.

## 12/10/2026 — Edição de recorrências por data

- Edição de valor, frequência, calendário e término por condições sucessivas, sem reescrever o cadastro original.
- Prévia antes/depois, condições atuais, aviso de alterações futuras e histórico na interface.
- Reajustes podem manter o calendário original, inclusive dia 31 e anos bissextos.
- Pagamentos, conciliação e projeções usam o valor correspondente ao vencimento.
- Bloqueio de edições retroativas, versões desatualizadas e alterações sobre vencimentos já pagos. Confirmações de pagamento com valor antigo são recusadas.
- Validação: 79 testes locais e 2 no Firestore Emulator; build e fluxo de navegador em 320/390/1280 pixels aprovados. Permanecem os cinco avisos de lint e o aviso de tamanho do bundle.
- Sem deploy ou migração de dados de produção. As regras pendentes da conciliação continuam necessárias para a publicação completa.

Guia: [Edição de recorrências](edicao-recorrencias.md).

## 12/10/2026 — Conciliação de extratos com recorrências

- Sugestões por valor exato, proximidade de datas e descrição, sempre com escolha explícita.
- Importação pode quitar um vencimento pendente ou aproveitar um pagamento já registrado sem novo débito.
- Extratos já importados podem ser vinculados e desvinculados pela tela de contas recorrentes, preservando o saldo.
- Revalidação atômica e proteção contra concorrência; duplicidades anteriores não são fundidas automaticamente.
- Regras Firestore permitem apenas alteração dos campos de vínculo em despesas importadas. Autorizar escritas idênticas preserva as tentativas concorrentes sem permitir mudanças em valores ou contas.
- Corrigida uma condição de corrida no carregador de módulos do banco simulado dos testes.
- Validação: 70 testes locais, 2 testes com Firestore Emulator, build aprovado e fluxo de navegador com dados fictícios em mobile. Lint sem erros, com os 5 avisos de React já existentes; permanece o aviso de tamanho do bundle.
- Publicação pendente: atualizar as regras Firestore antes da interface. Nenhum dado de produção foi alterado.

Guia: [Conciliação de extratos](conciliacao-extratos.md).

## 12/10/2026 — Contas recorrentes sem IA

- Cadastro semanal, mensal ou anual, com primeiro vencimento e término opcional.
- Consulta por mês e filtro de atrasados; estados pendente, atrasado e pago.
- Registro manual de pagamento na conta corrente com proteção contra duplicidade e estorno pelo histórico.
- Encerramento preserva pendências até hoje e pagamentos; cancela vencimentos futuros não pagos.
- Projeção de 12 meses e alertas incluem as novas recorrências, respeitando término e pagamentos.
- Assinaturas antigas continuam na fatura do cartão.
- Validação: 57 testes locais, 2 testes com Firestore Emulator, build aprovado e teste de navegador com dados fictícios em 320, 390 e 1280 pixels. Lint sem erros, com 5 avisos de React já presentes. Build mantém aviso de tamanho do bundle.
- Não houve publicação, migração de dados reais ou mudança nas regras Firestore.

Guia: [Contas recorrentes](contas-recorrentes.md).

[Índice](README.md) · [Comparação completa](evolucao-antigo-novo.md) · [Pendências](pendencias.md)

Este registro descreve o código local, não releases publicadas. A versão `0.0.0` do pacote React e a versão `1.0.0` da API antiga não formam uma sequência de versões do produto.

## 13/09/2026 — Correções do SalvaAI

### Integridade financeira

- Validação de valores positivos, datas reais, textos obrigatórios e limites de parcelamento.
- Cálculos monetários em centavos e distribuição do resto: R$ 100 em três parcelas resulta em R$ 33,34 + R$ 33,33 + R$ 33,33.
- Movimentações, aportes e pagamentos gravam saldo e histórico juntos em transações Firestore.
- Marcadores impedem reaplicação de uma operação com a mesma identificação; conteúdo diferente com a mesma identificação é rejeitado.
- Criação concorrente de contas padrão e cartão padrão protegida contra duplicação.
- Aportes vinculam as duas movimentações; estorno atualiza ambas as contas e remove os dois registros.
- Pagamentos vinculam parcelas e cobranças de assinaturas da competência. Compras posteriores podem ser pagas sem repetir assinaturas já pagas.
- Estorno de pagamento devolve saldo, reabre parcelas e libera as cobranças correspondentes.
- Registros antigos sem vínculos suficientes são bloqueados para conciliação.
- Cancelamento de assinatura preserva o registro histórico.

### Indicadores e calendário

- Farol considera saldo geral, parcelas vencidas, fatura do mês e despesas comuns pendentes aplicáveis.
- Indicadores mensais excluem transferências internas e não contam pagamento de fatura como segunda despesa.
- Projeção considera assinaturas ainda não pagas e despesas pendentes, sem pressupor novos salários.
- Alertas tratam virada de mês e dias inexistentes; datas sem horário são apresentadas sem deslocamento por conversão UTC.

### CSV e IA

- CSV valida todo o lote antes da gravação, tratando aspas, separadores e valores brasileiros.
- Limites de 200 linhas e 1.000.000 de caracteres; marcadores identificam linhas importadas pelo novo fluxo.
- Chave Gemini separada por UID no navegador, removível nas configurações.
- Modelo padrão alterado para `gemini-2.5-flash`, configurável por ambiente. O SDK foi mantido.
- Recibos validam valores e datas; campos ausentes não são estimados automaticamente.
- Chat consulta contexto financeiro atualizado e preserva pares completos de mensagens, excluindo respostas de erro do histórico enviado.

### Interface e manutenção

- Estados de carregamento, bloqueio de ações repetidas e tentativa novamente após falhas de consulta.
- Formulários remontados ao abrir; troca de usuário reinicia o contexto autenticado.
- Rótulos esclarecem período mensal e acesso à projeção.
- Gráficos carregados separadamente do bundle principal.
- Testes, regras locais, emulador e documentação funcional/técnica adicionados.

### Validação executada

| Verificação | Resultado |
|---|---|
| Testes locais de domínio/serviços | 16 aprovados |
| Integração com Firestore Emulator | 2 aprovados |
| Lint | 0 erros; 5 avisos React |
| Build | Aprovado; 90 módulos |
| JavaScript principal | 880,80 kB; 262,98 kB gzip |
| Chunk de gráficos | 185,45 kB; 64,31 kB gzip |

Antes das correções: 13 avisos de lint e JavaScript principal de 1.049,19 kB (322,13 kB gzip). Separar gráficos reduz o carregamento principal; não equivale à mesma redução no total gerado.

Não foram executados migração real, publicação de regras, implantação, chamada real ao Gemini ou teste visual completo. Veja [operação e testes](operacao-e-testes.md).

O [backup anterior às correções](../backups/salva-ai-before-fixes-20260913-154505.zip) preserva código, não o banco de dados.

## SalvaAI inicial — Modernização já existente

React, Vite, Firebase Authentication, Firestore, rotas/componentes, chat e recibos com Gemini já estavam presentes antes desta rodada. As telas financeiras já tinham sido portadas. Não há data de release comprovada nesta revisão.

## AgentFinanceiro legado

Python/FastAPI, SQLite e HTML/CSS/JavaScript já ofereciam dashboard, contas, receitas/despesas, histórico, cartões parcelados, faturas, caixinhas, assinaturas, CSV, gráficos e tema. A [comparação funcional](evolucao-antigo-novo.md) distingue recursos preservados, reimplementados, corrigidos e pendentes.
