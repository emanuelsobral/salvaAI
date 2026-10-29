import { useEffect, useRef, useState } from 'react';
import { readContractPdf, extractContractPages } from '../../utils/contractPdf';
import { contractDraft, prepareSourceReview } from '../../utils/contractExtraction';
import { CONTRACT_OCR_TIMEOUT_MS } from '../../utils/contractOcr';

export default function PdfContractImport({ onPrepared, onCancel }) {
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [useOcr, setUseOcr] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const active = useRef(null);
  useEffect(() => () => { active.current?.abort(); active.current = null; }, []);
  async function choose(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const timeout = setTimeout(() => controller.abort(), useOcr || useAi ? CONTRACT_OCR_TIMEOUT_MS : 120000);
    setError(''); setProgress('Abrindo PDF…');
    const onProgress = message => { if (active.current === controller && !controller.signal.aborted) setProgress(message); };
    try {
      const { pages, pdfSha256 } = await readContractPdf(file, { signal: controller.signal, onProgress, useOcr, useAi });
      const extraction = await extractContractPages(pages, { signal: controller.signal, onProgress });
      if (active.current !== controller || controller.signal.aborted) return;
      const draft = contractDraft(extraction, pages);
      const sourceReview = prepareSourceReview(extraction, pages, pdfSha256, { useOcr, useAi });
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
    <p>Escolha como ler o contrato. O leitor local mantém o documento neste aparelho. O OCR com DeepSeek envia imagens das páginas para a API e consome créditos do administrador.</p>
    <p>Até 10 MB; 50 páginas na leitura local ou 10 com DeepSeek. Arquivos protegidos por senha exigem uma cópia desbloqueada. O limite total de OCR é de dez minutos.</p>
    <label className="contract-plan-confirm"><input type="checkbox" checked={useOcr} disabled={!!progress || useAi} onChange={event => setUseOcr(event.target.checked)} />Ler páginas digitalizadas (OCR local)</label>
    <label className="contract-plan-confirm"><input type="checkbox" checked={useAi} disabled={!!progress} onChange={event => { setUseAi(event.target.checked); setUseOcr(false); }} />Usar OCR com DeepSeek e enviar as páginas para leitura</label>
    {useAi ? <p className="contract-notice">Uma consulta por página, sem repetição automática. A IA transcreve o documento; o leitor de campos gera as sugestões para revisão. Confira números, datas e lacunas no original.</p> : null}
    {useOcr ? <p className="contract-notice">Todas as páginas serão lidas como imagem, uma por vez. O OCR pode confundir números e palavras: confira os campos e os trechos com o PDF original.</p> : null}
    <label className="contract-file">Selecionar PDF<input type="file" accept=".pdf,application/pdf" disabled={!!progress} onChange={choose} /></label>
    {progress ? <p role="status">{progress}</p> : null}
    {error ? <p className="contract-error" role="alert">{error}</p> : null}
    <p>Nenhum contrato é salvo nesta etapa. Depois da leitura, revise os campos e as evidências antes de confirmar o cadastro.</p>
    <button className="contract-secondary" onClick={() => { active.current?.abort(); active.current = null; onCancel(); }}>Cancelar importação</button>
  </section>;
}
