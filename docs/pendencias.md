# Pendências e próximos passos

[Índice](README.md) · [Mudanças concluídas](CHANGELOG.md)

Estes itens são propostas, não funcionalidades implementadas. A ordem prioriza integridade dos dados e preparação para uso real.

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
