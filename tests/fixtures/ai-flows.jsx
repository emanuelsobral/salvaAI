import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import AIChatWidget from '../../src/components/Chat/AIChatWidget';
import PdfContractImport from '../../src/components/Contracts/PdfContractImport';
import '../../src/styles/global.css';

if (!import.meta.env.DEV || location.hostname !== '127.0.0.1') throw Error('Fixture disponível apenas em desenvolvimento local.');
// Browser tests replace authentication and API responses before loading this page.
export default function Fixture() {
  const [result, setResult] = useState(null);
  return <main style={{ padding: 16 }}>
    {new URLSearchParams(location.search).get('view') === 'chat' ? <AIChatWidget /> : <PdfContractImport onPrepared={setResult} onCancel={() => setResult(null)} />}
    <output>{result ? JSON.stringify(result) : 'Sem resultado'}</output>
  </main>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
