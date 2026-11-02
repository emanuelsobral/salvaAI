import { existsSync, readdirSync } from 'node:fs';
import { resolve, join, delimiter } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const portable = join(root, '.tools.local', 'java');
const javaDirectory = process.env.JAVA_HOME || (existsSync(portable) ? readdirSync(portable).map(name => join(portable, name)).find(directory => existsSync(join(directory, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'))) : undefined);
const env = { ...process.env, FIREBASE_EMULATORS_PATH: process.env.FIREBASE_EMULATORS_PATH || join(root, '.firebase-emulators') };
if (javaDirectory) { env.JAVA_HOME = javaDirectory; env.PATH = [join(javaDirectory, 'bin'), process.env.PATH].join(delimiter); }
const result = spawnSync(process.execPath, [join(root, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js'), 'emulators:exec', '--only', 'firestore', '--project', 'demo-salva-ai', 'node --experimental-vm-modules --test tests/firebase.integration.js'], { cwd: root, env, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
