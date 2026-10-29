import { CONTRACT_FIELDS, EXTRACTION_STATES, validateSourceReview } from '../../utils/contractExtraction';

export default function ExtractionEvidence({ sourceReview }) {
  let fields;
  try { fields = JSON.parse(validateSourceReview(sourceReview).resultJson); } catch { return <p role="alert">Não foi possível mostrar as evidências.</p>; }
  return <details className="contract-evidence">
    <summary>Conferir evidências da leitura do PDF</summary>
    {sourceReview.method === 'PDF_DEEPSEEK_OCR_REVIEW' ? <p className="contract-notice">Origem: OCR com DeepSeek. As páginas foram enviadas à API para transcrição. Os campos foram extraídos dessa transcrição e exigem conferência com o PDF original.</p> : null}
    {sourceReview.method === 'PDF_OCR_REVIEW' ? <p className="contract-notice">Origem: OCR. Os trechos abaixo são transcrições automáticas de imagens e podem conter erros, inclusive em valores e datas. Confira o PDF original antes de usar os campos.</p> : null}
    <p>Estes são os resultados originais da leitura. Campos editados por você podem diferir das sugestões. A leitura não comprova que o contrato foi interpretado por completo.</p>
    {Object.entries(CONTRACT_FIELDS).map(([key, label]) => {
      const field = fields[key];
      return <section key={key} aria-label={`Evidências: ${label}`}>
        <h3>{label} — {EXTRACTION_STATES[field.estado]}</h3>
        <p>{field.motivo}</p>
        {field.evidencias.length ? field.evidencias.map((item, index) => <blockquote key={index}><strong>Página {item.pagina}</strong><p>{item.trecho}</p></blockquote>) : <p>Sem trecho reconhecido para este campo.</p>}
      </section>;
    })}
  </details>;
}
