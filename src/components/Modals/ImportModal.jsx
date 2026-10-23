import { lazy, Suspense, useMemo, useState } from 'react';
import { importStatement } from '../../services/importService';
import { parseStatement, readStatementFile } from '../../utils/statement';
import { formatBRL } from '../../utils/formatters';
import { getSubscriptions } from '../../services/subscriptionService';
import { suggestRecurringMatches, matchKey } from '../../utils/reconciliation';

const PdfStatementReview = lazy(() => import('./PdfStatementReview'));

const accounts = { GENERAL: 'Conta corrente', VR: 'Vale Refeição', VA: 'Vale Alimentação' };
function choiceSummary(items, value) {
  const item = items.find(candidate => matchKey(candidate) === value);
  return item ? `${item.name}, vencimento ${item.dueDate.split('-').reverse().join('/')}: ${item.payment ? 'aproveitar o pagamento existente, sem novo débito.' : 'vincular esta despesa ao vencimento e marcá-lo como pago.'}` : '';
}

export default function ImportModal({ uid, isOpen, onClose, onRefresh }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [text, setText] = useState('');
  const [format, setFormat] = useState('csv');
  const [accountType, setAccountType] = useState('GENERAL');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [review, setReview] = useState(null);
  const [choices, setChoices] = useState({});
  const preview = useMemo(() => text.trim() ? parseStatement(text, format) : null, [text, format]);
  const reviewed = review && review.text === text && review.format === format && review.accountType === accountType;
  const matches = useMemo(() => reviewed && preview && !preview.errors.length ? suggestRecurringMatches(preview.rows, review.subs, accountType) : [], [reviewed, preview, review, accountType]);
  const unresolved = matches.some((items, index) => items.length && !choices[index]);
  const needsReview = accountType === 'GENERAL' && (!reviewed || unresolved);
  const busy = loading || reading;
  if (!isOpen) return null;
  const finish = () => {
    onClose();
    if (result) onRefresh();
  };

  const loadFile = async event => {
    const file = event.target.files[0];
    if (!file || busy) return;
    setReading(true); setError(''); setResult(null); setText(''); setFileName(''); setPdfFile(null); setFormat('csv'); setReview(null); setChoices({});
    try {
      const loaded = await readStatementFile(file);
      setText(loaded.text || ''); setFormat(loaded.format); setFileName(file.name);
      if (loaded.format === 'pdf') setPdfFile(file);
    } catch (failure) { setError(failure.message); }
    finally { setReading(false); event.target.value = ''; }
  };
  const submit = async () => {
    if (busy || result || !preview || preview.errors.length || needsReview) return;
    setLoading(true); setError('');
    try {
      const reconciliations = accountType === 'GENERAL' ? matches.flatMap((items, rowIndex) => {
        const selected = items.find(item => matchKey(item) === choices[rowIndex]);
        return selected ? [{ rowIndex, subscriptionId: selected.subscriptionId, dueDate: selected.dueDate }] : [];
      }) : [];
      const saved = await importStatement(uid, text, { format, accountType, reconciliations });
      setResult(saved);
    } catch (failure) { setError(failure.message); }
    finally { setLoading(false); }
  };
  const reviewRecurring = async () => {
    if (busy) return;
    setLoading(true); setError('');
    try {
      const data = await getSubscriptions(uid);
      setReview({ text, format, accountType, subs: data.subs }); setChoices({});
    } catch (failure) { setError('Não foi possível revisar as recorrências: ' + failure.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content" style={{ maxWidth: 680, position: 'relative' }}>
        <button className="btn-close" aria-label="Fechar importação" disabled={busy} style={{ position: 'absolute', right: '1rem', top: '1rem' }} onClick={finish}>×</button>
        <h2 style={{ paddingRight: '2rem' }}>Importar extrato</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Selecione CSV, OFX ou PDF e confirme a conta de destino. Até 200 transações por importação. CSV/OFX: 1 MB. PDF: 10 MB e 50 páginas, com revisão manual. Sem IA.</p>
        <div className="form-group">
          <label htmlFor="statement-account">Conta de destino</label>
          <select id="statement-account" value={accountType} disabled={busy || !!result} onChange={event => setAccountType(event.target.value)}>
            {Object.entries(accounts).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="statement-file">Arquivo CSV, OFX ou PDF</label>
          <input id="statement-file" type="file" accept=".csv,.ofx,.pdf" disabled={busy || !!result} onChange={loadFile} style={{ maxWidth: '100%' }} />
          {reading && <p role="status">Lendo arquivo...</p>}
          {fileName && <p style={{ overflowWrap: 'anywhere' }}>{fileName}</p>}
        </div>
        {pdfFile && !result && <Suspense fallback={<p role="status">Preparando leitura de PDF…</p>}>
          <PdfStatementReview file={pdfFile} disabled={busy} onReady={csv => { setText(csv); setFormat('pdf'); setReview(null); setChoices({}); }}
            onInvalidate={() => { setText(''); setReview(null); setChoices({}); setError(''); }} />
        </Suspense>}
        {!result && !pdfFile && (
          <>
            <div className="form-group">
              <label htmlFor="statement-format">Formato do conteúdo</label>
              <select id="statement-format" value={format} disabled={busy} onChange={event => { setFormat(event.target.value); setError(''); }}>
                <option value="csv">CSV / planilha colada</option><option value="ofx">OFX bancário</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="statement-text">{format === 'csv' ? 'Ou cole: Data, Descrição, Valor' : 'Conteúdo do extrato OFX'}</label>
              <textarea id="statement-text" rows={5} value={text} maxLength={1000000} disabled={busy}
                placeholder={'09/10/2026;Mercado;-150,00\n09/10/2026;Salário;5000,00'}
                onChange={event => { setText(event.target.value); setFileName(''); setError(''); }}
                style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 8, resize: 'vertical' }} />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {format === 'csv' ? 'CSV: três colunas, com vírgula, ponto e vírgula ou tabulação. Saídas negativas e entradas positivas. Registros idênticos já importados serão ignorados.' : 'OFX: conta corrente ou poupança em BRL. Os identificadores do banco evitam reimportação na mesma conta de destino. Cartões, investimentos e correções bancárias não são suportados.'}
            </p>
          </>
        )}
        {error && <p role="alert" style={{ color: 'var(--accent-red)' }}>{error}</p>}
        {result ? (
          <div role="status"><p>{result.message}</p><button className="btn-primary" onClick={finish}>Concluir</button></div>
        ) : preview && (
          <div aria-live="polite">
            {preview.errors.length ? <div role="alert" style={{ color: 'var(--accent-red)' }}>{preview.errors.map((item, index) => <p key={index}>{item}</p>)}</div> : (
              <>
                {preview.source && <p>{preview.source.label}</p>}
                <p>{preview.rows.length} transações para {accounts[accountType]}.</p>
                <p>Impacto máximo antes de ignorar duplicatas: {formatBRL(preview.total)}.</p>
                <div style={{ maxHeight: 220, overflow: 'auto' }}>
                  <table style={{ width: '100%', minWidth: 320 }}>
                    <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead>
                    <tbody>{preview.rows.slice(0, 10).map((row, index) => <tr key={index}><td>{row.date.split('-').reverse().join('/')}</td><td style={{ overflowWrap: 'anywhere' }}>{row.description}</td><td>{formatBRL(row.type === 'EXPENSE' ? -row.amount : row.amount)}</td></tr>)}</tbody>
                  </table>
                </div>
                {preview.rows.length > 10 && <p>Mostrando as 10 primeiras transações.</p>}
                <p style={{ fontSize: '0.85rem' }}>A confirmação soma as novas movimentações ao saldo atual. CSV e PDF reconhecem duplicatas com data, descrição, valor e tipo idênticos na mesma conta. Alterações nesses campos, arquivos OFX e lançamentos manuais exigem conferência; um vínculo com pagamento recorrente já registrado evita novo débito.</p>
                {accountType === 'GENERAL' && <section style={{ marginTop: '1rem' }}>
                  <h3>Conferir contas recorrentes</h3>
                  <p>Valor exato e datas até 7 dias de distância. A descrição ajuda a ordenar as sugestões; confira antes de vincular. Até 10 vínculos por importação.</p>
                  <button className="btn-outline" disabled={busy} onClick={reviewRecurring}>{reviewed ? 'Atualizar sugestões' : 'Buscar correspondências'}</button>
                  {reviewed && !matches.some(items => items.length) && <p>Nenhuma correspondência encontrada. Você pode confirmar a importação normal.</p>}
                  {reviewed && <div style={{ maxHeight: 360, overflowY: 'auto', marginTop: '1rem' }}>{matches.map((items, index) => items.length ? <div className="form-group" key={index}>
                    <label htmlFor={'reconcile-row-' + index}>Linha {index + 1}: {preview.rows[index].description} · {formatBRL(preview.rows[index].amount)} · {preview.rows[index].date.split('-').reverse().join('/')}</label>
                    <select id={'reconcile-row-' + index} value={choices[index] || ''} disabled={busy} onChange={event => setChoices(previous => ({ ...previous, [index]: event.target.value }))}>
                      <option value="">Escolha como importar esta linha</option>
                      <option value="separate">É outra despesa: importar separadamente</option>
                      {items.map(item => <option key={matchKey(item)} value={matchKey(item)}>{item.name} — {item.dueDate.split('-').reverse().join('/')} — {item.payment ? 'já pago: aproveitar sem novo débito' : 'marcar pago ao importar'}{item.descriptionMatch ? ' (descrição semelhante)' : ''}</option>)}
                    </select>
                    {choices[index] && <p style={{ marginTop: '0.5rem', overflowWrap: 'anywhere' }}>{choices[index] === 'separate' ? 'Esta linha será tratada como uma despesa independente da recorrência.' : choiceSummary(items, choices[index])}</p>}
                  </div> : null)}</div>}
                  {reviewed && unresolved && <p>Escolha uma opção para cada linha sugerida antes de confirmar.</p>}
                </section>}
              </>
            )}
          </div>
        )}
        {!result && <button className="btn-outline" style={{ width: '100%', marginTop: '1rem' }} onClick={submit} disabled={busy || !preview || preview.errors.length > 0 || needsReview}>
          {loading ? 'Importando...' : 'Confirmar importação'}
        </button>}
      </div>
    </div>
  );
}
