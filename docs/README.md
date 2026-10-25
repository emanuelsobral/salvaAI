# Documentação do AgentFinanceiro / SalvaAI

Atualização do índice: **25/10/2026**, horário de São Paulo. Os guias históricos conservam suas datas e evidências originais.

**Planejamento atual — 25/10/2026:** [Kanban](kanban.md) e [roteiro de contratos](contratos-mvp.md). Cadastro, compromissos fixos, PDF e OCR com revisão concluídos localmente: **100% dos quatro marcos da integração inicial**, ainda não publicados. Próximo: publicação e teste autenticado, com Alto. [Piloto OCR: 74 páginas](contratos-ocr-validacao.md). O [experimento de extração](../experiments/contracts/README.md) permanece na versão 0.1.25 e em 29% (2/7 etapas); avaliação independente pendente. O percentual da integração não mede acerto dos campos nem conclusão do projeto inteiro.

Esta documentação descreve o código disponível nesta pasta. O repositório Git fica em `salva-ai/`; os marcos históricos abaixo não equivalem, por si só, a versões publicadas. A última publicação está no [registro de deploy](deploy-2026-10-23.md).

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

## Evidência mais recente — 24/10/2026

O [cadastro e planejamento de contratos](contratos-mvp.md) registra 141 testes locais, cinco testes no emulador, build e teste de navegador aprovados. Cadastro, recarga, edição, conflito entre telas, prévia, confirmação e pagamento foram verificados com dados fictícios. Estas funcionalidades ainda não foram publicadas.

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
