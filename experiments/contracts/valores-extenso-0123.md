# Conferência de valores por extenso — 0.1.23

**20/10/2026.** O protótipo agora confere a quantia por extenso entre parênteses imediatamente após um valor de parcela, mensalidade ou aluguel reconhecido. Uma divergência confirmada impede a escolha automática do número; uma redação não suportada recebe diagnóstico distinto.

## Comportamento

| Situação | Resultado |
|---|---|
| Número e extenso compatíveis | A extração anterior pode continuar, desde que as demais restrições também sejam atendidas. |
| Valores diferentes nas duas representações | Campo ambíguo, sem valor escolhido, com evidência literal. |
| Extenso numérico incompleto ou não suportado | Campo não identificado; se houver outro candidato independente, ambíguo. Não se declara divergência sem conseguir interpretar o extenso. |
| Apenas comentário descritivo ou nenhum parêntese | Mantém o comportamento anterior. Isso não equivale a uma confirmação por extenso. |
| Taxa de adesão/matrícula parcelada identificada pelo prefixo | Não é convertida em mensalidade nem usada para substituir o valor principal. |

A conferência é restrita a reais entre zero e 999.999, com até 99 centavos, nas construções implementadas. Aceita centenas, milhares, centavos, vírgulas de separação e as variantes catorze/quatorze. Milhões, grafias não suportadas, expressões malformadas e parênteses incompletos permanecem pendentes. A leitura não interpreta um valor por extenso como juridicamente superior ao numérico.

A associação exige o parêntese adjacente à quantia. Valores de total, entrada ou taxa não são comparados com o extenso de outra obrigação. A forma de repetição Nx, quando acompanha menção a parcelamento, é inspecionada apenas para apontar conflito ou extenso não suportado; isso não amplia a extração de quantidade ou valor.

A filtragem de taxas depende de prefixo explícito e próximo. Não representa reconhecimento geral de todos os encargos, tabelas, perfis ou planos de pagamento. Quantidades de parcelas não são validadas por extenso nesta versão. Também não há suporte a extenso em outra página, fora de parênteses ou distante do número.

## Lote de desenvolvimento

- edu-06: o valor da parcela passa de não identificado para ambíguo por divergência entre as representações. Taxa de adesão e total não são usados como substitutos.
- pub-alu-02: o valor passa de encontrado para não identificado. A redação por extenso não permite confirmação dentro da gramática suportada; não foi rotulada como divergência confirmada. O número anteriormente extraído continua preservado na rodada anterior e na comparação.

A redução de campos encontrados é intencional: evita manter um valor sem conferir uma representação textual numérica presente. As referências assistidas do usuário não foram reescritas para concordar com o protótipo.

## Validação

**260 testes Python + 27 Node = 287 aprovados.** As 18 saídas passaram na validação do esquema e da localização literal das evidências. Dezesseis PDFs concluíram o processamento; as duas falhas de leitura anteriores continuam registradas.

**88/90 objetos de campo ficaram idênticos à 0.1.22.** Apenas os dois valores descritos acima mudaram. O lote agora tem 15 campos encontrados, 58 não identificados, sete ambíguos e dez com erro de leitura. São estados do extrator, não taxas de acerto.

Os hashes dos 18 PDFs foram conferidos com os catálogos antes da execução. Foram preservadas as saídas e as diferenças completas com a versão anterior.

Foram acrescentados 16 testes sobre concordância, divergência, centavos, milhares, formas inválidas, limite numérico, taxas parceladas, associação local, outras obrigações concorrentes, prefixo RS, notação Nx e parêntese incompleto. As falhas foram reproduzidas antes das correções.

O módulo `extenso.py` faz a conferência local com Decimal; não foram acrescentadas dependências ou chamadas de API. As regras de evidência literal, protocolo e esquema 1.0.0 permanecem preservadas. Os testes desta entrega são de implementação; não medem precisão ou revocação em contratos reais.

## Próximo passo e progresso

Próximo: tratar alternativas de pagamento e tabelas escolares, começando por edu-04 e edu-07, preservando opção não informada, taxa de matrícula e cronograma. Nível recomendado: **Alto**.

Entrega: **100% (3/3: diagnóstico/testes, implementação, regressão/documentação)**. Experimento original: **29% (2/7 etapas)**; a avaliação independente segue pendente e separada do desenvolvimento assistido autorizado.

## Artefatos

Rodada final na C:, fora do Git: `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E04-lote-0123-final-20261020-5a247a`.

A rodada contém fontes, inclusive o módulo de extenso, catálogos, resultados, páginas, erros, comparação e logs com hashes. Sem uso dos dez documentos reservados, integração ao aplicativo ou deploy.
