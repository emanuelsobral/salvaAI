import { open, readFile, stat, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectDocuments, databaseRoot, decryptBackup, emulatorTarget, encryptBackup, makeBackup, MAX_BYTES, restoreToEmulator, summary } from './core.mjs';

function options(args) {
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!/^--[a-z-]+$/.test(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || Object.hasOwn(result, args[i])) throw Error('Argumentos inválidos ou repetidos. Use help.');
    result[args[i]] = args[i + 1];
  }
  return result;
}

// Arquivo vazio, ACL restrita, só então grava a chave. Nunca substitui arquivo existente.
async function privateWrite(file, bytes) {
  const handle = await open(file, 'wx', 0o600);
  try {
    if (process.platform === 'win32') {
      const identity = execFileSync('whoami.exe', ['/user', '/fo', 'csv', '/nh'], { encoding: 'utf8', windowsHide: true });
      const sid = identity.match(/S-1-\d+(?:-\d+)+/)?.[0];
      if (!sid) throw Error('Não foi possível restringir o acesso ao arquivo.');
      execFileSync('icacls.exe', [path.resolve(file), '/inheritance:r', '/grant:r', `*${sid}:(F)`], { stdio: 'pipe', windowsHide: true });
    }
    await handle.writeFile(bytes);
    await handle.sync();
  } catch (error) {
    await handle.close();
    await unlink(file).catch(() => {});
    throw error;
  }
  await handle.close();
}

async function readLimited(file, limit) {
  if ((await stat(file)).size > limit) throw Error('Arquivo excede o tamanho permitido.');
  const bytes = await readFile(file);
  if (bytes.length > limit) throw Error('Arquivo excede o tamanho permitido.');
  return bytes;
}

export async function cloudReader(project) {
  if (process.env.FIRESTORE_EMULATOR_HOST) throw Error('Remova FIRESTORE_EMULATOR_HOST antes de exportar da nuvem.');
  const require = createRequire(import.meta.url);
  const { requireAuth } = require('firebase-tools/lib/requireAuth');
  const { Client } = require('firebase-tools/lib/apiv2');
  const { getGlobalDefaultAccount, setActiveAccount } = require('firebase-tools/lib/auth');
  const { logger } = require('firebase-tools/lib/logger');
  logger.silent = true;
  const authOptions = { project, nonInteractive: true };
  const account = getGlobalDefaultAccount();
  if (account) setActiveAccount(authOptions, account);
  try { await requireAuth(authOptions); }
  catch { throw Error('Autenticação indisponível. Entre pela CLI Firebase antes de exportar.'); }
  const client = new Client({ auth: true, apiVersion: 'v1', urlPrefix: 'https://firestore.googleapis.com' });
  return async (method, route, body) => {
    // Esta conexão NÃO possui caminhos de escrita no banco de produção.
    if (!(method === 'GET' || (method === 'POST' && (route.endsWith(':listCollectionIds') || route.endsWith(':batchGet'))))) throw Error('Operação de nuvem não permitida.');
    try {
      const options = { skipLog: { body: true, resBody: true, queryParams: true } };
      return (method === 'GET' ? await client.get(route, options) : await client.post(route, body, options)).body;
    } catch (error) {
      const reason = error.context?.body?.error?.message;
      const detail = typeof reason === 'string' ? reason.replace(/projects\/\S+/g, '[caminho]').slice(0, 500) : '';
      throw Error(`Leitura do Firestore falhou (HTTP ${Number(error.status || error.context?.response?.statusCode) || 'indisponível'}). ${detail} Nenhum backup completo foi gerado.`);
    }
  };
}

export function localRequest(base) {
  if (!/^http:\/\/127\.0\.0\.1:\d{2,5}\/v1\/$/.test(base)) throw Error('Endereço de emulador inválido.');
  return async (method, route, body) => {
    const response = await fetch(base + route, { method, headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), redirect: 'error', signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error(`Emulador retornou HTTP ${response.status}. Restauração não concluída; use um novo projeto demo ao repetir.`);
    return response.json();
  };
}

export async function main(args) {
  const [command, ...rest] = args;
  if (!command || command === 'help') {
    console.log('Backup operacional do Firestore. Não inclui Firebase Auth, Storage, regras ou índices.\n' +
      'init-key --key-file CAMINHO\n' +
      'export --project PROJETO --key-file CHAVE --out ARQUIVO.salvaai-backup\n' +
      'verify --key-file CHAVE --input ARQUIVO.salvaai-backup\n' +
      'restore-local --project demo-salvaai-restore-NOVO --key-file CHAVE --input ARQUIVO.salvaai-backup\n' +
      'A restauração exige FIRESTORE_EMULATOR_HOST=127.0.0.1:PORTA. Nunca restaura na nuvem.');
    return;
  }
  const opts = options(rest);
  const allowed = { 'init-key': ['--key-file'], export: ['--project', '--key-file', '--out'], verify: ['--key-file', '--input'], 'restore-local': ['--project', '--key-file', '--input'] }[command];
  if (!allowed || allowed.some(key => !opts[key]) || Object.keys(opts).some(key => !allowed.includes(key))) throw Error('Comando ou opções inválidas. Use help.');
  if (command === 'init-key') {
    await privateWrite(opts['--key-file'], randomBytes(32));
    console.log('Chave criada com acesso restrito. Guarde uma cópia segura separada dos backups.'); return;
  }
  const key = await readLimited(opts['--key-file'], 32);
  if (key.length !== 32) throw Error('Chave inválida.');
  if (command === 'export') {
    if (!opts['--out'].endsWith('.salvaai-backup')) throw Error('Use a extensão .salvaai-backup.');
    const root = databaseRoot(opts['--project']);
    const request = await cloudReader(opts['--project']);
    // Um batchGet sem escrita fornece o horário do servidor para toda a leitura.
    const clock = await request('POST', `${root}:batchGet`, { documents: [`${root}/backupClock/checkpoint`] });
    const readTime = (Array.isArray(clock) ? clock[0] : clock)?.readTime;
    if (!readTime || !Number.isFinite(Date.parse(readTime))) throw Error('O servidor não informou o horário da leitura; exportação cancelada.');
    const backup = makeBackup(opts['--project'], await collectDocuments(request, opts['--project'], readTime), readTime);
    await privateWrite(opts['--out'], encryptBackup(backup, key));
    console.log(JSON.stringify({ exported: true, documents: backup.documents.length, sha256: backup.sha256 }));
  } else {
    const backup = decryptBackup(await readLimited(opts['--input'], MAX_BYTES + 128), key);
    if (command === 'verify') {
      const checked = summary(backup);
      console.log(JSON.stringify({ verified: true, documents: checked.documents, accounts: checked.accounts, sha256: checked.sha256 }));
    } else {
      const base = emulatorTarget(opts['--project']);
      const result = await restoreToEmulator(backup, opts['--project'], localRequest(base), process.env.FIRESTORE_EMULATOR_HOST);
      console.log(JSON.stringify({ verified: result.verified, documents: result.documents, accounts: result.accounts, balancesMatch: true, allFieldsMatch: true }));
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(`Backup não concluído: ${error.message}`); process.exitCode = 1; });
}
