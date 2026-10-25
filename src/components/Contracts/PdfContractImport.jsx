import { useEffect, useRef, useState } from 'react';
import { readContractPdf, extractContractPages } from '../../utils/contractPdf';
import { contractDraft, prepareSourceReview } from '../../utils/contractExtraction';
import { CONTRACT_OCR_TIMEOUT_MS } from '../../utils/contractOcr';

export default function PdfContractImport({ onPrepared, onCancel }) {
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [useOcr, setUseOcr] = useState(false);
  const active = useRef(null);
  useEffect(() => () => { active.current?.abort(); active.current = null; }, []);
  async function choose(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const timeout = setTimeout(() => controller.abort(), useOcr ? CONTRACT_OCR_TIMEOUT_MS : 120000);
    setError(''); setProgress('Abrindo PDF…');
    const onProgress = message => { if (active.current === controller && !controller.signal.aborted) setProgress(message); };
    try {
      const { pages, pdfSha256 } = await readContractPdf(file, { signal: controller.signal, onProgress, useOcr });
      const extraction = await extractContractPages(pages, { signal: controller.signal, onProgress });
      if (active.current !== controller || controller.signal.aborted) return;
      const draft = contractDraft(extraction, pages);
      const sourceReview = prepareSourceReview(extraction, pages, pdfSha256, { useOcr });
      onPrepared({ draft, sourceReview });
    } catch (failure) {
      if (active.current === controller) setError(controller.signal.aborted ? 'Leitura cancelada ou limite de tempo atingido. Nenhum dado foi salvo.' : failure.message);
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) { active.current = null; setProgress(''); }
    }
  }
  return <section className="contract-editor" aria-labelledby="pdf-contract-heading">
    <h2 id="pdf-contract-heading">Importar contrato em PDF</h2>
    <p>A leitura acontece neste dispositivo, sem enviar o PDF ou consumir serviços de IA. O leitor de contratos baixa cerca de 12 MB do próprio site no primeiro uso; o OCR baixa arquivos adicionais.</p>
    <p>Até 10 MB e 50 páginas. Arquivos protegidos por senha exigem uma cópia desbloqueada. O OCR pode levar alguns minutos e tem limite total de dez minutos.</p>
    <label className="contract-plan-confirm"><input type="checkbox" checked={useOcr} disabled={!!progress} onChange={event => setUseOcr(event.target.checked)} />Ler páginas digitalizadas (OCR)</label>
    {useOcr ? <p className="contract-notice">Todas as páginas serão lidas como imagem, uma por vez. O OCR pode confundir números e palavras: confira os campos e os trechos com o PDF original.</p> : null}
    <label className="contract-file">Selecionar PDF<input type="file" accept=".pdf,application/pdf" onChange={choose} /></label>
    {progress ? <p role="status">{progress}</p> : null}
    {error ? <p className="contract-error" role="alert">{error}</p> : null}
    <p>Nenhum contrato é salvo nesta etapa. Depois da leitura, revise os campos e as evidências antes de confirmar o cadastro.</p>
    <button className="contract-secondary" onClick={() => { active.current?.abort(); active.current = null; onCancel(); }}>Cancelar importação</button>
  </section>;
}
