# Contratos

A tela Contratos permite guardar valores, prazos e condições e planejar parcelas de valor fixo. Você pode preencher o cadastro manualmente ou revisar sugestões obtidas de um PDF.

## Cadastrar ou editar

Abra Contratos e escolha Novo contrato. Apenas o título é obrigatório. Os demais campos são pessoa ou empresa contratada, valor da parcela, número de parcelas, início e término da vigência, regra de vencimento, regra de reajuste e observações.

Deixe em branco o que não estiver informado no documento. O aplicativo não calcula a quantidade de parcelas a partir da duração do contrato. Salvar o cadastro não cria cobranças nem altera o saldo.

Use Editar para corrigir os dados. Se outra tela já tiver alterado o contrato, a versão antiga será recusada e seus campos continuarão no formulário. Cancele, atualize a lista e reaplique a alteração.

## Importar um PDF

1. Escolha Importar PDF. Para documentos digitalizados ou com texto parcial, marque Ler páginas digitalizadas (OCR) antes de selecionar o arquivo.
2. Aguarde a leitura no dispositivo. O limite é de 10 MB e 50 páginas, sem senha.
3. Confira as sugestões de valor da parcela, quantidade de parcelas, vencimento, vigência e reajuste.
4. Abra Conferir evidências da leitura do PDF para consultar os trechos e as páginas usados.
5. Informe o título, corrija os campos com base no original e marque a conferência antes de salvar.

Editar qualquer campo desmarca a confirmação. Cancelar descarta o preenchimento; escolher outro arquivo descarta a leitura anterior. Campos ausentes ou ambíguos ficam vazios, sem datas ou valores estimados.

O PDF é lido localmente, sem envio a uma IA ou armazenamento do original no servidor. Ao salvar, os campos revisados e as evidências vão para sua conta no Firestore. As evidências conservam a sugestão original, mesmo quando você corrige o valor, e continuam disponíveis após recarregar ou editar o cadastro.

## OCR e limites da leitura

No primeiro uso, o navegador baixa cerca de 12 MB para o motor de regras. O OCR exige arquivos adicionais, também servidos pelo próprio site. É necessária uma conexão inicial; não há garantia de uso offline.

O modo normal lê a camada de texto do PDF. Se alguma página não tiver texto utilizável, ative o OCR e selecione o arquivo novamente. Nesse modo, todas as páginas são lidas como imagens, inclusive as que têm texto parcial. Uma página vazia ou ilegível impede o resultado completo.

A leitura normal tem limite total de dois minutos. Para OCR, são dez minutos no total, até 90 segundos por página e até 90 segundos para as regras de extração. Esses limites encerram a tentativa; aparelhos mais lentos podem excedê-los.

A indicação Origem: OCR identifica transcrições automáticas. O aplicativo não corrige dígitos incertos por conta própria. Nitidez, rotação, manuscritos, tabelas e ordem das colunas afetam o resultado. Confira sempre valores e datas no original. A precisão dos cinco campos em contratos reais ainda não foi medida com avaliação independente.

## Planejar parcelas

1. No contrato salvo, escolha Planejar compromissos.
2. Informe valor por parcela, quantidade, primeiro vencimento e frequência semanal, mensal ou anual. Uma única parcela também é aceita.
3. Clique em Ver prévia e confira as datas e o total. Essa ação ainda não grava o plano.
4. Confirme que revisou os dados e que as mesmas contas não foram cadastradas antes. Depois, escolha Confirmar compromissos.
5. Abra Ver vencimentos para acompanhar as parcelas nas contas recorrentes, já filtradas pelo contrato e pelo mês inicial.

O calendário preserva o dia escolhido: uma série iniciada em 31 de janeiro vence em 28 de fevereiro, em ano comum, e volta ao dia 31 em março. O último vencimento encerra a série. Datas fora da vigência recebem um aviso para revisão.

Cada contrato aceita um plano de parcelas iguais. A primeira data e a frequência precisam ser escolhidas; o sistema não interpreta regras como "30 dias após a nota fiscal", consulta dias úteis ou calcula juros, carência e reajustes. Ele também não identifica automaticamente contas equivalentes cadastradas em outro lugar.

Salvar o contrato e confirmar o plano não alteram o saldo. Registre o pagamento apenas depois de pagar. Se a despesa já foi importada, use a [conciliação com o extrato](conciliacao-extratos.md) para evitar outro débito.

## Alterações e encerramento

Editar o cadastro não modifica o plano confirmado. A edição genérica de recorrências fica bloqueada para planos de contratos.

Encerrar recorrência cancela os vencimentos futuros ainda sem pagamento, preservando pagamentos e pendências até hoje. Essa ação não encerra juridicamente o contrato nem permite criar outro plano. Excluir um pagamento no histórico devolve o valor ao saldo e reabre o vencimento, exceto quando se trata de um vencimento futuro cancelado.

Reajustes automáticos, alterações do plano, exclusão ou encerramento do cadastro e armazenamento do PDF original continuam pendentes.

[Voltar aos guias](README.md)
