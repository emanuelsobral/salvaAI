// Fixture servida apenas pelo Vite em desenvolvimento; banco e identidade fictícios no emulador.
import { createRoot } from 'react-dom/client';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { ContractsWorkspace } from '../../src/pages/ContractsPage';
import SubsList from '../../src/components/Subscriptions/SubsList';
import { BrowserRouter } from 'react-router-dom';
import '../../src/styles/global.css';

// O serviço usa o app padrão; a configuração de teste deve apontar para demo-salva-ai.
const { db } = await import('../../src/services/firebase');
if (!import.meta.env.DEV || db.app.options.projectId !== 'demo-salva-ai' || location.hostname !== '127.0.0.1') {
  throw new Error('Execute a fixture apenas no Vite local com configuração demo-salva-ai.');
}
// Nenhuma conexão de produção ou login real é usado nesta fixture.
connectFirestoreEmulator(db, '127.0.0.1', 8080, { mockUserToken: { sub: 'contracts-ui' } });
createRoot(document.getElementById('root')).render(
  <BrowserRouter><main style={{ padding: 16, height: '100dvh', overflowY: 'auto' }}>{new URLSearchParams(location.search).get('view') === 'contas' ? <SubsList uid="contracts-ui" /> : <ContractsWorkspace uid="contracts-ui" />}</main></BrowserRouter>,
);
