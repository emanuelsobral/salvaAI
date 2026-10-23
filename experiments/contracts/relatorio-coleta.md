# Coleta inicial de contratos — E02

**Data: 13/10/2026. GPT-6 recomendado nesta etapa: Médio.**

Foram consultadas 31 fontes e obtidos **26 PDFs**, organizados em **23 famílias**. O piloto tem **16 documentos para desenvolvimento e 10 reservados para teste**. Não houve extração dos cinco campos financeiros, criação de gabarito ou medição de acerto.

**E02 permanece em andamento:** a meta proposta era 40 documentos, dez por categoria. O lote inicial já permite começar E04 com os documentos de desenvolvimento. Ampliar a coleta e preparar o gabarito humano continuam pendentes.

## Cobertura

| Categoria | Fontes tentadas | PDFs obtidos | Desenvolvimento | Teste | Falta para dez PDFs |
|---|---:|---:|---:|---:|---:|
| Financiamento | 6 | 4 | 3 | 1 | 6 |
| Aluguel | 5 | 4 | 2 | 2 | 6 |
| Mensalidade escolar | 10 | 10 | 6 | 4 | 0 |
| Plano de saúde | 10 | 8 | 5 | 3 | 2 |
| **Total** | **31** | **26** | **16** | **10** | **14** |

Dos 26 PDFs, **23 pertencem ao estrato principal e três ao complementar**: FINAME (`fin-05`), contratação coletiva institucional (`sau-07`) e regulamento de plano (`sau-09`). Resultados desses três devem ser apresentados separadamente. A diferença de 14 acima compara arquivos obtidos com a meta numérica; não significa que bastam 14 novos arquivos para completar uma amostra adequada de contratos pessoais.

Há **22 PDFs com texto em todas as páginas**, um com capa em imagem e texto nas demais páginas (`sau-02`), e **três sem camada de texto útil** (`sau-04`, `sau-05`, `sau-06`). Estes três continuam no inventário e devem aparecer como limitação/falha de leitura no lote sem OCR. Quantidade de caracteres não garante leitura correta de tabelas ou cláusulas.

## Limitações da amostra

- Predominam modelos com lacunas e condições gerais. Ainda faltam contratos preenchidos com obrigação principal identificável e variedade de valores, datas e tabelas.
- Financiamento e aluguel estão abaixo da meta; financiamento tem somente uma família reservada para teste. Não permite concluir desempenho geral nessa categoria.
- “Público” descreve a disponibilidade da fonte. Não significa ausência de dados pessoais, licença de redistribuição ou documento anonimizado.
- Foram conferidas visualmente as primeiras páginas dos 26 PDFs. A inspeção de texto cobriu todas as páginas para medir sua disponibilidade e comparar semelhanças, sem anotação financeira. Isso não equivale a revisão humana integral.
- Acerto sobre campos ausentes deve ser separado da capacidade de recuperar campos presentes, conforme o protocolo. Modelos em branco podem inflar uma impressão de bom desempenho.
- A data da coleta não é a data do contrato nem comprova que suas condições estejam vigentes. O material serve apenas ao experimento de extração.

## Separação e integridade

O [catálogo congelado do piloto](amostra-piloto-v1.json) registra origem, URL final, data de obtenção, tamanho, SHA-256, páginas, classificação, família, estrato e divisão. Os hashes dos 26 arquivos foram conferidos; **não há PDFs idênticos por SHA-256**.

A comparação de conjuntos de cinco palavras consecutivas apontou maior semelhança entre as duas peças Volvo e entre os dois modelos NotreLife. Essas famílias foram mantidas juntas, assim como os dois Santa Saúde. A comparação é uma triagem de semelhança, não prova de independência entre todos os documentos.

A divisão foi definida por família antes da implementação das regras: 16/10 (aproximadamente 62%/38%). PDFs de teste foram vistos somente para triagem de origem, layout e semelhança; não devem orientar novas regras de extração. Alterações futuras de família ou amostra exigem uma nova versão e registro do motivo; preservar este piloto.

SHA-256 do catálogo `amostra-piloto-v1.json`:

`9bdd77fed742b15241653eaa419c6c44052b2c0890eb4d1d61840806ca7a1d30`

## Inventário acessível

As fontes abaixo são as URLs usadas na coleta de 13/10/2026. Os originais locais ficam em `data/originais/<ID>.pdf`. “Teste” significa reservado para a avaliação futura, não teste já executado.

| ID e fonte | Natureza | Páginas | Divisão | Estrato |
|---|---|---:|---|---|
| [alu-01 — AGEHAB — modelo de locação residencial](https://goias.gov.br/agehab/wp-content/uploads/sites/18/2022/03/contrato.de_.locacao.006-7a4.pdf) | Modelo com lacunas | 2 | Desenvolvimento | Principal |
| [alu-02 — Rodovalho — modelo de locação](https://rodovalhoempreendimentos.com.br/img/modelo-contrato-locacao.pdf) | Modelo com lacunas | 7 | Desenvolvimento | Principal |
| [alu-03 — Wondershare — modelo de aluguel](https://pdf.wondershare.com.br/modelo/contrato/aluguel_para_imprimir.pdf) | Modelo com lacunas | 2 | Teste | Principal |
| [alu-04 — PontoXP — modelo de locação residencial](https://www.pontoxp.com/wp-content/uploads/2013/03/MODELO-DE-CONTRATO-DE-ALUGUEL-RESIDENCIAL.pdf) | Modelo com lacunas | 4 | Teste | Principal |
| [edu-01 — Adventista — contrato educacional 2026](https://s.educacaoadventista.org.br/escola/arquivos/TDLFbJJU9BKA5qB6hoOHW5RUGBa7eoHFdZpDxDvX.pdf) | Modelo com lacunas | 16 | Desenvolvimento | Principal |
| [edu-02 — Anchieta Maceió — matrícula 2026](https://www.anchietamaceio.com.br/downloads/contrato-de-matricula-e-prestacao-de-servicos-educacionais-2026.pdf) | Modelo com lacunas | 3 | Teste | Principal |
| [edu-03 — Santa Teresinha — serviços escolares 2026](https://matriculas.colegiosantateresinha.com.br/downloads/contrato.pdf) | Modelo com lacunas | 9 | Teste | Principal |
| [edu-04 — FWB — serviços educacionais 2021/2](https://fwb.edu.br/documentos/2021/2_2021/contrato_prestacao_servicos_educacionais_2_2021.pdf) | Modelo com lacunas | 4 | Desenvolvimento | Principal |
| [edu-05 — Dom Alberto — graduação 2022](https://domalberto.edu.br/wp-content/uploads/sites/24/2022/01/CONTRATO-GRADUACAO-E-SEGUNDA-GRADUACAO-01-2022-.pdf) | Modelo com lacunas | 21 | Desenvolvimento | Principal |
| [edu-06 — Colônia do Saber — serviços educacionais](https://coloniadosaber.com/site/files/CONTRATO_PRESTACAO_DE_SERVICOS_EDUCACIONAIS_2017_-_9_meses.pdf) | Modelo com lacunas | 2 | Desenvolvimento | Principal |
| [edu-07 — Instituto Fratelli — serviços educacionais](https://institutofratelli.com/wp-content/uploads/2023/10/CONTRATO-DE-PRESTACAO-DE-SERVICOS-EDUCACIONAIS-Instituto-Fratelli-2023.2.pdf) | Modelo com lacunas | 7 | Desenvolvimento | Principal |
| [edu-08 — Silva Abreu — anual fundamental 2021](https://www.colegiosilvaabreu.com/pdf/contratos/contrato-anual-2021-fundamental1.pdf) | Modelo com lacunas | 17 | Teste | Principal |
| [edu-09 — UNIARP — Colégio de Aplicação 2025](https://colegiodeaplicacao.uniarp.edu.br/wp-content/uploads/2024/10/CONTRATO-CA-2025-PRESTACAO-DE-SERVICOS-EDUCACIONAIS.pdf) | Modelo com lacunas | 5 | Desenvolvimento | Principal |
| [edu-10 — AEB — prestação de serviços educacionais](https://aeb.edu.br/aeb/wp-content/uploads/2025/07/contrato-de-prestacao-de-servico.pdf) | Modelo com lacunas | 11 | Teste | Principal |
| [fin-01 — Itaú — financiamento imobiliário taxa de mercado](https://ww3.itau.com.br/imobline/pre/pdf/TaxadeMercado.pdf) | Modelo com lacunas | 17 | Desenvolvimento | Principal |
| [fin-04 — Volvo — CDC](https://www.volvofinancialservices.com/content/dam/volvo-financial-services/markets/brazil/compliance/Condicoes-Gerais-da-Cedula-de-Credito-Bancario-CDC-Sob-Registro-n-1.201.667.pdf) | Condições gerais | 20 | Desenvolvimento | Principal |
| [fin-05 — Volvo — abertura de crédito](https://www.volvofinancialservices.com/content/dam/volvo-financial-services/markets/brazil/splash/sob-registro-n-1.180.196.pdf) | Condições gerais | 37 | Desenvolvimento | Complementar |
| [fin-06 — Porto Seguro — cédula de crédito bancário](https://www.portoseguro.com.br/NovoInstitucional/static_files/CGs/auto_credito_porto_seguro/cg_cedula_de_credito_bancario.pdf) | Condições gerais | 5 | Teste | Principal |
| [sau-01 — Norden — Plano A Copart](https://meunorden.com/wp-content/uploads/Contrato-PlanoA-Copart.pdf) | Condições gerais | 33 | Desenvolvimento | Principal |
| [sau-02 — NotreLife — ambulatorial SP](https://www2.gndi.com.br/documents/20182/247210781/00%2BNDI%2BSP%2B-NOTRELIFE%2BAMB%2BSP%2BCP%2B-%2B495367233%2B-%2Bnov.24.pdf/dd343f2f-07e5-4e60-4724-8d083357617c) | Condições gerais | 41 | Teste | Principal |
| [sau-03 — NotreLife — apartamento RJ](https://www2.gndi.com.br/documents/20182/240897362/NOTRELIFE%2B50%2B%2BAPTO%2BRJ%2BCP%2B-%2B495269233%2B-%2Bv.%2B07.2024.pdf/82219bb5-493e-83de-7f94-b1089af0f147) | Condições gerais | 40 | Teste | Principal |
| [sau-04 — Santa Saúde — individual executivo](https://planosantasaude.com.br/wp-content/uploads/2021/08/473.884.15-5-Contrato-Individual-Executivo-com-Obstetricia-Odontogico.pdf) | Condições gerais | 37 | Desenvolvimento | Principal |
| [sau-05 — Santa Saúde — individual preferencial](https://planosantasaude.com.br/wp-content/uploads/2021/08/458.384.08-1-Contrato-Individual-Preferencial-com-Obsteticia1.pdf) | Condições gerais | 37 | Desenvolvimento | Principal |
| [sau-06 — CAA-MG — Unipart Nacional 2022](https://caamg.org.br/oab-caa-saude/pdf/contratounipartnacional2apartamento_2022.pdf) | Condições gerais | 25 | Teste | Principal |
| [sau-07 — SCPREV — Unimed nacional referência](https://scprev.com.br/wp-content/uploads/2023/12/Contrato-n-9085101-UNIMED.pdf) | Contrato coletivo | 56 | Desenvolvimento | Complementar |
| [sau-09 — Saúde BRB — regulamento Plano A1](https://saudebrb.com.br/wp-content/uploads/2023/05/Saude-BRB-Regulamento-Plano-A1-.pdf) | Regulamento | 50 | Desenvolvimento | Complementar |

## Fontes que não entraram no lote

| ID e fonte | Ocorrência registrada |
|---|---|
| [alu-05 — Cora — modelo de contrato de locação](https://materiais.cora.com.br/wp-content/uploads/2022/08/Modelo-de-Contrato-de-Locacao-Cora.pdf) | HTTP Error 404: Not Found |
| [fin-02 — Itaú — financiamento de bens C2](https://www.itaucred.com.br/itaucred/pdf/itau/Condicoes_Gerais_-_Financiamento_itc.pdf) | HTTP Error 403: Forbidden |
| [fin-03 — Santander — condições gerais CCB](https://www.santander.com.br/hotsite/santanderfinanciamentos/pdf/Condicoes_Gerais_Contrato.pdf) | HTTP Error 403: Forbidden |
| [sau-08 — SINPOL-TO — Unimed Palmas](https://www.sinpol-to.org.br/media/sinpol/plano_unimed/1_-_contrato_unimed_n%C2%BA_222301100_coparticipativo_consultas.pdf) | PDF excedeu limite de 20 MiB |
| [sau-10 — Sindjus-MA — contrato Unimed Teresina 2018](https://www.sindjusma.org/UserFiles/Files/CONTRATO%20UNIMED%20TERESINA%202018.pdf) | PDF excedeu limite de 20 MiB |

Não foram feitos desvios de bloqueios nem aumentos silenciosos do limite de download. Cada tentativa e seus erros ficam nos registros locais de `data/coletas/`; falhas não recebem divisão desenvolvimento/teste.

## Validação e próximos passos

- Nove testes locais passaram: integridade, duplicidades, isolamento de famílias, falhas de coleta, caminhos, páginas e preservação do catálogo existente.
- O Git ignora originais, imagens de inspeção, logs, gabaritos reais e saídas. Catálogo, URLs públicas e ferramentas ficam disponíveis para versionamento.
- O coletor não usa API de IA; o validador funciona sem internet. As dependências da aplicação não mudaram. A suíte da aplicação não foi executada nesta etapa.

**E02 — Médio:** ampliar principalmente financiamento e aluguel, obter mais contratos preenchidos e manter rastreabilidade e famílias.

**E03 — Alto para apoio técnico:** preparar arquivos de anotação e checagem de consistência. A leitura e o gabarito devem ser feitos por uma pessoa, antes de consultar saídas do extrator.

**E04 — Alto:** próximo desenvolvimento disponível. Implementar o script PDF → JSON usando somente os 16 documentos de desenvolvimento e exemplos fictícios; reservar os dez de teste para E05, após o gabarito humano.

