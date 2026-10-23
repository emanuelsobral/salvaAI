# Vigência educacional — versão 0.1.10

**14/10/2026 (America/Sao_Paulo).** Corrigida a seleção de contexto que gerava ambiguidade em três contratos educacionais. A regra exige declaração sobre prazo ou início contratual; coexistirem “contrato”, “assinatura” ou “início das aulas” no bloco não basta.

| Documento | Vigência na 0.1.9 | Vigência na 0.1.10 | Interpretação do resultado |
|---|---|---|---|
| `edu-01` | Ambígua | Encontrada como regra literal | Cláusula 7, página 5, declara duração anual e possibilidade de renovação. Datas e duração em meses permanecem nulas. |
| `edu-04` | Ambígua | Não identificada | Datas de parcelas e início das aulas deixam de provocar conflito de prazo. A referência ao segundo semestre letivo não foi convertida em datas ou quantidade de meses. |
| `edu-06` | Ambígua | Não identificada | “Iniciativa privada” não é início contratual; assinatura em branco e referências a módulos não fornecem prazo explícito suportado. |

“Não identificado” descreve a limitação do extrator; não confirma ausência de vigência no documento. “Encontrado” também não é métrica de acerto. A referência anual foi preservada em texto, sem deduzir calendário escolar, doze parcelas, datas ou doze meses. Condições de renovação/rescisão continuam nas evidências e podem exigir revisão de relevância e completude.

## Código e testes

- A seleção de vigência passou a exigir construções explícitas, como “vigência de”, “prazo da locação se inicia” ou “o contrato terá início”.
- Referências a vigência judicial, matrícula, datas de parcelas e início das aulas não autorizam extração de prazo contratual por simples coexistência de palavras.
- A forma “o contrato tem/terá duração anual” é reconhecida como prazo determinado, com regra literal e campos numéricos/datas nulos. Negação e alternativa explícitas provocam abstenção.
- Sete testes novos reproduzem as falhas e verificam duração anual, negação/alternativa, páginas/evidências, início das aulas, iniciativa privada e datas incidentais.
- **128 testes Python e sete Node aprovados: 135 no total.**

## Comparação e rastreabilidade

Rodada: `runs/E04-regressao-0110-20261015T020505276377Z/` (UTC no nome; data local 14/10/2026). Referência: `E04-regressao-019-20261015T020041408679Z`.

Dez documentos concluíram o processamento e passaram na validação de JSON e localização literal das evidências. Apenas os objetos de vigência de `edu-01`, `edu-04` e `edu-06` mudaram. Os demais 47 objetos de campo ficaram integralmente idênticos à 0.1.9, incluindo os cinco campos de cada contrato complementar. Também foram preservadas as correções anteriores em `alu-01`, `edu-07` e `edu-09`.

Foram guardados resultados brutos, páginas, logs, manifestos, catálogos, rotina e comparações com hashes. Os PDFs são os mesmos da referência e o código permaneceu estável durante a rodada. Nenhum documento reservado, gabarito humano, chamada de IA, integração ou deploy fez parte desta etapa.

Limites: seleção lexical e conservadora; não cobre toda redação de vigência, não interpreta calendário escolar ou aditivos e não garante que toda evidência seja necessária. Há remissões entre cláusulas/páginas e regras de permanência de obrigações que continuam exigindo leitura humana. Os resultados não substituem gabarito independente nem medem precisão.

**Próximo passo — Médio:** conferir a versão atual no lote completo de desenvolvimento (16 originais e dois complementares), consolidar estados e pendências e verificar os documentos ainda não reexecutados desde as últimas correções. Preservar os dez reservados para avaliação. Novos ajustes, se necessários, devem ser propostos depois da rodada, com Alto.

## Acompanhamento — 14/10/2026

O [lote completo de desenvolvimento](lote-completo-0110.md) foi concluído sem alterar o extrator. As saídas dos dez documentos desta rodada permaneceram idênticas; pendências dos demais foram consolidadas.
