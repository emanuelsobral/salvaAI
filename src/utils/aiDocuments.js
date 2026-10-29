import { pdfDate } from './pdfStatement.js';

export function validateDocumentAnswer(action, data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Leitura inválida.');
  if (action === 'contract-ocr') {
    if (typeof data.text !== 'string' || data.text.length > 60000) throw Error('Transcrição inválida.');
    return { text: data.text.trim() };
  }
  if (action !== 'statement-recovery' || !Array.isArray(data.transactions) || data.transactions.length > 100) throw Error('Movimentações inválidas.');
  return { transactions: data.transactions.map(item => {
    if (!item || typeof item.description !== 'string' || !item.description.trim() || item.description.length > 500 ||
        typeof item.evidence !== 'string' || !item.evidence.trim() || item.evidence.length > 2000) throw Error('Linha sem evidência.');
    if (item.date !== null && (typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || !pdfDate(item.date))) throw Error('Data inválida.');
    if (item.amount !== null && (typeof item.amount !== 'string' || !/^\d{1,10}\.\d{2}$/.test(item.amount) || Number(item.amount) <= 0 || Number(item.amount) > 1e9)) throw Error('Valor inválido.');
    if (item.direction !== null && !['INCOME', 'EXPENSE'].includes(item.direction)) throw Error('Direção inválida.');
    return { date: item.date, description: item.description.trim(), amount: item.amount, direction: item.direction, evidence: item.evidence.trim() };
  }) };
}

export function canRecoverStatement(rows, page, reportedMissing = false) {
  const localRows = rows.filter(row => row.page === page && !row.ai);
  return reportedMissing || !localRows.length || localRows.some(row => !row.date || !row.amount || !row.direction);
}

// Preserve local readings; generated transactions require explicit selection.
// Multiset matching keeps genuinely repeated purchases instead of collapsing them.
export function statementRecoveryDrafts(data, rows, page) {
  const { transactions } = validateDocumentAnswer('statement-recovery', data);
  const key = item => JSON.stringify([item.date || '', item.description.trim().toLowerCase(), Number(item.amount), item.direction || '']);
  const seen = new Map();
  for (const row of rows.filter(row => row.page === page)) seen.set(key(row), (seen.get(key(row)) || 0) + 1);
  return transactions.flatMap((item, index) => {
    const fingerprint = key(item);
    if (seen.get(fingerprint)) { seen.set(fingerprint, seen.get(fingerprint) - 1); return []; }
    return [{ id: `ai-${page}-${index}`, page, ai: true, include: false, source: item.evidence,
      date: item.date || '', dateHint: '', dateCandidates: [], description: item.description,
      amount: item.amount || '', direction: item.direction || '', options: [] }];
  });
}
