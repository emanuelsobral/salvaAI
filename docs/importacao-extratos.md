# Importação de extratos — 09/10/2026

**Atualização de 12/10/2026:** a importação na conta corrente inclui revisão de correspondências com vencimentos recorrentes. Pagamentos confirmados podem ser vinculados ou aproveitados sem débito duplicado. Veja [conciliação de extratos](conciliacao-extratos.md).

No dashboard, use **Importar extrato**, escolha a conta de destino, selecione o arquivo e revise a prévia. Só **Confirmar importação** grava os lançamentos e altera o saldo. O resultado informa quantos lançamentos foram incluídos ou ignorados e o efeito real sobre o saldo.

## Segundo formato do Itaú — 16/10/2026

A amostra de 2026 com quatro páginas foi conferida: **108/108 movimentações**, com datas completas, descrições, valores e entrada/saída; 36 linhas de saldo ficaram fora da importação. [Registro e limites da validação](validacao-extratos-pdf.md).

O leitor reconhece a tabela com data, lançamentos, valor e saldo. Na coluna única de valor, negativos são saídas e positivos/sem sinal são entradas, com aviso na revisão. Datas dentro da descrição não alteram a data do lançamento. Páginas seguintes podem reutilizar apenas a posição das colunas quando começam com linha de data completa e valores alinhados; uma data nunca é carregada de outra página.

Naquela rodada foram 112 testes do aplicativo aprovados, build aprovado e revisão confirmada no navegador sem gravar os dados. A página BB foi tratada posteriormente com OCR, em 17/10/2026, conforme a seção Validação. Isso não representa suporte universal. Resgates, aplicações e transferências próprias são registrados como entrada/saída da conta; não há vínculo automático com outras contas, investimentos ou pagamentos já cadastrados.

## Primeira validação com amostra — 16/10/2026

A [primeira amostra com BB e Itaú](validacao-extratos-pdf.md) revelou texto corrompido no BB e colunas/datas agrupadas no Itaú. O leitor reconhece tabelas com cabeçalhos explícitos de entrada/saída/saldo, repete o dia/mês dentro de um grupo da mesma página, aceita sinal negativo após o valor e avisa sobre texto ilegível. Na conferência anterior ao OCR: 10/10 movimentações do Itaú com valores e sinais esperados, ano confirmado manualmente; 0/6 do BB. O OCR de 17/10/2026 recuperou as seis movimentações dessa página BB. A página de notas foi corretamente ignorada. Não significa suporte a todos os arquivos desses bancos.

106 testes do aplicativo aprovados, build aprovado e lint sem erros (cinco avisos anteriores). Verificações de persistência no emulador citadas abaixo são da entrega anterior; as regras não mudaram nesta rodada.

## PDF genérico — 16/10/2026

Entrega local concluída: **100% dos quatro blocos desta etapa** (leitura, revisão, integração e validação/documentação). Isso não mede a cobertura dos bancos. O experimento de contratos permanece em **29% (2/7 etapas)**, pausado por prioridade do usuário.

1. Escolha um PDF em **Importar extrato**. O arquivo é aberto apenas no navegador, usando PDF.js com worker empacotado no aplicativo; não é enviado à IA nem armazenado no servidor.
2. Confira o original página por página. **Ampliar página** permite ler os detalhes em telas pequenas. Se o PDF tiver senha, informe-a para essa leitura local; ela não é gravada no banco.
3. Revise todas as sugestões. Edite data, descrição, valor e entrada/saída; desmarque saldos/totais e adicione linhas ausentes, pelo texto extraído ou manualmente.
4. Se uma linha tiver vários valores, escolha o da movimentação. Valores sem sinal exigem escolha manual, exceto em tabelas com colunas explícitas de entrada/saída reconhecidas; nesses casos, o tipo é sugerido pela coluna e deve ser conferido. Datas sem ano exigem preenchimento; o ano não é presumido. Para períodos que cruzam dezembro/janeiro, confira cada data individualmente.
5. Marque a confirmação de conferência e use **Usar lançamentos revisados**. Essa ação prepara a prévia, sem gravar. Voltar à revisão invalida a prévia anterior.
6. Confira conta de destino e correspondências com contas recorrentes. Só **Confirmar importação** altera o saldo.

Limites: PDF de até **10 MB e 50 páginas**; **1 a 200 lançamentos selecionados** por importação. A leitura sugere datas DD/MM/AAAA, DD/MM e AAAA-MM-DD e valores no padrão brasileiro (ex.: 1.234,56); outros formatos podem ser preenchidos manualmente. No campo editável de valor, use 1234,56 ou 1234.56, sem sinal nem separador de milhar. Escolha entrada/saída no campo próprio.

PDFs sem texto extraível ou com fonte interna ilegível mostram um aviso. Selecione a página e clique em **Ler imagem da página** para executar OCR local, ou preencha manualmente. O leitor e os dados de português são baixados do próprio site; a imagem do extrato fica no aparelho. A leitura é opcional, por página, com cancelamento, limite de 90 segundos para reconhecimento e imagem limitada a 2.600 pixels no lado maior. A revisão permanece obrigatória. Linhas partidas, colunas sobrepostas, fontes incomuns e valores em outros padrões podem exigir correção integral. Descrições e valores são sugestões, não dados bancários certificados. Não são lidos links nem anexos embutidos como fontes de lançamentos.

### Compatibilidade com bancos

| Situação | Suporte atual |
|---|---|
| PDF com texto, de qualquer instituição | Leitura genérica e revisão manual; sem depender do nome do banco |
| PDF escaneado ou sem texto utilizável | OCR local por página, visualização e correção manual; qualidade depende da imagem |
| PDF protegido por senha | Abertura local mediante senha; pode haver formatos de proteção incompatíveis |
| Garantia de leitura automática de todos os bancos | Não estabelecida; dois layouts Itaú, um Nubank e uma página BB com OCR conferidos |

A próxima etapa é coletar extratos anonimizados representativos, comparar todas as linhas com o original e registrar banco/layout e resultado. Não publicar dados pessoais nos testes. Há casos fictícios de regressão e uma amostra fornecida pelo usuário; dados originais não foram incluídos no Git.

PDF e CSV compartilham o marcador de duplicidade: dados exatamente iguais na mesma conta são ignorados. Se uma descrição/data/valor mudar, pode ser criado outro lançamento. Movimentos legítimos iguais em arquivos diferentes também podem ser considerados repetidos; confira os períodos. OFX usa identificadores próprios, portanto não é deduplicado automaticamente com PDF/CSV.

### Verificações desta entrega

- 85 testes do aplicativo aprovados e dois testes de integração no emulador Firebase aprovados, incluindo PDF, conciliação, proteção de alterações indevidas, deduplicação e estorno.
- Build aprovado; leitor PDF carregado sob demanda, com worker local. Mantido o aviso de tamanho do pacote principal.
- Navegador: PDF fictício de duas páginas, valores ambíguos, ano ausente, revisão obrigatória, retorno à edição, preenchimento manual de página sem texto, arquivo inválido e limite de páginas. Conferência em largura de 320 pixels.
- Cenário reproduzível: execute `npm run dev` e abra `/tests/fixtures/pdf-review.html`. Não usa login, dados reais, Firebase nem Gemini. Não é uma entrada do build publicado.
- Sem deploy. Ao publicar, incluir a versão atual de `firestore.rules`, que permite conciliar lançamentos identificados como PDF sem liberar edição arbitrária de valores.

Referência técnica: [PDF.js — exemplos oficiais](https://mozilla.github.io/pdf.js/examples/).

## Arquivos aceitos

- CSV: arquivo ou texto colado, com três colunas na ordem data, descrição e valor. Separadores aceitos: vírgula, ponto e vírgula e tabulação. Cabeçalho opcional iniciado por Data. Saídas negativas e entradas positivas. Datas DD/MM/AAAA ou AAAA-MM-DD; valores em reais com até duas casas decimais.
- OFX bancário: versões 1.x com folhas SGML ou 2.x XML, conta corrente/poupança, moeda BRL, uma conta de origem e uma lista de movimentações por arquivo. Requer BANKID, ACCTID, ACCTTYPE, DTPOSTED, TRNAMT, FITID e NAME ou MEMO. O sinal de TRNAMT define entrada/saída. É mantida a data de lançamento do banco, sem deslocamento de fuso.
- CSV/OFX: até 1 MB e 200 transações por operação. UTF-8 e Windows-1252; OFX com declaração ISO-8859-1 também é decodificado. Exportações em UTF-16 não são suportadas.

Não há sincronização com bancos nem envio de arquivos a uma IA. O arquivo é lido no navegador; somente os lançamentos e marcadores de importação são gravados no Firestore.

## Prévia e conta de destino

Os destinos disponíveis acompanham o sistema atual: Conta corrente, Vale Refeição e Vale Alimentação. A escolha é manual e deve corresponder à conta correta. O final da conta bancária de origem é mostrado nos arquivos OFX. Não há criação de um cadastro bancário separado por instituição nesta etapa.

A prévia mostra as dez primeiras linhas e o total antes da deduplicação. O valor final é exibido após confirmar. O saldo de fechamento contido no OFX não substitui o saldo atual do aplicativo: são somadas apenas as movimentações incluídas. Certifique-se de que o saldo inicial não inclua o período que será importado.

Exemplo CSV:

```csv
Data;Descrição;Valor
09/10/2026;Mercado;-150,00
09/10/2026;Salário;5000,00
```

## Duplicidades e consistência

- CSV e PDF revisado: comparam data, descrição, tipo, valor e ocorrência da linha na conta de destino. Mantém compatibilidade com os marcadores antigos da Conta corrente. Sem um identificador bancário, lançamentos diferentes com dados idênticos podem ser considerados repetidos.
- OFX: usa instituição, agência quando presente, conta de origem, FITID e conta de destino. Repetições do mesmo identificador são ignoradas. Identificadores diferentes com valores iguais são preservados. Se o mesmo identificador reaparecer com dados diferentes, a importação é bloqueada para conciliação.
- Não há conciliação automática entre CSV e OFX, entre contas de destino distintas ou com lançamentos criados manualmente. Evite importar o mesmo período nesses caminhos diferentes.
- Saldo, lançamentos e marcadores são gravados na mesma transação do Firestore. Falhas não deixam uma importação parcialmente aplicada. O cadastro de uma conta de destino ainda inexistente pode ocorrer antes dessa transação.

## Limites desta etapa

Não são aceitos OFX de cartão, investimento, empréstimo, moeda estrangeira, múltiplas contas, correções bancárias (CORRECTFITID/CORRECTACTION), entidades externas ou CDATA. CSV com outras colunas/ordens deve ser convertido para o modelo acima. Um erro em qualquer linha impede a confirmação de todo o arquivo.

Leitura baseada no subconjunto de extratos bancários da [especificação OFX](https://financialdataexchange.org/common/Uploaded%20files/OFX%20files/OFX%20Banking%20Specification%20v2.3.pdf). Não é um importador universal de todos os produtos e extensões OFX.

## Validação

Rodada de qualidade e telas pequenas (17/10/2026): quatro imagens fictícias testadas; resultados variaram de zero a quatro movimentações completas de quatro esperadas. Corrigida leitura de colunas separadas e ativada correção de inclinação. Campos vazios são destacados para revisão; em telas pequenas, campos e áreas de toque foram ampliados. Cancelamento, troca de arquivo e revisão em 320/390 pixels conferidos. **129 testes aprovados e build aprovado**. Não equivale a teste em aparelho físico. [Resultados, limites e reprodução](validacao-ocr-qualidade.md).

Validação de OCR (17/10/2026): **6/6 movimentações do BB com data, valor e entrada/saída correspondentes ao original (100% desses campos nesta página)**. Saldos excluídos, seis registros válidos gerados na revisão local, sem gravação na conta. O PDF mistura bancos; para esse teste foram selecionadas apenas as linhas do BB. Descrições podem conter erros de caracteres: uma renderização de teste confundiu uma letra, enquanto a renderização do navegador permitiu a leitura correspondente. A indicação de incerteza do motor não é uma probabilidade de acerto. Oito testes novos; 127 testes e build aprovados. Cache e build de validação foram direcionados à unidade C: por falta de espaço temporária na H:.

Implementação: Tesseract.js 7.0.0 e dados locais de português; o build inclui os arquivos necessários em `ocr/`. O navegador carrega somente a variante do motor compatível com o aparelho e apenas quando solicitada. Não usa CDN nem API paga. Falhas não apagam linhas já revisadas; a troca do arquivo cancela a tarefa. [API oficial do Tesseract.js](https://github.com/naptha/tesseract.js/blob/master/docs/api.md).

Validação de PDF Nubank (17/10/2026): dez movimentações conferidas em três páginas, com totais correspondentes ao resumo. O leitor reconhece grupos com data completa e mês abreviado, usando os títulos de entrada/saída para sugerir o tipo. Totais ficam fora dos lançamentos. Se a soma do grupo não conferir, a tela pede revisão e escolha manual de entrada/saída. A data não é transportada entre páginas; grupos divididos podem exigir preenchimento manual. A conferência foi local, sem gravar lançamentos nem publicar a alteração. **100% desta amostra (10/10), não de todos os formatos do banco.** [Resultados e limites](validacao-extratos-pdf.md).

Testes cobrem XML/SGML, valores e datas inválidos, moeda estrangeira, codificações, limites de tamanho, falha de gravação, reimportação concorrente, arquivos sobrepostos, IDs alterados, isolamento por conta e marcadores CSV legados. Os testes de persistência usam o simulador local do projeto; não gravam em contas reais.

Validação inicial de CSV/OFX (09/10/2026): 46 testes aprovados, build aprovado e lint sem erros (cinco avisos anteriores). Teste de navegador com dados fictícios verificou upload CSV/OFX, seleção de destino, confirmação, rejeição de arquivos inválidos e layout em 320 e 390 pixels. Nenhuma chamada à IA foi feita. Ainda não foi realizado deploy nem importação com um extrato bancário real.
