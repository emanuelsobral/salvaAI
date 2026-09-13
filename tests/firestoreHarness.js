import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Test double: commits atômicos, conflitos otimistas e proibição de leituras após escritas.
// Não substitui o teste de regras no emulador nem acessa serviços de produção.
export async function harness() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
  const records = new Map(), versions = new Map();
  let serial = 0, fail = false;
  const ref = (base, parts) => {
    const value = [base?.path, ...parts].filter(Boolean).join('/');
    return { path: value, id: value.split('/').at(-1) };
  };
  const snapshot = (reference, source = records) => ({ ref: reference, id: reference.id, exists: () => source.has(reference.path), data: () => structuredClone(source.get(reference.path)) });
  const firestore = {
    collection: (base, ...parts) => ref(base, parts),
    doc: (base, ...parts) => ref(base, parts.length ? parts : ['auto_' + ++serial]),
    serverTimestamp: () => ({ seconds: 1 }),
    where: (field, operator, value) => ({ field, operator, value }),
    orderBy: (field, direction = 'asc') => ({ order: field, direction }),
    limit: count => ({ count }),
    query: (reference, ...filters) => ({ ...reference, filters }),
    getDoc: async reference => snapshot(reference),
    getDocs: async reference => {
      let docs = [...records.keys()].filter(key => key.startsWith(reference.path + '/') && key.split('/').length === reference.path.split('/').length + 1).map(key => snapshot(ref(null, [key])));
      for (const filter of reference.filters || []) {
        if (filter.field) docs = docs.filter(item => item.data()[filter.field] === filter.value);
        if (filter.order) docs.sort((a, b) => String(a.data()[filter.order]).localeCompare(String(b.data()[filter.order])) * (filter.direction === 'desc' ? -1 : 1));
        if (filter.count) docs = docs.slice(0, filter.count);
      }
      return { docs, empty: !docs.length };
    },
    runTransaction: async (_, execute) => {
      for (let attempt = 0; attempt < 10; attempt++) {
        const source = new Map(structuredClone([...records])), revision = new Map(versions), reads = new Set(), writes = [];
        const transaction = {
          get: async reference => {
            if (writes.length) throw new Error('Read after write');
            reads.add(reference.path);
            return snapshot(reference, source);
          },
          set: (reference, data) => writes.push({ type: 'set', reference, data }),
          update: (reference, data) => writes.push({ type: 'update', reference, data }),
          delete: reference => writes.push({ type: 'delete', reference })
        };
        const result = await execute(transaction);
        if ([...reads].some(key => versions.get(key) !== revision.get(key))) continue;
        if (fail && writes.some(write => write.reference.path.includes('/transactions/'))) { fail = false; throw new Error('Injected commit failure'); }
        for (const write of writes) {
          const key = write.reference.path;
          if (write.type === 'update' && !records.has(key)) throw new Error('Missing document');
        }
        for (const write of writes) {
          const key = write.reference.path;
          if (write.type === 'delete') records.delete(key);
          else records.set(key, structuredClone(write.type === 'update' ? { ...records.get(key), ...write.data } : write.data));
          versions.set(key, (versions.get(key) || 0) + 1);
        }
        return result;
      }
      throw new Error('Too much contention');
    },
    increment: value => value,
    updateDoc: async (reference, data) => { records.set(reference.path, { ...records.get(reference.path), ...data }); versions.set(reference.path, (versions.get(reference.path) || 0) + 1); },
    addDoc: async (reference, data) => { const item = ref(reference, ['auto_' + ++serial]); records.set(item.path, data); return item; }
  };
  const context = vm.createContext({ console, crypto, Date, TextEncoder, setTimeout, clearTimeout });
  const modules = new Map();
  function synthetic(key, exports) {
    return new vm.SyntheticModule(Object.keys(exports), function () { for (const [name, value] of Object.entries(exports)) this.setExport(name, value); }, { context, identifier: key });
  }
  const firebase = synthetic('firebase/firestore', firestore), db = synthetic('firebase-config', { db: {} });
  async function load(filename) {
    if (modules.has(filename)) return modules.get(filename);
    const module = new vm.SourceTextModule(await readFile(filename, 'utf8'), { context, identifier: filename });
    modules.set(filename, module);
    await module.link(async (specifier, parent) => {
      if (specifier === 'firebase/firestore') return firebase;
      if (specifier === './firebase') return db;
      const target = path.resolve(path.dirname(parent.identifier), specifier.endsWith('.js') ? specifier : specifier + '.js');
      return load(target);
    });
    return module;
  }
  return {
    seed: (collection, id, data, uid = 'test') => { const key = 'users/' + uid + '/' + collection + '/' + id; records.set(key, structuredClone(data)); versions.set(key, (versions.get(key) || 0) + 1); },
    all: collection => [...records].filter(([key]) => key.startsWith('users/test/' + collection + '/')).map(([key, data]) => ({ id: key.split('/').at(-1), ...structuredClone(data) })),
    failNextCommit: () => { fail = true; },
    service: async name => { const module = await load(path.join(root, 'services', name + '.js')); if (module.status !== 'evaluated') await module.evaluate(); return module.namespace; }
  };
}
