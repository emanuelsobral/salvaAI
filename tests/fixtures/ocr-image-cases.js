// Synthetic fixture only. Shared by the browser harness and the local OCR quality check.
export const ocrImageCases = [
  { id: 'clear', label: 'Imagem nítida', scale: 2, angle: 0, color: '#111' },
  { id: 'reduced', label: 'Imagem reduzida', scale: 0.85, angle: 0, color: '#111' },
  { id: 'tilted', label: 'Imagem inclinada', scale: 1.5, angle: 2, color: '#333' },
  { id: 'poor', label: 'Imagem muito degradada', scale: 0.4, angle: 4, color: '#aaa' }
];

export const ocrImageExpected = [
  { date: '2026-10-01', amount: '1250.00', direction: 'INCOME' },
  { date: '2026-10-02', amount: '42.90', direction: 'EXPENSE' },
  { date: '2026-10-03', amount: '8.75', direction: 'EXPENSE' },
  { date: '2026-10-04', amount: '25.50', direction: 'INCOME' }
];

export function paintOcrImage(canvas, variant) {
  canvas.width = Math.round(1200 * variant.scale); canvas.height = Math.round(800 * variant.scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(variant.scale, variant.scale);
  ctx.translate(600, 400); ctx.rotate(variant.angle * Math.PI / 180); ctx.translate(-600, -400);
  ctx.fillStyle = variant.color; ctx.font = '20px Arial';
  ctx.fillText('EXTRATO FICTICIO PARA TESTES - SEM DADOS REAIS', 50, 80);
  const text = (value, x, y, align = 'left') => { ctx.textAlign = align; ctx.fillText(value, x, y); };
  text('Data', 50, 180); text('Histórico', 260, 180); text('Documento', 660, 180);
  text('Valor R$', 960, 180, 'right'); text('Saldo', 1130, 180, 'right');
  const rows = [
    ['30/09/2026', '000 Saldo Anterior', '', '', '0,00 C'],
    ['01/10/2026', '870 Crédito fictício', '100.001', '1.250,00 C', '1.250,00 C'],
    ['02/10/2026', '211 Mercado de teste', '100.002', '42,90 D', '1.207,10 C'],
    ['03/10/2026', '211 Transporte fictício', '100.003', '8,75 D', '1.198,35 C'],
    ['04/10/2026', '870 Devolução de teste', '100.004', '25,50 C', '1.223,85 C'],
    ['31/10/2026', '999 S A L D O', '', '', '1.223,85 C']
  ];
  rows.forEach((row, index) => {
    const y = 230 + index * 55;
    text(row[0], 50, y); text(row[1], 260, y); text(row[2], 770, y, 'right');
    text(row[3], 960, y, 'right'); text(row[4], 1130, y, 'right');
  });
  text('OBSERVAÇÕES: documento fictício, não usar em uma conta real.', 50, 650);
  return canvas;
}

// Image-only PDF with byte-accurate offsets. No hidden text layer to help the OCR.
export function imageOnlyPdf(jpeg, width, height) {
  const encoder = new TextEncoder(), chunks = [], offsets = [0]; let size = 0;
  const push = value => { const bytes = typeof value === 'string' ? encoder.encode(value) : value; chunks.push(bytes); size += bytes.length; };
  const object = (number, body) => { offsets.push(size); push(`${number} 0 obj\n`); push(body); push('\nendobj\n'); };
  push('%PDF-1.4\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 840 560] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>');
  offsets.push(size); push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  push(jpeg); push('\nendstream\nendobj\n');
  const stream = 'q 840 0 0 560 0 0 cm /Im1 Do Q';
  object(5, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  const xref = size;
  push(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const pdf = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { pdf.set(chunk, offset); offset += chunk.length; }
  return pdf;
}
