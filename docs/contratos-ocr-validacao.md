# OCR de contratos — validação de 25/10/2026

## Escopo

Leitura local opcional de todas as páginas do PDF como imagem, com Tesseract em português e as regras de extração 0.1.25. Não há chamada de modelo generativo, upload do original, calendário automático ou avaliação de precisão independente.

O importador aceita até 10 MB e 50 páginas, processadas sequencialmente. Cada página tem limite de 90 segundos para reconhecimento; a operação completa tem limite de dez minutos. Ausência de texto em qualquer página, erro, cancelamento ou excesso de limites bloqueiam o preenchimento completo. A origem `PDF_OCR_REVIEW` distingue transcrições automáticas da camada de texto `PDF_TEXT_REVIEW`.

## Verificações concluídas

- **151 testes do aplicativo:** cinco novos sobre preservação do texto, ordem e completude de páginas, limites, cancelamento e origem OCR. A suíte anterior do OCR de extratos continua passando.
- **Seis testes de integração Firestore:** origem OCR aceita, persistida e protegida contra substituição, além das verificações anteriores de isolamento, pagamentos e compromissos.
- **Navegador com PDF fictício somente com imagem:** OCR real, sugestões de valor e parcelas, revisão obrigatória, aviso de transcrição automática, salvamento e recarga da origem. Limite de páginas e cancelamento também verificados.
- **Build e motor compilado:** regras Python e OCR executados no navegador com arquivos do próprio build, incluindo worker e idioma locais; zero requisições externas no teste.
- **Interface:** aviso OCR inspecionado em 390 pixels; os fluxos anteriores de formulário e compromissos continuam verificados em 320/390 pixels. Não houve teste em celular físico.

## Documentos de desenvolvimento

Selecionados exclusivamente `sau-04` e `sau-05`, ambos marcados como **desenvolvimento** em `experiments/contracts/amostra-piloto-v1.json`. O script confere a divisão e o SHA-256 antes de ler. Cada documento contém 37 páginas e não oferecia texto útil no piloto original. Nenhum documento do conjunto de teste foi aberto.

As saídas ficam separadas do experimento original: texto OCR por página, resultados dos cinco campos, sugestões e metadados são preservados em arquivos locais. Não há gravação no banco durante esta verificação.

| Documento | Páginas | Resultado |
|---|---:|---|
| sau-04 | 37 | Leitura completa; valor, parcelas e vencimento não identificados; vigência e reajuste ambíguos. |
| sau-05 | 37 | Leitura completa; valor, parcelas e vencimento não identificados; vigência e reajuste ambíguos. |

Foram processadas **74 páginas**, sem falhas de leitura neste lote. Tempos locais: 179 segundos para `sau-04` e 177 segundos para `sau-05`, incluindo extração; não são previsão para outros aparelhos. As sugestões dos cinco campos ficaram vazias nos dois cadastros, com os estados e evidências disponíveis para revisão. O texto foi obtido, mas as regras não determinaram esses campos.

Artefatos desta rodada: `contracts-ocr-development/summary.json`, `sau-04.ocr.json` e `sau-05.ocr.json`, na pasta de trabalho da unidade C usada nesta sessão. São resultados locais de desenvolvimento, sem alteração dos originais ou das saídas do CLI. M4 concluído no código local; publicação pendente.

Os estados de extração não são medidas de acerto. Não há gabarito independente nem comparação sistemática da transcrição com cada imagem. O conjunto reservado e as saídas anteriores do CLI permanecem intactos. Estes documentos são condições gerais, não exemplos com todos os dados de contratação preenchidos.

## Reproduzir

O teste da interface está em `scripts/verify-contracts-ui.mjs`, executado com Firestore emulado conforme o [roteiro](contratos-mvp.md). O teste dos arquivos compilados está em `scripts/verify-contract-runtime.mjs` e usa `CONTRACT_BUILD_DIR`.

Para repetir apenas o piloto de desenvolvimento: configurar `PLAYWRIGHT_MODULE` se necessário e `CONTRACT_QA_DIR` para uma pasta local de saída, então executar `node scripts/verify-contract-ocr-development.mjs`. Requer os dois PDFs já coletados, Chrome e Playwright. O script inicia Vite na porta 5179, bloqueia requisições externas, mantém os originais e salva resultados ou erros. Não produz gabarito nem recalcula métricas do experimento.

## Limites restantes

OCR pode trocar caracteres, perder tabelas, inverter colunas ou reconhecer palavras em uma imagem ruim. Os trechos são evidências da transcrição, não prova de fidelidade ao documento. A revisão no PDF original continua obrigatória. Campos ausentes não são calculados; manuscritos e cobertura universal não foram validados. A publicação da interface e das regras é uma etapa separada.
