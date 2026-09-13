# Registro de mudanças

[Índice](README.md) · [Comparação completa](evolucao-antigo-novo.md) · [Pendências](pendencias.md)

Este registro descreve o código local, não releases publicadas. A versão `0.0.0` do pacote React e a versão `1.0.0` da API antiga não formam uma sequência de versões do produto.

## 13/09/2026 — Correções do SalvaAI

### Integridade financeira

- Validação de valores positivos, datas reais, textos obrigatórios e limites de parcelamento.
- Cálculos monetários em centavos e distribuição do resto: R$ 100 em três parcelas resulta em R$ 33,34 + R$ 33,33 + R$ 33,33.
- Movimentações, aportes e pagamentos gravam saldo e histórico juntos em transações Firestore.
- Marcadores impedem reaplicação de uma operação com a mesma identificação; conteúdo diferente com a mesma identificação é rejeitado.
- Criação concorrente de contas padrão e cartão padrão protegida contra duplicação.
- Aportes vinculam as duas movimentações; estorno atualiza ambas as contas e remove os dois registros.
- Pagamentos vinculam parcelas e cobranças de assinaturas da competência. Compras posteriores podem ser pagas sem repetir assinaturas já pagas.
- Estorno de pagamento devolve saldo, reabre parcelas e libera as cobranças correspondentes.
- Registros antigos sem vínculos suficientes são bloqueados para conciliação.
- Cancelamento de assinatura preserva o registro histórico.

### Indicadores e calendário

- Farol considera saldo geral, parcelas vencidas, fatura do mês e despesas comuns pendentes aplicáveis.
- Indicadores mensais excluem transferências internas e não contam pagamento de fatura como segunda despesa.
- Projeção considera assinaturas ainda não pagas e despesas pendentes, sem pressupor novos salários.
- Alertas tratam virada de mês e dias inexistentes; datas sem horário são apresentadas sem deslocamento por conversão UTC.

### CSV e IA

- CSV valida todo o lote antes da gravação, tratando aspas, separadores e valores brasileiros.
- Limites de 200 linhas e 1.000.000 de caracteres; marcadores identificam linhas importadas pelo novo fluxo.
- Chave Gemini separada por UID no navegador, removível nas configurações.
- Modelo padrão alterado para `gemini-2.5-flash`, configurável por ambiente. O SDK foi mantido.
- Recibos validam valores e datas; campos ausentes não são estimados automaticamente.
- Chat consulta contexto financeiro atualizado e preserva pares completos de mensagens, excluindo respostas de erro do histórico enviado.

### Interface e manutenção

- Estados de carregamento, bloqueio de ações repetidas e tentativa novamente após falhas de consulta.
- Formulários remontados ao abrir; troca de usuário reinicia o contexto autenticado.
- Rótulos esclarecem período mensal e acesso à projeção.
- Gráficos carregados separadamente do bundle principal.
- Testes, regras locais, emulador e documentação funcional/técnica adicionados.

### Validação executada

| Verificação | Resultado |
|---|---|
| Testes locais de domínio/serviços | 16 aprovados |
| Integração com Firestore Emulator | 2 aprovados |
| Lint | 0 erros; 5 avisos React |
| Build | Aprovado; 90 módulos |
| JavaScript principal | 880,80 kB; 262,98 kB gzip |
| Chunk de gráficos | 185,45 kB; 64,31 kB gzip |

Antes das correções: 13 avisos de lint e JavaScript principal de 1.049,19 kB (322,13 kB gzip). Separar gráficos reduz o carregamento principal; não equivale à mesma redução no total gerado.

Não foram executados migração real, publicação de regras, implantação, chamada real ao Gemini ou teste visual completo. Veja [operação e testes](operacao-e-testes.md).

O [backup anterior às correções](../backups/salva-ai-before-fixes-20260913-154505.zip) preserva código, não o banco de dados.

## SalvaAI inicial — Modernização já existente

React, Vite, Firebase Authentication, Firestore, rotas/componentes, chat e recibos com Gemini já estavam presentes antes desta rodada. As telas financeiras já tinham sido portadas. Não há data de release comprovada nesta revisão.

## AgentFinanceiro legado

Python/FastAPI, SQLite e HTML/CSS/JavaScript já ofereciam dashboard, contas, receitas/despesas, histórico, cartões parcelados, faturas, caixinhas, assinaturas, CSV, gráficos e tema. A [comparação funcional](evolucao-antigo-novo.md) distingue recursos preservados, reimplementados, corrigidos e pendentes.
