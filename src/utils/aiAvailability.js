// Uma pausa por aba, compartilhada por todas as ações de IA.
// Usa o retryAfterSeconds informado pelo backend (que reflete o retry-after do Google).
export function createAiAvailability(now = Date.now) {
  let blockedUntil = 0;
  let pending = false;
  return async function run(operation) {
    const remaining = Math.ceil((blockedUntil - now()) / 1000);
    if (remaining > 0) throw new Error(`A IA está em pausa após uma falha. Aguarde ${remaining} segundos antes de tentar novamente.`);
    if (pending) throw new Error('Já existe uma consulta de IA em andamento. Aguarde a resposta.');
    pending = true;
    try {
      const response = await operation();
      if (response.status === 429 || response.status === 503) {
        // Clona para não consumir o corpo que parseAiResponse ainda precisa ler.
        const body = await response.clone().json().catch(() => ({}));
        const wait = (body.retryAfterSeconds || (response.status === 429 ? 60 : 30)) * 1000;
        blockedUntil = now() + wait;
      }
      return response;
    } finally { pending = false; }
  };
}
