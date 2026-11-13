import { useRef, useState } from 'react';
import { formatBRL } from '../../utils/formatters';

export default function ContractAmountChoice({ field, disabled, onSelect }) {
  const dialog = useRef(null);
  const [choice, setChoice] = useState('');
  if (!field?.alternativas?.length) return null;
  const selected = field.selecaoUsuario;
  function open() { setChoice(selected ? String(selected.indice) : ''); dialog.current.showModal(); }
  function confirm() {
    onSelect(choice === 'manual' ? null : Number(choice));
    dialog.current.close();
  }
  return <section className="contract-notice" aria-label="Escolha da mensalidade">
    <p>{selected ? `Valor confirmado por você: ${field.alternativas[selected.indice].rotulo} — ${formatBRL(Number(selected.quantia))}/mês.` : 'O contrato apresenta mais de uma mensalidade. Escolha a opção correspondente à sua matrícula ou preencha o valor manualmente.'}</p>
    <button type="button" className="contract-secondary" disabled={disabled} onClick={open}>{selected ? 'Alterar escolha da mensalidade' : 'Escolher mensalidade'}</button>
    <dialog ref={dialog} className="contract-amount-dialog" aria-labelledby="amount-choice-title" aria-describedby="amount-choice-help">
      <h2 id="amount-choice-title">Qual opção corresponde à sua matrícula?</h2>
      <p id="amount-choice-help">Confira modalidade, condições e trechos no PDF original. A escolha preenche apenas o valor; quantidade e vencimentos precisam de revisão.</p>
      <fieldset>
        <legend>Mensalidades encontradas no contrato</legend>
        {field.alternativas.map((item, index) => <div key={index} className="contract-amount-option">
          <label><input type="radio" name="contract-amount-choice" value={index} checked={choice === String(index)} onChange={event => setChoice(event.target.value)} /> {item.rotulo} — {formatBRL(Number(item.quantia))}/mês</label>
          {item.condicoes ? <p>Condições: {item.condicoes}</p> : null}
          <details><summary>Consultar trechos de origem</summary>{item.evidencias.map((e, i) => <blockquote key={i}><strong>Página {e.pagina}</strong><p>{e.trecho}</p></blockquote>)}</details>
        </div>)}
        <label><input type="radio" name="contract-amount-choice" value="manual" checked={choice === 'manual'} onChange={event => setChoice(event.target.value)} /> Nenhuma destas / informar manualmente</label>
      </fieldset>
      <div className="contract-form-actions">
        <button type="button" className="contract-secondary" onClick={() => dialog.current.close()}>Cancelar</button>
        <button type="button" className="btn-primary" disabled={choice === ''} onClick={confirm}>Confirmar valor</button>
      </div>
    </dialog>
  </section>;
}
