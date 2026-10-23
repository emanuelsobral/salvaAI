# Validação de extratos PDF — 17/10/2026

Atualização: concluída a [rodada de qualidade do OCR e telas pequenas](validacao-ocr-qualidade.md), com quatro imagens fictícias, cancelamento/troca de arquivo e viewports 320/390 pixels. 129 testes aprovados; a amostra BB manteve 6/6 campos financeiros correspondentes. Resultados parciais em imagens reduzidas e falha em imagem muito degradada continuam exigindo conferência ou transcrição manual.

## OCR local — retorno à página Banco do Brasil (17/10/2026)

**6/6 movimentações recuperadas com data completa, valor e entrada/saída correspondentes ao original: 100% desses campos nesta página.** A referência foi a leitura visual do assistente, não um gabarito humano independente. O saldo anterior e o saldo final foram excluídos. A tela de teste gerou seis registros válidos e efeito líquido correspondente ao original; nenhuma gravação no Firebase. As dez linhas do Itaú no mesmo arquivo permaneceram disponíveis, mas foram desmarcadas para não misturar contas nesta validação.

O leitor usa a imagem renderizada do PDF e identifica colunas Histórico/Documento/Valor/Saldo; C/D vêm do valor, sem usar o saldo como movimento. Meses/anos não são inventados. Caracteres numéricos ambíguos ficam pendentes; a descrição é editável. Uma primeira renderização local confundiu uma letra; a renderização PDF.js do navegador apresentou a descrição correspondente. Outra diferença de renderização uniu o código e a palavra SALDO: o caso foi corrigido e incluído no teste de exclusão de resumo. Não se afirma 100% de transcrição de qualquer imagem.

A leitura é opcional, uma página por vez, com progresso, cancelamento e prazo de 90 segundos para reconhecimento. O motor é encerrado ao concluir/falhar/cancelar; se ainda estiver inicializando, é encerrado quando a inicialização terminar. Trocar arquivo ou fechar a revisão invalida resultados pendentes. O processamento não envia o extrato a terceiros. Os arquivos do leitor são servidos pelo próprio aplicativo, com carregamento sob demanda; não há cota diária de IA.

**Entrega de OCR desta etapa: 100% dos quatro blocos (leitura local, integração à revisão, testes e documentação).** Oito testes novos verificam colunas, saldos, texto incerto, detalhes, sucesso/falha, cancelamento durante inicialização e tempo excedido. Total: 127 testes aprovados; build aprovado e lint com os mesmos cinco avisos anteriores. Cache e saída do build de validação foram mantidos na unidade C: a pedido do usuário, após falta de espaço temporária na H:. Arquivos privados continuam fora do Git. Sem deploy.

Próximo passo: ampliar amostras anonimizadas e testar digitalizações de qualidade variável e aparelhos móveis. Não se trata de suporte universal, e OCR de contratos continua fora desta entrega.

## Terceira amostra — Nubank, setembro de 2026 (17/10/2026)

**100% das movimentações desta amostra conferidas: 10/10**, com data completa, valor e entrada/saída correspondentes ao original. São quatro entradas e seis saídas. As três páginas foram inspecionadas visualmente; as duas primeiras têm cinco movimentações cada, e a terceira contém apenas informações de atendimento. Os totais de entradas e saídas e a diferença entre os saldos inicial/final conferem em centavos. Antes da correção, nenhuma movimentação era sugerida.

A referência foi transcrita pelo assistente a partir das páginas renderizadas, separadamente da saída do importador; as descrições foram conferidas visualmente. Não constitui gabarito humano independente nem comprovação de suporte a todos os layouts do Nubank. Arquivo original, imagens, texto e resultados privados permanecem fora do Git; os sete novos testes usam dados fictícios.

### Mudanças para este formato

- Datas com mês abreviado em português, como `02 SET 2026`, lidas no cabeçalho do grupo, incluindo o ano explícito.
- Entrada/saída definida pelo cabeçalho “Total de entradas/saídas”; valores do resumo e totais dos grupos não viram lançamentos.
- Alternância entre entradas e saídas no mesmo dia, repetindo a data apenas em grupos alinhados da mesma página. Datas inválidas e notas interrompem o contexto; não se transporta data entre páginas.
- Detalhes em linhas seguintes são reunidos somente dentro da área de descrição reconhecida. Valores na descrição não substituem o valor da movimentação.
- Se os valores extraídos não somarem o total do grupo, aparece um aviso e o tipo fica pendente de escolha manual. Sinais contraditórios também permanecem pendentes.

Verificações: **119 testes aprovados**, build aprovado e lint sem erros (cinco avisos anteriores). No navegador, dez linhas completas e geração local de dez registros válidos, com efeito líquido correspondente ao PDF. As amostras anteriores preservaram os resultados: dez movimentos no Itaú antigo, 108 no Itaú de 2026, nenhum nas notas ou no BB com fonte ilegível. Nenhuma gravação no Firebase nem deploy.

Limites: grupos divididos entre páginas, layouts diferentes, PDFs digitalizados e descrições com alinhamento diferente ainda precisam de revisão manual ou novas amostras. O pagamento de fatura e as transferências são movimentos da conta, sem vinculação automática a cartões ou outras contas cadastradas. A revisão continua obrigatória.

## Segunda amostra — Itaú 2026 (16/10/2026)

Arquivo de quatro páginas fornecido pelo usuário, com período declarado de 17/08/2026 a 16/10/2026. Contém dados pessoais e financeiros; original, imagens, texto e resultados foram mantidos apenas em `.statement-qa/`, fora do Git. Os testes adicionados usam dados fictícios.

**Validação desta amostra: 100% das páginas (4/4) e 108/108 movimentações correspondentes (100%).** Foram comparadas datas completas, descrições (normalizando espaços), valores em centavos e entrada/saída. As 36 linhas de saldo foram excluídas. A soma das movimentações corresponde à diferença entre o saldo inicial e o saldo final do arquivo. Isso valida esta amostra, não todos os extratos do Itaú.

| Página | Movimentações esperadas | Sugestões conferidas | Linhas de saldo excluídas |
|---|---:|---:|---:|
| 1 | 23 | 23 | 6 |
| 2 | 35 | 35 | 7 |
| 3 | 31 | 31 | 11 |
| 4 | 19 | 19 | 12 |
| Total | 108 | 108 | 36 |

Referência: inspeção visual das quatro páginas e extração auxiliar com pdfplumber, separada da implementação PDF.js. Não é gabarito humano independente nem estimativa estatística de precisão. Antes da correção, as 108 linhas apareciam, porém somente 74 tinham data, valor e sinal preenchidos; datas em descrições e positivos sem sinal explícito causavam pendências.

### Mudanças para este formato

- Tabela reconhecida por cabeçalhos data, lançamentos/descrição, valor e saldo. O valor da movimentação é separado do saldo pela posição, incluindo números largos alinhados à direita.
- Nessa coluna única de valor, negativos são saídas e positivos/sem sinal são entradas; a tela explica a convenção para revisão. Indicadores conflitantes continuam sem tipo definido. Essa regra não é aplicada ao texto genérico sem a tabela reconhecida.
- A data vem apenas da coluna de data. Referências como dia/mês no texto do PIX são preservadas na descrição, sem substituir nem invalidar a data do lançamento.
- Nas páginas sem cabeçalho, as posições das colunas podem continuar quando a primeira linha tem data completa na posição esperada e valor/saldo alinhado. Nunca se transporta uma data entre páginas; notas, mudança de alinhamento ou texto ilegível interrompem a continuidade.
- O ano 2026 vem das próprias linhas; não depende do ano atual do computador nem exige preenchimento em lote.

Verificações: seis testes novos; **112 testes do aplicativo aprovados**, build aprovado e lint sem erros (cinco avisos anteriores). Conferência no navegador: 108 linhas completas, confirmação da revisão gerou 108 registros válidos e efeito líquido idêntico à referência; nenhuma gravação no Firebase. A primeira amostra continua com dez sugestões do Itaú, zero na página BB ilegível e zero nas notas.

A classificação é de entrada/saída na conta: transferências próprias, resgates/aplicações e pagamento de fatura não são automaticamente transformados em vínculos com outras contas ou operações já cadastradas. A conferência de duplicidades e da finalidade financeira continua necessária antes de importar para uso real.

## Primeira amostra — registro anterior ao OCR (16/10/2026)

Uma amostra fornecida pelo usuário foi conferida localmente: três páginas reunindo Banco do Brasil (página 1) e Itaú (páginas 2–3). A referência foi feita por leitura visual pelo assistente, antes da comparação dos lançamentos; não é gabarito humano independente nem medição representativa dos bancos.

**Análise da amostra: 100% das páginas (3/3). Sugestões de movimentação corretas: 62,5% (10/16)**, contando apenas presença, dia/mês, valor e entrada/saída; o ano 2022 foi confirmado manualmente. Isso não representa a porcentagem de suporte aos bancos nem a extração integral sem intervenção.

| Página | Instituição informada | Esperado pela leitura visual | Resultado após os ajustes | Limitação |
|---|---|---|---|---|
| 1 | Banco do Brasil | 6 movimentações | 0 sugestões; aviso de texto ilegível | Mapeamento interno das fontes corrompido. O original é visualmente legível; precisa de digitação manual ou OCR local. |
| 2 | Itaú | 10 movimentações | 10 sugestões com dia/mês, valor e sinal correspondentes; totais de entradas e saídas conferidos com o resumo | Confirmar o ano; regras verificadas somente neste layout. |
| 3 | Itaú — notas explicativas | 0 movimentações | 0 sugestões | Não é página de movimentações. |

Antes dos ajustes, BB gerava zero sugestões sem diagnóstico específico; Itaú sugeria apenas três linhas, incluindo um saldo, e nenhuma vinha com data/valor/sinal completos. Após os ajustes, as dez linhas de movimentação do Itaú foram conferidas também na tela do navegador. Nada foi gravado no Firebase. O PDF original, texto, imagens e saídas ficaram fora do Git, em armazenamento local ignorado.

O arquivo reúne contas de instituições diferentes; não deve ser confirmado como um único extrato para uma conta de destino sem separar e revisar as movimentações.

Preparação local concluída: 16 cenários fictícios de texto extraído, um teste adicional de calendário/datas e uma opção para executá-los em um PDF fictício de duas páginas no navegador. Esses cenários verificam regressões conhecidas e não medem precisão em bancos reais. Foram acrescentados quatro testes de geometria de colunas, conflitos de sinal, datas agrupadas e texto ilegível, usando somente dados fictícios.

## Correções reproduzidas nesta rodada

Seis testes falharam antes da correção e passaram depois:

- Nomes de estabelecimentos contendo “Total”, “Saldo” e “Resumo” deixaram de ser descartados como se fossem totais do extrato. Somente rótulos completos de resumo reconhecidos são excluídos das sugestões; rótulos desconhecidos exigem revisão.
- Uma linha com duas datas distintas fica sem data escolhida e exibe aviso para seleção manual. Aplicar um ano em lote não escolhe entre as datas.
- Datas inexistentes, como 31/02/2026 e 29/02/2025, ficam pendentes de correção. 29/02/2024 continua válida.

Os demais cenários cobrem saldos, coluna de valor + saldo, ano ausente, valor sem sinal, sinais conflitantes, indicadores C/D e data ISO. A continuação de descrição sem data/valor continua disponível no texto original para inclusão/correção manual; não é concatenada automaticamente.

## Ajustes motivados pela amostra

- Reconhecimento de tabela somente quando os cabeçalhos data, descrição, entradas, saídas e saldo aparecem juntos, em ordem e com posições utilizáveis. Não depende do nome do banco.
- Valor associado à coluna de entrada ou saída, desconsiderando a coluna de saldo e a legenda lateral. Sinal explícito conflitante exige escolha manual.
- Sinal negativo no final do valor passa a ser reconhecido.
- Dia/mês repetido nas linhas do mesmo grupo, apenas dentro da mesma página/tabela; sem presumir ano nem carregar data para outra página. A tela informa quando a data foi repetida.
- Texto interno com muitos caracteres de controle é identificado como ilegível e não gera sugestões. Isso é uma detecção conservadora de corrupção, não uma garantia de qualidade para qualquer fonte.
- A página de BB permanece sem extração automática. Não foram criadas substituições arbitrárias de caracteres para simular uma leitura correta.

**Validação de código:** 106 testes do aplicativo aprovados; build aprovado; lint sem erros, com cinco avisos anteriores. Não houve mudança de regras Firebase nesta rodada nem novo teste de publicação. Sem deploy.

## Como validar uma amostra real

1. Usar uma cópia anonimizada preservando datas, sinais, alinhamento, colunas e valores fictícios coerentes. A anonimização deve remover o conteúdo sensível, inclusive camadas de texto; cobrir visualmente com retângulos não é suficiente. Guardar apenas localmente em `.statement-qa/`, que está excluída do Git.
2. Registrar um identificador fictício, banco, tipo de conta, período, quantidade de páginas, formato de exportação, presença de texto ou imagem e versão do aplicativo. Não registrar titular, agência, conta, CPF ou senha.
3. Antes de olhar as sugestões do programa, conferir o original e preparar a lista esperada: página, data, descrição, valor absoluto e entrada/saída. Excluir saldos e totais. Registrar explicitamente as linhas que exigem interpretação.
4. Abrir no aplicativo, comparar a leitura inicial com a lista esperada e registrar omissões, linhas extras, data errada, valor errado e sinal errado. Preservar falhas de abertura e páginas sem texto; não removê-las do relatório.
5. Corrigir pela revisão manual e comparar novamente. O resultado revisado deve ter a mesma quantidade e os mesmos lançamentos do gabarito; comparar valores em centavos, sem tolerância, e datas exatas. Conferir separadamente soma de entradas, soma de saídas e efeito líquido. Somente comparar saldo final quando o saldo inicial e todas as movimentações do período forem conhecidos.
6. Testar gravação, reimportação, conciliação e estorno apenas em ambiente de teste. Importar duas vezes deve manter o efeito de uma importação. Não usar contas de produção para validar.
7. Registrar o resultado para **aquele layout e versão**, sem estender a conclusão a todos os extratos do banco. Conservar exemplos que falharam para novos testes de regressão.

## Registro por amostra

Copiar uma linha por arquivo; usar “não avaliado” em vez de zero quando a comparação não ocorreu.

| ID | Banco/layout | Texto ou imagem | Páginas | Lançamentos esperados | Omitidos na sugestão | Extras | Datas erradas | Valores errados | Sinais errados | Revisado corresponde ao gabarito? | Observações |
|---|---|---|---|---|---|---|---|---|---|---|---|
| BB-01 | BB, página 1 da amostra | Texto corrompido | 1 | 6 | 6 | 0 | Não aplicável | Não aplicável | Não aplicável | Não avaliado | Aviso de ilegibilidade; sem transcrição nesta rodada |
| IT-01 | Itaú, páginas 2–3 da amostra | Texto legível | 2 | 10 | 0 | 0 | 0 em dia/mês; ano confirmado | 0 | 0 | Dados essenciais e totais conferidos; sem gravação | Revisão pelo assistente, sem gabarito humano independente |

Não calcular uma “porcentagem de todos os bancos” sem definir antes quais bancos, produtos e versões de layout fazem parte do conjunto. Até esta atualização: **3 arquivos de amostra, quatro layouts bancários, dez páginas** (BB com OCR, dois formatos Itaú e Nubank por grupos diários). A primeira entrega de PDF genérico e o OCR por página estão concluídos no código local; faltam mais amostras e imagens de qualidade variável para ampliar a cobertura.

## Reproduzir os casos fictícios

- `node --experimental-vm-modules --test tests/pdf-statement.test.js`: casos de leitura e validação, mais integração simulada com importação/duplicatas/conciliação.
- `npm run dev`, depois `/tests/fixtures/pdf-review.html` → **PDF casos de revisão**: gera um PDF local fictício com 16 linhas em duas páginas. São esperadas 12 sugestões; três resumos e uma continuação sem data/valor ficam fora das sugestões, mas continuam disponíveis no texto extraído.
- Os cenários estão em `tests/fixtures/pdf-statement-cases.json`. Não contêm nomes ou dados reais de clientes/bancos e não substituem amostras de layouts reais.

[Funcionamento da importação](importacao-extratos.md) · [Kanban](kanban.md)
