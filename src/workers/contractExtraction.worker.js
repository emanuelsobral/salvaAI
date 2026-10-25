import rules from '../../experiments/contracts/regras.py?raw';
import extenso from '../../experiments/contracts/extenso.py?raw';
import schools from '../../experiments/contracts/pagamentos_escolares.py?raw';

self.onmessage = async ({ data }) => {
  try {
    self.postMessage({ progress: 'Preparando o leitor local de contratos…' });
    const base = new URL(`${import.meta.env.BASE_URL}contract-runtime/`, self.location.origin).href;
    const { loadPyodide } = await import(/* @vite-ignore */ `${base}pyodide.mjs`);
    const python = await loadPyodide({ indexURL: base, stdout: () => {}, stderr: () => {} });
    for (const [name, source] of Object.entries({ 'regras.py': rules, 'extenso.py': extenso, 'pagamentos_escolares.py': schools })) {
      python.FS.writeFile(`/home/pyodide/${name}`, source);
    }
    // O documento é dado JSON, nunca código Python executável.
    python.globals.set('contract_pages_json', JSON.stringify(data.pages));
    self.postMessage({ progress: 'Identificando campos e evidências…' });
    const result = python.runPython(`
import json
from regras import extrair_campos, VERSAO
json.dumps({'version': VERSAO, 'fields': extrair_campos(json.loads(contract_pages_json))}, ensure_ascii=False)
`);
    self.postMessage({ result: JSON.parse(result) });
  } catch {
    self.postMessage({ error: 'Não foi possível executar a leitura local. Tente novamente ou use o cadastro manual.' });
  }
};
