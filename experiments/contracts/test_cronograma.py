"""Casos fictícios do diagnóstico; não são gabarito dos PDFs públicos."""
import copy
import unittest

from cronograma_financiamento import analisar_cronograma, criar_diagnostico, verificar_diagnostico
from regras import extrair_campos


class CronogramaTests(unittest.TestCase):
    JUROS = ('Havendo carência, a primeira prestação de juros será paga 30 dias após '
             'a liberação do crédito, vencendo-se as demais no mesmo dia dos meses seguintes.')
    FASES = ('Os juros serão exigíveis trimestralmente durante o prazo de carência e '
             'mensalmente durante o período de amortização, juntamente com as prestações do principal.')
    AJUSTE = ('Todo vencimento de prestação de amortização de principal, de juros e encargos moratórios '
              'que ocorra em sábados, domingos ou feriados será deslocado para o primeiro dia útil subsequente.')

    def test_primeira_prestacao_preserva_evento_sem_calcular_data(self):
        result = analisar_cronograma(['Crédito liberado em 01/10/2026.\n\n' + self.JUROS])
        self.assertFalse(result['calendario_gerado'])
        condicao, = result['condicoes']
        self.assertEqual(condicao['categorias'], ['carencia'])
        self.assertEqual(condicao['prazos_relativos'], [{'dias': 30, 'evento': 'liberacao_recursos'}])
        self.assertIn('data_liberacao_recursos_nao_resolvida', condicao['dependencias'])

    def test_frequencias_associadas_as_fases_adjacentes(self):
        condicao, = analisar_cronograma([self.FASES])['condicoes']
        self.assertEqual(condicao['periodicidades_por_fase'], [
            {'fase': 'carencia', 'meses': 3}, {'fase': 'amortizacao', 'meses': 1}])

    def test_nao_confunde_calculo_com_cobranca(self):
        text = 'Os juros serão calculados mensalmente durante a carência e a amortização.'
        self.assertEqual(analisar_cronograma([text])['condicoes'], [])
        result = analisar_cronograma([self.FASES + ' Os juros são calculados anualmente.'])
        self.assertTrue(all(not c['periodicidades_por_fase'] or
                            all(p['meses'] != 12 for p in c['periodicidades_por_fase'])
                            for c in result['condicoes']))

    def test_excecao_sem_carencia_nao_afirma_carencia_aplicavel(self):
        text = ('Caso não haja carência, a primeira prestação de amortização terá vencimento '
                'no dia 18 subsequente à liberação dos recursos.')
        c, = analisar_cronograma([text])['condicoes']
        self.assertNotIn('carencia', c['categorias'])
        self.assertIn('sem_carencia', c['categorias'])
        self.assertIn('aplicabilidade_sem_carencia_nao_resolvida', c['dependencias'])

    def test_dia_util_preserva_condicao_sem_calendario(self):
        c, = analisar_cronograma([self.AJUSTE])['condicoes']
        self.assertEqual(c['categorias'], ['ajuste_dia_util'])
        self.assertIn('calendario_de_dias_uteis_nao_resolvido', c['dependencias'])

    def test_remissao_ao_quadro_continua_pendente(self):
        text = ('O prazo de amortização é fixado no Quadro Prazos, vencendo-se a primeira '
                'prestação no dia 18 após o término da carência.')
        c, = analisar_cronograma([text])['condicoes']
        self.assertIn('termino_carencia', c['eventos_referidos'])
        self.assertIn('quadro_referenciado_nao_resolvido', c['dependencias'])

    def test_emissao_e_liberacao_nao_sao_o_mesmo_evento(self):
        text = ('O prazo de carência prevê a primeira prestação de juros vencendo no dia 18 '
                'do terceiro mês subsequente à emissão.')
        c, = analisar_cronograma([text])['condicoes']
        self.assertEqual(c['eventos_referidos'], ['emissao'])
        self.assertEqual(c['prazos_relativos'], [])

    def test_condicoes_entre_paginas_nao_sao_fundidas(self):
        pages = [self.JUROS, self.FASES, self.AJUSTE]
        result = analisar_cronograma(pages)
        self.assertEqual(len(result['condicoes']), 3)
        self.assertEqual([c['evidencias'][0]['pagina'] for c in result['condicoes']], [1, 2, 3])
        verificar_diagnostico(result, pages)

    def test_seguro_multa_e_antecipacao_nao_definem_fase(self):
        for texto in (
            'A primeira prestação do seguro será paga 30 dias após a liberação do crédito, com carência.',
            'A multa será exigível mensalmente durante a carência e a amortização.',
            'O vencimento antecipado da prestação de amortização ocorre em caso de atraso.',
        ):
            with self.subTest(texto=texto):
                self.assertEqual(analisar_cronograma([texto])['condicoes'], [])

    def test_prazo_ausente_invalido_ou_negado_nao_vira_numero(self):
        for prazo in ('__', '0', '367', '99999', 'trinta', '30 (vinte)', '30 (texto desconhecido)'):
            c, = analisar_cronograma([self.JUROS.replace('30', prazo)])['condicoes']
            self.assertEqual(c['prazos_relativos'], [])
        c, = analisar_cronograma([self.JUROS.replace('será paga', 'não será paga')])['condicoes']
        self.assertEqual(c['prazos_relativos'], [])

    def test_prazo_com_extenso_compativel_e_evento(self):
        for prefixo in ('', 'em ', 'no prazo de '):
            texto = self.JUROS.replace('30', prefixo + '30 (trinta)')
            c, = analisar_cronograma([texto])['condicoes']
            self.assertEqual(c['prazos_relativos'], [{'dias': 30, 'evento': 'liberacao_recursos'}])

    def test_base_de_calculo_antes_da_exigibilidade_nao_oculta_cobranca(self):
        texto = self.FASES.replace('Os juros serão', 'O principal e a base de cálculo serão')
        c, = analisar_cronograma([texto])['condicoes']
        self.assertEqual(c['periodicidades_por_fase'], [
            {'fase': 'carencia', 'meses': 3}, {'fase': 'amortizacao', 'meses': 1}])

    def test_calculo_posterior_nao_e_interpretado_como_exigibilidade(self):
        texto = ('Os juros são exigíveis no vencimento e calculados mensalmente durante '
                 'a carência e a amortização.')
        c, = analisar_cronograma([texto])['condicoes']
        self.assertEqual(c['periodicidades_por_fase'], [])

    def test_fim_do_prazo_de_carencia_preserva_dependencia(self):
        texto = 'A primeira prestação de amortização vence após o término do prazo de carência.'
        c, = analisar_cronograma([texto])['condicoes']
        self.assertEqual(c['eventos_referidos'], ['termino_carencia'])

    def test_frequencias_com_virgulas_e_condicao_preservada(self):
        texto = self.FASES.replace('trimestralmente durante', 'trimestralmente, durante').replace(
            'carência e mensalmente durante', 'carência, se houver; e mensalmente, durante')
        c, = analisar_cronograma([texto])['condicoes']
        self.assertEqual(c['periodicidades_por_fase'], [
            {'fase': 'carencia', 'meses': 3}, {'fase': 'amortizacao', 'meses': 1}])
        self.assertEqual(c['evidencias'][0]['trecho'], texto)

    def test_primeira_prestacao_com_pagador_expresso(self):
        for pagador in ('pela emitente', 'pelo emitente'):
            texto = self.JUROS.replace('paga 30', 'paga ' + pagador + ' 30 (trinta)')
            c, = analisar_cronograma([texto])['condicoes']
            self.assertEqual(c['prazos_relativos'], [{'dias': 30, 'evento': 'liberacao_recursos'}])

    def test_frequencias_concorrentes_sao_preservadas_sem_escolha(self):
        result = analisar_cronograma([self.FASES, self.FASES.replace('trimestralmente', 'semestralmente')])
        self.assertEqual([c['periodicidades_por_fase'][0]['meses'] for c in result['condicoes']], [3, 6])
        self.assertEqual(result['completude'], 'nao_avaliada')
        self.assertFalse(result['calendario_gerado'])

    def test_nao_resolve_frequencia_negada_ou_com_excecao(self):
        for texto in (self.FASES.replace('serão', 'não serão'), self.FASES + ', salvo exceção.'):
            self.assertEqual(analisar_cronograma([texto])['condicoes'][0]['periodicidades_por_fase'], [])

    def test_diagnostico_nao_modifica_os_cinco_campos(self):
        paginas = [self.JUROS, self.FASES, self.AJUSTE]
        antes = extrair_campos(paginas)
        analisar_cronograma(paginas)
        self.assertEqual(antes, extrair_campos(paginas))
        self.assertIsNone(antes['data_vencimento']['valor'])

    def test_evidencia_incorreta_e_recusada(self):
        result = analisar_cronograma([self.JUROS])
        for change in ({'pagina': 2}, {'trecho': 'Texto que não existe'}):
            altered = copy.deepcopy(result)
            altered['condicoes'][0]['evidencias'][0].update(change)
            with self.assertRaises(ValueError):
                verificar_diagnostico(altered, [self.JUROS])

    def test_documento_sem_condicao_nao_significa_ausencia_comprovada(self):
        result = analisar_cronograma(['Aluguel mensal de R$ 1.200,00.'])
        self.assertEqual(result['estado'], 'nao_identificado')
        self.assertEqual(result['completude'], 'nao_avaliada')

    def test_leitura_parcial_nao_produz_diagnostico_isolado(self):
        for status in ('parcial', 'falhou'):
            registro = {'processamento': {'status': status}, 'documento_id': 'ficticio',
                        'pdf_sha256': 'a' * 64, 'versao_extrator': 'teste'}
            result = criar_diagnostico(registro, [self.JUROS, ''])
            self.assertEqual(result['condicoes'], [])
            self.assertEqual(result['estado'], 'nao_executado_leitura_incompleta')
            self.assertEqual(result['pdf_sha256'], registro['pdf_sha256'])


if __name__ == '__main__':
    unittest.main()
