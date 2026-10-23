# Correção da seleção: contratos públicos preenchidos

**13/10/2026. E02 — seleção da amostra; nível recomendado: Médio.**

O usuário identificou que `alu-01` e `edu-04` eram modelos com campos em branco. A indicação de ambos como próximos contratos para anotar foi inadequada. Uma tabela de preços em um modelo educacional não comprova a existência de uma contratação individual preenchida.

Conferindo a classificação já registrada, o piloto original de 26 PDFs contém **15 modelos com lacunas, nove documentos de condições gerais, um regulamento e um contrato coletivo institucional**. Ele é útil para estudar ausências e leitura de cláusulas, mas não foi confirmado como amostra de 26 contratações pessoais preenchidas. Os resultados de desenvolvimento anteriores não medem desempenho nesse cenário.

Após autorização explícita para buscar contratos públicos preenchidos, foram obtidos mais três PDFs. **Dois foram incluídos em uma amostra complementar**, com condições financeiras individualizadas e indicações visuais de assinatura no próprio documento.

## Documentos indicados agora

| ID | Fonte oficial e documento | Páginas | Evidência da triagem |
|---|---|---:|---|
| `pub-alu-03` | [Prefeitura de Cruz das Almas — contrato 567/2022](https://acessoainformacao.cruzdasalmas.ba.gov.br/uploads/contratos/20220712151103_GERAL_194003146462cdb9376aecc.pdf) | 5 | Página física 2 com preço, vigência, regra de pagamento e reajuste preenchidos; página 5 com assinaturas visíveis. |
| `pub-alu-02` | [Prefeitura de Mafra — contrato 054/2024](https://mafra.sc.gov.br/uploads/sites/372/2024/03/Contr-054.2024-INEX.002.2024-Proc.-010.2024-MARCELO-SARTORI.pdf) | 12 | Página física 1 com contratação e tabela financeira preenchidas; página 12 com relatório de assinaturas. |

A inspeção de assinatura foi visual. Não foi executada validação criptográfica nem emitida conclusão sobre validade jurídica. Para evitar antecipar o gabarito, esta triagem registra onde existe conteúdo, sem preencher as respostas dos cinco campos.

**Começar pelo `pub-alu-03`**, por ser mais curto. O PDF original está em `data/originais/pub-alu-03.pdf`; a ficha humana está em `data/gabaritos/preenchidos-v1-rascunhos/pub-alu-03.ficha.md`. Ler todas as páginas antes de anotar, não apenas a página indicada na triagem.

Um terceiro documento, `pub-alu-01`, publicado por Presidente Bernardes como contrato 122/2025, possui condições financeiras individualizadas, mas a cópia conferida não mostra assinaturas preenchidas na última página. Foi preservado como candidato; não entrou nesta amostra. [Fonte consultada](https://www.presidentebernardes.mg.gov.br/uploads-pdf/Contrato-1746561623681a6a573267d5.pdf).

## Limites e preservação

- Os dois contratos são **locações institucionais com prefeituras**. Ficam no estrato complementar, separados da avaliação de finanças pessoais. Não resolvem a falta de contratos individuais preenchidos de financiamento, aluguel residencial, mensalidade e saúde.
- Ambos ficam em **desenvolvimento**, pois seu conteúdo foi inspecionado para seleção. Não são novos testes inéditos. O extrator não foi executado neles nesta coleta.
- O [catálogo original](amostra-piloto-v1.json), seus hashes e os dez documentos reservados permanecem intactos. A nova seleção está em [amostra-preenchidos-v1.json](amostra-preenchidos-v1.json), versão `preenchidos-1.0.0`.
- Os originais e as fichas ficam fora do Git. Não publicar nomes, CPFs, dados bancários ou assinaturas em relatórios de resultados. As fontes públicas podem conter esses dados.
- Não é necessário que todos os cinco campos existam em todo contrato. A pessoa anotadora registra ausência ou ambiguidade quando apropriado; não calcula quantidade de parcelas a partir do prazo.
- Atualização de 13/10/2026: a ficha e o JSON de `pub-alu-03` receberam respostas de **IA externa**, com origem confirmada e posterior conferência humana declarada pelo usuário. Servem como referência revisada de desenvolvimento, fora da avaliação de anotação independente. `pub-alu-02` continua vazio. E03 não foi concluída; a ampliação e adequação da amostra E02 continuam pendentes.

## Conferir os arquivos

```powershell
python experiments/contracts/catalogar.py --verificar --catalogo experiments/contracts/amostra-preenchidos-v1.json
node experiments/contracts/conferir-gabarito.mjs experiments/contracts/data/gabaritos/preenchidos-v1-rascunhos/pub-alu-03.rascunho.json --catalogo experiments/contracts/amostra-preenchidos-v1.json
```

O segundo comando deverá recusar o formulário enquanto a anotação humana estiver pendente. Para criar novas cópias vazias em uma pasta inédita:

```powershell
python experiments/contracts/preparar_gabaritos.py --catalogo experiments/contracts/amostra-preenchidos-v1.json --destino experiments/contracts/data/gabaritos/preenchidos-nova-rodada
```

O modo `--id` do extrator E04 continua limitado ao catálogo original. Após a conferência da referência, `pub-alu-03` foi executado pelo modo existente `--pdf`, com identidade e divisão de desenvolvimento verificadas no catálogo complementar. A [comparação](comparacao-pub-alu-03.md) preserva a saída e os problemas encontrados. Nenhuma regra foi ajustada nessa execução.

## Validação desta alteração

- 44 testes Python e sete testes Node aprovados.
- Catálogo complementar conferido: dois PDFs, duas famílias, ambos em desenvolvimento.
- Catálogo original conferido: 26 PDFs, 23 famílias, divisão 16/10 e SHA-256 preservado (`9bdd77fed742b15241653eaa419c6c44052b2c0890eb4d1d61840806ca7a1d30`).
- A conferência reconheceu o novo contrato e recusou seu rascunho pelas pendências humanas, como esperado; sem erro de identidade ou hash.
- Originais, fichas e imagens de inspeção continuam ignorados pelo Git. Nenhum deploy ou chamada de IA.
