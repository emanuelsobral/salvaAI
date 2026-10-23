# Condições de pagamento e revisão excepcional — 0.1.19

Concluído em 19/10/2026. Continuidade de desenvolvimento assistido autorizada sem análise humana; nenhuma referência foi convertida em gabarito independente.

## Resultado

O protótipo passou a guardar trechos antes omitidos e a sinalizar duas respostas parciais. Isso aumenta a transparência da extração, não sua taxa de preenchimento automático. Em pub-alu-02, vencimento e reajuste passaram de `encontrado` para `ambiguo`, com valor nulo e confiança não aplicável, por condições ainda não consolidadas. O termo ambíguo aqui indica insuficiência para uma resposta completa, não uma contradição jurídica demonstrada.

| Campo | Antes | Agora |
|---|---|---|
| Vencimento | Regra local da página 2 apresentada sem a continuação. | Preserva trechos das páginas 2 e 3 e informa que a cláusula de pagamento continua; não escolhe prazo isolado como resposta completa. |
| Reajuste | Reajuste periódico e remissão anual, sem revisão excepcional. | Preserva também a cláusula de revisão excepcional da página 4, sem atribuir automaticamente a ela o índice ou a frequência do reajuste periódico. |

Valor da parcela, número de parcelas e vigência desse documento permaneceram idênticos. A referência assistida anterior também permanece intacta.

## Implementação

- Agrupamento de cláusulas tituladas entre páginas, com um recorte literal por página. Cada novo título encerra o grupo anterior; títulos repetidos não são reunidos por suposição.
- Detecção de continuação para títulos explícitos de pagamento. Se houver candidato local, o resultado é ambíguo; sem candidato, permanece não identificado, com evidências.
- Detecção de menções a revisão de preços mediante requerimento/comprovação ou alteração excepcional. Guarda a cláusula inteira para preservar requisitos posteriores, sem interpretar direito, índice aplicável ou periodicidade.
- Trechos fora de títulos reconhecidos continuam passíveis de detecção genérica. A análise genérica não reanexa cláusulas vizinhas já delimitadas, inclusive após ponto e vírgula.
- Encargos, lacunas, negações e índices distintos permanecem nas evidências; não são convertidos em vencimento ou reajuste comuns.

## Validação

Quinze testes novos. Total: 208 Python + 27 Node = **235 aprovados**. Os novos testes cobrem continuação em duas/três páginas, limites de cláusulas, títulos repetidos, falta de prazo, encargos, preservação dos outros campos, revisão excepcional isolada/conjunta, índices distintos, negação, lacuna e condições posteriores.

Lote de desenvolvimento: **18 documentos**, com 16 processados e as mesmas duas falhas de leitura anteriores (sau-04 e sau-05). As 18 saídas passaram no esquema e na verificação de localização literal das evidências. **88/90 objetos de campo idênticos** à 0.1.18; as duas mudanças são as descritas acima. Isso é estabilidade de regressão, não acurácia.

## Limites e próximo trabalho

O agrupamento depende de títulos textuais reconhecidos. Não reconstrói tabelas, não resolve remissões, não demonstra completude de todas as cláusulas e pode conservar cabeçalhos/rodapés nos recortes. Referências assistidas por IA não fornecem medida independente de desempenho. Nenhum documento reservado de teste foi usado.

O próximo trabalho técnico é consolidar condições somente quando houver associação inequívoca, começando por distinguir prazo-base, requisitos para pagamento e encargos de atraso. Manter abstenção nos casos conflitantes ou incompletos e conservar evidências por página. Em seguida, distinguir a revisão excepcional do reajuste periódico sem transferir frequência entre modalidades. Nível recomendado: **Alto**.

Progresso desta entrega: **100% (3/3: diagnóstico/testes, implementação, regressão/documentação)**. Experimento original: **29% (2/7 etapas)**, com avaliação independente ainda não concluída. Não há dependência de pessoa revisora para continuar a trilha técnica autorizada. Sem API de IA, integração financeira ou deploy.

## Artefatos locais

Rodada final: `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E04-lote-0119-final-20261019-68cb97`. Contém saídas brutas, páginas, comparação com 0.1.18, cópias do código e catálogos, logs e manifesto de hashes.

A rodada intermediária `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E04-lote-0119-20261019-fd6c61` foi preservada; a rodada final acrescenta proteção contra reanexar cláusula vizinha na detecção genérica.
