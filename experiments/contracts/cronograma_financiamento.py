"""Diagnóstico auxiliar de condições de pagamento; não monta um calendário."""
import re

from extenso import inteiro_por_extenso
from regras import trechos


def analisar_cronograma(paginas):
    """Classifica apenas formas explícitas, sem selecionar fases ou resolver remissões.

    As condições continuam separadas mesmo quando parecem complementares. A
    presença de uma categoria não confirma que todas as cláusulas foram lidas.
    """
    condicoes = []
    for trecho in trechos(paginas):
        s = trecho.normalizado
        # Exceções de cobrança e cobertura não definem o fluxo contratual normal.
        if re.search(r'vencimento antecipado|\b(?:seguro|cobertura|inadimplencia)\b', s):
            continue
        ajuste = bool(
            re.search(r'vencimento de (?:prestacao|parcela) de amortizacao', s) and
            re.search(r'\b(?:sabados|domingos|feriados)\b', s) and
            re.search(r'(?:deslocado|prorrogado) para o primeiro dia util subsequente', s))
        if re.search(r'\b(?:multa|mora|moratorios)\b', s) and not ajuste:
            continue
        pagamento = bool(re.search(
            r'\b(?:prestacoes|prestacao|parcelas|parcela|juros|principal)\b', s) and
            re.search(r'\b(?:venc\w*|pag[ao]s?|exigivel|exigiveis)\b', s))
        categorias = []
        sem_carencia = bool(re.search(r'\b(?:caso nao haja|nao havendo|sem) carencia\b', s))
        if pagamento and sem_carencia:
            categorias.append('sem_carencia')
        if pagamento and re.search(r'\bcarencia\b', s) and not sem_carencia:
            categorias.append('carencia')
        if pagamento and re.search(r'\bamortizacao\b', s) and not ajuste:
            categorias.append('amortizacao')
        if ajuste:
            categorias.append('ajuste_dia_util')
        if not categorias:
            continue

        eventos = []
        for evento, padrao in (
            ('liberacao_recursos', r'\bliberacao (?:do credito|dos recursos)\b'),
            ('emissao', r'\bemissao\b'),
            ('termino_carencia', r'\b(?:termino|fim) (?:da carencia|do prazo de carencia)\b'),
        ):
            if re.search(padrao, s):
                eventos.append(evento)

        periodicidades = []
        # Só vincula frequência à fase adjacente em cláusula de exigibilidade.
        # Frequência de cálculo/capitalização não é frequência de pagamento.
        if re.search(r'\bexigiv(?:el|eis)\b', s) and not re.search(
                r'\b(?:nao|exceto|salvo)\b', s):
            for m in re.finditer(
                r'\b(mensalmente|trimestralmente|semestralmente|anualmente),? '
                r'durante (?:o prazo de |o periodo de |a )?(carencia|amortizacao)\b', s
            ):
                cobranca = list(re.finditer(r'\bexigiv(?:el|eis)\b', s[:m.start()]))
                if not cobranca or re.search(r'\b(?:calcul\w*|capitaliz\w*)\b', s[cobranca[-1].end():m.start()]):
                    continue
                item = {'fase': m[2], 'meses': {
                    'mensalmente': 1, 'trimestralmente': 3,
                    'semestralmente': 6, 'anualmente': 12,
                }[m[1]]}
                if item not in periodicidades:
                    periodicidades.append(item)

        prazos = []
        if ('carencia' in categorias and re.search(r'\bpr\s*imeira prestacao de juros\b', s)
                and not re.search(r'\b(?:nao|exceto|salvo)\b', s)):
            for m in re.finditer(
                r'\b(?:paga|pago) (?:pela emitente |pelo emitente )?(?:em |no prazo de )?'
                r'(\d{1,4})(?:\s*\(([^)]{1,60})\))? '
                r'dias apos a liberacao (?:do credito|dos recursos)\b', s
            ):
                if 1 <= int(m[1]) <= 366 and (m[2] is None or inteiro_por_extenso(m[2].strip()) == int(m[1])):
                    prazos.append({'dias': int(m[1]), 'evento': 'liberacao_recursos'})

        dependencias = ['associacao_entre_condicoes_nao_resolvida']
        dependencias.extend('data_' + evento + '_nao_resolvida' for evento in eventos)
        if re.search(r'\bquadro\b', s):
            dependencias.append('quadro_referenciado_nao_resolvido')
        if sem_carencia:
            dependencias.append('aplicabilidade_sem_carencia_nao_resolvida')
        if ajuste:
            dependencias.append('calendario_de_dias_uteis_nao_resolvido')
        condicoes.append({
            'id': 'condicao-' + str(len(condicoes) + 1),
            'categorias': categorias, 'eventos_referidos': eventos,
            'periodicidades_por_fase': periodicidades, 'prazos_relativos': prazos,
            'dependencias': dependencias, 'evidencias': [trecho.evidencia()],
        })
    return {
        'tipo': 'diagnostico_cronograma_financiamento', 'versao_diagnostico': '1.0.0',
        'estado': 'condicoes_identificadas' if condicoes else 'nao_identificado',
        'completude': 'nao_avaliada', 'calendario_gerado': False, 'condicoes': condicoes,
    }


def criar_diagnostico(registro, paginas):
    """Só analisa PDFs integralmente processados e vincula a saída ao seu hash."""
    if registro['processamento']['status'] == 'concluido':
        diagnostico = analisar_cronograma(paginas)
    else:
        diagnostico = {
            'tipo': 'diagnostico_cronograma_financiamento', 'versao_diagnostico': '1.0.0',
            'estado': 'nao_executado_leitura_incompleta', 'completude': 'nao_avaliada',
            'calendario_gerado': False, 'condicoes': [],
        }
    return {
        'diagnostico_auxiliar': True, 'documento_id': registro['documento_id'],
        'pdf_sha256': registro['pdf_sha256'], 'versao_extrator': registro['versao_extrator'],
        **diagnostico,
    }


def verificar_diagnostico(diagnostico, paginas):
    for condicao in diagnostico['condicoes']:
        for evidencia in condicao['evidencias']:
            numero = evidencia['pagina']
            if not 1 <= numero <= len(paginas) or evidencia['trecho'] not in paginas[numero - 1]:
                raise ValueError('Evidência do cronograma não pertence à página informada')
