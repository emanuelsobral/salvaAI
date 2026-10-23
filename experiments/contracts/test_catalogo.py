"""Verificações de integridade e isolamento do catálogo; sem internet."""
import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from catalogar import criar, validar


class CatalogoTests(unittest.TestCase):
    def setUp(self):
        raiz = Path(__file__).resolve().parent / 'data' / 'testes-temporarios'
        raiz.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=raiz)
        self.base = Path(self.temp.name).resolve()
        self.assertTrue(self.base.is_relative_to(raiz.resolve()))
        self.addCleanup(self.temp.cleanup)
        originals = self.base / 'data' / 'originais'
        originals.mkdir(parents=True)
        # Bytes fictícios: estes testes verificam o catálogo, não um leitor de PDF.
        data = b'conteudo ficticio para verificar integridade'
        (originals / 'exemplo.pdf').write_bytes(data)
        self.item = {
            'id': 'exemplo', 'status_coleta': 'baixado', 'divisao': 'desenvolvimento',
            'familia': 'familia-a', 'arquivo': 'data/originais/exemplo.pdf',
            'sha256': hashlib.sha256(data).hexdigest(),
            'paginas': 1, 'leitura_paginas': [{'pagina': 1}],
        }

    def check(self, items):
        return validar({'documentos': items}, self.base)

    def test_lote_valido_preserva_falha_sem_inclui_la(self):
        failed = {'id': 'falha', 'status_coleta': 'falhou', 'divisao': None}
        self.assertEqual(self.check([self.item, failed])['pdfs'], 1)

    def test_pdf_alterado(self):
        (self.base / self.item['arquivo']).write_bytes(b'mudou')
        with self.assertRaisesRegex(ValueError, 'Hash divergente'):
            self.check([self.item])

    def test_pdf_repetido_com_outro_id(self):
        other = dict(self.item, id='outro')
        with self.assertRaisesRegex(ValueError, 'PDF duplicado'):
            self.check([self.item, other])

    def test_id_repetido(self):
        with self.assertRaisesRegex(ValueError, 'ID duplicado'):
            self.check([self.item, self.item])

    def test_familia_nao_pode_vazar_para_teste(self):
        other = dict(self.item, id='outro', divisao='teste')
        with self.assertRaisesRegex(ValueError, 'Família nas duas'):
            self.check([self.item, other])

    def test_falha_nao_pode_entrar_no_lote(self):
        with self.assertRaisesRegex(ValueError, 'Falha de coleta'):
            self.check([dict(self.item, status_coleta='falhou')])

    def test_caminho_fora_dos_originais(self):
        with self.assertRaisesRegex(ValueError, 'fora da pasta'):
            self.check([dict(self.item, arquivo='../externo.pdf')])

    def test_paginas_incompletas(self):
        with self.assertRaisesRegex(ValueError, 'páginas incompletos'):
            self.check([dict(self.item, paginas=2)])

    def test_nao_sobrescreve_piloto(self):
        target = self.base / 'congelado.json'
        target.write_text('preservar', encoding='utf-8')
        with patch('catalogar.SNAPSHOT', target):
            with self.assertRaisesRegex(ValueError, 'já congelado'):
                criar()
        self.assertEqual(target.read_text(encoding='utf-8'), 'preservar')


if __name__ == '__main__':
    unittest.main()
