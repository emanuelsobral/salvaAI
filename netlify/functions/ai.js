import { createAiHandler } from '../../server/ai-handler.js';
import { verifyToken } from '../../server/firebase-auth.js';

export default createAiHandler({ verifyToken });
export const config = {
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'], action: 'rate_limit' },
};

