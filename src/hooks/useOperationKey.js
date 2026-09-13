import { useRef } from 'react';

// Mantém a identidade em uma tentativa repetida após erro de rede.
export function useOperationKey() {
  const pending = useRef(null);
  const keyFor = payload => {
    const fingerprint = JSON.stringify(payload);
    if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, id: crypto.randomUUID() };
    return pending.current.id;
  };
  const complete = () => { pending.current = null; };
  return { keyFor, complete };
}
