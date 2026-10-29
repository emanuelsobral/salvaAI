import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useOperationKey } from '../hooks/useOperationKey';
import * as contractService from '../services/contractService';
import { contractError } from '../utils/contracts';
import ContractPlanForm from '../components/Contracts/ContractPlanForm';
import ContractAdjustmentForm from '../components/Contracts/ContractAdjustmentForm';
import ContractClosureForm from '../components/Contracts/ContractClosureForm';
import ExtractionEvidence from '../components/Contracts/ExtractionEvidence';
import './ContractsPage.css';

const EMPTY = { title: '', counterparty: '', amount: '', installments: '', startDate: '', endDate: '', dueRule: '', adjustmentRule: '', notes: '' };
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateLabel = value => value ? value.split('-').reverse().join('/') : 'Não informado';
const PdfContractImport = lazy(() => import('../components/Contracts/PdfContractImport'));

function ContractForm({ contract, draft, sourceReview, uid, service, onSaved, onCancel }) {
  const [fields, setFields] = useState(() => ({ ...EMPTY, ...draft, ...contract, amount: contract?.amount ?? draft?.amount ?? '', installments: contract?.installments ?? draft?.installments ?? '' }));
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const locked = useRef(false);
  const mounted = useRef(true);
  const titleRef = useRef(null);
  const operation = useOperationKey();
  useEffect(() => { mounted.current = true; titleRef.current?.focus(); return () => { mounted.current = false; }; }, []);
  const change = event => { setReviewed(false); setFields(previous => ({ ...previous, [event.target.name]: event.target.value })); };
  async function submit(event) {
    event.preventDefault();
    if (locked.current || (sourceReview && !reviewed)) return;
    locked.current = true;
    setSaving(true);
    setError('');
    try {
      const payload = { ...fields, ...(sourceReview ? { sourceReview } : {}), amount: fields.amount === '' ? null : Number(fields.amount), installments: fields.installments === '' ? null : Number(fields.installments) };
      const options = { id: contract?.id ?? null, expectedRevision: contract?.revision ?? null };
      const result = await service.saveContract(uid, payload, { ...options, operationId: operation.keyFor({ payload, ...options }) });
      if (!mounted.current) return;
      operation.complete();
      onSaved({ ...payload, ...result });
    } catch (failure) {
      if (mounted.current) setError(contractError(failure));
    } finally {
      locked.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  return (
    <section className="contract-editor" aria-labelledby="contract-editor-title">
      <h2 id="contract-editor-title">{contract ? 'Editar contrato' : 'Novo contrato'}</h2>
      <p>Informe o que consta no contrato. Apenas o título é obrigatório; deixe em branco o que não souber.</p>
      {contract?.commitmentPlan ? <p className="contract-notice">Editar este cadastro não altera o plano de compromissos já confirmado.</p> : null}
      {sourceReview ? <p className="contract-notice">Campos sugeridos a partir do PDF: confira o documento original. Ao salvar, os campos e os trechos de evidência serão guardados na sua conta. {sourceReview.method === 'PDF_DEEPSEEK_OCR_REVIEW' ? 'Imagens das páginas foram enviadas à DeepSeek para leitura.' : 'O arquivo PDF permanece neste dispositivo.'}</p> : null}
      {(sourceReview || contract?.sourceReview) ? <ExtractionEvidence sourceReview={sourceReview || contract.sourceReview} /> : null}
      <form onSubmit={submit}>
        <fieldset disabled={saving} className="contract-fields">
          <legend className="contract-sr-only">Dados do contrato</legend>
          <label className="contract-wide">Título *<input ref={titleRef} name="title" required maxLength={500} value={fields.title} onChange={change} placeholder="Ex.: Aluguel do apartamento" /></label>
          <label className="contract-wide">Pessoa ou empresa contratada<input name="counterparty" maxLength={500} value={fields.counterparty} onChange={change} /></label>
          <label>Valor da parcela (R$)<input name="amount" type="number" inputMode="decimal" min="0.01" max="1000000000" step="0.01" value={fields.amount} onChange={change} /></label>
          <label>Número de parcelas<input name="installments" type="number" inputMode="numeric" min="1" max="1200" step="1" value={fields.installments} onChange={change} aria-describedby="contract-installments-help" /></label>
          <p className="contract-wide contract-help" id="contract-installments-help">Não deduza a quantidade de parcelas pela duração do contrato.</p>
          <label>Início da vigência<input name="startDate" type="date" min="1900-01-01" max="9999-12-31" value={fields.startDate} onChange={change} /></label>
          <label>Término da vigência<input name="endDate" type="date" min={fields.startDate || '1900-01-01'} max="9999-12-31" value={fields.endDate} onChange={change} /></label>
          <label className="contract-wide">Regra de vencimento<textarea name="dueRule" rows={2} maxLength={600} value={fields.dueRule} onChange={change} placeholder="Ex.: Até o dia 20 do mês seguinte ou 30 dias após a nota fiscal" /></label>
          <label className="contract-wide">Regra de reajuste<textarea name="adjustmentRule" rows={2} maxLength={600} value={fields.adjustmentRule} onChange={change} placeholder="Índice, periodicidade e condições, se informados" /></label>
          <label className="contract-wide">Observações<textarea name="notes" rows={3} maxLength={3000} value={fields.notes} onChange={change} /></label>
        </fieldset>
        {sourceReview ? <label className="contract-plan-confirm"><input type="checkbox" disabled={saving} checked={reviewed} onChange={event => setReviewed(event.target.checked)} />Conferi os campos e as evidências no documento e quero salvar este cadastro.</label> : null}
        {error ? <p className="contract-error" role="alert">{error}</p> : null}
        <div className="contract-form-actions">
          <button type="button" className="contract-secondary" disabled={saving} onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving || (!!sourceReview && !reviewed)}>{saving ? 'Salvando…' : 'Salvar contrato'}</button>
        </div>
      </form>
    </section>
  );
}

export function ContractsWorkspace({ uid, service = contractService }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [editor, setEditor] = useState(null);
  const [message, setMessage] = useState('');
  const heading = useRef(null);
  useEffect(() => {
    let active = true;
    service.getContracts(uid).then(items => { if (active) setContracts(items); })
      .catch(error => { if (active) { setContracts([]); setLoadError(contractError(error)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [uid, service, refresh]);
  function refreshList() { setLoading(true); setLoadError(''); setRefresh(value => value + 1); }
  function closeEditor() { setEditor(null); requestAnimationFrame(() => heading.current?.focus()); }
  function saved(contract, planned = false, adjusted = false, closed = false) {
    setContracts(previous => [...previous.filter(item => item.id !== contract.id), contract].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')));
    setMessage(closed ? 'Contrato encerrado. Pagamentos, pendências até hoje e saldo foram preservados.' : adjusted ? 'Reajuste programado. Os pagamentos e o saldo foram preservados.' : planned ? 'Compromissos confirmados. Consulte os vencimentos nas contas recorrentes; nenhum pagamento foi registrado.' : 'Contrato salvo. Nenhuma cobrança foi gerada.');
    closeEditor();
  }
  return (
    <div className="view-section active contracts-page">
      <header className="topbar">
        <div className="greeting"><h1 ref={heading} tabIndex={-1}>Contratos</h1><p>Organize valores, prazos e condições em um só lugar.</p></div>
        {!editor ? <div className="contract-form-actions"><button className="contract-secondary" disabled={loading || !!loadError} onClick={() => { setMessage(''); setEditor({ importing: true }); }}>Importar PDF</button><button className="btn-primary" disabled={loading || !!loadError} onClick={() => { setMessage(''); setEditor({}); }}>+ Novo contrato</button></div> : null}
      </header>
      <p className="contract-notice">Cadastre manualmente ou revise as sugestões de um PDF, com OCR opcional para digitalizações. Salvar um contrato não gera parcelas na agenda nem altera seu saldo.</p>
      <p className="contract-status" role="status">{message}</p>
      {editor ? editor.importing ? <Suspense fallback={<p role="status">Preparando importação…</p>}><PdfContractImport onPrepared={result => setEditor(result)} onCancel={closeEditor} /></Suspense> : editor.close ? <ContractClosureForm contract={editor.contract} uid={uid} service={service} onSaved={contract => saved(contract, false, false, true)} onCancel={() => { closeEditor(); refreshList(); }} /> : editor.adjust ? <ContractAdjustmentForm contract={editor.contract} uid={uid} service={service} onSaved={contract => saved(contract, false, true)} onCancel={() => { closeEditor(); refreshList(); }} /> : editor.plan ? <ContractPlanForm contract={editor.contract} uid={uid} service={service} onSaved={contract => saved(contract, true)} onCancel={closeEditor} /> : <ContractForm key={editor.contract?.id || editor.sourceReview?.pdfSha256 || 'new'} contract={editor.contract} draft={editor.draft} sourceReview={editor.sourceReview} uid={uid} service={service} onSaved={saved} onCancel={closeEditor} /> : (
        <section aria-label="Contratos cadastrados" aria-busy={loading}>
          {loading ? <p role="status">Carregando contratos…</p> : loadError ? <div className="contract-error" role="alert"><p>{loadError}</p><button className="contract-secondary" onClick={refreshList}>Tentar novamente</button></div> : contracts.length === 0 ? (
            <div className="contract-empty"><h2>Seus contratos começam aqui</h2><p>Cadastre um aluguel, financiamento ou serviço para consultar suas condições quando precisar.</p></div>
          ) : <>
            <div className="contract-list-heading"><p>{contracts.length} contrato(s) cadastrado(s)</p><button className="contract-secondary" onClick={refreshList}>Atualizar lista</button></div>
            <div className="contract-list">{contracts.map(contract => (
              <article className="contract-item" key={contract.id}>
                <div className="contract-item-heading"><div><h2>{contract.title}</h2><p>{contract.counterparty || 'Pessoa ou empresa não informada'}</p></div>{!contract.closure && <button className="contract-secondary" aria-label={`Editar ${contract.title}`} onClick={() => { setMessage(''); setEditor({ contract }); }}>Editar</button>}</div>
                {contract.closure ? <p className="contract-notice contract-closure-reason">Encerrado em {dateLabel(contract.closure.closedOn)}.{contract.closure.reason ? ` Motivo: ${contract.closure.reason}` : ''} Cadastro disponível para consulta.</p> : null}
                <dl className="contract-details">
                  <div><dt>Valor da parcela</dt><dd>{contract.amount == null ? 'Não informado' : money.format(contract.amount)}</dd></div>
                  <div><dt>Parcelas</dt><dd>{contract.installments ?? 'Não informado'}</dd></div>
                  <div><dt>Início</dt><dd>{dateLabel(contract.startDate)}</dd></div>
                  <div><dt>Término</dt><dd>{dateLabel(contract.endDate)}</dd></div>
                </dl>
                <details><summary>Vencimento, reajuste e observações</summary><dl className="contract-conditions">
                  <div><dt>Vencimento</dt><dd>{contract.dueRule || 'Não informado'}</dd></div>
                  <div><dt>Reajuste</dt><dd>{contract.adjustmentRule || 'Não informado'}</dd></div>
                  <div><dt>Observações</dt><dd>{contract.notes || 'Nenhuma observação'}</dd></div>
                </dl></details>
                {contract.sourceReview ? <ExtractionEvidence sourceReview={contract.sourceReview} /> : null}
                <div className="contract-plan-actions">{contract.commitmentPlan ? <>
                  <p><strong>Plano original:</strong> {contract.commitmentPlan.count} parcela(s) de {money.format(contract.commitmentPlan.amount)}, de {dateLabel(contract.commitmentPlan.firstDueDate)} até {dateLabel(contract.commitmentPlan.lastDueDate)}. Consulte os valores atualizados, pagamentos e encerramento nos vencimentos.</p>
                  {!contract.closure && <button className="contract-secondary" aria-label={`Reajustar parcelas de ${contract.title}`} onClick={() => { setMessage(''); setEditor({ contract, adjust: true }); }}>Reajustar parcelas</button>}
                  <a className="contract-secondary" href={`/assinaturas?contrato=${encodeURIComponent(contract.id)}&mes=${contract.commitmentPlan.firstDueDate.slice(0, 7)}`}>Ver vencimentos</a>
                </> : !contract.closure && <button className="contract-secondary" aria-label={`Planejar compromissos de ${contract.title}`} onClick={() => { setMessage(''); setEditor({ contract, plan: true }); }}>Planejar compromissos</button>}
                {!contract.closure && <button className="contract-secondary" aria-label={`Encerrar contrato ${contract.title}`} onClick={() => { setMessage(''); setEditor({ contract, close: true }); }}>Encerrar contrato</button>}</div>
              </article>
            ))}</div>
          </>}
        </section>
      )}
    </div>
  );
}

export default function ContractsPage() {
  const { uid } = useAuth();
  return <ContractsWorkspace key={uid} uid={uid} />;
}
