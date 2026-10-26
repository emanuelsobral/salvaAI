# Anotar um gabarito de contratos

Um gabarito independente registra o que uma pessoa encontrou no contrato original, sem consultar respostas da IA ou do extrator. Ele permite comparar a extração com uma referência separada.

Leia o [protocolo](protocolo.md) antes de começar. Modelos em branco, condições gerais e contratos preenchidos devem ser identificados separadamente na amostra.

## Preparar as fichas

Execute a partir da raiz do repositório:

```powershell
python experiments/contracts/preparar_gabaritos.py --catalogo experiments/contracts/amostra-preenchidos-v1.json --destino experiments/contracts/data/gabaritos/nova-rodada
```

A pasta de destino precisa ser nova. O comando não sobrescreve anotações, consulta resultados da extração ou preenche respostas. Para novos documentos, use uma nova versão do catálogo e preserve os documentos reservados para teste.

## Ler e registrar

1. Registre um código de pessoa e a data da leitura, sem nome completo ou outros dados pessoais desnecessários.
2. Leia o PDF inteiro, incluindo anexos e tabelas. Conte as páginas pela posição no arquivo, começando em 1.
3. Preencha cada campo apenas com a informação presente no documento. Não calcule valores ou datas ausentes.
4. Copie o trecho e indique a página. Em tabelas, inclua os cabeçalhos e as linhas necessários para entender a associação.
5. Explique ausências, conflitos ou trechos ilegíveis. Guarde as alternativas quando houver mais de uma interpretação.
6. Quando possível, peça revisão a outra pessoa, principalmente para documentos de teste. Registre e resolva as divergências antes da avaliação; se não houver outro revisor, declare revisão única.
7. Transcreva a ficha para JSON e execute a conferência estrutural.

Não abra `runs/` nem consulte respostas do protótipo durante a anotação. Se já houve ajuda de IA ou exposição às respostas, registre essa origem e use outra pessoa ainda não exposta para uma nova leitura independente.

## Estados

| Estado | Quando usar |
|---|---|
| `presente` | Há informação identificável, com valor e evidência. |
| `ausente` | A leitura confirmou que o dado não foi fornecido ou preenchido. |
| `ambiguo` | Existem interpretações ou obrigações concorrentes sem resposta principal única. |
| `ilegivel` | Não é possível ler o conteúdo necessário. |

Uma célula vazia ou `estado: null` indica que a anotação ainda não foi feita. Um PDF sem camada de texto pode ser visualmente legível e permitir anotação.

## O que conferir

| Campo | Cuidados |
|---|---|
| Valor da parcela | Registre a parcela regular ou a regra completa de variação. Não use total, entrada, caução, multa ou desconto condicional como parcela. |
| Número de parcelas | Use a quantidade expressa. Não a deduza da duração nem escolha uma opção sem indicação no contrato. |
| Vencimento | Preserve datas, dias mensais ou regras literais. Quinto dia útil não equivale ao dia 5. |
| Vigência | Separe início, fim, duração e condições. Não use a assinatura como início sem cláusula que determine isso, nem calcule o término ausente. |
| Reajuste | Guarde índices, alternativas, percentual, periodicidade e cláusula pertinente. Juros e multas são diferentes de reajuste; ausência de cláusula não significa ausência de reajuste. |

Divergências entre número e valor por extenso ficam como ambiguidade quando o contrato não resolve a diferença. Se houver várias obrigações independentes sem uma principal, não escolha uma por conta própria. Preserve os nomes completos dos índices, como IPCA-E e IPCA.

## Conferir o JSON

O [exemplo sintético](examples/gabarito-sintetico.json) mostra o formato, com números fictícios. A estrutura completa está no [esquema](registro.schema.json).

Use datas `AAAA-MM-DD` no JSON; a ficha de leitura pode usar `DD/MM/AAAA`. Valores em reais são strings decimais com duas casas, como `"1200.00"`. Não arredonde nem calcule um dado ausente.

O campo `valor` contém um objeto estruturado. Sem resposta, use `null` e explique o motivo. A confiança do gabarito fica em `nao_aplicavel`; regra e versão do extrator ficam em `null`.

Preencha `anotacao.anotador_id`, `data` e `estado_revisao`. Use `revisao_unica` sem outro revisor; `revisado` exige outro código de pessoa. `divergencias_pendentes` impede a avaliação. Apenas quem fez a leitura independente pode declarar `confirmacao_leitura_humana` como `true`.

```powershell
node experiments/contracts/conferir-gabarito.mjs experiments/contracts/data/gabaritos/nova-rodada/pub-alu-02.rascunho.json --catalogo experiments/contracts/amostra-preenchidos-v1.json
```

A conferência recusa fichas incompletas, campos inválidos, datas impossíveis, páginas fora do PDF, hash divergente e revisão atribuída à mesma pessoa. Não altera arquivos nem decide se a transcrição corresponde à cláusula; essa conferência continua sendo humana.

Antes de avaliar, complete os cinco campos, registre autoria e data, confira evidências e resolva ou classifique as divergências. Preserve a versão final e seus hashes. Gabaritos e documentos reais devem ficar fora do Git.
