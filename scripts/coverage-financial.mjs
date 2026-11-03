import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Escopo explícito: cálculo, validação e persistência das operações financeiras.
// O relatório não representa a cobertura de toda a aplicação.
const files = {
  services: ['accountService', 'cardService', 'contractService', 'financialOperation',
    'goalService', 'importService', 'reconciliationService', 'subscriptionService', 'transactionService'],
  utils: ['agenda', 'categories', 'contractAdjustment', 'contractClosure', 'contractPlan',
    'contracts', 'csv', 'dashboard', 'finance', 'ofx', 'receipt', 'reconciliation', 'recurrence', 'statement'],
};
const paths = Object.entries(files).flatMap(([folder, names]) => names.map(name => `src/${folder}/${name}.js`));
const result = spawnSync(process.execPath, ['--experimental-vm-modules', '--experimental-test-coverage',
  ...paths.map(path => `--test-coverage-include=**/${path}`), '--test', 'tests/*.test.js'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
});
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
if (result.error) throw result.error;
const missing = paths.filter(path => !(result.stdout || '').includes(`${path.split('/').at(-1)} `));
if (missing.length) {
  console.error('Arquivos do escopo ausentes do relatório:', missing.join(', '));
  process.exitCode = 1;
} else process.exitCode = result.status ?? 1;
