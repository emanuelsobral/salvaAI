# Validação da 5ª entrega do SalvaAI

Data: 15/10/2026. Documento analisado: `C:/Users/Vitor/Downloads/SalvaAI_5ENTREGA.pdf` (39 páginas). Comparação com o código presente na pasta de trabalho, incluindo alterações ainda não commitadas.

## Parecer

O projeto implementa boa parte do escopo financeiro descrito, mas ainda não cumpre integralmente o documento. Os três requisitos essenciais de contratos (RF28–RF30) não estão implementados. Também falta apresentar o detalhamento da fatura previsto em RF16. Há quatro problemas reproduzidos nesta revisão, principalmente na importação e nos indicadores. O PDF precisa atualizar funcionalidades que já foram entregues e corrigir algumas afirmações incompatíveis com o código.

Esta é uma revisão: não foram alterados dados financeiros reais, regras publicadas nem funcionalidades da aplicação.

## Evidências e limites da validação

- `npm test`: 48 testes existentes passaram.
- `npm run lint`: nenhum erro; seis avisos, incluindo dependências/atualização de estado em efeitos, exportações e escape desnecessário.
- `npm run build`: passou, com aviso de tamanho do bundle principal (aproximadamente 895 kB antes de compressão).
- Quatro verificações adicionais demonstraram os problemas abaixo, usando dados sintéticos e o harness local, sem acessar a conta do usuário.
- Os quatro testes de integração do Firestore haviam passado na etapa anterior. Não foram executados novamente nesta revisão; isso não equivale a uma nova validação das regras publicadas.
- Não foi feita chamada real ao Gemini. A configuração local examinada não tinha `GEMINI_API_KEY`; o funcionamento do serviço publicado depende de sua própria configuração.
- O login Google tem implementação, mas a habilitação efetiva do provedor no projeto não foi confirmada nesta revisão.

Para reproduzir as verificações adicionais, na raiz do projeto:

```powershell
node --experimental-vm-modules docs/validacao-5entrega/probes.mjs
```

## Erros reproduzidos

### 1. Alta prioridade: importações simultâneas podem duplicar uma despesa

Uma mesma despesa de R$ 25 importada simultaneamente em CSV e OFX gerou duas transações e saldo de −R$ 50. O esperado era uma transação e −R$ 25.

Em `src/services/importService.js`, a busca por transações equivalentes ocorre antes da transação do Firestore. Os marcadores de importação podem ser diferentes entre formatos/fontes, permitindo que ambas as operações concluam. A proteção que funciona em importações sequenciais não cobre esse cenário concorrente.

Impacto: RF25/RF26 e prevenção de duplicidade. Corrigir a identidade compartilhada e a verificação atômica; acrescentar teste concorrente entre formatos.

### 2. Alta prioridade: pagamento de fatura importado pode duplicar o gasto nos indicadores

Uma compra de cartão de R$ 100 mais uma movimentação importada intitulada “Pagamento de fatura”, também de R$ 100, resultaram em R$ 200 de despesas mensais. O gasto de consumo esperado era R$ 100.

O fluxo nativo identifica pagamentos como `INVOICE_PAYMENT`, mas a importação pode gravá-los como `REGULAR`. `src/utils/dashboard.js` então soma o pagamento ao consumo já reconhecido na compra. Isso contraria RF23.

É necessário revisar/reconciliar pagamentos de fatura importados. Uma sugestão por descrição deve admitir confirmação, pois texto livre não identifica com segurança a fatura correspondente. Este teste demonstra duplicação do indicador; não valida todos os cenários possíveis de saldo e reconciliação bancária.

### 3. Média prioridade: contas agendadas não geram os alertas esperados

Uma despesa agendada vencida e outra próxima do vencimento produziram zero notificações. A projeção de saldo considerou as obrigações, mas o gerador de notificações de `src/utils/dashboard.js` cobre cartões e assinaturas, sem incluir essas movimentações regulares pendentes.

Impacto: RF24/HU06 parcialmente atendidos. Incluir alertas de contas pendentes próximas e vencidas, com datas locais e sem repetir avisos indevidamente.

### 4. Média prioridade: opção de manter duplicada não funciona em uma repetição idêntica

Após importar uma linha CSV, repetir a mesma linha com a opção explícita de manter a duplicada resultou em zero inserções e uma linha ignorada.

Em `src/services/importService.js`, a opção altera a identificação compartilhada, mas o marcador primário continua impedindo a inserção. A interface promete um comportamento que esse caminho não permite.

Decisão necessária: distinguir “possível duplicada” de “registro já importado” na interface ou permitir uma nova identidade deliberada com confirmação. A correção deve preservar a proteção contra reenvio acidental.

## Comparação dos 33 requisitos funcionais

Legenda: **Atendido** = implementação localizada e compatível no escopo examinado; **Parcial** = há comportamento relevante, com lacunas; **Pendente** = funcionalidade não encontrada. “Atendido” não significa certificação de todos os cenários em produção.

| RF | Situação | Observação |
|---|---|---|
| 01 | Parcialmente validado | E-mail/senha e código de login Google existem; falta confirmar o provedor Google no ambiente. |
| 02 | Atendido | Cadastro com nome, e-mail e senha. |
| 03 | Atendido | Logout e proteção de sessão. |
| 04 | Atendido | Dados separados por usuário; regras de acesso presentes. |
| 05 | Atendido, com ajuste textual | Contas GENERAL/VR/VA únicas; caixinhas podem ser múltiplas. Especificar essa exceção à proibição de contas do mesmo tipo. |
| 06 | Atendido | Lançamento manual e atualização financeira atômica. |
| 07 | Atendido | Validações de valor, precisão, limites e data. |
| 08 | Parcial | Há identificadores de operação, mas nem todas as mutações usam o mesmo mecanismo; a chave do formulário fica em memória e não sobrevive ao recarregamento. |
| 09 | Atendido | Contas futuras ficam pendentes, sem débito imediato; baixa manual. PDF ainda diz “Previsto”. |
| 10 | Atendido no escopo atual | Série mensal de 2 a 60 ocorrências independentes; cancelamento preserva histórico. Documentar o limite e a geração antecipada. PDF ainda diz “Previsto”. |
| 11 | Atendido | Parcelamento entre 1 e 24 vezes, com distribuição de centavos. |
| 12 | Atendido | Competência inicial e mudança de ano. |
| 13 | Atendido | Composição da fatura por parcelas e assinaturas aplicáveis. |
| 14 | Atendido | Pagamento interno da fatura, com débito e vínculos. |
| 15 | Atendido | Controle de assinatura paga por competência; registros antigos podem exigir reconciliação. |
| 16 | Pendente na interface | Há helper de consulta, mas falta tela/lista dos itens da fatura por competência. “Ver projeção” abre a projeção anual. |
| 17 | Atendido | Cadastro, listagem e cancelamento de assinaturas. |
| 18 | Atendido | Caixinhas/metas e aporte com movimentações vinculadas. |
| 19 | Atendido | Histórico combinado com filtros e edição. |
| 20 | Atendido com divergência na HU21 | Estorno financeiro implementado, mas há exclusão física de registros; ver inconsistência documental abaixo. |
| 21 | Atendido | Farol considera obrigações do período; não inclui investimentos como consumo. |
| 22 | Parcial no escopo completo | Projeção anual existe; contratos não entram porque RF28–RF30 estão ausentes. Entradas explicitamente agendadas entram na projeção: explicar isso no texto. |
| 23 | Parcial | Pagamento de fatura importado pode duplicar despesas nos indicadores. |
| 24 | Parcial | Alertas de fatura/assinatura existem; faltam contas regulares agendadas. |
| 25 | Parcial | CSV com prévia e validação existe; há os problemas de duplicidade descritos. |
| 26 | Parcial | OFX existe, apesar de constar como previsto; precisa corrigir concorrência entre formatos. |
| 27 | Atendido no código | Recibo com preenchimento assistido e confirmação; chamada real de IA não validada nesta revisão. |
| 28 | Pendente — essencial | Não foi localizado upload/processamento de contrato e extração dos cinco campos. |
| 29 | Pendente — essencial | Falta revisão e confirmação dos dados extraídos de contrato. |
| 30 | Pendente — essencial | Falta gerar obrigações contratuais/reajustes e integrá-los à projeção. |
| 31 | Atendido no código | Chat/insights recebem contexto atualizado e não possuem operação financeira direta; depende da configuração do serviço de IA. |
| 32 | Parcialmente validado | Backend verifica sessão e mantém credencial no servidor; limites são em memória por instância. Funcionamento externo não exercitado. |
| 33 | Atendido no escopo examinado | Tema e estrutura responsiva presentes; não foi feita bateria completa de navegadores/dispositivos. |

## Requisitos não funcionais

| RNF | Avaliação |
|---|---|
| 01 | Isolamento por usuário implementado. Isso não impede um cliente modificado de adulterar determinados dados do próprio usuário. |
| 02 | Credencial de IA fica no backend. |
| 03 | Parcial: tornar explícito, antes do envio, que o recibo/contrato será processado por serviço externo. Contratos ainda não existem. |
| 04 | Transações financeiras atômicas implementadas nos fluxos examinados. |
| 05 | Parcial: não há garantia universal de identificador persistente para toda escrita/repetição; concorrência da importação falha no cenário reproduzido. |
| 06 | Há vínculos para estornos; exclusão física limita a trilha de auditoria exigida pela redação da HU21. |
| 07 | Tratamento financeiro com duas casas e distribuição de centavos presente. |
| 08 | Testes existem e passam; os quatro cenários reproduzidos revelam lacunas na cobertura. |
| 09 | Validação do lote antes da confirmação presente. |
| 10 | Consultas paralelas no dashboard já existem; atualizar a limitação descrita no PDF. |
| 11 | Pendente: consultas ainda carregam coleções completas, sem paginação/estratégia de agregação para crescimento. |
| 12 | Limites existem: até 200 linhas interpretadas e 150 selecionadas por confirmação. Documentar essa diferença. |
| 13 | Prévia da importação existe; revisar se todas as operações múltiplas precisam apresentar o mesmo nível de impacto. |
| 14 | Tema/responsividade implementados, com limite de validação visual descrito acima. |
| 15 | Formatação BRL e datas locais presentes. |
| 16 | Separação entre componentes, serviços e utilitários presente; a arquitetura não é uma cadeia estrita de camadas. |
| 17 | Aplicação web; não exige instalação específica de Windows pelo usuário. |
| 18 | React/Firebase e backend de IA correspondem à implementação. |
| 19 | Modelo configurável no backend. O identificador padrão `gemini-3.8-flash` possui documentação oficial; não foi tratado como erro. |
| 20 | Operação depende de conexão; não foi localizado fluxo offline completo. |

**Este PDF contém RNF01 a RNF20. Não há RNF24.** Portanto, não é possível validar o RNF24 mencionado anteriormente sem sua redação em outra versão.

## Ajustes necessários no artigo/documento

1. **Páginas 13–14:** atualizar RF09, RF10 e RF26: já possuem implementação. Registrar limites e problemas remanescentes, evitando apenas trocar tudo para “concluído”.
2. **Página 15, limitações:** remover a afirmação de que não há edição de transações. Hoje existe edição de título, valor, categoria e meio de pagamento.
3. **Página 24, HU21:** “sem apagar registros” conflita com a exclusão física em `transactionService.js`. Se auditoria permanente for exigência, implementar cancelamento/estorno com preservação do original; caso contrário, ajustar a história. É uma decisão de requisito, não apenas de redação.
4. **Páginas 26–27:** atualizar status e datas do cronograma. Incluir a entrega do artigo de 25/10, informada pelo usuário, além da entrega de 02/11.
5. **Páginas 28–29:** UID é identificador do usuário, estável entre sessões; não deve ser descrito como identificador da sessão. O diagrama de classes deve representar recorrência, incluir o estado `CANCELLED`, definir o tipo `TipoMovimentacao` e alinhar `Operacao.resultado` ao objeto estruturado utilizado no código, em vez de `String` se o modelo pretende refletir a implementação.
6. **Página 31:** o pagamento fecha itens da mesma competência selecionada; corrigir a expressão “competências distintas”.
7. **Páginas 33 e 36:** nem toda mutação passa por `financialOperation`. Importação, edição, exclusão e baixa de agendamento possuem caminhos próprios. Corrigir essa generalização ou unificar a implementação.
8. **Páginas 33–36, rastreabilidade:** RF09/RF10 pertencem a `scheduleService`, não a `cardService`; incluir agendamentos/recorrências nos elementos pertinentes e atualizar os módulos adicionados.
9. **Páginas 35–38:** descrever camadas lógicas com dependências reais. Os serviços acessam Firestore diretamente; a afirmação de que cada camada depende somente da imediatamente inferior não descreve fielmente o código.
10. **Página 37:** qualificar “leitura de contratos” como prevista na tabela da Gemini API; o backend atual só aceita ações de chat, insight e recibo.
11. **Página 21:** separar RNF10, já atendido no dashboard por paralelismo, de RNF11, ainda pendente por falta de paginação/agregações.
12. **Introdução/referências:** a CNC confirma 82% de famílias endividadas em julho de 2026. Para “85,3% desse endividamento”, conferir a fonte primária e o denominador: percentual de famílias que citam cartão não equivale à participação do cartão no valor total da dívida. Usar referência direta à pesquisa, data e população, sem converter uma medida na outra.

Os diagramas das páginas 11, 29, 32 e 36 foram inspecionados visualmente. Não foi identificado corte evidente nessas figuras. A avaliação não substitui revisão de normalização conforme o manual da instituição, que não foi fornecido.

## Segurança e arquitetura: pendências distintas do funcionamento normal

As regras protegem o acesso entre usuários, mas permitem algumas alterações diretas em saldos/dados financeiros do próprio usuário sem exigir uma operação contábil equivalente. Se o requisito for resistência à adulteração por cliente modificado, será necessário restringir essas gravações e concentrar operações sensíveis em backend confiável. Pagamento de fatura, estorno e importação são candidatos importantes. Não é correto afirmar que isso já está resolvido apenas porque há transações no SDK cliente.

O limitador da IA usa memória de processo. Ele reinicia com a instância e não estabelece uma cota global persistente entre instâncias. O RF32 deste PDF fala em limite por usuário e por instância; um contador global persistente é uma melhoria adicional, não uma obrigação textual encontrada aqui. A verificação de integridade da aplicação também precisa de decisão/configuração própria; não foi validada como proteção ativa nesta revisão.

## Ordem recomendada de conclusão

### Antes da entrega do artigo — 25/10

1. Definir o escopo dos contratos: protótipo experimental de terminal ou integração ao aplicativo. **O protótipo isolado não cumpre RF28–RF30 conforme este PDF**, que exige revisão, geração de obrigações e integração à projeção.
2. Entregar o protótipo que recebe PDF e retorna JSON com valor da parcela, número de parcelas, vencimento, vigência e reajuste. Não preencher dados ausentes por suposição.
3. Montar conjunto de contratos, identificadores, gabaritos manuais e critérios de avaliação antes da medição. Preservar arquivos de entrada, saídas brutas e erros; proteger dados pessoais dos contratos reais.
4. Comparar extração com gabarito por campo. Definir tolerâncias monetárias e de datas, normalização e tratamento de campo ausente/não aplicável. Para precisão/revocação, explicitar o que conta como verdadeiro positivo, falso positivo e falso negativo. Definir também limiar de “alta confiança”; se o protótipo não produzir confiança calibrada, não apresentar esse indicador como se fosse probabilístico validado.
5. Registrar resultados, limitações e falhas reais. O repositório examinado ainda não contém a implementação e os resultados necessários para sustentar esse experimento de contratos.
6. Atualizar o PDF para separar claramente o que está implementado, o que foi apenas projetado e o que foi efetivamente avaliado.

### Antes da entrega do projeto — 02/11

1. Corrigir duplicidade concorrente e contagem de fatura importada, com testes de regressão.
2. Implementar RF16 e alertas de contas agendadas; alinhar a opção de manter duplicada ao comportamento real.
3. Concluir ou renegociar formalmente RF28–RF30, classificados como essenciais no documento.
4. Resolver a divergência de auditoria da HU21 e fechar os requisitos de segurança com a versão correta do RNF24.
5. Configurar/verificar o backend de IA no ambiente de entrega e validar login Google se ele permanecer no escopo obrigatório.
6. Fazer ensaio completo com dois usuários, importação repetida, erro/reenvio, baixa agendada, cancelamento de série, fatura, estorno e datas de virada de mês/ano. Usar dados de teste.

## Fontes externas verificadas

- CNC, publicado em 06/08/2026: [Endividamento é o maior da série histórica](https://portaldocomercio.org.br/acoes-institucionais/cnc-endividamento-e-o-maior-da-serie-historica/), confirmação do percentual de 82% em julho.
- Google: [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), documentação do modelo configurado como padrão no backend.

## Principais arquivos de evidência

- `src/services/importService.js`: revisão, identidade, marcadores e confirmação de importações.
- `src/utils/dashboard.js`: despesas mensais, projeção e notificações.
- `src/services/scheduleService.js`: agendamento, baixa e cancelamento de recorrências.
- `src/services/cardService.js` e `src/pages/DashboardPage.jsx`: pagamento, consultas de fatura e interface disponível.
- `src/services/transactionService.js`: edição, estorno e exclusão física.
- `src/services/financialOperation.js` e `src/hooks/useOperationKey.js`: idempotência e duração da chave.
- `firestore.rules`: autorização e limites das validações financeiras.
- `server/ai-handler.js`: ações aceitas, autenticação, modelo e limites em memória.
- `docs/validacao-5entrega/probes.mjs`: verificações adicionais reproduzíveis desta revisão.
