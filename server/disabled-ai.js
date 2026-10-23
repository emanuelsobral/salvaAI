// Bloqueia também clientes antigos após o deploy, mesmo se a chave continuar configurada.
export default function disabledAI() {
  return Response.json({ error: 'A integração com IA está desativada. Use as consultas automáticas do aplicativo.' }, {
    status: 410, headers: { 'Cache-Control': 'no-store' },
  });
}
