// Limpeza local antes de persistir ou enviar descrições a outros serviços.
export function sanitizeStatementDescription(value = '') {
  let text = value.replace(/^\[[^\]]+\]\s*/, '').trim();
  const transfer = /^(?:Transfer[eê]ncia (?:recebida|enviada)(?: pelo| via)?(?: Pix| TED| DOC)?|Pix (?:recebido|enviado))\s*-\s*/i;
  text = text.replace(transfer, '');
  text = text.split(/\s+-\s+(?=(?:[•*xX\d][•*xX\d.\/-]{6,}|(?:BCO|BANCO|AG[EÊ]NCIA|CONTA)\b))/i)[0];
  text = text.replace(/\b(?:CPF|CNPJ|AG[EÊ]NCIA|CONTA(?: CORRENTE)?|BANCO|BCO)\s*[:\s].*$/i, '');
  text = text.replace(/[•*\d]{3}\.[•*\d]{3}\.[•*\d]{3}-[•*\d]{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, '');
  return text.replace(/(?:\s+-\s*)+$/, '').replace(/\s{2,}/g, ' ').trim() || 'Movimentação importada';
}

