import { validDate, positiveMoney, cents, requiredText } from './finance.js';
import { inferCategory } from './categories.js';

function fields(text, delimiter) {
  const rows = [];
  let row = [], value = '', quoted = false, closed = false, line = 1, start = 1;
  for (let i = 0; i <= text.length; i++) {
    const character = text[i];
    if (quoted) {
      if (character === undefined) throw new Error('Campo com aspas não fechadas na linha ' + start + '.');
      if (character === '"') {
        if (text[i + 1] === '"') { value += '"'; i++; }
        else { quoted = false; closed = true; }
      } else { value += character; if (character === '\n') line++; }
    } else if (character === '"' && !value.trim() && !closed) {
      quoted = true; value = '';
    } else if (character === delimiter || character === '\n' || character === undefined) {
      row.push(value.trim()); value = ''; closed = false;
      if (character !== delimiter) {
        if (row.some(Boolean)) rows.push({ values: row, line: start });
        row = []; line++; start = line;
      }
    } else {
      if (closed && character.trim()) throw new Error('Conteúdo inesperado após aspas na linha ' + start + '.');
      value += character;
    }
  }
  return rows;
}

function parseMoney(value) {
  let text = value.replace(/^R\$\s*/, '').trim();
  if (/^[+-]?\d{1,3}(\.\d{3})+,\d{1,2}$/.test(text)) text = text.replaceAll('.', '').replace(',', '.');
  else if (/^[+-]?\d+,\d{1,2}$/.test(text)) text = text.replace(',', '.');
  if (!/^[+-]?\d+(\.\d{1,2})?$/.test(text)) throw new Error('Valor inválido ou ambíguo. Use 1500,00 ou 1500.00.');
  const valueNumber = Number(text);
  positiveMoney(Math.abs(valueNumber));
  return valueNumber;
}

export function parseCSV(text) {
  const result = { rows: [], errors: [], total: 0 };
  if (typeof text !== 'string' || !text.trim() || text.length > 1000000) {
    result.errors.push('Cole um CSV não vazio de até 1 MB.'); return result;
  }
  try {
    text = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    // Conta apenas separadores fora de campos entre aspas na primeira linha lógica.
    let quoted = false;
    const counts = { ';': 0, '\t': 0, ',': 0 };
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') { if (quoted && text[i + 1] === '"') i++; else quoted = !quoted; }
      else if (!quoted && char === '\n') break;
      else if (!quoted && char in counts) counts[char]++;
    }
    const delimiter = counts['\t'] >= 2 ? '\t' : counts[';'] >= 2 ? ';' : ',';
    for (const { values: raw, line } of fields(text, delimiter)) {
      if (raw[0].toLowerCase() === 'data') continue;
      try {
        const row = [...raw];
        // Formato legado documentado: Data, Descrição, -25,50.
        if (delimiter === ',' && row.length === 4 && /^(R\$\s*)?[+-]?\d+$/.test(row[2]) && /^\d{1,2}$/.test(row[3])) row.splice(2, 2, row[2] + ',' + row[3]);
        if (row.length !== 3) throw new Error('Esperadas 3 colunas. Use aspas em descrições com separadores.');
        let date = row[0];
        const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date);
        if (match) date = match[3] + '-' + match[2].padStart(2, '0') + '-' + match[1].padStart(2, '0');
        validDate(date);
        const description = requiredText(row[1]);
        const value = parseMoney(row[2]);
        result.rows.push({ date, description, amount: Math.abs(value), type: value > 0 ? 'INCOME' : 'EXPENSE', category: inferCategory(description) });
        result.total += cents(value);
      } catch (error) { result.errors.push('Linha ' + line + ': ' + error.message); }
    }
    if (result.rows.length > 200) result.errors.push('Limite de 200 transações por importação. Divida o arquivo.');
    if (!result.rows.length && !result.errors.length) result.errors.push('Nenhuma transação encontrada.');
    result.total /= 100;
  } catch (error) { result.errors.push(error.message); }
  return result;
}
