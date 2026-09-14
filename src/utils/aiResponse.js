export async function parseAiResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // Exibe somente mensagens JSON da API; páginas de erro da hospedagem
    // podem conter detalhes internos e não devem aparecer no chat.
    if (typeof data?.error === 'string' && data.error.trim()) throw new Error(data.error);
    const messages = {
      401: 'Sua sessão expirou. Entre novamente.',
      403: 'O acesso à IA foi recusado pela hospedagem.',
      404: 'O serviço de IA não foi encontrado nesta versão do site.',
      429: 'Limite temporário de IA atingido. Tente mais tarde.',
      502: 'A função de IA falhou na hospedagem. Tente novamente mais tarde.',
      504: 'O serviço de IA demorou demais para responder. Tente novamente.',
    };
    throw new Error((messages[response.status] || 'Serviço de IA indisponível.') + ` (HTTP ${response.status})`);
  }
  if (!data || typeof data !== 'object' || (!('text' in data) && !('data' in data))) {
    throw new Error('A API de IA não retornou uma resposta válida nesta hospedagem.');
  }
  return data;
}
