import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { getFirebaseConfig } from './src/config/firebaseConfig.js'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Impede publicar um bundle sem configuração. Variáveis do CI têm prioridade.
  if (command === 'build') {
    getFirebaseConfig({ ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env })
  }
  return { plugins: [react()] }
})
