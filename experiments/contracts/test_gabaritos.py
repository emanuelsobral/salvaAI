"""Formulários não podem pressupor ausência nem herdar previsões."""
import unittest
from preparar_gabaritos import rascunho


class GabaritoTests(unittest.TestCase):
    def setUp(self):
        self.item = {'id': 'exemplo', 'sha256': 'a' * 64, 'categoria': 'aluguel',
                     'natureza': 'modelo_com_lacunas', 'estrato': 'principal', 'divisao': 'teste',
                     'paginas': 2, 'arquivo': 'data/originais/exemplo.pdf'}

    def test_cinco_campos_sem_estado_presumido(self):
        f = rascunho(self.item)
        self.assertEqual(len(f['registro']['campos']), 5)
        for c in f['registro']['campos'].values():
            self.assertIsNone(c['estado'])
            self.assertIsNone(c['valor'])
            self.assertEqual(c['evidencias'], [])

    def test_nao_declara_leitura_revisao_ou_responsavel(self):
        f = rascunho(self.item)
        self.assertFalse(f['confirmacao_leitura_humana'])
        self.assertEqual(f['status'], 'rascunho_nao_avaliavel')
        self.assertTrue(all(v is None for v in f['registro']['anotacao'].values()))

    def test_metadados_sem_respostas_do_extrator(self):
        self.item['campos'] = {'valor_parcela': {'valor': 'previsao-que-nao-deve-ser-copiada'}}
        f = rascunho(self.item)
        self.assertEqual(f['registro']['pdf_sha256'], self.item['sha256'])
        self.assertEqual(f['contexto']['divisao'], 'teste')
        self.assertNotIn('previsao-que-nao-deve-ser-copiada', str(f))
        self.assertIsNone(f['registro']['versao_extrator'])


if __name__ == '__main__':
    unittest.main()
