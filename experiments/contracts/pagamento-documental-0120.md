# Consolidação documental do pagamento — 0.1.20

Concluído em 19/10/2026. Desenvolvimento assistido, conforme autorização para continuar sem análise humana. O protocolo e o esquema permanecem na versão 1.0.0; esta rodada não constitui avaliação independente.

## Resultado

O vencimento de pub-alu-02 passa de ambíguo para encontrado, com regra literal completa das páginas 2 e 3. O prazo por protocolo da nota fiscal é mantido junto dos requisitos documentais, dados bancários, condições de suspensão do pagamento e correção por atraso.

A saída usa `outra_regra`: não calcula data, não escolhe dia do mês e não transforma o índice de atraso em prazo. A confiança permanece média. O texto por página fica integralmente preservado, inclusive metadados que possam existir nos recortes. Isso não prova completude semântica em outros contratos.

## Critérios para consolidação

- Um único grupo de pagamento com continuação entre páginas.
- Um único candidato de prazo por protocolo/recebimento/apresentação da nota fiscal, localizado no primeiro fragmento desse grupo.
- Nenhuma outra pendência ou condição de cronograma não resolvida.
- Subitens reconhecidos como emissão/ateste/regularização de nota fiscal, dados bancários, conta corrente, suspensão por liquidação pendente ou correção monetária por atraso.
- Ausência de lacunas, datas ou outros prazos/eventos de calendário nos complementos, e de remissões externas aos anexos/quadros verificadas pela regra.

O reconhecimento é lexical e restrito. Itens sem classificação, novos prazos, datas ou candidatos concorrentes mantêm a abstenção. Não há interpretação jurídica, reconstrução de calendário, cálculo monetário ou chamada a API de IA.

Cabeçalho de página e par terminal de autenticação são ignorados apenas ao classificar os requisitos. Evidências e regra de saída conservam os trechos literais. A associação fica registrada como `vencimento-documental-paginado-v1`.

## Validação

Doze testes novos cobrem consolidação positiva, parágrafo final, datas/prazos adicionais, prazo de encargo, item desconhecido, lacunas, remissões, obrigações concorrentes, ausência de prazo-base, metadados, carência, três páginas e separação de encargos/reajuste. Total aprovado: **220 Python + 27 Node = 247 testes**.

Lote de desenvolvimento: **18 documentos**, 16 processados e as duas falhas de leitura anteriores preservadas (sau-04 e sau-05). As 18 saídas passaram no esquema e na localização literal das evidências.

**89/90 objetos de campo permaneceram idênticos à 0.1.19.** Só o vencimento de pub-alu-02 foi consolidado. O reajuste desse documento permanece ambíguo por revisão excepcional ainda não consolidada; nenhum índice ou periodicidade foi escolhido automaticamente.

Código, PDFs e resultados comparados por hash, com saídas brutas, páginas, catálogos, testes e cópias das fontes preservados. Referência assistida e pacote independente não foram alterados. Nenhum documento reservado de teste foi processado; sem deploy ou gravações financeiras.

## Próximo passo e progresso

Próximo trabalho: distinguir reajuste periódico e revisão excepcional, preservando os requisitos de cada modalidade e evitando transferir periodicidade/índice entre elas. Nível recomendado: **Alto**. A execução técnica continua sem exigir pessoa revisora.

Entrega atual: **100% (3/3: diagnóstico/casos, implementação, regressão/documentação)**. Experimento original: **29% (2/7 etapas)**. O percentual original inclui etapas de validação independente que não foram concluídas por esta análise assistida; não representa a taxa de acerto do extrator.

## Artefatos locais

Rodada final, fora do Git: `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E04-lote-0120-final-20261019-d10993`.
