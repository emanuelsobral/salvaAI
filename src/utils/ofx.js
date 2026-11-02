import { validDate, positiveMoney, requiredText, sumMoney } from './finance.js';
import { inferCategory } from './categories.js';

const tag = (text, name) => new RegExp('<' + name + '>([^<]*)', 'i').exec(text)?.[1]?.trim() || '';
const decode = value => value.replace(/&(amp|lt|gt|quot|apos);/g, (_, entity) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[entity]);

export function parseOFX(text) {
  const result = { rows: [], errors: [], total: 0, format: 'OFX' };
  try {
    if (typeof text !== 'string' || !text.trim() || text.length > 1000000) throw new Error('Selecione um OFX não vazio de até 1 MB.');
    if (!/<OFX>/i.test(text) || !/<\/OFX>/i.test(text)) throw new Error('Arquivo OFX inválido ou incompleto.');
    if ((text.match(/<STMTRS>/gi) || []).length !== 1 || /<CCSTMTRS>/i.test(text)) throw new Error('Selecione um extrato de uma única conta bancária, não uma fatura de cartão.');
    for (const status of text.matchAll(/<STATUS>([\s\S]*?)<\/STATUS>/gi)) {
      if (tag(status[1], 'CODE') !== '0') throw new Error('O banco retornou um erro no extrato OFX.');
    }
    if (tag(text, 'CURDEF') !== 'BRL') throw new Error('Somente extratos em reais (BRL) são aceitos.');
    const bank = tag(text, 'BANKID'), account = tag(text, 'ACCTID'), branch = tag(text, 'BRANCHID');
    if (!bank || !account) throw new Error('Banco ou conta não identificados no OFX.');
    const source = JSON.stringify([bank, branch, account]);
    const blocks = [...text.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)];
    if (blocks.length !== (text.match(/<STMTTRN>/gi) || []).length) throw new Error('Transação OFX incompleta.');
    const identifiers = new Set();
    for (const [index, block] of blocks.entries()) {
      try {
        const raw = tag(block[1], 'DTPOSTED');
        if (!/^\d{8}(?:\d{6}(?:\.\d+)?(?:\[[^\]]+\])?)?$/.test(raw)) throw new Error('Data OFX inválida.');
        const date = validDate(raw.slice(0, 4) + '-' + raw.slice(4, 6) + '-' + raw.slice(6, 8));
        const amountText = tag(block[1], 'TRNAMT');
        if (!/^[+-]?\d+(?:\.\d{1,2})?$/.test(amountText)) throw new Error('Valor OFX inválido.');
        const signed = Number(amountText), amount = positiveMoney(Math.abs(signed));
        const fitId = requiredText(tag(block[1], 'FITID'), 'Identificador bancário');
        if (identifiers.has(fitId)) throw new Error('Identificador bancário repetido dentro do arquivo.');
        identifiers.add(fitId);
        const description = requiredText(decode(tag(block[1], 'MEMO') || tag(block[1], 'NAME')));
        result.rows.push({ date, description, amount, type: signed > 0 ? 'INCOME' : 'EXPENSE', category: inferCategory(description), externalId: fitId, source });
      } catch (error) { result.errors.push('Transação ' + (index + 1) + ': ' + error.message); }
    }
    if (!blocks.length) throw new Error('Nenhuma transação encontrada.');
    if (blocks.length > 200) throw new Error('Limite de 200 transações por importação. Exporte um período menor.');
    result.total = sumMoney(result.rows.map(row => row.type === 'INCOME' ? row.amount : -row.amount));
  } catch (error) { result.errors.push(error.message); }
  return result;
}
