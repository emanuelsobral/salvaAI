# SalvaAI — Item 7: Comparação Ampla com DeepSeek em 48 Documentos (13/11/2026)

## 1. Escopo e Protocolo Executado

Conforme deliberação do responsável em `13/11/2026`, foi executado o experimento de **Item 7** abrangendo **48 documentos**:
- **30 instâncias sintéticas** (`20` de `S1` + `10` de `S2`), avaliadas contra gabarito pelo comparador oficial (`avaliar-sinteticos.mjs` v`0.1.0`).
- **2 documentos públicos de desenvolvimento com gabarito preenchido** (`pub-alu-02`, `12` páginas; `pub-alu-03`, `5` páginas), avaliados contra gabarito pelo comparador oficial (`avaliar-sinteticos.mjs` v`0.1.0`).
- **16 demais documentos de desenvolvimento** (`alu-01`, `alu-02`, `edu-01`, `edu-04`, `edu-05`, `edu-06`, `edu-07`, `edu-09`, `fin-01`, `fin-04`, `fin-05`, `sau-01`, `sau-04`, `sau-05`, `sau-07`, `sau-09`), comparados diretamente contra as saídas históricas do extrator de regras `0.1.25` (`E04-validacao-20261013T182635728454Z/*/resultado.json`). **Declaração explícita:** nenhum desses `16` documentos possui gabarito humano preenchido em `piloto-v1-rascunhos` (todos os campos permanecem em rascunho vazio); portanto, a comparação nesse subconjunto mede **concordância entre extratores**, não acurácia real.

**Configuração da API e fatiamento:**
- Handler e prompt idênticos aos de produção (`server/ai-handler.js`, ação `contract-extract`, `max_tokens: 8192`, `thinking: { type: 'disabled' }`, `response_format: { type: 'json_object' }`, hash do prompt de sistema `96aed7f9758030d14c966b50fcf6518ba04721363b876685afc53e3b395ff026`).
- Modelo solicitado e retornado em todas as respostas: `deepseek-flash` (identificado pelo responsável como `DeepSeek-V4.1-Flash-1017`).
- Fatiamento em blocos de até **10 páginas** por chamada (limite imposto por `validateContractPages` em `src/utils/contractAi.js`).
- Os documentos `sau-04` e `sau-05` possuem `0` páginas com texto útil em `E04-validacao` (`sem_texto_util`), resultando em `nao_identificado` em modo texto sem chamadas à API.
- Nos `46` documentos com camada de texto, foram executadas **87 chamadas** à API DeepSeek, todas com **HTTP 200**, consumindo **`611.870` tokens de prompt + `62.663` tokens de conclusão = `674.533` tokens totais**.

## 2. Comportamento na Validação Estrita de Produção (`validateContractAi`)

Das `87` chamadas HTTP 200:
- **`70/87` (`80,46%`)** passaram integralmente na validação estrita de `parseModelJson` + `validateContractAi`.
- **`17/87` (`19,54%`)** foram bloqueadas pela camada determinística de validação:
  - `4` erros de sintaxe JSON na resposta do modelo (`sint-s1-alu01-02` bloco 1; `sint-s1-sau01-01`, `sint-s1-sau01-02` e `sint-s1-sau01-03` bloco 2);
  - `6` valores fora do formato suportado (`Valor inválido ou fora do formato suportado. Revise manualmente.`);
  - `5` evidências que não correspondiam exatamente à página informada (`Evidência não corresponde à página.`);
  - `2` estados de campo inválidos (`Estado de campo inválido.`).

No comparador oficial, cada bloco bloqueado gerou ausência local ou processamento parcial/falho conforme o protocolo: em `S1`, `12/20` documentos ficaram `concluido`, `6/20` `parcial` e `2/20` `falhou`; em `S2`, `10/10` `concluido`; nos `2` preenchidos, `2/2` `concluido`. Nenhum registro apresentou `JSON_INVALIDO` no comparador após normalização para `registro.schema.json`.

## 3. Resultados Oficiais contra Gabarito (`32` documentos: `S1`, `S2` e `2` preenchidos)

| Lote / Subconjunto | Extrator | Critério | D | Concluídos / Parciais / Falhas | Acerto | Precisão | Revocação | Não identificados | Erro em alta confiança |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| Sintéticos S1 (20 docs) | Regras `0.1.25` | exato | 92 | 20 / 0 / 0 | 41/92 (44,57%) | 12/21 (57,14%) | 12/62 (19,35%) | 41/62 (66,13%) | 0/0 (N/A) |
| Sintéticos S1 (20 docs) | DeepSeek (`deepseek-flash`) | exato | 92 | 12 / 6 / 2 | 28/92 (30,43%) | 7/33 (21,21%) | 7/62 (11,29%) | 31/62 (50,00%) | 0/0 (N/A) |
| Sintéticos S1 (20 docs) | DeepSeek (`deepseek-flash`) | tolerante | 92 | 12 / 6 / 2 | 28/92 (30,43%) | 7/33 (21,21%) | 7/62 (11,29%) | 31/62 (50,00%) | 0/0 (N/A) |
| Sintéticos S2 (10 docs) | Regras `0.1.25` | exato | 50 | 10 / 0 / 0 | 49/50 (98,00%) | 39/40 (97,50%) | 39/40 (97,50%) | 0/40 (0,00%) | 0/0 (N/A) |
| Sintéticos S2 (10 docs) | Regras `0.1.25` | tolerante | 50 | 10 / 0 / 0 | 50/50 (100,00%) | 40/40 (100,00%) | 40/40 (100,00%) | 0/40 (0,00%) | 0/0 (N/A) |
| Sintéticos S2 (10 docs) | DeepSeek (`deepseek-flash`) | exato | 50 | 10 / 0 / 0 | 25/50 (50,00%) | 15/40 (37,50%) | 15/40 (37,50%) | 0/40 (0,00%) | 0/0 (N/A) |
| Sintéticos S2 (10 docs) | DeepSeek (`deepseek-flash`) | tolerante | 50 | 10 / 0 / 0 | 26/50 (52,00%) | 16/40 (40,00%) | 16/40 (40,00%) | 0/40 (0,00%) | 0/0 (N/A) |
| Preenchidos (2 docs) | Regras `0.1.25` | exato | 10 | 2 / 0 / 0 | 3/10 (30,00%) | 1/7 (14,29%) | 1/8 (12,50%) | 1/8 (12,50%) | 0/0 (N/A) |
| Preenchidos (2 docs) | DeepSeek (`deepseek-flash`) | exato | 10 | 2 / 0 / 0 | 3/10 (30,00%) | 2/8 (25,00%) | 2/8 (25,00%) | 1/8 (12,50%) | 0/0 (N/A) |
| Preenchidos (2 docs) | DeepSeek (`deepseek-flash`) | tolerante | 10 | 2 / 0 / 0 | 3/10 (30,00%) | 2/8 (25,00%) | 2/8 (25,00%) | 1/8 (12,50%) | 0/0 (N/A) |

**Leitura técnica:**
- Nos **2 contratos públicos preenchidos (`pub-alu-02` e `pub-alu-03`)**, o DeepSeek obteve precisão e revocação exatas de `2/8` (`25,00%`), acima de `1/7` (`14,29%`) e `1/8` (`12,50%`) das regras `0.1.25`, mantendo o mesmo acerto global (`3/10 = 30,00%`).
- Nos **sintéticos (`S1` e `S2`)**, o extrator determinístico `0.1.25` superou o DeepSeek em todos os indicadores exatos (`41/92` vs `28/92` em `S1`; `49/50` vs `25/50` em `S2`), principalmente porque `S1` e `S2` refletem estruturas canônicas reconhecidas pelas regras, ao passo que o LLM em blocos de 10 páginas sofreu `10` bloqueios de schema/evidência/JSON em `S1` e divergências de representação estrita de campos em `S2` (como `dia` em `outra_regra` vs `mensal` ou escopo textual de cláusulas).

## 4. Comparação entre Extratores nos `16` Documentos de Desenvolvimento sem Gabarito (`80` pares)

Nos `16` documentos restantes de desenvolvimento (`alu-01` a `sau-09`, `80` pares no total), **sem gabarito humano preenchido**:
- **Concordância de estado (`encontrado` vs `nao_identificado`/`ambiguo`):** `41/80` (`51,25%`).
- **Pares marcados como `encontrado` apenas pelo DeepSeek:** `13/80`.
- **Pares marcados como `encontrado` apenas pelas regras `0.1.25`:** `3/80`.
- **Bloqueios em blocos do DeepSeek nesse subconjunto:** `7` blocos (em `edu-07`, `fin-01`, `fin-04`, `fin-05`, `sau-01` e `sau-07`), além de `sau-04` e `sau-05` sem texto útil em modo texto.

## 5. Artefatos Preservados

- Resumo consolidado: `output/item7-deepseek-48docs-2026-11-13/resumo-item7-2026-11-13.json`
- Chamadas brutas HTTP 200 e uso de tokens (87 arquivos): `output/item7-deepseek-48docs-2026-11-13/chamadas/`
- Avaliações oficiais (`avaliar-sinteticos.mjs`):
  - `output/item7-deepseek-48docs-2026-11-13/avaliacao-S1/`
  - `output/item7-deepseek-48docs-2026-11-13/avaliacao-S2/`
  - `output/item7-deepseek-48docs-2026-11-13/avaliacao-preenchidos/`
- Páginas extraídas de `pub-alu-02` e `pub-alu-03`: `output/item7-deepseek-48docs-2026-11-13/entradas-preenchidos-paginas.json`

