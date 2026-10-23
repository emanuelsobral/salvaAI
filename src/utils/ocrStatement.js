import { pdfDate, pdfMoneyOptions } from './pdfStatement.js';

const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// OCR is always provisional. Confidence is an engine hint, not a calibrated probability.
export function ocrStatementLines(data, page) {
  const source = (data.blocks || []).flatMap(block => (block.paragraphs || []).flatMap(paragraph => paragraph.lines || []));
  if (source.length > 20000 || (data.text || '').length > 1000000) throw Error('Texto da imagem muito grande. Use um PDF menor.');
  // The engine may return each table column as a separate block. Rebuild visual rows
  // from line boxes, preserving rows the engine already grouped correctly.
  const words = source.flatMap(line => line.words || []);
  if (words.length > 20000) throw Error('Texto da imagem muito grande. Use um PDF menor.');
  const groups = [];
  for (const line of source.sort((a, b) => (a.bbox.y0 + a.bbox.y1) - (b.bbox.y0 + b.bbox.y1))) {
    const center = (line.bbox.y0 + line.bbox.y1) / 2, height = line.bbox.y1 - line.bbox.y0;
    const last = groups.at(-1);
    if (!last || Math.abs(center - last.center) > Math.min(height, last.height) * 0.65) groups.push({ center, height, words: [...line.words] });
    else last.words.push(...line.words);
  }
  const lines = groups.map((group, i) => {
    const sorted = group.words.sort((a, b) => a.bbox.x0 - b.bbox.x0);
    return { id: `ocr-${page}-${i}`, page, text: sorted.map(word => word.text).join(' '), words: sorted,
      ocr: true, ocrUncertain: sorted.some(word => word.confidence < 85) };
  });
  let columns = null, last = null;
  for (const line of lines) {
    const words = line.words;
    const find = text => words.find(word => normalize(word.text) === text);
    const description = find('historico'), document = find('documento'), value = find('valor'), currency = find('r$'), balance = find('saldo');
    if (description && document && value && currency && balance && description.bbox.x0 < document.bbox.x0 &&
      document.bbox.x0 < value.bbox.x0 && value.bbox.x0 < currency.bbox.x0 && currency.bbox.x0 < balance.bbox.x0) {
      columns = { description, document, right: currency.bbox.x1, balance: balance.bbox.x1,
        tolerance: Math.max(12, (value.bbox.y1 - value.bbox.y0) * 1.5) };
      line.tableOnly = true; last = null; continue;
    }
    if (!columns) continue;
    const first = words[0];
    const dateText = /^\d{2}\/\d{2}\/\d{4}$/.test(first?.text || '') ? first.text : '';
    if (!dateText || first.bbox.x1 >= columns.description.bbox.x0) {
      if (last && words.length && words.every(word => word.bbox.x0 >= columns.description.bbox.x0 - 12 && word.bbox.x1 < columns.document.bbox.x0) &&
        /^\d{2}\/\d{2}\b/.test(line.text)) {
        last.tableFields.description += ` ${line.text}`;
        last.sectionSource = `${last.sectionSource || last.text}\n${line.text}`;
        last.ocrUncertain ||= line.ocrUncertain;
        line.tableOnly = true;
      } else { columns = null; last = null; }
      continue;
    }
    line.tableOnly = true;
    const detailWords = words.filter(word => word.bbox.x0 >= columns.description.bbox.x0 - 12 && word.bbox.x1 < columns.document.bbox.x0);
    const descriptionText = detailWords.map(word => word.text).join(' ');
    if (/^(saldoanterior|saldo)$/i.test(normalize(descriptionText).replace(/^\d{3}\s*/, '').replace(/\s/g, ''))) { last = null; continue; }
    const options = [];
    for (let i = 0; i < words.length; i++) {
      const word = words[i], next = words[i + 1];
      if (word.bbox.x0 <= columns.document.bbox.x0) continue;
      const indicator = next && /^[CD+-]$/.test(next.text) && next.bbox.x0 - word.bbox.x1 < columns.tolerance ? next : null;
      const right = (indicator || word).bbox.x1;
      if (Math.abs(right - columns.right) > columns.tolerance || Math.abs(right - columns.balance) < Math.abs(right - columns.right)) continue;
      const text = word.text + (indicator ? ` ${indicator.text}` : '');
      const matches = pdfMoneyOptions(text);
      if (matches.length === 1 && matches[0].label === text) options.push(matches[0]);
      if (indicator) i++;
    }
    line.tableFields = { description: descriptionText, dateCandidates: [dateText], options, ocrBased: true };
    // Preserve invalid/unclear fields for correction instead of silently fixing OCR characters.
    if (!pdfDate(dateText)) line.ocrUncertain = true;
    last = line;
  }
  return lines;
}
