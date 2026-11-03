"""Regressão sintética da construção verbal observada no documento de desenvolvimento alu-02."""
import unittest
from regras import extrair_campos


class VencimentoMensalTests(unittest.TestCase):
    def campo(self, texto):
        return extrair_campos([texto])['data_vencimento']

    def test_pagamento_realizado_mensalmente(self):
        texto = 'O pagamento será realizado mensalmente, até o dia 12 (doze), mediante boleto bancário.'
        campo = self.campo(texto)
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['dia'], 12)
        self.assertEqual(campo['evidencias'][0]['trecho'], texto)

    def test_nao_extrai_negacao_encargo_ou_dia_invalido(self):
        for texto in [
            'O pagamento não será realizado mensalmente, até o dia 12.',
            'O pagamento será realizado mensalmente, até o dia 32.',
            'O pagamento da multa será realizado mensalmente, até o dia 12.',
            'O relatório será realizado mensalmente, até o dia 12.',
        ]:
            with self.subTest(texto=texto):
                self.assertNotEqual(self.campo(texto)['estado'], 'encontrado')

    def test_preserva_dia_util_sem_converter_em_dia_civil(self):
        campo = self.campo('O pagamento será realizado mensalmente, até o 5º dia útil do mês.')
        self.assertEqual(campo['estado'], 'encontrado')
        self.assertEqual(campo['valor']['tipo'], 'outra_regra')
        self.assertIsNone(campo['valor']['dia'])

    def test_pagamento_integral_ordinal_preserva_regra_literal(self):
        for ordinal in ['primeiro', 'terceiro', 'quinto', 'décimo']:
            texto = f'O contratante fica responsável pelo pagamento integral dos valores a que se refere esta cláusula, até o {ordinal} dia útil de cada mês.'
            with self.subTest(ordinal=ordinal):
                campo = self.campo(texto)
                self.assertEqual(campo['estado'], 'encontrado')
                self.assertEqual(campo['valor']['tipo'], 'outra_regra')
                self.assertIsNone(campo['valor']['dia'])
                self.assertEqual(campo['valor']['regra'], texto)
                self.assertEqual(campo['evidencias'][0]['trecho'], texto)

    def test_ordinal_nao_autoriza_negar_misturar_ou_inferir_pagamento(self):
        for texto in [
            'Não é exigido pagamento integral até o quinto dia útil de cada mês.',
            'A multa exige pagamento integral até o quinto dia útil de cada mês.',
            'O relatório deve ser enviado até o quinto dia útil de cada mês.',
            'O pagamento integral é devido. O relatório será enviado até o quinto dia útil de cada mês.',
            'O pagamento integral ocorrerá até o vigésimo quinto dia útil de cada mês.',
            'O pagamento integral até o quinto dia útil de cada mês é apenas uma opção, caso escolhida.',
        ]:
            with self.subTest(texto=texto):
                self.assertNotEqual(self.campo(texto)['estado'], 'encontrado')


if __name__ == '__main__':
    unittest.main()
