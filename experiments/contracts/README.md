# Extrator local de contratos

O protótipo lê contratos em português e devolve um JSON com cinco campos: valor da parcela, número de parcelas, vencimento, vigência e regra de reajuste. Usa regras locais e não exige API de IA, login ou banco.

A versão 0.1.25 trabalha com PDFs que têm camada de texto. Digitalizações, arquivos protegidos, texto ilegível e condições ambíguas podem resultar em campos sem identificação ou erros registrados. A precisão em contratos reais ainda não foi medida com gabarito independente.

O aplicativo web reutiliza as regras, com PDF.js e OCR opcional no navegador. O terminal usa pypdf; essa diferença pode alterar os resultados. Para usar a interface, consulte o [guia de contratos](../../docs/contratos.md).

## Instalar e executar

Use Python 3.12 ou superior e execute a partir da raiz do repositório:

```powershell
python -m pip install -r experiments/contracts/requirements.txt
python experiments/contracts/extrair.py --pdf caminho/contrato.pdf --documento-id contrato-local
```

Para um documento de desenvolvimento do catálogo piloto que já esteja disponível localmente:

```powershell
python experiments/contracts/extrair.py --id alu-01
```

O JSON aparece no terminal. Cada execução cria uma pasta em `runs/`, com resultado, texto por página, manifesto, erros e hashes dos arquivos usados. A opção `--saida` permite escolher uma pasta nova; execuções anteriores não são sobrescritas.

A saída principal mantém os cinco campos. O arquivo `cronograma-financiamento.json` acrescenta um diagnóstico de fases e dependências, sem calcular datas de pagamento.

## Interpretar a saída

O [esquema JSON](registro.schema.json) define valores, estados, confiança e evidências por página. O [exemplo de extração](examples/extracao-sintetica.json) e o [exemplo de gabarito](examples/gabarito-sintetico.json) são fictícios.

Campos desconhecidos não devem ser convertidos em zero ou preenchidos por suposição. A duração de um contrato não determina automaticamente seu número de parcelas. Condições concorrentes ou incompletas precisam de revisão.

O [protocolo](protocolo.md) define os cinco campos, as regras de confiança e os critérios de avaliação. Esse arquivo também é usado pelos comandos para registrar a versão das regras em cada execução. Para preparar uma referência independente, siga o [guia de anotação](guia-anotacao.md).

## Coleta e catálogos

O piloto contém metadados de 26 PDFs públicos, com 16 destinados a desenvolvimento e dez reservados para teste. Há um catálogo complementar com dois contratos institucionais preenchidos. Esses documentos não comprovam representatividade de contratos pessoais.

```powershell
python experiments/contracts/coletar.py --ids fin-01 edu-01
python experiments/contracts/catalogar.py --verificar
python experiments/contracts/catalogar.py --verificar --catalogo experiments/contracts/amostra-preenchidos-v1.json
```

Sem `--ids`, a coleta visita todas as fontes e reutiliza os downloads íntegros. O limite é de 20 MiB por arquivo, com espera de rede de 20 segundos. Os PDFs ficam em `data/originais/`, e as falhas permanecem no log.

A verificação do catálogo exige os arquivos locais correspondentes e confere hashes, duplicidades, famílias e divisão. Uma fonte alterada ou indisponível deve ser registrada; não substitua arquivos silenciosamente. O extrator por ID usa o catálogo piloto, e os documentos reservados são protegidos contra uso para ajuste das regras.

## Testes

```powershell
python -m unittest discover -s experiments/contracts -p "test_*.py" -v
```

As conferências JSON usam Node e o AJV disponível nas dependências do projeto. Os testes de estrutura e regras não substituem a avaliação de precisão.

## Dados locais

Mantenha PDFs, textos extraídos, gabaritos reais e saídas em `data/` e `runs/`, ignorados pelo Git. Exemplos sintéticos e metadados públicos podem ser versionados. Documentos públicos também podem conter dados pessoais; não inclua os originais ou suas imagens no repositório.
