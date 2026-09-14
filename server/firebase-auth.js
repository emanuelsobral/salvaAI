import { createRemoteJWKSet, jwtVerify } from 'jose';

// Origem fixa: nunca aceita URLs ou chaves fornecidas pelo token/cliente.
const googleKeys = createRemoteJWKSet(new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
), { timeoutDuration: 5000, cooldownDuration: 30000, cacheMaxAge: 3600000 });

export function createTokenVerifier(keys = googleKeys) {
  return async (token, projectId) => {
    if (!projectId) throw new Error('Projeto Firebase ausente.');
    const { payload, protectedHeader } = await jwtVerify(token, keys, {
      algorithms: ['RS256'],
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      requiredClaims: ['exp', 'iat', 'auth_time', 'sub'],
    });
    const now = Math.floor(Date.now() / 1000);
    if (typeof protectedHeader.kid !== 'string' || !protectedHeader.kid ||
        payload.aud !== projectId || typeof payload.sub !== 'string' ||
        !payload.sub.length || payload.sub.length > 128 ||
        !Number.isFinite(payload.iat) || payload.iat > now ||
        !Number.isFinite(payload.auth_time) || payload.auth_time > now) {
      throw new Error('Token Firebase inválido.');
    }
    return { ...payload, uid: payload.sub };
  };
}

export const verifyToken = createTokenVerifier();
