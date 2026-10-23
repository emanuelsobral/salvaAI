# Validação de qualidade de imagem e revisão móvel — 17/10/2026

**Rodada concluída: 3/3 blocos (100% do plano de validação)**: imagens de qualidades diferentes, falhas/cancelamento e revisão em tela pequena. Esse percentual não mede precisão do OCR, suporte a bancos ou funcionamento em todos os celulares.

## Imagens fictícias e resultado observado

Quatro variantes do mesmo extrato fictício, com quatro movimentações conhecidas, foram geradas no navegador como PDFs contendo apenas imagem. Não há camada de texto para auxiliar a leitura. A referência contém data, valor e entrada/saída; descrições permanecem sujeitas a revisão. O conjunto é pequeno e controlado, não representa uma amostra de digitalizações reais.

| Variante | Característica | Movimentações completas correspondentes | Pendências observadas |
|---|---|---|---|
| Nítida | Imagem 2400 × 1600, sem inclinação | 3/4 (75%) | Um valor foi lido com caractere ambíguo e ficou sem valor/tipo selecionado. |
| Reduzida | Imagem 1020 × 680 | 3/4 (75%) | Uma movimentação ficou incompleta; uma linha de saldo também apareceu, sem tipo definido. Precisa corrigir a movimentação e excluir o saldo. |
| Inclinada | Imagem 1800 × 1200, rotação de 2 graus | 4/4 (100% deste cenário) | A correção automática de inclinação permitiu reconhecer os quatro registros; revisão e geração local concluídas. |
| Muito degradada | Imagem 480 × 320, contraste reduzido e rotação de 4 graus | 0/4 (0%) | Nenhuma sugestão; aviso para transcrição manual. |

As imagens foram renderizadas pelo PDF.js e processadas pelo mesmo caminho da tela do aplicativo. Tamanho da imagem de origem, reamostragem, fontes, compressão e segmentação afetam os resultados; uma imagem maior não garante maior acerto. Os valores ambíguos não foram corrigidos por suposição. Não houve gravação no Firebase ou transmissão do documento a uma API de IA.

## Correções motivadas pelos testes

- O motor às vezes separa cada coluna em um bloco. O leitor agora reúne os blocos que ocupam a mesma linha visual, preservando linhas que o motor já agrupou. Isso evita perder a associação entre data, descrição e valor em tabelas espaçadas.
- Ativada a correção de inclinação do próprio motor antes do reconhecimento. Não é garantia de recuperação de imagens tortas ou giradas em qualquer ângulo.
- A revisão informa quantos lançamentos selecionados têm data, valor ou tipo em branco. A geração continua bloqueada quando os dados são inválidos.
- Em até 600 pixels, campos têm fonte de 16 pixels e altura mínima de 44 pixels; caixas de seleção e seus rótulos têm áreas de interação maiores.

Dois testes novos cobrem colunas separadas e cabeçalhos com palavras em alturas diferentes. O teste real anterior do BB foi repetido com a correção de inclinação: **6/6 movimentações preservadas em data/valor/tipo**. Os testes sintéticos não substituem a revisão de extratos reais.

## Falhas e uso móvel

- Cancelar o OCR manteve uma descrição preenchida manualmente, exibiu o cancelamento e permitiu nova tentativa.
- Trocar o PDF durante a leitura descartou resultados tardios; permaneceram apenas os três registros do novo arquivo de teste, sem linhas do OCR anterior.
- Na imagem reduzida, marcar a conferência e tentar continuar gerou erro de campo obrigatório; nenhum resultado de importação foi produzido.
- Viewports de 320 × 740 e 390 × 844: campos dentro da área de revisão, sem estouro horizontal, controles editáveis e altura mínima verificada. A revisão do cenário inclinado gerou quatro registros válidos e o total esperado em 390 pixels.
- Esta é simulação de tamanho no navegador de desktop. Teclado virtual, memória, desempenho e comportamento de Safari/Chrome em aparelhos físicos **não foram validados**.

## Reprodução e verificações

No servidor de desenvolvimento, abra `/tests/fixtures/pdf-review.html` e use os botões Imagem nítida/reduzida/inclinada/muito degradada. As definições estão em `tests/fixtures/ocr-image-cases.js`; nenhum dado real foi incluído. O formulário de teste não acessa Firebase e não entra no build publicado.

**129 testes aprovados**, build aprovado e lint sem erros, com os cinco avisos anteriores. Cache e build foram gravados em pastas temporárias na C:, conforme solicitado. O atalho global `npm` do ambiente apontava para um `npm-cli.js` ausente durante a validação; testes e lint foram executados diretamente com Node e o build pela API local do Vite. Isso é uma pendência do ambiente Windows, não uma falha do código do OCR.

Próximo passo: piloto em celular físico e amostras anonimizadas de digitalizações reais. Nível recomendado: Alto. Contratos permanecem em 29% (2/7 etapas formais), pausados.
