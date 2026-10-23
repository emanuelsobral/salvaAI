# Documentação do AgentFinanceiro / SalvaAI

Atualização do índice: **13/10/2026**, horário de São Paulo. Os guias históricos conservam suas datas e evidências originais.

**Planejamento atual:** [Kanban do SalvaAI](kanban.md), com prioridades, dependências e níveis recomendados do GPT-6. O [experimento de contratos](../experiments/contracts/README.md) tem piloto original de 26 PDFs e protótipo 0.1.0 validado tecnicamente, com baixa cobertura inicial. Após a identificação de modelos em branco, foram selecionados [dois contratos institucionais preenchidos](../experiments/contracts/coleta-preenchidos.md) como complemento de desenvolvimento. Próximo passo: [anotação humana E03](../experiments/contracts/guia-anotacao.md) do `pub-alu-03`, com Alto para apoio técnico. Gabarito, precisão e coleta de contratos pessoais preenchidos continuam pendentes. Agenda de contas na sequência. O produto continua sem chamadas de IA.

Esta documentação descreve o código disponível nesta pasta. Não há histórico Git na raiz nesta revisão; portanto, as etapas abaixo são marcos de comparação, não versões publicadas ou tags de releases.

## Etapas consideradas

1. **Legado:** `backend/`, `frontend/`, `database/` e o inicializador `.bat`.
2. **SalvaAI inicial:** implementação React/Firebase encontrada no início da revisão. A cópia de referência está em `backups/salva-ai-before-fixes-20260913-154505.zip`.
3. **SalvaAI revisado:** estado atual de `salva-ai/src/`, com as correções financeiras, testes e documentação desta rodada.

## Roteiro de leitura

| Documento | Conteúdo |
|---|---|
| [Evolução do antigo para o novo](evolucao-antigo-novo.md) | Comparação de tecnologias, funções, telas, endpoints e limitações |
| [Arquitetura e catálogo de funções](arquitetura-salva-ai.md) | Componentes, serviços, funções exportadas e contratos de entrada |
| [Regras financeiras](regras-financeiras.md) | Fórmulas, estados, exemplos e semântica de cada movimentação |
| [Modelo e migração de dados](migracao-de-dados.md) | Coleções, campos, vínculos, compatibilidade e plano de migração |
| [Operação e testes](operacao-e-testes.md) | Execução, configuração, testes, limites de segurança e publicação |
| [Registro de mudanças](CHANGELOG.md) | Implementações desta rodada e evidências de validação |
| [Pendências e próximos passos](pendencias.md) | Funcionalidades incompletas, riscos residuais e ordem de trabalho |
| [README da aplicação](../salva-ai/README.md) | Guia rápido de desenvolvimento |
| [Arquitetura histórica](project_architecture.md) | Proposta anterior preservada; não é o inventário do sistema atual |

## Evidência mais recente — 12/10/2026

O [registro de edição de recorrências](edicao-recorrencias.md) documenta 79 testes locais, dois testes no emulador, build aprovado e verificação de navegador em 320/390/1280 pixels. As alterações recentes permanecem locais, com publicação pendente. A criação do Kanban não executou novamente esses testes.

## Estado verificado na revisão inicial — 13/09/2026

- A compilação da aplicação atual passou.
- Os 16 testes de domínio/serviços com banco simulado passaram.
- Os 2 testes de integração com Firestore Emulator passaram, incluindo regras de acesso e uso dos serviços reais.
- O lint terminou sem erros, com 5 avisos de React ainda presentes.
- O banco SQLite e o Firestore de produção não foram alterados pela revisão.
- Não foi executado login real, chamada paga ao Gemini, implantação de regras ou teste visual completo no navegador.

## Como manter os documentos

Ao mudar uma função pública, atualizar o catálogo de funções. Ao mudar um valor, estado ou cálculo, atualizar as regras financeiras e os exemplos de teste. Ao mudar o formato de um documento, atualizar o modelo de dados e o plano de migração. Registrar validações efetivamente executadas no changelog e manter itens não concluídos em pendências.

## Configuração posterior à revisão

[Variáveis de ambiente e preparação para Git](configuracao-e-git.md): configuração Firebase externa, arquivos locais ignorados e parâmetros para build.


## IA centralizada

[Configuração da chave Gemini no servidor](ia-centralizada.md): substitui o modelo anterior de chaves por usuário.


- [Operação sem IA — estado atual](sem-ia.md)

- [Importação de extratos CSV e OFX](importacao-extratos.md)

- [Contas recorrentes — 12/10/2026](contas-recorrentes.md)

- [Conciliação de extratos e recorrências — 12/10/2026](conciliacao-extratos.md)

- [Edição de recorrências por data — 12/10/2026](edicao-recorrencias.md)
