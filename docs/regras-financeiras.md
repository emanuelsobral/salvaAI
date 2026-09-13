# Regras financeiras do SalvaAI

[Índice](README.md) · [Funções](arquitetura-salva-ai.md) · [Dados e migração](migracao-de-dados.md)

## 1. Contas e unidade monetária

GENERAL representa saldo livre; VR e VA representam benefícios; CAIXINHA representa dinheiro separado para metas. Apenas GENERAL financia aportes e pagamentos de fatura. VR, VA e caixinhas não aumentam a disponibilidade calculada pelo farol.

O banco armazena `balance`, `amount` e `goalAmount` em **reais**. Os cálculos corrigidos convertem os valores para centavos, operam com inteiros e retornam a reais. `positiveMoney()` exige número finito, positivo, até duas casas decimais e no máximo R$ 1 bilhão. O limite acompanha as regras locais do Firestore.

Exemplo: `addMoney(0.10, 0.20)` retorna `0.30`; não persistir `30` no campo `amount` esperando que ele represente R$ 0,30.

## 2. Receita e despesa

- INCOME aumenta o saldo em `amount`.
- EXPENSE reduz o saldo em `amount`.
- O valor informado é sempre positivo; o tipo define o sinal.
- A criação exige GENERAL, VR ou VA, descrição/categoria não vazias e data válida.
- O serviço grava `status: COMPLETED`; não há formulário para agendar movimentações PENDING.
- Débito/crédito, histórico e marcador de operação são gravados juntos.

O sistema admite saldo livre negativo em despesas e pagamento de fatura. Isso representa a situação registrada pelo usuário; não equivale à aprovação de crédito bancário. Aporte em caixinha exige saldo suficiente.

## 3. Repetição e concorrência

Uma operação com ID estável possui um documento em `operations`. Repetir o mesmo ID e o mesmo conteúdo devolve o resultado anterior sem aplicar o efeito novamente. Reutilizar o ID com conteúdo diferente gera erro.

Quando duas operações leem o mesmo saldo, o Firestore repete a transação conflitante sobre os dados atuais. As leituras devem ocorrer antes de qualquer escrita. Uma falha no commit não pode deixar apenas o débito ou apenas o histórico gravado.

O marcador permanece após um estorno. Assim, uma tentativa antiga não recria uma transação que o usuário já desfez. Para uma nova movimentação intencional, deve ser usada uma nova identidade.

## 4. Caixinhas e estorno de aporte

O aporte lê GENERAL e a conta de destino dentro da mesma transação. O destino deve ser CAIXINHA. Se houver saldo, debita a origem, credita o destino e cria uma EXPENSE e uma INCOME ligadas por `peerTransactionId` e `transferId`.

```text
Antes: GENERAL = 1.000; CAIXINHA = 0; patrimônio = 1.000
Aporte de 200: GENERAL = 800; CAIXINHA = 200; patrimônio = 1.000
Estorno: GENERAL = 1.000; CAIXINHA = 0; patrimônio = 1.000
```

Apagar qualquer lado de uma nova transferência estorna ambos. Os vínculos e valores são verificados; a caixinha deve possuir saldo suficiente para devolver o aporte integral. Transferências antigas identificadas pelo prefixo `[CAIXINHA]`, sem vínculo explícito, têm a exclusão bloqueada para conciliação.

## 5. Cartão e parcelas

Cada documento representa uma parcela. O lançamento cria todas de uma vez, com `purchaseId` compartilhado. São permitidas 1 a 24 parcelas, cada uma com pelo menos R$ 0,01.

O resto da divisão em centavos é distribuído pelas primeiras parcelas. R$ 100 em três vezes produz **R$ 33,34 + R$ 33,33 + R$ 33,33**.

`current_month` indica o mês da **data da compra**, não necessariamente o mês de hoje. Quando verdadeiro, a primeira parcela vai para aquele mês; quando falso, para o seguinte. A virada de ano é calculada. Os campos `closingDay`, `dueDay` e `creditLimit` ainda não governam esse cálculo.

Excluir parcela PENDING remove apenas essa parcela. Parcela PAID exige estornar primeiro o pagamento ao qual ela pertence. Não existe ação de exclusão de toda a compra parcelada.

## 6. Faturas e assinaturas

Uma competência usa a chave `YYYY-MM`. O total corrente é:

```text
fatura atual = parcelas PENDING da competência
            + assinaturas ativas, já iniciadas, ainda não quitadas nessa competência
```

O pagamento relê os candidatos, debita GENERAL, registra uma transação `INVOICE_PAYMENT`, marca parcelas como PAID e associa cada assinatura ao pagamento em `invoices/{YYYY-MM}.subscriptionPayments`.

Exemplo: parcela de R$ 100 + assinatura de R$ 50 debita R$ 150. Repetir o pagamento não gera novo débito. Se surgir uma compra adicional de R$ 30 no mesmo mês, o pagamento seguinte debita apenas R$ 30. A assinatura pode voltar a ser cobrada na competência seguinte.

O estorno de um pagamento novo devolve o valor à conta, reabre suas parcelas e remove as quitações de suas assinaturas. Outros pagamentos da mesma competência permanecem preservados. Pagamentos antigos sem vínculos têm o estorno bloqueado; a presença de pagamento legado também bloqueia novo pagamento daquela competência até conciliação.

O lote de pagamento limita a soma de parcelas candidatas e assinaturas ativas a 400 documentos. As regras locais preservam o histórico de assinaturas: cancelar marca `isActive: false`, em vez de excluir o documento.

**Limite atual:** não existe geração persistente de cada cobrança mensal independente da assinatura. Cancelar uma assinatura remove sua previsão ativa; cobranças anteriores não materializadas precisam de conciliação. Também não existe pagamento automático pelo dia do vencimento nem integração com banco.

## 7. Farol

```text
disponível = saldo GENERAL
           − parcelas PENDING de meses anteriores
           − fatura atual pendente
           − despesas normais PENDING de GENERAL com data até o mês atual
```

| Resultado | Cor |
|---|---|
| Menor que R$ 0 | Vermelho |
| De R$ 0 a R$ 500, inclusive | Laranja |
| Acima de R$ 500 | Verde |

Com R$ 1.000 em GENERAL e R$ 2.000 em fatura, o resultado é **−R$ 1.000, vermelho**. A fórmula é uma medida de disponibilidade diante dos compromissos registrados; não é um diagnóstico financeiro completo nem uma previsão de renda.

## 8. Projeção de 12 meses

A simulação começa no mês atual. O saldo inicial já desconta parcelas atrasadas. A cada mês são descontadas parcelas pendentes daquela competência, assinaturas ainda não quitadas e despesas normais pendentes daquele período. Pendências normais anteriores entram no primeiro mês.

O cálculo não presume salário recorrente, novos rendimentos, novas compras, juros ou correção monetária. `fatura_prevista` inclui parcelas e assinaturas; `despesas_previstas` contém as despesas normais. As cores usam os mesmos limites do farol.

## 9. Receitas, gastos e gráficos do mês

As barras e gráficos de categoria usam o mês atual, em `period: YYYY-MM`:

- Receitas: INCOME COMPLETED do mês, excluindo transferências.
- Gastos normais: EXPENSE COMPLETED do mês, excluindo transferências e pagamentos de fatura.
- Compras de cartão: soma das parcelas cuja **data de compra** está no mês, quitadas ou não. Isso reconhece o valor da compra nesse mês, não somente a parcela com vencimento nele.
- Assinaturas: cobranças registradas em pagamentos novos da competência, mais assinaturas ativas ainda não quitadas nela.

Uma compra de R$ 100 paga por uma fatura de R$ 100 aparece como R$ 100 de gastos, não R$ 200. Um aporte não aumenta receitas nem gastos. Categorias novas usam campo próprio; o prefixo `[CATEGORIA]` é mantido como fallback para registros antigos.

Os indicadores de gastos e o saldo livre têm escopos diferentes: os gastos do mês incluem movimentações de benefícios; o farol usa somente GENERAL. Pagamentos legados não detalham suas assinaturas, então os números históricos dessas competências exigem conciliação.

## 10. CSV e recibos

CSV aceita vírgula, ponto e vírgula ou tabulação, campos entre aspas, cabeçalho `Data`, datas brasileiras/ISO e valores positivos/negativos. O formato legado `Data, descrição, -25,50` é tratado quando a separação decimal é inequívoca. Valores ambíguos ou datas inexistentes geram erro; não são substituídos por hoje.

O lote aceita até 200 transações e entrada limitada a 1.000.000 de caracteres. Qualquer erro impede a gravação integral. A prévia mostra até dez linhas e impacto antes da deduplicação.

A deduplicação considera data, descrição, tipo, valor e posição entre ocorrências idênticas do mesmo lote. Não consulta transações legadas sem marcador. Movimentos verdadeiramente iguais em arquivos diferentes podem ser tratados como repetidos; separar/editar arquivos exige atenção e ainda não há interface para resolver essa ambiguidade. Excluir uma transação importada não apaga seu marcador.

No recibo, a imagem deve ser JPG, PNG ou WebP de até 5 MB. Campos não identificados permanecem vazios para revisão. A validação não comprova que a interpretação da imagem está correta; o usuário confirma antes de gravar.

## 11. Datas

Novas datas padrão usam o calendário local do navegador, evitando a troca prematura de dia causada por UTC à noite. Datas fornecidas devem existir no calendário. Vencimentos 29–31 são limitados ao último dia do mês para avisos; a janela de cinco dias também considera o próximo mês.

O fuso não é fixado globalmente em São Paulo: o comportamento segue o dispositivo. A padronização por perfil permanece uma decisão futura.
