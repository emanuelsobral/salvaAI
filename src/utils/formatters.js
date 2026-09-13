/**
 * Utilitários de formatação para o SalvaAI
 * Centraliza toda lógica de exibição de moeda, datas e porcentagens.
 */

/**
 * Formata um número para o padrão monetário brasileiro (R$).
 * @param {number} value - Valor numérico
 * @returns {string} Valor formatado (ex: "R$ 1.500,00")
 */
export const formatBRL = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

/**
 * Formata uma data ISO para o padrão brasileiro DD/MM/YYYY.
 * @param {string|Date} date - Data em formato ISO ou objeto Date
 * @returns {string} Data formatada
 */
export const formatDateBR = (date) => {
  if (!date) return '--/--/----';
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date.split('-').reverse().join('/');
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('pt-BR');
};

/**
 * Retorna a saudação baseada no horário atual.
 * @returns {string}
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

/**
 * Nomes dos meses abreviados em PT-BR.
 */
export const MESES_NOMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];
