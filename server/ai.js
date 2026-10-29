import { createAiHandler } from './ai-handler.js';
import { verifyToken } from './firebase-auth.js';
export default createAiHandler({ verifyToken });
