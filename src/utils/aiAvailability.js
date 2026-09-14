// Uma pausa por aba, compartilhada por todas as ações de IA.
// Não representa o instante de renovação da cota do Google.
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
        blockedUntil = now() + (response.status === 429 ? 60000 : 30000);
      }
      return response;
    } finally { pending = false; }
  };
}
