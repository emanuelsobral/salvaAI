export { default } from '../../server/disabled-ai.js';
export const config = {
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'], action: 'rate_limit' },
};

