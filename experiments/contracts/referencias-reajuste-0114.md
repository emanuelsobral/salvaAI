# Títulos e referências de reajuste — 0.1.14

**15/10/2026.** A versão 0.1.14 deixa de tratar títulos isolados como regras preenchidas e mantém remissões sem critério explícito como pendências. Não resolve referências entre cláusulas automaticamente nem escolhe um índice pela proximidade no texto.

## Comportamento

- Cabeçalhos inteiros reconhecidos, como “CLÁUSULA 12ª – REAJUSTE”, capítulos e “REAJUSTE POR FAIXA ETÁRIA”, não geram candidatos. O reconhecimento exige o trecho inteiro: título com corpo ou índice na mesma linha não é descartado.
- Remissões suportadas a cláusulas, quadros e anexos ficam pendentes quando não contêm índice reconhecido, percentual ou soma explícita. A periodicidade sozinha não resolve a regra referida.
- Menção de reajuste em garantia fiduciária, sem critério explícito, também permanece como evidência pendente.
- Referências com regra explícita conservam o conteúdo. Fórmulas compostas, condições, lacunas e conflitos continuam protegidos pelas regras anteriores.

As pendências não são eliminadas para produzir uma resposta encontrada: se coexistem com candidato principal, a resposta continua ambígua. Um trecho pendente isolado retorna não identificado, preservando a evidência. O texto bruto das páginas fica intacto, inclusive os cabeçalhos filtrados.

## Validação

Oito testes novos reproduzem títulos variados, título/corpo em páginas distintas, conteúdo na mesma linha, remissão isolada, referência não resolvida, regra explícita e garantia com/sem critério. As falhas foram observadas antes da correção. **160 testes Python e sete Node passaram: 167 no total.**

| Documento | Candidatos antes → depois | Pendências antes → depois | Conferência |
|---|---:|---:|---|
| `fin-01` | 11 → 9 | 0 → 2 | Remissão da página 2 e garantia da página 10 passaram a pendentes; evidências preservadas. |
| `sau-01` | 4 → 4 | 1 → 1 | Sem mudança. |
| `sau-07` | 27 → 21 | 0 → 4 | Dois títulos isolados filtrados (páginas 36 e 39); quatro referências das páginas 31, 35 e 36 passaram a pendentes. |
| `sau-09` | 3 → 3 | 0 → 0 | Sem mudança. |

São contagens internas, não acertos medidos. Os quatro reajustes continuam ambíguos, com valor nulo.

O lote completo de 18 documentos foi reexecutado: **apenas as evidências de reajuste de `fin-01` e `sau-07` mudaram; os outros 88 objetos de campo ficaram idênticos à 0.1.13**. Em fin-01, mudou a ordem das evidências por reclassificação; em sau-07, os dois títulos saíram das evidências finais e as referências foram reordenadas como pendências. Nenhum estado ou valor final mudou.

Os 18 JSONs passaram na validação de esquema e localização literal das evidências. Permanecem 16 processamentos concluídos e duas falhas de leitura (`sau-04` e `sau-05`). Não há gabarito independente congelado nem métricas de precisão.

## Limites e próxima etapa

O filtro reconhece formas textuais específicas, não todos os títulos ou mecanismos contratuais. Não resolve tabelas/anexos, texto desordenado, referências por número ou separação entre objetos financeiros. A presença de índice/percentual em um bloco ainda não comprova que ele se aplique à mensalidade: essa distinção é a próxima etapa, não uma garantia desta versão.

**Próximo passo: distinguir reajuste anual, técnico e por faixa etária nos contratos de saúde, com Alto**, preservando condições e sem transformar a ausência de um mecanismo em ausência global de reajuste. Depois, tratar os diferentes objetos do financiamento (saldo, prestação, seguro e tarifa). Qualquer mudança de esquema deverá ser versionada; nesta etapa o esquema/protocolo permaneceram intactos.

## Rastreabilidade

- Lote: `runs/E04-lote-0114-20261016T002737232729Z/`; referência: `runs/E04-lote-0113-20261016T001351913582Z/`.
- Rastreio: `runs/E04-diagnostico-reajustes-0114-20261016T002807987069Z/`. As páginas e resultados copiados são referências da 0.1.13; `campos-reproduzidos.json` e `candidatos.json` registram a execução atual sobre essas páginas. As saídas novas dos PDFs estão no lote acima.
- Regras SHA-256: `2378f1732e33dd233d83e7bb6a33d76433eed9f5900314d7fc8d1f23ec35255f`.
- Identidade dos PDFs, catálogos, versões e hashes conferida. Resultados brutos, erros, manifestos, comparações e rotinas preservados. Pastas em UTC; data local 15/10/2026.
- Sem documentos reservados, alteração de gabarito, chamadas de IA, integração ao aplicativo ou deploy.
