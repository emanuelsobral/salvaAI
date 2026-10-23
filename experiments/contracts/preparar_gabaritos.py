"""Prepara formulários vazios para anotação humana, sem ler saídas do extrator."""
import argparse
import json
from pathlib import Path

from catalogar import validar

BASE = Path(__file__).resolve().parent
CAMPOS = ('valor_parcela', 'numero_parcelas', 'data_vencimento', 'vigencia', 'regra_reajuste')


def rascunho(item):
    return {
        'status': 'rascunho_nao_avaliavel', 'confirmacao_leitura_humana': False,
        'contexto': {k: item[k] for k in ('id', 'categoria', 'natureza', 'estrato', 'divisao', 'paginas', 'arquivo')},
        'registro': {
            'protocolo_versao': '1.0.0', 'esquema_versao': '1.0.0', 'tipo_registro': 'gabarito',
            'documento_id': item['id'], 'pdf_sha256': item['sha256'], 'versao_extrator': None,
            'anotacao': {'anotador_id': None, 'revisor_id': None, 'estado_revisao': None, 'data': None},
            'processamento': {'status': 'nao_executado', 'duracao_ms': None, 'erros': []},
            'campos': {nome: {'estado': None, 'valor': None, 'evidencias': [],
                              'confianca': 'nao_aplicavel', 'regra_id': None, 'motivo': None} for nome in CAMPOS},
        },
    }


def ficha(item, base=BASE):
    pdf = (base / item['arquivo']).resolve().as_posix()
    return f'''# Ficha de anotação humana — {item['id']}

**Pendente. Nenhum campo foi anotado.**

[Abrir PDF original](<{pdf}>) · {item['paginas']} páginas físicas · {item['categoria']} · {item['divisao']}

Código da pessoa anotadora: ______  
Data da leitura (DD/MM/AAAA): ______  
Código da pessoa revisora, se houver: ______

- [ ] Li o documento sem consultar respostas do protótipo.
- [ ] Conferi todos os cinco campos, inclusive campos ausentes.
- [ ] Registrei páginas físicas e transcrevi os trechos pertinentes.

Escolha um estado por campo: **presente / ausente / ambíguo / ilegível**.
Uma célula vazia significa pendência, nunca ausência no contrato.

| Campo | Estado escolhido | Informação no documento | Página(s) física(s) | Trecho literal e observações |
|---|---|---|---|---|
| Valor da parcela | | | | |
| Número de parcelas | | | | |
| Vencimento | | | | |
| Vigência | | | | |
| Regra de reajuste | | | | |

Para vigência, registre início, fim, duração e condições explícitas separadamente.
Para reajuste, registre índices, percentual, periodicidade e a cláusula completa.
Para ausência, ambiguidade ou ilegibilidade, explique a razão na última coluna.
Se o trecho não couber na tabela, continue abaixo, identificando campo e página.

## Trechos adicionais e divergências

Preenchimento humano pendente.

## Revisão

Resultado da revisão: ______  
Divergências resolvidas ou ainda pendentes: ______

Esta ficha pode ser transcrita para o JSON após o preenchimento humano. Não preencher
a partir da saída do extrator. A conferência técnica não certifica a verdade do conteúdo.
'''


def preparar(destino, catalogo, base=BASE):
    validar(catalogo, base)
    destino = Path(destino)
    destino.mkdir(parents=True, exist_ok=False)
    itens = [i for i in catalogo['documentos'] if i['status_coleta'] == 'baixado']
    for item in itens:
        (destino / (item['id'] + '.rascunho.json')).write_text(
            json.dumps(rascunho(item), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (destino / (item['id'] + '.ficha.md')).write_text(ficha(item, base), encoding='utf-8')
    (destino / 'LEIA-ME.md').write_text(
        '# Formulários pendentes de anotação humana\n\n'
        'Estes arquivos estão vazios de propósito. Null não significa ausência no contrato.\n\n'
        'Siga experiments/contracts/guia-anotacao.md. Abra os PDFs originais em data/originais/. '
        'Não consulte runs/, resultados do protótipo ou previsões ao anotar. '
        'Nenhum formulário desta pasta é um gabarito aprovado.\n', encoding='utf-8')
    return len(itens)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--destino', required=True, help='Pasta nova; rascunhos existentes nunca são sobrescritos')
    parser.add_argument('--catalogo', type=Path, default=BASE / 'amostra-piloto-v1.json', help='Catálogo a anotar; o piloto original é o padrão')
    args = parser.parse_args()
    catalogo = json.loads(args.catalogo.read_text(encoding='utf-8'))
    total = preparar(args.destino, catalogo)
    print(f'{total} formulários vazios preparados. Anotação e revisão humanas pendentes.')


if __name__ == '__main__':
    main()
