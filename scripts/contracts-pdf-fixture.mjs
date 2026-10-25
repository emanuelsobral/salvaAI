// Minimal, fictitious PDFs: no personal documents or evaluation corpus.
export function contractPdf(pages) {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const kids = [];
  for (const lines of pages) {
    const id = objects.length + 1;
    kids.push(`${id} 0 R`);
    const escaped = lines.map(line => String(line).replace(/([\\()])/g, '\\$1'));
    const stream = `BT /F1 11 Tf 40 760 Td 18 TL ${escaped.map(line => `(${line}) Tj T*`).join('\n')} ET`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${id + 1} 0 R >>`, `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
  }
  objects[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, 'latin1')); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

export const contractLines = [
  'O aluguel mensal e de R$ 1.200,00.',
  'Serao devidas 12 parcelas mensais.',
  'Vencimento todo dia 10.',
  'A vigencia e de 01/01/2027 a 31/12/2027, pelo prazo de 12 meses.',
  'O valor sera reajustado a cada 12 meses pelo IPCA.',
];
