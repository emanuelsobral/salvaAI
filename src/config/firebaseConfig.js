/** Configuração pública do SDK web. Não colocar credenciais de servidor aqui. */
export function getFirebaseConfig(env) {
  const fields = {
    apiKey: 'VITE_FIREBASE_API_KEY',
    authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
    projectId: 'VITE_FIREBASE_PROJECT_ID',
    appId: 'VITE_FIREBASE_APP_ID',
  };
  const config = {};
  const missing = [];
  for (const [field, variable] of Object.entries(fields)) {
    const value = env[variable]?.trim();
    if (!value) missing.push(variable);
    else config[field] = value;
  }
  if (missing.length) {
    throw new Error(`Configuração Firebase incompleta. Defina ${missing.join(', ')} em .env.local ou no ambiente de build.`);
  }
  for (const [field, variable] of Object.entries({
    storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  })) {
    const value = env[variable]?.trim();
    if (value) config[field] = value;
  }
  return config;
}
