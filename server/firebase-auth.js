import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Verificação de assinatura/expiração/audience via certificados públicos do Firebase.
// Não lê o Firestore nem requer chave privada de conta de serviço.
export async function verifyToken(token, projectId) {
  const name = 'salva-ai-verifier';
  const app = getApps().find(item => item.name === name) || initializeApp({ projectId }, name);
  return getAuth(app).verifyIdToken(token);
}

