import regras_0125
import json, random, re, argparse
from datetime import date
from pathlib import Path
MODELOS_DIR = Path(__file__).resolve().parent / "modelos_base"
UNIDADES = {
    0: "zero", 1: "um", 2: "dois", 3: "três", 4: "quatro", 5: "cinco",
    6: "seis", 7: "sete", 8: "oito", 9: "nove", 10: "dez",
    11: "onze", 12: "doze", 13: "treze", 14: "quatorze", 15: "quinze",
    16: "dezesseis", 17: "dezessete", 18: "dezoito", 19: "dezenove",
}

DEZENAS = {
    20: "vinte", 30: "trinta", 40: "quarenta", 50: "cinquenta",
    60: "sessenta", 70: "setenta", 80: "oitenta", 90: "noventa",
}

CENTENAS = {
    100: "cento", 200: "duzentos", 300: "trezentos", 400: "quatrocentos",
    500: "quinhentos", 600: "seiscentos", 700: "setecentos", 800: "oitocentos", 900: "novecentos",
}

def int_extenso(n):
    if n == 0:
        return "zero"
    if n == 100:
        return "cem"
    partes = []
    if n >= 1000:
        mil = n // 1000
        resto = n % 1000
        partes.append("mil" if mil == 1 else f"{int_extenso(mil)} mil")
        if resto:
            partes.append(int_extenso(resto))
        return " e ".join(partes)
    if n >= 100:
        c = (n // 100) * 100
        resto = n % 100
        partes.append(CENTENAS[c])
        if resto:
            partes.append(int_extenso(resto))
        return " e ".join(partes)
    if n >= 20:
        d = (n // 10) * 10
        u = n % 10
        partes.append(DEZENAS[d])
        if u:
            partes.append(UNIDADES[u])
        return " e ".join(partes)
    return UNIDADES[n]

def brl_format(quantia_centavos):
    reais = quantia_centavos // 100
    centavos = quantia_centavos % 100
    s_reais = f"{reais:,}".replace(",", ".")
    return f"{s_reais},{centavos:02d}"

def brl_iso(quantia_centavos):
    return f"{quantia_centavos // 100}.{quantia_centavos % 100:02d}"

def brl_extenso(quantia_centavos):
    reais = quantia_centavos // 100
    centavos = quantia_centavos % 100
    texto = f"{int_extenso(reais)} reais"
    if centavos:
        texto += f" e {int_extenso(centavos)} centavos"
    return texto

def add_months(d, m):
    y = d.year + (d.month - 1 + m) // 12
    mo = (d.month - 1 + m) % 12 + 1
    return date(y, mo, d.day)

def campo_gabarito(estado, valor=None, evidencias=None, motivo="Gabarito automático de geração sintética a partir de modelo público."):
    return {
        "estado": estado,
        "valor": valor,
        "evidencias": evidencias or [],
        "confianca": "nao_aplicavel",
        "regra_id": None,
        "motivo": motivo,
    }

def criar_registro_gabarito(doc_id, campos):
    return {
        "protocolo_versao": "1.0.0",
        "esquema_versao": "1.0.0",
        "tipo_registro": "exemplo_gabarito",
        "documento_id": doc_id,
        "pdf_sha256": None,
        "versao_extrator": None,
        "anotacao": {
            "anotador_id": "GERADOR-SINTETICO-SEED-20261103",
            "revisor_id": None,
            "estado_revisao": "revisao_unica",
            "data": "2026-11-03",
        },
        "processamento": {
            "status": "nao_executado",
            "duracao_ms": None,
            "erros": [],
        },
        "campos": campos,
    }

def criar_registro_extracao(doc_id, campos):
    return {
        "protocolo_versao": "1.0.0",
        "esquema_versao": "1.0.0",
        "tipo_registro": "exemplo_extracao",
        "documento_id": doc_id,
        "pdf_sha256": None,
        "versao_extrator": None,
        "anotacao": None,
        "processamento": {
            "status": "nao_executado",
            "duracao_ms": None,
            "erros": [],
        },
        "campos": campos,
    }

def load_pages(doc_id):
    return json.loads((MODELOS_DIR / f"{doc_id}-paginas.json").read_text(encoding="utf-8"))

def gerar_s1_alu01(idx, rng, preenchido=True):
    pages = load_pages("alu-01")
    doc_id = f"sint-s1-alu01-{idx:02d}"
    if not preenchido:
        campos = {
            "valor_parcela": campo_gabarito("ausente", motivo="Lacuna de valor mantida em branco no controle sintético (alu-01)."),
            "numero_parcelas": campo_gabarito("ausente", motivo="Modelo alu-01 não prevê número explícito de parcelas."),
            "data_vencimento": campo_gabarito("ausente", motivo="Lacuna de dia de vencimento mantida em branco no controle sintético (alu-01)."),
            "vigencia": campo_gabarito("ausente", motivo="Lacunas de prazo, início e término mantidas em branco no controle sintético (alu-01)."),
            "regra_reajuste": campo_gabarito("ausente", motivo="Modelo alu-01 não possui cláusula de reajuste."),
        }
        return doc_id, "aluguel", pages, campos, {"estrato": "S1", "modelo_base": "alu-01", "modo": "controle_em_branco"}

    quantia_c = rng.choice([125000, 150000, 185000, 210000, 245000])
    dia_venc = rng.choice([5, 10, 15, 20, 25])
    duracao = rng.choice([12, 24, 30, 36])
    mes_ini = rng.choice([1, 2, 3, 4, 5, 6])
    dt_ini = date(2026, mes_ini, 1)
    dt_fim = add_months(dt_ini, duracao)
    ini_br = dt_ini.strftime("%d/%m/%Y")
    fim_br = dt_fim.strftime("%d/%m/%Y")
    q_br = brl_format(quantia_c)
    q_ext = brl_extenso(quantia_c)
    d_ext = int_extenso(dia_venc)
    dur_ext = int_extenso(duracao)

    p0 = pages[0]
    p0 = re.sub(
        r"Este Contrato vigorará pelo prazo disposto de\s+\(\s+\)\s+meses, tendo início em\s+/\s+/\s+, término previsto \npara o dia\s+/\s+/\s+e,",
        f"Este Contrato vigorará pelo prazo disposto de {duracao} ({dur_ext}) meses, tendo início em {ini_br}, término previsto \npara o dia {fim_br} e,",
        p0,
    )
    p0 = re.sub(
        r"Pagará o LOCATÁRIO ao LOCADOR, título de aluguel, o valor mensal de R\$\s+",
        f"Pagará o LOCATÁRIO ao LOCADOR, título de aluguel, o valor mensal de R$ {q_br} ({q_ext}).\n",
        p0,
    )
    p0 = re.sub(
        r"Os aluguéis serão pagos todo dia\s+\(\s+\) de cada mês,",
        f"Os aluguéis serão pagos todo dia {dia_venc} ({d_ext}) de cada mês,",
        p0,
    )
    novas_paginas = [p0, pages[1]]

    trecho_val = f"Pagará o LOCATÁRIO ao LOCADOR, título de aluguel, o valor mensal de R$ {q_br} ({q_ext})."
    trecho_venc = f"Os aluguéis serão pagos todo dia {dia_venc} ({d_ext}) de cada mês, efetivando-se por seguintes dados:"
    trecho_vig = (
        f"Este Contrato vigorará pelo prazo disposto de {duracao} ({dur_ext}) meses, tendo início em {ini_br}, "
        f"término previsto para o dia {fim_br}"
    )

    campos = {
        "valor_parcela": campo_gabarito(
            "presente",
            {"tipo": "fixo", "moeda": "BRL", "quantia": brl_iso(quantia_c), "regra": None},
            [{"pagina": 1, "trecho": trecho_val}],
        ),
        "numero_parcelas": campo_gabarito("ausente", motivo="Modelo alu-01 define prazo em meses sem número de parcelas."),
        "data_vencimento": campo_gabarito(
            "presente",
            {"tipo": "mensal", "data": None, "dia": dia_venc, "regra": None},
            [{"pagina": 1, "trecho": trecho_venc}],
        ),
        "vigencia": campo_gabarito(
            "presente",
            {
                "prazo": "determinado",
                "inicio": dt_ini.isoformat(),
                "fim": dt_fim.isoformat(),
                "duracao_meses": duracao,
                "regra": trecho_vig,
            },
            [{"pagina": 1, "trecho": trecho_vig}],
        ),
        "regra_reajuste": campo_gabarito("ausente", motivo="Modelo alu-01 não possui cláusula de reajuste."),
    }
    return doc_id, "aluguel", novas_paginas, campos, {
        "estrato": "S1", "modelo_base": "alu-01", "modo": "preenchido_estrito",
        "valor_parcela": brl_iso(quantia_c), "dia_vencimento": dia_venc,
        "duracao_meses": duracao, "inicio": dt_ini.isoformat(), "fim": dt_fim.isoformat(),
    }

def gerar_s1_alu02(idx, rng, preenchido=True):
    pages = load_pages("alu-02")
    doc_id = f"sint-s1-alu02-{idx:02d}"
    trecho_venc_fixo = (
        "Parágrafo único – O pagamento será realizado mensalmente, até o dia 10 (dez), \n"
        "mediante boleto bancário emitido pelo Administrador com acréscimo da respectiva tarifa \n"
        "bancária."
    )
    trecho_reaj_fixo = (
        "CLÁUSULA TERCEIRA – O aluguel avençado entre Locador e Locatário na cláusula \n"
        "anterior sofrerá reajuste anual, de acordo com índice oficial do IGPM/FGV, ou na sua falta ou \n"
        "extinção, de acordo com o valor de mercado de alugueis de imóveis semelhantes ao ora \n"
        "locado, será aplicado somente se o índice escolhido apresentar valor positivo, na hipótese \n"
        "desse índice apresentar negativo, manter-se ao valor do aluguel."
    )
    if not preenchido:
        campos = {
            "valor_parcela": campo_gabarito("ausente", motivo="Campo 04 do Quadro Resumo mantido com asteriscos no controle sintético (alu-02)."),
            "numero_parcelas": campo_gabarito("ausente", motivo="Modelo alu-02 não prevê número explícito de parcelas."),
            "data_vencimento": campo_gabarito(
                "presente",
                {"tipo": "mensal", "data": None, "dia": 10, "regra": None},
                [{"pagina": 2, "trecho": trecho_venc_fixo}],
            ),
            "vigencia": campo_gabarito("ausente", motivo="Campo 05 do Quadro Resumo mantido com asteriscos no controle sintético (alu-02)."),
            "regra_reajuste": campo_gabarito(
                "presente",
                {"tipo": "indice", "indices": ["IGP-M"], "percentual": None, "periodicidade_meses": 12, "regra": trecho_reaj_fixo},
                [{"pagina": 2, "trecho": trecho_reaj_fixo}],
            ),
        }
        return doc_id, "aluguel", pages, campos, {"estrato": "S1", "modelo_base": "alu-02", "modo": "controle_em_branco"}

    quantia_c = rng.choice([160000, 195000, 230000, 275000])
    duracao = rng.choice([12, 24, 30, 36])
    mes_ini = rng.choice([1, 3, 5, 7])
    dt_ini = date(2026, mes_ini, 10)
    dt_fim = add_months(dt_ini, duracao)
    q_br = brl_format(quantia_c)
    ini_br = dt_ini.strftime("%d/%m/%Y")
    fim_br = dt_fim.strftime("%d/%m/%Y")

    p0 = pages[0]
    p0 = p0.replace("4 – VALOR DO ALUGUEL    \nR$ ***************", f"4 – VALOR DO ALUGUEL    \nR$ {q_br}")
    p0 = p0.replace(
        "5 – PRAZO DE VIGÊNCIA CONTRATUAL \nPrazo        - ****** \nInicio        - ****** \nTérmino -   ******",
        f"5 – PRAZO DE VIGÊNCIA CONTRATUAL \nPrazo        - {duracao} meses \nInicio        - {ini_br} \nTérmino -   {fim_br}",
    )
    novas_paginas = [p0] + pages[1:]
    trecho_vig = f"5 – PRAZO DE VIGÊNCIA CONTRATUAL Prazo - {duracao} meses Inicio - {ini_br} Término - {fim_br}"

    campos = {
        "valor_parcela": campo_gabarito(
            "presente",
            {"tipo": "fixo", "moeda": "BRL", "quantia": brl_iso(quantia_c), "regra": None},
            [{"pagina": 1, "trecho": f"4 – VALOR DO ALUGUEL R$ {q_br}"}],
        ),
        "numero_parcelas": campo_gabarito("ausente", motivo="Modelo alu-02 define prazo em meses no Quadro Resumo sem quantidade de parcelas."),
        "data_vencimento": campo_gabarito(
            "presente",
            {"tipo": "mensal", "data": None, "dia": 10, "regra": None},
            [{"pagina": 2, "trecho": trecho_venc_fixo}],
        ),
        "vigencia": campo_gabarito(
            "presente",
            {"prazo": "determinado", "inicio": dt_ini.isoformat(), "fim": dt_fim.isoformat(), "duracao_meses": duracao, "regra": trecho_vig},
            [{"pagina": 1, "trecho": trecho_vig}],
        ),
        "regra_reajuste": campo_gabarito(
            "presente",
            {"tipo": "indice", "indices": ["IGP-M"], "percentual": None, "periodicidade_meses": 12, "regra": trecho_reaj_fixo},
            [{"pagina": 2, "trecho": trecho_reaj_fixo}],
        ),
    }
    return doc_id, "aluguel", novas_paginas, campos, {
        "estrato": "S1", "modelo_base": "alu-02", "modo": "preenchido_estrito",
        "valor_parcela": brl_iso(quantia_c), "dia_vencimento": 10,
        "duracao_meses": duracao, "inicio": dt_ini.isoformat(), "fim": dt_fim.isoformat(),
    }

def gerar_s1_edu01(idx, rng, preenchido=True):
    pages = load_pages("edu-01")
    doc_id = f"sint-s1-edu01-{idx:02d}"
    vig_base = regras_0125.extrair_campos(pages)["vigencia"]
    trecho_vig_fixo = vig_base["valor"]["regra"]
    evid_vig_fixo = vig_base["evidencias"]
    trecho_reaj_fixo = "reajustado conforme edital para os anos subsequentes."
    if not preenchido:
        campos = {
            "valor_parcela": campo_gabarito("ausente", motivo="Placeholders <#VALOR_ANUIDADE#> e <#VALOR_MATRICULA#> não preenchidos no controle sintético (edu-01)."),
            "numero_parcelas": campo_gabarito("ausente", motivo="Placeholder <#PARCELA_QTD_EXT#> não preenchido no controle sintético (edu-01)."),
            "data_vencimento": campo_gabarito("ausente", motivo="Placeholder <#PARCELA_DIA_VCTO#> não preenchido no controle sintético (edu-01)."),
            "vigencia": campo_gabarito(
                "presente",
                {"prazo": "determinado", "inicio": None, "fim": None, "duracao_meses": None, "regra": trecho_vig_fixo},
                evid_vig_fixo,
            ),
            "regra_reajuste": campo_gabarito(
                "presente",
                {"tipo": "outra_regra", "indices": [], "percentual": None, "periodicidade_meses": 12, "regra": trecho_reaj_fixo},
                [{"pagina": 1, "trecho": trecho_reaj_fixo}],
            ),
        }
        return doc_id, "educacao", pages, campos, {"estrato": "S1", "modelo_base": "edu-01", "modo": "controle_em_branco"}

    mensal_c = rng.choice([98000, 115000, 132000, 148000])
    qtd_parc = 12
    anuidade_c = mensal_c * qtd_parc
    dia_venc = rng.choice([5, 8, 10, 15])

    p0 = pages[0]
    p0 = p0.replace("<#MATRICULA 2026#>", "2026")
    p0 = p0.replace("<#VALOR_ANUIDADE#>", brl_format(anuidade_c))
    p0 = p0.replace("<#VALOR_ANUIDADE_EXT#>", brl_extenso(anuidade_c))
    p0 = p0.replace("<#VALOR_MATRICULA#>", brl_format(mensal_c))
    p0 = p0.replace("<#11 \n(onze) #> (<#PARCELA_QTD_EXT#>)", f"{qtd_parc} ({int_extenso(qtd_parc)})")
    p0 = p0.replace("<#PARCELA_DIA_VCTO#>", str(dia_venc))
    novas_paginas = [p0] + pages[1:]

    trecho_item4 = (
        f"A título de plano de pagamento alternativo, nos termos da legislação correlata, poderá ser paga "
        f"a quantia de R$ {brl_format(mensal_c)}, sendo o saldo restante da anuidade subdividido em "
        f"{qtd_parc} ({int_extenso(qtd_parc)}) parcelas. VENCIMENTO DAS PARCELAS:  Dia {dia_venc} de cada mês."
    )
    campos = {
        "valor_parcela": campo_gabarito(
            "presente",
            {"tipo": "fixo", "moeda": "BRL", "quantia": brl_iso(mensal_c), "regra": None},
            [{"pagina": 1, "trecho": trecho_item4}],
        ),
        "numero_parcelas": campo_gabarito(
            "presente",
            {"tipo": "determinado", "quantidade": qtd_parc},
            [{"pagina": 1, "trecho": trecho_item4}],
        ),
        "data_vencimento": campo_gabarito(
            "presente",
            {"tipo": "mensal", "data": None, "dia": dia_venc, "regra": None},
            [{"pagina": 1, "trecho": f"VENCIMENTO DAS PARCELAS:  Dia {dia_venc} de cada mês."}],
        ),
        "vigencia": campo_gabarito(
            "presente",
            {"prazo": "determinado", "inicio": None, "fim": None, "duracao_meses": None, "regra": trecho_vig_fixo},
            evid_vig_fixo,
        ),
        "regra_reajuste": campo_gabarito(
            "presente",
            {"tipo": "outra_regra", "indices": [], "percentual": None, "periodicidade_meses": 12, "regra": trecho_reaj_fixo},
            [{"pagina": 1, "trecho": trecho_reaj_fixo}],
        ),
    }
    return doc_id, "educacao", novas_paginas, campos, {
        "estrato": "S1", "modelo_base": "edu-01", "modo": "preenchido_estrito",
        "valor_parcela": brl_iso(mensal_c), "numero_parcelas": qtd_parc, "dia_vencimento": dia_venc,
    }

def gerar_s1_fin01(idx, rng, preenchido=True):
    pages = load_pages("fin-01")
    doc_id = f"sint-s1-fin01-{idx:02d}"
    if not preenchido:
        campos = {
            "valor_parcela": campo_gabarito("ausente", motivo="Item 7 do Quadro Resumo em branco no controle sintético (fin-01)."),
            "numero_parcelas": campo_gabarito("ausente", motivo="Item 6 do Quadro Resumo em branco no controle sintético (fin-01)."),
            "data_vencimento": campo_gabarito("ausente", motivo="Item 6 do Quadro Resumo em branco no controle sintético (fin-01)."),
            "vigencia": campo_gabarito("ausente", motivo="Item 6 do Quadro Resumo em branco no controle sintético (fin-01)."),
            "regra_reajuste": campo_gabarito("ambiguo", motivo="Cláusulas 2ª, 3ª, 5ª e 6ª preveem reajustes distintos para saldo devedor, prestação, seguro e tarifa VMSA."),
        }
        return doc_id, "financiamento", pages, campos, {"estrato": "S1", "modelo_base": "fin-01", "modo": "controle_em_branco"}

    encargo_c = rng.choice([285000, 342000, 415000, 489000])
    prazo_m = rng.choice([120, 180, 240, 360])
    dia_venc = rng.choice([5, 10, 15, 25])
    dt_prim = date(2026, rng.choice([2, 3, 4, 5]), dia_venc)
    prim_br = dt_prim.strftime("%d/%m/%Y")
    enc_br = brl_format(encargo_c)

    p1 = pages[1]
    p1 = p1.replace("Prazo de amortização              meses", f"Prazo de amortização              {prazo_m} meses")
    p1 = p1.replace(
        "Data de vencimento da primeira prestação                    /        /",
        f"Data de vencimento da primeira prestação                    {prim_br}",
    )
    p1 = p1.replace(
        "Dia do mês designado para vencimento das prestações e reajustamento do saldo devedor ",
        f"Dia do mês designado para vencimento das prestações e reajustamento do saldo devedor {dia_venc}",
    )
    p2 = pages[2].replace("Valor total do Encargo Mensal       R$ ", f"Valor total do Encargo Mensal       R$ {enc_br}")
    novas_paginas = [pages[0], p1, p2] + pages[3:]

    campos = {
        "valor_parcela": campo_gabarito(
            "presente",
            {"tipo": "fixo", "moeda": "BRL", "quantia": brl_iso(encargo_c), "regra": None},
            [{"pagina": 3, "trecho": f"Valor total do Encargo Mensal       R$ {enc_br}"}],
        ),
        "numero_parcelas": campo_gabarito(
            "presente",
            {"tipo": "determinado", "quantidade": prazo_m},
            [{"pagina": 2, "trecho": f"Prazo de amortização              {prazo_m} meses"}],
        ),
        "data_vencimento": campo_gabarito(
            "presente",
            {"tipo": "mensal", "data": None, "dia": dia_venc, "regra": None},
            [{"pagina": 2, "trecho": f"Dia do mês designado para vencimento das prestações e reajustamento do saldo devedor {dia_venc}"}],
        ),
        "vigencia": campo_gabarito(
            "presente",
            {"prazo": "determinado", "inicio": None, "fim": None, "duracao_meses": prazo_m, "regra": f"Prazo de amortização {prazo_m} meses"},
            [{"pagina": 2, "trecho": f"Prazo de amortização              {prazo_m} meses"}],
        ),
        "regra_reajuste": campo_gabarito(
            "ambiguo",
            motivo="Cláusulas 2ª, 3ª, 5ª e 6ª preveem reajustes distintos para saldo devedor, prestação, seguro e tarifa VMSA.",
        ),
    }
    return doc_id, "financiamento", novas_paginas, campos, {
        "estrato": "S1", "modelo_base": "fin-01", "modo": "preenchido_estrito",
        "valor_parcela": brl_iso(encargo_c), "numero_parcelas": prazo_m, "dia_vencimento": dia_venc,
    }

def gerar_s1_sau01(idx, rng, preenchido=True):
    pages = load_pages("sau-01")
    doc_id = f"sint-s1-sau01-{idx:02d}"
    vig_base = regras_0125.extrair_campos(pages)["vigencia"]
    trecho_vig_fixo = vig_base["valor"]["regra"]
    evid_vig_fixo = vig_base["evidencias"]
    if not preenchido:
        campos = {
            "valor_parcela": campo_gabarito("ausente", motivo="Tabela de mensalidade do Anexo II sem valor preenchido no controle sintético (sau-01)."),
            "numero_parcelas": campo_gabarito("ausente", motivo="Contrato de plano de saúde continuado sem número fixo de parcelas."),
            "data_vencimento": campo_gabarito("ausente", motivo="Campo Dia de vencimento da mensalidade do Anexo II em branco no controle sintético (sau-01)."),
            "vigencia": campo_gabarito(
                "presente",
                {"prazo": "determinado", "inicio": None, "fim": None, "duracao_meses": 12, "regra": trecho_vig_fixo},
                evid_vig_fixo,
            ),
            "regra_reajuste": campo_gabarito("ambiguo", motivo="Cláusulas 11ª e 12ª combinam reajuste anual financeiro ANS e reajuste por mudança de faixa etária."),
        }
        return doc_id, "saude", pages, campos, {"estrato": "S1", "modelo_base": "sau-01", "modo": "controle_em_branco"}

    mensal_c = rng.choice([45000, 58000, 69000, 82000])
    dia_venc = rng.choice([5, 10, 15, 20, 25])
    dt_ini = date(2026, rng.choice([1, 2, 3, 4]), 1)
    ini_br = dt_ini.strftime("%d/%m/%Y")
    mensal_br = brl_format(mensal_c)

    novas_paginas = list(pages)
    novas_paginas[29] = novas_paginas[29].replace(
        "Dia de vencimento da mensalidade:  ",
        f"Dia de vencimento da mensalidade: {dia_venc} ",
    ).replace(
        "0 a 18 anos de idade 0,00%",
        f"0 a 18 anos de idade R$ {mensal_br} 0,00%",
    )
    novas_paginas[30] = novas_paginas[30].replace(
        "Data Inicial de Vigência: ",
        f"Data Inicial de Vigência: {ini_br}",
    )

    campos = {
        "valor_parcela": campo_gabarito(
            "presente",
            {"tipo": "fixo", "moeda": "BRL", "quantia": brl_iso(mensal_c), "regra": None},
            [{"pagina": 30, "trecho": f"0 a 18 anos de idade R$ {mensal_br} 0,00%"}],
        ),
        "numero_parcelas": campo_gabarito("ausente", motivo="Contrato de plano de saúde continuado sem número determinado de parcelas."),
        "data_vencimento": campo_gabarito(
            "presente",
            {"tipo": "mensal", "data": None, "dia": dia_venc, "regra": None},
            [{"pagina": 30, "trecho": f"Dia de vencimento da mensalidade: {dia_venc}"}],
        ),
        "vigencia": campo_gabarito(
            "presente",
            {"prazo": "determinado", "inicio": dt_ini.isoformat(), "fim": None, "duracao_meses": 12, "regra": trecho_vig_fixo},
            [{"pagina": 31, "trecho": f"Prazo Mínimo de Vigência Contratual: 12 (doze) meses; Data Inicial de Vigência: {ini_br}"}],
        ),
        "regra_reajuste": campo_gabarito("ambiguo", motivo="Cláusulas 11ª e 12ª combinam reajuste anual financeiro ANS e reajuste por mudança de faixa etária."),
    }
    return doc_id, "saude", novas_paginas, campos, {
        "estrato": "S1", "modelo_base": "sau-01", "modo": "preenchido_estrito",
        "valor_parcela": brl_iso(mensal_c), "dia_vencimento": dia_venc, "inicio": dt_ini.isoformat(),
    }

def gerar_s2_canonico(idx, categoria, modelo_base, rng, preenchido=True, tolerancia_1cent=False):
    doc_id = f"sint-s2-{modelo_base.replace('-', '')}-{idx:02d}"
    cabecalho = f"INSTRUMENTO CONTRATUAL SINTÉTICO DERIVADO DO MODELO PÚBLICO {modelo_base.upper()} — CATEGORIA {categoria.upper()}\n"
    if not preenchido:
        pagina = (
            cabecalho
            + "CLÁUSULA PRIMEIRA - DO VALOR: O valor mensal será de R$ ________.\n"
            + "CLÁUSULA SEGUNDA - DAS PARCELAS: O pagamento será dividido em ___ parcelas.\n"
            + "CLÁUSULA TERCEIRA - DO VENCIMENTO: O vencimento ocorrerá todo dia ___ de cada mês.\n"
            + "CLÁUSULA QUARTA - DA VIGÊNCIA: O prazo de vigência será de ___ meses, de __/__/____ a __/__/____.\n"
            + "CLÁUSULA QUINTA - DO REAJUSTE: O reajuste ocorrerá conforme índice a definir: ______.\n"
        )
        campos = {
            c: campo_gabarito("ausente", motivo=f"Cláusula mantida com lacuna em branco no controle sintético canônico ({doc_id}).")
            for c in ["valor_parcela", "numero_parcelas", "data_vencimento", "vigencia", "regra_reajuste"]
        }
        return doc_id, categoria, [pagina], campos, {"estrato": "S2", "modelo_base": modelo_base, "modo": "controle_em_branco"}

    quantia_c = rng.choice([89000, 125000, 178050, 235000, 310000, 420000])
    qtd_parc = rng.choice([12, 24, 36, 48])
    dia_venc = rng.choice([5, 10, 15, 20, 25])
    duracao = qtd_parc
    mes_ini = rng.choice([1, 2, 3, 4, 5, 6])
    dt_ini = date(2026, mes_ini, 1)
    dt_fim = add_months(dt_ini, duracao)
    ini_br = dt_ini.strftime("%d/%m/%Y")
    fim_br = dt_fim.strftime("%d/%m/%Y")
    indice = rng.choice(["IPCA", "IGP-M", "INPC"])

    q_br = brl_format(quantia_c)
    # Se tolerancia_1cent=True, o gabarito registra +1 centavo para exercitar a comparação tolerante vs exata
    quantia_gab_c = quantia_c + (1 if tolerancia_1cent else 0)

    sujeito_map = {
        "aluguel": "O aluguel mensal",
        "educacao": "A mensalidade",
        "financiamento": "A prestação mensal",
        "saude": "A mensalidade",
    }
    suj = sujeito_map[categoria]

    l_val = f"{suj} é de R$ {q_br} ({brl_extenso(quantia_c)})."
    l_parc = f"Serão devidas {qtd_parc} ({int_extenso(qtd_parc)}) parcelas mensais."
    l_venc = f"O vencimento ocorrerá todo dia {dia_venc} de cada mês."
    l_vig = f"A vigência é de {ini_br} a {fim_br}, pelo prazo de {duracao} meses."
    l_reaj = f"O valor será reajustado a cada 12 meses pelo {indice}."

    pagina = "\n\n".join([cabecalho.strip(), l_val, l_parc, l_venc, l_vig, l_reaj])

    campos = {
        "valor_parcela": campo_gabarito(
            "presente",
            {"tipo": "fixo", "moeda": "BRL", "quantia": brl_iso(quantia_gab_c), "regra": None},
            [{"pagina": 1, "trecho": l_val}],
        ),
        "numero_parcelas": campo_gabarito(
            "presente",
            {"tipo": "determinado", "quantidade": qtd_parc},
            [{"pagina": 1, "trecho": l_parc}],
        ),
        "data_vencimento": campo_gabarito(
            "presente",
            {"tipo": "mensal", "data": None, "dia": dia_venc, "regra": None},
            [{"pagina": 1, "trecho": l_venc}],
        ),
        "vigencia": campo_gabarito(
            "presente",
            {
                "prazo": "determinado",
                "inicio": dt_ini.isoformat(),
                "fim": dt_fim.isoformat(),
                "duracao_meses": duracao,
                "regra": None,
            },
            [{"pagina": 1, "trecho": l_vig}],
        ),
        "regra_reajuste": campo_gabarito(
            "presente",
            {
                "tipo": "indice",
                "indices": [indice],
                "percentual": None,
                "periodicidade_meses": 12,
                "regra": l_reaj,
            },
            [{"pagina": 1, "trecho": l_reaj}],
        ),
    }
    return doc_id, categoria, [pagina], campos, {
        "estrato": "S2", "modelo_base": modelo_base,
        "modo": "canonico_tolerancia_1cent" if tolerancia_1cent else "canonico_exato",
        "valor_texto": brl_iso(quantia_c), "valor_gabarito": brl_iso(quantia_gab_c),
        "numero_parcelas": qtd_parc, "dia_vencimento": dia_venc,
        "duracao_meses": duracao, "inicio": dt_ini.isoformat(), "fim": dt_fim.isoformat(),
        "indice": indice,
    }

def construir_corpus():
    rng = random.Random(20261103)
    s1_docs = []
    for gen_fn in [gerar_s1_alu01, gerar_s1_alu02, gerar_s1_edu01, gerar_s1_fin01, gerar_s1_sau01]:
        for i in range(1, 4):
            s1_docs.append(gen_fn(i, rng, preenchido=True))
        s1_docs.append(gen_fn(4, rng, preenchido=False))

    s2_specs = [
        ("aluguel", "alu-01", True, False),
        ("aluguel", "alu-01", False, False),
        ("aluguel", "alu-02", True, False),
        ("aluguel", "alu-02", True, True),  # 1 centavo de diferença para testar métrica tolerante
        ("educacao", "edu-01", True, False),
        ("educacao", "edu-01", False, False),
        ("financiamento", "fin-01", True, False),
        ("financiamento", "fin-01", True, False),
        ("saude", "sau-01", True, False),
        ("saude", "sau-01", True, False),
    ]
    s2_docs = []
    for idx, (cat, mod_base, preenchido, tol1c) in enumerate(s2_specs, start=1):
        s2_docs.append(gerar_s2_canonico(idx, cat, mod_base, rng, preenchido=preenchido, tolerancia_1cent=tol1c))

    return s1_docs, s2_docs
if __name__ == "__main__":
    parser=argparse.ArgumentParser(description="Gera os 30 textos sintéticos, sem API ou exclusão de arquivos.")
    parser.add_argument("--saida",required=True)
    args=parser.parse_args()
    destino=Path(args.saida)
    destino.mkdir(parents=True,exist_ok=False)
    a,b=construir_corpus()
    for ident,categoria,paginas,campos,meta in a+b:
        registro={"id":ident,"categoria":categoria,"paginas":paginas,"campos_gabarito":campos,"parametros":meta}
        (destino/(ident+".json")).write_text(json.dumps(registro,ensure_ascii=False,indent=2),encoding="utf-8")
    print("30 instâncias geradas.")
