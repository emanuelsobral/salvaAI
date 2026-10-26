# Importação de extratos

No dashboard, escolha Importar extrato, selecione a conta de destino e carregue o arquivo. Revise a prévia antes de confirmar. Só Confirmar importação grava os lançamentos e altera o saldo; o resultado informa quantos foram incluídos ou ignorados e qual foi o efeito no saldo.

## Formatos aceitos

| Formato | Requisitos |
|---|---|
| CSV | Arquivo ou texto colado, com colunas na ordem data, descrição e valor. Aceita vírgula, ponto e vírgula ou tabulação; cabeçalho opcional iniciado por Data. |
| OFX bancário | Versões 1.x SGML ou 2.x XML, em reais, de conta corrente ou poupança, com uma conta de origem e uma lista de movimentações por arquivo. |
| PDF | Arquivo de até 10 MB e 50 páginas, com leitura genérica, revisão manual e OCR opcional por página. |

CSV e OFX aceitam até 1 MB e 200 transações por operação. As codificações suportadas são UTF-8 e Windows-1252; OFX com declaração ISO-8859-1 também é decodificado. UTF-16 não é aceito.

No CSV, use valores positivos para entradas e negativos para saídas, com até duas casas decimais. As datas podem ser DD/MM/AAAA ou AAAA-MM-DD.

```csv
Data;Descrição;Valor
09/10/2026;Mercado;-150,00
09/10/2026;Salário;5000,00
```

O OFX precisa conter BANKID, ACCTID, ACCTTYPE, DTPOSTED, TRNAMT, FITID e NAME ou MEMO. O sinal de TRNAMT define entrada ou saída. A data bancária é preservada, sem deslocamento de fuso.

Não são aceitos OFX de cartão, investimento, empréstimo, moeda estrangeira, múltiplas contas, correções bancárias (CORRECTFITID/CORRECTACTION), entidades externas ou CDATA. CSV com outras colunas deve ser convertido para o modelo acima. Um erro em qualquer linha impede confirmar o arquivo inteiro.

## Conta de destino e saldo

Escolha manualmente entre Conta corrente, Vale Refeição e Vale Alimentação. A opção deve corresponder à conta que você deseja atualizar. No OFX, o final da conta de origem aparece na revisão; o aplicativo não cria um cadastro bancário separado por instituição.

A prévia mostra as dez primeiras linhas e o total antes de retirar duplicidades. O valor efetivamente aplicado aparece após a confirmação. O saldo de fechamento do OFX não substitui o saldo do aplicativo: somente as movimentações incluídas são somadas. Confira se o saldo inicial já contém o período que pretende importar.

O arquivo é lido no navegador. Somente os lançamentos e os marcadores de importação são gravados no Firestore; não há sincronização direta com bancos nem envio a uma IA.

## Revisar um PDF

1. Escolha o arquivo e confira o original página por página. Use Ampliar página para ver detalhes.
2. Se houver senha, informe-a para a leitura local. Ela não é gravada no banco; algumas proteções podem ser incompatíveis.
3. Edite data, descrição, valor e entrada ou saída. Desmarque saldos e totais e adicione as linhas que faltarem.
4. Quando houver vários valores na linha, escolha o da movimentação. Valores sem sinal exigem escolha manual, salvo nos layouts em que a coluna ou a convenção de sinais é reconhecida e apresentada para revisão.
5. Preencha o ano quando ele estiver ausente. Confira cada data em períodos que atravessam dezembro e janeiro.
6. Marque a conferência e escolha Usar lançamentos revisados. Depois, confira a conta e as correspondências com recorrências antes de Confirmar importação.

Voltar à revisão invalida a prévia anterior. Cada importação aceita de 1 a 200 lançamentos selecionados. O leitor sugere datas DD/MM/AAAA, DD/MM e AAAA-MM-DD e valores brasileiros, como 1.234,56. Outros formatos podem ser preenchidos manualmente.

No campo de valor, use 1234,56 ou 1234.56, sem sinal nem separador de milhar. Selecione entrada ou saída no campo próprio. Links e anexos embutidos no PDF não são usados como fontes de lançamentos.

## Páginas digitalizadas

Se uma página não tiver texto utilizável, selecione-a e escolha Ler imagem da página. O OCR roda no aparelho, com motor e idioma português baixados do próprio site, sem CDN ou API paga. Também é possível preencher as linhas manualmente.

A leitura é opcional, uma página por vez, com cancelamento e limite de 90 segundos de reconhecimento. A imagem é limitada a 2.600 pixels no lado maior. Trocar de arquivo cancela a tarefa; uma falha não apaga linhas já revisadas.

Imagens inclinadas, colunas sobrepostas, fontes incomuns e linhas partidas podem exigir correção integral. OCR produz sugestões, e a revisão continua obrigatória.

## Compatibilidade com bancos

A leitura genérica pode ser usada com PDFs de qualquer instituição, mas a qualidade depende do layout. Foram conferidos dois layouts do Itaú, um do Nubank e uma página do Banco do Brasil com OCR. Isso não garante leitura automática de todos os arquivos desses bancos.

No Itaú, o leitor reconhece tabelas de data, lançamento, valor e saldo. Em tabelas com uma coluna de valor, negativos indicam saídas e positivos ou valores sem sinal indicam entradas, com aviso para conferência. Datas dentro da descrição não substituem a data do lançamento.

No Nubank, grupos com data completa e mês abreviado usam os títulos de entrada e saída para sugerir o tipo. Totais são excluídos. Se a soma do grupo não conferir, será preciso revisar e escolher o tipo manualmente.

Datas não são transportadas entre páginas. Grupos divididos entre páginas podem precisar de complemento manual. Resgates, aplicações e transferências próprias entram como movimentações da conta, sem vínculo automático com investimentos, outras contas ou pagamentos cadastrados.

## Duplicidades e conciliação

CSV e PDF revisado compartilham a comparação de data, descrição, tipo, valor e ocorrência da linha na conta de destino. Dados iguais podem ser ignorados como repetidos, inclusive quando são movimentações legítimas distintas. Alterar algum desses dados pode gerar outro lançamento. Os marcadores CSV antigos da Conta corrente continuam compatíveis.

OFX usa instituição, agência quando presente, conta de origem, FITID e conta de destino. O mesmo identificador é ignorado na reimportação; identificadores diferentes com valores iguais são preservados. Se o identificador reaparecer com dados diferentes, a importação é bloqueada para revisão.

Não há deduplicação automática entre OFX e CSV/PDF, entre contas de destino diferentes ou com lançamentos manuais fora dos vínculos confirmados. Excluir uma transação não apaga o marcador de importação, portanto reimportá-la não a recria automaticamente.

Para pagamentos recorrentes, confira as correspondências antes de importar. A [conciliação](conciliacao-extratos.md) permite aproveitar um pagamento já registrado ou vincular uma despesa importada sem novo débito.

Saldo, lançamentos e marcadores são gravados juntos. Uma falha não deixa a importação pela metade, embora o cadastro de uma conta de destino ainda inexistente possa ocorrer antes.

[Voltar aos guias](README.md)
