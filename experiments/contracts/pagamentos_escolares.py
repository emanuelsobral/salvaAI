"""Triagem de opções escolares e tabelas; nunca escolhe um plano de pagamento."""
from datetime import datetime
from decimal import Decimal
import re
import unicodedata


def normalizar(texto):
    texto = ''.join(c for c in unicodedata.normalize('NFKD', texto) if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', texto).strip().lower()


def blocos(paginas):
    marcador = re.compile(r'(?im)^[ \t]*(?:\d{1,3}\.\d+(?:\.\d+)*[.)]?\s+|§\s*\d+|cl[aá]usula\b)')
    grupo = []
    for numero, texto in enumerate(paginas, 1):
        marcas = list(marcador.finditer(texto))
        prefixo = texto[:marcas[0].start()] if marcas else texto
        if prefixo.strip():
            grupo.append({'pagina': numero, 'trecho': prefixo.strip()})
        for i, marca in enumerate(marcas):
            if grupo:
                yield grupo
            fim = marcas[i + 1].start() if i + 1 < len(marcas) else len(texto)
            grupo = [{'pagina': numero, 'trecho': texto[marca.start():fim].strip()}]
    if grupo:
        yield grupo


def conferir_tabela(evidencias, quantidade):
    """Confere o formato suportado, sem inferir matrícula ou reconstruir linhas."""
    texto = '\n'.join(e['trecho'] for e in evidencias)
    s = normalizar(texto)
    cabecalho = r'mensalidades?\s+valor\s+(?:referencia\s+)?data (?:de )?vencimento'
    if not re.search(cabecalho, s):
        return {'estado': 'nao_identificada', 'linhas': [], 'motivos': []}
    linhas, motivos = [], []
    meses = dict(zip('janeiro fevereiro marco abril maio junho julho agosto setembro outubro novembro dezembro'.split(), range(1, 13)))
    moeda = r'((?:\d{1,3}(?:\.\d{3})+|\d+),\d{2})'
    padrao = re.compile(r'^(\d+)[aoºª°]?\s*(?:mensalidade|parcela)\s+r\$\s*' + moeda +
                        r'\s+(?:(\w+)/(\d{4})\s+)?(\d{2}/\d{2}/\d{4})\s*$')
    for evidencia in evidencias:
        for original in evidencia['trecho'].splitlines():
            linha = normalizar(original)
            if not re.match(r'^\d+[aoºª°]?\s*(?:mensalidade|parcela)\b', linha):
                continue
            m = padrao.fullmatch(linha)
            if not m:
                motivos.append('linha_fora_do_formato')
                continue
            try:
                data = datetime.strptime(m[5], '%d/%m/%Y').date()
                if m[3] and (meses.get(m[3]) != data.month or int(m[4]) != data.year):
                    motivos.append('referencia_diferente_do_vencimento')
                quantia = Decimal(m[2].replace('.', '').replace(',', '.'))
                if quantia <= 0:
                    motivos.append('valor_nao_positivo')
                linhas.append({'ordem': int(m[1]), 'quantia': format(quantia, '.2f'),
                               'data': data.isoformat(), 'pagina': evidencia['pagina'], 'trecho': original})
            except ValueError:
                motivos.append('data_invalida')
    if quantidade is None or not 2 <= quantidade <= 120:
        motivos.append('quantidade_nao_suportada')
    elif [l['ordem'] for l in linhas] != list(range(2, quantidade + 1)):
        motivos.append('sequencia_incompleta_ou_repetida')
    if not re.search(r'\bprimeira\b.{0,500}\bato da matricula\b', s):
        motivos.append('primeira_parcela_sem_evento')
    if any(a['data'] >= b['data'] for a, b in zip(linhas, linhas[1:])):
        motivos.append('datas_fora_de_ordem')
    if re.search(r'\biguais\b', s):
        primeira = re.search(r'\bprimeira\b.{0,60}?r\$\s*' + moeda, s)
        if not primeira:
            motivos.append('valor_da_primeira_nao_identificado')
        elif any(Decimal(l['quantia']) != Decimal(primeira[1].replace('.', '').replace(',', '.')) for l in linhas):
            motivos.append('valores_diferentes_em_parcelas_iguais')
    return {'estado': 'formato_conferido' if not motivos else 'incompleta_ou_inconsistente',
            'linhas': linhas, 'motivos': sorted(set(motivos))}


def analisar_opcoes(paginas):
    contexto = normalizar(' '.join(paginas))
    if not re.search(r'\b(?:escolar|educacionais|educacao)\b|'
                     r'\b(?:contrato de|objeto do|objeto de|matricula no|aluno do) curso\b|'
                     r'\b(?:estudantes de\s*graduacao|profissionais\s*formados)\b', contexto):
        return []
    saida = []
    for evidencias in blocos(paginas):
        s = normalizar(' '.join(e['trecho'] for e in evidencias))
        contagem = re.search(r'\ba vista ou em (\d+)(?:\s*\([^)]{1,65}\))?\s+parcelas\b', s)
        perfis = (re.search(r'para estudantes de\s*graduacao\b', s) and
                  re.search(r'para profissionais\s*formados\b', s) and 'r$' in s)
        opcao = (re.search(r'\bparcelas ou a vista\b', s) or
                 (re.search(r'\bparcelado em\s*ate\s*\d+', s) and re.search(r'\ba vista\b', s)))
        if not (contagem or perfis or opcao):
            continue
        gatilho = contagem or opcao
        prefixo = s[:gatilho.start()] if gatilho else ''
        acessorio = re.search(r'\b(?:taxa de (?:adesao|matricula)|material didatico|segunda via)\b', prefixo)
        principal = re.search(r'\b(?:mensalidades?|anuidade|sem\s*estralidade|preco do curso)\b', prefixo)
        if acessorio and not principal and not perfis:
            continue
        quantidade = int(contagem[1]) if contagem else None
        saida.append({'tipo': 'a_vista_ou_parcelado' if contagem else 'por_perfil' if perfis else 'opcoes_complementares',
                      'evidencias': evidencias, 'tabela': conferir_tabela(evidencias, quantidade)})
    return saida
