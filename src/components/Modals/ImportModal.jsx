import ModalFrame from '../UI/ModalFrame';
import { useState, useMemo, useEffect } from 'react';
import { importStatement, reviewStatement } from '../../services/importService';
import { getHistoryCategories } from '../../utils/categories';
import { sumMoney } from '../../utils/finance';
import { parseCSV } from '../../utils/csv';
import { parseOFX } from '../../utils/ofx';
import { formatBRL } from '../../utils/formatters';

export default function ImportModal({ uid, isOpen, onClose, onRefresh }) {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('CSV');
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [rows, setRows] = useState([]);
  const [reviewedText, setReviewedText] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [batchId] = useState(() => crypto.randomUUID());
  const preview = useMemo(() => csvText.trim() ? (format === 'OFX' ? parseOFX(csvText) : parseCSV(csvText)) : null, [csvText, format]);
  useEffect(() => {
    let active = true;
    setRows([]); setSubmitError('');
    if (!preview || preview.errors.length) return;
    setReviewing(true);
    reviewStatement(uid, preview.rows).then(result => { if (active) { setRows(result.map(row => ({ ...row, selected: !row.duplicateId }))); setReviewedText(csvText); } }).catch(error => { if (active) setSubmitError(error.message); }).finally(() => { if (active) setReviewing(false); });
    return () => { active = false; };
  }, [preview, uid, csvText]);
  const updateRow = (index, patch) => setRows(current => current.map((row, i) => i === index ? { ...row, ...patch } : row));
  const visibleRows = reviewedText === csvText ? rows : [];
  const selectedIndices = visibleRows.flatMap((row, index) => row.selected ? [index] : []);
  const selectedTotal = preview ? sumMoney(selectedIndices.map(index => preview.rows[index].type === 'INCOME' ? preview.rows[index].amount : -preview.rows[index].amount)) : 0;

  const selectFile = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvText(''); setFileError(''); setFileName(file.name);
    const extension = file.name.split('.').pop().toUpperCase();
    if (!['CSV', 'OFX'].includes(extension) || file.size > 1000000) {
      setFileError('Selecione um arquivo CSV ou OFX de até 1 MB.'); return;
    }
    setReading(true);
    try {
      const bytes = await file.arrayBuffer();
      let text = new TextDecoder('utf-8').decode(bytes);
      if (text.includes('\uFFFD')) text = new TextDecoder('windows-1252').decode(bytes);
      setFormat(extension); setCsvText(text);
    } catch { setFileError('Não foi possível ler o arquivo. Tente selecioná-lo novamente.'); }
    finally { setReading(false); }
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (loading || !preview || preview.errors.length) return;
    
    setLoading(true);
    setSubmitError('');
    try {
      const res = await importStatement(uid, csvText, format, { selectedIndices, corrections: rows, keepDuplicates: selectedIndices.filter(index => rows[index].duplicateId), batchId });
      setResult(res);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const finishImport = () => {
    onClose();
    onRefresh();
  };

  if (result) return (
    <ModalFrame onClose={loading ? undefined : (result ? finishImport : onClose)}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="import-success-title" style={{ maxWidth: 420, borderTop: '4px solid var(--accent-primary)', textAlign: 'center' }}>
        <div className="import-result" role="status">
          <span className="import-result-icon" aria-hidden="true">✓</span>
          <h2 id="import-success-title">Importação concluída</h2>
          <p>{result.message}</p>
        </div>
        <button className="btn-primary" onClick={finishImport} autoFocus style={{ width: '100%' }}>Concluir</button>
      </div>
    </ModalFrame>
  );

  return (
    <ModalFrame onClose={loading ? undefined : (result ? finishImport : onClose)}>
      <div className="modal-content" style={{ maxWidth: '850px', position: 'relative' }}>
        <button className="btn-close" aria-label="Fechar modal" style={{ position: 'absolute', right: '1.5rem', top: '1.5rem' }} onClick={onClose} disabled={loading}>×</button>
        <h2>📥 Importar extrato</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Selecione um OFX ou CSV e revise os lançamentos. A importação será feita no Saldo Livre, somando entradas e descontando saídas. As categorias são sugeridas automaticamente.
        </p>

        <div className="form-group">
          <label htmlFor="statement-file">Arquivo do extrato (OFX ou CSV)</label>
          <div className={`statement-upload ${loading || reading ? 'is-busy' : ''}`}>
            <input id="statement-file" type="file" accept=".ofx,.csv" onChange={selectFile} disabled={loading || reading} aria-describedby="statement-file-help" />
            <label htmlFor="statement-file" className="statement-upload-target">
              <span className="statement-upload-icon" aria-hidden="true">↑</span>
              <span className="statement-upload-copy"><strong>{reading ? 'Lendo extrato…' : fileName || 'Selecione seu extrato'}</strong><span id="statement-file-help">OFX ou CSV · até 1 MB · compatível com Nubank</span></span>
              <span className="statement-upload-action">{fileName ? 'Trocar' : 'Escolher arquivo'}</span>
            </label>
          </div>
          {fileError && <p role="alert" style={{ color: 'var(--accent-red)' }}>{fileError}</p>}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginBottom: '1rem' }}>
          O saldo final do extrato não substitui seu saldo atual. Revise coincidências com lançamentos anteriores: ficam desmarcadas por padrão. Marque uma coincidência apenas se representar outra movimentação real. Aplicações ficam separadas dos gastos de consumo. Só os lançamentos confirmados são enviados ao banco de dados.
        </p>

        {format === 'CSV' && (
        <details className="form-group">
          <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', marginBottom: '.75rem' }}>Prefiro colar ou editar o CSV</summary>
          <label>Ou cole CSV: Data, Descrição, Valor</label>
          <textarea 
            rows="8" 
            placeholder="Exemplo:&#10;25/12/2026, Mercado Livre, -150.00&#10;26/12/2026, Salário, 5000.00"
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); setFileError(''); setFileName(''); }}
            disabled={loading || reading}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              background: 'rgba(0,0,0,0.2)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-main)', 
              borderRadius: '8px',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />
        </details>
        )}

        {preview && (
          <div aria-live="polite" style={{ maxHeight: 380, overflow: 'auto' }}>
            {preview.errors.length > 0 ? (
              <div role="alert" style={{ color: 'var(--accent-red)' }}>{preview.errors.map((error, index) => <p key={index}>{error}</p>)}</div>
            ) : (
              <>
                <p>{selectedIndices.length} de {preview.rows.length} selecionadas · impacto previsto: {formatBRL(selectedTotal)} (antes de ignorar marcadores já importados)</p>
                {reviewing && <p>Conferindo lançamentos anteriores e categorias…</p>}
                <div className="import-selection-actions"><button type="button" className="btn-outline-sm" disabled={loading || reviewing} onClick={() => setRows(current => current.map(row => ({ ...row, selected: !row.duplicateId })))}>Selecionar novas</button><button type="button" className="btn-outline-sm" disabled={loading || reviewing} onClick={() => setRows(current => current.map(row => ({ ...row, selected: false })))}>Desmarcar todas</button></div>
                {format === 'OFX' && <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Reimportações OFX desta conta são identificadas pelo código bancário de cada lançamento.</p>}
                <table style={{ width: '100%' }}>
                  <thead><tr><th>Importar</th><th>Data</th><th>Título / Categoria</th><th>Valor</th></tr></thead>
                  <tbody>{visibleRows.map((row, index) => <tr key={index}><td><input type="checkbox" aria-label={`Importar lançamento ${index + 1}`} checked={row.selected} disabled={loading} onChange={event => updateRow(index, { selected: event.target.checked })} /></td><td>{preview.rows[index].date.split('-').reverse().join('/')}</td><td style={{ minWidth: 220, padding: '.5rem' }}><input type="text" aria-label={`Título do lançamento ${index + 1}`} maxLength={500} value={row.description} disabled={loading} onChange={event => updateRow(index, { description: event.target.value })} /><select aria-label={`Categoria do lançamento ${index + 1}`} value={row.category} disabled={loading} onChange={event => updateRow(index, { category: event.target.value })}>{getHistoryCategories(preview.rows[index].type).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{row.duplicateId && <small style={{ color: 'var(--accent-orange)' }}>Possível duplicata de lançamento existente</small>}</td><td>{formatBRL(preview.rows[index].type === 'EXPENSE' ? -preview.rows[index].amount : preview.rows[index].amount)}</td></tr>)}</tbody>
                </table>
              </>
            )}
          </div>
        )}
        {submitError && <div className="import-error" role="alert"><strong>Não foi possível importar</strong><p>{submitError}</p></div>}
        <button 
          className="btn-outline" 
          style={{ width: '100%', borderColor: '#00f5d4', color: '#00f5d4', marginTop: '1rem' }} 
          onClick={handleSubmit}
          disabled={loading || reading || reviewing || !selectedIndices.length || !!fileError || !preview || preview.errors.length > 0}
        >
          {loading ? 'Importando...' : 'Confirmar importação'}
        </button>
      </div>
    </ModalFrame>
  );
}
