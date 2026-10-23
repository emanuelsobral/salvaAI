# Vigência ligada ao curso ou à conclusão — 0.1.22

**20/10/2026.** O protótipo passa a reconhecer duas formas explícitas de vigência escolar: duração equivalente ao curso/plano escolhido e término vinculado à conclusão das atividades com recebimento dos documentos finais. Desenvolvimento assistido, sem API ou exigência de nova anotação humana para esta entrega.

## Comportamento

| Documento | Antes | Depois | Conteúdo preservado |
|---|---|---|---|
| edu-05, página 7 | Não identificado | Encontrado como regra literal | Vigência equivalente ao curso objeto de matrícula, nos termos do plano escolhido. |
| edu-07, página 7 | Não identificado | Encontrado como regra literal | Conclusão das atividades, recebimento dos documentos finais e referência às condições de rescisão. |

Nos dois casos, `inicio`, `fim` e `duracao_meses` permanecem nulos. `prazo` fica `nao_informado`: a regra não é convertida em prazo numérico nem classificada juridicamente. A confiança é média e o identificador da regra é `vigencia-curso-evento-v1`.

Não é calculada data a partir da matrícula, do calendário escolar ou da duração descrita para o curso. As remissões ficam no texto literal; o protótipo não resolve automaticamente todo o conteúdo de uma cláusula referenciada ou do plano escolhido. O campo encontrado não comprova completude contratual.

## Implementação e limites

- Reconhecimento exige declaração sobre a vigência do contrato, instrumento ou ajuste. Menção à conclusão em pagamento, certificado ou bolsa não basta.
- Nas páginas com essa declaração, itens como `6.1)` e `6.5.` e títulos com ordinal colado delimitam os trechos. Evidências continuam sendo recortes literais da página, sem corrigir ou reescrever o PDF.
- Negações, alternativas, lacunas e prazos concorrentes levam à abstenção. Regras distintas por curso não são conciliadas automaticamente. Uma referência numérica à duração do curso fora da regra não vira duração contratual.
- Uma primeira comparação com o texto preservado detectou alteração incidental da segmentação em sau-07. A separação ampliada foi restringida às páginas com a declaração por curso; a regressão final preservou esse documento.

A lista de redações reconhecidas é restrita. Cláusulas com outras construções, continuação entre páginas ou condições não reconhecidas podem exigir trabalho adicional. Protocolo e esquema continuam em 1.0.0.

## Validação

Doze testes novos cobrem as duas formas, condições e páginas, itens numerados, títulos colados, eventos incidentais, negações, alternativas, lacunas, prazo concorrente, regras repetidas e rescisão separada. As falhas foram reproduzidas antes da implementação.

**244 testes Python + 27 Node = 271 aprovados.** As 18 saídas passaram na validação do esquema e localização literal das evidências. Dezesseis PDFs concluíram o processamento; as duas falhas anteriores de leitura continuam registradas.

**88/90 objetos de campo ficaram idênticos à 0.1.21.** Apenas as vigências de edu-05 e edu-07 passaram de não identificadas para encontradas. O lote agora tem 16 campos encontrados, 58 não identificados, seis ambíguos e dez com erro de leitura. Essas contagens descrevem os estados do protótipo, não sua taxa de acerto.

Os hashes dos 18 PDFs foram conferidos com os catálogos antes da execução. Código e testes da rodada, resultados brutos e logs estão preservados na C:.

## Próximo passo e progresso

Próximo: detectar divergências entre valores em algarismos e por extenso, antes de ampliar a extração de valores; separar taxa de adesão e mensalidade. Caso de desenvolvimento: edu-06. Nível recomendado: **Alto**.

Entrega: **100% (3/3: diagnóstico/testes, implementação, regressão/documentação)**. Experimento original: **29% (2/7 etapas)**. O desenvolvimento técnico não substitui a avaliação independente pendente.

## Artefatos

Rodada final na C:, fora do Git: `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E04-lote-0122-final-20261020-2c5d19`.

Saídas, páginas, erros, comparação integral, fontes, catálogos e logs preservados com manifesto de hashes. Os dez documentos reservados e as referências assistidas não foram alterados. Sem integração no aplicativo ou deploy.
