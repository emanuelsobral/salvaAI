# Melhorias de produto — 15/10/2026

Implementação dos itens 2–9 solicitados. O texto completo de RF09, RF10 e RNF24 ainda será fornecido para alinhamento; os comportamentos abaixo são os critérios usados nesta rodada.

## Importação e categorias

- CSV e OFX são comparados com lançamentos concluídos em Conta Livre por data, direção, centavos e descrição normalizada, sem os dados bancários removidos. Correspondências ficam desmarcadas na prévia; o usuário pode selecioná-las quando representarem movimentos distintos. Isso é uma heurística de conciliação, não comprovação de identidade bancária para lançamentos manuais.
- Marcadores persistentes preservam reimportações, inclusive depois de estorno. OFX usa também identificador bancário e origem em hash. Contas bancárias distintas conhecidas não são fundidas por terem lançamentos iguais. A identificação comum preserva o conteúdo original ao editar título ou valor.
- A prévia permite selecionar linhas e corrigir título/categoria. Até 150 linhas são gravadas atomicamente por confirmação, devido aos marcadores adicionais. Um arquivo pode conter até 200 linhas para revisão.
- Descrições bancárias são higienizadas antes da persistência. A descrição original persistida também é higienizada; identificadores e fingerprints não armazenam agência/conta legíveis.
- Sugestões de entrada e saída são separadas. Recebimento Pix não é presumido como salário. A edição oferece memorizar uma categoria por pessoa/estabelecimento e direção; a chave persistida é um hash. Categorias existentes não foram sobrescritas em massa.

## Investimentos e histórico

- Aplicações reduzem o saldo livre, mas não integram os gastos de consumo dos gráficos e do farol. O painel informa aplicações do mês separadamente; não representa uma carteira com cotação, rentabilidade ou integração bancária.
- Busca ignora maiúsculas e acentos. Os filtros combinam direção, datas inclusivas, categoria, situação e busca por título/pessoa.
- Totais de entradas, saídas, aplicações e diferença consideram apenas movimentos concluídos em conta (incluindo benefícios). Transferências internas e parcelas do cartão não são somadas novamente. A diferença também desconta aplicações; pagamentos efetivos de fatura são saída de caixa.

## Agendamentos e recorrências

- Data futura ou opção explícita de agendar cria uma ocorrência `PENDING` sem alterar saldo. O histórico permite confirmar pagamento/recebimento, debitando/creditando a conta atomicamente uma única vez.
- Repetição mensal de 2 a 60 ocorrências cria documentos independentes e uma série persistente. Todas nascem pendentes. Datas 29–31 são limitadas ao último dia de cada mês, retomando o dia original nos meses seguintes.
- Editar uma ocorrência não altera as demais. Parar série cancela ocorrências pendentes a partir de hoje, preservando concluídas e pendências vencidas. Não existe débito automático ou tarefa em segundo plano; as datas ficam salvas mesmo com o aplicativo fechado.
- Projeção considera receitas futuras explicitamente agendadas. O farol não presume seu recebimento antecipado.

## Segurança e interface

- As regras novas validam categorias por direção, preservam conta/tipo/vínculos durante edição, exigem ajuste de saldo na confirmação de pendências e isolam séries/preferências por usuário.
- Testes com Firestore Emulator usam exclusivamente `demo-salva-ai`. Foi baixado Java portátil para `.tools.local/`, ignorado pelo Git, sem instalação no Windows.
- `npm run test:firebase` detecta esse Java portátil automaticamente; em outra máquina, pode usar `JAVA_HOME` de uma instalação existente. A auditoria detalhada está em `auditoria-firestore-20261015.json`.
- Regras do aplicativo continuam sendo um protótipo. O usuário proprietário ainda pode escrever diretamente em seus saldos sob as regras de contas existentes. Para garantias contábeis contra clientes adulterados, é necessário centralizar gravações em backend e revisar integralmente criação/exclusão de operações vinculadas. Não foram implantados App Check nem contador distribuído de IA nesta rodada.
- Alertas nativos foram substituídos pelos modais do aplicativo. Um contêiner com portal evita recortes por cards; há limite de altura, rolagem, retorno de foco, navegação por Tab e Escape quando a operação não está ocupada. Histórico tem mensagens temporárias e confirmação de exclusão própria.

## Validação

- 48 testes locais passaram; quatro testes de integração passaram no emulador, incluindo acesso entre usuários, edição com saldo, concorrência, estorno, recorrência e preferências.
- Build aprovado. Lint sem erros, ainda com avisos de efeitos/provedores React.
- Conferência de interface em conta já autenticada: filtros, busca e totais; prévia de importação com dados fictícios, sem confirmar gravação. Não foram criadas recorrências fictícias no banco real.
