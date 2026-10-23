# Conciliação de extratos e recorrências — 12/10/2026

A conciliação liga uma despesa do extrato a um vencimento de uma conta recorrente. As sugestões são calculadas localmente, sem IA, e nenhuma correspondência é confirmada automaticamente.

## Durante a importação

1. Selecione a conta corrente, carregue CSV ou OFX e clique em **Buscar correspondências**.
2. Para cada linha sugerida, escolha o vencimento ou **É outra despesa: importar separadamente**. Nada vem selecionado.
3. Confira se o vencimento está pendente ou se já tem um pagamento registrado.
4. Confirme a importação. Alterar o conteúdo, formato ou destino exige nova revisão das sugestões.

| Situação confirmada | Efeito |
|---|---|
| Vencimento pendente e linha nova | Cria a despesa, desconta o saldo uma vez e marca o vencimento como pago. |
| Vencimento já pago | Aproveita o pagamento existente e registra o identificador da importação, sem novo débito. |
| Linha já importada e vencimento pendente | Vincula o lançamento existente, sem novo débito. |
| Extrato e vencimento já possuem pagamentos diferentes | Bloqueia a conciliação para revisão no histórico; não funde ou exclui registros automaticamente. |
| Escolha de importar separadamente | Trata a linha como outra despesa e mantém o vencimento independente. |

A deduplicação CSV/OFX anterior continua funcionando. Fora dos vínculos confirmados, não há deduplicação geral entre formatos ou entre importação e lançamentos manuais.

## Depois da importação

Em **Contas recorrentes**, use **Vincular extrato** ao lado de um vencimento em aberto. Escolha um lançamento compatível e confirme. O lançamento permanece no histórico, o saldo é preservado e o vencimento deixa de ser descontado na projeção.

Se o vínculo estiver errado, use **Desvincular extrato**. A despesa importada e o saldo continuam iguais, mas o vencimento volta a ficar em aberto. Para remover a própria despesa e devolver seu valor ao saldo, exclua o lançamento no histórico; isso também remove o vínculo.

Pagamentos manuais aproveitados durante a importação continuam sendo pagamentos manuais. A opção de desvincular extrato se aplica a despesas originadas de importação. Excluir um lançamento não remove o marcador de importação: reimportar o mesmo registro não o recria automaticamente.

## Critérios e limites

- Somente despesas da conta corrente e recorrências com `billingMode: ACCOUNT`. Assinaturas antigas cobradas na fatura ficam fora.
- Valor exato em centavos e data bancária até sete dias antes ou depois do vencimento. Para pagamentos já registrados, também se compara a data do pagamento.
- Palavras da descrição semelhantes ao nome da conta priorizam sugestões. Isso não comprova a correspondência; valores iguais podem gerar várias opções.
- Datas bancárias futuras não são conciliadas. Pagamentos parciais, juros, descontos e valores divergentes exigem revisão manual.
- Até dez vínculos por importação; o limite geral continua em 200 linhas. Para mais vínculos, importe separadamente e concilie depois na tela de recorrências, ou divida o arquivo sem repetir linhas.
- Não reutiliza um lançamento em dois vencimentos nem duas linhas em um vencimento.
- Duplicidades já gravadas em duas despesas não são corrigidas automaticamente. Revise e estorne o registro incorreto antes de vincular o registro restante.
- A categoria, descrição, valor, conta e data do extrato são preservados. As consultas ainda leem as coleções completas; paginação permanece uma melhoria futura.

## Persistência e segurança

O vínculo converte somente os campos `kind`, `subscriptionId` e `dueDate` da transação importada, de `REGULAR` para `RECURRING_PAYMENT`. O mapa `subscriptions.payments` guarda a transação, data, valor e `source: IMPORT`. Saldo, vínculo, histórico e marcadores são escritos atomicamente quando aplicáveis. A confirmação revalida os documentos para lidar com alterações feitas desde a prévia e tentativas simultâneas.

`reconciliationService.js` fornece `getReconciliationCandidates`, `reconcileTransaction` e `undoReconciliation`. `importStatement` aceita a opção `reconciliations`, com itens `{ rowIndex, subscriptionId, dueDate }`; os índices começam em zero nas linhas válidas do arquivo.

**Publicação necessária:** esta etapa altera `firestore.rules` para permitir mudanças restritas no vínculo de transações importadas. Publique as regras no projeto Firebase correto antes de disponibilizar a interface atualizada. As regras mantêm valor, conta, data e descrição imutáveis nessas alterações e exigem o vínculo correspondente no documento da recorrência. O código e as regras foram preparados localmente; não há deploy automático.

Os testes em `tests/reconciliation.test.js` cobrem sugestões, importação, reaproveitamento, concorrência, rollback, estorno e recusa de combinações inválidas. `tests/firebase.integration.js` valida os serviços e as permissões reais no emulador, sem acessar produção.
