import { parseCSV } from './csv.js';
import { parseOFX } from './ofx.js';

export function parseStatement(text, format = 'csv') {
  if (format === 'ofx') return parseOFX(text);
  // PDF enters here only after the editable review produces canonical CSV.
  if (['csv', 'pdf'].includes(format)) return { ...parseCSV(text), format };
  return { rows: [], total: 0, errors: ['Formato não suportado. Use CSV, OFX ou PDF revisado.'] };
}

export async function readStatementFile(file) {
  const format = file.name.split('.').at(-1).toLowerCase();
  if (!['csv', 'ofx', 'pdf'].includes(format)) throw Error('Selecione um arquivo .csv, .ofx ou .pdf.');
  if (format === 'pdf') {
    if (!file.size || file.size > 10000000) throw Error('Use um PDF não vazio de até 10 MB.');
    return { format };
  }
  if (!file.size || file.size > 1000000) throw Error('Use um arquivo não vazio de até 1 MB.');
  const buffer = await file.arrayBuffer();
  const header = new TextDecoder('ascii').decode(buffer.slice(0, 512));
  let text;
  if (/CHARSET:\s*(?:1252|8859-1)|encoding=["'](?:windows-1252|iso-8859-1)["']/i.test(header)) {
    text = new TextDecoder('windows-1252').decode(buffer);
  } else {
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
    catch { text = new TextDecoder('windows-1252').decode(buffer); }
  }
  if (text.includes('\u0000')) throw Error('Codificação não suportada. Exporte em UTF-8 ou Windows-1252.');
  return { text, format };
}
