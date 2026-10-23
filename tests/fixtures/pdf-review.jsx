// Browser fixture: synthetic data only; no authentication, database or API calls.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import PdfStatementReview from '../../src/components/Modals/PdfStatementReview';
import { parseStatement } from '../../src/utils/statement';
import '../../src/styles/global.css';
import cases from './pdf-statement-cases.json';
import { ocrImageCases, paintOcrImage, imageOnlyPdf } from './ocr-image-cases';

function fixture(empty = false, pages = 2, samples = null) {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const kids = [];
  for (let i = 0; i < pages; i++) {
    kids.push(`${objects.length + 1} 0 R`);
    const lines = samples ? samples.slice(i * 8, (i + 1) * 8).map(sample => sample.text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) :
      i ? ['17/10 Sem sinal 25,00', '17/10 Pix -10,00 1.965,00'] : ['EXTRATO FICTICIO - TESTE', '16/10/2026 Saldo anterior 0,00', '16/10/2026 Salario +2.000,00'];
    const stream = empty ? '0.2 0.4 0.7 rg 30 600 300 50 re f' : `BT /F1 14 Tf 40 740 Td ${lines.map((text, index) => `${index ? '0 -30 Td ' : ''}(${text}) Tj`).join('\n')} ET`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${objects.length + 2} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }
  objects[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages} >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n` + offsets.slice(1).map(offset => String(offset).padStart(10, '0') + ' 00000 n \n').join('');
  pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new File([pdf], 'extrato-ficticio.pdf', { type: 'application/pdf' });
}

export default function App() {
  const [file, setFile] = useState(null), [text, setText] = useState(''), [version, setVersion] = useState(0), [width, setWidth] = useState(680);
  const load = next => { setFile(next); setText(''); setVersion(v => v + 1); };
  const loadImage = async variant => {
    const canvas = paintOcrImage(document.createElement('canvas'), variant);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    const pdf = imageOnlyPdf(new Uint8Array(await blob.arrayBuffer()), canvas.width, canvas.height);
    load(new File([pdf], `ocr-ficticio-${variant.id}.pdf`, { type: 'application/pdf' }));
  };
  return <main style={{ maxWidth: width, margin: 'auto', padding: 16 }}>
    <h1>Teste local de extrato PDF</h1><p>Os botões geram exemplos fictícios. Arquivos escolhidos são lidos localmente. Nenhuma gravação.</p>
    <label htmlFor="local-pdf">PDF local para validação (somente neste navegador)</label>
    <input id="local-pdf" type="file" accept=".pdf" onChange={event => { if (event.target.files[0]) load(event.target.files[0]); event.target.value = ''; }} />
    <button onClick={() => load(fixture())}>PDF com texto</button>
    <button onClick={() => load(fixture(false, 2, cases))}>PDF casos de revisão</button>
    <button onClick={() => load(fixture(true, 1))}>PDF sem texto</button>
    {ocrImageCases.map(variant => <button key={variant.id} onClick={() => loadImage(variant)}>{variant.label}</button>)}
    <button onClick={() => load(new File(['inválido'], 'invalido.pdf'))}>PDF inválido</button>
    <button onClick={() => load(fixture(true, 51))}>PDF 51 páginas</button>
    <button onClick={() => setWidth(320)}>Largura 320</button>
    {file && <PdfStatementReview key={version} file={file} disabled={false} onReady={setText} onInvalidate={() => setText('')} />}
    <output>{text ? JSON.stringify(parseStatement(text, 'pdf')) : 'Aguardando revisão'}</output>
  </main>;
}
const root = import.meta.hot?.data.root || createRoot(document.getElementById('root'));
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<App />);
