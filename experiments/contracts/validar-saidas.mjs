/** Validação estrutural e de evidências; não mede correção financeira. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const base = path.dirname(fileURLToPath(import.meta.url));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validar = ajv.compile(JSON.parse(fs.readFileSync(path.join(base, 'registro.schema.json'), 'utf8')));

function resultados(alvo) {
  if (fs.statSync(alvo).isFile()) return [alvo];
  return fs.readdirSync(alvo, { withFileTypes: true }).flatMap(item => {
    const destino = path.join(alvo, item.name);
    return item.isDirectory() ? resultados(destino) : item.name === 'resultado.json' ? [destino] : [];
  });
}

const args = process.argv.slice(2);
if (!args.length) throw new Error('Informe o arquivo resultado.json ou a pasta da rodada.');
const arquivos = args.flatMap(resultados);
if (!arquivos.length) throw new Error('Nenhum resultado encontrado.');
for (const arquivo of arquivos) {
  const registro = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  if (!validar(registro)) throw new Error(`${arquivo}: ${JSON.stringify(validar.errors)}`);
  const paginas = JSON.parse(fs.readFileSync(path.join(path.dirname(arquivo), 'paginas.json'), 'utf8'));
  for (const campo of Object.values(registro.campos)) {
    for (const evidencia of campo.evidencias) {
      if (!paginas[evidencia.pagina - 1]?.includes(evidencia.trecho)) {
        throw new Error(`${registro.documento_id}: evidência fora da página indicada.`);
      }
    }
  }
}
console.log(`${arquivos.length} registros aprovados no esquema e na localização literal das evidências.`);
