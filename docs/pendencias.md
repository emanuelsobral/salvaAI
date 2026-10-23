# Pendências e próximos passos

[Índice](README.md) · [Mudanças concluídas](CHANGELOG.md)

Atualizado em **13/10/2026**. O acompanhamento está no **[Kanban do SalvaAI](kanban.md)**, com prioridades, dependências, critérios de conclusão e movimentações. Use esse quadro como fonte de status.

**E03 — anotação humana pendente, com Alto para apoio técnico.** O [experimento](../experiments/contracts/README.md) tem protótipo local 0.1.0, piloto original de 26 PDFs e [dois contratos institucionais preenchidos](../experiments/contracts/coleta-preenchidos.md) em catálogo complementar de desenvolvimento. Começar pelo `pub-alu-03`; os 28 formulários continuam vazios e os dez documentos de teste originais permanecem reservados. A cobertura inicial do extrator é baixa e a precisão não foi medida. Faltam anotar/revisar o gabarito e congelar versões antes da E05. E02 continua em andamento (Médio), sobretudo para obter contratos pessoais preenchidos. A agenda K01 permanece pronta para a sequência. Backup, testes, regras do banco e publicação estão em K02–K07.

## Atualização das pendências

- CSV/OFX, recorrências, conciliação de extratos e edição por data já estão implementados localmente. A conciliação dos dados antigos sem vínculos continua em K28.
- As novas recorrências preservam condições e pagamentos. O histórico das assinaturas antigas do cartão tem cartão próprio, K15.
- IA está desativada. Migração do SDK Gemini e novas chamadas de chat/recibos deixaram de ser próximos passos.
- Git e configuração Netlify já existem. Preparação/publicação das alterações recentes continuam pendentes; integração contínua está em K24.
- Mobile responsivo já existe. PWA, uso offline e notificações com aplicativo fechado são entregas futuras distintas.

Concluído no código local não significa publicado. Consulte as evidências no [Kanban](kanban.md) e no [changelog](CHANGELOG.md).

## Lista histórica — revisão de 13/09/2026

O conteúdo abaixo é preservado como histórico e **não representa o status atual**. Os itens ainda aplicáveis foram incorporados ao Kanban; OFX e IA, por exemplo, tiveram seu estado alterado desde esta revisão.

## Prioridade 1 — Dados e publicação

| Item | Critério de conclusão |
|---|---|
| Regras Firestore | Comparar com produção, validar documentos antigos em homologação e publicar regras compatíveis |
| Backup e restauração | Exportar dados e comprovar restauração isolada |
| Conciliação | Identificar transferências e pagamentos sem vínculos; confrontar saldos e faturas sem inventar relações |
| Migração SQLite → Firestore | Implementar simulação, mapa de IDs, relatório e retomada conforme o [plano](migracao-de-dados.md) |
| Clientes antigos | Definir corte de uso para evitar novas gravações sem vínculos |
| Testes no navegador | Validar login/logout, troca de conta, formulários, falhas de rede e navegação desktop/celular |

## Prioridade 2 — Fluxos do produto

- Visualização de itens de fatura e competências anteriores; o botão atual abre a projeção.
- Ocorrências mensais persistentes de assinaturas, preservando histórico após edição/cancelamento.
- Fechamento e vencimento reais do cartão no cálculo da competência; hoje depende da seleção de mês atual ou seguinte.
- Múltiplos cartões, edição de compras e resgate de caixinhas pela interface.
- Identificação de operações pendentes persistente entre recargas; hoje depende do estado do formulário montado.
- Tratamento da ambiguidade de linhas CSV legitimamente iguais entre arquivos. Registros antigos não possuem marcadores de deduplicação.
- Categorias unificadas entre formulários, importação, recibos e gráficos.
- Agendamentos e transição de despesas `PENDING` para concluídas com atualização de saldo.
- Receitas futuras explicitamente cadastradas na projeção.
- Fuso do perfil para consistência entre dispositivos, caso necessário.
- Acessibilidade, foco/teclado em modais e padronização de confirmações e mensagens.

## Prioridade 3 — Manutenção e escala

- Paginar histórico, reduzir leituras integrais do dashboard e avaliar cache/respostas fora de ordem.
- Resolver 5 avisos restantes de lint em providers e efeitos React.
- Remover ou restringir o helper de atualização isolada de saldo, não usado nos fluxos financeiros corrigidos.
- Migrar SDK Gemini e testar chamadas reais de chat/recibos.
- Avaliar backend de IA caso o produto deixe de usar chaves individuais no navegador.
- Reforçar invariantes contábeis contra clientes modificados; isolamento por UID não impede o dono de escrever diretamente em seus documentos.
- Inicializar controle de versão e integração contínua para testes, lint e build.
- Definir hospedagem, fallback SPA, implantação e recuperação.
- Avaliar TypeScript gradualmente; o código atual permanece JavaScript/JSX.

## Fora do escopo implementado

Não há integração bancária/Open Finance, pagamentos bancários reais, OFX, aplicativo nativo ou fluxo offline completo. Pagamento de fatura é um registro interno e não envia dinheiro ao banco.
