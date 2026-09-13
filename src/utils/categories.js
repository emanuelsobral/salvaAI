/**
 * Mapeamento de categorias por tipo de transação.
 * Usado nos formulários de criação para popular selects dinâmicos.
 */

export const EXPENSE_CATEGORIES = [
  { value: 'ALIMENTACAO', label: '🛒 Supermercado & Alimentação' },
  { value: 'REFEICAO', label: '🍔 Restaurante / Delivery' },
  { value: 'MORADIA', label: '🏠 Moradia (Aluguel, Luz, Água)' },
  { value: 'TRANSPORTE', label: '🚗 Transporte (Uber, Combustível)' },
  { value: 'LAZER', label: '🍿 Lazer & Cultura' },
  { value: 'SAUDE', label: '💊 Saúde & Farmácia' },
  { value: 'ASSINATURAS', label: '📺 Assinaturas & Serviços' },
  { value: 'OUTROS_SAIDA', label: '💸 Outros Gastos' },
];

export const INCOME_CATEGORIES = [
  { value: 'SALARIO', label: '💰 Salário Principal' },
  { value: 'FREELANCE', label: '💻 Freelance / Renda Extra' },
  { value: 'BENEFICIO', label: '💳 Recarga de Benefício (VR/VA)' },
  { value: 'RENDIMENTO', label: '📈 Rendimento (Caixinhas)' },
  { value: 'CASHBACK', label: '🔄 Cashback / Reembolso' },
  { value: 'OUTROS_ENTRADA', label: '💵 Outras Receitas / Presentes' },
];

export const CARD_CATEGORIES = [
  { value: 'ELETRONICOS', label: '💻 Equipamentos e Eletrônicos' },
  { value: 'LAZER', label: '🍿 Jogos, Lazer e Cultura' },
  { value: 'SAUDE', label: '💊 Odonto, Saúde & Farmácia' },
  { value: 'ROUPAS', label: '👔 Roupas, Tênis e Beleza' },
  { value: 'ASSINATURAS', label: '📦 Planos Anuais' },
  { value: 'OUTROS', label: '💸 Outros Gastos de Cartão' },
];

export const SUB_CATEGORIES = [
  { value: 'Streaming', label: 'Streaming (Netflix, Spotify, etc.)' },
  { value: 'Saúde', label: 'Saúde (Academia, Plano de Saúde)' },
  { value: 'Educação', label: 'Educação (Cursos, Assinaturas)' },
  { value: 'Software', label: 'Software (Cloud, Apps, SaaS)' },
  { value: 'Internet', label: 'Internet / Telefone' },
  { value: 'Seguros', label: 'Seguros' },
  { value: 'Outros', label: 'Outros' },
];

/**
 * Mapeamento de padrões regex para inferência automática de categoria (Import CSV).
 */
export const CATEGORY_PATTERNS = [
  { pattern: /MCDONALD|IFOOD|BURGER|PIZZA|REST|ASSAI|CARREFOUR|MERCADO|ATACADAO|EXTRA/i, category: 'ALIMENTACAO' },
  { pattern: /UBER|99|POSTO|COMBUSTIVEL|SHELL|IPIRANGA|METRO|BILHETE/i, category: 'TRANSPORTE' },
  { pattern: /NETFLIX|AMAZON|PRIME|SPOTIFY|DISNEY|HBO|MAX|YOUTUBE|GLOBO/i, category: 'ASSINATURAS' },
  { pattern: /FARMACIA|RAIA|DROGASIL|CLINICA|HOSPITAL|SULAMERICA|UNIMED|MEDICAMENTO/i, category: 'SAUDE' },
  { pattern: /STEAM|XBOX|PLAYSTATION|CINEMA|EVENTOS|SYMPLA|NINTENDO|BLIZZARD/i, category: 'LAZER' },
  { pattern: /ENEL|SABESP|LUZ|AGUA|CONDOMINIO|ALUGUEL|INTERNET|VIVO|CLARO|TIM/i, category: 'MORADIA' },
  { pattern: /SALARIO|PAGAMENTO|PIX RECEBIDO|TED RECEBIDO|HONORARIOS|FREELA/i, category: 'SALARIO' },
];

/**
 * Infere a categoria de uma descrição usando padrões regex.
 * @param {string} description 
 * @returns {string} Categoria inferida
 */
export const inferCategory = (description) => {
  const upper = (description || '').toUpperCase();
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(upper)) return category;
  }
  return 'OUTROS';
};

/**
 * Retorna categorias com base no tipo de transação.
 */
export const getCategoriesByType = (type) => {
  return type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
};
