# Evidências da avaliação de contratos

Edição pública preparada em 10–11/11/2026 a partir dos resultados de 03/11/2026. Contém 30 instâncias textuais sintéticas, 12 referências de documentos públicos, entradas do comparador, relatórios históricos e o gerador determinístico. Os PDFs originais não estão incluídos.

## Reproduzir

Na pasta deste pacote, com Node.js e Python 3.12 ou superior:

```text
npm ci --ignore-scripts
npm run verify
python gerar_sinteticos.py --saida reproducao
```

A geração recusa uma pasta de destino existente. Não usa API, rede, login ou banco. A verificação recalcula as métricas sobre saídas preservadas; não executa novamente a extração dos PDFs. As dependências do comparador estão fixadas no arquivo de lock.

## O que cada pasta contém

| Pasta | Conteúdo |
| --- | --- |
| `sinteticos` | 30 textos reconstruídos, divididos em páginas, com parâmetros e referência |
| `modelos_base` | Textos dos cinco modelos públicos usados pelo gerador, com supressões |
| `gabaritos` | 12 fichas de referência com procedência; independência humana não confirmada |
| `entradas` | Quatro lotes da versão 0.1.25 adaptados para publicação |
| `referencias` | Relatórios e manifestos históricos, preservados para comparação |
| `comparador` | Código, esquema e protocolo preservados da avaliação |

`fontes-publicas.json` identifica os PDFs por URL e hash. `procedencia.json` explica as adaptações e supressões. Os hashes históricos identificam os arquivos anteriores à edição pública; não devem ser usados como hashes das entradas editadas. `manifesto-publico.json` identifica os arquivos desta edição.

## Origem e limites

S1 tem 20 instâncias (15 preenchidas e cinco controles em branco); S2 tem dez (oito preenchidas e dois controles). O gerador usa `random.Random(20261103)`, listas discretas e ordem fixa. O caso `sint-s2-alu02-04` introduz deliberadamente diferença de um centavo na referência. São instâncias textuais: este ensaio não avalia OCR ou recuperação de layout de PDFs.

Alguns estados da referência sintética são obtidos das regras 0.1.25 aplicadas ao modelo-base. Portanto, a referência não é completamente independente do extrator. Os sintéticos foram reconstruídos em novembro; não são apresentados como arquivos textuais originais preservados da primeira execução.

Os lotes `reservados` e `preenchidos` vêm de PDFs reais. O rótulo `natureza=sintetica` decorre da interface do comparador: o adaptador histórico preservou os campos e modificou metadados de tipo, hash, versão e processamento. A procedência real está declarada separadamente. Isso não certifica anotação humana independente.

Há um erro histórico de classificação: `sau-06` aparece como texto na entrada, embora o catálogo indique ausência de texto útil. A classificação foi mantida para reproduzir os relatórios; os agrupamentos por formato não devem ser interpretados sem essa ressalva.

## Supressões e interpretação

Foram substituídos identificadores pessoais localizados nos textos, incluindo nomes de pessoas, CPFs, e-mails, registros profissionais, endereço de imóvel e código de verificação de assinatura. Os marcadores são explícitos. As métricas e decisões do comparador são verificadas novamente; os hashes de strings podem mudar. As evidências editadas não são transcrições integrais byte a byte dos PDFs.

A precisão exata nos dois contratos preenchidos é **1/7**. A afirmação anterior de precisão estrutural **7/7** não é sustentada: em `pub-alu-02`, o reajuste diverge também no tipo, nos índices e na periodicidade. Não tratar diferenças textuais como equivalência semântica automaticamente. Erro de alta confiança `0/0` significa não aplicável.

Os modelos foram obtidos das fontes públicas identificadas. A disponibilização para inspeção acadêmica não estabelece uma licença geral sobre os documentos de terceiros. As limitações e a procedência devem acompanhar qualquer reutilização.
