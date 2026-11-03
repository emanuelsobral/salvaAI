import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');

// Never serialize headers, credentials, environment variables or image contents.
export function requestRecord(payload) {
  const messages = payload.messages || [];
  return {
    requestedModel: payload.model ?? null,
    maxTokens: payload.max_tokens ?? null,
    temperature: payload.temperature ?? null,
    thinking: payload.thinking ?? null,
    promptSha256: hash(JSON.stringify(messages.map(message => ({
      role: message.role, content: typeof message.content === 'string' ? message.content
        : message.content.filter(part => part.type === 'text'),
    })))),
    payloadSha256: hash(JSON.stringify(payload)),
    note: 'Null means not explicitly supplied; provider defaults are not assumed.',
  };
}

export async function artifactRecords(directory) {
  const names = (await readdir(directory)).filter(name =>
    /^(provider-\d+\.json|page-\d+\.json|sent-page-\d+\.jpg|text\.json|deepseek\.json|summary\.json|runtime-manifest\.json)$/.test(name)).sort();
  return Promise.all(names.map(async name => {
    const bytes = await readFile(path.join(directory, name));
    return { name, bytes: bytes.length, sha256: hash(bytes) };
  }));
}
