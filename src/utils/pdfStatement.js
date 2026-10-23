import { parseCSV } from './csv.js';
import { validDate } from './finance.js';

// Suggestions only. No bank name, current year, balance delta or description
// determines the sign of a transaction. The user reviews every PDF import.
const datePattern = /(?<![\d/])\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{4})?)\b(?![\d/])/;
const moneyPattern = /(?<![\w.,])(?:R\$\s*)?[+-]?\s*(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}(?:\s*[CD]\b|[+-](?!\d))?(?![\d,])/gi;

export function pdfLines(items, page, geometry = false) {
  const groups = [];
  const sorted = items.filter(item => typeof item.str === 'string' && item.str.trim())
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const item of sorted) {
    const last = groups.at(-1);
    if (!last || Math.abs(last.y - item.y) > 3) groups.push({ y: item.y, items: [item] });
    else last.items.push(item);
  }
  return groups.map((group, index) => ({ id: `${page}-${index}`, page,
    text: group.items.sort((a, b) => a.x - b.x).map(item => item.str.trim()).join(' '),
    ...(geometry ? { cells: group.items, y: group.y } : {}) }));
}

const normalizeLabel = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

function valueCells(line, columns) {
  const anchors = [columns.value, columns.balance].map(cell => cell.x + cell.width);
  return line.cells.flatMap(cell => {
    if (cell.x < columns.description.x - 3) return [];
    const options = pdfMoneyOptions(cell.str);
    if (options.length !== 1 || options[0].label !== cell.str.trim()) return [];
    const distances = anchors.map(anchor => Math.abs(cell.x + (cell.width || 0) - anchor));
    const index = distances[0] <= distances[1] ? 0 : 1;
    return distances[index] <= 12 ? [{ cell, option: options[0], balance: index === 1 }] : [];
  });
}

function valueDateText(line, columns) {
  return line.cells.filter(cell => cell.x >= columns.date.x - 3 && cell.x < columns.description.x - 3)
    .map(cell => cell.str.trim()).join(' ');
}

function isValueContinuation(lines, columns) {
  // Carry only column positions, never a date. A page with headings/notes or a shifted layout resets the context.
  if (columns?.mode !== 'value' || !lines.length) return false;
  return /^\d{2}\/\d{2}\/\d{4}$/.test(valueDateText(lines[0], columns)) && valueCells(lines[0], columns).length > 0;
}

function sectionDate(text) {
  const match = /^(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(\d{4})$/i.exec(text);
  if (!match) return '';
  const month = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].indexOf(match[2].toUpperCase()) + 1;
  return pdfDate(`${match[1]}/${month}/${match[3]}`);
}

// Dated sections with explicit income/expense totals, rather than a column header.
// The date never crosses a page. An incomplete section requires manual direction selection.
function annotateSections(lines) {
  let group = null;
  const finish = () => {
    if (!group) return;
    const total = group.rows.reduce((sum, row) => sum + Math.round(Number(row.tableFields.options[0].amount) * 100), 0);
    if (total !== group.total) for (const row of group.rows) {
      row.tableFields.sectionMismatch = true;
      row.tableFields.options[0].direction = '';
    }
  };
  for (const line of lines) {
    const label = line.cells.find(cell => /^total de (entradas|saidas)$/.test(normalizeLabel(cell.str)));
    if (label) {
      const previous = group;
      finish(); group = null;
      const dateText = line.cells.filter(cell => cell.x < label.x - 3).map(cell => cell.str.trim()).join(' ');
      const date = dateText ? sectionDate(dateText) : previous && Math.abs(previous.x - label.x) <= 3 ? previous.date : '';
      const values = line.cells.filter(cell => cell.x > label.x).flatMap(cell => {
        const options = pdfMoneyOptions(cell.str);
        return options.length === 1 && options[0].label === cell.str.trim() && Number.isFinite(cell.width) && cell.width > 0 ? [{ cell, option: options[0] }] : [];
      });
      line.tableOnly = true;
      if (!date || values.length !== 1) continue;
      const { cell: amountCell, option } = values[0];
      const direction = normalizeLabel(label.str).endsWith('entradas') ? 'INCOME' : 'EXPENSE';
      if (option.conflicting || (option.direction && option.direction !== direction)) continue;
      group = { date, direction, x: label.x, right: amountCell.x + amountCell.width,
        total: Math.round(Number(option.amount) * 100), rows: [], last: null, header: line.text };
      continue;
    }
    if (!group) continue;
    // Notes, page furniture or a new date outside a recognized heading end the section.
    if (line.cells.some(cell => cell.x < group.x - 3)) { finish(); group = null; continue; }
    line.tableOnly = true;
    const values = line.cells.filter(cell => Math.abs(cell.x + (cell.width || 0) - group.right) <= 12).flatMap(cell => {
      const options = pdfMoneyOptions(cell.str);
      return options.length === 1 && options[0].label === cell.str.trim() ? [{ cell, option: options[0] }] : [];
    });
    const title = line.cells.find(cell => Math.abs(cell.x - group.x) <= 3);
    if (title && values.length === 1 && values[0].cell !== title && !isSummary(title.str)) {
      const { cell: amountCell, option } = values[0];
      const description = line.cells.filter(cell => cell !== amountCell).map(cell => cell.str.trim()).join(' ');
      line.tableFields = { description, dateCandidates: [group.date], inheritedDate: true, sectionBased: true,
        options: [{ ...option, direction: option.conflicting || (option.direction && option.direction !== group.direction) ? '' : group.direction }] };
      line.sectionSource = `${group.header}\n${line.text}`;
      group.rows.push(line); group.last = line;
    } else if (!title && !values.length && group.last && line.cells.every(cell => cell.x > group.x + 12 && cell.x + (cell.width || 0) < group.right - 12)) {
      group.last.tableFields.description += ` ${line.text}`;
      group.last.sectionSource += `\n${line.text}`;
    } else { finish(); group = null; }
  }
  finish();
}

export function analyzePdfPage(items, page, previousColumns = null) {
  const raw = items.map(item => item.str).join('');
  // Intentional: broken PDF font maps produce these control characters instead of readable glyphs.
  // oxlint-disable-next-line eslint/no-control-regex
  const invalid = (raw.match(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/g) || []).length;
  // A nonempty text layer can still have broken font mappings. Never treat it as a readable page.
  if (invalid > 10 && invalid / Math.max(raw.length, 1) > 0.02) return { lines: [], unreadable: true };
  const lines = pdfLines(items, page, true);
  annotateSections(lines);
  let columns = isValueContinuation(lines, previousColumns) ? previousColumns : null, previousDate = '';
  for (const line of lines) {
    if (line.tableOnly) { columns = null; previousDate = ''; continue; }
    const find = pattern => line.cells.find(cell => pattern.test(normalizeLabel(cell.str)));
    const date = find(/^data$/), description = find(/^(?:descricao|lancamentos)$/);
    const income = find(/^entradas(?: r\$)?$/), expense = find(/^saidas(?: r\$)?$/), balance = find(/^saldo(?: \(?r\$\)?)?$/);
    const value = find(/^valor(?: \(?r\$\)?)?$/);
    if (date && description && value && balance && !income && !expense && date.x < description.x && description.x < value.x && value.x < balance.x &&
      [value, balance].every(cell => Number.isFinite(cell.width) && cell.width > 0)) {
      columns = { mode: 'value', date, description, value, balance }; previousDate = ''; line.tableOnly = true; continue;
    }
    if (date && description && income && expense && balance && date.x < description.x && description.x < income.x && income.x < expense.x && expense.x < balance.x &&
      [income, expense, balance].every(cell => Number.isFinite(cell.width) && cell.width > 0)) {
      columns = { mode: 'split', date, description, income, expense, balance }; previousDate = ''; line.tableOnly = true; continue;
    }
    if (!columns) continue;
    line.tableOnly = true;
    if (columns.mode === 'value') {
      const monetary = valueCells(line, columns);
      const dateText = valueDateText(line, columns);
      if (!datePattern.test(dateText)) { columns = null; continue; }
      const descriptionText = line.cells.filter(cell => cell.x >= columns.description.x - 3 && cell.x < columns.value.x &&
        !monetary.some(item => item.cell === cell)).map(cell => cell.str.trim()).join(' ');
      if (isSummary(descriptionText)) continue;
      const options = monetary.filter(item => !item.balance).map(({ option }) => ({ ...option,
        direction: option.conflicting ? '' : option.direction || 'INCOME' }));
      const dates = [...new Set([...dateText.matchAll(new RegExp(datePattern.source, 'g'))].map(match => match[0]))];
      if (descriptionText && options.length) line.tableFields = { description: descriptionText, dateCandidates: dates, options,
        inheritedDate: false, signedValueColumn: true };
      continue;
    }
    const { date: dateCol, description: descriptionCol, income: inCol, expense: outCol, balance: balanceCol } = columns;
    const content = line.cells.filter(cell => cell.x >= dateCol.x - 3);
    const descriptionCells = content.filter(cell => cell.x >= descriptionCol.x - 3 && cell.x < inCol.x - 3);
    const descriptionText = descriptionCells.map(cell => cell.str.trim()).join(' ');
    if (isSummary(descriptionText)) {
      if (/saldo final/i.test(descriptionText)) { columns = null; previousDate = ''; }
      continue;
    }
    const dateText = content.filter(cell => cell.x < descriptionCol.x - 3).map(cell => cell.str.trim()).join(' ');
    const dates = [...new Set([...dateText.matchAll(new RegExp(datePattern.source, 'g'))].map(match => match[0]))];
    if (dates.length === 1) previousDate = dates[0];
    else if (dateText.trim()) previousDate = ''; // Unknown/ambiguous date must not inherit another row's day.
    const anchors = [inCol, outCol, balanceCol].map(cell => cell.x + cell.width);
    const options = content.filter(cell => cell.x >= inCol.x - 3 || cell.x + (cell.width || 0) >= anchors[0] - 3).flatMap(cell => {
      if (cell.x < descriptionCol.x || descriptionCells.includes(cell)) return [];
      const right = cell.x + (cell.width || 0);
      const closest = anchors.map((anchor, index) => ({ distance: Math.abs(right - anchor), index })).sort((a, b) => a.distance - b.distance)[0];
      if (closest.index === 2 || closest.distance > 12) return [];
      const columnDirection = closest.index === 0 ? 'INCOME' : 'EXPENSE';
      return pdfMoneyOptions(cell.str).map(option => ({ ...option,
        direction: option.conflicting || (option.direction && option.direction !== columnDirection) ? '' : option.direction || columnDirection }));
    });
    if (descriptionText && options.length) line.tableFields = { description: descriptionText, dateHint: previousDate,
      dateCandidates: dates.length > 1 ? dates : previousDate ? [previousDate] : [], options,
      inheritedDate: !dateText.trim() && !!previousDate };
  }
  return { lines, unreadable: false, continuation: columns?.mode === 'value' ? columns : null };
}

export function pdfDate(value, year = '') {
  let date = value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const match = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/.exec(value || '');
    const chosenYear = match?.[3] || year;
    if (!match || !/^\d{4}$/.test(chosenYear)) return '';
    date = `${chosenYear}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  }
  try { validDate(date); return date; }
  catch { return ''; }
}

export function pdfMoneyOptions(text) {
  return [...text.matchAll(moneyPattern)].map(match => {
    const raw = match[0].trim();
    const clean = raw.replace(/^R\$\s*/i, '').trim();
    const negative = clean.startsWith('-') || /[D-]$/i.test(clean);
    const positive = clean.startsWith('+') || /[C+]$/i.test(clean);
    return { label: raw, amount: clean.replace(/^[+-]\s*/, '').replace(/\s*[CD+-]$/i, '').replaceAll('.', '').replace(',', '.'),
      ...(negative && positive ? { conflicting: true } : {}),
      direction: negative === positive ? '' : negative ? 'EXPENSE' : 'INCOME' };
  });
}

export function pdfDraft(line) {
  const dateCandidates = line.tableFields?.dateCandidates || [...new Set([...line.text.matchAll(new RegExp(datePattern.source, 'g'))].map(match => match[0]))];
  const dateHint = dateCandidates.length === 1 ? dateCandidates[0] : '';
  const options = line.tableFields?.options || pdfMoneyOptions(line.text);
  const single = options.length === 1 ? options[0] : null;
  return { id: line.id, page: line.page, source: line.sectionSource || line.text, dateHint, dateCandidates, date: pdfDate(dateHint),
    description: line.tableFields?.description || line.text.replace(datePattern, '').replace(moneyPattern, '').trim(),
    ...(line.ocr ? { ocr: true, ocrUncertain: !!line.ocrUncertain } : {}),
    ...(line.tableFields ? { columnBased: !line.tableFields.sectionBased && !line.tableFields.ocrBased, sectionBased: !!line.tableFields.sectionBased,
      sectionMismatch: !!line.tableFields.sectionMismatch, inheritedDate: line.tableFields.inheritedDate, signedValueColumn: !!line.tableFields.signedValueColumn } : {}),
    options, amount: single?.amount || '', direction: single?.direction || '', include: true };
}

export function suggestPdfRows(lines) {
  return lines.filter(line => line.tableFields || (!line.tableOnly && datePattern.test(line.text) && pdfMoneyOptions(line.text).length &&
    !isSummary(line.text))).map(pdfDraft);
}

function isSummary(text) {
  // Match complete summary labels, not words inside a merchant/transaction name.
  // Unknown labels remain visible for manual review instead of silently dropping a transaction.
  const label = text.replace(new RegExp(datePattern.source, 'g'), '').replace(moneyPattern, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[:\s]+/g, ' ').trim().toLowerCase();
  return /^(?:saldo(?: (?:anterior|final|atual|disponivel|bloqueado|do dia|em conta))?|total(?: (?:de )?(?:debitos|creditos|entradas|saidas|lancamentos|movimentacoes))?|resumo)$/.test(label);
}

export function reviewedPdfCSV(rows) {
  const selected = rows.filter(row => row.include);
  if (!selected.length || selected.length > 200) throw Error('Selecione de 1 a 200 lançamentos.');
  const quote = value => '"' + String(value).replaceAll('"', '""') + '"';
  const csv = selected.map((row, index) => {
    if (!['INCOME', 'EXPENSE'].includes(row.direction)) throw Error(`Lançamento ${index + 1}: escolha entrada ou saída.`);
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(row.amount.trim())) throw Error(`Lançamento ${index + 1}: informe o valor sem sinal e sem separador de milhar.`);
    return [row.date, row.description, (row.direction === 'EXPENSE' ? '-' : '') + row.amount.trim()].map(quote).join(';');
  }).join('\n');
  const parsed = parseCSV(csv);
  if (parsed.errors.length) throw Error(parsed.errors.join('\n'));
  return csv;
}
