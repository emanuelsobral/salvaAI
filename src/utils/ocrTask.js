// Resource ownership is separate from the UI so late worker startup cannot resurrect a cancelled job.
export async function recognizeOcrImage(image, { createWorker, workerOptions = {}, signal, onProgress = () => {}, timeoutMs = 90000 }) {
  let worker, stopped = false, timer, rejectFailure;
  const failure = new Promise((_, reject) => { rejectFailure = reject; });
  const fail = message => { stopped = true; rejectFailure(Error(message)); };
  const abort = () => fail('Leitura da imagem cancelada.');
  signal?.addEventListener('abort', abort, { once: true });
  const job = async () => {
    if (signal?.aborted) throw Error('Leitura da imagem cancelada.');
    worker = await createWorker('por', 1, { ...workerOptions,
      logger: message => { if (!stopped) onProgress(message); },
      errorHandler: () => fail('Não foi possível reconhecer a imagem. Tente novamente ou preencha manualmente.')
    });
    if (stopped) { await worker.terminate(); worker = null; throw Error('Leitura da imagem cancelada.'); }
    await worker.setParameters({ tessedit_pageseg_mode: '3' });
    if (stopped) throw Error('Leitura da imagem cancelada.');
    return (await worker.recognize(image, { rotateAuto: true }, { text: true, blocks: true })).data;
  };
  timer = setTimeout(() => fail('A leitura da imagem excedeu 90 segundos. Tente uma página mais simples ou preencha manualmente.'), timeoutMs);
  try { return await Promise.race([job(), failure]); }
  finally {
    stopped = true;
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
    if (worker) { const current = worker; worker = null; await current.terminate(); }
  }
}
