"""Congela e verifica o catálogo piloto, sem extrair campos financeiros."""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

BASE = Path(__file__).resolve().parent
SNAPSHOT = BASE / 'amostra-piloto-v1.json'


def validar(catalogo, base=BASE):
    ids, hashes, familias = set(), set(), {}
    for item in catalogo['documentos']:
        identifier = item['id']
        if identifier in ids:
            raise ValueError('ID duplicado: ' + identifier)
        ids.add(identifier)
        if item['status_coleta'] != 'baixado':
            if item.get('divisao') is not None:
                raise ValueError('Falha de coleta não pode entrar no lote: ' + identifier)
            continue
        if item['divisao'] not in ('desenvolvimento', 'teste'):
            raise ValueError('Divisão inválida: ' + identifier)
        previous = familias.setdefault(item['familia'], item['divisao'])
        if previous != item['divisao']:
            raise ValueError('Família nas duas divisões: ' + item['familia'])
        target = (base / item['arquivo']).resolve()
        if not target.is_relative_to((base / 'data' / 'originais').resolve()):
            raise ValueError('PDF fora da pasta de originais: ' + identifier)
        digest = hashlib.sha256(target.read_bytes()).hexdigest()
        if digest != item['sha256']:
            raise ValueError('Hash divergente: ' + identifier)
        if digest in hashes:
            raise ValueError('PDF duplicado no lote: ' + identifier)
        hashes.add(digest)
        if item['paginas'] != len(item['leitura_paginas']):
            raise ValueError('Metadados de páginas incompletos: ' + identifier)
    return {
        'fontes': len(ids), 'pdfs': len(hashes), 'familias': len(familias),
        'divisoes': dict(Counter(x['divisao'] for x in catalogo['documentos'] if x['status_coleta'] == 'baixado')),
    }


def criar():
    if SNAPSHOT.exists():
        raise ValueError('Piloto já congelado. Não sobrescrever; futuras ampliações exigem outra versão.')
    sources = json.loads((BASE / 'fontes-candidatas.json').read_text(encoding='utf-8'))['fontes']
    triage = json.loads((BASE / 'triagem.json').read_text(encoding='utf-8'))
    latest = {}
    for path in sorted((BASE / 'data' / 'coletas').glob('*.jsonl')):
        for line in path.read_text(encoding='utf-8').splitlines():
            item = json.loads(line)
            item['log_coleta'] = path.relative_to(BASE).as_posix()
            latest[item['id']] = item
    records = []
    for source in sorted(sources, key=lambda x: x['id']):
        item = dict(latest[source['id']])
        if any(item[k] != source[k] for k in ('url', 'categoria', 'familia')):
            raise ValueError('Fonte mudou desde a coleta: ' + source['id'])
        if item['status_coleta'] == 'baixado':
            item.update(triage['documentos'][item['id']])
            item['divisao'] = triage['familias'][item['familia']]
        else:
            item.update({'divisao': None, 'estrato': 'falha_coleta'})
        records.append(item)
    catalogo = {
        'versao': 'piloto-1.0.0', 'protocolo': '1.0.0',
        'congelado_em': triage['data'], 'status': 'piloto_inicial_ampliacao_pendente',
        'meta_documentos': 40, 'meta_por_categoria': 10,
        'observacao': 'Triagem anterior à implementação. Não contém gabarito, saídas do extrator ou métricas de acerto. Teste reservado para avaliação futura.',
        'escopo_revisao': triage['escopo_revisao'], 'documentos': records,
    }
    validar(catalogo)
    with SNAPSHOT.open('x', encoding='utf-8') as output:
        output.write(json.dumps(catalogo, ensure_ascii=False, indent=2) + '\n')
    return catalogo


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--criar', action='store_true')
    mode.add_argument('--verificar', action='store_true')
    parser.add_argument('--catalogo', type=Path, default=SNAPSHOT, help='Catálogo existente para --verificar')
    args = parser.parse_args()
    if args.criar and args.catalogo.resolve() != SNAPSHOT.resolve():
        parser.error('--catalogo só pode escolher outra amostra com --verificar')
    catalogo = criar() if args.criar else json.loads(args.catalogo.read_text(encoding='utf-8'))
    print(json.dumps(validar(catalogo), ensure_ascii=False))
    print('SHA-256 catálogo:', hashlib.sha256(args.catalogo.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
