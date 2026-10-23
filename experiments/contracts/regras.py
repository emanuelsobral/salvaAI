"""Baseline conservadora de regras locais. Sem chamadas de rede ou inferências financeiras."""
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
import json
import re
import unicodedata
from extenso import conferir_extenso
from pagamentos_escolares import analisar_opcoes

VERSAO = '0.1.25'
CAMPOS = ('valor_parcela', 'numero_parcelas', 'data_vencimento', 'vigencia', 'regra_reajuste')
MOEDA = r'r\$\s*(?P<quantia>(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{2})?)(?!\d|[.,]\d)'
# RS só é candidato monetário com centavos e indicação textual de reais.
# Não substitui caracteres do documento nem interpreta o número por extenso.
MOEDA_RS = (r'rs\s+(?P<quantia>(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2})(?!\d|[.,]\d)'
            r'(?=\s*\([^)]{1,120}\breais\b[^)]*\))')
DATA = r'\d{2}/\d{2}/\d{4}'
EXTENSO = r'(?:\s*\([^)]{1,65}\))?'
LACUNA = re.compile(r'_{2,}|\*{3,}|<[^>]+>|\[\s*\]|\.{4,}')
ENCARGOS = r'\b(?:multa|mora|juros|caucao|rescisao|inadimplencia|atraso|honorarios)\b'


def normalizar(texto):
    texto = ''.join(c for c in unicodedata.normalize('NFKD', texto) if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', texto).strip().lower()


@dataclass(frozen=True)
class Trecho:
    pagina: int
    texto: str

    @property
    def normalizado(self):
        return normalizar(self.texto)

    def evidencia(self):
        return {'pagina': self.pagina, 'trecho': self.texto}


def trechos(paginas):
    for pagina, texto in enumerate(paginas, 1):
        # Não reconstruir tabelas nem juntar páginas: evidência sempre é substring literal.
        for parte in re.split(r'\n[ \t]*\n|(?<=[.!?])\s+(?=[A-ZÀ-Ý])', texto):
            parte = parte.strip()
            if parte:
                yield Trecho(pagina, parte)


def clausulas_por_pagina(paginas):
    """Agrupa cláusulas tituladas, preservando um recorte literal por página.

    Não interpreta tabelas, títulos repetidos ou referências: cada novo título
    encerra o grupo anterior. Texto anterior ao primeiro título fica de fora.
    """
    titulo = re.compile(r'(?im)^[ \t]*cl[aá]u?sula\b[^\n]*')
    grupo = []
    for pagina, texto in enumerate(paginas, 1):
        marcas = list(titulo.finditer(texto))
        prefixo = texto[:marcas[0].start()].strip() if marcas else texto.strip()
        if grupo and prefixo:
            grupo.append(Trecho(pagina, prefixo))
        for i, marca in enumerate(marcas):
            if grupo:
                yield grupo
            fim = marcas[i + 1].start() if i + 1 < len(marcas) else len(texto)
            grupo = [Trecho(pagina, texto[marca.start():fim].strip())]
    if grupo:
        yield grupo


def revisao_excepcional(texto):
    """Reconhece menção financeira; não decide índice, direito ou periodicidade."""
    return bool(
        (re.search(r'\brevisao (?:de|dos) precos\b', texto) and
         re.search(r'\b(?:requer\w*|comprov\w*|excepciona\w*|desequilibrio)\b', texto)) or
        (re.search(r'\bprecos\b', texto) and re.search(r'\balterad[oa]s?\b', texto) and
         re.search(r'\bcasos excepcionais\b', texto)))


def indices_reajuste(texto):
    aliases = {
        'IPCA': r'ipca|indice nacional de precos ao consumidor amplo',
        'IGP-M': r'igp[- ]?m|indice geral de precos\s*(?:-\s*|do )?mercado',
        'INPC': r'inpc|indice nacional de precos ao consumidor(?! amplo)',
        'IVAR': r'ivar|indice de variacao de alugueis residenciais',
    }
    # IPCA-E não pode ser reconhecido apenas pelo prefixo IPCA.
    return [indice for indice, padrao in aliases.items()
            if re.search(r'(?<![\w-])(?:' + padrao + r')(?![\w-]|\s*[- ]\s*e\b)', texto)]


def consolidar_reajuste_e_revisao(candidatos, revisoes, pendentes, referencias, conflitos):
    """Conserva duas modalidades em regra literal, sem índice/período globais.

    Aceita apenas cláusulas distintas: reajuste periódico por um único índice
    e revisão excepcional pelo mesmo índice, com requerimento e comprovação.
    Não decide se os requisitos jurídicos estão atendidos.
    """
    if len(candidatos) != 1 or not revisoes or conflitos:
        return None
    valor, principal, _ = candidatos[0]
    if (valor['tipo'] != 'indice' or len(valor['indices']) != 1 or
            valor['periodicidade_meses'] is None or not TITULO_REAJUSTE.match(principal.texto)):
        return None
    revisoes = list(dict.fromkeys(revisoes))
    if any(t not in revisoes for t in pendentes):
        return None
    cabecalho = normalizar(revisoes[0].texto.splitlines()[0])
    if not re.fullmatch(r'clausula\b[^:]*:\s*das alteracoes contratuais', cabecalho):
        return None
    if sum(bool(re.match(r'\s*cl[aá]u?sula\b', t.texto, re.I)) for t in revisoes) != 1:
        return None
    texto = '\n'.join(t.texto for t in revisoes)
    s = normalizar(texto)
    if (not re.search(r'\bprecos\b', s) or not re.search(r'\balterad[oa]s?\b', s) or
            'casos excepcionais' not in s or not re.search(r'\brequer\w*\b', s) or
            not re.search(r'\bcomprov\w*|\bcomprobat\w*', s) or
            indices_reajuste(s) != valor['indices']):
        return None
    if (LACUNA.search(s) or re.search(ENCARGOS, s) or re.search(DATA, s) or
            re.search(r'[%+]|r\$|\b(?:nao|ou|alternativ\w*|substitut\w*|insubsistencia|'
                      r'ausencia|somad\w*|acrescid\w*|reajust\w*|anexo|quadro|'
                      r'dias?|meses?|anos?|anual\w*|mensal\w*|semestral\w*|trimestral\w*)\b', s)):
        return None
    evidencias = evidencias_unicas([principal] + referencias + revisoes)
    return {'estado': 'encontrado',
            'valor': {'tipo': 'outra_regra', 'indices': [], 'percentual': None,
                      'periodicidade_meses': None,
                      'regra': '\n'.join(e['trecho'] for e in evidencias)},
            'evidencias': evidencias, 'confianca': 'media',
            'regra_id': 'reajuste-revisao-distintos-v1',
            'motivo': 'Reajuste periódico e revisão excepcional reconhecidos em cláusulas distintas. '
                      'Critérios e requisitos preservados na regra literal; não há índice ou periodicidade '
                      'global que represente ambas as modalidades. Não foram calculados reajustes '
                      'nem verificado o atendimento de condições jurídicas.'}


def consolidar_pagamento_documental(grupos, candidatos, pendentes, cronograma):
    """Consolida um prazo por nota fiscal com requisitos documentais reconhecidos.

    A lista é deliberadamente restrita. Qualquer item sem classificação, prazo
    adicional ou remissão externa mantém a abstenção. A regra de saída conserva
    os fragmentos originais; a classificação não é interpretação do contrato.
    """
    if len(grupos) != 1 or len(candidatos) != 1 or pendentes or cronograma:
        return None
    valor, prova, regra = candidatos[0]
    grupo = grupos[0]
    if (regra != 'vencimento-evento-v1' or valor['tipo'] != 'outra_regra' or
            prova.pagina != grupo[0].pagina or prova.texto not in grupo[0].texto):
        return None
    textos = []
    for trecho in grupo:
        # Metadados só saem da classificação, nunca das evidências originais.
        texto = re.sub(r'(?im)\n[ \t]*Assinado por \d+ pessoas:[^\n]*\n'
                       r'[ \t]*Para verificar a validade das assinaturas,[^\n]*\s*\Z', '', trecho.texto)
        texto = re.sub(r'(?im)^CONTRATO[^\n]*\bP[aá]gina \d+ de \d+[ \t]*\n', '', texto)
        textos.append(texto)
    partes = re.split(r'(?im)(?=^[ \t]*(?:[a-z]\)[ \t]+|par[aá]grafo [uú]nico\b))', '\n'.join(textos))
    if len(partes) < 2 or LACUNA.search('\n'.join(textos)):
        return None
    for parte in partes[1:]:
        s = normalizar(parte)
        # Não incorporar um novo calendário, prazo ou evento de início sem
        # resolver sua relação com o prazo-base. Nem percentuais viram dias.
        if (re.search(DATA, s) or
                re.search(r'\b(?:dia|dias|mes|meses|ano|anos|semanas?|horas?|vencimento|prazos?|'
                          r'antecipad\w*|prorrog\w*|posterg\w*|reinici\w*|recont\w*|anexo|quadro)\b',
                          re.sub(r'\btermino final do prazo de pagamento\b', '', s))):
            return None
        documental = ('nota fiscal' in s and re.search(
            r'emitid\w*|atest\w*|regulariz\w*|devolv\w*|desacordo|conformidade|nao efetuar|nao contiver', s))
        bancario = bool(re.search(r'\bdados bancarios\b|\bconta corrente\b', s))
        suspensao = bool(re.search(r'\bnenhum pagamento\b', s) and
                         re.search(r'\benquanto pendent\s*e de liquidacao\b', s))
        atraso = bool(re.search(r'\batraso\b', s) and 'valores devidos' in s and
                      'correcao monetaria' in s)
        if not (documental or bancario or suspensao or atraso):
            return None
    return {'estado': 'encontrado',
            'valor': {'tipo': 'outra_regra', 'data': None, 'dia': None,
                      'regra': '\n'.join(t.texto for t in grupo)},
            'evidencias': evidencias_unicas(grupo), 'confianca': 'media',
            'regra_id': 'vencimento-documental-paginado-v1',
            'motivo': 'Prazo por nota fiscal e requisitos documentais reconhecidos na mesma cláusula; '
                      'texto integral por página preservado, incluindo condições e correção por atraso. '
                      'Não foi calculada data nem transferido encargo para o prazo-base. '
                      'Reconhecimento limitado às formas suportadas, sem garantia de completude semântica.'}


def vazio(estado='nao_identificado', motivo='Nenhuma regra explícita suportada identificou o campo.', evidencias=None):
    return {'estado': estado, 'valor': None, 'evidencias': evidencias or [],
            'confianca': 'nao_aplicavel', 'regra_id': None, 'motivo': motivo}


def clausulas_valor(trecho):
    # Limita a condição ao item/cláusula, sem alterar a segmentação dos outros campos.
    # A evidência continua sendo um recorte literal da mesma página.
    for parte in re.split(r'(?im)(?=^[ \t]*(?:\d{1,3}\.\d+(?:\.\d+)*[ \t]+|cl[aá]usula\b))', trecho.texto):
        if parte.strip():
            yield Trecho(trecho.pagina, parte.strip())


def dinheiro(texto):
    return format(Decimal(texto.replace('.', '').replace(',', '.')), '.2f')


def data_iso(texto):
    dia, mes, ano = map(int, texto.split('/'))
    return date(ano, mes, dia).isoformat()


def evidencias_unicas(candidatos):
    return [dict(pagina=p, trecho=t) for p, t in dict.fromkeys(
        (c.pagina, c.texto) for c in candidatos)]


TITULO_REAJUSTE = re.compile(r'^cl[aá]usula\b[^\n]*\bdo reajuste[ \t]*$', re.I | re.M)


def titulo_reajuste_isolado(texto):
    """Reconhece só o cabeçalho inteiro; corpo/índice na mesma linha não é descartado."""
    ordinal = (r'(?:primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|sext[oa]|'
               r'setim[oa]|oitav[oa]|non[oa]|decim[oa]|vigesim[oa]|trigesim[oa]|quadragesim[oa])')
    numero = r'(?:\d+[ao]?|[ivxlcdm]+|' + ordinal + r'(?:\s+' + ordinal + r')?)'
    return bool(re.fullmatch(
        r'(?:(?:clausula|capitulo)\s+' + numero + r'\s*[-–—:.]?\s*|[ivxlcdm]+\)\s*)?'
        r'(?:do\s+)?reajustes?(?: por faixa etaria)?\s*[.:]?', texto))


def trechos_reajuste(paginas):
    """Agrupa somente cláusulas com título explícito, sem juntar páginas."""
    for pagina, texto in enumerate(paginas, 1):
        if not TITULO_REAJUSTE.search(texto):
            yield from (Trecho(pagina, t.texto) for t in trechos([texto]))
            continue
        for parte in re.split(r'(?im)(?=^[ \t]*cl[aá]usula\b)', texto):
            parte = parte.strip()
            if TITULO_REAJUSTE.match(parte):
                linhas = parte.split('\n', 1)
                if len(linhas) == 2 and linhas[1].strip():
                    yield Trecho(pagina, parte)
            else:
                yield from (Trecho(pagina, t.texto) for t in trechos([parte]))


def periodicidade_reajuste(texto):
    """Reconhece apenas períodos ligados ao reajuste por construções explícitas.

    O texto é normalizado só para busca; a regra e a evidência literais são mantidas.
    O intervalo mínimo continua qualificado na regra, pois o esquema não tem esse atributo.
    """
    ligacao = (r'(?:\s+(?:sera|serao|e|ocorrera|ocorrerao|aplicad[oa]s?|'
               r'realizad[oa]s?|feit[oa]s?|efetuad[oa]s?|permitid[oa]s?|'
               r'somente|apenas|sempre|com|desde|que|observad[oa]|respeitad[oa]|o|a))*')
    periodo = (r'(?:(?P<frequencia>anual|anuais|anualmente|mensal|mensais|mensalmente)\b|'
               r'(?:a cada|periodicidade de|interregno minimo de|intervalo minimo de)\s+'
               r'(?P<numero>\d+)' + EXTENSO + r'\s+(?P<unidade>meses|mes|anos|ano)\b)')
    padrao = r'\breajust(?:e|es|ad[oa]s?)\b' + ligacao + r'\s+' + periodo
    valores = set()
    conflito = False
    for match in re.finditer(padrao, texto):
        if match['frequencia']:
            meses = 12 if match['frequencia'].startswith('anu') else 1
        else:
            meses = int(match['numero']) * (12 if match['unidade'].startswith('ano') else 1)
        if meses <= 0:
            conflito = True
        else:
            valores.add(meses)
        # Alternativas sem repetir o sujeito não autorizam escolher o primeiro prazo.
        if re.match(r'\s*(?:ou|e)\s+(?:a cada\s+)?(?:\d|anua|mensa)', texto[match.end():]):
            conflito = True
    conflito = conflito or len(valores) > 1
    return (next(iter(valores)) if len(valores) == 1 and not conflito else None), conflito


def modalidades_reajuste(texto):
    """Menções para diagnóstico, não afirmações de aplicação nem novos campos do JSON."""
    s = normalizar(texto)
    modalidades = set()
    if not re.search(r'\breajust\w*', s):
        return modalidades
    if (periodicidade_reajuste(s)[0] == 12 or re.search(
            r'\breajustes? (?:financeir[oa]s? |contratua(?:l|is) )?anua(?:l|is)\b|'
            r'\breajuste a incidir sobre o valor da mensalidade sera anual\b', s)):
        modalidades.add('anual')
    if re.search(r'\birt\b|\breajuste tecnico\b|\bfator tecnico\b', s):
        modalidades.add('tecnico')
    if re.search(r'\bfaixas? etarias?\b|\b(?:razao|funcao|alteracao|variacao) da idade\b', s):
        modalidades.add('faixa_etaria')
    return modalidades


def negacao_reajuste(texto):
    return bool(re.search(
        r'\bsem reajuste\b|\bnao (?:havera (?:qualquer )?|sera aplicado (?:qualquer )?|'
        r'ha (?:previsao de )?|preve (?:o mecanismo de )?)reajuste\b', texto))


def ausencia_global_reajuste(trecho):
    # Só a declaração integral e sem qualificadores autoriza "sem_reajuste".
    # Um índice negado, prazo inicial ou exceção não nega os demais mecanismos.
    corpo = trecho.texto
    linhas = corpo.split('\n', 1)
    if len(linhas) == 2 and titulo_reajuste_isolado(normalizar(linhas[0])):
        corpo = linhas[1]
    return bool(re.fullmatch(
        r'(?:(?:o |este )?contrato )?(?:sem reajuste|nao havera (?:qualquer )?reajuste|'
        r'nao sera aplicado (?:qualquer )?reajuste)\.?', normalizar(corpo)))


OBJETOS_ACESSORIOS = {
    'saldo_devedor': 'saldo devedor',
    'cota_amortizacao': 'cota de amortização',
    'seguro': 'seguro',
    'tarifa': 'tarifa administrativa',
    'limite_contribuicao': 'limites de contribuição',
    'base_contribuicao': 'bases de contribuição',
}
ROTULOS_OBJETOS = {
    'prestacao': 'prestação', 'aluguel': 'aluguel', 'mensalidade': 'mensalidade',
    'contribuicao': 'contribuição', **OBJETOS_ACESSORIOS,
}


def objetos_reajuste(texto):
    """Menções de escopo, sem inferir qual verbo/índice se aplica a cada objeto.

    Um vencimento de prestação citado no reajuste do saldo também é uma menção,
    não prova de reajuste da prestação. Na dúvida a consolidação se abstém.
    """
    s = normalizar(texto)
    padroes = {
        'saldo_devedor': r'\bsaldos? deve\s*dor(?:es)?\b',
        'cota_amortizacao': r'\bcotas? de amortizacao\b',
        'seguro': r'\bseguros?\b',
        'tarifa': r'\btarifas?\b|\btaxas? (?:de administracao|administrativas?)\b|'
                  r'\b(?:manutencao de )?servicos de administracao\b|\bvmsa\b',
        'limite_contribuicao': r'\blimites? (?:minimos?|maximos?) de contribuic(?:ao|oes)\b|'
                              r'\blimites? (?:de contribuic(?:ao|oes)|das? contribuicoes|de que tratam)\b',
        'base_contribuicao': r'\bbases? de contribuic(?:ao|oes)\b|\bbases? contributivas?\b',
    }
    objetos = set()
    for objeto, padrao in padroes.items():
        if re.search(padrao, s):
            objetos.add(objeto)
            # Não contar a palavra "contribuição" da própria base/limite como
            # uma segunda obrigação. Outras menções no bloco permanecem.
            s = re.sub(padrao, ' ', s)
    for objeto, padrao in {
        'prestacao': r'\b(?:prestacoes|prestacao|parcelas?)\b',
        'aluguel': r'\b(?:aluguel|alugueis)\b',
        'mensalidade': r'\bmensalidades?\b',
        'contribuicao': r'\bcontribuic(?:ao|oes)\b',
    }.items():
        if re.search(padrao, s):
            objetos.add(objeto)
    return objetos


MESES = {nome: n for n, nome in enumerate((
    'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'), 1)}
DATA_VIGENCIA = r'(?:' + DATA + r'|\d{1,2}\s+de\s+(?:' + '|'.join(MESES) + r')\s+de\s+\d{4})'


def data_vigencia_iso(texto):
    if '/' in texto:
        return data_iso(texto)
    dia, mes, ano = re.split(r'\s+de\s+', texto)
    return date(int(ano), MESES[mes], int(dia)).isoformat()


VIGENCIA_CURSO = re.compile(
    r'\b(?:contrato|instrumento|ajuste) (?:nao )?(?:tem|tera) '
    r'(?:prazo de )?vigencia (?:equivalente ao curso\b|'
    r'ate a (?:efetiva )?conclusao (?:do curso\b|'
    r'das atividades\s*didatico[- ]pedagogicas\b))')


def trechos_vigencia(paginas):
    # Aceita títulos com ordinal colado e itens como 6.1) ou 6.5., sem
    # modificar o texto que será usado como evidência.
    titulo_curso = (r'cl[aá]u?sula(?:\b|(?=(?:primeira|segunda|terceira|quarta|quinta|'
              r'sexta|s[eé]tima|oitava|nona|d[eé]cima)[\s:–-]))')
    for pagina, texto in enumerate(paginas, 1):
        # As novas fronteiras só se aplicam às páginas com a declaração de
        # vigência por curso. Preserva a segmentação das demais modalidades.
        por_curso = bool(VIGENCIA_CURSO.search(normalizar(texto)))
        titulo = titulo_curso if por_curso else r'cl[aá]u?sula\b'
        item_numerado = r'\d{1,3}\.\d+(?:\.\d+)*' + (r'[.)]?' if por_curso else '') + r'[ \t]+'
        # Carimbo de autenticação é metadado; não é assinatura/data de início contratual.
        # O prefixo mantido ainda é substring literal da página original.
        texto = re.split(r'(?im)^\s*(?:documento assinado digitalmente\b|'
                         r'd4sign [0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\s*-\s*para\b)',
                         texto, maxsplit=1)[0]
        # Retira somente o par de linhas de autenticação no fim da página.
        # Não corta conteúdo contratual que apareça depois de uma menção semelhante.
        texto = re.sub(r'(?im)\n[ \t]*Assinado por \d+ pessoas:[^\n]*\n'
                       r'[ \t]*Para verificar a validade das assinaturas,[^\n]*\s*\Z', '', texto)
        partes = re.split(r'(?im)(?=^[ \t]*(?:' + item_numerado + '|' + titulo + '))', texto)
        # Na cláusula de duração, cada parágrafo pode tratar de um sujeito diferente
        # (contrato, beneficiário ou renovação). Não juntar essas datas num candidato.
        partes = [item for parte in partes for item in (
            re.split(r'(?im)(?=^[ \t]*par[aá]grafo\s+\w+\.)', parte)
            if re.match(r'\s*cl[aá]usula[^\n]*\bdura[çc][aã]o do contrato\b', parte, re.I)
            else [parte])]
        for parte in partes:
            if re.match(r'\s*' + titulo, parte, re.I):
                # Título sem corpo não fornece prazo. Com corpo na linha seguinte,
                # mantém o bloco literal: o título também distingue reajuste de vigência.
                linhas = parte.strip().splitlines()
                # Continuação do cabeçalho em maiúsculas não é corpo contratual.
                # Blocos inteiramente em maiúsculas ficam sem reconhecimento aqui.
                if any(any(c.islower() for c in linha) for linha in linhas[1:]):
                    yield Trecho(pagina, parte.strip())
            elif re.match(r'\s*' + item_numerado, parte):
                # Mantém frases seguintes do mesmo item, inclusive isenções e condições.
                yield Trecho(pagina, parte.strip())
            else:
                for item in trechos([parte]):
                    if not re.match(titulo, item.texto, re.I):
                        yield Trecho(pagina, item.texto)


def extrair_vigencia(paginas):
    valores = {'inicio': set(), 'fim': set(), 'duracao_meses': set()}
    provas, condicoes = [], []
    conflito = False
    indeterminado = False
    anual = False
    regras_curso = set()
    principal = False
    ligacao = r'(?:\s+(?:esta|e|sera|previsto|prevista|para|o|dia|em|no|na|data|de))*\s*:?\s*'
    inicio_contratual = r'\binicio (?:de|da) vigencia do contrato\s+dar\s*-\s*se\s*-\s*a\s+no dia\s+'
    evento_inicial = (r'da data (?:da|de) (?:assinatura (?:deste instrumento|da proposta de adesao)|'
                      r'pagamento da mensalidade)')
    primeiro_evento = (r'\ba contar ' + evento_inicial + r'(?: ou ' + evento_inicial +
                       r')+, o que ocorrer primeiro\b')
    for trecho in trechos_vigencia(paginas):
        s = trecho.normalizado
        # Vigência individual/portabilidade é uma condição, não o início do contrato.
        if re.search(r'\binicio (?:da|de) vigencia para cada um dos beneficiarios\b|'
                     r'\bna adesao do beneficiario\b.*\binicio (?:de|da) vigencia\b', s):
            condicoes.append(trecho)
            continue
        # Exige declaração sobre prazo/início do contrato. A simples coexistência
        # de "contrato" com início das aulas, assinatura ou vigência judicial não basta.
        termo = (r'(?:vigencia|prazo (?:d[oa]|de) (?:presente )?(?:contrato|locacao)'
                 r'(?: do imovel)?|prazo contratual)')
        contexto = bool(re.search(
            r'\b' + termo + r'\s+(?:(?:e|sera|esta)\s+)?'
            r'(?:de|por|com inicio|com termino|a partir|tera inicio|condicionada|se inicia|termina|inicia)\b|'
            r'\b(?:contrato|locacao|instrumento|ajuste)'
            r'(?:\s+(?:nao|se|tera|tem|esta|e|sera|o|a))*\s+'
            r'(?:inicio|inicia|iniciara|termino|termina|terminara|vigencia|vigora|vigorara|duracao|prazo)\b|'
            + inicio_contratual, s))
        # Menções à vigência em pagamento/reajuste não estabelecem o prazo contratual.
        if re.search(r'\breajust\w*|\baluguel mensal\b|\bvalor global\b', s):
            continue
        condicao = re.search(r'\b(?:prorrog\w*|renov\w*|rescind\w*|rescis\w*|permanecer\b|permanencia\b|aviso previo|antes do (?:final|fim)|apos o vencimento|novo contrato)', s)
        relacionada = bool(re.search(r'\b(?:contrato|locacao|imovel|locatario|locador)\b', s))
        if condicao and relacionada:
            if contexto:
                condicoes.append(trecho)
            else:
                # Uma condição acessória em um subitem não torna os demais
                # subitens da cláusula parte da vigência. Só separa listas cujo
                # prefixo é um título sem condição: uma introdução pode definir
                # hipóteses ou requisitos que dependem de todos os subitens.
                itens = re.split(r'(?m)(?=^[ \t]*[a-z]\)[ \t]+)', trecho.texto)
                prefixo = itens[0].strip()
                if (len(itens) == 1 or
                        not re.fullmatch(r'cl[aá]u?sula\b[^\n]+', prefixo, re.I) or
                        re.search(condicao.re, normalizar(prefixo)) or
                        re.search(r'\b(?:nesta|desta|dessa) clausula\b|\b(?:itens|subitens|paragrafos) anteriores\b', s)):
                    condicoes.append(trecho)
                    continue
                for item in itens:
                    candidato = Trecho(trecho.pagina, item.strip())
                    if (re.search(condicao.re, candidato.normalizado) and
                            re.search(r'\b(?:contrato|locacao|imovel|locatario|locador)\b', candidato.normalizado)):
                        condicoes.append(candidato)
        if not contexto:
            continue
        # Datas de uma extensão possível ficam no texto, não substituem o prazo inicial.
        base = s[:condicao.start()] if condicao else s
        datas = list(re.finditer(DATA_VIGENCIA, base))
        associados = set()
        novos = {k: [] for k in valores}
        try:
            for intervalo in re.finditer('(' + DATA_VIGENCIA + r')\s*(?:a|ate)\s*(' + DATA_VIGENCIA + ')', base):
                novos['inicio'].append(data_vigencia_iso(intervalo[1]))
                novos['fim'].append(data_vigencia_iso(intervalo[2]))
                associados.update(d.span() for d in datas if intervalo.start() <= d.start() < intervalo.end())
            for match in re.finditer(inicio_contratual + '(' + DATA_VIGENCIA + ')', base):
                novos['inicio'].append(data_vigencia_iso(match[1]))
                associados.add(match.span(1))
            for campo, ancora in (('inicio', r'\b(?:inicio|inicia|iniciara|a partir|vigencia)'),
                                   ('fim', r'\b(?:termino|termina|terminara|fim|encerra|encerrara)')):
                for match in re.finditer(ancora + ligacao + '(' + DATA_VIGENCIA + ')', base):
                    novos[campo].append(data_vigencia_iso(match[1]))
                    associados.add(match.span(1))
            minimo = False
            for duracao in re.finditer(r'\b(?:vigencia|prazo(?: (?:d[oa]|de) (?:presente )?(?:contrato|locacao)| contratual)?)\s+(?:e\s+)?(?P<minimo>minim[oa]\s+)?(?:de|por)\s+(?P<meses>\d+)' + EXTENSO + r'\s+meses\b', base):
                if int(duracao['meses']) <= 0:
                    raise ValueError('Duração inválida')
                novos['duracao_meses'].append(int(duracao['meses']))
                minimo = minimo or bool(duracao['minimo'])
            if any(d.span() not in associados for d in datas):
                raise ValueError('Data sem associação explícita')
            evento = bool(re.search(
                r'\b(?:inicio|inicia|iniciara|vigora|vigorara|a partir)'
                r'(?:\s+(?:na|no|em|a|da|do|de|data|efetiva))*\s+(?:assinatura|posse)\b|'
                r'\bvigencia (?:e |sera )?condicionada a (?:assinatura|posse)\b', base))
            indef = bool(re.search(r'\bindeterminado\b', base))
            duracao_anual = bool(re.search(r'\b(?:contrato|instrumento|ajuste) (?:nao )?(?:tem|tera) duracao anual\b', base))
            curso = bool(VIGENCIA_CURSO.search(base))
            tem_valor = any(novos.values()) or indef or evento or duracao_anual or curso
            if curso and LACUNA.search(s):
                raise ValueError('Condição do curso incompleta')
            lacuna_prazo = bool(re.search(r'(?<![\w:/])/\s+/(?!\d)|\(\s*\)\s*meses\b', base))
            # Apenas esta lista explícita de eventos com critério de precedência é
            # aceita. Outros "ou", inclusive alternativas de duração, continuam bloqueados.
            base_sem_eventos = re.sub(primeiro_evento, '', base)
            if LACUNA.search(base) or lacuna_prazo or (tem_valor and re.search(r'\bnao\b|\bou\b', base_sem_eventos)):
                raise ValueError('Prazo incompleto, negado ou alternativo')
            if tem_valor:
                principal = True
                provas.append(trecho)
                for campo in valores:
                    valores[campo].update(novos[campo])
                indeterminado = indeterminado or indef
                anual = anual or duracao_anual
                if curso:
                    # Regras distintas não são conciliadas por proximidade. Nem o
                    # curso nem a conclusão autorizam converter o prazo em meses.
                    regras_curso.add(base)
                if curso or evento or duracao_anual or minimo or re.search(primeiro_evento, base):
                    condicoes.append(trecho)
        except ValueError:
            conflito = True
            provas.append(trecho)
    evidencias = evidencias_unicas(provas + condicoes)
    conflito = conflito or any(len(v) > 1 for v in valores.values())
    inicio = next(iter(valores['inicio']), None)
    fim = next(iter(valores['fim']), None)
    duracao = next(iter(valores['duracao_meses']), None)
    conflito = conflito or bool(inicio and fim and fim < inicio) or bool(indeterminado and (fim or duracao or anual))
    conflito = conflito or len(regras_curso) > 1 or bool(regras_curso and (fim or duracao or anual or indeterminado))
    if conflito:
        return vazio('ambiguo', 'Datas ou prazos conflitantes, inválidos ou sem associação segura; exige revisão.', evidencias)
    if not principal:
        return vazio(motivo='Prazo principal não identificado; avisos e prorrogações não o substituem.', evidencias=evidencias)
    regra = '\n'.join(e['trecho'] for e in evidencias) if condicoes else None
    return {'estado': 'encontrado', 'valor': {
        'prazo': 'indeterminado' if indeterminado else 'determinado' if fim or duracao or anual else 'nao_informado',
        'inicio': inicio, 'fim': fim, 'duracao_meses': duracao, 'regra': regra},
        'evidencias': evidencias, 'confianca': 'media', 'regra_id': 'vigencia-curso-evento-v1' if regras_curso else 'vigencia-explicita-v2',
        'motivo': 'Datas e condições explícitas reunidas sem calcular início, fim ou duração ausentes; requer revisão humana.'}


def condicao_financiamento_por_fase(texto):
    """Preserva cobrança por fase/evento sem confundir cálculo de juros com vencimento.

    O texto já vem normalizado. Mesmo prazo inválido ou em branco deve permanecer
    pendente; reconhecer a condição não autoriza usar a data de liberação.
    """
    if (not re.search(r'\bcarencia\b', texto) or
            re.search(r'\b(?:multa|mora|moratorios|seguro|cobertura)\b|vencimento antecipado', texto)):
        return False
    primeira_por_evento = (
        re.search(r'\bpr\s*imeira prestacao de juros(?: remuneratorios)?\b', texto) and
        re.search(r'\bpag[ao]\b[^.;]{0,100}\bdias? apos a liberacao (?:do credito|dos recursos)\b', texto))
    exigibilidade_por_fase = (
        re.search(r'\bamortizacao\b', texto) and
        re.search(r'\b(?:principal|juros|prestacoes|prestacao)\b', texto) and
        re.search(r'\bexigiv(?:el|eis)\b', texto) and
        re.search(r'\b(?:mensalmente|trimestralmente|semestralmente|anualmente)\b', texto))
    return bool(primeira_por_evento or exigibilidade_por_fase)


def extrair_campos(paginas):
    candidatos = {nome: [] for nome in CAMPOS}
    pendentes = {nome: [] for nome in CAMPOS}
    reajustes_ambiguos = []
    condicoes_vencimento = []
    divergencias_valor = []
    extensos_valor_pendentes = []

    def add(nome, valor, trecho, regra):
        candidatos[nome].append((valor, trecho, regra))

    def pendente(nome, trecho):
        pendentes[nome].append(trecho)

    for trecho in trechos(paginas):
        s = trecho.normalizado
        lacuna = bool(LACUNA.search(s))
        encargo = bool(re.search(ENCARGOS, s))
        condicional = bool(re.search(r'\b(?:se|caso|podera|opcao|opcoes|desconto|alternativamente)\b|a vista ou', s))

        # Valor exige associação direta a parcela/aluguel/mensalidade, nunca divisão do total.
        sujeito = r'\b(?:aluguel(?:\s+mensal)?(?:\s+do imovel)?|mensalidade|locacao do imovel (?:o |no )?valor mensal|(?:valor (?:da|de cada) )?(?:parcela|prestacao)(?:\s+mensal)?)'
        for item_valor in clausulas_valor(trecho):
            sv = item_valor.normalizado
            repeticoes = []
            if re.search(r'\bparcelad\w*\b', sv):
                repeticoes = list(re.finditer(r'\b[1-9]\d*\s*x' + EXTENSO + r'\s+de\s+' + MOEDA, sv))
            if not repeticoes and not re.search(r'\b(?:aluguel|mensalidade|parcela|prestacao)s?\b|\blocacao do imovel\b', sv):
                continue
            valores = []
            for moeda in (MOEDA, MOEDA_RS):
                valores += list(re.finditer(sujeito + r'\s*(?:e|sera|no valor|no importe|no valor fixo|:|de|no valor de|e de|sera de|mensal de|de valor)?\s*' + moeda, sv))
                valores += list(re.finditer(r'\b\d+' + EXTENSO + r'\s+parcelas?\s+(?:mensais\s+)?(?:e\s+iguais\s+)?de\s+' + moeda, sv))
            # Parcelar uma taxa de adesão/matrícula não a torna mensalidade.
            taxa = r'\btaxa de (?:adesao|matricula)(?:\s+(?:parcelad[ao]s?|em|de))*\s*$'
            tinha_candidato = bool(valores or repeticoes)
            valores = [m for m in valores if not re.search(taxa, sv[:m.start()])]
            repeticoes = [m for m in repeticoes if not re.search(taxa, sv[:m.start()])]
            if tinha_candidato and not valores and not repeticoes:
                continue
            # A notação Nx serve só para apontar divergência; não amplia a
            # extração de valores nem converte adesão/entrada em mensalidade.
            problemas_extenso = set()
            for valor_conferido in valores + repeticoes:
                prefixo = sv[:valor_conferido.start()]
                if re.search(r'\b(?:total|global|entrada|caucao)(?:\s+(?:d[oa]|de|para|referente|a|ao|pel[oa]))*\s*$', prefixo):
                    continue
                estado_extenso = conferir_extenso(sv, valor_conferido.end('quantia'), dinheiro(valor_conferido['quantia']))
                if estado_extenso == 'divergente':
                    divergencias_valor.append(item_valor)
                    problemas_extenso.add(estado_extenso)
                elif estado_extenso == 'nao_suportado':
                    extensos_valor_pendentes.append(item_valor)
                    problemas_extenso.add(estado_extenso)
            if problemas_extenso:
                pendente('valor_parcela', item_valor)
                continue
            texto_restricoes = sv
            if len(valores) == 1 and valores[0].group().startswith('locacao do imovel'):
                # Esta ressalva mantém o valor base até reajuste futuro. Só a forma
                # completa e terminal é dispensada da checagem de negação/condição.
                # A evidência literal inteira continua preservada, sem reescrita.
                ressalva = (r'(?P<complemento>(?:\s*\([^)]{1,160}\))?)\s*,\s*nao podendo este ser alterado '
                            r'durante a vigencia do contrato,\s*salvo os casos de reajustes '
                            r'anua\s*is previstos neste instrumento\.?')
                ressalva_encontrada = re.fullmatch(ressalva, sv[valores[0].end():])
                if ressalva_encontrada:
                    texto_restricoes = sv[:valores[0].end()] + ressalva_encontrada['complemento']
            restricao = (LACUNA.search(sv) or re.search(ENCARGOS, sv) or
                         re.search(r'\b(?:se|caso|podera|opcao|opcoes|desconto|alternativamente|nao|primeira|ultima|iniciais|restantes|demais)\b|a vista ou', texto_restricoes))
            if valores and restricao:
                pendente('valor_parcela', item_valor)
            elif valores:
                for m in valores:
                    # Um total ou uma entrada diretamente associados ao aluguel não são parcela.
                    prefixo = sv[:m.start()]
                    if re.search(r'\b(?:total|global|entrada|caucao)(?:\s+(?:d[oa]|de|para|referente|a|ao|pel[oa]))*\s*$', prefixo):
                        pendente('valor_parcela', item_valor)
                        continue
                    regra = 'valor-locacao-mensal-v1' if m.group().startswith('locacao do imovel') else 'valor-direto-v2'
                    add('valor_parcela', {'tipo': 'fixo', 'moeda': 'BRL', 'quantia': dinheiro(m['quantia']), 'regra': None}, item_valor, regra)
            elif re.search(sujeito + r'.{0,35}(?:r\$|rs\b)', sv):
                pendente('valor_parcela', item_valor)

        # Contagens expressas. Prazo de vigência nunca vira número de parcelas.
        for m in re.finditer(r'\b(?P<n>\d+)' + EXTENSO + r'\s+parcelas?(?!\w)', s):
            if encargo:
                continue
            if lacuna or condicional or re.search(r'\b(?:primeiras|ultimas|restantes|demais|ate|maximo|minimo)\b', s) or int(m['n']) == 0:
                pendente('numero_parcelas', trecho)
            else:
                add('numero_parcelas', {'tipo': 'determinado', 'quantidade': int(m['n'])}, trecho, 'quantidade-explicita-v1')
        if re.search(r'numero de parcelas\s*(?:e|:)?\s*indeterminado', s):
            add('numero_parcelas', {'tipo': 'indeterminado', 'quantidade': None}, trecho, 'quantidade-indeterminada-v1')

        # Vencimento precisa estar associado ao pagamento, não ao término contratual.
        # A seleção de uma exceção não resolve o cronograma. Preservar regras
        # complementares ainda não consolidadas, mesmo com juros no mesmo trecho.
        # Não usar números de cláusulas, calendário ou quadro externo para completar.
        cronograma_carencia = (
            re.search(r'\bprazo de (?:carencia|amortizacao)\b', s) and
            re.search(r'\bcarencia\b', s) and
            re.search(r'\bvencendo\s*-\s*se a primeira\b[^.;]*\bdia\b', s))
        ajuste_dia_util = (
            re.search(r'\bvencimento de (?:prestacao|parcela) de amortizacao\b', s) and
            re.search(r'\b(?:sabados|domingos|feriados)\b', s) and
            re.search(r'\b(?:deslocado|prorrogado) para o primeiro dia util subsequente\b', s))
        condicao_pendente = bool(cronograma_carencia or ajuste_dia_util or condicao_financiamento_por_fase(s))
        if condicao_pendente:
            condicoes_vencimento.append(trecho)
            pendente('data_vencimento', trecho)
        pagamento_mensal = bool(re.search(r'\bpag[ao]s?\s+mensalmente\s+(?:ate|em|no|todo)\b', s))
        pagamento = pagamento_mensal or bool(re.search(r'\b(?:vencimento|vencem|vencera)\b|\bpag[ao]s?\s+(?:ate|em|no|todo)\b', s))
        termino = bool(re.search(r'vencimento (?:d[oa] (?:presente )?(?:contrato|locacao)|antecipado)', s))
        # Não transformar uma obrigação mensal explicitamente negada em vencimento.
        pagamento_negado = pagamento_mensal and bool(re.search(r'\bnao\b', s))
        inicio_prazo = (r'\b(?:pagamentos?(?: devidos)?(?: sera(?:o)?)? '
                        r'(?:efetuad[oa]s?|realizad[oa]s?)|pag[ao]s?) '
                        r'(?:no prazo de|em) ')
        # "Após o vencimento" não é um prazo contado em dias. Exige ligação
        # local com pagamento, mas ainda encaminha prazos malformados à abstenção.
        por_evento = bool(re.search(inicio_prazo + r'[^.;]{1,80}?\bdias?'
                                   r'(?: uteis| corridos)? (?:apos|a contar d[oa]|a partir d[oa])\b', s))
        if condicao_pendente:
            # O bloco inteiro permanece como evidência; não extrair um dia isolado dele.
            pass
        elif por_evento:
            # Prazo precisa estar ligado ao pagamento e a um evento reconhecido.
            # Não usar números de outras obrigações nem calcular datas a partir dele.
            padrao = (inicio_prazo + r'(?P<dias>\d+)' + EXTENSO +
                      r' dias?(?: uteis| corridos)? '
                      r'(?:apos (?:o |a )?|a contar d[oa] |a partir d[oa] )'
                      r'(?:protocolo|recebimento|apresentacao) da nota fiscal\b')
            prazos = list(re.finditer(padrao, s))
            if not encargo and not termino:
                invalido = (lacuna or re.search(r'\bnao\b', s) or len(prazos) != 1 or
                            any(int(m['dias']) <= 0 for m in prazos))
                try:
                    for d in re.findall(DATA, s):
                        data_iso(d)
                except ValueError:
                    invalido = True
                if invalido:
                    pendente('data_vencimento', trecho)
                else:
                    add('data_vencimento', {'tipo': 'outra_regra', 'data': None, 'dia': None,
                                           'regra': trecho.texto}, trecho, 'vencimento-evento-v1')
        elif pagamento and not encargo and not termino and not pagamento_negado:
            mensal = list(re.finditer(r'(?:todo(?:s os)?\s+(?:os\s+)?dia(?:s)?|dia(?:s)?)\s*(\d{1,2})' + EXTENSO + r'(?:\s+de cada mes)?', s))
            mensal = [m for m in mensal if ('todo' in m.group() or re.search(r'de cada mes|mensal', s))]
            datas = re.findall(DATA, s)
            especial = bool(re.search(r'dia(?:s)?\s+ute(?:is|l)|dia\s+util|\d+[oºª]?\s+dia\s+util|apos|subsequente|mes (?:seguinte|posterior)|primeira|ultima|antecipad|prorrog|posterg|se\s+', s))
            # Dias expressos continuam válidos mesmo quando preservados como regra literal.
            dias_expressos = re.findall(r'\bdia\s+(\d+)(?![\d/])', s)
            dias_expressos += re.findall(r'\b(\d+)[oºª®]' + EXTENSO + r'\s+dia\b', s)
            dia_invalido = any(not 1 <= int(d) <= 31 for d in dias_expressos)
            if lacuna or dia_invalido:
                pendente('data_vencimento', trecho)
            elif especial and (dias_expressos or re.search(
                    r'(?:vencimento\s*(?:em|:|no dia)?\s*|pag[ao]s?\s+(?:ate|em|no dia)\s*)' + DATA, s)):
                try:
                    for d in datas:
                        data_iso(d)
                    add('data_vencimento', {'tipo': 'outra_regra', 'data': None, 'dia': None, 'regra': trecho.texto}, trecho, 'vencimento-condicional-v2')
                except ValueError:
                    pendente('data_vencimento', trecho)
            elif mensal:
                for m in mensal:
                    dia = int(m[1])
                    if 1 <= dia <= 31:
                        add('data_vencimento', {'tipo': 'mensal', 'data': None, 'dia': dia, 'regra': None}, trecho, 'vencimento-mensal-v1')
                    else:
                        pendente('data_vencimento', trecho)
            elif re.search(r'vencimento\s*(?:em|:|no dia)?\s*' + DATA, s):
                for d in datas:
                    try:
                        add('data_vencimento', {'tipo': 'data_unica', 'data': data_iso(d), 'dia': None, 'regra': None}, trecho, 'vencimento-data-v1')
                    except ValueError:
                        pendente('data_vencimento', trecho)

    # Uma resposta local não cobre condições que continuam em outra página.
    # Guardar todos os fragmentos da cláusula, sem presumir sua consolidação.
    grupos_clausulas = list(clausulas_por_pagina(paginas))
    pagamentos_continuados = []
    grupos_pagamento = []
    for grupo in grupos_clausulas:
        cabecalho = normalizar(grupo[0].texto.splitlines()[0])
        if (re.search(r':\s*(?:da forma de pagamento|do pagamento|dos pagamentos|'
                      r'das condicoes de pagamento)\s*$', cabecalho) and
                len({t.pagina for t in grupo}) > 1):
            pagamentos_continuados.extend(grupo)
            grupos_pagamento.append(grupo)
    pagamento_consolidado = consolidar_pagamento_documental(
        grupos_pagamento, candidatos['data_vencimento'], pendentes['data_vencimento'], condicoes_vencimento)
    pendentes['data_vencimento'].extend(pagamentos_continuados)

    revisoes_excepcionais = []
    # Cláusulas inteiras conservam requisitos em frases/subitens posteriores.
    # Fora de títulos reconhecidos, manter ao menos o trecho financeiro detectado.
    for grupo in grupos_clausulas:
        if any(revisao_excepcional(t.normalizado) for t in grupo):
            revisoes_excepcionais.extend(grupo)
    for pagina, texto in enumerate(paginas, 1):
        # Só aplicar a segmentação genérica fora das cláusulas já delimitadas.
        # Um recorte genérico pode atravessar títulos após ponto e vírgula.
        inicios = [texto.find(t.texto) for grupo in grupos_clausulas for t in grupo
                   if t.pagina == pagina]
        livre = texto[:min(inicios)] if inicios else texto
        for trecho in trechos([livre]):
            if revisao_excepcional(trecho.normalizado):
                revisoes_excepcionais.append(Trecho(pagina, trecho.texto))
    pendentes['regra_reajuste'].extend(revisoes_excepcionais)

    referencias_reajuste = []
    blocos_reajuste = list(trechos_reajuste(paginas))
    tem_clausula_reajuste = any(TITULO_REAJUSTE.match(t.texto) for t in blocos_reajuste)
    for trecho in blocos_reajuste:
        s = trecho.normalizado
        if titulo_reajuste_isolado(s):
            continue
        lacuna = bool(LACUNA.search(s))
        encargo = bool(re.search(ENCARGOS, s))
        condicional = bool(re.search(r'\b(?:se|caso|podera|opcao|opcoes|desconto|alternativamente)\b|a vista ou', s))
        # Uma remissão anual explícita complementa a cláusula principal. Não descarta
        # candidatos com índices ou períodos próprios, que podem ser conflitantes.
        if (tem_clausula_reajuste and len(re.findall(r'\breajust\w*', s)) == 1 and
                not re.search(r'\b(?:ipca|igp|inpc|ivar)\b|%', s) and
                re.search(r', nao podendo este ser alterado durante a vigencia do contrato,\s*'
                          r'salvo os casos de reajustes anua\s*is previstos neste instrumento\.?$', s)):
            referencias_reajuste.append(trecho)
            continue
        # Reajuste periódico, distinguindo correção por atraso. Cláusula literal preservada.
        if re.search(r'\breajust\w*', s) and not encargo:
            if lacuna:
                pendente('regra_reajuste', trecho)
                continue
            # O esquema descreve a obrigação principal, não seus componentes.
            # Não promover índice/taxa de saldo, seguro ou base a regra geral.
            # Preservar o bloco integral: a associação interna ainda não é resolvida.
            if objetos_reajuste(s).intersection(OBJETOS_ACESSORIOS):
                pendente('regra_reajuste', trecho)
                continue
            valor = {'tipo': 'outra_regra', 'indices': [], 'percentual': None, 'periodicidade_meses': None, 'regra': trecho.texto}
            valor['periodicidade_meses'], conflito_periodo = periodicidade_reajuste(s)
            if TITULO_REAJUSTE.match(trecho.texto):
                # Dentro da cláusula de reajuste, este conector liga o interregno
                # ao reajuste, mesmo com índice e condições entre os dois.
                periodos = {valor['periodicidade_meses']} - {None}
                for intervalo in re.finditer(r'desde que (?:seja )?observado o '
                                            r'(?:interregno|intervalo) mini\s*mo de ([^.;]+)', s):
                    meses, conflito = periodicidade_reajuste('reajuste com intervalo minimo de ' + intervalo[1])
                    conflito_periodo = conflito_periodo or conflito or meses is None
                    if meses is not None:
                        periodos.add(meses)
                conflito_periodo = conflito_periodo or len(periodos) > 1
                valor['periodicidade_meses'] = next(iter(periodos)) if len(periodos) == 1 else None
            if conflito_periodo:
                reajustes_ambiguos.append(trecho)
                continue
            valor['indices'] = indices_reajuste(s)
            indice_reconhecido = bool(valor['indices'])
            percentual = re.findall(r'(?<![\d.,])(\d+(?:,\d+)?)\s*%', s)
            # Uma sigla conhecida não representa sozinha uma fórmula composta.
            # O esquema não modela componentes técnicos: manter a regra literal,
            # inclusive quando há uma negação restrita a esse componente.
            soma = bool(re.search(r'\+|\b(?:somad[oa]s? (?:a[os]?|ao)|'
                                  r'acrescid[oa]s? de|mais (?:o |a )?(?:fator|indice))\b', s))
            modalidades = modalidades_reajuste(s)
            tecnico = 'tecnico' in modalidades
            etario = 'faixa_etaria' in modalidades
            negacao = negacao_reajuste(s)
            ausencia_global = ausencia_global_reajuste(trecho)
            negacao_restrita = negacao and not ausencia_global
            limite_percentual = bool(percentual and re.search(
                r'\b(?:sinistralidade|teto|limitad[oa]|limite|meta|gatilho)\b', s))
            regra_complexa = soma or tecnico or limite_percentual or etario or negacao_restrita
            # A idade é um evento, não uma frequência. Em blocos mistos, o prazo
            # anual não pode ser atribuído também ao reajuste por faixa etária.
            if etario or negacao_restrita:
                valor['periodicidade_meses'] = None
            if (TITULO_REAJUSTE.match(trecho.texto) and len(valor['indices']) > 1 and
                    not soma and
                    not re.search(r'\bou\b|substitut\w*|ausencia|insubsistencia', s)):
                reajustes_ambiguos.append(trecho)
                continue
            if regra_complexa:
                valor['indices'] = []
            elif ausencia_global:
                valor.update(tipo='sem_reajuste', indices=[], periodicidade_meses=None)
            elif valor['indices'] and not percentual:
                valor['tipo'] = 'indice'
                valor['indices'].sort()
            elif len(percentual) == 1 and not valor['indices'] and not condicional and re.fullmatch(r'\d+(?:,\d{1,2})?', percentual[0]):
                valor.update(tipo='percentual_fixo', percentual=format(Decimal(percentual[0].replace(',', '.')), '.2f'))
            else:
                valor['indices'] = []
            # Remissões sem critério permanecem pendentes. A cláusula de destino
            # não é resolvida por proximidade nem vinculada a qualquer outro índice.
            remissao = bool(re.search(
                r'conforme (?:o )?(?:quadro|anexo)|definid[oa] no|campo \d|'
                r'\b(?:conforme|previst[oa]s? n[oa]|estabelecid[oa]s? n[oa]|nos termos d[oa])'
                r'\s+(?:a |o )?(?:clausula|anexo|quadro)\b', s))
            garantia = bool(re.search(r'\bgarantia fiduciaria\b', s))
            criterio = indice_reconhecido or bool(percentual) or soma
            if (remissao or garantia) and not criterio:
                pendente('regra_reajuste', trecho)
            else:
                regra = 'reajuste-modalidades-v3' if etario or negacao_restrita else 'reajuste-clausula-v2'
                add('regra_reajuste', valor, trecho, regra)

    if referencias_reajuste:
        itens_reajuste = candidatos['regra_reajuste']
        for valor, _, _ in itens_reajuste:
            if valor['tipo'] == 'sem_reajuste' or valor['periodicidade_meses'] not in (None, 12):
                reajustes_ambiguos.extend(referencias_reajuste)
        # Só consolida quando há um único candidato principal e nenhum conflito.
        if len(itens_reajuste) == 1 and not reajustes_ambiguos and not pendentes['regra_reajuste']:
            valor, principal, regra = itens_reajuste[0]
            valor['regra'] = '\n'.join([principal.texto] + [t.texto for t in referencias_reajuste])
        elif not itens_reajuste:
            pendentes['regra_reajuste'].extend(referencias_reajuste)

    reajuste_consolidado = consolidar_reajuste_e_revisao(
        candidatos['regra_reajuste'], revisoes_excepcionais, pendentes['regra_reajuste'],
        referencias_reajuste, reajustes_ambiguos)

    opcoes_escolares = analisar_opcoes(paginas)
    campos_opcoes = ('valor_parcela', 'numero_parcelas', 'data_vencimento')
    for opcao in opcoes_escolares:
        for evidencia_opcao in opcao['evidencias']:
            trecho_opcao = Trecho(evidencia_opcao['pagina'], evidencia_opcao['trecho'])
            for campo_opcao in campos_opcoes:
                pendentes[campo_opcao].append(trecho_opcao)

    resultado = {}
    for nome in CAMPOS:
        itens = candidatos[nome]
        evidencia = evidencias_unicas([i[1] for i in itens] + pendentes[nome])
        if nome == 'regra_reajuste':
            evidencia = evidencias_unicas([i[1] for i in itens] + pendentes[nome] + referencias_reajuste)
        distintos = {json.dumps(v, sort_keys=True, ensure_ascii=False) for v, _, _ in itens}
        objetos = set()
        if nome == 'regra_reajuste':
            evidencia = evidencias_unicas([i[1] for i in itens] + pendentes[nome] + referencias_reajuste + reajustes_ambiguos)
            objetos = set().union(*(objetos_reajuste(e['trecho']) for e in evidencia))
        if nome == 'valor_parcela' and divergencias_valor:
            resultado[nome] = vazio('ambiguo',
                'Valor numérico e valor por extenso divergem na parcela ou mensalidade; '
                'nenhum deles foi escolhido. Taxas e totais não substituem a prestação.',
                evidencias_unicas([i[1] for i in itens] + pendentes[nome] + divergencias_valor))
        elif nome == 'valor_parcela' and extensos_valor_pendentes:
            resultado[nome] = vazio('ambiguo' if itens else 'nao_identificado',
                'Valor por extenso incompleto ou fora das formas suportadas; '
                'a correspondência com o número não foi confirmada. Isso não comprova divergência.',
                evidencias_unicas([i[1] for i in itens] + pendentes[nome] + extensos_valor_pendentes))
        elif nome in campos_opcoes and opcoes_escolares:
            motivo = ('Há alternativas de pagamento ou preços por perfil escolar ainda não vinculados '
                      'a um plano confirmado. Matrícula, parcelas e vencimentos são preservados '
                      'nas evidências, sem escolher uma opção ou reconstruir calendário.')
            estados_tabela = {opcao['tabela']['estado'] for opcao in opcoes_escolares}
            if 'incompleta_ou_inconsistente' in estados_tabela:
                motivo += ' Há tabela incompleta ou inconsistente no formato suportado.'
            elif 'formato_conferido' in estados_tabela:
                motivo += ' O formato da tabela foi conferido; isso não confirma a escolha do plano ou a correção contratual.'
            resultado[nome] = vazio('ambiguo', motivo, evidencia)
        elif nome == 'regra_reajuste' and objetos.intersection(OBJETOS_ACESSORIOS):
            nomes = ', '.join(rotulo for objeto, rotulo in ROTULOS_OBJETOS.items() if objeto in objetos)
            estado = 'ambiguo' if len(objetos) > 1 or itens or reajustes_ambiguos else 'nao_identificado'
            motivo = ('Há menções a objetos de reajuste (' + nomes + '); os critérios não foram associados '
                      'à obrigação principal. Exige revisão, sem transferir índice, taxa ou período entre objetos.')
            modalidades = set().union(*(modalidades_reajuste(e['trecho']) for e in evidencia))
            if len(modalidades) > 1:
                rotulos = {'anual': 'anual', 'tecnico': 'técnico', 'faixa_etaria': 'faixa etária'}
                motivo += ' Modalidades mencionadas: ' + ', '.join(rotulos[m] for m in rotulos if m in modalidades) + '.'
            resultado[nome] = vazio(estado, motivo, evidencia)
        elif nome == 'regra_reajuste' and reajustes_ambiguos:
            evidencia = evidencias_unicas([i[1] for i in itens] + pendentes[nome] + reajustes_ambiguos)
            resultado[nome] = vazio('ambiguo', 'Periodicidades de reajuste concorrentes ou inválidas; exige revisão.', evidencia)
        elif nome == 'regra_reajuste' and reajuste_consolidado:
            resultado[nome] = reajuste_consolidado
        elif nome == 'regra_reajuste' and revisoes_excepcionais:
            resultado[nome] = vazio('ambiguo' if itens else 'nao_identificado',
                'Há revisão excepcional de preços não consolidada com o reajuste periódico; '
                'condições preservadas sem transferir índice ou periodicidade entre modalidades.', evidencia)
        elif nome == 'data_vencimento' and pagamento_consolidado:
            resultado[nome] = pagamento_consolidado
        elif nome == 'data_vencimento' and pagamentos_continuados:
            resultado[nome] = vazio('ambiguo' if itens else 'nao_identificado',
                'A cláusula de pagamento tem continuação em outra página; prazos e condições '
                'foram preservados, mas ainda não consolidados em um vencimento completo.', evidencia)
        elif nome == 'data_vencimento' and itens and condicoes_vencimento:
            resultado[nome] = vazio('ambiguo', 'Regra parcial: há condições de carência, amortização ou dia útil não consolidadas; exige revisão do cronograma.', evidencia)
        elif nome == 'data_vencimento' and condicoes_vencimento:
            resultado[nome] = vazio(motivo='Há condições de cronograma por carência, amortização ou dia útil, mas não foi estabelecido um vencimento completo; exige revisão dos prazos e eventos contratuais.', evidencias=evidencia)
        elif len(distintos) > 1 or (itens and pendentes[nome]):
            motivo = 'Há candidatos concorrentes ou informação relacionada que a regra não resolveu.'
            if nome == 'regra_reajuste':
                modalidades = set().union(*(modalidades_reajuste(e['trecho']) for e in evidencia))
                if len(modalidades) > 1:
                    rotulos = {'anual': 'anual', 'tecnico': 'técnico', 'faixa_etaria': 'faixa etária'}
                    nomes = ', '.join(rotulos[m] for m in rotulos if m in modalidades)
                    motivo = ('Há menções a modalidades de reajuste (' + nomes + ') e condições não consolidadas; '
                              'exige revisão. Isso não comprova contradição entre as cláusulas.')
            resultado[nome] = vazio('ambiguo', motivo, evidencia)
        elif itens:
            valor, _, regra = itens[0]
            resultado[nome] = {'estado': 'encontrado', 'valor': valor, 'evidencias': evidencia,
                               'confianca': 'media', 'regra_id': regra,
                               'motivo': 'Associação explícita reconhecida por regra local; requer revisão humana de contexto e completude.'}
        else:
            resultado[nome] = vazio(motivo='Informação ausente, com lacunas ou fora das formas suportadas; não foi inferida.', evidencias=evidencia)
    resultado['vigencia'] = extrair_vigencia(paginas)
    return resultado
