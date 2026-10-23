"""Casos fictícios de regras, leitura de PDF e proteção do conjunto reservado."""
import argparse
from contextlib import redirect_stdout, redirect_stderr
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from pypdf import PdfWriter
from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject
import extrair
from regras import extrair_campos


def pdf_ficticio(paginas, senha=None):
    writer = PdfWriter()
    font = DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'),
                             NameObject('/BaseFont'): NameObject('/Helvetica'), NameObject('/Encoding'): NameObject('/WinAnsiEncoding')})
    for texto in paginas:
        pagina = writer.add_blank_page(width=595, height=842)
        pagina[NameObject('/Resources')] = DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject('/F1'): writer._add_object(font)})})
        stream = DecodedStreamObject()
        linhas = ['BT /F1 12 Tf 30 800 Td 16 TL']
        for linha in texto.splitlines():
            linhas.append('<' + linha.encode('cp1252').hex() + '> Tj T*')
        linhas.append('ET')
        stream.set_data('\n'.join(linhas).encode('ascii'))
        pagina[NameObject('/Contents')] = writer._add_object(stream)
    if senha:
        writer.encrypt(senha)
    buffer = io.BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


class RegrasTests(unittest.TestCase):
    def campo(self, texto, nome):
        return extrair_campos([texto])[nome]

    def reajuste_com_revisao(self, indice='IVAR', complemento=''):
        return ['CLÁUSULA SÉTIMA: DO REAJUSTE\nReajuste anual pelo IVAR.\n'
                'O reajuste será formalizado mediante termo aditivo.',
                'CLÁUSULA NONA: DAS ALTERAÇÕES CONTRATUAIS\n'
                'Os preços contratados poderão ser alterados em casos excepcionais, '
                'sendo considerado o ' + indice + ' como índice referencial de correção.\n'
                'O contratado deverá requerer expressamente e anexar documento comprobatório.' + complemento]

    def test_reajuste_revisao_consolida_sem_indice_ou_periodo_global(self):
        paginas = self.reajuste_com_revisao()
        campo = extrair_campos(paginas)['regra_reajuste']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['tipo'], 'outra_regra')
        self.assertEqual(campo['valor']['indices'], [])
        self.assertIsNone(campo['valor']['periodicidade_meses'])
        self.assertIsNone(campo['valor']['percentual'])
        self.assertEqual(campo['valor']['regra'], '\n'.join(paginas))
        self.assertEqual(campo['regra_id'], 'reajuste-revisao-distintos-v1')
        self.assertEqual(campo['confianca'], 'media')
        self.assertEqual([e['pagina'] for e in campo['evidencias']], [1, 2])
        extrair.verificar_evidencias({'regra_reajuste': campo}, paginas)

    def test_reajuste_revisao_indice_divergente_ou_desconhecido_nao_consolida(self):
        for indice in ('IPCA', 'XYZ', 'IVAR ou IPCA', 'IVAR acrescido de XYZ'):
            campo = extrair_campos(self.reajuste_com_revisao(indice))['regra_reajuste']
            self.assertEqual(campo['estado'], 'ambiguo')
            self.assertIsNone(campo['valor'])

    def test_reajuste_revisao_exige_requerimento_e_comprovacao(self):
        for texto in ('O interessado deverá requerer expressamente.',
                      'O interessado deve anexar documento comprobatório.', ''):
            paginas = self.reajuste_com_revisao()
            paginas[1] = paginas[1].replace('O contratado deverá requerer expressamente e anexar documento comprobatório.', texto)
            self.assertEqual(extrair_campos(paginas)['regra_reajuste']['estado'], 'ambiguo')

    def test_reajuste_revisao_periodo_data_lacuna_e_negacao_nao_consolidam(self):
        for complemento in (' A revisão ocorre a cada 6 meses.',
                            ' A revisão será mensal.', ' A revisão começa em 15/10/2026.',
                            ' Condição: ____.', ' Não será admitida a revisão.',
                            ' Aplicar os critérios do anexo.', ' A correção será limitada a 5%.'):
            campo = extrair_campos(self.reajuste_com_revisao(complemento=complemento))['regra_reajuste']
            self.assertEqual(campo['estado'], 'ambiguo')
            self.assertIsNone(campo['valor'])

    def test_reajuste_revisao_nao_junta_duas_revisoes_distintas(self):
        paginas = self.reajuste_com_revisao()
        paginas.append(paginas[1].replace('NONA', 'DÉCIMA'))
        self.assertEqual(extrair_campos(paginas)['regra_reajuste']['estado'], 'ambiguo')

    def test_reajuste_revisao_sem_clausula_periodica_nao_consolida(self):
        paginas = self.reajuste_com_revisao()
        paginas[0] = 'Reajuste anual pelo IVAR.'
        self.assertEqual(extrair_campos(paginas)['regra_reajuste']['estado'], 'ambiguo')

    def test_reajuste_revisao_sem_periodicidade_explicita_nao_consolida(self):
        paginas = self.reajuste_com_revisao()
        paginas[0] = paginas[0].replace('Reajuste anual', 'Reajuste')
        self.assertEqual(extrair_campos(paginas)['regra_reajuste']['estado'], 'ambiguo')

    def test_reajuste_revisao_candidato_concorrente_nao_e_ocultado(self):
        paginas = self.reajuste_com_revisao() + ['Reajuste mensal pelo IPCA.']
        self.assertEqual(extrair_campos(paginas)['regra_reajuste']['estado'], 'ambiguo')

    def test_reajuste_revisao_remissao_anual_preservada(self):
        paginas = self.reajuste_com_revisao()
        referencia = ('CLÁUSULA QUINTA: DO VALOR\nValor mensal, não podendo este ser alterado '
                      'durante a vigência do contrato, salvo os casos de reajustes anuais previstos neste instrumento.')
        paginas.insert(0, referencia)
        campo = extrair_campos(paginas)['regra_reajuste']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertIn(referencia, campo['valor']['regra'])
        self.assertEqual({e['pagina'] for e in campo['evidencias']}, {1, 2, 3})

    def test_reajuste_revisao_remissao_anual_conflitante_nao_consolida(self):
        paginas = self.reajuste_com_revisao()
        paginas[0] = paginas[0].replace('Reajuste anual', 'Reajuste semestral')
        paginas.insert(0, 'Valor mensal, não podendo este ser alterado durante a vigência do contrato, '
                       'salvo os casos de reajustes anuais previstos neste instrumento.')
        self.assertEqual(extrair_campos(paginas)['regra_reajuste']['estado'], 'ambiguo')

    def test_reajuste_revisao_em_duas_paginas_preserva_requisitos(self):
        paginas = self.reajuste_com_revisao()
        corpo, requisitos = paginas[1].split('\nO contratado')
        paginas[1:] = [corpo, 'O contratado' + requisitos]
        campo = extrair_campos(paginas)['regra_reajuste']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertIn('documento comprobatório', campo['valor']['regra'])
        self.assertEqual([e['pagina'] for e in campo['evidencias']], [1, 2, 3])
        extrair.verificar_evidencias({'regra_reajuste': campo}, paginas)

    def test_reajuste_revisao_nao_promove_encargo_ou_objeto_acessorio(self):
        for complemento in (' A correção é aplicada em caso de atraso.',
                            ' Esse índice também reajusta o saldo devedor.'):
            campo = extrair_campos(self.reajuste_com_revisao(complemento=complemento))['regra_reajuste']
            self.assertEqual(campo['estado'], 'ambiguo')
            self.assertIsNone(campo['valor'])

    def pagamento_documental(self, complemento=None):
        return ['CLÁUSULA SEXTA: DA FORMA DE PAGAMENTO\n'
                'Os pagamentos serão efetuados no prazo de 20 dias após protocolo da nota fiscal.\n'
                'a) A nota fiscal deverá ser emitida em nome da contratante.',
                complemento or ('b) Apresentar os dados bancários da empresa.\n'
                                'c) A nota fiscal incorreta será devolvida sem pagamento até regularização.\n'
                                'd) Nenhum pagamento será efetuado enquanto pendente de liquidação obrigação contratual.\n'
                                'e) Em atraso, os valores devidos terão correção monetária pelo INPC.')]

    def test_pagamento_documental_consolida_sem_calcular_data(self):
        paginas = self.pagamento_documental()
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['tipo'], 'outra_regra')
        self.assertIsNone(campo['valor']['dia'])
        self.assertIsNone(campo['valor']['data'])
        self.assertEqual(campo['valor']['regra'], '\n'.join(paginas))
        self.assertEqual(campo['regra_id'], 'vencimento-documental-paginado-v1')
        self.assertEqual(campo['confianca'], 'media')
        self.assertEqual([e['pagina'] for e in campo['evidencias']], [1, 2])
        extrair.verificar_evidencias({'data_vencimento': campo}, paginas)

    def test_pagamento_documental_nao_perde_paragrafo_final(self):
        paginas = self.pagamento_documental('b) Apresentar os dados bancários.\n'
            'PARÁGRAFO ÚNICO – Não efetuar o pagamento se a nota fiscal estiver em desacordo com a especificação.')
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertIn('PARÁGRAFO ÚNICO', campo['valor']['regra'])

    def test_pagamento_documental_outro_prazo_ou_data_mantem_abstencao(self):
        for item in ('b) A nota fiscal deverá ser emitida em até 5 dias.',
                     'b) A nota fiscal deve ser regularizada em cinco dias úteis.',
                     'b) Os dados bancários devem ser apresentados em 20/10/2026.',
                     'b) O prazo reinicia após a nota fiscal ser regularizada.',
                     'b) A conta corrente possui novo vencimento escolhido pelo cliente.'):
            campo = extrair_campos(self.pagamento_documental(item))['data_vencimento']
            self.assertEqual(campo['estado'], 'ambiguo')
            self.assertIsNone(campo['valor'])

    def test_pagamento_documental_encargo_com_vencimento_nao_consolida(self):
        item = 'b) Em atraso, os valores devidos terão correção monetária e deverão ser pagos no dia 25.'
        campo = extrair_campos(self.pagamento_documental(item))['data_vencimento']
        self.assertEqual(campo['estado'], 'ambiguo')

    def test_pagamento_documental_item_desconhecido_nao_e_ignorado(self):
        paginas = self.pagamento_documental('b) Apresentar os dados bancários.\n'
                                            'c) A condição adicional será definida pelo contratante.')
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertTrue(any('condição adicional' in e['trecho'] for e in campo['evidencias']))

    def test_pagamento_documental_lacuna_e_remissao_externa_nao_consolidam(self):
        for item in ('b) Apresentar dados bancários no banco ____.',
                     'b) A nota fiscal será emitida conforme o anexo.',
                     'b) A nota fiscal será emitida conforme o quadro de pagamentos.'):
            campo = extrair_campos(self.pagamento_documental(item))['data_vencimento']
            self.assertEqual(campo['estado'], 'ambiguo')

    def test_pagamento_documental_nao_consolida_obrigacao_concorrente(self):
        paginas = self.pagamento_documental()
        paginas.append('CLÁUSULA NONA: DO PAGAMENTO ADICIONAL\n'
                       'As parcelas serão pagas todo dia 15 de cada mês.')
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'ambiguo')

    def test_pagamento_documental_nao_promove_condicao_sem_prazo_base(self):
        paginas = self.pagamento_documental()
        paginas[0] = 'CLÁUSULA SEXTA: DO PAGAMENTO\na) A nota fiscal deverá ser emitida em nome da contratante.'
        self.assertEqual(extrair_campos(paginas)['data_vencimento']['estado'], 'nao_identificado')

    def test_pagamento_documental_metadados_nao_viram_condicoes(self):
        paginas = self.pagamento_documental()
        paginas[0] += ('\nAssinado por 2 pessoas: NOMES FICTÍCIOS\n'
                       'Para verificar a validade das assinaturas, acesse https://example.invalid/validar')
        paginas[1] = 'CONTRATO FICTÍCIO Página 2 de 3\n' + paginas[1]
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['regra'], '\n'.join(paginas))
        extrair.verificar_evidencias({'data_vencimento': campo}, paginas)

    def test_pagamento_documental_encargo_nao_altera_reajuste(self):
        paginas = self.pagamento_documental()
        paginas.append('CLÁUSULA SÉTIMA: DO REAJUSTE\nReajuste anual pelo IPCA.')
        campos = extrair_campos(paginas)
        self.assertEqual(campos['data_vencimento']['estado'], 'encontrado')
        self.assertEqual(campos['regra_reajuste']['valor']['indices'], ['IPCA'])
        self.assertEqual(campos['regra_reajuste']['valor']['periodicidade_meses'], 12)

    def test_pagamento_documental_condicao_de_carencia_impede_consolidacao(self):
        paginas = self.pagamento_documental()
        paginas.append('CLÁUSULA ADICIONAL: DO FINANCIAMENTO\n'
                       'O prazo de amortização prevê carência, vencendo-se a primeira no dia 18 do mês seguinte.')
        self.assertEqual(extrair_campos(paginas)['data_vencimento']['estado'], 'ambiguo')

    def test_pagamento_documental_tres_paginas_com_conta_preservada(self):
        paginas = self.pagamento_documental('b) Apresentar os dados bancários.\n'
                                           'c) A empresa manterá conta corrente no banco indicado.')
        paginas.append('d) A nota fiscal incorreta será devolvida sem pagamento até regularização.')
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual([e['pagina'] for e in campo['evidencias']], [1, 2, 3])
        extrair.verificar_evidencias({'data_vencimento': campo}, paginas)

    def test_pagamento_continuado_preserva_condicoes_por_pagina(self):
        paginas = ['CLÁUSULA PRIMEIRA: DA FORMA DE PAGAMENTO\n'
                   'Os pagamentos serão efetuados no prazo de 20 dias após protocolo da nota fiscal.',
                   'a) A nota fiscal incorreta será devolvida sem pagamento até regularização.\n'
                   'b) Nenhum pagamento será efetuado enquanto houver obrigação pendente.\n'
                   'CLÁUSULA SEGUNDA: DO REAJUSTE\nReajuste anual pelo IPCA.']
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertEqual({e['pagina'] for e in campo['evidencias']}, {1, 2})
        self.assertTrue(any('regularização' in e['trecho'] for e in campo['evidencias']))
        self.assertFalse(any('IPCA' in e['trecho'] for e in campo['evidencias']))
        self.assertIn('continuação', campo['motivo'])
        extrair.verificar_evidencias({'data_vencimento': campo}, paginas)

    def test_pagamento_continuado_nao_promove_encargo_a_prazo(self):
        paginas = ['CLÁUSULA SEXTA: DO PAGAMENTO\n'
                   'O aluguel será pago todo dia 15 de cada mês.',
                   'Em atraso, a multa será paga no dia 25 e corrigida pelo INPC.']
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertTrue(any('INPC' in e['trecho'] for e in campo['evidencias']))

    def test_pagamento_clausula_encerrada_nao_absorve_pagina_seguinte(self):
        paginas = ['CLÁUSULA SEXTA: DO PAGAMENTO\n'
                   'O aluguel será pago todo dia 15 de cada mês.\n'
                   'CLÁUSULA SEGUNDA: DO OBJETO\nServiço fictício.',
                   'Entrega de documentos em local indicado.']
        self.assertEqual(extrair_campos(paginas)['data_vencimento']['valor']['dia'], 15)

    def test_pagamento_proximo_titulo_no_inicio_da_pagina_nao_e_continuacao(self):
        paginas = ['CLÁUSULA SEXTA: DO PAGAMENTO\n'
                   'O aluguel será pago todo dia 15 de cada mês.',
                   'CLÁSULA SEGUNDA: DO OBJETO\nEntrega do objeto.']
        self.assertEqual(extrair_campos(paginas)['data_vencimento']['valor']['dia'], 15)

    def test_pagamento_continuado_sem_prazo_preserva_abstencao(self):
        paginas = ['CLÁUSULA SEXTA: DO PAGAMENTO\nAs condições estão no anexo.',
                   'A apresentação da nota fiscal depende do ateste.']
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'nao_identificado')
        self.assertEqual({e['pagina'] for e in campo['evidencias']}, {1, 2})

    def test_pagamento_titulo_repetido_preserva_duas_obrigacoes(self):
        paginas = ['CLÁUSULA SEXTA: DO PAGAMENTO\nO aluguel será pago todo dia 15 de cada mês.',
                   'CLÁUSULA SEGUNDA: DO PAGAMENTO\nAs parcelas serão pagas todo dia 20 de cada mês.']
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertEqual({e['pagina'] for e in campo['evidencias']}, {1, 2})

    def test_pagamento_continuacao_nao_altera_outros_campos(self):
        paginas = ['CLÁUSULA PRIMEIRA: DAS CONDIÇÕES DE PAGAMENTO\n'
                   'Os pagamentos serão efetuados em 20 dias após protocolo da nota fiscal.',
                   'Documentos pendentes impedem o pagamento.\n'
                   'CLÁUSULA SEGUNDA: DO REAJUSTE\nReajuste anual pelo IPCA.']
        separado = [paginas[0], 'CLÁUSULA ADICIONAL: DOS DOCUMENTOS\n' + paginas[1]]
        a, b = extrair_campos(paginas), extrair_campos(separado)
        for nome in ('valor_parcela', 'numero_parcelas', 'vigencia', 'regra_reajuste'):
            self.assertEqual(a[nome], b[nome])

    def test_revisao_excepcional_nao_herda_periodicidade_anual(self):
        paginas = ['CLÁUSULA PRIMEIRA: DO REAJUSTE\nReajuste anual pelo IPCA.',
                   'CLÁUSULA SEGUNDA: DAS ALTERAÇÕES CONTRATUAIS\n'
                   'Os preços contratados poderão ser alterados em casos excepcionais, '
                   'usando o IVAR como índice referencial, mediante requerimento comprovado.']
        campo = extrair_campos(paginas)['regra_reajuste']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertEqual({e['pagina'] for e in campo['evidencias']}, {1, 2})
        self.assertIn('excepcional', campo['motivo'])
        extrair.verificar_evidencias({'regra_reajuste': campo}, paginas)

    def test_revisao_excepcional_isolada_nao_define_reajuste_periodico(self):
        texto = 'A revisão de preços depende de requerimento expresso e comprovação do desequilíbrio.'
        campo = self.campo(texto, 'regra_reajuste')
        self.assertEqual(campo['estado'], 'nao_identificado')
        self.assertTrue(any(e['trecho'] == texto for e in campo['evidencias']))

    def test_revisao_excepcional_preserva_lacuna_negacao_e_indice_diferente(self):
        for texto in ('A revisão de preços depende de requerimento e do índice ____.',
                      'Não será admitida revisão de preços, mesmo mediante requerimento.',
                      'A revisão de preços utilizará INPC mediante comprovação.'):
            paginas = ['Reajuste anual pelo IPCA.', texto]
            campo = extrair_campos(paginas)['regra_reajuste']
            self.assertEqual(campo['estado'], 'ambiguo')
            self.assertTrue(any(texto in e['trecho'] for e in campo['evidencias']))

    def test_revisao_sem_contexto_financeiro_nao_interfere(self):
        for texto in ('A revisão dos documentos depende de requerimento.',
                      'Em casos excepcionais, poderá ser alterado o local de entrega.',
                      'O fiscal fará a revisão da nota fiscal para autorizar o pagamento.'):
            campo = extrair_campos(['Reajuste anual pelo IPCA.', texto])['regra_reajuste']
            self.assertEqual(campo['valor']['indices'], ['IPCA'])
            self.assertEqual(campo['valor']['periodicidade_meses'], 12)

    def test_revisao_excepcional_preserva_condicoes_da_clausula(self):
        texto = ('CLÁUSULA NONA: DAS ALTERAÇÕES CONTRATUAIS\n'
                 'Os preços serão alterados apenas em casos excepcionais.\n\n'
                 'O interessado deverá requerer expressamente a revisão de preços.\n'
                 'Anexar documento comprobatório.\n'
                 'CLÁUSULA DÉCIMA: DO FORO\nComarca fictícia.')
        campo = extrair_campos(['Reajuste anual pelo IPCA.', texto])['regra_reajuste']
        self.assertTrue(any('Anexar documento' in e['trecho'] for e in campo['evidencias']))
        self.assertFalse(any('Comarca fictícia' in e['trecho'] for e in campo['evidencias']))

    def test_revisao_excepcional_nao_reanexa_clausula_vizinha_sem_ponto(self):
        texto = ('CLÁUSULA NONA: DAS ALTERAÇÕES\n'
                 'Os preços serão alterados em casos excepcionais;\n'
                 'CLÁUSULA DÉCIMA: DO FORO\nComarca fictícia.')
        campo = extrair_campos(['Reajuste anual pelo IPCA.', texto])['regra_reajuste']
        self.assertTrue(any('excepcionais' in e['trecho'] for e in campo['evidencias']))
        self.assertFalse(any('Comarca fictícia' in e['trecho'] for e in campo['evidencias']))

    def test_revisao_excepcional_antes_do_primeiro_titulo_preservada(self):
        texto = ('A revisão de preços depende de requerimento.\n'
                 'CLÁUSULA NONA: DO REAJUSTE\nReajuste anual pelo IPCA.')
        campo = self.campo(texto, 'regra_reajuste')
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertTrue(any('requerimento' in e['trecho'] for e in campo['evidencias']))

    def test_pagamento_continuado_tres_paginas_preserva_fragmentos(self):
        paginas = ['CLÁUSULA SEXTA: DO PAGAMENTO\nO aluguel será pago todo dia 15 de cada mês.',
                   'a) A nota fiscal precisa de ateste.',
                   'b) Pagamento sujeito à regularização.\n'
                   'CLÁUSULA SÉTIMA: DO OBJETO\nServiço fictício.']
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertEqual({e['pagina'] for e in campo['evidencias']}, {1, 2, 3})
        self.assertFalse(any('Serviço fictício' in e['trecho'] for e in campo['evidencias']))
        extrair.verificar_evidencias({'data_vencimento': campo}, paginas)

    def test_exemplo_do_protocolo(self):
        texto = (extrair.BASE / 'examples/contrato-sintetico.txt').read_text(encoding='utf-8')
        esperado = json.loads((extrair.BASE / 'examples/extracao-sintetica.json').read_text(encoding='utf-8'))
        campos = extrair_campos([texto])
        for nome, campo in campos.items():
            with self.subTest(campo=nome):
                self.assertEqual(campo['valor'], esperado['campos'][nome]['valor'])
                self.assertEqual(campo['confianca'], 'media')
        extrair.verificar_evidencias(campos, [texto])

    def test_valor_nao_e_total_entrada_ou_multa(self):
        texto = 'Total: R$ 12.000,00. Entrada: R$ 2.000,00. Parcela mensal de R$ 1.000,00. Multa de R$ 200,00.'
        self.assertEqual(self.campo(texto, 'valor_parcela')['valor']['quantia'], '1000.00')

    def test_nao_divide_total_pelo_numero(self):
        campos = extrair_campos(['Total de R$ 12.000,00, pago em 12 parcelas.'])
        self.assertIsNone(campos['valor_parcela']['valor'])
        self.assertEqual(campos['numero_parcelas']['valor']['quantidade'], 12)

    def test_aluguel_do_imovel_nao_confunde_valor_global(self):
        for moeda in ('R$', 'RS'):
            texto = (f'7.1 O valor global é de {moeda} 19.800,00 (dezenove mil e oitocentos reais), '
                     f'importando em aluguel mensal do imóvel no valor de\n{moeda} 1.650,00 (mil seiscentos e cinquenta reais).')
            with self.subTest(moeda=moeda):
                campo = self.campo(texto, 'valor_parcela')
                self.assertEqual(campo['valor']['quantia'], '1650.00')
                self.assertEqual(campo['valor']['moeda'], 'BRL')
                extrair.verificar_evidencias({'valor_parcela': campo}, [texto])

    def test_condicao_de_reajuste_em_outra_clausula_nao_oculta_aluguel(self):
        texto = ('PREÇO\n7.1 Aluguel mensal do imóvel no valor de RS 950,00 (novecentos e cinquenta reais).\n'
                 '7.2 Poderá ser feito reajuste anual pelo IPCA.\n'
                 '7.3 Se houver variação desproporcional, as partes poderão negociar.')
        campo = extrair_campos(['Identificação.', texto])['valor_parcela']
        self.assertEqual(campo['valor']['quantia'], '950.00')
        self.assertEqual(campo['evidencias'][0]['pagina'], 2)
        self.assertNotIn('7.2', campo['evidencias'][0]['trecho'])
        self.assertIn('RS 950,00', campo['evidencias'][0]['trecho'])
        extrair.verificar_evidencias({'valor_parcela': campo}, ['Identificação.', texto])

    def test_rs_sem_contexto_monetario_suficiente_nao_e_convertido(self):
        for texto in ('Aluguel no RS 950,00.', 'Aluguel: RS 950,00.',
                      'Imóvel no RS 950,00 (código de cadastro).',
                      'Aluguel de RS 950 (novecentos e cinquenta reais).'):
            with self.subTest(texto=texto):
                self.assertIsNone(self.campo(texto, 'valor_parcela')['valor'])

    def test_rs_total_sem_parcela_nao_e_dividido(self):
        campos = extrair_campos(['Valor global de RS 19.800,00 (dezenove mil e oitocentos reais), para 12 parcelas.'])
        self.assertIsNone(campos['valor_parcela']['valor'])
        self.assertEqual(campos['numero_parcelas']['valor']['quantidade'], 12)

    def test_total_do_aluguel_nao_e_parcela(self):
        for texto in ('Valor total do aluguel de R$ 19.800,00.',
                      'Valor global do aluguel mensal do imóvel no valor de RS 19.800,00 (dezenove mil e oitocentos reais).'):
            with self.subTest(texto=texto):
                self.assertIsNone(self.campo(texto, 'valor_parcela')['valor'])

    def test_condicao_na_mesma_clausula_de_aluguel_exige_revisao(self):
        for texto in ('7.1 Aluguel mensal do imóvel no valor de RS 950,00 (novecentos e cinquenta reais), se pago antecipadamente.',
                      '7.1 Aluguel mensal do imóvel no valor de R$ 950,00, com desconto.'):
            with self.subTest(texto=texto):
                self.assertIsNone(self.campo(texto, 'valor_parcela')['valor'])

    def test_rs_encargos_e_valores_concorrentes(self):
        self.assertIsNone(self.campo('Multa equivalente ao aluguel de RS 950,00 (novecentos e cinquenta reais).', 'valor_parcela')['valor'])
        campo = self.campo('7.1 Aluguel de R$ 800,00.\n7.2 Aluguel de RS 950,00 (novecentos e cinquenta reais).', 'valor_parcela')
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertEqual(len(campo['evidencias']), 2)

    def test_rs_formatacao_invalida_nao_aceita_prefixo(self):
        for numero in ('1.65,00', '950,001', '950,00.50'):
            self.assertIsNone(self.campo(f'Aluguel de RS {numero} (valor em reais).', 'valor_parcela')['valor'])

    def test_locacao_valor_mensal_com_reajuste_futuro(self):
        for anual in ('anuais', 'anua is'):
            texto = ('CLÁUSULA QUINTA: DO VALOR\n'
                     'O LOCATÁRIO pagará pela locação do imóvel o valor mensal de R$4.350,50 '
                     '(valor em reais), não podendo este ser alterado durante a vigência do contrato, '
                     f'salvo os casos de reajustes {anual} previstos neste instrumento.')
            campo = extrair_campos(['Introdução.', texto])['valor_parcela']
            self.assertEqual(campo['estado'], 'encontrado')
            self.assertEqual(campo['valor']['quantia'], '4350.50')
            self.assertEqual(campo['evidencias'][0]['pagina'], 2)
            self.assertIn('reajustes', campo['evidencias'][0]['trecho'])
            extrair.verificar_evidencias({'valor_parcela': campo}, ['Introdução.', texto])

    def test_locacao_valor_mensal_separado_de_outra_clausula(self):
        texto = ('CLÁUSULA QUINTA: DO VALOR\n'
                 'O locatário pagará pela locação do imóvel o valor mensal de R$ 1.450,00\n'
                 'CLÁUSULA SEXTA: DO REAJUSTE\nSe houver reajuste, as partes poderão negociar.')
        campo = self.campo(texto, 'valor_parcela')
        self.assertEqual(campo['valor']['quantia'], '1450.00')
        self.assertNotIn('SEXTA', campo['evidencias'][0]['trecho'])

    def test_locacao_valor_mensal_nao_divide_total(self):
        texto = ('Valor global de R$ 18.000,00.\n'
                 'O locatário pagará pela locação do imóvel o valor mensal de R$ 1.500,00.')
        campos = extrair_campos([texto])
        self.assertEqual(campos['valor_parcela']['valor']['quantia'], '1500.00')
        self.assertIsNone(campos['numero_parcelas']['valor'])
        self.assertIsNone(self.campo('Valor da locação do imóvel de R$ 18.000,00, por 12 meses.', 'valor_parcela')['valor'])

    def test_locacao_negacao_desconto_e_encargo_exigem_revisao(self):
        for texto in (
            'O locatário não pagará pela locação do imóvel o valor mensal de R$ 1.500,00.',
            'Multa pela locação do imóvel no valor mensal de R$ 1.500,00.',
            'O locatário pagará pela locação do imóvel o valor mensal de R$ 1.500,00, com desconto.',
            'O locatário pagará pela locação do imóvel o valor mensal de R$ 1.500,00, se houver ocupação.',
            'Total da locação do imóvel no valor mensal de R$ 18.000,00.',
            'Entrada pela locação do imóvel no valor mensal de R$ 1.500,00.',
        ):
            with self.subTest(texto=texto):
                self.assertIsNone(self.campo(texto, 'valor_parcela')['valor'])

    def test_locacao_excecao_de_reajuste_nao_esconde_outras_condicoes(self):
        base = ('O locatário pagará pela locação do imóvel o valor mensal de R$ 1.500,00, '
                'não podendo este ser alterado durante a vigência do contrato, '
                'salvo os casos de reajustes anuais previstos neste instrumento')
        for texto in (base + ', com desconto de R$ 100,00.',
                      base + ', se houver ocupação.',
                      base.replace('1.500,00,', '1.500,00 (com desconto),') + '.',
                      base.replace('O locatário pagará', 'O locatário não pagará') + '.',
                      base.replace('reajustes anuais', 'descontos anuais') + '.'):
            with self.subTest(texto=texto):
                self.assertIsNone(self.campo(texto, 'valor_parcela')['valor'])

    def test_locacao_valores_mensais_concorrentes(self):
        texto = ('CLÁUSULA PRIMEIRA: DO VALOR\nLocação do imóvel no valor mensal de R$ 1.500,00.\n'
                 'CLÁUSULA SEGUNDA: DO VALOR\nLocação do imóvel no valor mensal de R$ 1.800,00.')
        self.assertEqual(self.campo(texto, 'valor_parcela')['estado'], 'ambiguo')

    def test_locacao_formato_monetario_invalido(self):
        for numero in ('1.50,00', '1500,001', '1500,00.50'):
            self.assertIsNone(self.campo(f'Locação do imóvel no valor mensal de R$ {numero}.', 'valor_parcela')['valor'])

    def test_locacao_rs_exige_indicacao_de_reais(self):
        self.assertIsNone(self.campo('Locação do imóvel no valor mensal de RS 1500,00.', 'valor_parcela')['valor'])
        campo = self.campo('Locação do imóvel no valor mensal de RS 1500,00 (valor em reais).', 'valor_parcela')
        self.assertEqual(campo['valor']['quantia'], '1500.00')

    def test_valor_extenso_divergente_abstem_com_evidencia(self):
        texto = 'Mensalidade de R$ 289,00 (duzentos e cinquenta reais).'
        campo = extrair_campos(['Introdução.', texto])['valor_parcela']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertIn('extenso', campo['motivo'])
        self.assertEqual(campo['evidencias'][0]['pagina'], 2)
        extrair.verificar_evidencias({'valor_parcela': campo}, ['Introdução.', texto])

    def test_valor_extenso_compativel_centavos_e_milhares(self):
        for numero, extenso in [('1.650,30', 'mil seiscentos e cinquenta reais e trinta centavos'),
                                ('8.825,50', 'oito mil, oitocentos e vinte e cinco reais e cinquenta centavos'),
                                ('0,50', 'cinquenta centavos'), ('1,01', 'um real e um centavo'),
                                ('100,00', 'cem reais'), ('1.200,00', 'mil e duzentos reais')]:
            with self.subTest(numero=numero):
                campo = self.campo(f'Aluguel mensal de R$ {numero} ({extenso}).', 'valor_parcela')
                self.assertEqual(campo['estado'], 'encontrado')
                self.assertEqual(campo['valor']['quantia'], numero.replace('.', '').replace(',', '.'))

    def test_valor_extenso_centavos_divergentes(self):
        campo = self.campo('Parcela de R$ 900,50 (novecentos reais e quinze centavos).', 'valor_parcela')
        self.assertEqual(campo['estado'], 'ambiguo')

    def test_valor_extenso_invalido_ou_nao_suportado_nao_e_confirmado(self):
        for texto in ('cem e vinte reais', 'vinte e vinte reais', 'um milhão de reais',
                      'mil mil reais', 'mil reais e cento e cinquenta centavos',
                      'oito mil oitocentos e vinte e cinco e cinquenta centavos'):
            with self.subTest(texto=texto):
                campo = self.campo(f'Mensalidade de R$ 900,00 ({texto}).', 'valor_parcela')
                self.assertIsNone(campo['valor'])
                self.assertIn('extenso', campo['motivo'])

    def test_valor_extenso_descritivo_nao_e_numero(self):
        for sufixo in ('', ' (valor em reais)'):
            self.assertEqual(self.campo('Mensalidade de R$ 900,00' + sufixo, 'valor_parcela')['valor']['quantia'], '900.00')

    def test_valor_extenso_taxa_nao_substitui_mensalidade(self):
        texto = ('Taxa de adesão de R$ 197,00 (cento e cinquenta reais); '
                 'mensalidade de R$ 289,00 (duzentos e oitenta e nove reais).')
        campo = self.campo(texto, 'valor_parcela')
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['quantia'], '289.00')

    def test_valor_extenso_dez_vezes_conflito_sem_extrair_taxa(self):
        texto = ('Preço de R$ 3.087,00 (três mil e oitenta e sete reais) parcelados da seguinte maneira: '
                 'Taxa de adesão de R$ 197,00 (cento e cinquenta reais) + '
                 '10x (dez vezes) de R$ 289,00 (duzentos e cinquenta reais).')
        campo = self.campo(texto, 'valor_parcela')
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertIn('extenso', campo['motivo'])

    def test_valor_extenso_dez_vezes_compativel_nao_amplia_extracao(self):
        texto = ('Taxa de adesão de R$ 197,00 (cento e noventa e sete reais) + '
                 '10x (dez vezes) de R$ 289,00 (duzentos e oitenta e nove reais).')
        self.assertIsNone(self.campo(texto, 'valor_parcela')['valor'])

    def test_valor_extenso_total_conflitante_nao_vira_parcela(self):
        texto = ('Total de R$ 12.000,00 (onze mil reais), '
                 'aluguel mensal de R$ 1.000,00 (mil reais).')
        self.assertEqual(self.campo(texto, 'valor_parcela')['valor']['quantia'], '1000.00')

    def test_valor_extenso_conflito_impede_escolher_outro_candidato(self):
        campo = extrair_campos(['Mensalidade de R$ 289,00 (duzentos e cinquenta reais).',
                               'Mensalidade de R$ 300,00.'])['valor_parcela']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertEqual(len(campo['evidencias']), 2)

    def test_valor_extenso_associacao_rs(self):
        campo = self.campo('Aluguel mensal do imóvel no valor de RS 950,00 (novecentos reais).', 'valor_parcela')
        self.assertEqual(campo['estado'], 'ambiguo')

    def test_valor_extenso_encargo_isolado_nao_vira_parcela(self):
        texto = 'Taxa de adesão de R$ 197,00 (cento e cinquenta reais).'
        self.assertEqual(self.campo(texto, 'valor_parcela')['estado'], 'nao_identificado')

    def test_valor_extenso_adesao_parcelada_nao_e_mensalidade(self):
        for taxa in ('adesão', 'matrícula'):
            texto = f'Taxa de {taxa} em 2 parcelas de R$ 100,00 (noventa reais).'
            with self.subTest(taxa=taxa):
                campo = self.campo(texto, 'valor_parcela')
                self.assertEqual(campo['estado'], 'nao_identificado')
                self.assertIsNone(campo['valor'])

    def test_valor_extenso_adesao_parcelada_nao_bloqueia_aluguel(self):
        campo = extrair_campos(['Taxa de adesão em 2 parcelas de R$ 100,00 (noventa reais).',
                               'Mensalidade de R$ 700,00 (setecentos reais).'])['valor_parcela']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['quantia'], '700.00')

    def test_valor_extenso_parentese_incompleto_nao_confirma_numero(self):
        campo = self.campo('Mensalidade de R$ 700,00 (setecentos reais', 'valor_parcela')
        self.assertEqual(campo['estado'], 'nao_identificado')
        self.assertIn('extenso', campo['motivo'])

    def test_valor_extenso_limites_e_formas_invalidas(self):
        from extenso import dinheiro_por_extenso
        self.assertEqual(str(dinheiro_por_extenso('novecentos e noventa e nove mil novecentos e noventa e nove reais e noventa e nove centavos')), '999999.99')
        for texto in ('milhão de reais', 'mil e zero reais', 'cento reais', 'dois real', 'um reais',
                      'um real e dois centavo', 'menos cem reais', 'vinte e trinta centavos'):
            with self.subTest(texto=texto):
                self.assertIsNone(dinheiro_por_extenso(texto))

    def escolar_tabela(self):
        return ('Contrato de serviços educacionais.\n'
                '§ 1º O preço pode ser pago à vista ou em 3 (três) parcelas mensais e iguais. '
                'A primeira, no valor de R$ 430,00, deve ser paga no ato da matrícula.\n'
                'Mensalidades Valor Referência Data vencimento\n'
                '2ª mensalidade R$ 430,00 Junho/2027 10/06/2027\n'
                '3ª mensalidade R$ 430,00 Julho/2027 10/07/2027\n'
                '§ 2º O aluno apresentará o comprovante.')

    def test_escolar_opcoes_nao_escolhem_valor_contagem_ou_data(self):
        texto = self.escolar_tabela()
        campos = extrair_campos([texto])
        for nome in ('valor_parcela', 'numero_parcelas', 'data_vencimento'):
            with self.subTest(campo=nome):
                self.assertEqual(campos[nome]['estado'], 'ambiguo')
                self.assertIsNone(campos[nome]['valor'])
                self.assertIn('alternativas', campos[nome]['motivo'])
                self.assertIn('3ª mensalidade', str(campos[nome]['evidencias']))
        extrair.verificar_evidencias(campos, [texto])

    def test_escolar_tabela_formato_conferido(self):
        from pagamentos_escolares import analisar_opcoes
        opcao = analisar_opcoes([self.escolar_tabela()])[0]
        self.assertEqual(opcao['tabela']['estado'], 'formato_conferido')
        self.assertEqual([l['ordem'] for l in opcao['tabela']['linhas']], [2, 3])
        self.assertEqual(opcao['tabela']['linhas'][0]['data'], '2027-06-10')
        self.assertEqual(opcao['tabela']['linhas'][0]['quantia'], '430.00')
        self.assertNotIn('comprovante', str(opcao['evidencias']))

    def test_escolar_tabela_data_invalida_preserva_pendencia(self):
        from pagamentos_escolares import analisar_opcoes
        texto = self.escolar_tabela().replace('10/06/2027', '31/02/2027')
        tabela = analisar_opcoes([texto])[0]['tabela']
        self.assertEqual(tabela['estado'], 'incompleta_ou_inconsistente')
        self.assertIn('data_invalida', tabela['motivos'])
        self.assertIsNone(self.campo(texto, 'data_vencimento')['valor'])

    def test_escolar_tabela_faltante_repetida_ou_fora_de_ordem(self):
        from pagamentos_escolares import analisar_opcoes
        for texto in (self.escolar_tabela().replace('3ª mensalidade', '2ª mensalidade'),
                      self.escolar_tabela().replace('3ª mensalidade R$ 430,00 Julho/2027 10/07/2027', ''),
                      self.escolar_tabela().replace('Julho/2027 10/07/2027', 'Maio/2027 10/05/2027')):
            with self.subTest(texto=texto):
                self.assertEqual(analisar_opcoes([texto])[0]['tabela']['estado'], 'incompleta_ou_inconsistente')

    def test_escolar_tabela_referencia_valor_e_formato(self):
        from pagamentos_escolares import analisar_opcoes
        for antigo, novo, motivo in [('Junho/2027', 'Maio/2027', 'referencia_diferente_do_vencimento'),
                                    ('3ª mensalidade R$ 430,00', '3ª mensalidade R$ 440,00', 'valores_diferentes_em_parcelas_iguais'),
                                    ('3ª mensalidade R$ 430,00', '3ª mensalidade R$ 0,00', 'valor_nao_positivo'),
                                    ('3ª mensalidade R$ 430,00', '3ª mensalidade R$ ____', 'linha_fora_do_formato')]:
            with self.subTest(motivo=motivo):
                tabela = analisar_opcoes([self.escolar_tabela().replace(antigo, novo)])[0]['tabela']
                self.assertIn(motivo, tabela['motivos'])

    def test_escolar_tabela_primeira_sem_evento_nao_completa(self):
        from pagamentos_escolares import analisar_opcoes
        texto = self.escolar_tabela().replace('no ato da matrícula', 'conforme combinado')
        self.assertIn('primeira_parcela_sem_evento', analisar_opcoes([texto])[0]['tabela']['motivos'])

    def test_escolar_tabela_continuacao_entre_paginas(self):
        from pagamentos_escolares import analisar_opcoes
        texto = self.escolar_tabela()
        pos = texto.index('3ª mensalidade')
        paginas = [texto[:pos], texto[pos:]]
        opcao = analisar_opcoes(paginas)[0]
        self.assertEqual(opcao['tabela']['estado'], 'formato_conferido')
        self.assertEqual([e['pagina'] for e in opcao['evidencias']], [1, 2])
        self.assertEqual(opcao['tabela']['linhas'][1]['pagina'], 2)
        extrair.verificar_evidencias(extrair_campos(paginas), paginas)

    def test_escolar_perfis_preservam_matricula_sem_escolher_preco(self):
        texto = ('Contrato de curso.\n3.2) Matrícula de R$ 60,00 e 8 parcelas de R$ 210,00 '
                 'para estudantes degraduação e R$ 280,00 para profissionaisformados.\n'
                 '3.3) A matrícula dá acesso ao curso.')
        campos = extrair_campos([texto])
        for nome in ('valor_parcela', 'numero_parcelas', 'data_vencimento'):
            self.assertEqual(campos[nome]['estado'], 'ambiguo')
            self.assertIsNone(campos[nome]['valor'])
            self.assertIn('Matrícula', str(campos[nome]['evidencias']))

    def test_escolar_opcoes_complementares_preservam_desconto(self):
        texto = ('Contrato de curso.\n3.4) O aluno poderá pagar em apenas 4 parcelas ou à vista, '
                 'com desconto, por boleto.\n3.5) A matrícula será confirmada posteriormente.')
        campo = self.campo(texto, 'numero_parcelas')
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIn('desconto', str(campo['evidencias']))
        from pagamentos_escolares import analisar_opcoes
        self.assertNotIn('posteriormente', str(analisar_opcoes([texto])[0]['evidencias']))

    def test_escolar_nao_resolve_selecao_de_plano(self):
        texto = self.escolar_tabela() + '\nOpção escolhida: à vista.'
        self.assertIsNone(self.campo(texto, 'numero_parcelas')['valor'])

    def test_escolar_sem_alternativa_preserva_regra_simples(self):
        campo = self.campo('Contrato escolar: mensalidade de R$ 430,00.', 'valor_parcela')
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['quantia'], '430.00')

    def test_escolar_nao_aplica_a_financiamento(self):
        from pagamentos_escolares import analisar_opcoes
        self.assertEqual(analisar_opcoes(['Financiamento à vista ou em 3 parcelas.']), [])

    def test_escolar_matricula_imobiliaria_e_curso_incidental_nao_definem_educacao(self):
        from pagamentos_escolares import analisar_opcoes
        texto = ('Financiamento do imóvel com matrícula registrada. No curso da execução, '
                 'o pagamento poderá ser feito à vista ou em 3 parcelas.')
        self.assertEqual(analisar_opcoes([texto]), [])

    def test_escolar_opcoes_de_encargo_nao_escolhem_plano_principal(self):
        from pagamentos_escolares import analisar_opcoes
        for objeto in ('Taxa de adesão', 'Taxa de matrícula', 'Material didático', 'Segunda via'):
            paginas = [f'Contrato escolar.\n3.1) {objeto} pode ser pago à vista ou em 2 parcelas.',
                       '3.2) Mensalidade de R$ 430,00.']
            with self.subTest(objeto=objeto):
                self.assertEqual(analisar_opcoes(paginas), [])
                self.assertEqual(extrair_campos(paginas)['valor_parcela']['valor']['quantia'], '430.00')

    def test_escolar_tabela_nao_reconstroi_linha_quebrada(self):
        from pagamentos_escolares import analisar_opcoes
        texto = self.escolar_tabela().replace('3ª mensalidade R$', '3ª mensalidade\nR$')
        self.assertEqual(analisar_opcoes([texto])[0]['tabela']['estado'], 'incompleta_ou_inconsistente')

    def test_escolar_divergencia_extenso_tem_prioridade(self):
        texto = self.escolar_tabela() + '\nMensalidade de R$ 430,00 (quatrocentos reais).'
        campo = self.campo(texto, 'valor_parcela')
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIn('extenso', campo['motivo'])

    def test_valores_concorrentes(self):
        campo = self.campo('Mensalidade: R$ 900,00. Mensalidade: R$ 1.200,00.', 'valor_parcela')
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertEqual(len(campo['evidencias']), 2)

    def test_repeticao_nao_aumenta_confianca(self):
        campo = self.campo('Aluguel: R$ 500,00. Aluguel: R$ 500,00.', 'valor_parcela')
        self.assertEqual(campo['valor']['quantia'], '500.00')
        self.assertEqual(campo['confianca'], 'media')

    def test_modelo_com_lacunas(self):
        for nome, campo in extrair_campos(['Aluguel R$ _____. Vigência de __ meses. Vencimento dia __.']).items():
            with self.subTest(campo=nome):
                self.assertIsNone(campo['valor'])

    def test_desconto_condicional_nao_vira_valor_regular(self):
        self.assertIsNone(self.campo('Mensalidade de R$ 800,00 caso pago com desconto.', 'valor_parcela')['valor'])

    def test_quantidade_nao_inferida_da_duracao(self):
        self.assertIsNone(self.campo('A vigência é de 24 meses.', 'numero_parcelas')['valor'])

    def test_quantidade_explicita_com_extenso(self):
        self.assertEqual(self.campo('Serão 12 (doze) parcelas mensais.', 'numero_parcelas')['valor']['quantidade'], 12)

    def test_parcelas_da_multa_nao_sao_do_contrato(self):
        self.assertIsNone(self.campo('A multa equivale a 3 parcelas.', 'numero_parcelas')['valor'])

    def test_opcoes_de_pagamento(self):
        self.assertIsNone(self.campo('Pagamento à vista ou em 6 parcelas.', 'numero_parcelas')['valor'])

    def test_dia_mensal_sem_inventar_mes(self):
        self.assertEqual(self.campo('Vencimento todo dia 10.', 'data_vencimento')['valor'],
                         {'tipo': 'mensal', 'data': None, 'dia': 10, 'regra': None})

    def test_dia_util_preserva_regra(self):
        texto = 'O vencimento será no 5º dia útil de cada mês.'
        valor = self.campo(texto, 'data_vencimento')['valor']
        self.assertEqual(valor['tipo'], 'outra_regra')
        self.assertEqual(valor['regra'], texto)
        self.assertIsNone(valor['dia'])

    def test_data_unica_real(self):
        self.assertEqual(self.campo('Vencimento em 29/02/2028.', 'data_vencimento')['valor']['data'], '2028-02-29')

    def test_pagamento_mensal_subsequente_preserva_regra_e_pagina(self):
        for ordinal in ('º', '®'):
            texto = f'9.1 O aluguel será pago mensalmente até o 18{ordinal} (décimo oitavo) dia do mês\nsubsequente ao mês de referência.'
            campo = extrair_campos(['Identificação.', texto])['data_vencimento']
            self.assertEqual(campo['estado'], 'encontrado')
            self.assertEqual(campo['valor'], {'tipo': 'outra_regra', 'data': None, 'dia': None, 'regra': texto})
            self.assertEqual(campo['evidencias'][0]['pagina'], 2)
            extrair.verificar_evidencias({'data_vencimento': campo}, ['Identificação.', texto])

    def test_pagamento_mensal_mes_seguinte_nao_vira_dia_isolado(self):
        texto = 'A mensalidade será paga mensalmente até o dia 15 do mês seguinte.'
        campo = self.campo(texto, 'data_vencimento')
        self.assertEqual(campo['valor'], {'tipo': 'outra_regra', 'data': None, 'dia': None, 'regra': texto})

    def test_pagamento_mensal_dia_fixo(self):
        campo = self.campo('Os aluguéis serão pagos mensalmente até o dia 12 de cada mês.', 'data_vencimento')
        self.assertEqual(campo['valor'], {'tipo': 'mensal', 'data': None, 'dia': 12, 'regra': None})

    def test_pagamento_mensal_negado_nao_define_vencimento(self):
        texto = 'O aluguel não será pago mensalmente até o dia 20 do mês subsequente.'
        self.assertIsNone(self.campo(texto, 'data_vencimento')['valor'])

    def test_termino_contrato_nao_define_vencimento_aluguel(self):
        for texto in (
            'O vencimento do contrato ocorrerá no dia 20 do mês subsequente.',
            'O vencimento do presente contrato ocorrerá no dia 20 do mês subsequente.',
            'Após o vencimento da locação, o imóvel será devolvido em 30 dias.',
        ):
            with self.subTest(texto=texto):
                self.assertIsNone(self.campo(texto, 'data_vencimento')['valor'])

    def test_pagamento_mensal_de_encargo_nao_define_vencimento(self):
        self.assertIsNone(self.campo('A multa será paga mensalmente até o dia 20 do mês subsequente.', 'data_vencimento')['valor'])

    def test_pagamento_mensal_incompleto_ou_dia_invalido(self):
        for texto in (
            'O aluguel será pago mensalmente.',
            'O aluguel será pago mensalmente até o dia __ do mês subsequente.',
            'O aluguel será pago mensalmente até o dia 32 do mês subsequente.',
            'O aluguel será pago mensalmente até o 0º dia do mês subsequente.',
        ):
            with self.subTest(texto=texto):
                self.assertIsNone(self.campo(texto, 'data_vencimento')['valor'])

    def test_pagamento_por_evento_preserva_condicoes_e_pagina(self):
        texto = ('CLÁUSULA SEXTA: DA FORMA DE PAGAMENTO\n'
                 'Os pagamentos devidos serão efetuados, conforme a entrega do objeto, sendo\n'
                 'os pagamentos efetuados no prazo de 45 (quarenta e cinco) dias após protocolo da nota fiscal,\n'
                 'devidamente ATESTADA pelo responsável pelo recebimento.')
        campo = extrair_campos(['Apresentação.', texto])['data_vencimento']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor'], {'tipo': 'outra_regra', 'data': None, 'dia': None, 'regra': texto})
        self.assertEqual(campo['evidencias'][0]['pagina'], 2)
        extrair.verificar_evidencias({'data_vencimento': campo}, ['Apresentação.', texto])

    def test_pagamento_por_evento_dias_uteis_e_corridos(self):
        for unidade, evento in (('úteis', 'a contar do recebimento'),
                                ('corridos', 'após a apresentação'),
                                ('', 'a partir do protocolo')):
            texto = f'O pagamento será realizado no prazo de 15 dias {unidade} {evento} da nota fiscal.'
            with self.subTest(texto=texto):
                valor = self.campo(texto, 'data_vencimento')['valor']
                self.assertEqual(valor, {'tipo': 'outra_regra', 'data': None, 'dia': None, 'regra': texto})

    def test_pagamento_por_evento_nao_calcula_data(self):
        texto = 'Pagamento efetuado no prazo de 45 dias após o protocolo da nota fiscal em 01/02/2027.'
        valor = self.campo(texto, 'data_vencimento')['valor']
        self.assertIsNone(valor['data'])
        self.assertIsNone(valor['dia'])
        self.assertIn('01/02/2027', valor['regra'])

    def test_pagamento_por_evento_negado_ou_encargo_nao_e_vencimento(self):
        for texto in (
            'O pagamento não será efetuado no prazo de 20 dias após protocolo da nota fiscal.',
            'Multa paga em 20 dias após o protocolo da nota fiscal.',
            'Pagamento de juros efetuado no prazo de 20 dias após protocolo da nota fiscal.',
            'O pagamento será efetuado no prazo de 20 dias após o vencimento do contrato.',
        ):
            with self.subTest(texto=texto):
                self.assertIsNone(self.campo(texto, 'data_vencimento')['valor'])

    def test_pagamento_por_evento_incompleto_ou_invalido(self):
        for trecho in ('0 dias após protocolo da nota fiscal',
                       '-5 dias após protocolo da nota fiscal',
                       '2,5 dias após protocolo da nota fiscal',
                       '__ dias após protocolo da nota fiscal',
                       '20 dias após', '20 dias após o evento',
                       '20 dias após protocolo da nota fiscal em 31/02/2027'):
            with self.subTest(trecho=trecho):
                self.assertIsNone(self.campo('Pagamento efetuado no prazo de ' + trecho + '.', 'data_vencimento')['valor'])

    def test_evento_sem_obrigacao_de_pagamento_nao_e_vencimento(self):
        texto = 'O prazo para vistoria é de 20 dias após protocolo da nota fiscal.'
        self.assertIsNone(self.campo(texto, 'data_vencimento')['valor'])

    def test_pagamento_por_evento_nao_usa_numero_de_outra_obrigacao(self):
        texto = 'Pagamento efetuado após protocolo da nota fiscal; a vistoria será feita em 20 dias.'
        self.assertIsNone(self.campo(texto, 'data_vencimento')['valor'])

    def test_pagamento_por_evento_concorrente_exige_revisao(self):
        texto = ('Pagamento efetuado no prazo de 20 dias após protocolo da nota fiscal. '
                 'Pagamento efetuado no prazo de 40 dias após protocolo da nota fiscal.')
        campo = self.campo(texto, 'data_vencimento')
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])

    def test_vencimento_financiamento_nao_aceita_apenas_excecao_sem_carencia(self):
        paginas = [
            'O prazo de amortização é fixado no Quadro "Prazos", sendo as prestações mensais, '
            'vencendo-se a primeira no dia 18 do mês subsequente ao término da carência '
            'e as demais no mesmo dia dos meses seguintes.',
            'Caso não haja carência, a primeira prestação terá vencimento no dia 18 '
            'subsequente à liberação dos recursos.'
        ]
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertEqual({e['pagina'] for e in campo['evidencias']}, {1, 2})
        extrair.verificar_evidencias({'data_vencimento': campo}, paginas)

    def test_vencimento_juros_na_carencia_e_condicao_complementar(self):
        texto = ('O prazo de carência é fixado no quadro, vencendo -se a primeira prestação '
                 'de juros remuneratórios no dia 18 do terceiro mês subsequente à emissão.\n\n'
                 'Caso não haja carência, a primeira prestação terá vencimento no dia 18 subsequente à liberação.')
        campo = self.campo(texto, 'data_vencimento')
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertTrue(any('juros remuneratórios' in e['trecho'] for e in campo['evidencias']))

    def test_vencimento_feriado_em_clausula_separada_impede_dia_fixo(self):
        for dia in (7, 18, 28):
            texto = (f'As parcelas serão pagas todo dia {dia} de cada mês.\n\n'
                     'Todo vencimento de prestação de amortização de principal, de juros remuneratórios '
                     'e encargos moratórios que ocorra em sábados, domingos ou feriados será '
                     'deslocado para o primeiro dia útil subsequente.')
            with self.subTest(dia=dia):
                campo = self.campo(texto, 'data_vencimento')
                self.assertEqual(campo['estado'], 'ambiguo')
                self.assertIsNone(campo['valor'])
                self.assertTrue(any('dia útil' in e['trecho'] for e in campo['evidencias']))

    def test_vencimento_condicao_isolada_nao_cria_cronograma(self):
        for texto in (
            'O prazo de amortização prevê carência, vencendo-se a primeira no dia 18 do mês seguinte.',
            'Todo vencimento de prestação de amortização em feriados será deslocado para o primeiro dia útil subsequente.',
        ):
            with self.subTest(texto=texto):
                campo = self.campo(texto, 'data_vencimento')
                self.assertIsNone(campo['valor'])
                self.assertTrue(campo['evidencias'])

    def test_vencimento_condicoes_incompletas_preservam_abstencao(self):
        for dia in ('__', '0', '32'):
            texto = (f'O prazo de amortização prevê carência, vencendo-se a primeira no dia {dia} '
                     'do mês seguinte.\n\nAs parcelas serão pagas todo dia 18 de cada mês.')
            self.assertEqual(self.campo(texto, 'data_vencimento')['estado'], 'ambiguo')

    def test_vencimento_nao_usa_carencia_cobertura_seguro_ou_multa(self):
        principal = 'As parcelas serão pagas todo dia 18 de cada mês.'
        for adicional in (
            'O prazo de carência da cobertura é de 90 dias.',
            'Entregar recibo de seguro até 5 dias antes do vencimento de cada parcela.',
            'O vencimento da multa em feriados será deslocado para o primeiro dia útil subsequente.',
            'O vencimento antecipado de prestação de amortização ocorre em caso de atraso, inclusive em feriados.',
        ):
            campo = self.campo(principal + '\n\n' + adicional, 'data_vencimento')
            self.assertEqual(campo['valor']['dia'], 18)

    def test_vencimento_condicao_identificada_nao_altera_outros_campos(self):
        texto = ('O prazo de amortização prevê carência, vencendo-se a primeira no dia 18 do mês seguinte.\n\n'
                 'Caso não haja carência, a primeira prestação terá vencimento no dia 18 subsequente à liberação.')
        campos = extrair_campos([texto])
        for nome in ('valor_parcela', 'numero_parcelas', 'vigencia', 'regra_reajuste'):
            self.assertIsNone(campos[nome]['valor'])

    def test_carencia_juros_apos_liberacao_preserva_condicao_isolada(self):
        for primeira in ('primeira', 'pr imeira'):
            texto = (f'Havendo prazo de carência, a {primeira} prestação de juros remuneratórios '
                     'deverá ser paga 30 dias após a liberação do crédito, '
                     'vencendo-se as demais no mesmo dia dos meses subsequentes.')
            campo = self.campo(texto, 'data_vencimento')
            self.assertEqual(campo['estado'], 'nao_identificado')
            self.assertIsNone(campo['valor'])
            self.assertEqual(campo['evidencias'], [{'pagina': 1, 'trecho': texto}])
            self.assertIn('cronograma', campo['motivo'])

    def test_carencia_juros_por_evento_impede_vencimento_mensal_parcial(self):
        paginas = ['As parcelas serão pagas todo dia 18 de cada mês.',
                   'Havendo carência, a primeira prestação de juros será paga '
                   '30 dias após a liberação do crédito.']
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertEqual({e['pagina'] for e in campo['evidencias']}, {1, 2})
        extrair.verificar_evidencias({'data_vencimento': campo}, paginas)

    def test_frequencias_por_fase_nao_viram_vencimento_unico(self):
        texto = ('O montante será exigível trimestralmente durante o prazo de carência '
                 'e mensalmente durante o período de amortização, juntamente com as prestações do principal.')
        campo = self.campo(texto, 'data_vencimento')
        self.assertEqual(campo['estado'], 'nao_identificado')
        self.assertIsNone(campo['valor'])
        self.assertEqual(campo['evidencias'][0]['trecho'], texto)

    def test_dia_expresso_com_fases_nao_vira_dia_mensal(self):
        texto = ('Os juros serão exigíveis sempre no dia 18, observadas as periodicidades: '
                 'trimestralmente durante a carência e mensalmente durante a amortização do principal.')
        campo = self.campo(texto, 'data_vencimento')
        self.assertIsNone(campo['valor'])
        self.assertEqual(campo['evidencias'][0]['trecho'], texto)

    def test_fases_em_paginas_distintas_complementam_excecao_e_dia_util(self):
        paginas = ['Caso não haja carência, a primeira prestação terá vencimento no dia 18 subsequente à liberação.',
                   'O montante será exigível trimestralmente durante a carência e mensalmente durante a amortização do principal.',
                   'Todo vencimento de prestação de amortização em feriados será deslocado para o primeiro dia útil subsequente.']
        campo = extrair_campos(paginas)['data_vencimento']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertEqual({e['pagina'] for e in campo['evidencias']}, {1, 2, 3})
        extrair.verificar_evidencias({'data_vencimento': campo}, paginas)

    def test_prazo_relativo_incompleto_nao_calcula_data(self):
        for prazo in ('__', '0', '30'):
            texto = ('Crédito liberado em 01/10/2026.\n\nHavendo carência, a primeira '
                     f'prestação de juros será paga {prazo} dias após a liberação do crédito.')
            campo = self.campo(texto, 'data_vencimento')
            self.assertEqual(campo['estado'], 'nao_identificado')
            self.assertIsNone(campo['valor'])
            self.assertEqual(len(campo['evidencias']), 1)

    def test_frequencia_de_calculo_ou_seguro_nao_cria_cronograma(self):
        principal = 'As parcelas serão pagas todo dia 18 de cada mês.'
        for adicional in ('Os juros serão calculados mensalmente durante a carência e a amortização.',
                          'A primeira prestação do seguro será paga 30 dias após a liberação da cobertura, com carência de 90 dias.',
                          'A multa será exigível mensalmente durante a carência e a amortização.'):
            campo = self.campo(principal + '\n\n' + adicional, 'data_vencimento')
            self.assertEqual(campo['estado'], 'encontrado')
            self.assertEqual(campo['valor']['dia'], 18)

    def test_vigencia_em_branco_com_posse_posterior_nao_e_encontrada(self):
        texto = ('CLÁUSULA SEGUNDA - DO PRAZO DE LOCAÇÃO\n'
                 'O contrato terá prazo de (    ) meses, início em   /   /   e término em   /   /  .\n'
                 'Após o fim do prazo, se o locatário continuar na posse do imóvel, a locação será prorrogada.')
        campo = self.campo(texto, 'vigencia')
        self.assertIsNone(campo['valor'])
        self.assertNotEqual(campo['estado'], 'encontrado')

    def test_vigencia_posse_incidental_nao_define_inicio(self):
        for texto in ('Durante a vigência do contrato, a posse dos bens será fiscalizada.',
                      'O prazo da locação está no anexo; a assinatura será arquivada.',
                      'Durante a vigência do contrato o uso do imóvel está condicionado à autorização.'):
            with self.subTest(texto=texto):
                self.assertIsNone(self.campo(texto, 'vigencia')['valor'])

    def test_vigencia_inicio_por_evento_explicito_sem_calcular_data(self):
        for texto in ('O prazo da locação se inicia na data da assinatura.',
                      'A vigência terá início na efetiva posse.',
                      'A vigência é condicionada à assinatura.'):
            with self.subTest(texto=texto):
                valor = self.campo(texto, 'vigencia')['valor']
                self.assertIsNone(valor['inicio'])
                self.assertEqual(valor['regra'], texto)

    def test_vigencia_data_vazia_nao_e_ocultada_por_duracao(self):
        campo = self.campo('Vigência de 18 meses, início em / / e término em / / .', 'vigencia')
        self.assertIsNone(campo['valor'])

    def test_vigencia_url_nao_e_lacuna_de_data(self):
        texto = ('CLÁUSULA PRIMEIRA: DA VIGÊNCIA\nVigência de 18 meses.\n'
                 'CLÁUSULA SEGUNDA: DA VERIFICAÇÃO\nDurante a vigência do contrato, consultar https://example.invalid/documento.')
        self.assertEqual(self.campo(texto, 'vigencia')['valor']['duracao_meses'], 18)

    def test_mensalidade_com_instrucao_apos_vencimento_preserva_regra(self):
        texto = ('A anuidade será paga em 12 parcelas mensais, sendo a matrícula a primeira parcela '
                 'e as seguintes no dia 9 de cada mês, a contar de março; após o vencimento, pagar no banco emissor.')
        campo = self.campo(texto, 'data_vencimento')
        self.assertEqual(campo['valor'], {'tipo': 'outra_regra', 'data': None, 'dia': None, 'regra': texto})

    def test_vencimento_nao_usa_valor_ou_quantidade_como_prazo(self):
        for texto in ('O vencimento será definido na matrícula, com 12 parcelas de R$ 100,00, se aprovado o cadastro.',
                      'A primeira parcela tem vencimento a combinar e custa R$ 200,00.',
                      'O vencimento será escolhido na matrícula; o curso dura 18 meses.'):
            with self.subTest(texto=texto):
                self.assertIsNone(self.campo(texto, 'data_vencimento')['valor'])

    def test_vencimento_condicional_exige_dia_ou_data_associados(self):
        texto = 'Vencimento no dia 18 do mês seguinte, se a nota for aprovada.'
        valor = self.campo(texto, 'data_vencimento')['valor']
        self.assertEqual(valor['regra'], texto)
        self.assertIsNone(valor['data'])
        self.assertIsNone(valor['dia'])

    def test_data_impossivel_nao_e_aceita(self):
        self.assertIsNone(self.campo('Vencimento em 30/02/2027.', 'data_vencimento')['valor'])
        self.assertIsNone(self.campo('Vencimento todo dia 32.', 'data_vencimento')['valor'])

    def test_assinatura_nao_define_vigencia(self):
        self.assertIsNone(self.campo('Assinatura em 01/01/2027.', 'vigencia')['valor'])

    def test_vigencia_nao_calcula_fim(self):
        valor = self.campo('Vigência de 12 meses a partir de 01/01/2027.', 'vigencia')['valor']
        self.assertEqual(valor['inicio'], '2027-01-01')
        self.assertIsNone(valor['fim'])

    def test_vigencia_datas_invertidas(self):
        self.assertIsNone(self.campo('Vigência de 31/12/2027 a 01/01/2027.', 'vigencia')['valor'])

    def test_vigencia_datas_por_extenso_e_condicoes_em_paginas_distintas(self):
        paginas = [
            '6.1 O presente contrato terá início 03 de março de 2027, considerada a efetiva posse do imóvel.\n'
            '6.2 O prazo de locação do imóvel se inicia na data da assinatura deste Contrato e o término está previsto para o dia 03 de março de 2028.\n'
            '6.3 O contrato poderá ser prorrogado por iguais períodos mediante aditivo.\n'
            '7.1 O reajuste anual será contado da vigência do contrato.',
            '11.1 O locatário poderá permanecer no imóvel após o vencimento do contrato por 30 dias. Neste período, não pagará aluguel, apenas água e energia.\n'
            '14.2 O locatário poderá rescindir o contrato mediante aviso prévio de 30 dias.'
        ]
        campo = extrair_campos(paginas)['vigencia']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['inicio'], '2027-03-03')
        self.assertEqual(campo['valor']['fim'], '2028-03-03')
        self.assertIsNone(campo['valor']['duracao_meses'])
        for fragmento in ('efetiva posse', 'assinatura', 'aditivo', 'não pagará aluguel', 'aviso prévio'):
            self.assertIn(fragmento, campo['valor']['regra'])
        self.assertNotIn('reajuste anual', campo['valor']['regra'])
        extrair.verificar_evidencias({'vigencia': campo}, paginas)

    def test_vigencia_datas_complementares_e_repetidas(self):
        texto = 'Vigência com início em 04/05/2027. Vigência com término em 04/05/2028. Vigência com início em 04/05/2027.'
        valor = self.campo(texto, 'vigencia')['valor']
        self.assertEqual((valor['inicio'], valor['fim']), ('2027-05-04', '2028-05-04'))

    def test_vigencia_inicios_conflitantes_e_datas_invalidas(self):
        for texto in (
            'Vigência com início em 04/05/2027. Vigência com início em 05/05/2027.',
            'Vigência de 31 de fevereiro de 2027 a 01 de março de 2028.',
            'Vigência de 01 de março de 2028 a 01 de março de 2027.',
            'O contrato não terá início em 01 de março de 2027.',
        ):
            with self.subTest(texto=texto):
                campo = self.campo(texto, 'vigencia')
                self.assertEqual(campo['estado'], 'ambiguo')
                self.assertIsNone(campo['valor'])

    def test_vigencia_assinatura_sem_data_nao_inventa_inicio(self):
        texto = 'O prazo da locação se inicia na data da assinatura e termina em 05 de maio de 2028.'
        valor = self.campo(texto, 'vigencia')['valor']
        self.assertIsNone(valor['inicio'])
        self.assertEqual(valor['fim'], '2028-05-05')
        self.assertIn('assinatura', valor['regra'])

    def test_vigencia_renovacao_nao_sobrescreve_fim_ou_duracao(self):
        texto = ('6.1 Vigência de 01/01/2027 a 31/12/2027, pelo prazo de 12 meses.\n'
                 '6.2 O contrato poderá ser prorrogado por 24 meses até 31/12/2029.')
        valor = self.campo(texto, 'vigencia')['valor']
        self.assertEqual(valor['fim'], '2027-12-31')
        self.assertEqual(valor['duracao_meses'], 12)
        self.assertIn('31/12/2029', valor['regra'])

    def test_vigencia_aviso_ou_reajuste_isolados_nao_definem_prazo(self):
        for texto in ('Reajuste anual contado da vigência do contrato.',
                      'O imóvel será entregue antes do fim do prazo contratual com aviso prévio de 30 dias.'):
            self.assertIsNone(self.campo(texto, 'vigencia')['valor'])

    def test_vigencia_indeterminada_com_prorrogacao_preservada(self):
        valor = self.campo('A vigência é por prazo indeterminado.', 'vigencia')['valor']
        self.assertEqual(valor['prazo'], 'indeterminado')
        self.assertIsNone(valor['fim'])

    def test_vigencia_duracao_explicita_sem_calcular_datas(self):
        valor = self.campo('Prazo da locação de 18 meses, com início em 02 de junho de 2027.', 'vigencia')['valor']
        self.assertEqual(valor['duracao_meses'], 18)
        self.assertEqual(valor['inicio'], '2027-06-02')
        self.assertIsNone(valor['fim'])

    def test_vigencia_meses_portugues_e_bissexto(self):
        for texto, inicio in (('Vigência a partir de 29 de fevereiro de 2028.', '2028-02-29'),
                              ('Vigência a partir de 1 de dezembro de 2027.', '2027-12-01')):
            self.assertEqual(self.campo(texto, 'vigencia')['valor']['inicio'], inicio)

    def test_vigencia_nao_usa_carimbo_digital_como_data_contratual(self):
        texto = ('6.1 O contrato terá início 01 de abril de 2027.\n'
                 '6.2 O prazo da locação termina em 01 de abril de 2028.\n'
                 '9.1 A vistoria realizada no início da locação deve ser respeitada.\n'
                 'Documento Assinado Digitalmente por: EXEMPLO FICTÍCIO - 07/09/2029 12:00:00\n'
                 'Acesse em: https://example.invalid/validacao')
        campo = self.campo(texto, 'vigencia')
        self.assertEqual(campo['valor']['inicio'], '2027-04-01')
        self.assertEqual(campo['valor']['fim'], '2028-04-01')
        self.assertFalse(any('Documento Assinado' in e['trecho'] for e in campo['evidencias']))

    def test_vigencia_mencao_a_fiscalizacao_nao_concorre_com_prazo(self):
        texto = ('6.1 Vigência de 01/04/2027 a 01/04/2028.\n'
                 '17.1 Durante a vigência deste contrato haverá fiscalização.\n'
                 'Documento Assinado Digitalmente por: EXEMPLO - 07/09/2029 12:00:00')
        self.assertEqual(self.campo(texto, 'vigencia')['valor']['fim'], '2028-04-01')

    def test_vigencia_titulo_e_corpo_preservam_prazo_e_condicoes(self):
        texto = ('CLÁUSULA OITAVA: DA VIGÊNCIA\n'
                 'O presente instrumento terá vigência por 18 (dezoito) meses, a partir da assinatura.\n'
                 'O contrato poderá ser prorrogado mediante termo aditivo.')
        campo = self.campo(texto, 'vigencia')
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['duracao_meses'], 18)
        self.assertIsNone(campo['valor']['inicio'])
        self.assertIsNone(campo['valor']['fim'])
        self.assertIn('assinatura', campo['valor']['regra'])
        self.assertIn('termo aditivo', campo['valor']['regra'])
        extrair.verificar_evidencias({'vigencia': campo}, [texto])

    def test_vigencia_condicao_acessoria_preserva_so_subitem_pertinente(self):
        paginas = ['Vigência de 18 meses.',
                   'CLÁUSULA NONA: DOS DADOS\n'
                   'a) As partes armazenarão os dados com segurança.\n'
                   'b) A empresa permitirá o acesso aos dados.\n'
                   'c) Em caso de descumprimento, poderá rescindir o contrato.\n'
                   'A comunicação deverá ser feita por escrito.']
        campo = extrair_campos(paginas)['vigencia']
        self.assertNotIn('armazenarão', campo['valor']['regra'])
        self.assertNotIn('acesso aos dados', campo['valor']['regra'])
        self.assertIn('c) Em caso de descumprimento', campo['valor']['regra'])
        self.assertIn('A comunicação deverá ser feita por escrito.', campo['valor']['regra'])
        self.assertEqual(campo['evidencias'][-1]['pagina'], 2)
        extrair.verificar_evidencias({'vigencia': campo}, paginas)

    def test_vigencia_condicao_acessoria_nao_herda_sujeito_de_outro_item(self):
        paginas = ['Vigência de 18 meses.', 'CLÁUSULA NONA: DAS OBRIGAÇÕES\n'
                   'a) O contrato exige sigilo.\n'
                   'b) A empresa deve renovar a licença do programa.']
        campo = extrair_campos(paginas)['vigencia']
        self.assertIsNone(campo['valor']['regra'])
        self.assertEqual(len(campo['evidencias']), 1)

    def test_vigencia_clasula_com_erro_grafico_separa_foros_e_condicoes(self):
        texto = ('CLÁUSULA PRIMEIRA: DA VIGÊNCIA\nVigência de 18 meses.\n'
                 'CLÁUSULA SEGUNDA: DA RESCISÃO\nO contrato poderá ser rescindido mediante aviso.\n'
                 'CLÁSULA TERCEIRA: DO FORO\nFica eleito o foro da comarca fictícia.')
        campo = self.campo(texto, 'vigencia')
        self.assertIn('rescindido', campo['valor']['regra'])
        self.assertNotIn('foro', campo['valor']['regra'].lower())
        extrair.verificar_evidencias({'vigencia': campo}, [texto])

    def test_vigencia_carimbo_terminal_nao_vira_regra(self):
        texto = ('CLÁUSULA PRIMEIRA: DA VIGÊNCIA\n'
                 'Vigência de 18 meses a partir da assinatura.\n'
                 'Assinado por 2 pessoas: PESSOA FICTÍCIA A e PESSOA FICTÍCIA B\n'
                 'Para verificar a validade das assinaturas, acesse https://example.invalid/validar\n')
        campo = self.campo(texto, 'vigencia')
        self.assertNotIn('Assinado por', campo['valor']['regra'])
        self.assertNotIn('example.invalid', campo['valor']['regra'])
        self.assertEqual(campo['valor']['duracao_meses'], 18)
        extrair.verificar_evidencias({'vigencia': campo}, [texto])

    def test_vigencia_carimbo_nao_descarta_clausula_posterior(self):
        texto = ('Vigência de 18 meses.\n'
                 'Assinado por 2 pessoas: PESSOAS FICTÍCIAS\n'
                 'Para verificar a validade das assinaturas, acesse https://example.invalid\n'
                 'CLÁUSULA SEGUNDA: DO PRAZO\nPrazo contratual de 24 meses.')
        self.assertEqual(self.campo(texto, 'vigencia')['estado'], 'ambiguo')

    def test_vigencia_principal_com_subitens_nao_perde_condicoes(self):
        texto = ('CLÁUSULA PRIMEIRA: DA VIGÊNCIA\nVigência de 18 meses a partir da assinatura.\n'
                 'a) O contrato poderá ser prorrogado mediante aditivo.\n'
                 'b) A solicitação depende de concordância das partes.')
        campo = self.campo(texto, 'vigencia')
        self.assertIn('b) A solicitação', campo['valor']['regra'])
        extrair.verificar_evidencias({'vigencia': campo}, [texto])

    def test_vigencia_lista_dependente_da_introducao_preservada(self):
        for introducao in ('O contrato poderá ser rescindido nas seguintes hipóteses:',
                           'A permanência no contrato depende dos seguintes requisitos:'):
            texto = ('CLÁUSULA NONA: DAS OBRIGAÇÕES\n' + introducao + '\n'
                     'a) apresentação da documentação;\nb) pagamento integral da contribuição.')
            paginas = ['Vigência de 18 meses.', texto]
            campo = extrair_campos(paginas)['vigencia']
            self.assertIn(texto, campo['valor']['regra'])
            extrair.verificar_evidencias({'vigencia': campo}, paginas)

    def test_vigencia_subitem_com_remissao_nao_perde_requisitos(self):
        texto = ('CLÁUSULA NONA: DAS OBRIGAÇÕES\n'
                 'a) Apresentar os documentos.\n'
                 'b) O descumprimento dos requisitos desta cláusula permite rescindir o contrato.')
        campo = extrair_campos(['Vigência de 18 meses.', texto])['vigencia']
        self.assertIn(texto, campo['valor']['regra'])

    def test_vigencia_titulo_de_rescisao_mantem_hipoteses(self):
        texto = ('CLÁUSULA NONA: DA RESCISÃO DO CONTRATO\n'
                 'a) Por solicitação formal.\nb) Por descumprimento das obrigações.')
        campo = extrair_campos(['Vigência de 18 meses.', texto])['vigencia']
        self.assertIn(texto, campo['valor']['regra'])

    def test_vigencia_titulos_isolados_nao_fornecem_valores(self):
        for texto in ('CLÁUSULA OITAVA: VIGÊNCIA DE 18 MESES',
                      'CLÁUSULA OITAVA: VIGÊNCIA DE 01/01/2027 A 01/01/2028\n  ',
                      'CLÁUSULA OITAVA: DA VIGÊNCIA\nCLÁUSULA NONA: DAS OBRIGAÇÕES'):
            with self.subTest(texto=texto):
                self.assertIsNone(self.campo(texto, 'vigencia')['valor'])

    def test_vigencia_titulo_reajuste_mantem_contexto_com_linha_vazia(self):
        for separador in ('\n', '\n\n'):
            texto = ('CLÁUSULA SÉTIMA: DO REAJUSTE' + separador +
                     'Aplicável à locação com prazo de vigência de 18 meses.')
            self.assertIsNone(self.campo(texto, 'vigencia')['valor'])

    def test_vigencia_cabecalho_quebrado_nao_acrescenta_condicao(self):
        paginas = ['Vigência de 18 meses.',
                   'CLÁUSULA NONA: DA OCUPAÇÃO APÓS O\nVENCIMENTO DO CONTRATO']
        campo = extrair_campos(paginas)['vigencia']
        self.assertIsNone(campo['valor']['regra'])
        self.assertTrue(all(e['pagina'] == 1 for e in campo['evidencias']))

    def test_vigencia_cabecalho_quebrado_com_corpo(self):
        texto = ('CLÁUSULA OITAVA: DO PRAZO DE\nVIGÊNCIA DO CONTRATO\n'
                 'O contrato terá vigência de 18 meses.')
        self.assertEqual(self.campo(texto, 'vigencia')['valor']['duracao_meses'], 18)

    def test_vigencia_itens_numerados_apos_titulo(self):
        texto = ('CLÁUSULA OITAVA: DA VIGÊNCIA\n'
                 '8.1 Vigência de 01/02/2027 a 01/02/2028.\n'
                 '8.2 O contrato poderá ser prorrogado por 24 meses.')
        valor = self.campo(texto, 'vigencia')['valor']
        self.assertEqual(valor['fim'], '2028-02-01')
        self.assertIsNone(valor['duracao_meses'])
        self.assertIn('prorrogado', valor['regra'])

    def test_vigencia_clausulas_com_prazos_conflitantes(self):
        texto = ('CLÁUSULA PRIMEIRA: DA VIGÊNCIA\nVigência de 18 meses.\n'
                 'CLÁUSULA SEGUNDA: DO PRAZO\nPrazo contratual de 24 meses.')
        campo = self.campo(texto, 'vigencia')
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])

    def test_vigencia_clausula_com_prazo_invalido_ou_negado(self):
        for corpo in ('Vigência de 0 meses.', 'O contrato não terá vigência de 18 meses.'):
            with self.subTest(corpo=corpo):
                campo = self.campo('CLÁUSULA OITAVA: DA VIGÊNCIA\n' + corpo, 'vigencia')
                self.assertEqual(campo['estado'], 'ambiguo')
                self.assertIsNone(campo['valor'])

    def test_vigencia_judicial_nao_e_prazo_do_contrato(self):
        texto = ('CLÁUSULA TRINTA: DA RETIRADA DE ALUNOS\n'
                 'O contrato exige decisão judicial com comprovação de vigência.\n'
                 'A multa é R$ ____ por atraso; assinam o contrato em / / .')
        self.assertEqual(self.campo(texto, 'vigencia')['estado'], 'nao_identificado')

    def test_vigencia_datas_de_parcelas_nao_criam_conflito(self):
        texto = ('CLÁUSULA TERCEIRA: DO PAGAMENTO\n'
                 'O contrato será pago em parcelas com vencimento em 15/08/2027 e 15/09/2027. '
                 'A desistência deve ocorrer antes do início das aulas.')
        self.assertEqual(self.campo(texto, 'vigencia')['estado'], 'nao_identificado')

    def test_vigencia_iniciativa_privada_nao_e_inicio(self):
        texto = ('CLÁUSULA FINAL\nEste contrato respeita a livre iniciativa privada.\n'
                 'Assinaturas: __________\nData: / / .')
        self.assertEqual(self.campo(texto, 'vigencia')['estado'], 'nao_identificado')

    def test_vigencia_equivalente_ao_curso_preserva_plano(self):
        texto = ('6.5. O presente contrato terá PRAZO de vigência equivalente ao curso '
                 'objeto de matrícula, nos termos do plano escolhido pelo aluno.')
        campo = self.campo(texto, 'vigencia')
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['prazo'], 'nao_informado')
        for key in ('inicio', 'fim', 'duracao_meses'):
            self.assertIsNone(campo['valor'][key])
        self.assertEqual(campo['valor']['regra'], texto)
        self.assertEqual(campo['confianca'], 'media')

    def test_vigencia_conclusao_atividades_e_documentos_preserva_condicoes(self):
        texto = ('6.1) O presente contrato terá vigência até a efetiva conclusão das '
                 'atividadesdidático-pedagógicas e o recebimento dos documentos finais, '
                 'podendo serrescindidoantesdoprazo, observadas as disposições da cláusula quarta.')
        campo = extrair_campos(['Introdução.', texto])['vigencia']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['regra'], texto)
        self.assertIsNone(campo['valor']['fim'])
        self.assertEqual(campo['evidencias'][0]['pagina'], 2)
        extrair.verificar_evidencias({'vigencia': campo}, ['Introdução.', texto])

    def test_vigencia_curso_separa_item_de_trancamento(self):
        texto = ('6.5. O contrato terá prazo de vigência equivalente ao curso objeto de matrícula.\n'
                 '6.6. O retorno ao aluno ocorrerá em 05 dias úteis após protocolo de trancamento.')
        campo = self.campo(texto, 'vigencia')
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertNotIn('05 dias', campo['valor']['regra'])

    def test_vigencia_curso_separa_titulo_colado_e_foro(self):
        texto = ('CLÁUSULASEXTA- DAVIGÊNCIADOCONTRATO:\n'
                 '6.1) O contrato terá vigência até a conclusão do curso, podendo ser rescindido.\n'
                 'CLÁUSULASÉTIMA- DOFORO:\n7.1) Fica eleito o foro da cidade fictícia.')
        campo = self.campo(texto, 'vigencia')
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertNotIn('foro', campo['valor']['regra'].lower())
        self.assertIn('rescindido', campo['valor']['regra'])
        extrair.verificar_evidencias({'vigencia': campo}, [texto])

    def test_vigencia_curso_evento_incidental_nao_define_prazo(self):
        for texto in ('O contrato exige pagamento até a conclusão do curso.',
                      'O aluno receberá certificado após a conclusão do curso.',
                      'Durante a vigência do contrato serão realizadas atividades didático-pedagógicas.',
                      'A bolsa terá vigência até a conclusão do curso.'):
            with self.subTest(texto=texto):
                self.assertIsNone(self.campo(texto, 'vigencia')['valor'])

    def test_vigencia_curso_negacao_e_alternativa(self):
        for texto in ('O contrato não terá vigência até a conclusão do curso.',
                      'O contrato terá vigência até a conclusão do curso ou até a desistência.',
                      'O contrato terá vigência equivalente ao curso ou ao semestre.'):
            with self.subTest(texto=texto):
                self.assertEqual(self.campo(texto, 'vigencia')['estado'], 'ambiguo')

    def test_vigencia_curso_lacunas_na_regra(self):
        for texto in ('O contrato terá vigência equivalente ao curso ______.',
                      'O contrato terá vigência até a conclusão do curso, podendo ser rescindido em ______.'):
            with self.subTest(texto=texto):
                self.assertNotEqual(self.campo(texto, 'vigencia')['estado'], 'encontrado')

    def test_vigencia_curso_nao_herda_meses_da_descricao(self):
        campo = extrair_campos(['Curso de 9 meses.\n\nO contrato terá vigência até a conclusão do curso.'])['vigencia']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertIsNone(campo['valor']['duracao_meses'])
        self.assertIsNone(campo['valor']['fim'])

    def test_vigencia_curso_prazo_concorrente_exige_revisao(self):
        for outra in ('Vigência de 12 meses.', 'A vigência é por prazo indeterminado.',
                      'O contrato tem duração anual.', 'O contrato termina em 01/12/2027.'):
            with self.subTest(outra=outra):
                campo = extrair_campos(['O contrato terá vigência até a conclusão do curso.', outra])['vigencia']
                self.assertEqual(campo['estado'], 'ambiguo')
                self.assertIsNone(campo['valor'])

    def test_vigencia_curso_eventos_distintos_exigem_revisao(self):
        campo = extrair_campos(['O contrato terá vigência até a conclusão do curso.',
                               'O contrato terá vigência equivalente ao curso objeto de matrícula.'])['vigencia']
        self.assertEqual(campo['estado'], 'ambiguo')

    def test_vigencia_curso_regra_repetida_nao_cria_conflito(self):
        texto = 'O contrato terá vigência até a conclusão do curso.'
        campo = extrair_campos([texto, texto])['vigencia']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(len(campo['evidencias']), 2)

    def test_vigencia_curso_rescisao_separada_preservada(self):
        campo = extrair_campos(['O contrato terá vigência até a conclusão do curso.',
                               'O contrato poderá ser rescindido mediante aviso de 30 dias.'])['vigencia']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertIn('aviso de 30 dias', campo['valor']['regra'])
        self.assertIsNone(campo['valor']['duracao_meses'])

    def test_vigencia_duracao_anual_literal_sem_calendario(self):
        texto = ('CLÁUSULA SÉTIMA\nO presente contrato tem duração anual, podendo ser renovado '
                 'para os anos subsequentes mediante matrícula.')
        campo = extrair_campos(['Introdução.', texto])['vigencia']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['prazo'], 'determinado')
        for key in ('inicio', 'fim', 'duracao_meses'):
            self.assertIsNone(campo['valor'][key])
        self.assertIn('duração anual', campo['valor']['regra'])
        self.assertIn('renovado', campo['valor']['regra'])
        extrair.verificar_evidencias({'vigencia': campo}, ['Introdução.', texto])

    def test_vigencia_anuidade_e_ano_letivo_nao_definem_duracao(self):
        for texto in ('A anuidade do contrato é paga em parcelas durante o ano letivo de 2027.',
                      'O contrato será renovado no ano letivo seguinte mediante matrícula.'):
            self.assertIsNone(self.campo(texto, 'vigencia')['valor'])

    def test_vigencia_anual_negada_ou_alternativa_exige_revisao(self):
        for texto in ('O contrato não tem duração anual.',
                      'O contrato tem duração anual ou semestral.'):
            self.assertEqual(self.campo(texto, 'vigencia')['estado'], 'ambiguo')

    def test_vigencia_principal_nao_concorre_com_datas_incidentais(self):
        texto = ('CLÁUSULA PRIMEIRA\nVigência de 18 meses.\n'
                 'CLÁUSULA SEGUNDA\nO contrato prevê matrícula em 15/08/2027 e início das aulas em 01/09/2027.')
        campo = self.campo(texto, 'vigencia')
        self.assertEqual(campo['valor']['duracao_meses'], 18)
        self.assertIsNone(campo['valor']['inicio'])
        self.assertNotIn('matrícula', str(campo['evidencias']))

    def test_vigencia_minima_preserva_qualificador_sem_inferir_fim(self):
        for texto in ('O contrato vigorará pelo prazo mínimo de 18 meses.',
                      'O presente contrato tem prazo de vigência mínima de 18 meses.'):
            with self.subTest(texto=texto):
                campo = self.campo(texto, 'vigencia')
                self.assertEqual(campo['estado'], 'encontrado')
                self.assertEqual(campo['valor']['duracao_meses'], 18)
                self.assertIsNone(campo['valor']['inicio'])
                self.assertIsNone(campo['valor']['fim'])
                self.assertEqual(campo['valor']['regra'], texto)

    def test_vigencia_minima_eventos_alternativos_sem_escolher_data(self):
        texto = ('5.1 O contrato vigorará pelo prazo mínimo de 18 meses, a contar '
                 'da data de assinatura deste instrumento ou da data da assinatura da Proposta de '
                 'Adesão ou da data de pagamento da Mensalidade, o que ocorrer primeiro.\n'
                 '5.2 Este contrato tem renovação automática por prazo indeterminado.')
        campo = self.campo(texto, 'vigencia')
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['duracao_meses'], 18)
        self.assertEqual(campo['valor']['prazo'], 'determinado')
        self.assertIsNone(campo['valor']['inicio'])
        self.assertIsNone(campo['valor']['fim'])
        self.assertIn('o que ocorrer primeiro', campo['valor']['regra'])
        self.assertIn('renovação automática', campo['valor']['regra'])
        self.assertIsNone(self.campo(texto, 'numero_parcelas')['valor'])

    def test_vigencia_eventos_nao_liberam_alternativas_de_prazo(self):
        for texto in (
            'O contrato vigorará pelo prazo mínimo de 18 ou 24 meses.',
            'O contrato vigorará pelo prazo mínimo de 18 meses ou 24 meses.',
            'O contrato vigorará pelo prazo mínimo de 18 meses, a contar da data de assinatura deste instrumento ou da data de pagamento da Mensalidade.',
            'O contrato vigorará pelo prazo mínimo de 18 meses ou 24 meses, a contar da data de assinatura deste instrumento ou da data de pagamento da Mensalidade, o que ocorrer primeiro.',
        ):
            with self.subTest(texto=texto):
                self.assertNotEqual(self.campo(texto, 'vigencia')['estado'], 'encontrado')

    def test_vigencia_minima_invalida_negada_ou_concorrente(self):
        for texto in ('O contrato tem prazo de vigência mínima de 0 meses.',
                      'O contrato não tem prazo de vigência mínima de 18 meses.',
                      'O contrato tem prazo de vigência mínima de 18 meses.\n\nPrazo contratual de 24 meses.'):
            with self.subTest(texto=texto):
                self.assertEqual(self.campo(texto, 'vigencia')['estado'], 'ambiguo')

    def test_vigencia_saude_inicio_e_minimo_em_paginas_distintas(self):
        paginas = [
            'CLÁUSULA 6ª - DURAÇÃO DO CONTRATO\n\nParágrafo primeiro. '
            'O início de vigência do contrato dar-se-á no dia 01/02/2027.\n\n'
            'D4Sign 00000000-0000-0000-0000-000000000000 - Para confirmar as assinaturas acesse https://example.org\n'
            'Documento assinado eletronicamente em 02/02/2027.',
            'Parágrafo segundo. O início da vigência para cada um dos beneficiários '
            'subordina-se ao recebimento do formulário, na data indicada no documento.\n\n'
            'Parágrafo sexto. O presente contrato tem prazo de vigência mínima de 18 meses.\n\n'
            'Parágrafo sétimo. Findo o prazo de vigência mínima, o contrato será renovado '
            'automaticamente por prazo indeterminado.\n\n'
            'CLÁUSULA 7ª - PERÍODOS DE CARÊNCIA\nCarência de 24 meses para cobertura específica.'
        ]
        campo = extrair_campos(paginas)['vigencia']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['inicio'], '2027-02-01')
        self.assertEqual(campo['valor']['duracao_meses'], 18)
        self.assertIsNone(campo['valor']['fim'])
        self.assertIn('beneficiários', campo['valor']['regra'])
        self.assertIn('renovado', campo['valor']['regra'])
        self.assertNotIn('D4Sign', str(campo['evidencias']))
        self.assertNotIn('Carência de 24', str(campo['evidencias']))
        self.assertEqual({e['pagina'] for e in campo['evidencias']}, {1, 2})
        extrair.verificar_evidencias({'vigencia': campo}, paginas)

    def test_vigencia_saude_data_invalida_exige_revisao(self):
        campo = self.campo('O início de vigência do contrato dar-se-á no dia 31/02/2027.', 'vigencia')
        self.assertEqual(campo['estado'], 'ambiguo')

    def test_vigencia_beneficiario_nao_sobrescreve_inicio_contratual(self):
        texto = ('CLÁUSULA 6ª - DURAÇÃO DO CONTRATO\n'
                 'Parágrafo primeiro. O início de vigência do contrato dar-se-á no dia 01/02/2027.\n\n'
                 'Parágrafo segundo. O início da vigência para cada um dos beneficiários será em 03/02/2027.\n\n'
                 'Parágrafo terceiro. Na adesão do beneficiário por portabilidade de carências, '
                 'o início de vigência dar-se-á a partir da comunicação de aceite.')
        campo = self.campo(texto, 'vigencia')
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['inicio'], '2027-02-01')
        self.assertIn('03/02/2027', campo['valor']['regra'])
        self.assertIn('comunicação de aceite', campo['valor']['regra'])

    def test_vigencia_beneficiario_ou_carencia_isolados_nao_definem_contrato(self):
        for texto in ('O início da vigência para cada um dos beneficiários será em 03/02/2027.',
                      'CLÁUSULA 7ª - PERÍODOS DE CARÊNCIA\nO contrato prevê carência de 24 meses.'):
            self.assertIsNone(self.campo(texto, 'vigencia')['valor'])

    def test_vigencia_clausula_preserva_pagina_fisica(self):
        paginas = ['Apresentação do documento.',
                   'CLÁUSULA OITAVA: DA VIGÊNCIA\n\nVigência de 18 meses.']
        campo = extrair_campos(paginas)['vigencia']
        self.assertEqual(campo['valor']['duracao_meses'], 18)
        self.assertTrue(all(e['pagina'] == 2 for e in campo['evidencias']))
        extrair.verificar_evidencias({'vigencia': campo}, paginas)

    def test_ipca_e_nao_vira_ipca(self):
        valor = self.campo('O aluguel terá reajuste anual pelo IPCA-E.', 'regra_reajuste')['valor']
        self.assertEqual(valor['tipo'], 'outra_regra')
        self.assertEqual(valor['indices'], [])

    def test_ivar_reune_clausula_com_condicoes_e_intervalo_minimo(self):
        texto = ('CLÁUSULA SÉTIMA: DO REAJUSTE\n'
                 'Será admitido o reajuste do preço do aluguel da locação com prazo de vigência igual ou superior a doze meses, '
                 'mediante aplicação do IVAR, desde que seja observado o interregno míni mo de 1 (um) ano, '
                 'contado da assinatura para o primeiro reajuste ou do último reajuste para os subsequentes.\n'
                 'PARÁGRAFO PRIMEIRO - Se houver variação desproporcional ao mercado, o locador aceitará negociar preço compatível.\n'
                 'PARÁGRAFO SEGUNDO - O reajuste será formalizado mediante termo aditivo.')
        campo = extrair_campos(['Introdução.', texto])['regra_reajuste']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['indices'], ['IVAR'])
        self.assertEqual(campo['valor']['periodicidade_meses'], 12)
        self.assertEqual(campo['valor']['regra'], texto)
        self.assertEqual(campo['evidencias'][0]['pagina'], 2)
        extrair.verificar_evidencias({'regra_reajuste': campo}, ['Introdução.', texto])

    def test_ivar_referencia_anual_complementar_nao_concorre(self):
        referencia = ('Locação do imóvel o valor mensal de R$ 900,00, não podendo este ser alterado '
                      'durante a vigência do contrato, salvo os casos de reajustes anua is previstos neste instrumento.')
        principal = ('CLÁUSULA SÉTIMA: DO REAJUSTE\n'
                     'Reajuste anual pelo IVAR.\nPARÁGRAFO ÚNICO - Será formalizado por termo aditivo.')
        campo = extrair_campos([referencia, principal])['regra_reajuste']
        self.assertEqual(campo['valor']['indices'], ['IVAR'])
        self.assertEqual(campo['valor']['periodicidade_meses'], 12)
        self.assertIn(referencia, campo['valor']['regra'])
        self.assertIn(principal, campo['valor']['regra'])
        extrair.verificar_evidencias({'regra_reajuste': campo}, [referencia, principal])

    def test_ivar_nao_herda_inpc_de_atraso_ou_prazo_contratual(self):
        texto = ('Em atraso, correção monetária pelo INPC.\n'
                 'CLÁUSULA SÉTIMA: DO REAJUSTE\nReajuste pelo IVAR.\n'
                 'CLÁUSULA OITAVA: DA VIGÊNCIA\nVigência de 24 meses.')
        valor = self.campo(texto, 'regra_reajuste')['valor']
        self.assertEqual(valor['indices'], ['IVAR'])
        self.assertIsNone(valor['periodicidade_meses'])
        self.assertNotIn('INPC', valor['regra'])
        self.assertNotIn('24 meses', valor['regra'])

    def test_ivar_indice_por_nome_e_limites_da_sigla(self):
        self.assertEqual(self.campo('Reajuste pelo Índice de Variação de Aluguéis Residenciais.', 'regra_reajuste')['valor']['indices'], ['IVAR'])
        for indice in ('IVAR-X', 'IVARPLUS'):
            self.assertEqual(self.campo(f'Reajuste pelo {indice}.', 'regra_reajuste')['valor']['indices'], [])

    def test_reajuste_agrupado_indices_concorrentes_entre_clausulas(self):
        texto = ('CLÁUSULA PRIMEIRA: DO REAJUSTE\nReajuste anual pelo IVAR.\n'
                 'CLÁUSULA SEGUNDA: DO REAJUSTE\nReajuste anual pelo IPCA.')
        campo = self.campo(texto, 'regra_reajuste')
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])

    def test_reajuste_agrupado_intervalo_invalido_ou_concorrente(self):
        for corpo in ('Reajuste pelo IVAR, desde que seja observado o interregno mínimo de 0 anos.',
                      'Reajuste pelo IVAR, desde que seja observado o interregno mínimo de -1 ano.',
                      'Reajuste pelo IVAR, desde que seja observado o interregno mínimo de 1,5 anos.',
                      'Reajuste mensal pelo IVAR, desde que seja observado o interregno mínimo de 1 ano.',
                      'Reajuste pelo IVAR, desde que seja observado o interregno mínimo de 1 ano ou 2 anos.'):
            with self.subTest(corpo=corpo):
                campo = self.campo('CLÁUSULA SÉTIMA: DO REAJUSTE\n' + corpo, 'regra_reajuste')
                self.assertEqual(campo['estado'], 'ambiguo')
                self.assertIsNone(campo['valor'])

    def test_referencia_anual_nao_oculta_periodo_conflitante(self):
        referencia = ('Valor mensal de R$ 900,00, não podendo este ser alterado durante a vigência do contrato, '
                      'salvo os casos de reajustes anuais previstos neste instrumento.')
        principal = 'CLÁUSULA SÉTIMA: DO REAJUSTE\nReajuste a cada 2 anos pelo IVAR.'
        self.assertEqual(extrair_campos([referencia, principal])['regra_reajuste']['estado'], 'ambiguo')

    def test_reajuste_titulo_isolado_nao_cria_regra(self):
        self.assertIsNone(self.campo('CLÁUSULA SÉTIMA: DO REAJUSTE', 'regra_reajuste')['valor'])

    def test_reajuste_indices_concorrentes_no_mesmo_bloco(self):
        texto = ('CLÁUSULA SÉTIMA: DO REAJUSTE\nReajuste anual pelo IVAR.\n'
                 'PARÁGRAFO ÚNICO - O reajuste será pelo IPCA.')
        self.assertEqual(self.campo(texto, 'regra_reajuste')['estado'], 'ambiguo')

    def test_reajuste_agrupado_preserva_indice_substituto(self):
        texto = ('CLÁUSULA SÉTIMA: DO REAJUSTE\nReajuste anual pelo IVAR ou pelo IPCA na ausência do primeiro.\n'
                 'PARÁGRAFO ÚNICO - Será formalizado mediante termo aditivo.')
        valor = self.campo(texto, 'regra_reajuste')['valor']
        self.assertEqual(valor['indices'], ['IPCA', 'IVAR'])
        self.assertEqual(valor['regra'], texto)

    def test_ivar_negado_nao_e_indice_confirmado(self):
        texto = 'CLÁUSULA SÉTIMA: DO REAJUSTE\nNão será aplicado reajuste pelo IVAR.'
        valor = self.campo(texto, 'regra_reajuste')['valor']
        self.assertEqual(valor['tipo'], 'outra_regra')
        self.assertEqual(valor['indices'], [])
        self.assertEqual(valor['regra'], texto)

    def test_negacao_de_modalidade_nao_nega_todo_reajuste(self):
        for texto in ('Não haverá reajuste por faixa etária.',
                      'Não será aplicado reajuste em razão da idade do beneficiário.',
                      'Contrato sem reajuste anual.',
                      'Não há previsão de reajuste por variação da faixa etária.',
                      'Não haverá reajuste pelo IPCA; será utilizado o INPC.'):
            with self.subTest(texto=texto):
                campo = self.campo(texto, 'regra_reajuste')
                self.assertEqual(campo['valor']['tipo'], 'outra_regra')
                self.assertEqual(campo['valor']['indices'], [])
                self.assertIsNone(campo['valor']['percentual'])
                self.assertEqual(campo['valor']['regra'], texto)

    def test_faixa_etaria_nao_vira_taxa_fixa_para_todos(self):
        texto = 'Reajuste de 15% por mudança de faixa etária aos 59 anos.'
        valor = self.campo(texto, 'regra_reajuste')['valor']
        self.assertEqual(valor['tipo'], 'outra_regra')
        self.assertIsNone(valor['percentual'])
        self.assertIsNone(valor['periodicidade_meses'])
        self.assertEqual(valor['regra'], texto)

    def test_modalidades_no_mesmo_bloco_nao_compartilham_indice_ou_periodo(self):
        texto = ('Reajuste anual pelo IPCA; reajuste por faixa etária no mês seguinte '
                 'ao aniversário do beneficiário.')
        valor = self.campo(texto, 'regra_reajuste')['valor']
        self.assertEqual(valor['tipo'], 'outra_regra')
        self.assertEqual(valor['indices'], [])
        self.assertIsNone(valor['periodicidade_meses'])
        self.assertEqual(valor['regra'], texto)

    def test_modalidades_em_paginas_distintas_preservam_abstencao_e_evidencias(self):
        paginas = ['Reajuste anual pelo IPCA.',
                   'Reajuste técnico condicionado à sinistralidade superior a 70%.',
                   'Não haverá reajuste por faixa etária.']
        campo = extrair_campos(paginas)['regra_reajuste']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertIn('modalidades', campo['motivo'])
        for modalidade in ('anual', 'técnico', 'faixa etária'):
            self.assertIn(modalidade, campo['motivo'])
        self.assertEqual({e['pagina'] for e in campo['evidencias']}, {1, 2, 3})
        extrair.verificar_evidencias({'regra_reajuste': campo}, paginas)

    def test_tabela_etaria_incompleta_nao_vira_regra_confirmada(self):
        texto = 'Reajuste por faixa etária: 19 a 23 anos __%; 24 a 28 anos 15%.'
        campo = self.campo(texto, 'regra_reajuste')
        self.assertEqual(campo['estado'], 'nao_identificado')
        self.assertIsNone(campo['valor'])
        self.assertEqual(campo['evidencias'][0]['trecho'], texto)

    def test_remissao_etaria_nao_e_resolvida_pela_regra_anual(self):
        paginas = ['Reajuste anual pelo IPCA.', 'Reajuste por faixa etária conforme o anexo.']
        campo = extrair_campos(paginas)['regra_reajuste']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertIn('modalidades', campo['motivo'])
        self.assertEqual(len(campo['evidencias']), 2)

    def test_negacao_global_com_excecao_nao_vira_sem_reajuste(self):
        for texto in ('Contrato sem reajuste, exceto por faixa etária.',
                      'Não haverá reajuste; aplica-se IPCA na renovação.',
                      'Não haverá reajuste no primeiro ano.'):
            with self.subTest(texto=texto):
                valor = self.campo(texto, 'regra_reajuste')['valor']
                self.assertEqual(valor['tipo'], 'outra_regra')
                self.assertEqual(valor['regra'], texto)

    def test_negacao_global_integral_continua_identificada(self):
        for texto in ('Contrato sem reajuste.', 'Não haverá qualquer reajuste.',
                      'Não será aplicado reajuste.',
                      'CLÁUSULA SÉTIMA: DO REAJUSTE\nNão haverá reajuste.'):
            with self.subTest(texto=texto):
                self.assertEqual(self.campo(texto, 'regra_reajuste')['valor']['tipo'], 'sem_reajuste')

    def test_reajuste_acessorio_isolado_nao_define_regra_da_parcela(self):
        for objeto in ('saldo devedor', 'prêmio de seguro', 'tarifa de administração',
                       'valor de manutenção de serviços de administração',
                       'limite mínimo de contribuição', 'base de contribuição',
                       'valor da cota de amortização'):
            texto = f'O {objeto} terá reajuste anual pelo IPCA.'
            with self.subTest(objeto=objeto):
                campo = self.campo(texto, 'regra_reajuste')
                self.assertEqual(campo['estado'], 'nao_identificado')
                self.assertIsNone(campo['valor'])
                self.assertIn('objeto', campo['motivo'])
                self.assertEqual(campo['evidencias'], [{'pagina': 1, 'trecho': texto}])

    def test_objetos_no_mesmo_bloco_nao_compartilham_indice(self):
        texto = ('O saldo devedor terá reajuste mensal pelo IPCA; '
                 'o seguro será atualizado conforme a apólice.')
        campo = self.campo(texto, 'regra_reajuste')
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertIn('saldo devedor', campo['motivo'])
        self.assertIn('seguro', campo['motivo'])
        self.assertEqual(campo['evidencias'][0]['trecho'], texto)

    def test_objetos_em_paginas_distintas_nao_escolhem_a_prestacao(self):
        paginas = ['A prestação terá reajuste anual pelo IPCA.',
                   'O prêmio de seguro terá reajuste anual de 6%.',
                   'A tarifa administrativa terá reajuste conforme o anexo.']
        campo = extrair_campos(paginas)['regra_reajuste']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        for objeto in ('prestação', 'seguro', 'tarifa'):
            self.assertIn(objeto, campo['motivo'])
        self.assertEqual({e['pagina'] for e in campo['evidencias']}, {1, 2, 3})
        extrair.verificar_evidencias({'regra_reajuste': campo}, paginas)

    def test_limites_e_bases_da_saude_nao_viram_indice_unico(self):
        texto = ('Os limites de que tratam as alíneas anteriores serão reajustados anualmente pelo IPCA; '
                 'as bases de contribuição serão reajustadas conforme os aumentos salariais.')
        campo = self.campo(texto, 'regra_reajuste')
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertIn('limites de contribuição', campo['motivo'])
        self.assertIn('bases de contribuição', campo['motivo'])
        self.assertEqual(campo['evidencias'][0]['trecho'], texto)

    def test_objeto_principal_explicito_preserva_regra_simples(self):
        for objeto in ('aluguel', 'mensalidade', 'prestação', 'contribuição mensal'):
            with self.subTest(objeto=objeto):
                texto = f'Reajuste anual do valor de {objeto} pelo IPCA.'
                valor = self.campo(texto, 'regra_reajuste')['valor']
                self.assertEqual(valor['tipo'], 'indice')
                self.assertEqual(valor['indices'], ['IPCA'])
                self.assertEqual(valor['periodicidade_meses'], 12)
                self.assertEqual(valor['regra'], texto)

    def test_mencao_ao_vencimento_nao_transfere_reajuste_do_saldo(self):
        texto = ('O saldo devedor será reajustado mensalmente pelo IPCA, '
                 'no dia do vencimento das prestações.')
        campo = self.campo(texto, 'regra_reajuste')
        self.assertIsNone(campo['valor'])
        self.assertIn('objetos', campo['motivo'])

    def test_negacao_do_seguro_nao_define_ausencia_global(self):
        campo = self.campo('Não haverá reajuste do prêmio de seguro.', 'regra_reajuste')
        self.assertEqual(campo['estado'], 'nao_identificado')
        self.assertIsNone(campo['valor'])
        self.assertEqual(len(campo['evidencias']), 1)

    def test_lacuna_em_objeto_acessorio_nao_e_descartada(self):
        paginas = ['Reajuste anual da prestação pelo IPCA.', 'Reajuste do seguro de __%.']
        campo = extrair_campos(paginas)['regra_reajuste']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertEqual(len(campo['evidencias']), 2)

    def test_limite_da_taxa_nao_e_confundido_com_limite_de_contribuicao(self):
        texto = 'O reajuste anual da mensalidade terá limite de 8%.'
        campo = self.campo(texto, 'regra_reajuste')
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['tipo'], 'outra_regra')
        self.assertEqual(campo['valor']['regra'], texto)

    def test_indices_alternativos_preservados(self):
        texto = 'O aluguel terá reajuste anual pelo IGP-M ou, na sua ausência, pelo IPCA.'
        valor = self.campo(texto, 'regra_reajuste')['valor']
        self.assertEqual(valor['indices'], ['IGP-M', 'IPCA'])
        self.assertEqual(valor['regra'], texto)

    def test_reajuste_titulos_variados_nao_sao_regra(self):
        for texto in ('REAJUSTE', 'CLÁUSULA 12ª – REAJUSTE',
                      'CLÁUSULA DÉCIMA PRIMEIRA - REAJUSTE',
                      'CLÁUSULA 13ª – REAJUSTE POR FAIXA ETÁRIA',
                      'Capítulo XI\nDO REAJUSTE', 'II) Reajuste:'):
            with self.subTest(texto=texto):
                campo = self.campo(texto, 'regra_reajuste')
                self.assertEqual(campo['estado'], 'nao_identificado')
                self.assertIsNone(campo['valor'])

    def test_reajuste_titulo_separado_nao_concorre_com_corpo(self):
        paginas = ['CLÁUSULA 12ª – REAJUSTE', 'Reajuste anual pelo IPCA.']
        campo = extrair_campos(paginas)['regra_reajuste']
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['indices'], ['IPCA'])
        self.assertEqual(campo['evidencias'], [{'pagina': 2, 'trecho': paginas[1]}])

    def test_reajuste_titulo_com_conteudo_nao_e_descartado(self):
        for texto in ('CLÁUSULA 12ª – REAJUSTE\nReajuste anual pelo IPCA.',
                      'Reajuste: IPCA.', 'Reajuste = IGPM + IRT.'):
            self.assertEqual(self.campo(texto, 'regra_reajuste')['estado'], 'encontrado')

    def test_reajuste_remissao_isolada_exige_revisao(self):
        for texto in ('Reajuste conforme cláusula 8.',
                      'Os valores serão reajustados anualmente conforme condições estabelecidas na Cláusula de Reajuste.',
                      'Reajuste conforme o anexo contratual.',
                      'Reajuste previsto na cláusula terceira.'):
            with self.subTest(texto=texto):
                campo = self.campo(texto, 'regra_reajuste')
                self.assertEqual(campo['estado'], 'nao_identificado')
                self.assertIsNone(campo['valor'])
                self.assertEqual(campo['evidencias'], [{'pagina': 1, 'trecho': texto}])

    def test_reajuste_remissao_nao_e_ligada_automaticamente_a_outro_indice(self):
        paginas = ['Reajuste conforme cláusula 8.', 'Reajuste anual pelo IPCA.']
        campo = extrair_campos(paginas)['regra_reajuste']
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertEqual({e['pagina'] for e in campo['evidencias']}, {1, 2})
        extrair.verificar_evidencias({'regra_reajuste': campo}, paginas)

    def test_reajuste_remissao_com_regra_explicita_e_preservada(self):
        for texto in ('Reajuste anual pelo IPCA conforme cláusula 8.',
                      'Reajuste anual de 6%, conforme cláusula terceira.',
                      'Reajuste = IGPM + IRT, conforme cláusula 12.'):
            campo = self.campo(texto, 'regra_reajuste')
            self.assertEqual(campo['estado'], 'encontrado')
            self.assertEqual(campo['valor']['regra'], texto)

    def test_reajuste_garantia_sem_criterio_nao_cria_regra(self):
        texto = ('A garantia fiduciária abrange o imóvel e os encargos, inclusive reajuste '
                 'monetário, até o cumprimento das obrigações contratuais.')
        campo = self.campo(texto, 'regra_reajuste')
        self.assertEqual(campo['estado'], 'nao_identificado')
        self.assertEqual(campo['evidencias'], [{'pagina': 1, 'trecho': texto}])

    def test_reajuste_garantia_com_criterio_nao_perde_conteudo(self):
        texto = 'A garantia fiduciária inclui reajuste anual pelo IPCA.'
        campo = self.campo(texto, 'regra_reajuste')
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['regra'], texto)

    def test_reajuste_formula_composta_nao_perde_componentes(self):
        for texto in ('Reajuste = IGPM + IRT.', 'Reajuste = IRT + IPCA.',
                      'Reajuste = IGP-M + FATOR_X.', 'Reajuste = IPCA + 2%.',
                      'CLÁUSULA SÉTIMA: DO REAJUSTE\nReajuste = IPCA + INPC.'):
            with self.subTest(texto=texto):
                campo = self.campo(texto, 'regra_reajuste')
                self.assertEqual(campo['estado'], 'encontrado')
                self.assertEqual(campo['valor']['tipo'], 'outra_regra')
                self.assertEqual(campo['valor']['indices'], [])
                self.assertIsNone(campo['valor']['percentual'])
                self.assertEqual(campo['valor']['regra'], texto)

    def test_reajuste_soma_por_extenso_preserva_regra(self):
        for complemento in ('somado ao IRT', 'acrescido de fator técnico', 'mais fator de sinistralidade'):
            texto = f'Reajuste anual pelo IPCA {complemento}.'
            valor = self.campo(texto, 'regra_reajuste')['valor']
            self.assertEqual(valor['tipo'], 'outra_regra')
            self.assertEqual(valor['indices'], [])
            self.assertEqual(valor['periodicidade_meses'], 12)
            self.assertEqual(valor['regra'], texto)

    def test_reajuste_tecnico_apuracao_nao_define_periodicidade(self):
        texto = ('O IGPM, o Índice de Reajuste Técnico (IRT) e a sinistralidade serão '
                 'apurados no período de 12 meses, com defasagem de 4 meses.')
        valor = self.campo(texto, 'regra_reajuste')['valor']
        self.assertEqual(valor['tipo'], 'outra_regra')
        self.assertEqual(valor['indices'], [])
        self.assertIsNone(valor['periodicidade_meses'])

    def test_reajuste_limiar_nao_vira_percentual_fixo(self):
        for texto in ('Reajuste técnico quando a sinistralidade superar 70%.',
                      'Reajuste limitado ao teto de 8%.',
                      'Reajuste condicionado à meta de 6%.'):
            valor = self.campo(texto, 'regra_reajuste')['valor']
            self.assertEqual(valor['tipo'], 'outra_regra')
            self.assertIsNone(valor['percentual'])
            self.assertEqual(valor['regra'], texto)

    def test_reajuste_composto_condicoes_e_substituto_preservados(self):
        texto = ('Reajuste anual pelo IGPM ou índice que o substitua, somado ao Índice de '
                 'Reajuste Técnico, caso a sinistralidade supere 70%.')
        campo = extrair_campos(['Introdução.', texto])['regra_reajuste']
        self.assertEqual(campo['valor']['tipo'], 'outra_regra')
        self.assertEqual(campo['valor']['indices'], [])
        self.assertIsNone(campo['valor']['percentual'])
        self.assertEqual(campo['valor']['periodicidade_meses'], 12)
        self.assertEqual(campo['valor']['regra'], texto)
        self.assertEqual(campo['evidencias'][0]['pagina'], 2)
        extrair.verificar_evidencias({'regra_reajuste': campo}, ['Introdução.', texto])

    def test_reajuste_negacao_tecnica_nao_significa_sem_reajuste_global(self):
        texto = 'Não será aplicado reajuste técnico; o reajuste anual será pelo IPCA.'
        valor = self.campo(texto, 'regra_reajuste')['valor']
        self.assertEqual(valor['tipo'], 'outra_regra')
        self.assertEqual(valor['regra'], texto)

    def test_reajuste_composto_nao_remove_concorrentes(self):
        texto = 'Reajuste = IGPM + IRT.\n\nReajuste anual pelo IPCA.'
        campo = self.campo(texto, 'regra_reajuste')
        self.assertEqual(campo['estado'], 'ambiguo')
        self.assertIsNone(campo['valor'])
        self.assertEqual(len(campo['evidencias']), 2)

    def test_reajuste_composto_nao_oculta_lacunas_ou_periodo_invalido(self):
        for texto in ('Reajuste = IGPM + __.', 'Reajuste a cada 0 meses pelo IGPM + IRT.',
                      'Reajuste mensal e reajuste anual pelo IGPM + IRT.'):
            self.assertIsNone(self.campo(texto, 'regra_reajuste')['valor'])

    def test_reajuste_simples_e_indice_substituto_continuam_identificados(self):
        for texto in ('Reajuste anual pelo IPCA.',
                      'Reajuste anual pelo IPCA ou pelo INPC na ausência do primeiro.'):
            valor = self.campo(texto, 'regra_reajuste')['valor']
            self.assertEqual(valor['tipo'], 'indice')
            self.assertIn('IPCA', valor['indices'])
        self.assertEqual(self.campo('Reajuste anual de 6%.', 'regra_reajuste')['valor']['percentual'], '6.00')

    def test_percentual_sem_arredondar(self):
        self.assertEqual(self.campo('Reajuste anual de 5%.', 'regra_reajuste')['valor']['percentual'], '5.00')
        self.assertEqual(self.campo('Reajuste anual de 5,123%.', 'regra_reajuste')['valor']['tipo'], 'outra_regra')

    def test_reajuste_nao_herda_frequencia_do_aluguel(self):
        for texto in (
            'Aluguel mensal de R$ 750,00; reajuste pelo IGP-M.',
            'Reajuste pelo IPCA e pagamento mensal do aluguel.',
            'Aluguel anual; reajuste pelo INPC.',
            'Reajuste pelo IPCA e pagamento a cada 6 meses.',
        ):
            with self.subTest(texto=texto):
                self.assertIsNone(self.campo(texto, 'regra_reajuste')['valor']['periodicidade_meses'])

    def test_reajuste_interregno_anual_em_bloco_com_aluguel_mensal(self):
        texto = ('4.1 Aluguel mensal de R$ 750,00.\n'
                 '4.2 Reajuste pelo IGP-M ou índice substituto.\n'
                 '4.3 Será permitido o reajuste desde que observado o interregno mínimo de 01 (um) ano, '
                 'a contar da vigência ou do último reajuste.')
        campo = self.campo(texto, 'regra_reajuste')
        self.assertEqual(campo['valor']['periodicidade_meses'], 12)
        self.assertEqual(campo['valor']['regra'], texto)
        extrair.verificar_evidencias({'regra_reajuste': campo}, [texto])

    def test_reajuste_periodos_explicitamente_associados(self):
        for frase, esperado in (
            ('Reajuste mensal pelo IPCA.', 1),
            ('O valor será reajustado anualmente pelo INPC.', 12),
            ('Reajuste com periodicidade de 18 meses pelo IPCA.', 18),
            ('Reajuste a cada 2 anos pelo IGP-M.', 24),
            ('Reajuste com intervalo mínimo de 6 meses pelo INPC.', 6),
        ):
            with self.subTest(frase=frase):
                self.assertEqual(self.campo(frase, 'regra_reajuste')['valor']['periodicidade_meses'], esperado)

    def test_reajuste_nao_herda_prazo_de_vigencia(self):
        texto = 'Vigência de 24 meses; aluguel mensal; reajuste pelo IPCA.'
        self.assertIsNone(self.campo(texto, 'regra_reajuste')['valor']['periodicidade_meses'])

    def test_reajuste_periodicidades_concorrentes_no_mesmo_bloco(self):
        for texto in (
            'Reajuste a cada 6 meses e reajuste anual pelo IPCA.',
            'Reajuste a cada 6 meses ou 12 meses pelo IPCA.',
        ):
            with self.subTest(texto=texto):
                campo = self.campo(texto, 'regra_reajuste')
                self.assertEqual(campo['estado'], 'ambiguo')
                self.assertIsNone(campo['valor'])

    def test_reajuste_periodicidade_zero_nao_e_aceita(self):
        campo = self.campo('Reajuste a cada 0 meses pelo IPCA.', 'regra_reajuste')
        self.assertIsNone(campo['valor'])

    def test_reajuste_forma_nao_suportada_nao_vira_mensal(self):
        texto = 'Aluguel mensal; reajuste após o aniversário do contrato pelo IPCA.'
        self.assertIsNone(self.campo(texto, 'regra_reajuste')['valor']['periodicidade_meses'])

    def test_mora_nao_e_reajuste(self):
        self.assertIsNone(self.campo('Em atraso, reajuste da dívida pelo INPC e juros de 1%.', 'regra_reajuste')['valor'])

    def test_sem_reajuste_so_quando_explicito(self):
        self.assertEqual(self.campo('Contrato sem reajuste.', 'regra_reajuste')['valor']['tipo'], 'sem_reajuste')
        self.assertIsNone(self.campo('Contrato escolar.', 'regra_reajuste')['valor'])

    def test_paginas_fisicas_e_trechos_literais(self):
        paginas = ['Identificação do contrato.', 'Aluguel mensal de\nR$ 1.234,56.']
        campos = extrair_campos(paginas)
        self.assertEqual(campos['valor_parcela']['evidencias'][0]['pagina'], 2)
        self.assertIn('\n', campos['valor_parcela']['evidencias'][0]['trecho'])
        extrair.verificar_evidencias(campos, paginas)


class PdfTests(unittest.TestCase):
    def test_pdf_com_texto_e_cinco_campos(self):
        texto = (extrair.BASE / 'examples/contrato-sintetico.txt').read_text(encoding='utf-8')
        registro, paginas = extrair.processar(pdf_ficticio([texto]), 'ficticio')
        self.assertEqual(registro['processamento']['status'], 'concluido')
        self.assertTrue(all(c['estado'] == 'encontrado' for c in registro['campos'].values()))
        extrair.verificar_evidencias(registro['campos'], paginas)

    def test_sem_texto_e_protegido(self):
        for data, code in [(pdf_ficticio(['']), 'SEM_CAMADA_TEXTO'), (pdf_ficticio(['Contrato'], 'segredo'), 'PDF_PROTEGIDO')]:
            with self.subTest(codigo=code):
                registro, _ = extrair.processar(data, 'ficticio')
                self.assertEqual(registro['processamento']['status'], 'falhou')
                self.assertEqual(registro['processamento']['erros'][0]['codigo'], code)
                self.assertTrue(all(c['estado'] == 'erro_leitura' for c in registro['campos'].values()))

    def test_pdf_corrompido(self):
        with redirect_stderr(io.StringIO()):
            registro, _ = extrair.processar(b'%PDF- arquivo quebrado', 'ficticio')
        self.assertEqual(registro['processamento']['erros'][0]['codigo'], 'PDF_INVALIDO')

    def test_pdf_misto_nao_ignora_pagina_sem_texto(self):
        registro, paginas = extrair.processar(pdf_ficticio(['Aluguel mensal de R$ 900,00.', '']), 'ficticio')
        self.assertEqual(registro['processamento']['status'], 'parcial')
        self.assertEqual(registro['processamento']['erros'][0]['pagina'], 2)
        self.assertEqual(len(paginas), 2)
        self.assertTrue(all(c['estado'] == 'erro_leitura' for c in registro['campos'].values()))

    def test_falha_regra_preservada(self):
        with patch('extrair.extrair_campos', side_effect=ValueError('não publicar detalhe')):
            registro, _ = extrair.processar(pdf_ficticio(['Contrato fictício legível.']), 'ficticio')
        self.assertEqual(registro['processamento']['erros'][0]['codigo'], 'FALHA_EXTRACAO')


class CliTests(unittest.TestCase):
    def setUp(self):
        raiz = extrair.BASE / 'data' / 'testes-temporarios'
        raiz.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=raiz)
        self.base = Path(self.temp.name).resolve()
        self.assertTrue(self.base.is_relative_to(raiz.resolve()))
        self.addCleanup(self.temp.cleanup)
        self.path = self.base / 'ficticio.pdf'
        self.path.write_bytes(pdf_ficticio(['Aluguel de R$ 1.200,00.']))
        self.args = argparse.Namespace(id=None, pdf=str(self.path), documento_id=None, saida=str(self.base / 'rodada'))

    def test_hash_reservado_bloqueado_mesmo_com_outro_nome(self):
        catalogo = {'documentos': [{'sha256': extrair.sha256(self.path.read_bytes()), 'divisao': 'teste'}]}
        with self.assertRaisesRegex(ValueError, 'reservado'):
            extrair.entrada(self.args, catalogo)

    def test_id_reservado_recusado_antes_de_abrir_pdf(self):
        self.args.id = 'teste'
        catalogo = {'documentos': [{'id': 'teste', 'status_coleta': 'baixado', 'divisao': 'teste'}]}
        with self.assertRaisesRegex(ValueError, 'reservado'):
            extrair.entrada(self.args, catalogo)

    def test_rodada_preserva_resultado_texto_e_versoes(self):
        stdout = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(io.StringIO()):
            self.assertEqual(extrair.executar(self.args), 0)
        destino = Path(self.args.saida)
        self.assertEqual(stdout.getvalue(), (destino / 'resultado.json').read_text(encoding='utf-8'))
        manifesto = json.loads((destino / 'manifesto.json').read_text(encoding='utf-8'))
        self.assertEqual(manifesto['pdf_sha256'], extrair.sha256(self.path.read_bytes()))
        self.assertIn('regras.py', manifesto['arquivos_sha256'])
        for nome in ('extenso.py', 'pagamentos_escolares.py', 'cronograma_financiamento.py'):
            self.assertEqual(manifesto['arquivos_sha256'][nome], extrair.sha256((extrair.BASE / nome).read_bytes()))
        auxiliar = destino / 'cronograma-financiamento.json'
        self.assertEqual(manifesto['diagnosticos_sha256'][auxiliar.name], extrair.sha256(auxiliar.read_bytes()))
        diagnostico = json.loads(auxiliar.read_text(encoding='utf-8'))
        self.assertTrue(diagnostico['diagnostico_auxiliar'])
        self.assertEqual(diagnostico['pdf_sha256'], manifesto['pdf_sha256'])
        self.assertEqual(diagnostico['estado'], 'nao_identificado')
        self.assertTrue((destino / 'paginas.json').exists())
        with self.assertRaises(FileExistsError):
            extrair.executar(self.args)

    def test_cli_preserva_diagnostico_sem_mudar_json_oficial(self):
        self.path.write_bytes(pdf_ficticio([
            'Havendo carência, a primeira prestação de juros será paga 30 dias após a liberação do crédito.'
        ]))
        stdout = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(io.StringIO()):
            self.assertEqual(extrair.executar(self.args), 0)
        destino = Path(self.args.saida)
        oficial = json.loads(stdout.getvalue())
        diagnostico = json.loads((destino / 'cronograma-financiamento.json').read_text(encoding='utf-8'))
        self.assertEqual(set(oficial['campos']), set(extrair.CAMPOS))
        self.assertEqual(diagnostico['estado'], 'condicoes_identificadas')
        self.assertEqual(diagnostico['documento_id'], oficial['documento_id'])
        self.assertEqual(diagnostico['pdf_sha256'], oficial['pdf_sha256'])
        paginas = json.loads((destino / 'paginas.json').read_text(encoding='utf-8'))
        extrair.verificar_diagnostico(diagnostico, paginas)

    def test_cli_leitura_parcial_salva_diagnostico_nao_executado(self):
        self.path.write_bytes(pdf_ficticio(['Prestação de juros na carência.', '']))
        with redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            self.assertEqual(extrair.executar(self.args), 1)
        destino = Path(self.args.saida)
        diagnostico = json.loads((destino / 'cronograma-financiamento.json').read_text(encoding='utf-8'))
        self.assertEqual(diagnostico['estado'], 'nao_executado_leitura_incompleta')
        self.assertEqual(diagnostico['condicoes'], [])


if __name__ == '__main__':
    unittest.main()
