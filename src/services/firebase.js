/** Firebase web configurado por variáveis de ambiente do Vite. */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseConfig } from '../config/firebaseConfig.js';

const app = initializeApp(getFirebaseConfig(import.meta.env));

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
