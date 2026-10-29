import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { generateKeyPair, SignJWT, exportJWK, createLocalJWKSet } from 'jose';
import { createTokenVerifier } from '../server/firebase-auth.js';

const pair = await generateKeyPair('RS256');
const jwk = { ...await exportJWK(pair.publicKey), kid: 'test-key', alg: 'RS256' };
const verify = createTokenVerifier(createLocalJWKSet({ keys: [jwk] }));
const now = Math.floor(Date.now() / 1000);
const claims = { sub: 'user-123', aud: 'demo-project', iss: 'https://securetoken.google.com/demo-project', iat: now - 10, auth_time: now - 20, exp: now + 3600 };
const sign = (changes = {}, key = pair.privateKey) => new SignJWT({ ...claims, ...changes }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).sign(key);

test('função inicia com require de ESM desativado como no Lambda', () => {
  const entry = new URL('../netlify/functions/ai.js', import.meta.url).href;
  execFileSync(process.execPath, ['--no-experimental-require-module', '--input-type=module', '-e', `
    const { default: handler } = await import(${JSON.stringify(entry)});
    const response = await handler(new Request('http://localhost/api/ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    }));
    if (response.status !== 401) throw new Error('Esperado 401; recebido ' + response.status);
  `], { timeout: 10000, stdio: 'pipe' });
});

test('Firebase verifica assinatura e retorna UID do subject', async () => {
  assert.equal((await verify(await sign(), 'demo-project')).uid, 'user-123');
});
test('Firebase rejeita assinatura incorreta, projeto, emissor, datas e subject inválidos', async () => {
  const other = await generateKeyPair('RS256');
  await assert.rejects(verify(await sign({}, other.privateKey), 'demo-project'));
  for (const changes of [
    { aud: 'other' }, { aud: ['demo-project'] }, { iss: 'https://evil.example' },
    { exp: now - 1 }, { iat: now + 3600 }, { auth_time: now + 3600 },
    { sub: '' }, { sub: 'a'.repeat(129) }, { auth_time: undefined }, { iat: undefined },
  ]) await assert.rejects(verify(await sign(changes), 'demo-project'));
  await assert.rejects(verify('malformed', 'demo-project'));
  await assert.rejects(verify(await sign(), ''));
});
