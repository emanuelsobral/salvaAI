"""Conferência local e restrita de quantias em português, sem inferência."""
import re
from decimal import Decimal
import unicodedata


UNIDADES = dict(zip(
    'zero um dois tres quatro cinco seis sete oito nove dez onze doze treze catorze quinze dezesseis dezessete dezoito dezenove'.split(),
    range(20)))
UNIDADES['quatorze'] = 14
DEZENAS = dict(zip('vinte trinta quarenta cinquenta sessenta setenta oitenta noventa'.split(), range(20, 100, 10)))
CENTENAS = dict(zip('cento duzentos trezentos quatrocentos quinhentos seiscentos setecentos oitocentos novecentos'.split(), range(100, 1000, 100)))
VOCABULARIO = set(UNIDADES) | set(DEZENAS) | set(CENTENAS) | {'cem', 'mil', 'milhao', 'milhoes', 'bilhao', 'bilhoes'}


def normalizar(texto):
    texto = ''.join(c for c in unicodedata.normalize('NFKD', texto) if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', texto.replace(',', ' ')).strip().lower()


def grupo_inteiro(texto):
    if texto in UNIDADES:
        return UNIDADES[texto]
    if texto in DEZENAS:
        return DEZENAS[texto]
    if texto == 'cem':
        return 100
    if texto in CENTENAS and texto != 'cento':
        return CENTENAS[texto]
    primeiro, separador, resto = texto.partition(' e ')
    if separador and primeiro in DEZENAS and 1 <= UNIDADES.get(resto, -1) <= 9:
        return DEZENAS[primeiro] + UNIDADES[resto]
    if separador and primeiro in CENTENAS:
        sufixo = grupo_inteiro(resto)
        if sufixo is not None and 0 < sufixo < 100:
            return CENTENAS[primeiro] + sufixo
    return None


def inteiro_por_extenso(texto):
    partes = re.split(r'\bmil\b', texto)
    if len(partes) == 1:
        return grupo_inteiro(texto)
    if len(partes) != 2:
        return None
    esquerda, direita = (p.strip() for p in partes)
    milhares = grupo_inteiro(esquerda) if esquerda else 1
    if milhares is None or not 1 <= milhares <= 999:
        return None
    if not direita:
        return milhares * 1000
    if direita.startswith('e '):
        direita = direita[2:]
    resto = grupo_inteiro(direita)
    return milhares * 1000 + resto if resto is not None and 0 < resto < 1000 else None


def dinheiro_por_extenso(texto):
    """Retorna Decimal só para reais até 999.999 e centavos entre 0 e 99."""
    texto = normalizar(texto)
    partes = re.fullmatch(r'(.+?) (real|reais)(?: e (.+?) (centavo|centavos))?', texto)
    if partes:
        reais = inteiro_por_extenso(partes[1])
        centavos = grupo_inteiro(partes[3]) if partes[3] else 0
        if reais is None or centavos is None or not 0 <= centavos <= 99:
            return None
        if (partes[2] == 'real') != (reais == 1):
            return None
        if partes[3] and (partes[4] == 'centavo') != (centavos == 1):
            return None
        return Decimal(reais) + Decimal(centavos) / 100
    partes = re.fullmatch(r'(.+?) (centavo|centavos)', texto)
    if partes:
        centavos = grupo_inteiro(partes[1])
        if centavos is not None and 0 <= centavos <= 99 and (partes[2] == 'centavo') == (centavos == 1):
            return Decimal(centavos) / 100
    return None


def conferir_extenso(texto, fim_quantia, quantia):
    """Compara apenas o parêntese adjacente, sem buscar valores de outro objeto."""
    restante = texto[fim_quantia:]
    if not re.match(r'\s*\(', restante):
        return None
    parenteses = re.match(r'\s*\(([^)]{0,240})\)', restante)
    conteudo = parenteses[1] if parenteses else restante[:250]
    palavras = set(re.findall(r'\w+', normalizar(conteudo)))
    if not palavras.intersection(VOCABULARIO) and not re.search(r'\d', conteudo):
        return None  # Comentário descritivo, sem numeral reconhecível.
    valor = dinheiro_por_extenso(conteudo) if parenteses else None
    if valor is None:
        return 'nao_suportado'
    return 'compativel' if valor == Decimal(quantia) else 'divergente'
