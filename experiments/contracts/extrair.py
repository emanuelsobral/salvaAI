"""PDF local → JSON de cinco campos. Rodada E04; PDFs de teste são recusados."""
import argparse
from contextlib import redirect_stderr
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import re
import sys
import time
import uuid

import pypdf
from pypdf import PdfReader
from regras import CAMPOS, VERSAO, extrair_campos, vazio
from cronograma_financiamento import criar_diagnostico, verificar_diagnostico

BASE = Path(__file__).resolve().parent
CATALOGO = BASE / 'amostra-piloto-v1.json'
MAX_BYTES = 20 * 1024 * 1024
MAX_PAGINAS = 150
MAX_TEXTO_PAGINA = 200_000


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def erro(codigo, mensagem, pagina=None):
    return {'codigo': codigo, 'mensagem': mensagem, 'pagina': pagina}


def ler_pdf(data):
    paginas, erros = [], []
    if len(data) > MAX_BYTES:
        return paginas, [erro('PDF_MUITO_GRANDE', 'PDF excedeu o limite de 20 MiB.')]
    if not data.lstrip().startswith(b'%PDF-'):
        return paginas, [erro('PDF_INVALIDO', 'O arquivo não possui assinatura de PDF.')]
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted and not reader.decrypt(''):
            return paginas, [erro('PDF_PROTEGIDO', 'PDF exige senha; não foi aberto.')]
        if not 0 < len(reader.pages) <= MAX_PAGINAS:
            return paginas, [erro('LIMITE_PAGINAS', 'PDF vazio ou acima de 150 páginas.')]
        for numero, page in enumerate(reader.pages, 1):
            try:
                texto = page.extract_text() or ''
                if len(texto) > MAX_TEXTO_PAGINA:
                    paginas.append('')
                    erros.append(erro('LIMITE_TEXTO', 'Página acima do limite de texto.', numero))
                else:
                    paginas.append(texto)
                    if not texto.strip():
                        erros.append(erro('SEM_CAMADA_TEXTO', 'Página sem texto extraível; OCR não executado.', numero))
            except Exception:
                paginas.append('')
                erros.append(erro('ERRO_PAGINA', 'Falha ao ler o texto da página.', numero))
    except Exception:
        erros.append(erro('PDF_INVALIDO', 'Não foi possível interpretar a estrutura do PDF.'))
    return paginas, erros


def verificar_evidencias(campos, paginas):
    for campo in campos.values():
        for evidencia in campo['evidencias']:
            p = evidencia['pagina']
            if not 1 <= p <= len(paginas) or evidencia['trecho'] not in paginas[p - 1]:
                raise ValueError('Evidência não pertence à página informada')


def processar(data, documento_id):
    inicio = time.perf_counter()
    paginas, erros = ler_pdf(data)
    if erros:
        # Uma página ausente pode conter aditivo ou condição conflitante.
        # O texto legível é preservado para inspeção, mas não sustenta uma resposta isolada.
        campos = {nome: vazio('erro_leitura', 'Leitura incompleta do PDF; o campo exige revisão do documento original.') for nome in CAMPOS}
        status = 'parcial' if any(p.strip() for p in paginas) else 'falhou'
    else:
        try:
            campos = extrair_campos(paginas)
            verificar_evidencias(campos, paginas)
            status = 'concluido'
        except Exception:
            erros = [erro('FALHA_EXTRACAO', 'Falha nas regras ou na verificação de evidências.')]
            campos = {nome: vazio('erro_leitura', 'A extração não foi concluída.') for nome in CAMPOS}
            status = 'falhou'
    registro = {
        'protocolo_versao': '1.0.0', 'esquema_versao': '1.0.0', 'tipo_registro': 'extracao',
        'documento_id': documento_id, 'pdf_sha256': sha256(data), 'versao_extrator': VERSAO,
        'anotacao': None, 'processamento': {
            'status': status, 'duracao_ms': int((time.perf_counter() - inicio) * 1000), 'erros': erros,
        }, 'campos': campos,
    }
    return registro, paginas


def entrada(args, catalogo):
    documentos = catalogo['documentos']
    if args.id:
        item = next((d for d in documentos if d['id'] == args.id), None)
        if item is None or item['status_coleta'] != 'baixado':
            raise ValueError('ID inexistente ou sem PDF coletado.')
        if item['divisao'] != 'desenvolvimento':
            raise ValueError('Documento reservado para teste. E04 aceita somente desenvolvimento.')
        path = BASE / item['arquivo']
    else:
        item, path = None, Path(args.pdf).resolve()
    with path.open('rb') as source:
        data = source.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        # Hash parcial não pode representar o PDF original no esquema.
        raise ValueError('Entrada excedeu 20 MiB; não foi processada nem recebeu hash parcial.')
    digest = sha256(data)
    if any(d.get('sha256') == digest and d.get('divisao') == 'teste' for d in documentos):
        raise ValueError('Hash pertence ao conjunto reservado. Não processar na etapa E04.')
    if item and digest != item['sha256']:
        raise ValueError('PDF mudou desde o catálogo congelado.')
    identifier = args.documento_id or (item['id'] if item else 'pdf-' + digest[:12])
    if not re.fullmatch(r'[a-z0-9][a-z0-9_-]{0,79}', identifier):
        raise ValueError('Identificador inválido: use até 80 caracteres a-z, 0-9, hífen ou sublinhado.')
    return path, data, identifier


def executar(args):
    catalogo = json.loads(CATALOGO.read_text(encoding='utf-8'))
    path, data, identifier = entrada(args, catalogo)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    destino = Path(args.saida) if args.saida else BASE / 'runs' / ('E04-' + stamp + '-' + uuid.uuid4().hex[:6])
    destino.mkdir(parents=True, exist_ok=False)
    stderr = io.StringIO()
    with redirect_stderr(stderr):
        registro, paginas = processar(data, identifier)
    code = 0 if registro['processamento']['status'] == 'concluido' else 1
    bruto = json.dumps(registro, ensure_ascii=False, indent=2) + '\n'
    cronograma = criar_diagnostico(registro, paginas)
    verificar_diagnostico(cronograma, paginas)
    auxiliar = json.dumps(cronograma, ensure_ascii=False, indent=2) + '\n'
    hashes = {nome: sha256((BASE / nome).read_bytes()) for nome in (
        'extrair.py', 'regras.py', 'extenso.py', 'pagamentos_escolares.py', 'cronograma_financiamento.py',
        'protocolo.md', 'registro.schema.json', 'amostra-piloto-v1.json', 'requirements.txt')}
    manifesto = {
        'etapa': 'E04', 'execucao_em': datetime.now(timezone.utc).isoformat(),
        'documento_id': identifier, 'pdf_arquivo': str(path), 'pdf_sha256': registro['pdf_sha256'],
        'versao_extrator': VERSAO, 'python': sys.version.split()[0], 'pypdf': pypdf.__version__,
        'arquivos_sha256': hashes, 'codigo_saida': code, 'gabarito': None,
        'diagnosticos_sha256': {'cronograma-financiamento.json': sha256(auxiliar.encode('utf-8'))},
        'observacao': 'Execução de desenvolvimento, sem métricas de acerto.',
    }
    for nome, valor in (('resultado.json', bruto), ('paginas.json', json.dumps(paginas, ensure_ascii=False, indent=2) + '\n'),
                        ('manifesto.json', json.dumps(manifesto, ensure_ascii=False, indent=2) + '\n'),
                        ('cronograma-financiamento.json', auxiliar), ('stderr.log', stderr.getvalue())):
        (destino / nome).write_text(valor, encoding='utf-8', newline='\n')
    print(bruto, end='')
    print('Rodada preservada em: ' + str(destino), file=sys.stderr)
    return code


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument('--id', help='ID de desenvolvimento no catálogo piloto')
    source.add_argument('--pdf', help='PDF externo; hashes de teste continuam bloqueados')
    parser.add_argument('--documento-id', help='Identificador anônimo opcional')
    parser.add_argument('--saida', help='Nova pasta para preservar a rodada; nunca sobrescreve')
    args = parser.parse_args()
    try:
        return executar(args)
    except (OSError, ValueError, KeyError) as exc:
        print('Entrada/saída recusada: ' + str(exc), file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
