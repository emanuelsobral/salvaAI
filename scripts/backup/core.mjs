import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const FORMAT = 'salvaai-firestore-backup';
export const MAX_BYTES = 64 * 1024 * 1024;
export const MAX_DOCUMENTS = 5000;
const HEADER = Buffer.from('SALVAAI-BACKUP-1\n');
const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const ensure = (condition, message) => { if (!condition) throw new Error(message); };

export function databaseRoot(project) {
  ensure(/^[a-z][a-z0-9-]{4,62}$/.test(project), 'Identificador de projeto inválido.');
  return `projects/${project}/databases/(default)/documents`;
}

function validPath(path) {
  const parts = typeof path === 'string' ? path.split('/') : [];
  return parts.length >= 2 && parts.length % 2 === 0 && parts.length <= 100
    && parts.every(part => part && part !== '.' && part !== '..' && [...part].every(character => character.charCodeAt(0) >= 32));
}

// Ordena somente mapas. A ordem dos arrays e os tipos REST do Firestore são preservados.
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (plainObject(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}

export function digest(documents) {
  const sorted = [...documents].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  return createHash('sha256').update(JSON.stringify(canonical(sorted))).digest('hex');
}

export function validateBackup(backup) {
  ensure(plainObject(backup) && backup.format === FORMAT && backup.version === 1, 'Formato de backup não suportado.');
  databaseRoot(backup.project);
  ensure(backup.database === '(default)' && backup.scope === 'firestore-documents', 'Escopo de backup não suportado.');
  ensure(typeof backup.createdAt === 'string' && Number.isFinite(Date.parse(backup.createdAt)), 'Data de backup inválida.');
  ensure(backup.readTime === null || (typeof backup.readTime === 'string' && Number.isFinite(Date.parse(backup.readTime))), 'Data da leitura inválida.');
  ensure(Array.isArray(backup.documents) && backup.documents.length <= MAX_DOCUMENTS, 'Quantidade de documentos inválida.');
  const paths = new Set();
  for (const doc of backup.documents) {
    ensure(plainObject(doc) && validPath(doc.path) && plainObject(doc.fields), 'Documento de backup inválido.');
    ensure(Object.keys(doc).every(key => ['path', 'fields'].includes(key)), 'Metadados de documento inesperados.');
    ensure(!paths.has(doc.path), 'Caminho duplicado no backup.');
    paths.add(doc.path);
  }
  ensure(backup.sha256 === digest(backup.documents), 'A conferência de integridade do backup falhou.');
  ensure(Buffer.byteLength(JSON.stringify(backup)) <= MAX_BYTES, 'Backup excede 64 MiB.');
  return backup;
}

export function makeBackup(project, documents, readTime = null) {
  return validateBackup({ format: FORMAT, version: 1, scope: 'firestore-documents', project,
    database: '(default)', createdAt: new Date().toISOString(), readTime, documents, sha256: digest(documents) });
}

export function encryptBackup(backup, key) {
  validateBackup(backup);
  ensure(Buffer.isBuffer(key) && key.length === 32, 'A chave deve conter 32 bytes.');
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(HEADER);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(backup), 'utf8'), cipher.final()]);
  return Buffer.concat([HEADER, nonce, cipher.getAuthTag(), ciphertext]);
}

export function decryptBackup(bytes, key) {
  ensure(Buffer.isBuffer(bytes) && bytes.length > HEADER.length + 28 && bytes.length <= MAX_BYTES + 128, 'Arquivo de backup inválido ou grande demais.');
  ensure(Buffer.isBuffer(key) && key.length === 32, 'A chave deve conter 32 bytes.');
  ensure(bytes.subarray(0, HEADER.length).equals(HEADER), 'Formato criptografado não suportado.');
  let backup;
  try {
    const offset = HEADER.length;
    const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(offset, offset + 12));
    decipher.setAAD(HEADER);
    decipher.setAuthTag(bytes.subarray(offset + 12, offset + 28));
    backup = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(offset + 28)), decipher.final()]).toString('utf8'));
  } catch { throw new Error('Não foi possível abrir o backup: chave incorreta ou arquivo alterado.'); }
  return validateBackup(backup);
}

// Totais são auxiliares; a validação final compara TODOS os campos de TODOS os documentos.
export function summary(backup) {
  validateBackup(backup);
  const collections = new Map();
  let accounts = 0, balanceCents = 0n;
  for (const doc of backup.documents) {
    const parts = doc.path.split('/');
    const collection = parts.filter((_, i) => i % 2 === 0).join('/');
    collections.set(collection, (collections.get(collection) || 0) + 1);
    if (parts.length === 4 && parts[0] === 'users' && parts[2] === 'accounts') {
      const value = Number(doc.fields.balance?.doubleValue ?? doc.fields.balance?.integerValue);
      ensure(Number.isFinite(value) && Math.abs(value) <= 1e9, 'Saldo de conta inválido no backup.');
      balanceCents += BigInt(Math.round(value * 100)); accounts++;
    }
  }
  return { documents: backup.documents.length, collections: Object.fromEntries([...collections].sort()), accounts, balanceCents: balanceCents.toString(), sha256: backup.sha256 };
}

const encodePath = value => value.split('/').map(encodeURIComponent).join('/');

export async function collectDocuments(request, project, readTime = null) {
  const root = databaseRoot(project);
  const documents = [], seen = new Set();
  let bytes = 0, calls = 0;
  async function call(method, route, body) {
    ensure(++calls <= 20000, 'Limite de leituras atingido; nenhum backup completo foi gerado.');
    return request(method, route, body);
  }
  async function visit(parent, depth = 0) {
    ensure(depth <= 50, 'Profundidade de coleções excedida.');
    let collectionToken;
    const collectionTokens = new Set();
    do {
      const page = await call('POST', `${encodePath(parent)}:listCollectionIds`, { pageSize: 100, ...(readTime ? { readTime } : {}), ...(collectionToken ? { pageToken: collectionToken } : {}) });
      for (const collection of page.collectionIds || []) {
        ensure(typeof collection === 'string' && collection && !collection.includes('/') && !['.', '..'].includes(collection), 'Coleção inválida recebida.');
        let token;
        const tokens = new Set();
        do {
          const query = new URLSearchParams({ pageSize: '100', showMissing: 'true', ...(readTime ? { readTime } : {}), ...(token ? { pageToken: token } : {}) });
          const page = await call('GET', `${encodePath(parent)}/${encodeURIComponent(collection)}?${query}`);
          for (const doc of page.documents || []) {
            ensure(typeof doc.name === 'string' && doc.name.startsWith(parent + '/' + collection + '/'), 'Documento fora do caminho solicitado.');
            ensure(doc.name.slice(parent.length + collection.length + 2).split('/').length === 1, 'Caminho de documento inesperado.');
            ensure(!seen.has(doc.name), 'Documento repetido durante leitura.');
            seen.add(doc.name);
            ensure(seen.size <= MAX_DOCUMENTS, 'Limite de 5.000 caminhos atingido; nenhum backup completo foi gerado.');
            // Pais ausentes têm subcoleções, mas não podem virar documentos vazios ao restaurar.
            if (doc.createTime || doc.updateTime) {
              const record = { path: doc.name.slice(root.length + 1), fields: doc.fields || {} };
              bytes += Buffer.byteLength(JSON.stringify(record));
              ensure(bytes <= MAX_BYTES - 4096, 'Backup excede 64 MiB.');
              documents.push(record);
            }
            await visit(doc.name, depth + 1);
          }
          token = page.nextPageToken;
          ensure(!token || !tokens.has(token), 'Paginação repetida.');
          if (token) tokens.add(token);
        } while (token);
      }
      collectionToken = page.nextPageToken;
      ensure(!collectionToken || !collectionTokens.has(collectionToken), 'Paginação de coleções repetida.');
      if (collectionToken) collectionTokens.add(collectionToken);
    } while (collectionToken);
  }
  await visit(root);
  return documents;
}

export function emulatorTarget(project, host = process.env.FIRESTORE_EMULATOR_HOST) {
  ensure(/^demo-salvaai-restore-[a-z0-9-]+$/.test(project), 'Restauração permitida somente em projeto demo-salvaai-restore-* novo.');
  ensure(/^127\.0\.0\.1:\d{2,5}$/.test(host || ''), 'Restauração exige emulador em 127.0.0.1:PORTA.');
  const port = Number(host.split(':')[1]);
  ensure(port > 0 && port <= 65535, 'Porta inválida.');
  return `http://${host}/v1/`;
}

function remapReferences(fields, sourceRoot, targetRoot) {
  function value(item) {
    if (Object.hasOwn(item, 'referenceValue')) {
      ensure(typeof item.referenceValue === 'string' && item.referenceValue.startsWith(sourceRoot + '/'), 'Referência externa não suportada no ensaio de restauração.');
      return { referenceValue: targetRoot + item.referenceValue.slice(sourceRoot.length) };
    }
    if (Object.hasOwn(item, 'mapValue')) return item.mapValue.fields ? { mapValue: { fields: map(item.mapValue.fields) } } : item;
    if (Object.hasOwn(item, 'arrayValue')) return item.arrayValue.values ? { arrayValue: { values: item.arrayValue.values.map(value) } } : item;
    return item;
  }
  function map(items) { return Object.fromEntries(Object.entries(items).map(([key, item]) => [key, value(item)])); }
  return map(fields);
}

export async function restoreToEmulator(backup, project, request, host) {
  validateBackup(backup);
  emulatorTarget(project, host);
  const root = databaseRoot(project);
  const sourceRoot = databaseRoot(backup.project);
  const records = backup.documents.map(doc => ({ path: doc.path, fields: remapReferences(doc.fields, sourceRoot, root) }));
  const existing = await request('POST', `${encodePath(root)}:listCollectionIds`, { pageSize: 1 });
  ensure(!existing.collectionIds?.length, 'Destino não está vazio. Use um novo projeto demo; nada foi sobrescrito.');
  // Create-only também recusa documentos criados por outra execução após a conferência inicial.
  let writes = [], batchBytes = 0;
  for (const doc of records) {
    const write = { update: { name: `${root}/${doc.path}`, fields: doc.fields }, currentDocument: { exists: false } };
    const bytes = Buffer.byteLength(JSON.stringify(write));
    ensure(bytes <= 8 * 1024 * 1024, 'Documento excede o limite de um lote de restauração.');
    if (writes.length && (writes.length === 100 || batchBytes + bytes > 8 * 1024 * 1024)) {
      await request('POST', `${encodePath(root)}:commit`, { writes });
      writes = []; batchBytes = 0;
    }
    writes.push(write); batchBytes += bytes;
  }
  if (writes.length) await request('POST', `${encodePath(root)}:commit`, { writes });
  const restored = makeBackup(project, await collectDocuments(request, project));
  ensure(restored.sha256 === digest(records), 'Restauração não confere com o arquivo. O destino local foi mantido para diagnóstico.');
  const expected = summary(makeBackup(project, records));
  const actual = summary(restored);
  ensure(JSON.stringify(expected) === JSON.stringify(actual), 'Quantidades ou saldos divergentes após restauração.');
  return { verified: true, ...actual };
}
