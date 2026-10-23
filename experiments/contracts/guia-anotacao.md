# Gabarito humano de contratos — E03

**19/10/2026: o usuário autorizou continuar sem análise humana. Este guia descreve a trilha independente original, atualmente sem execução confirmada; não é bloqueio para o desenvolvimento assistido. Consulte a [trilha atual](analise-assistida-0118.md).**

**Preparado em 13/10/2026. GPT recomendado: Alto para estruturar e conferir os registros.**

Foram preparados 26 pares de arquivos vazios para o piloto original. Após o usuário apontar modelos em branco, foram selecionados **dois contratos públicos preenchidos**, com fichas próprias. A etapa E03 está **em andamento**, mas a adequação da amostra E02 também precisa continuar. Não existe gabarito aprovado nem precisão medida. Consulte a [correção da seleção](coleta-preenchidos.md).

## Por onde começar

**Rodada iniciada em 18/10/2026: `pub-alu-02`, Mafra, locação 054/2024.** O usuário escolheu fazer a leitura e declarou não ter consultado respostas de IA ou do protótipo para esse documento. Essa declaração de exposição anterior não confirma leitura, anotação ou revisão concluídas.

Foi preparado um pacote novo na C:, com cópia do PDF conferida por SHA-256, ficha vazia, rascunho JSON, instruções e manifesto:

`C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E03-anotacao-20261018-61fdbc/`

**Procedência atual de pub-alu-02: ajuda de IA declarada em 18/10/2026.** Cinco campos preenchidos (100%), com evidências e histórico preservados na C:. A ficha é referência de desenvolvimento assistida por IA, fora da avaliação independente. Revisão humana ainda não confirmada. A declaração inicial sobre ausência de exposição anterior foi preservada como histórico, mas não comprova independência da anotação posterior. Consulte `STATUS-ATUAL.md` e `progresso-anotacao.json` no pacote; relatórios anteriores são históricos. Próximo: nova anotação por pessoa não exposta às respostas, em ficha separada.

Na preparação inicial, o inventário conferiu 28 rascunhos anteriores, dos quais um estava preenchido: a referência assistida de pub-alu-03. Esses rascunhos foram preservados. O novo pacote de pub-alu-02 foi preenchido posteriormente e também declarado assistido por IA. Ambos pertencem ao desenvolvimento e não constituem testes reservados.

Na pasta local `data/gabaritos/preenchidos-v1-rascunhos/`, a ficha `pub-alu-03.ficha.md` e seu JSON foram preenchidos com respostas de IA externa. Em 13/10/2026, o usuário confirmou a origem e depois declarou a conferência humana com “Conferido”. Estão preservados como referência de desenvolvimento gerada por IA e revisada por humano, fora da avaliação de anotação independente. O contrato de Cruz das Almas tem cinco páginas.

Para obter anotação humana independente, preparar uma nova ficha em pasta inédita, ler o PDF sem consultar essas respostas e registrar quem realizou a leitura. Preferir outra pessoa que ainda não tenha visto as respostas. Se houver apenas conferência humana do material da IA, registrar como revisão assistida por IA, sem apresentá-la como anotação independente do protocolo atual. A ficha original de `pub-alu-02` permanece preservada; a anotação atual está no novo pacote da C: descrito acima.

`alu-01` e `edu-04` são modelos com lacunas; não serão novamente indicados como contratos pessoais preenchidos. Os novos documentos são locações institucionais e pertencem a uma amostra complementar de desenvolvimento. Os dez documentos reservados do piloto original permanecem separados e não serão usados para ajustar regras.

**Não abra a pasta `runs/` nem consulte respostas do protótipo ao produzir o gabarito.** Não pedir ao GPT que leia os PDFs e preencha a resposta de referência. GPT pode organizar arquivos e conferir a estrutura depois que uma pessoa anotar os valores e as evidências.

## Procedimento por documento

1. Registre um código de pessoa, por exemplo `anotador-01`, e a data da leitura. Evite nomes completos e dados pessoais na ficha.
2. Leia o PDF inteiro, incluindo anexos e tabelas. As páginas são contadas pela posição no arquivo, começando em 1, independentemente da numeração impressa.
3. Escolha o estado de cada um dos cinco campos e preencha a informação efetivamente presente. Nunca calcule um dado ausente.
4. Copie o trecho literal e indique a página. Se estiver em uma tabela, inclua cabeçalhos e linhas necessários para entender a associação. Não inclua nomes/CPF/endereço sem necessidade.
5. Para ausência, explique o que faltou. Para conflito, registre as alternativas e seus trechos. Para ilegibilidade, identifique o trecho/página que impede a leitura.
6. Quando possível, peça revisão independente a outra pessoa, especialmente nos documentos de teste. Registre e resolva divergências antes da avaliação. Sem segunda pessoa, declare revisão única.
7. Transcreva a ficha para o JSON e execute a conferência técnica abaixo. Só a pessoa responsável pode confirmar que a leitura foi humana e independente.

## Estados

| Estado na ficha | Estado no JSON | Quando usar |
|---|---|---|
| Presente | `presente` | Informação identificável, com valor e evidência. |
| Ausente | `ausente` | Após ler o documento, a informação não está preenchida ou não foi fornecida. Não inventar a informação que estaria em um anexo ausente. |
| Ambíguo | `ambiguo` | Existem interpretações/obrigações concorrentes sem resposta principal única; explicar e guardar os trechos. |
| Ilegível | `ilegivel` | A pessoa não consegue ler o conteúdo necessário. Um PDF digitalizado pode ser visualmente legível: ausência de camada de texto não implica gabarito ilegível. |

Uma célula vazia ou `estado: null` significa **ainda não anotado**. Não equivale a `ausente`. Os formulários foram criados nesse estado para não fabricar ausência antes da leitura.

## O que registrar em cada campo

| Campo | Registrar | Evitar |
|---|---|---|
| Valor da parcela | Parcela regular fixa ou regra completa de variação; moeda e condições explícitas. | Usar valor total, entrada, caução, desconto condicional ou multa como parcela. Dividir total pela quantidade. |
| Número de parcelas | Quantidade expressa; indeterminado somente se explícito. | Converter automaticamente duração em quantidade ou escolher uma opção de parcelamento sem indicação no contrato. |
| Vencimento | Data completa, dia mensal ou regra literal de vencimento. | Transformar quinto dia útil em dia 5; completar mês e ano que não constam no texto. |
| Vigência | Início, fim, duração e condições expressas, em componentes separados. | Usar assinatura como início sem cláusula que estabeleça isso; calcular fim ausente. |
| Reajuste | Índices e alternativas, percentual, periodicidade e cláusula completa. | Confundir juros/multa com reajuste ou trocar IPCA-E por IPCA. Ausência de cláusula não é “sem reajuste”. |

Se um valor numérico divergir do valor por extenso e o documento não resolver a diferença, registre ambiguidade. Se houver várias obrigações independentes e nenhuma principal, não escolha silenciosamente uma delas. Consulte o [protocolo 1.0.0](protocolo.md) para casos compostos.

## Transcrição e conferência do JSON

O [exemplo sintético](examples/gabarito-sintetico.json) demonstra o formato; seus números são fictícios e nunca devem ser copiados para um contrato real. A estrutura exata está no [esquema](registro.schema.json).

- Datas dentro do JSON: `AAAA-MM-DD`; na ficha de leitura pode usar `DD/MM/AAAA`.
- Valores em reais: texto decimal com duas casas, como `"1200.00"`, sem arredondar ou calcular informação ausente.
- `valor` é um objeto com componentes, não uma frase solta. Campos sem resposta usam `null` e motivo.
- Confiança do gabarito permanece `nao_aplicavel`, regra permanece `null` e versão do extrator permanece `null`.
- Preencha `anotacao.anotador_id`, `data` e `estado_revisao`. Use `revisao_unica` quando não houver outro revisor. `revisado` exige outro código de pessoa. `divergencias_pendentes` impede seguir para avaliação.
- Depois de concluir a leitura independente, a própria pessoa pode mudar `confirmacao_leitura_humana` para `true`. Isso é uma declaração de quem preencheu, não uma certificação automática.

Execute a partir da raiz `salva-ai`, com as dependências Node do projeto disponíveis:

```powershell
node experiments/contracts/conferir-gabarito.mjs "C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E03-anotacao-20261018-61fdbc/pub-alu-02.rascunho.json" --catalogo experiments/contracts/amostra-preenchidos-v1.json
```

A conferência recusa formulários incompletos, campos inválidos, datas impossíveis, páginas fora do PDF, hash divergente e revisão declarada pela mesma pessoa. Não modifica os arquivos nem julga se a transcrição representa corretamente a cláusula. Não exige camada de texto para anotar PDFs digitalizados: os trechos continuam sujeitos à revisão humana visual.

## Conclusão da E03

Para concluir, os documentos do lote a avaliar precisam ter cinco campos anotados, autoria/data registradas, evidências conferidas e divergências resolvidas ou explicitamente classificadas como ambiguidade. Registrar limitações de revisão única. Só então preparar uma versão final do gabarito, congelar seus hashes e passar à execução E05 (**Médio**).

Os 26 formulários originais e os dois complementares continuam sendo rascunhos locais, ignorados pelo Git. A ampliação E02 continua pendente; novos documentos exigirão novos formulários e nova versão do catálogo. Qualquer avaliação deve distinguir modelos, condições gerais e contratos preenchidos, sem alegar cumprimento da meta de 40 nem representatividade de contratos pessoais.

## Recriar formulários em uma nova pasta

```powershell
python experiments/contracts/preparar_gabaritos.py --catalogo experiments/contracts/amostra-preenchidos-v1.json --destino experiments/contracts/data/gabaritos/nova-rodada
```

A pasta deve ser nova. O script não sobrescreve anotações existentes, não consulta resultados da extração e não preenche respostas. Ao criar formulários para novos documentos, usar um catálogo de nova versão, preservando o piloto atual.

## Pacote separado para nova leitura independente — 18/10/2026

Preparado em `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E03-leitura-independente-3dc258`, com ZIP de mesmo nome ao lado da pasta. Contém PDF conferido por hash, ficha e JSON vazios (0/5), instruções e protocolo; sem respostas anteriores. Deve ser preenchido por outra pessoa que ainda não tenha visto respostas deste documento. Nenhuma pessoa foi indicada ou contatada; elegibilidade, leitura e revisão não confirmadas. A referência assistida anterior permanece preservada. A entrega do pacote não conclui E03 nem torna o documento um teste reservado.
