import { useEffect, useRef, useState } from 'react';
import { openStatementPdf } from '../../utils/pdfDocument';
import { pdfDate, pdfDraft, reviewedPdfCSV, suggestPdfRows } from '../../utils/pdfStatement';
import { canRecoverStatement, statementRecoveryDrafts } from '../../utils/aiDocuments';
import './PdfStatementReview.css';

function PdfPage({ document, number }) {
  const host = useRef(null);
  const [error, setError] = useState('');
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    let active = true, rendering;
    const canvas = window.document.createElement('canvas');
    canvas.setAttribute('aria-label', `Página ${number} do extrato`);
    host.current.replaceChildren(canvas);
    // Reset the error when synchronizing the canvas with another PDF page.
    // oxlint-disable-next-line react/set-state-in-effect
    setError('');
    (async () => {
      const page = await document.getPage(number);
      if (!active) return;
      const original = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(1.5, 1600 / Math.max(original.width, original.height)) });
      canvas.width = viewport.width; canvas.height = viewport.height;
      rendering = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      await rendering.promise;
    })().catch(() => { if (active) setError('Não foi possível mostrar esta página. Confira o arquivo original antes de continuar.'); });
    return () => { active = false; rendering?.cancel(); };
  }, [document, number]);
  return <><button type="button" className="btn-outline" aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}>{zoomed ? 'Ajustar página à tela' : 'Ampliar página'}</button>
    <div ref={host} className={`pdf-page${zoomed ? ' pdf-page-zoomed' : ''}`} tabIndex={0} role="region" aria-label="Visualização do original; role para conferir a página" />{error && <p role="alert">{error}</p>}</>;
}

export default function PdfStatementReview({ file, disabled, onReady, onInvalidate }) {
  const [loaded, setLoaded] = useState(null);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [password, setPassword] = useState('');
  const [credentials, setCredentials] = useState({ password: '' });
  const [progress, setProgress] = useState('Lendo PDF…');
  const [error, setError] = useState('');
  const [year, setYear] = useState('');
  const [checked, setChecked] = useState(false);
  const [approved, setApproved] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrPages, setOcrPages] = useState([]);
  const [aiPages, setAiPages] = useState([]);
  const [missingPages, setMissingPages] = useState([]);
  const ocrController = useRef(null);
  const counter = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true, resource;
    // Reset the editable session when the asynchronous file/password source changes.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoaded(null); setRows([]); setPage(1); setError(''); setProgress('Lendo PDF…');
    setChecked(false); setApproved(false); setYear(''); setOcrStatus(''); setOcrPages([]);
    setAiPages([]); setMissingPages([]);
    openStatementPdf(file, { password: credentials.password, signal: controller.signal,
      onProgress: (current, total) => { if (active) setProgress(`Lendo página ${current} de ${total}…`); }
    }).then(value => {
      resource = value;
      if (!active) { void value.destroy(); return; }
      setLoaded(value); setRows(suggestPdfRows(value.lines)); setProgress(''); setPassword('');
    }).catch(failure => { if (active) { setError(failure.message); setProgress(''); } });
    return () => { active = false; ocrController.current?.abort(); ocrController.current = null;
      if (resource) void resource.destroy(); else controller.abort(); };
  }, [file, credentials]);
  const change = next => { setRows(next); setChecked(false); setApproved(false); setError(''); onInvalidate(); };
  const update = (index, fields) => change(rows.map((row, i) => i === index ? { ...row, ...fields } : row));
  const add = line => change([...rows, { ...pdfDraft(line || { id: '', page, text: '' }), id: `manual-${++counter.current}` }]);
  const approve = () => {
    if (!checked || disabled || ocrStatus) return;
    try { const csv = reviewedPdfCSV(rows); onReady(csv); setApproved(true); setError(''); }
    catch (failure) { setError(failure.message); }
  };
  const readImage = async () => {
    if (!loaded || disabled || ocrController.current || ocrPages.includes(page)) return;
    const controller = new AbortController();
    ocrController.current = controller;
    setOcrStatus('Preparando leitor local…'); setError(''); setChecked(false); setApproved(false); onInvalidate();
    try {
      const { readStatementPageImage } = await import('../../utils/pdfOcr');
      const lines = await readStatementPageImage(loaded.document, page, { signal: controller.signal,
        onProgress: message => { if (ocrController.current === controller) setOcrStatus(message); } });
      if (controller.signal.aborted || ocrController.current !== controller) return;
      const suggestions = suggestPdfRows(lines);
      setLoaded(value => ({ ...value, lines: [...value.lines.filter(line => line.page !== page), ...lines] }));
      change([...rows, ...suggestions]);
      setOcrPages(value => [...value, page]);
      if (!suggestions.length) setError('A imagem foi lida, mas não gerou lançamentos reconhecíveis. Confira o texto extraído e adicione as linhas manualmente.');
    } catch (failure) {
      if (ocrController.current === controller) setError(controller.signal.aborted ? 'Leitura da imagem cancelada.' : failure.message);
    } finally {
      if (ocrController.current === controller) { ocrController.current = null; setOcrStatus(''); }
    }
  };
  const recoverWithAI = async () => {
    if (!loaded || disabled || ocrController.current || aiPages.includes(page) || !canRecoverStatement(rows, page, missingPages.includes(page))) return;
    const controller = new AbortController();
    ocrController.current = controller;
    setOcrStatus('Preparando ajuda da DeepSeek…'); setError(''); setChecked(false); setApproved(false); onInvalidate();
    try {
      const { readPdfPageWithAI } = await import('../../utils/pdfAi');
      const data = await readPdfPageWithAI(loaded.document, page, { action: 'statement-recovery', signal: controller.signal,
        onProgress: message => { if (ocrController.current === controller) setOcrStatus(message); } });
      if (controller.signal.aborted || ocrController.current !== controller) return;
      const proposals = statementRecoveryDrafts(data, rows, page);
      change([...rows, ...proposals]);
      setAiPages(value => [...value, page]);
      if (!proposals.length) setError('A IA não trouxe novas sugestões. Confira o original e complete os campos manualmente.');
    } catch (failure) {
      if (ocrController.current === controller) setError(controller.signal.aborted ? 'Leitura cancelada.' : failure.message);
    } finally {
      if (ocrController.current === controller) { ocrController.current = null; setOcrStatus(''); }
    }
  };
  return <section className="pdf-review" aria-label="Revisão do PDF">
    <p>A leitura começa neste aparelho. Confira todas as páginas: linhas quebradas, colunas e saldos podem não ser reconhecidos corretamente. Valores em reais.</p>
    {progress && <p role="status">{progress}</p>}
    {error && <p role="alert" className="pdf-error">{error}</p>}
    {!loaded && !progress && <div className="form-group">
      {error.includes('PDF protegido') && <><label htmlFor="pdf-password">Senha do PDF (usada apenas neste navegador)</label>
        <input id="pdf-password" type="password" autoComplete="off" value={password} onChange={event => setPassword(event.target.value)} /></>}
      <button type="button" className="btn-outline" onClick={() => setCredentials({ password })}>Tentar abrir novamente</button>
    </div>}
    {loaded && <>
      <label htmlFor="pdf-page-number">Página do original</label>
      <select id="pdf-page-number" value={page} disabled={!!ocrStatus} onChange={event => setPage(Number(event.target.value))}>
        {Array.from({ length: loaded.document.numPages }, (_, i) => <option key={i} value={i + 1}>{i + 1} de {loaded.document.numPages}</option>)}
      </select>
      <PdfPage document={loaded.document} number={page} />
      {!!loaded.imagePages.filter(number => !ocrPages.includes(number)).length && <p role="status">Páginas sem texto extraível: {loaded.imagePages.filter(number => !ocrPages.includes(number)).join(', ')}. Selecione a página e use a leitura da imagem ou preencha manualmente.</p>}
      {!!loaded.unreadablePages.filter(number => !ocrPages.includes(number)).length && <p role="alert">Texto interno ilegível nas páginas {loaded.unreadablePages.filter(number => !ocrPages.includes(number)).join(', ')}. Selecione a página e use a leitura da imagem ou preencha manualmente.</p>}
      {(loaded.imagePages.includes(page) || loaded.unreadablePages.includes(page)) && !ocrPages.includes(page) && <div>
        <p>A leitura da imagem (OCR) ocorre neste aparelho. O leitor é baixado do próprio site; seu extrato não é enviado. Pode demorar e confundir letras ou números. Compare as sugestões com o original e com lançamentos adicionados manualmente.</p>
        <button type="button" className="btn-outline" disabled={disabled || !!ocrStatus} onClick={readImage}>Ler imagem da página {page}</button>
      </div>}
      {ocrStatus && <><p role="status">{ocrStatus}</p><button type="button" className="btn-outline" onClick={() => ocrController.current?.abort()}>Cancelar leitura da imagem</button></>}
      {ocrPages.includes(page) && <p role="status">Imagem da página {page} lida. Confira os campos reconhecidos; não execute outra importação do mesmo período.</p>}
      {!approved && !aiPages.includes(page) && <div>
        <label><input type="checkbox" disabled={disabled || !!ocrStatus} checked={missingPages.includes(page)} onChange={event => setMissingPages(value => event.target.checked ? [...value, page] : value.filter(number => number !== page))} />O leitor local deixou informações sem ler nesta página.</label>
        {canRecoverStatement(rows, page, missingPages.includes(page)) && <>
          <p>Se a leitura local ficou incompleta, a DeepSeek pode sugerir lançamentos. Ao clicar, você envia a imagem desta página para a API. Há consumo de créditos. As sugestões vêm desmarcadas; confira possíveis duplicatas antes de incluí-las.</p>
          <button type="button" className="btn-outline" disabled={disabled || !!ocrStatus} onClick={recoverWithAI}>Pedir ajuda à IA na página {page}</button>
        </>}
      </div>}
      {aiPages.includes(page) && <p role="status">DeepSeek consultada nesta página. As sugestões não substituem os campos locais e precisam ser selecionadas após conferência.</p>}
      {approved ? <>
        <p role="status">PDF revisado. Continue a conferência da conta e das recorrências abaixo.</p>
        <button type="button" className="btn-outline" disabled={disabled} onClick={() => change(rows)}>Voltar à revisão do PDF</button>
      </> : <fieldset disabled={disabled || !!ocrStatus}>
        <legend>Lançamentos do PDF</legend>
        <p>{rows.filter(row => row.include).length} selecionados. Máximo de 200. Exclua saldos, totais e linhas que não sejam movimentações.</p>
        {rows.some(row => row.include && (!row.date || !row.amount || !row.direction)) && <p role="status">
          {rows.filter(row => row.include && (!row.date || !row.amount || !row.direction)).length} lançamento(s) com data, valor ou entrada/saída em branco. Preencha os campos antes de confirmar a revisão.
        </p>}
        <div className="pdf-year">
          <label htmlFor="pdf-year">Ano para datas que vieram sem ano</label>
          <input id="pdf-year" inputMode="numeric" maxLength={4} placeholder="AAAA" value={year} onChange={event => setYear(event.target.value)} />
          <button type="button" className="btn-outline" disabled={!/^\d{4}$/.test(year)} onClick={() => change(rows.map(row => ({ ...row, date: row.date || pdfDate(row.dateHint, year) })))}>Aplicar às datas incompletas</button>
        </div>
        <p>Se o extrato atravessar uma virada de ano, corrija cada data. Um valor sem sinal exige escolher entrada ou saída.</p>
        <div className="pdf-drafts">
          {rows.map((row, index) => <article key={row.id} className="pdf-draft">
            <label><input type="checkbox" checked={row.include} onChange={event => update(index, { include: event.target.checked })} /> Incluir lançamento {index + 1} · página {row.page}</label>
            {row.source && <p className="pdf-source">{row.source}</p>}
            {row.ai && <p>Sugestão da DeepSeek. Confira no PDF e mantenha desmarcada se já existir um lançamento correspondente.</p>}
            {row.include && row.dateCandidates.length > 1 && <p>Há mais de uma data nesta linha ({row.dateCandidates.join(' e ')}). Informe a data correta do lançamento; o ano em lote não resolve essa escolha.</p>}
            {row.include && row.columnBased && <p>{row.signedValueColumn ? 'Coluna única de valor: negativos como saídas; positivos ou sem sinal como entradas.' : 'Valor e entrada/saída sugeridos pelas colunas do extrato.'}{row.inheritedDate ? ' Dia repetido do grupo anterior desta página.' : ''} Confira no original.</p>}
            {row.include && row.sectionBased && <p>Data e entrada/saída vêm do cabeçalho do grupo nesta página. O total do grupo não é um lançamento. Confira no original.</p>}
            {row.include && row.sectionMismatch && <p role="alert">Os valores lidos não somam o total do grupo. Confira se faltam lançamentos e escolha entrada ou saída manualmente.</p>}
            {row.include && row.ocr && <p>Reconhecido por imagem: confira cada campo no original.{row.ocrUncertain ? ' O leitor indicou incerteza em parte deste texto; atenção especial a letras, números e C/D.' : ''}</p>}
            {row.include && <div className="pdf-fields">
              <label>Data<input type="date" value={row.date} onChange={event => update(index, { date: event.target.value })} /></label>
              <label>Descrição<input value={row.description} maxLength={500} onChange={event => update(index, { description: event.target.value })} /></label>
              {row.options.length > 1 && <label>Valores encontrados na linha<select value="" onChange={event => {
                const option = row.options[Number(event.target.value)];
                update(index, { amount: option.amount, direction: option.direction });
              }}><option value="" disabled>Escolha o valor da movimentação</option>{row.options.map((option, i) => <option key={i} value={i}>{option.label}</option>)}</select></label>}
              <label>Valor (R$, sem sinal)<input inputMode="decimal" value={row.amount} onChange={event => update(index, { amount: event.target.value })} /></label>
              <label>Movimentação<select value={row.direction} onChange={event => update(index, { direction: event.target.value })}>
                <option value="">Escolha</option><option value="INCOME">Entrada</option><option value="EXPENSE">Saída</option>
              </select></label>
            </div>}
          </article>)}
        </div>
        <button type="button" className="btn-outline" onClick={() => add()}>Adicionar lançamento manual</button>
        <details>
          <summary>Texto extraído da página {page}: adicionar linhas que faltaram</summary>
          <div className="pdf-source-lines">{loaded.lines.filter(line => line.page === page).map(line => <div key={line.id}>
            <p className="pdf-source">{line.text}</p><button type="button" className="btn-outline" onClick={() => add(line)}>Adicionar esta linha</button>
          </div>)}</div>
        </details>
        <label className="pdf-confirm"><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} /> Conferi todas as páginas, datas, valores e entradas/saídas; removi saldos e totais e incluí os lançamentos que faltavam.</label>
        <button type="button" className="btn-primary" disabled={!checked} onClick={approve}>Usar lançamentos revisados</button>
      </fieldset>}
    </>}
  </section>;
}
