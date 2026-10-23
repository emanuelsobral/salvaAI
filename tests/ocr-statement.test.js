import test from 'node:test';
import assert from 'node:assert/strict';
import { ocrStatementLines } from '../src/utils/ocrStatement.js';
import { suggestPdfRows, reviewedPdfCSV } from '../src/utils/pdfStatement.js';
import { recognizeOcrImage } from '../src/utils/ocrTask.js';

const word = (text, x0, x1, confidence = 96) => ({ text, confidence, bbox: { x0, x1, y0: 10, y1: 30 } });
const header = [word('Histórico', 300, 380), word('Documento', 600, 700), word('Valor', 750, 790), word('R$', 800, 820), word('Saldo', 900, 950)];
const row = (date = '01/12/2022', amount = '15,00', direction = 'C') => [word(date, 10, 110), word('870', 300, 330),
  word('Loja', 340, 390), word('123', 400, 430), word('999.000', 620, 695), word(amount, 740, 800), word(direction, 805, 820), word('100,00', 880, 930), word('C', 935, 950)];
const data = lines => ({ text: 'Exemplo fictício', blocks: [{ paragraphs: [{ lines: lines.map((words, i) => ({
  words: words.map(w => ({ ...w, bbox: { ...w.bbox, y0: 10 + i * 40, y1: 30 + i * 40 } })), bbox: { y0: 10 + i * 40, y1: 30 + i * 40 }
})) }] }] });

test('OCR recompõe a mesma linha quando o motor separa as colunas em blocos', () => {
  const original = data([header, row(), row('02/12/2022', '20,00', 'D')]);
  const separated = { text: original.text, blocks: original.blocks[0].paragraphs[0].lines.flatMap(line =>
    line.words.map(word => ({ paragraphs: [{ lines: [{ words: [word], bbox: word.bbox }] }] }))) };
  assert.deepEqual(suggestPdfRows(ocrStatementLines(separated, 1)), suggestPdfRows(ocrStatementLines(original, 1)));
  assert.equal(suggestPdfRows(ocrStatementLines(separated, 1)).length, 2);
});

test('OCR preserva cabeçalhos já agrupados com palavras em alturas diferentes', () => {
  const original = data([header, row()]);
  const heading = original.blocks[0].paragraphs[0].lines[0];
  heading.words.push({ ...word('Dt.', 100, 120), bbox: { x0: 100, x1: 120, y0: 30, y1: 50 } });
  heading.bbox.y1 = 50;
  const rows = suggestPdfRows(ocrStatementLines(original, 1));
  assert.equal(rows.length, 1); assert.equal(rows[0].description, '870 Loja 123');
  assert.equal(rows[0].amount, '15.00'); assert.equal(rows[0].direction, 'INCOME');
});

test('OCR separa valor de saldo/documento e preserva números no estabelecimento', () => {
  const rows = suggestPdfRows(ocrStatementLines(data([header, row(), row('02/12/2022', '20,00', 'D')]), 1));
  assert.deepEqual(rows.map(r => [r.date, r.amount, r.direction]), [['2022-12-01', '15.00', 'INCOME'], ['2022-12-02', '20.00', 'EXPENSE']]);
  assert.equal(rows[0].description, '870 Loja 123'); assert.equal(rows[0].ocr, true);
});

test('OCR remove saldo anterior e SALDO espaçado sem eliminar saldo no nome da loja', () => {
  const summary = text => [word('31/12/2022', 10, 110), word(text, 300, 550), word('100,00', 880, 930), word('C', 935, 950)];
  const rows = suggestPdfRows(ocrStatementLines(data([header, summary('000 Saldo Anterior'), row(), summary('999 S A L D O'), summary('999SALDO')]), 1));
  assert.equal(rows.length, 1);
});

test('OCR não corrige caracteres numéricos nem inventa sinal quando a leitura é ambígua', () => {
  const rows = suggestPdfRows(ocrStatementLines(data([header, row('31/02/2026', '1O,00', 'C'), row('01/12/2022', '15,00', '?')]), 1));
  assert.equal(rows.length, 2); assert.equal(rows[0].date, ''); assert.equal(rows[0].amount, '');
  assert.equal(rows[1].direction, ''); assert.throws(() => reviewedPdfCSV(rows));
});

test('OCR reúne apenas detalhes alinhados e sinaliza baixa confiança sem ocultar texto', () => {
  const source = row(); source[3].confidence = 20;
  const rows = suggestPdfRows(ocrStatementLines(data([header, source,
    [word('12/12', 300, 340), word('Complemento', 350, 500)], [word('Observações', 10, 150)]]), 2));
  assert.equal(rows[0].ocrUncertain, true); assert.match(rows[0].description, /12\/12 Complemento/);
  assert.doesNotMatch(rows[0].description, /Observações/); assert.equal(rows[0].page, 2);
});

test('OCR vazio não inventa lançamentos; texto sem cabeçalho segue revisão genérica', () => {
  assert.deepEqual(ocrStatementLines({ text: '', blocks: null }, 1), []);
  const rows = suggestPdfRows(ocrStatementLines(data([[word('01/12/2022', 10, 110), word('Teste', 150, 200), word('-10,00', 300, 400)]]), 1));
  assert.equal(rows.length, 1); assert.equal(rows[0].direction, 'EXPENSE'); assert.equal(rows[0].ocr, true);
});

test('worker de OCR é encerrado após sucesso e após falha', async () => {
  for (const failing of [false, true]) {
    let terminated = 0;
    const createWorker = async () => ({ setParameters: async () => {}, recognize: async () => {
      if (failing) throw Error('Falha de teste'); return { data: { text: 'ok' } };
    }, terminate: async () => { terminated++; } });
    const job = recognizeOcrImage(new Uint8Array(), { createWorker });
    if (failing) await assert.rejects(job, /Falha de teste/);
    else assert.equal((await job).text, 'ok');
    assert.equal(terminated, 1);
  }
});

test('cancelamento durante inicialização impede reconhecimento e encerra worker tardio', async () => {
  let ready, terminated = 0, recognized = 0;
  const controller = new AbortController();
  const job = recognizeOcrImage(new Uint8Array(), { signal: controller.signal, createWorker: () => new Promise(resolve => { ready = resolve; }) });
  controller.abort(); await assert.rejects(job, /cancelada/);
  ready({ terminate: async () => { terminated++; }, recognize: async () => { recognized++; } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(terminated, 1); assert.equal(recognized, 0);
});

test('tempo excedido encerra reconhecimento pendente e libera a chamada', async () => {
  let terminated = 0;
  const createWorker = async () => ({ setParameters: async () => {}, recognize: () => new Promise(() => {}), terminate: async () => { terminated++; } });
  await assert.rejects(recognizeOcrImage(new Uint8Array(), { createWorker, timeoutMs: 10 }), /excedeu/);
  assert.equal(terminated, 1);
});
