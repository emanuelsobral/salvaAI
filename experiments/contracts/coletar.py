"""Coleta PDFs públicos catalogados. Não extrai campos financeiros ou gabaritos."""

import argparse
import hashlib
import io
import json
import logging
import re
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path

from pypdf import PdfReader

BASE = Path(__file__).resolve().parent
MAX_BYTES = 20 * 1024 * 1024


class DocumentLinks(HTMLParser):
    def __init__(self, url):
        super().__init__()
        self.url = url
        self.links = set()

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name == 'href' and value and re.search(r'\.(pdf|docx?)(?:$|[?#])', value, re.I):
                self.links.add(urllib.parse.urljoin(self.url, value))


def collect(source):
    identifier = source['id']
    if not re.fullmatch(r'[a-z0-9-]+', identifier):
        raise ValueError('ID inválido no catálogo')
    url = source['url']
    if urllib.parse.urlsplit(url).scheme != 'https':
        raise ValueError('A coleta exige HTTPS')
    record = dict(source)
    record['coletado_em'] = datetime.now(timezone(timedelta(hours=-3))).isoformat()
    target = BASE / 'data' / 'originais' / (identifier + '.pdf')
    cache = target.with_suffix('.download.json')
    try:
        if target.exists() and cache.exists():
            download = json.loads(cache.read_text(encoding='utf-8'))
            if download['url_origem'] != url:
                raise ValueError('ID já usado para outra URL; use novo ID')
            data = target.read_bytes()
            if hashlib.sha256(data).hexdigest() != download['sha256']:
                raise ValueError('PDF local mudou desde o download')
            record.update(download)
        else:
            if target.exists():
                raise ValueError('PDF sem metadados; não sobrescrever')
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 SalvaAI-Research/1.0'})
            with urllib.request.urlopen(req, timeout=20) as response:
                data = response.read(MAX_BYTES + 1)
                if len(data) > MAX_BYTES:
                    raise ValueError('PDF excedeu limite de 20 MiB')
                if not data.lstrip().startswith(b'%PDF-'):
                    raise ValueError('Resposta não é PDF')
                download = {
                    'url_origem': url, 'url_final': response.url,
                    'status_http': response.status,
                    'content_type': response.headers.get('Content-Type'),
                    'sha256': hashlib.sha256(data).hexdigest(),
                    'bytes': len(data), 'baixado_em': record['coletado_em'],
                }
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open('xb') as output:
                output.write(data)
            cache.write_text(json.dumps(download, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            record.update(download)
        record['arquivo'] = target.relative_to(BASE).as_posix()
        reader = PdfReader(io.BytesIO(data))
        record['criptografado'] = reader.is_encrypted
        if reader.is_encrypted and not reader.decrypt(''):
            raise ValueError('PDF protegido; senha não solicitada nem contornada')
        page_metadata = []
        for n, page in enumerate(reader.pages, 1):
            try:
                text = page.extract_text() or ''
                # Somente métricas de legibilidade nesta etapa. Não salvar texto integral.
                page_metadata.append({'pagina': n, 'caracteres': len(text.strip()), 'erro': None})
            except Exception as exc:
                page_metadata.append({'pagina': n, 'caracteres': 0, 'erro': type(exc).__name__})
        record['paginas'] = len(reader.pages)
        record['leitura_paginas'] = page_metadata
        readable = sum(p['caracteres'] >= 40 for p in page_metadata)
        record['classificacao_automatica'] = ('texto' if readable == len(page_metadata) else 'sem_texto_util' if readable == 0 else 'misto_ou_paginas_vazias')
        record['status_coleta'] = 'baixado'
    except Exception as exc:
        record['status_coleta'] = 'falhou'
        record['erro'] = {'tipo': type(exc).__name__, 'mensagem': str(exc)[:300]}
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ids', nargs='*', help='IDs específicos; sem argumento coleta o catálogo completo')
    parser.add_argument('--paginas', nargs='+', help='Listar links de documentos de páginas públicas, sem baixar PDFs')
    args = parser.parse_args()
    if args.paginas:
        for url in args.paginas:
            if urllib.parse.urlsplit(url).scheme != 'https':
                raise ValueError('A descoberta exige HTTPS')
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 SalvaAI-Research/1.0'})
                with urllib.request.urlopen(req, timeout=20) as response:
                    html = response.read(4 * 1024 * 1024).decode('utf-8', errors='replace')
                links = DocumentLinks(url)
                links.feed(html)
                print(json.dumps({'pagina': url, 'links': sorted(links.links)}, ensure_ascii=False), flush=True)
            except Exception as exc:
                print(json.dumps({'pagina': url, 'erro': str(exc)[:200]}, ensure_ascii=False), flush=True)
        return
    sources = json.loads((BASE / 'fontes-candidatas.json').read_text(encoding='utf-8'))['fontes']
    ids = [s['id'] for s in sources]
    if len(ids) != len(set(ids)):
        raise ValueError('IDs repetidos no catálogo')
    if args.ids:
        if set(args.ids) - set(ids):
            raise ValueError('IDs desconhecidos')
        sources = [s for s in sources if s['id'] in args.ids]
    log_dir = BASE / 'data' / 'coletas'
    log_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    logging.basicConfig(filename=log_dir / (stamp + '.warnings.log'), level=logging.WARNING, encoding='utf-8')
    with (log_dir / (stamp + '.jsonl')).open('x', encoding='utf-8') as output:
        with ThreadPoolExecutor(max_workers=4) as pool:
            for record in pool.map(collect, sources):
                output.write(json.dumps(record, ensure_ascii=False) + '\n')
                output.flush()
                print(record['id'], record['status_coleta'], record.get('paginas', ''), flush=True)


if __name__ == '__main__':
    main()
