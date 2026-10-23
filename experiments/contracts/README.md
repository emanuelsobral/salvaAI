# Experimento de extração de contratos

**Atualizado em 23/10/2026. Protótipo 0.1.25: diagnóstico auxiliar de cronogramas por fase disponível no comando de extração, sem gerar calendário. 327 testes aprovados; 18 saídas validadas e 90/90 campos idênticos à 0.1.24. Entrega 100% (3/3); experimento original 29% (2/7), sem avaliação independente.**

Nesta pasta estão as definições, a coleta e o protótipo local: **26 PDFs públicos, 16 para desenvolvimento e dez para teste**. O extrator 0.1.0 foi executado apenas na divisão de desenvolvimento e em casos fictícios. **A cobertura inicial é baixa; não há gabarito humano nem métricas de acerto.**

Após a identificação de modelos em branco, foram acrescentados **dois contratos públicos preenchidos de locação institucional**, em catálogo complementar de desenvolvimento. Eles têm fichas próprias e não substituem silenciosamente o piloto original. A coleta de contratos pessoais preenchidos continua pendente.

- [Protocolo](protocolo.md): campos, gabarito, amostra, confiança e avaliação.
- [JSON Schema](registro.schema.json): formato de saída e gabarito, com cinco campos financeiros.
- [Exemplo de saída](examples/extracao-sintetica.json) e [exemplo de gabarito](examples/gabarito-sintetico.json): ilustrações feitas à mão, sem valor de avaliação.
- [Texto fictício de referência](examples/contrato-sintetico.txt): origem dos exemplos; não é um PDF nem integra a amostra real.
- [Casos de avaliação](examples/casos-avaliacao.json): contagens esperadas para conferir o futuro avaliador.
- [Relatório da coleta](relatorio-coleta.md): cobertura, limitações e fontes que falharam.
- [Catálogo do piloto](amostra-piloto-v1.json): inventário congelado, hashes e divisão por família.
- [Correção da seleção](coleta-preenchidos.md) e [catálogo complementar](amostra-preenchidos-v1.json): dois contratos preenchidos conferidos visualmente, com limites de uso registrados.
- [Fontes candidatas](fontes-candidatas.json) e [triagem](triagem.json): procedência e decisões anteriores à implementação.
- [Protótipo E04](prototipo.md): execução, regras, limitações e validação técnica da versão 0.1.0.
- Versão atual **0.1.25**: diagnóstico de carência, amortização, eventos e dia útil, com dependências preservadas. 327 testes aprovados. [Detalhes e limites](cronograma-fases-0125.md).
- [Alternativas e tabelas escolares 0.1.24](opcoes-escolares-0124.md): opções e perfis preservados, sem escolha de plano.
- [Valores por extenso 0.1.23](valores-extenso-0123.md): conferência de quantias e distinção de taxas parceladas.
- [Vigência por curso/evento 0.1.22](vigencia-curso-0122.md): regras literais preservadas, sem inferir datas ou meses.
- [Reajuste e revisão 0.1.21](reajuste-revisao-0121.md): modalidades reconhecidas em cláusulas distintas, com requisitos preservados.
- [Pagamento documental 0.1.20](pagamento-documental-0120.md): consolidação restrita do prazo por nota fiscal com condições entre páginas.
- [Comparação de desenvolvimento — pub-alu-03](comparacao-pub-alu-03.md): referência de IA conferida pelo usuário versus extrator 0.1.0; omissões e erro de periodicidade, sem métricas formais.
- [Guia de anotação E03](guia-anotacao.md): 26 formulários originais e dois complementares. `pub-alu-03` tem referência de IA revisada pelo usuário; o gabarito humano independente continua pendente.
- [Diagnóstico de Mafra — pub-alu-02](diagnostico-pub-alu-02.md): execução da 0.1.4 encontrou quatro campos não identificados e reajuste ambíguo. As versões 0.1.5–0.1.8 reconheceram vigência, valor, vencimento e reajuste; lote original repetido; correções de vigência/vencimento pendentes, com **Alto**.
- [Rodada de desenvolvimento 0.1.8](regressao-desenvolvimento-018.md): 16 PDFs executados, 14 processados e dois sem texto extraível. Saídas válidas estruturalmente; encontrados problemas de vigência em branco e seleção de vencimento. Sem métricas de acerto.
- [Correções de regressão 0.1.9](correcoes-regressao-019.md): três achados prioritários corrigidos, evidências e limites registrados. A revisão de vigência educacional foi concluída na 0.1.10.
- [Vigência educacional 0.1.10](vigencia-educacional-0110.md): duração anual literal em edu-01; abstenção em edu-04/edu-06. Lote completo executado; novas pendências consolidadas no relatório abaixo.
- [Lote completo 0.1.10](lote-completo-0110.md): 18 saídas validadas; resultados anteriores estáveis nos dez já conferidos. Diagnóstico que orientou a correção de vigência de saúde.
- [Vigência de saúde 0.1.11](vigencia-saude-0111.md): duas vigências reconhecidas; os outros 88 objetos de campo ficaram idênticos naquela rodada.
- [Vencimento de financiamento 0.1.12](vencimento-financiamento-0112.md): fin-05 exige revisão por regra parcial; fin-04 preserva evidência de dia útil. O diagnóstico dos reajustes foi registrado na etapa seguinte.
- [Diagnóstico de reajustes 0.1.12](diagnostico-reajustes-0112.md): quatro casos inspecionados e classificação incompleta de componentes técnicos identificada.
- [Reajustes compostos 0.1.13](reajustes-compostos-0113.md): quatro candidatos internos corrigidos em sau-07, preservando componentes técnicos.
- [Títulos e referências 0.1.14](referencias-reajuste-0114.md): dois títulos filtrados e seis referências reclassificadas nos casos diagnosticados. Modalidades tratadas na versão seguinte, sem resolver automaticamente as condições.
- [Modalidades de saúde 0.1.15](modalidades-saude-0115.md): correção, testes e documentação concluídos; resultados preservados na C:. Distinção de objetos tratada na versão seguinte.
- [Objetos do reajuste 0.1.16](objetos-reajuste-0116.md): critérios de componentes mantidos como pendências, sem escolher índice geral. Condições adicionais do cronograma tratadas na versão seguinte.
- [Cronograma de financiamento 0.1.17](cronograma-financiamento-0117.md): condições por evento/fase preservadas; sem cálculo de calendário. Comparador sintético preparado na entrega seguinte. Métricas reais dependem de E03/E05. [Recorte de vigência 0.1.18](analise-assistida-0118.md) e [condições de pagamento/revisão 0.1.19](condicoes-pagamento-revisao-0119.md) registram as correções posteriores.
- [Comparador sintético 0.1.0](avaliacao-sintetica.md): preparação de E06, sem avaliação real; 20 testes novos e **211 testes totais aprovados**. E03 com referência assistida preservada e novo pacote vazio separado para outra pessoa realizar leitura independente, com apoio técnico **Alto**.
- [Pendências e prioridades da 0.1.21](pendencias-desenvolvimento-0121.md): inventário dos 90 campos e triagem de lacunas, remissões, alternativas, conflitos e falhas de leitura. Não é taxa de acerto.
- [Kanban](../../docs/kanban.md): continuar a trilha de desenvolvimento assistido sem depender de pessoa revisora. Anotação e avaliação independentes do protocolo original permanecem pendentes e separadas.

O script roda localmente no terminal, sem API de IA, login, banco ou integração ao SalvaAI. PDFs digitalizados ficam registrados como limitação da primeira versão.

```powershell
python experiments/contracts/extrair.py --id alu-01
```

O JSON aparece no terminal e a rodada completa é preservada em `runs/`. A partir da 0.1.25, a pasta também contém `cronograma-financiamento.json`, diagnóstico auxiliar com hash do PDF e evidências, sem calendário calculado. A saída oficial continua com cinco campos. Esse exemplo usa um modelo do piloto original; o extrator ainda não incorpora o catálogo complementar. Para começar uma anotação independente, use o pacote vazio separado indicado no [guia de anotação](guia-anotacao.md), com pessoa sem exposição às respostas. As fichas preenchidas de pub-alu-02 e pub-alu-03 têm ajuda de IA e não devem ser mostradas à pessoa anotadora. A criação das fichas não substitui a leitura humana nem marca campos como ausentes.

Documentos coletados, textos extraídos, gabaritos reais e saídas devem ficar em `data/` e `runs/`, ignorados pelo Git desta pasta. Somente exemplos explicitamente fictícios e metadados públicos são preparados para versionamento. A disponibilidade pública dos PDFs não garante ausência de dados pessoais; não publicar os originais ou suas imagens.

## Executar as ferramentas de coleta

Requer Python 3.12 ou superior e a dependência local de `requirements.txt`. Execute a partir da raiz `salva-ai`:

```powershell
python -m pip install -r experiments/contracts/requirements.txt
python experiments/contracts/coletar.py --ids fin-01 edu-01
python experiments/contracts/catalogar.py --verificar
python experiments/contracts/catalogar.py --verificar --catalogo experiments/contracts/amostra-preenchidos-v1.json
python -m unittest discover -s experiments/contracts -p "test_*.py" -v
```

Sem `--ids`, o coletor visita todas as fontes, reutilizando downloads locais íntegros. Cada rodada preserva seu log, inclusive falhas. Limite de 20 MiB por arquivo e espera de rede de 20 segundos. Os PDFs baixados ficam em `data/originais/`; o coletor não extrai os cinco campos financeiros.

O catálogo já existe. `catalogar.py --criar` recusa sobrescrevê-lo. `--verificar` exige os 26 PDFs locais e confere hashes, duplicidades, famílias e divisão. Em outra máquina será necessário obter os mesmos arquivos; uma fonte indisponível ou alterada deve ser registrada, nunca substituída silenciosamente. Uma ampliação da amostra exige catálogo de nova versão, preservando este piloto e os documentos reservados.

A validação do esquema usa o AJV já disponível nas dependências locais do projeto. O extrator e a preparação de formulários usam Python; as conferências de JSON usam Node. Nenhuma dependência foi acrescentada à aplicação web.
