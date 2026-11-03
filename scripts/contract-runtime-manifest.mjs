import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Inventário local: não lê .env, documentos, credenciais ou dados de usuários.
const root = fileURLToPath(new URL('../', import.meta.url));
const paths = [
  'scripts/verify-contract-direct-development.mjs',
  'server/contract-ai-prompt.js', 'src/utils/contractAi.js', 'src/components/Contracts/PdfContractImport.jsx',
  'scripts/contract-runtime-manifest.mjs', 'scripts/contract-run-record.mjs',
  'scripts/verify-contract-deepseek-development.mjs',
  'package.json', 'package-lock.json', 'server/ai-handler.js', 'src/utils/modelJson.js',
  'server/vite-contract-runtime.js', 'server/vite-pdf-assets.js', 'vite.config.js',
  'src/utils/contractPdf.js', 'src/utils/pdfDocument.js', 'src/utils/contractOcr.js',
  'src/utils/contractExtraction.js', 'src/services/aiService.js',
  'experiments/contracts/regras.py', 'experiments/contracts/extenso.py',
  'experiments/contracts/pagamentos_escolares.py',
];
const files = paths.map(path => ({ path, sha256: createHash('sha256')
  .update(readFileSync(new URL('../' + path, import.meta.url))).digest('hex') }));
const rules = readFileSync(new URL('../experiments/contracts/regras.py', import.meta.url), 'utf8');
const version = rules.match(/^VERSAO\s*=\s*['"]([^'"]+)/m)?.[1];
if (!version) throw Error('Versão das regras não encontrada.');
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
console.log(JSON.stringify({
  schemaVersion: 1, createdAt: new Date().toISOString(),
  purpose: 'Inventário do código local; não é execução, versão congelada ou avaliação de precisão.',
  commit: git(['rev-parse', 'HEAD']), workingTreeDirty: Boolean(git(['status', '--porcelain'])),
  extractorVersion: version, nodeVersion: process.version,
  pipeline: ['Leitura do PDF ou transcrição opcional por OCR', 'Extração por regras locais', 'Validação de evidências', 'Revisão do formulário'],
  provider: { name: 'DeepSeek', role: 'Transcrição de páginas (OCR) e extração direta opcional dos cinco campos',
    effectiveModel: null, note: 'Modelo efetivo deve ser registrado na execução; não inferir do padrão do código ou de um alias.' },
  files,
}, null, 2));
