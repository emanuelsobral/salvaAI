# Reajuste periódico e revisão excepcional — 0.1.21

Concluído em 19/10/2026. Desenvolvimento assistido, autorizado para continuar sem análise humana. Protocolo e esquema permanecem em 1.0.0; esta entrega não é uma avaliação independente.

## Resultado

No contrato de Mafra (pub-alu-02), o campo de reajuste passa de ambíguo para encontrado. A regra literal reúne o reajuste periódico e a revisão excepcional, preservando as condições das cláusulas e a referência anual das páginas 2, 3 e 4.

O reajuste periódico mantém no texto o IVAR, o intervalo mínimo anual, a negociação em caso de desproporção ao mercado e a formalização por aditivo. A revisão excepcional mantém seu próprio critério e os requisitos de requerimento expresso e comprovação. O extrator não verifica se esses requisitos foram atendidos.

A saída usa `outra_regra`, com confiança média. Os campos globais de índice, percentual e periodicidade ficam vazios: o esquema congelado não dispõe de estruturas separadas para cada modalidade. As informações continuam disponíveis na regra literal e nas evidências. Não se aplica automaticamente o intervalo anual à revisão excepcional, não se calcula reajuste e não se escolhe data.

## Limites do reconhecimento

A consolidação exige um único candidato periódico, com título, índice único e periodicidade explícita, além de uma única cláusula de alterações contratuais que mencione preços alterados em casos excepcionais, requerimento, comprovação e o mesmo índice reconhecido.

Lacunas, índices diferentes, alternativas, encargos, datas, percentuais, períodos adicionais, remissões a anexos/quadros, candidatos concorrentes ou outras pendências impedem a consolidação. Uma cláusula excepcional pode continuar na página seguinte, desde que os requisitos sejam preservados. O reconhecimento é lexical e restrito às formas testadas; não garante completude semântica em outros contratos.

A associação é identificada por `reajuste-revisao-distintos-v1`. O reconhecimento de siglas e nomes dos índices foi centralizado, preservando as regras anteriores.

## Validação

Doze testes novos cobrem a consolidação, índices divergentes e alternativos, requisitos ausentes, condições impeditivas, cláusulas concorrentes, falta de título ou periodicidade, referências anuais, conflito de frequência, continuação entre páginas e encargos/objetos acessórios.

**232 testes Python + 27 Node = 259 aprovados.** As 18 saídas de desenvolvimento passaram na validação do esquema e da localização literal das evidências. Foram processados 16 PDFs; as duas falhas anteriores de leitura (sau-04 e sau-05) continuam registradas.

**89/90 objetos de campo ficaram idênticos à 0.1.20.** A única alteração foi `regra_reajuste` de pub-alu-02. Isso mede estabilidade desta rodada, não acurácia. Os dez documentos reservados não foram acessados; referências assistidas e fichas independentes não foram alteradas. Não houve integração ao aplicativo, deploy ou chamada a API.

## Próximo passo e progresso

Próximo passo: consolidar um diagnóstico dos campos ainda ambíguos ou não identificados nos 18 documentos de desenvolvimento, distinguindo limitações de leitura, modelos em branco e regras ainda não suportadas. Isso orientará a próxima correção sem transformar ausência de extração em ausência no contrato. Nível recomendado: **Alto**.

Entrega: **100% (3/3 blocos: diagnóstico/testes, implementação, regressão/documentação)**. Experimento original: **29% (2/7 etapas)**; avaliação independente permanece pendente e separada do desenvolvimento assistido.

## Artefatos locais

Rodada preservada fora do Git: `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E04-lote-0121-final-20261019-8bb8d9`.

Inclui resultados, páginas extraídas, erros, comparação integral com a versão anterior, cópias das fontes e catálogos, logs de validação e manifesto de hashes. O hash de cada PDF foi conferido com o catálogo antes da extração.
