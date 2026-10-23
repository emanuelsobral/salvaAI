# Protótipo de extração — E04, versão 0.1.0

**Implementado e validado tecnicamente em 13/10/2026. GPT recomendado nesta etapa: Alto.**

O programa recebe um PDF local e retorna JSON com cinco campos, evidências por página, regra aplicada, confiança e estado de extração. Funciona sem API de IA, conta de usuário, banco ou integração com o SalvaAI.

Esta é uma **baseline experimental de cobertura limitada**. Não está validada para preencher contratos ou criar pagamentos automaticamente. Anotação humana e comparação de conteúdo continuam pendentes.

## Como executar

Na raiz `salva-ai`, com Python 3.12+ e `pypdf` instalado conforme `requirements.txt`:

```powershell
python experiments/contracts/extrair.py --id alu-01
python experiments/contracts/extrair.py --pdf "caminho/contrato.pdf" --documento-id contrato-001
```

O JSON aparece no terminal. Uma pasta nova em `experiments/contracts/runs/` preserva `resultado.json` (saída bruta), `paginas.json` (texto por página), `stderr.log` e `manifesto.json` (hashes, versões, data, duração no resultado e código de saída). Nada é sobrescrito. `--saida` permite escolher outra pasta nova; manter dados reais fora do Git.

Código de saída **0** significa processamento concluído, mesmo que nenhum campo tenha sido encontrado. **1** indica falha ou leitura parcial documentada no JSON. **2** indica entrada/saída recusada antes da rodada, como arquivo inexistente, tamanho acima de 20 MiB, PDF reservado ou pasta já existente; nesse caso não se inventa um hash ou resultado financeiro.

O modo E04 aceita IDs de desenvolvimento. PDFs reservados são bloqueados pelo ID e pelo hash conhecido, inclusive se forem copiados/renomeados. Isso protege contra uso acidental do piloto reservado; não identifica todas as possíveis versões alteradas de um mesmo documento. Não usar documentos de teste para ajustar regras.

## Correção 0.1.14 — 15/10/2026

Versão atual: **0.1.14**. Filtra títulos isolados e preserva como pendentes as remissões/menções em garantia sem critério explícito. Oito testes novos; **160 Python e sete Node aprovados**. Lote de 18 documentos: somente evidências de dois reajustes mudaram, com 88 outros campos idênticos; nenhum estado/valor final alterado. [Resultados e limites](referencias-reajuste-0114.md). Próximo passo: distinguir reajuste anual, técnico e por faixa etária em saúde, com Alto.

## Correção 0.1.13 — 15/10/2026

Versão **0.1.13**. Preserva reajustes compostos e condições técnicas como regra literal, sem reduzir IGPM + IRT a um índice isolado ou percentuais de limite a taxa fixa. Nove testes novos; **152 Python e sete Node aprovados**. Quatro candidatos internos de sau-07 corrigidos; os 90 campos finais dos 18 documentos permaneceram idênticos, com quatro reajustes ambíguos. [Resultados e limites](reajustes-compostos-0113.md).

## Diagnóstico dos reajustes — 15/10/2026

Os quatro casos ambíguos foram inspecionados sem alterar a versão 0.1.12. Há modalidades/objetos distintos e fragmentação de cláusulas. A fórmula IGPM + IRT gera candidato incompleto como IGP-M, embora a resposta final do documento permaneça ambígua. Os 20 objetos de campo reproduzidos ficaram idênticos; quatro JSONs e evidências validados. [Diagnóstico e sequência](diagnostico-reajustes-0112.md). Próximo passo: proteger regras compostas, com Alto.

## Correção 0.1.12 — 15/10/2026

Versão **0.1.12**. Impede que uma regra parcial de vencimento seja entregue como suficiente quando há condições reconhecidas de carência/amortização ou deslocamento para dia útil ainda não consolidadas. `fin-05` passa a ambíguo, com valor nulo e evidências; `fin-04` mantém abstenção com uma evidência adicional. Não gera cronograma ou datas.

Sete testes novos; **143 Python e sete Node aprovados**. Lote de 18 documentos validado: dois objetos de vencimento alterados e 88 outros campos idênticos. Duas falhas de leitura preservadas. [Diagnóstico, limites e rastreabilidade](vencimento-financiamento-0112.md). Próximo passo: diagnosticar quatro reajustes ambíguos, com Alto. A consolidação completa do cronograma de financiamento permanece pendente.

## Correção 0.1.11 — 14/10/2026

Versão **0.1.11**. Reconhece prazo mínimo e início explícito em contratos de saúde, preservando a qualificação de mínimo e os eventos alternativos na regra literal. Vigência de beneficiário e renovação não substituem o início do contrato; carência não define duração contratual. O esquema não tem atributo separado para mínimo: não usar `duracao_meses` isoladamente para gerar datas ou parcelas.

Oito testes novos; **136 Python e sete Node aprovados**. Lote completo com 18 documentos: somente as vigências de `sau-01`/`sau-07` mudaram, mantendo os outros 88 campos idênticos. Duas falhas de leitura conhecidas preservadas. [Resultados, limites e rastreabilidade](vigencia-saude-0111.md). Próximo passo: conferir a completude do vencimento de `fin-05`, com Alto.

## Conferência do lote completo 0.1.10 — 14/10/2026

A versão 0.1.10 foi executada nos 18 documentos de desenvolvimento: 16 processamentos concluídos e duas falhas sem texto extraível. JSONs e evidências validados; dez documentos idênticos à conferência anterior. Sem novas alterações de código ou métricas de precisão nessa rodada. [Resultados e pendências](lote-completo-0110.md). A vigência de saúde foi tratada posteriormente na 0.1.11.

## Correção 0.1.10 — 14/10/2026

Versão **0.1.10**. Exige declaração de prazo/início contratual para interpretar vigência e preserva duração anual explícita em texto, sem inferir datas ou meses. Sete testes novos; **128 Python e sete Node aprovados**. Dez documentos conferidos: apenas três vigências educacionais mudaram. [Resultados, limites e rastreabilidade](vigencia-educacional-0110.md).

## Correção 0.1.9 — 14/10/2026

Versão **0.1.9**. Corrige lacunas de vigência, exige vínculo explícito do evento de início e restringe a seleção de vencimento por evento ou condicional. Oito testes novos; **121 Python e sete Node aprovados**. Dez documentos reexecutados, com saídas dos dois contratos complementares integralmente preservadas. Três vigências educacionais continuam ambíguas. [Detalhes e rastreabilidade](correcoes-regressao-019.md).

## Correção 0.1.8 — 14/10/2026

A versão **0.1.8** Reconhece IVAR por sigla ou nome e reúne parágrafos de cláusulas explicitamente intituladas “DO REAJUSTE”, até o próximo título ou fim da página. Intervalos mínimos ligados ao reajuste pelo conector reconhecido são normalizados em meses; a qualificação de mínimo permanece no texto. A remissão anual específica da cláusula de valor é evidência complementar, com verificação de conflito de período.

Onze testes novos; **113 Python e sete Node aprovados**. Mafra retorna IVAR e 12 meses, com condições de negociação e termo aditivo; INPC de atraso não foi incorporado. Outros quatro campos de Mafra e os cinco de Cruz das Almas ficaram idênticos à 0.1.7. JSONs, evidências e hashes verificados. [Diagnóstico e rastreabilidade](diagnostico-pub-alu-02.md).

Limites: segmentação lexical, títulos/conectores restritos, sem reunião entre páginas ou compreensão jurídica geral. O esquema não tem atributo separado para intervalo mínimo; é necessário revisar a regra literal. A verificação dos 16 documentos originais de desenvolvimento foi concluída; o [relatório](regressao-desenvolvimento-018.md) registra falhas de vigência/vencimento que exigem correção com Alto. Os dez reservados permanecem fora da execução.

## Correção 0.1.7 — 14/10/2026

A versão **0.1.7** reconhece prazo de pagamento em dias após protocolo, recebimento ou apresentação da nota fiscal. A associação com pagamento e o evento é obrigatória; números de outras obrigações não bastam. Dias úteis/corridos, evento e condições ficam na regra literal, sem calcular data ou dia do mês. Negação, valores inválidos, lacunas e eventos desconhecidos geram abstenção. A regra é lexical e não resolve condições espalhadas em outras páginas nem calcula calendários.

Oito testes novos; **102 Python e sete Node aprovados**. Mafra retorna a regra de 30 dias após protocolo, mantendo a exigência de nota atestada e os outros quatro campos da 0.1.6. Os cinco campos de Cruz das Almas ficaram idênticos. Saídas, comparações e hashes preservados; ambos os JSONs e evidências validados. [Diagnóstico e rastreabilidade](diagnostico-pub-alu-02.md).

## Correção 0.1.6 — 14/10/2026

A versão **0.1.6** reconhece valor mensal diretamente associado à locação do imóvel e separa títulos de cláusulas para o campo de valor. A ressalva terminal específica de manutenção do valor até reajustes anuais não bloqueia esse candidato; demais negações, descontos, encargos e condições continuam exigindo revisão. A evidência integral é preservada. Não interpreta valores por extenso; variantes desconhecidas da ressalva podem continuar omitidas.

Oito testes novos; **94 Python e sete Node aprovados**. Mafra retorna BRL 8825.50, mantendo os outros quatro campos. Os cinco campos de Cruz das Almas ficaram integralmente iguais à 0.1.5. Saídas brutas, comparações e hashes preservados; JSONs e evidências validados. [Diagnóstico e limites](diagnostico-pub-alu-02.md).

## Correção 0.1.5 — 14/10/2026

A versão **0.1.5** mantém títulos e corpos de cláusulas de vigência juntos quando há conteúdo nas linhas seguintes. Isso recupera o prazo antes descartado e preserva o contexto de reajuste. Títulos isolados ou quebrados em maiúsculas não geram valores. Corpo inteiramente em maiúsculas ou na mesma linha do título permanece uma limitação; evidências amplas podem conter rodapés e cláusulas acessórias.

Nove testes novos; **86 Python e sete Node aprovados**. Mafra passou a retornar duração de 12 meses, assinatura como evento e condições de prorrogação, sem calcular datas. Outros quatro campos inalterados. Os cinco campos de Cruz das Almas ficaram idênticos à 0.1.4. JSONs e localização literal das evidências validados, com rodadas intermediárias e finais preservadas. [Diagnóstico e rastreabilidade](diagnostico-pub-alu-02.md).

## Correção 0.1.4 — 13/10/2026

A versão **0.1.4** introduziu reconhecimento próprio de cláusulas de vigência: aceita datas `DD/MM/AAAA` e dia numérico com mês em português, valida o calendário e reúne datas complementares. Inícios/términos conflitantes, datas inválidas, lacunas e certas formas negadas/alternativas causam abstenção. Não converte assinatura isolada em início, nem calcula fim ou duração ausentes.

Prorrogações possíveis, aviso prévio, rescisão e permanência após vencimento ficam na regra literal e não substituem as datas principais. Condições e frases seguintes do mesmo item numerado são preservadas, incluindo a ausência de aluguel durante restauração. Menções incidentais à vigência no reajuste são excluídas. Carimbo identificado por “Documento Assinado Digitalmente” e texto posterior na página não são usados como datas contratuais; o texto completo continua preservado em `paginas.json`.

Limitações: seleção lexical de cláusulas, sem compreensão jurídica geral, conciliação automática de aditivos ou garantia de completude em qualquer diagramação. A separação depende de itens numerados/linhas e frases; carimbos em outros formatos podem exigir tratamento. Em documentos com múltiplos contratos, texto misto ou referências cruzadas, a associação ainda requer revisão humana. A regra literal pode reunir cláusulas complementares além das presentes na referência revisada; não houve comparação semântica automática integral.

Onze testes novos cobrem meses em português, datas repetidas/complementares/conflitantes, assinatura, prorrogação, duração explícita, calendário e carimbos digitais. **77 testes Python e sete Node aprovados.** A primeira execução de desenvolvimento ainda ficou ambígua por carimbos nas cláusulas incidentais; foi preservada. Após a correção, `pub-alu-03` retornou início 2022-04-01, fim 2023-04-01 e duração nula, com condições preservadas. Outros quatro campos idênticos à 0.1.3. JSON, evidências e hashes conferidos. [Comparação](comparacao-pub-alu-03.md).

## Correção 0.1.3 — 13/10/2026

A versão **0.1.3** passou a reconhecer “aluguel mensal do imóvel no valor de” e a variante `RS` somente quando diretamente associada à obrigação, com valor em formato monetário de duas casas decimais e indicação de “reais” entre parênteses após a quantia. Não substitui `RS` no documento, não interpreta o número por extenso nem valida sua equivalência com o numeral.

Para o campo de valor, itens numerados que começam em nova linha são tratados separadamente. Assim, uma condição na cláusula de reajuste não bloqueia o aluguel de outra cláusula. Condições, descontos e encargos no mesmo item continuam provocando abstenção. Totais/entradas diretamente associados ao aluguel não são usados como parcela; valores concorrentes continuam ambíguos. As outras regras conservam a segmentação anterior.

Limites: regras locais não compreendem referências entre cláusulas, exceções gerais ou todas as maneiras de escrever valores. A exigência de “reais” para aceitar `RS` é conservadora e pode omitir valores legítimos. Revisão humana continua necessária.

Oito testes novos cobrem total versus mensal, `R$`/`RS`, condições, conflitos, contexto insuficiente e formatação monetária inválida. **66 testes Python e sete Node aprovados.** Nova execução de `pub-alu-03` encontrou BRL 2200.00 com evidência literal da página 2; os outros quatro campos permaneceram idênticos à 0.1.2. JSON, evidências e hashes conferidos. [Comparação](comparacao-pub-alu-03.md).

## Correção 0.1.2 — 13/10/2026

A versão **0.1.2** passou a reconhecer “pago/paga/pagos/pagas mensalmente até”, incluindo regras de mês subsequente/seguinte/posterior. Preserva essas relações em `outra_regra`, sem inventar uma data nem reduzir o vencimento a um dia isolado. Evidências conservam inclusive as quebras de linha e o símbolo `®` presente na camada de texto do PDF.

Foram incluídas proteções para “vencimento do presente contrato”, dias explícitos fora de 1–31 e negação em cláusulas de pagamento mensal. O bloqueio de negação é conservador: qualquer “não” nesse bloco impede preencher o vencimento. Não é compreensão geral de linguagem; blocos mistos ainda podem provocar abstenções.

Sete testes novos cobrem essas formas e proteções. **58 testes Python e sete Node aprovados.** Nova rodada de `pub-alu-03` reconheceu a cláusula de pagamento na página 2; os outros quatro campos permaneceram idênticos à 0.1.1. JSON, evidências e hashes conferidos. Sem execução do conjunto reservado, métricas formais, mudanças no aplicativo ou deploy. [Comparação](comparacao-pub-alu-03.md).

## Correção 0.1.1 — 13/10/2026

A versão **0.1.1** passou a exigir associação explícita da periodicidade ao reajuste: “aluguel mensal” ou prazo de vigência, isoladamente, não preenchem esse campo. Reconhece formas como reajuste anual/mensal, a cada N meses/anos e intervalo/interregno mínimo. Anos explicitamente informados são normalizados para meses; a qualificação de mínimo e demais condições permanecem na regra literal. Períodos concorrentes ou inválidos provocam abstenção como ambiguidade.

O reconhecimento é conservador e não interpreta qualquer construção em português. Quando não reconhece a associação, mantém a periodicidade nula e preserva a regra textual. Não foram modificadas as regras de aluguel, parcelas, vencimento ou vigência.

Validação: sete novos testes de regressão (com variações internas) reproduziram falhas na versão antiga e passaram após a correção. Total atual: **51 testes Python e sete Node**. Na nova execução de `pub-alu-03`, o reajuste mudou de um mês para 12 meses; cláusula e evidências permaneceram idênticas. Os outros quatro campos ficaram inalterados. JSON e evidências aprovados; sem teste reservado ou métricas formais. [Comparação antes/depois](comparacao-pub-alu-03.md).

## Regras e limites

- Reconhece algumas formas explícitas de valor, quantidade, vencimento, vigência e reajuste em português. Preserva evidências como trechos literais da camada de texto e usa a página física.
- Não divide valor total, calcula data final, converte prazo em parcelas nem consulta índices externos.
- Candidatos diferentes ou informação relacionada não resolvida provocam abstenção/ambiguidade. Lacunas de modelos não são preenchidas.
- Respostas preenchidas recebem **confiança média**. A versão 0.1.0 não emite alta confiança, pois contexto e completude ainda dependem de revisão humana. Confiança não é probabilidade.
- Regras lexicais não compreendem todas as negações, referências cruzadas, aditivos ou obrigações concorrentes. Números por extenso não são conciliados com os numerais. Divergências entre ambos exigem revisão humana.
- Tabelas complexas, datas em formas não suportadas, referências entre páginas, parcelas variáveis e formas não reconhecidas podem ficar sem resposta. A versão 0.1.4 reconhece meses em português para vigência, com dia/ano numéricos. Não há reconstrução de tabelas nem OCR.
- Uma página sem texto ou com falha de leitura impede respostas financeiras no documento inteiro: conserva o texto legível, registra falha/parcial e retorna `erro_leitura` nos cinco campos. Isso também afeta capas vazias/em imagem; a exceção para capas não foi automatizada.
- Limites: 20 MiB, 150 páginas e 200 mil caracteres extraídos por página. Não há isolamento de processo ou limite de CPU/memória durante a interpretação interna do PDF; usar o protótipo local em arquivos conhecidos. Não expor como serviço de upload nesta versão.

## Verificação técnica executada

- 32 testes específicos da E04 passaram, cobrindo o exemplo completo, ausência, conflitos, totais versus parcelas, datas, índices, evidências, PDF corrompido, protegido e sem texto, preservação de rodadas e bloqueio do conjunto reservado.
- Foram executados os **16 PDFs de desenvolvimento**: 14 concluíram a leitura e dois falharam por ausência de camada de texto. Os dois erros permanecem nos resultados.
- Cinco PDFs fictícios adicionais verificaram o caminho completo, inclusive falhas. Os **21 JSONs** passaram pelo esquema AJV e pela verificação literal de página/trecho.
- Rodada local: `runs/E04-validacao-20261013T182635728454Z/`. Os manifestos preservam os hashes das regras usadas. Os dez PDFs reservados não foram executados pelo extrator.

Estados observados nos 16 documentos de desenvolvimento, **sem gabarito e sem classificação de acerto**:

| Campo | Preenchido | Não identificado | Ambíguo | Erro de leitura |
|---|---:|---:|---:|---:|
| Valor da parcela | 0 | 14 | 0 | 2 |
| Número de parcelas | 1 | 13 | 0 | 2 |
| Vencimento | 3 | 7 | 4 | 2 |
| Vigência | 1 | 8 | 5 | 2 |
| Reajuste | 1 | 9 | 4 | 2 |

**A cobertura inicial é baixa.** O preenchimento não comprova acerto; ausência de resposta não comprova ausência no contrato. Há modelos com lacunas e formas que as regras ainda não cobrem. O gabarito humano permitirá separar esses casos e medir omissões, respostas erradas e acertos. Não atribuir precisão, revocação ou sucesso financeiro a esta verificação estrutural.

## Repetir os testes

```powershell
python -m unittest discover -s experiments/contracts -p "test_*.py" -v
node --test experiments/contracts/test-gabarito.mjs
node experiments/contracts/validar-saidas.mjs "experiments/contracts/runs/NOME-DA-RODADA"
```

Os testes Python incluem também coleta e formulários. Em 13/10/2026 passaram **44 testes Python e sete testes Node** do experimento. Não houve nova execução da suíte da aplicação nem deploy.

Próximo passo: [E03 — gabarito humano](guia-anotacao.md). Após revisão/congelamento, E05 poderá executar o lote reservado com regras e protocolo congelados, preservando erros; E06 calculará métricas.
