# Proteção de reajustes compostos — 0.1.13

**15/10/2026.** Corrigida a classificação que reduzia o candidato “IGPM + IRT” ao índice IGP-M. A versão 0.1.13 mantém a composição como `outra_regra`, com texto literal, `indices: []` e `percentual: null`. Não calcula o reajuste nem escolhe um componente.

## Mudanças

- Soma explícita por `+` ou construções suportadas com “somado”, “acrescido” e “mais fator/índice” impede classificação como índice isolado. Componentes desconhecidos permanecem no texto.
- Menções a IRT, reajuste técnico ou fator técnico mantêm a regra literal. Uma negação específica do reajuste técnico não passa a significar ausência global de reajuste.
- Percentuais associados a sinistralidade, teto, limite, meta ou gatilho não viram taxa fixa automaticamente.
- A periodicidade só permanece preenchida quando reconhecida pelas regras já existentes. Período de apuração e defasagem não são usados como periodicidade.
- Índices simples e substitutivos continuam funcionando. Lacunas, períodos inválidos e candidatos concorrentes continuam exigindo abstenção.

O esquema e o protocolo não foram alterados. `outra_regra` preserva conteúdo, mas não estrutura seus componentes. O reconhecimento é lexical: não interpreta qualquer fórmula, não calcula IRT e pode encaminhar menções incidentais para regra literal. A separação de modalidades, objetos e referências continua pendente.

## Testes e documentos

Nove testes sintéticos novos reproduzem a falha e cobrem somas, componentes desconhecidos, condições, substituição, percentuais de limite, negação técnica, conflitos, lacunas e preservação de página/evidência. As falhas relevantes foram observadas antes da correção. **152 testes Python e sete Node passaram: 159 no total.**

O rastreio dos quatro documentos ambíguos encontrou quatro mudanças internas em `sau-07`: duas fórmulas IGPM + IRT e dois trechos de apuração conjunta, nas páginas físicas 36 e 38. Passaram de `indice` com IGP-M para `outra_regra`; os trechos literais foram preservados. Os candidatos dos outros três documentos ficaram idênticos.

Reexecutados os 18 documentos de desenvolvimento: **todos os 90 objetos de campo finais ficaram idênticos à 0.1.12**, incluindo estados, valores e evidências. Isso é esperado: a consolidação já recusava os quatro reajustes complexos, mas agora seus candidatos internos não simplificam indevidamente a composição.

Os 18 JSONs passaram no esquema e na localização literal das evidências. Houve 16 processamentos concluídos e duas falhas de leitura preservadas (`sau-04` e `sau-05`). Permanecem quatro reajustes ambíguos. Nenhuma dessas contagens mede precisão; não há gabarito independente congelado.

## Rastreabilidade

- Lote novo: `runs/E04-lote-0113-20261016T001351913582Z/`.
- Referência: `runs/E04-lote-0112-20261015T235840698277Z/`.
- Comparação dos candidatos: `runs/E04-diagnostico-reajustes-0113-20261016T001432487104Z/`, usando as páginas preservadas da referência e comparando com o diagnóstico anterior. Os `resultado.json` copiados nesse diagnóstico são referências da 0.1.12; as saídas novas estão no lote 0.1.13 acima.
- Regras SHA-256: `113ffa6d2a46e3705cd848f55942d74b875699f9d723292e8872f004805317fc`.
- PDFs, versão e hashes conferidos contra catálogos, referência e manifestos. Resultados, páginas, erros, comparações e rotinas preservados. Nomes das pastas em UTC; execução em 15/10/2026 no fuso local.
- Nenhum documento reservado executado, nenhum gabarito alterado, nenhuma chamada de IA ou deploy.

**Próximo passo: separar títulos e meras referências de regras efetivas de reajuste, com Alto.** A correção deve manter condições relevantes e não eliminar candidatos apenas para transformar respostas ambíguas em encontradas.
