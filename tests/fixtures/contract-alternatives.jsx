import { createRoot } from 'react-dom/client';
import { ContractForm } from '../../src/pages/ContractsPage';
import { validateContractAi } from '../../src/utils/contractAi';
import { prepareSourceReview } from '../../src/utils/contractExtraction';
import '../../src/styles/global.css';
if (!import.meta.env.DEV || location.hostname !== '127.0.0.1') throw Error('Somente teste local.');
const text = 'Mensalidades: Fundamental R$ 800,00; Ensino Médio R$ 1.100,00 (integral).';
const fields = Object.fromEntries(['valor_parcela','numero_parcelas','data_vencimento','vigencia','regra_reajuste'].map(k => [k, { estado: 'nao_identificado', valor: null, motivo: 'Ausente', evidencias: [] }]));
fields.valor_parcela = { estado: 'ambiguo', valor: null, motivo: 'Escolha a matrícula.', evidencias: [{ pagina: 1, trecho: text }], alternativas: [
 { rotulo: 'Fundamental', quantia: '800.00', periodicidade: 'mensal', condicoes: '', evidencias: [{ pagina: 1, trecho: 'Fundamental R$ 800,00' }] },
 { rotulo: 'Ensino Médio', quantia: '1100.00', periodicidade: 'mensal', condicoes: 'integral', evidencias: [{ pagina: 1, trecho: 'Ensino Médio R$ 1.100,00 (integral)' }] },
] };
const sourceReview = prepareSourceReview(validateContractAi({ fields }, [text]), [text], 'a'.repeat(64), { useFieldAi: true });
const service = { saveContract: async (_uid, payload) => { window.savedContract = payload; return { id: 'local', revision: 0 }; } };
createRoot(document.getElementById('root')).render(<main style={{ padding: 16, height: '100dvh', overflowY: 'auto' }}><ContractForm uid="local" draft={{}} sourceReview={sourceReview} service={service} onSaved={() => {}} onCancel={() => {}} /></main>);
