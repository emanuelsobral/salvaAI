# Contratos no SalvaAI — roteiro de entrega

Atualizado em **25/10/2026**. Desenvolvimento sem chamadas de IA. Nível recomendado: **Alto**.

## Escopo e andamento

Prioridade: cadastrar contratos e, depois, revisar compromissos vinculados. O protótipo de extração não bloqueia o cadastro manual.

| Entrega | Critério de conclusão | Estado |
|---|---|---|
| M1 — Cadastro manual (K10a) | Listar, criar e editar; persistência por usuário; campos desconhecidos vazios; validações, conflitos de edição e tela responsiva verificados. | Concluído no código local |
| M2 — Compromissos vinculados (K10b, usando C06) | Prévia de datas e valores; confirmação explícita; vínculo com contrato e vencimentos; repetição sem duplicar; nenhum débito antes do pagamento. | Concluído no código local, para parcelas iguais |
| M3 — Preenchimento assistido por PDF (parte de K34) | Conectar extração suportada à revisão; preservar evidências; permitir correção; salvar apenas dados confirmados, sem inventar campos. | Concluído no código local, para PDF com texto |
| M4 — OCR de contratos (parte de K34) | Leitura local dos documentos de desenvolvimento sem texto; cancelamento, limites e erros preservados; resultado revisável na importação. | Concluído no código local, com revisão obrigatória |

Reajustes programados e encerramento do contrato continuam em K11; consolidação ampliada em K12. A projeção existente já considera os compromissos confirmados, e o encerramento da recorrência preserva pagamentos. Contas avulsas gerais e boletos de K08 continuam pendentes: M2 reutiliza o calendário de C06, sem criar um segundo mecanismo de pagamento. O roteiro não promete cobertura de todos os contratos.

## Percentuais e método de trabalho

- **Integração inicial: 100% (4/4 entregas concluídas no código).** Contagem dos quatro marcos deste roteiro, sem ponderar esforço ou prazo; não representa o projeto inteiro nem precisão de leitura. Publicação é separada.
- **Entregas M1–M4: 100% cada (3/3 blocos):** implementar, validar fluxos, revisar/documentar.
- **Experimento original: 29% (2/7 etapas).** Avalia protocolo, coleta, gabarito, protótipo e avaliação. Não mede disponibilidade no aplicativo.
- **Publicação de M1–M4: concluída em 25/10/2026.** Regras, interface e recursos PDF/OCR publicados e conferidos. Teste autenticado no site pendente. [Registro do deploy](deploy-2026-10-25.md).

Concluir uma entrega antes de ampliar formatos. Investigações que não impedem o critério atual entram no backlog. Desenvolvimento pode continuar sem anotador humano; referências assistidas por IA não equivalem a avaliação independente. Usar o Kanban e este roteiro como ponto de retomada, sem reabrir etapas concluídas sem falha ou requisito novo.

## Cadastro manual

Na aplicação local, abrir **Contratos → Novo contrato**. Apenas o título é obrigatório. Campos disponíveis: pessoa/empresa, valor da parcela, quantidade de parcelas, início e término, vencimento, reajuste e observações. Salvar e usar **Editar** para corrigir.

Salvar não gera contas nem altera saldos. Quantidade de parcelas não é deduzida da vigência. Campos desconhecidos aparecem como “Não informado”. Exclusão e encerramento do cadastro de contrato continuam pendentes.

Se outra tela alterar o mesmo contrato, a edição antiga é recusada e os campos permanecem no formulário. Cancelar e atualizar a lista antes de reaplicar a alteração.

## Preencher a partir de PDF

1. Abrir **Contratos → Importar PDF**. Para digitalizações ou páginas com texto parcial, ativar **Ler páginas digitalizadas (OCR)** antes de **Selecionar PDF**. Até 10 MB e 50 páginas.
2. Aguardar a leitura neste dispositivo. Na primeira utilização, o navegador baixa cerca de 12 MB do próprio site para executar o motor local; não há chamada de IA ou envio do PDF a um servidor.
3. Conferir os cinco campos sugeridos: valor, quantidade de parcelas, vencimento, vigência e reajuste. Em **Conferir evidências**, consultar o estado de cada campo, a página e o trecho usado.
4. Informar o título e corrigir o que for necessário usando o documento original. Campo ausente ou ambíguo fica vazio; duração não vira quantidade de parcelas nem data calculada.
5. Marcar a conferência e salvar. Alterar um campo desmarca a confirmação. Cancelar descarta o preenchimento sem cadastrar.

Ao salvar, os campos revisados e as evidências são enviados à conta no Firestore. O PDF original não é armazenado. As evidências preservam as sugestões originais, inclusive as que foram corrigidas; não representam uma certificação da interpretação. Editar depois mantém essa origem.

Arquivos protegidos por senha, inválidos ou grandes demais bloqueiam o preenchimento. Sem OCR, uma página sem texto pede para ativar OCR e selecionar novamente. No modo OCR, todas as páginas são lidas como imagens, inclusive as que têm camada de texto parcial; uma página vazia ou ilegível também bloqueia o resultado completo. Não se ignora uma página silenciosamente. Cancelar ou selecionar outro arquivo descarta a leitura anterior.

### Leitura de digitalizações

O OCR usa Tesseract em português, servido pelo próprio site, sem API ou upload. Reutiliza o leitor de imagens dos extratos e processa uma página por vez, com o número da página e o progresso visíveis. Os arquivos de OCR são baixados sob demanda, além dos cerca de 12 MB do motor de regras. Uma conexão inicial é necessária; não se promete funcionamento offline.

O modo normal tem limite total de dois minutos. O OCR tem limite total de dez minutos, com até 90 segundos para reconhecimento de cada página e até 90 segundos para as regras de extração. Esses limites encerram a operação; não são estimativas de duração. Computadores e celulares mais lentos podem excedê-los.

O resultado fica identificado como **Origem: OCR** no cadastro e nas evidências, inclusive depois de recarregar. Os trechos são transcrições automáticas, não citações verificadas da imagem. Não há correção automática de dígitos incertos, datas ou valores. Confirme no PDF original; nitidez, rotação, tabelas, manuscritos e ordem das colunas afetam a leitura. Reconhecer texto não significa identificar corretamente todos os cinco campos.

### Motor e limites da integração

O navegador usa PDF.js para obter texto por página e executa as regras Python **0.1.25** em um Worker com **Pyodide 0.29.2**, servido pelo próprio site. Os arquivos de regras são os mesmos do protótipo, sem uma segunda implementação. O motor só é carregado ao importar PDF e é encerrado após cada leitura. O tamanho inicial e o tempo de execução podem ser perceptíveis em aparelhos modestos.

O leitor de texto é diferente do CLI, que usa pypdf. Portanto, reaproveitar as regras não comprova resultados idênticos entre leitores ou precisão em PDFs reais. Tabelas, colunas, quebras de linha e texto mal codificado podem reduzir a identificação. Os testes de integração usam documentos fictícios, sem abrir o conjunto reservado da pesquisa.

As evidências ficam em `sourceReview`: método `PDF_TEXT_REVIEW` ou `PDF_OCR_REVIEW`, SHA-256 do PDF, versão do extrator e JSON dos cinco resultados (até 100.000 caracteres). Não inclui o PDF nem o texto integral das páginas. As regras de acesso limitam o formato externo e impedem substituir a origem após a criação; a aplicação valida o conteúdo e a correspondência inicial dos trechos com o texto obtido por página. Isso não prova a autenticidade do documento nem a fidelidade da transcrição OCR.

## Confirmar compromissos

1. No contrato salvo, escolher **Planejar compromissos**.
2. Informar valor por parcela, quantidade, primeiro vencimento e frequência semanal, mensal ou anual. Uma parcela representa um compromisso único. Valores conhecidos são sugeridos; a frequência e a primeira data exigem escolha.
3. Usar **Ver prévia** para conferir todas as datas e o total. Voltar e ajustar se necessário. A prévia não grava dados.
4. Confirmar a conferência e que as mesmas contas não foram cadastradas antes; selecionar **Confirmar compromissos**.
5. Abrir **Ver vencimentos**. A tela de contas recorrentes começa no mês da primeira parcela e mostra apenas esse contrato. Registrar pagamento somente depois de pagar; se já importou o pagamento, usar o vínculo com extrato para evitar outro débito.

O calendário mantém o dia original: 31/janeiro → 28/fevereiro → 31/março. O último vencimento encerra a série. Datas fora da vigência são destacadas para revisão, pois o contrato pode prever pagamento posterior ao período de prestação.

Não interpreta expressões como “30 dias após a nota fiscal”, não consulta dias úteis e não calcula juros, carência ou reajustes. Essas condições precisam ser convertidas em datas e valores conhecidos pelo usuário. Não suporta parcelas de valores diferentes neste fluxo.

Só há um plano por contrato. Repetições da mesma solicitação retornam o resultado existente; outras tentativas são recusadas. Isso não identifica automaticamente contas equivalentes criadas manualmente ou em outro contrato.

Editar o cadastro não modifica o plano confirmado. A edição genérica de recorrências fica bloqueada para esses planos. **Encerrar recorrência** cancela vencimentos futuros sem pagamento, preservando pagamentos e pendências até hoje; não encerra juridicamente o contrato nem permite gerar outro plano. Estornar pelo histórico devolve o saldo e reabre o vencimento. Alterações contratuais ficam para K11.

## Dados e proteção

- Coleção `users/{uid}/contracts/{id}`, com acesso somente do usuário autenticado proprietário.
- Campos: `title`, `counterparty`, `amount` (reais ou null), `installments` (inteiro ou null), `startDate`, `endDate`, `dueRule`, `adjustmentRule`, `notes`.
- Datas opcionais `YYYY-MM-DD`; texto opcional vazio. Limites: título/contraparte 500 caracteres, vencimento/reajuste 600, observações 3000, até 1200 parcelas.
- Metadados: `schemaVersion: 1`, `revision`, `createdAt`, `updatedAt`. A criação é preservada e a revisão incrementa na edição.
- A confirmação adiciona `commitmentPlan` ao contrato: `subscriptionId`, `amount`, `count`, `frequency`, `firstDueDate`, `lastDueDate`, `contractRevision`. Cria atomicamente uma recorrência finita `subscriptions/contract_{contractId}`, com `contractId` e `installmentCount`. O vínculo e as condições ficam imutáveis nesta etapa; pagamentos e encerramento usam o fluxo existente.
- Transação e marcador de operação impedem repetição da mesma solicitação. Não se deduplica por título: contratos distintos podem ter o mesmo nome.
- Regras bloqueiam anônimos, outros usuários, campos extras, exclusão e alteração da data de criação. O serviço também valida datas reais, ordem da vigência e casas decimais.
- **Publicar as novas regras antes da interface.** As regras anteriores de produção não concedem acesso à coleção de contratos. Iniciar o Vite normalmente usa o Firebase configurado em `.env.local`, não o emulador.

## Validação de 25/10/2026

- **151 testes do aplicativo aprovados**, incluindo cinco de OCR de contratos, cinco de sugestões/evidências e sete de planejamento. Os testes anteriores do OCR de extratos continuam passando.
- **Seis testes de integração Firestore aprovados**, incluindo proteção das evidências, vínculo atômico, isolamento, condições imutáveis, bloqueio de gravação parcial e pagamento/estorno sob as regras.
- Navegador com serviço real e Firestore emulado: cadastro, recarga, edição, conflito entre telas, prévia, confirmação, filtro de vencimentos e pagamento persistido aprovados. Formulário e prévia conferidos em 320/390 pixels; captura desktop em 1280 pixels. Não foi testado em celular físico.
- PDF no navegador: motor real preencheu cinco campos fictícios; edição, confirmação obrigatória, recarga e evidências persistidas aprovadas. Arquivo inválido, página sem texto, excesso de páginas, cancelamento e troca de arquivo verificados. Não é avaliação de precisão em contratos reais.
- OCR no navegador: PDF fictício somente com imagem, campos revisáveis, origem salva e recarregada, limite e cancelamento aprovados. Build e OCR compilado testados com recursos do próprio site e zero requisições externas. Permanece o aviso de tamanho do pacote; o aviso anterior de SubsList não foi objeto desta etapa.
- Testes com dados fictícios, sem acessar produção. A interrupção por limite de uso da revisão automática foi superada e o teste pendente executado na retomada.

Para repetir: `npm test`, `npm run test:firebase`, `npm run build`.

O teste visual fica em `scripts/verify-contracts-ui.mjs`. Requer Playwright e Chrome instalados. `PLAYWRIGHT_MODULE` pode indicar um pacote existente; `PLAYWRIGHT_CHANNEL` seleciona um canal compatível; `CONTRACT_QA_DIR` define a pasta de capturas (padrão `.contract-qa/`, ignorado pelo Git).

```powershell
node node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --only firestore --project demo-salva-ai "node scripts/verify-contracts-ui.mjs"
```

O script inicia Vite na porta 5178 com configuração fictícia, usa o emulador na 8080, bloqueia requisições externas no navegador e encerra os processos iniciados. A fixture não integra o build de produção.

Para conferir os arquivos compilados, definir `CONTRACT_BUILD_DIR` com o diretório de saída do build e executar `node scripts/verify-contract-runtime.mjs`, com as mesmas opções de Playwright. Esse teste serve apenas arquivos do build em endereço local, executa o Worker real e bloqueia acesso externo; não usa Firebase.

O piloto de OCR processou por completo os dois PDFs digitalizados de desenvolvimento: **74 páginas**. Valor, parcelas e vencimento permaneceram não identificados; vigência e reajuste, ambíguos. [Relatório do piloto e limites](contratos-ocr-validacao.md). Não foram abertas amostras reservadas para avaliação.

**Próximo passo:** teste autenticado no site (K07). GPT recomendado: **Alto**, pela conferência do fluxo financeiro e das permissões. M1–M4 foram implementados e publicados; reajustes e alterações contratuais continuam em K11, fora deste percentual.

## Sequência de publicação e validação

Etapas 1–3 concluídas em 25/10/2026; a conferência pública também passou. A etapa 4, com login, continua pendente.

1. Conferir o conjunto de alterações e registrar a versão que será publicada. Os testes acima correspondem ao código local; caso ele mude, repetir as verificações afetadas.
2. Publicar as regras Firestore que permitem contratos, planos vinculados e as origens `PDF_TEXT_REVIEW`/`PDF_OCR_REVIEW`.
3. Publicar a interface junto com os recursos `contract-runtime/` e `ocr/`; conferir que os arquivos são servidos corretamente pela hospedagem.
4. Em sessão autenticada de teste, conferir cadastro e recarga, PDF/OCR com revisão e origem preservada, prévia de compromissos e ausência de mudança de saldo antes do pagamento. Usar dados fictícios em conta de teste.
5. Registrar a versão, os resultados e eventuais limitações da publicação no README e em K07. A aprovação local não substitui essa verificação no site.

O fechamento documental e a publicação estão registrados separadamente no [relatório de deploy](deploy-2026-10-25.md).
