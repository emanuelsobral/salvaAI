import { CONTRACT_FIELDS, EXTRACTION_STATES, validateSourceReview } from '../../utils/contractExtraction';

export default function ExtractionEvidence({ sourceReview }) {
  let fields;
  try { fields = JSON.parse(validateSourceReview(sourceReview).resultJson); } catch { return <p role="alert">Não foi possível mostrar as evidências.</p>; }
  return <details className="contract-evidence">
    <summary>Conferir evidências da leitura do PDF</summary>
    {sourceReview.method === 'PDF_DEEPSEEK_OCR_REVIEW' ? <p className="contract-notice">Origem: OCR com DeepSeek. As páginas foram enviadas à API para transcrição. Os campos foram extraídos dessa transcrição e exigem conferência com o PDF original.</p> : null}
    {sourceReview.method === 'PDF_DEEPSEEK_FIELDS_REVIEW' ? <p className="contract-notice">Origem: extração de campos com DeepSeek. O texto foi enviado à IA e pode ter vindo de OCR. Trechos correspondentes ao texto não garantem uma interpretação correta. Confira cada sugestão e condição no PDF original.</p> : null}
    {sourceReview.method === 'PDF_OCR_REVIEW' ? <p className="contract-notice">Origem: OCR. Os trechos abaixo são transcrições automáticas de imagens e podem conter erros, inclusive em valores e datas. Confira o PDF original antes de usar os campos.</p> : null}
    <p>Estes são os resultados originais da leitura. Campos editados por você podem diferir das sugestões. A leitura não comprova que o contrato foi interpretado por completo.</p>
    {Object.entries(CONTRACT_FIELDS).map(([key, label]) => {
      const field = fields[key];
      return <section key={key} aria-label={`Evidências: ${label}`}>
        <h3>{label} — {EXTRACTION_STATES[field.estado]}</h3>
        <p>{field.motivo}</p>
        {field.selecaoUsuario ? <p>Escolha confirmada pelo usuário no cadastro: {field.alternativas[field.selecaoUsuario.indice].rotulo}, R$ {field.selecaoUsuario.quantia.replace('.', ',')} por mês. A extração original permanece ambígua; edições posteriores do cadastro podem alterar o valor.</p> : null}
        {field.alternativas?.map((item, index) => <details key={index}><summary>{item.rotulo} — R$ {item.quantia.replace('.', ',')}/mês</summary><p>{item.condicoes}</p>{item.evidencias.map((e, i) => <blockquote key={i}><strong>Página {e.pagina}</strong><p>{e.trecho}</p></blockquote>)}</details>)}
        {field.evidencias.length ? field.evidencias.map((item, index) => <blockquote key={index}><strong>Página {item.pagina}</strong><p>{item.trecho}</p></blockquote>) : <p>Sem trecho reconhecido para este campo.</p>}
      </section>;
    })}
  </details>;
}
