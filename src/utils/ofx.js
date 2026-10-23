import { positiveMoney, validDate, requiredText, sumMoney } from './finance.js';
import { inferCategory } from './categories.js';

function decode(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    if (entity[0] !== '#') return named[entity.toLowerCase()];
    const number = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    if (!Number.isInteger(number) || number <= 0 || number > 0x10ffff || (number >= 0xd800 && number <= 0xdfff)) throw Error('Caractere inválido no OFX.');
    return String.fromCodePoint(number);
  });
}
function field(text, name, required = true) {
  const matches = [...text.matchAll(new RegExp('<' + name + '>\\s*([^<]*)', 'gi'))];
  if (matches.length > 1) throw Error('Campo repetido no OFX: ' + name + '.');
  const value = decode(matches[0]?.[1]?.trim() || '');
  if (required && !value) throw Error('Campo obrigatório ausente: ' + name + '.');
  if (value.length > 500) throw Error('Campo muito longo: ' + name + '.');
  return value;
}
function aggregate(text, name) {
  const matches = [...text.matchAll(new RegExp('<' + name + '>([\\s\\S]*?)</' + name + '>', 'gi'))];
  const openings = [...text.matchAll(new RegExp('<' + name + '>', 'gi'))].length;
  if (matches.length !== 1 || openings !== 1) throw Error('Use um OFX com um único ' + name + ' completo.');
  return matches[0][1];
}

// Subconjunto bancário OFX 1.x (folhas SGML sem fechamento) e 2.x (XML).
// Não executa XML, entidades externas, scripts nem solicita recursos remotos.
export function parseOFX(input) {
  const result = { rows: [], errors: [], total: 0, format: 'ofx', source: null };
  try {
    if (typeof input !== 'string' || !input.trim() || input.length > 1000000) throw Error('Use um OFX não vazio de até 1 MB.');
    if (/<!DOCTYPE|<!ENTITY|<!\[CDATA\[/i.test(input)) throw Error('OFX com declarações ou CDATA não é suportado.');
    const text = input.replace(/<!--[\s\S]*?-->/g, '');
    if (!/<OFX(?:\s[^>]*)?>/i.test(text) || !/<\/OFX>\s*$/i.test(text)) throw Error('Arquivo OFX incompleto ou inválido.');
    if (/<(?:CCSTMTRS|INVSTMTRS|LOANSTMTRS)>/i.test(text)) throw Error('Use um extrato bancário. OFX de cartão, empréstimo ou investimento não é suportado.');
    for (const match of text.matchAll(/<CODE>\s*([^<\s]+)/gi)) if (match[1] !== '0') throw Error('O OFX contém um erro retornado pelo banco.');
    const statement = aggregate(text, 'STMTRS');
    if (field(statement, 'CURDEF') !== 'BRL') throw Error('Somente extratos em reais (BRL) são suportados.');
    const account = aggregate(statement, 'BANKACCTFROM');
    const bank = field(account, 'BANKID'), accountId = field(account, 'ACCTID');
    const branch = field(account, 'BRANCHID', false), accountType = field(account, 'ACCTTYPE');
    if (!['CHECKING', 'SAVINGS'].includes(accountType)) throw Error('Tipo de conta OFX não suportado. Use conta corrente ou poupança.');
    result.source = { identity: JSON.stringify([bank, branch, accountId, accountType]), label: 'Conta de origem com final ' + accountId.slice(-4) };
    const list = aggregate(statement, 'BANKTRANLIST');
    const blocks = [...list.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)];
    if (blocks.length !== [...text.matchAll(/<STMTTRN>/gi)].length) throw Error('Transação incompleta ou fora da lista do extrato.');
    if (!blocks.length || blocks.length > 200) throw Error('O extrato deve conter de 1 a 200 transações. Exporte um período menor.');
    blocks.forEach((block, index) => {
      try {
        const item = block[1];
        if (/<CORRECT(?:FITID|ACTION)>/i.test(item)) throw Error('Correções bancárias exigem conciliação manual.');
        const rawDate = field(item, 'DTPOSTED');
        if (!/^\d{8}(?:\d{6}(?:\.\d+)?(?:\[[^\]]+\])?)?$/.test(rawDate)) throw Error('DTPOSTED inválido.');
        const date = validDate(rawDate.slice(0, 4) + '-' + rawDate.slice(4, 6) + '-' + rawDate.slice(6, 8));
        const rawAmount = field(item, 'TRNAMT');
        if (!/^[+-]?\d+(?:\.\d{1,2})?$/.test(rawAmount)) throw Error('TRNAMT inválido: use ponto decimal e até duas casas.');
        const value = Number(rawAmount), amount = positiveMoney(Math.abs(value));
        const fitId = field(item, 'FITID');
        if (fitId.length > 255) throw Error('FITID muito longo.');
        const name = field(item, 'NAME', false), memo = field(item, 'MEMO', false);
        const description = requiredText(memo && name && memo !== name ? name + ' — ' + memo : memo || name);
        result.rows.push({ date, amount, type: value < 0 ? 'EXPENSE' : 'INCOME', description, category: inferCategory(description), fitId });
      } catch (error) { result.errors.push('Transação ' + (index + 1) + ': ' + error.message); }
    });
    const ids = new Map();
    for (const row of result.rows) {
      const canonical = JSON.stringify([row.date, row.amount, row.type, row.description]);
      if (ids.has(row.fitId) && ids.get(row.fitId) !== canonical) result.errors.push('O mesmo FITID aparece com dados diferentes. Concilie o extrato.');
      ids.set(row.fitId, canonical);
    }
    result.total = sumMoney(result.rows.map(row => row.type === 'EXPENSE' ? -row.amount : row.amount));
  } catch (error) { result.errors.push(error.message); }
  return result;
}
