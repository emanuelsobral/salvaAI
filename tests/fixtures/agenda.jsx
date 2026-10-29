import { createRoot } from 'react-dom/client';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { BrowserRouter } from 'react-router-dom';
import { AgendaWorkspace } from '../../src/pages/AgendaPage';
import '../../src/styles/global.css';

const { db } = await import('../../src/services/firebase');
if (!import.meta.env.DEV || db.app.options.projectId !== 'demo-salva-ai' || location.hostname !== '127.0.0.1') throw new Error('Use somente a configuração local fictícia.');
const uid = new URLSearchParams(location.search).get('usuario') === 'outro' ? 'agenda-other' : 'agenda-ui';
connectFirestoreEmulator(db, '127.0.0.1', 8080, { mockUserToken: { sub: uid } });
createRoot(document.getElementById('root')).render(<BrowserRouter><main style={{ padding: 16, height: '100dvh', overflowY: 'auto' }}><AgendaWorkspace key={uid} uid={uid} /></main></BrowserRouter>);
