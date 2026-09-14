import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { getFirebaseConfig } from './src/config/firebaseConfig.js'
import { aiDevPlugin } from './server/vite-ai.js'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  // Impede publicar um bundle sem configuração. Variáveis do CI têm prioridade.
  if (command === 'build') {
    getFirebaseConfig({ ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env })
  }
  return { plugins: [react(), aiDevPlugin(env)] }
})
