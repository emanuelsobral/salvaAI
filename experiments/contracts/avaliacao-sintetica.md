# Comparador de avaliação — preparação sintética 0.1.0

**18/10/2026. Apoio técnico à E06, nível Alto.** O comparador implementa as contagens do protocolo 1.0.0 usando somente registros de exemplo. Não executa o extrator, não abre PDFs nem aceita registros tipados como `gabarito` ou `extracao` reais. O extrator permanece na versão 0.1.17.

## O que está disponível

- Comparação do objeto completo de cada um dos cinco campos, com normalização textual limitada ao protocolo. Condições, negações, números e pontuação não são descartados.
- Comparação exata e tolerante separadas. A tolerância vale exclusivamente para até R$ 0,01 na quantia fixa, mantendo os outros componentes iguais. Datas, dias, quantidades, períodos e percentuais continuam exatos.
- Índices normalizados por aliases completos, sem confundir IPCA com IPCA-E. Texto em `regra` normalizado por NFC, caixa e espaços. A ordem das chaves não interfere.
- Acerto, precisão, revocação, omissões e erro de alta confiança, por campo e global, também agrupados por categoria e formato. Agregação por soma de contagens, sem média de percentuais de grupos.
- Numerador, denominador e proporção em cada métrica. Denominador zero produz `valor: null` e `rotulo: "não aplicável"`.
- Acertos em campos presentes e ausentes separados. Cobertura de alta confiança calculada sobre campos decidíveis; proporção de alta confiança entre respostas preenchidas publicada separadamente.

No relatório, `global.exato.metricas.acerto` é o acerto exato; `global.tolerante.metricas.acerto` é o acerto tolerante. Os valores numéricos são **proporções de 0 a 1**, não percentuais de 0 a 100. Multiplicar por 100 somente na apresentação.

## Erros e exclusões

Uma resposta preenchida errada para campo presente conta simultaneamente como falso positivo e falso negativo. Não é omissão. Uma falha de leitura em campo ausente não recebe acerto de ausência.

JSON malformado ou registro inválido resulta em cinco abstenções; não se aproveitam os outros campos. Falha completa de execução também resulta em cinco abstenções. Uma falha parcial com registro válido conserva os estados por campo e é contabilizada separadamente. Isso permite testar tanto saídas parcialmente utilizáveis quanto o comportamento conservador do extrator atual, que registra erro nos cinco campos quando a leitura está incompleta.

Gabaritos ambíguos/ilegíveis ficam fora do denominador de conteúdo, mas seus totais, respostas preenchidas e respostas de alta confiança permanecem no relatório. O erro de alta confiança usa sempre correspondência **exata**, mesmo na seção tolerante.

Gabaritos inválidos ou com revisão marcada como divergência pendente, IDs divergentes, duplicatas e metadados inválidos recusam o lote. A validação não comprova que o conteúdo ou a evidência estejam corretos: a independência e a revisão humana continuam necessárias. A restrição a exemplos é de formato; ela não verifica a origem de um texto que alguém rotulou como fictício.

## Entrada e execução

O gerador [lote-avaliacao-sintetico.mjs](examples/lote-avaliacao-sintetico.mjs) monta quatro cenários definidos em `casos-avaliacao.json`, usando os exemplos existentes. Não altera esses exemplos nem cria gabarito humano.

Formato do lote:

- `natureza: "sintetica"` e `protocolo_versao: "1.0.0"`.
- `documentos`: lista não vazia, com IDs distintos.
- Cada documento contém `gabarito` do tipo `exemplo_gabarito`, `extracao_bruta` como string JSON do tipo `exemplo_extracao` e metadados de simulação. Em falha completa, a saída bruta pode ser `null`.
- `categoria`: `aluguel`, `financiamento`, `educacao` ou `saude`.
- `formato`: `texto`, `digitalizado`, `misto`, `protegido` ou `invalido`. São etiquetas fictícias nesta entrega.
- `simulacao`: `status` (`concluido`, `parcial` ou `falhou`) e `duracao_ms` inteira não negativa. Não são tempos medidos de extração real.

Exemplo no PowerShell, a partir da raiz `salva-ai`, usando arquivos temporários na C: e nome de pasta novo:

```powershell
$loteSintetico = Join-Path $env:TEMP ('salvaai-avaliacao-' + [guid]::NewGuid().ToString() + '.json')
$saidaSintetica = Join-Path $env:TEMP ('salvaai-rodada-' + [guid]::NewGuid().ToString())
node experiments/contracts/examples/lote-avaliacao-sintetico.mjs | Set-Content -LiteralPath $loteSintetico -Encoding utf8NoBOM
node experiments/contracts/avaliar-sinteticos.mjs --sintetico $loteSintetico --saida $saidaSintetica
node --test experiments/contracts/test-avaliador.mjs experiments/contracts/test-gabarito.mjs
```

`utf8NoBOM` requer PowerShell 7. O comparador aceita lote de até 10 MiB. A pasta de saída precisa ser nova; o diretório pai deve existir. A saída contém entrada bruta, relatório, manifesto com hashes e cópias do avaliador, esquema e protocolo. A entrada não é alterada e uma rodada anterior nunca é sobrescrita. Dependências AJV já existentes; nenhuma instalação adicional.

O bloco `processamento` informa os estados **declarados na simulação**. `jsons_invalidos` é uma contagem adicional que pode se sobrepor a esses estados; não deve ser somada para obter o número de documentos.

## Validação desta entrega

**20 testes novos do comparador aprovados**, incluindo os quatro cenários do protocolo, limites de centavos, datas, negações, aliases, objetos completos, exclusões, falha completa/parcial, JSON inválido, agrupamentos, identidades e proteção contra sobrescrita. Somados aos sete testes Node de gabarito e aos 184 Python: **211 testes aprovados**. Lint dos três arquivos novos sem avisos ou erros.

A demonstração utiliza quatro documentos fictícios (20 campos), dos quais oito campos são decidíveis e 12 foram marcados ambíguos de propósito. O acerto exato agregado esperado é **4/8**. Isso apenas confere a aritmética dos cenários; **não é a precisão do extrator de contratos**.

Execução preservada em:

`C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E06-preparacao-20261018T024526854Z/`

Nenhum contrato real, documento reservado ou gabarito independente foi avaliado nesta rodada. Nenhuma regra do extrator, protocolo ou esquema foi alterada. Sem IA, integração com o aplicativo ou deploy.

## Próximo passo e progresso

**E03 — concluir a anotação humana independente, com apoio técnico em Alto.** Conferir as fichas existentes, resolver divergências e registrar a procedência. A referência de IA revisada de `pub-alu-03` continua sendo referência de desenvolvimento, não gabarito independente.

Depois disso, preparar congelamento e execução E05 e adaptar a entrada do comparador para resultados reais, com verificação dos manifestos, hashes e procedência. Esta CLI ainda não executa avaliação real nem produz o relatório final E07.

**Entrega técnica: 100% (3/3 blocos — comparador, validação/demonstração e documentação). Experimento: 29% (2/7 etapas formais). E06 permanece pendente.**
