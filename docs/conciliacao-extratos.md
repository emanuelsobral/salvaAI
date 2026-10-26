# Conciliar extratos e contas recorrentes

A conciliação liga uma despesa importada ao vencimento de uma conta recorrente. O aplicativo sugere correspondências por regras locais, sem IA. Você escolhe e confirma cada vínculo.

## Durante a importação

1. Selecione a conta corrente e carregue o extrato. Para PDF, conclua primeiro a revisão das linhas.
2. Use Buscar correspondências.
3. Em cada sugestão, escolha o vencimento ou É outra despesa: importar separadamente. Nenhuma opção vem selecionada.
4. Confira se o vencimento está pendente ou já tem pagamento registrado.
5. Confirme a importação. Alterar o conteúdo, o formato ou a conta de destino exige nova revisão.

| Situação | Resultado após confirmar |
|---|---|
| Vencimento pendente e despesa nova | Cria a despesa, desconta o saldo uma vez e marca o vencimento como pago. |
| Vencimento já pago | Aproveita o pagamento existente e registra a importação, sem outro débito. |
| Despesa já importada e vencimento pendente | Vincula o lançamento existente, sem outro débito. |
| Extrato e vencimento já têm pagamentos diferentes | Bloqueia o vínculo para revisão no histórico. Não une nem exclui registros automaticamente. |
| Importar separadamente | Trata o lançamento como outra despesa e mantém o vencimento independente. |

As regras de [duplicidade da importação](importacao-extratos.md) continuam valendo. Fora dos vínculos confirmados, não há deduplicação geral entre formatos ou entre importação e lançamentos manuais.

## Depois de importar

Em Contas recorrentes, use Vincular extrato ao lado do vencimento em aberto. Escolha um lançamento compatível e confirme. O histórico e o saldo permanecem iguais, e o vencimento deixa de ser descontado na projeção.

Se o vínculo estiver errado, escolha Desvincular extrato. A despesa continua registrada e o saldo não muda, mas o vencimento volta a ficar em aberto. Para remover a despesa e devolver o valor ao saldo, exclua o lançamento no histórico; isso também remove o vínculo.

Pagamentos manuais aproveitados durante a importação continuam manuais. A opção de desvincular extrato vale para despesas originadas de importação. Excluir um lançamento não apaga o marcador de importação: reimportar o mesmo registro não o recria automaticamente.

## Critérios e limites

As sugestões consideram despesas da conta corrente e recorrências pagas por essa conta. Assinaturas antigas da fatura ficam fora.

O valor precisa coincidir em centavos, e a data bancária deve estar até sete dias antes ou depois do vencimento. Quando já existe pagamento, sua data também entra na comparação. Palavras semelhantes entre descrição e nome da conta priorizam opções, mas não comprovam o vínculo; despesas iguais podem gerar várias sugestões.

Datas bancárias futuras não são conciliadas. Pagamentos parciais, juros, descontos e valores diferentes exigem revisão manual.

Cada importação permite até dez vínculos, com limite geral de 200 linhas. Para mais vínculos, importe e concilie depois na tela de recorrências, ou divida o arquivo sem repetir linhas. Um lançamento não pode pagar dois vencimentos, nem duas linhas podem ser usadas no mesmo vencimento.

Duplicidades já gravadas não são corrigidas automaticamente. Revise e estorne o registro incorreto antes de vincular o restante. Categoria, descrição, valor, conta e data do extrato são preservados.

A confirmação confere novamente os registros antes de gravar, para lidar com mudanças feitas após a prévia e tentativas simultâneas.

[Voltar aos guias](README.md)
