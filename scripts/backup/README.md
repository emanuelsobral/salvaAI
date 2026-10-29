# Backup dos dados do Firestore

Esta ferramenta de manutenção copia os documentos do Firestore para um arquivo criptografado e permite conferir sua recuperação em um emulador local. Ela roda no terminal, com o acesso administrativo já autorizado pela CLI Firebase. Não existe botão de backup no aplicativo.

A cópia inclui saldos, movimentações, cartões, faturas, contratos, parcelas, reajustes, pagamentos, marcadores de operações e de importação, além das demais coleções encontradas. Preserva IDs e tipos de dados, inclusive datas, inteiros grandes e subcoleções cujo documento pai não existe. Uma mesma data de leitura do servidor é usada durante toda a exportação.

O arquivo não inclui contas e senhas do Firebase Authentication, arquivos do Storage, PDFs originais, regras, índices, variáveis de ambiente ou o banco SQLite antigo. Esses componentes precisam de procedimentos próprios para uma recuperação completa do serviço. A ferramenta não restaura na nuvem.

Campos de data guardados pelo aplicativo são preservados. Os metadados internos `createTime` e `updateTime` do Firestore são gerados novamente na restauração.

## Criar a chave

Use Node 24 e instale as dependências do projeto. Crie duas pastas fora do repositório: uma para as cópias e outra para a chave. Os exemplos abaixo usam pastas na unidade C que você deve criar antes.

```powershell
npm run backup -- init-key --key-file C:/SalvaAI-chaves/firestore.key
```

A chave é aleatória, tem 32 bytes e é necessária para abrir qualquer arquivo criado com ela. No Windows, o acesso ao arquivo é restrito ao usuário que executou o comando; em outros sistemas, ele é criado com permissão 600. Um arquivo existente nunca é substituído.

Guarde uma segunda cópia da chave em local seguro, separado do computador dos backups. Perder a chave torna os arquivos inutilizáveis. Quem tiver a chave e o backup poderá ler os dados. Não envie a chave para o GitHub, conversas ou pastas compartilhadas.

## Exportar

Entre com a conta responsável pelo projeto. Troque `SEU_PROJETO_FIREBASE` pelo identificador correto.

```powershell
npx firebase login
npm run backup -- export --project SEU_PROJETO_FIREBASE --key-file C:/SalvaAI-chaves/firestore.key --out C:/SalvaAI-backups/firestore-2026-10-27.salvaai-backup
```

O comando só lê o Firestore. Ele usa a autenticação da CLI Firebase, inclusive a configuração escolhida por `XDG_CONFIG_HOME`, quando definida. Não coloque credenciais em argumentos do terminal.

A saída informa a quantidade de documentos e o resumo SHA-256 do conteúdo. **Se a quantidade for zero, a cópia está vazia:** confira o projeto antes de considerá-la um backup dos seus dados. Leituras da nuvem usam a cota do Firestore; não há ativação automática de plano pago ou agendamento de cópias.

O arquivo usa AES-256-GCM, com verificação de autenticidade. Nenhum JSON aberto é gravado no disco durante a exportação. Os limites desta versão são 5.000 caminhos de documentos, incluindo pais ausentes, e 64 MiB de conteúdo. Falhas de leitura, paginação ou limite impedem a conclusão do backup. Use nomes novos para cada cópia; arquivos existentes não são sobrescritos.

```powershell
npm run backup -- verify --key-file C:/SalvaAI-chaves/firestore.key --input C:/SalvaAI-backups/firestore-2026-10-27.salvaai-backup
```

Esse comando confere a chave, a autenticidade, o formato e a integridade. Ele não substitui o ensaio de restauração.

## Testar a recuperação local

Instale Java e inicie somente o emulador Firestore, com uma configuração fictícia:

```powershell
npx firebase emulators:start --only firestore --project demo-salva-ai
```

Em outro terminal, na pasta do projeto:

```powershell
$env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
npm run backup -- restore-local --project demo-salvaai-restore-20261027 --key-file C:/SalvaAI-chaves/firestore.key --input C:/SalvaAI-backups/firestore-2026-10-27.salvaai-backup
Remove-Item Env:FIRESTORE_EMULATOR_HOST
```

Escolha um identificador novo a cada tentativa, sempre começando com `demo-salvaai-restore-`. A ferramenta exige o endereço literal `127.0.0.1:PORTA`, recusa destinos ocupados e usa gravações que falham se o documento já existir. Ela não apaga nem sobrescreve dados para abrir espaço. Se houver uma falha parcial, os registros locais ficam disponíveis para diagnóstico; repita com outro identificador.

Depois de gravar, ela lê todos os documentos de volta e compara caminhos, campos, tipos, quantidades e saldos. Os serviços de pagamentos não são executados, portanto a restauração não debita os saldos novamente. Referências do Firestore para documentos do mesmo banco são ajustadas para o projeto local; referências para outros bancos são recusadas antes da gravação.

Os dados ficam legíveis na memória do emulador durante o ensaio. Faça a conferência em um computador de confiança, encerre o emulador ao terminar e não use opções de exportação automática do emulador para esses dados. Esse teste não recria logins nem confirma o funcionamento completo do aplicativo após um desastre.

## Verificações automatizadas

```powershell
npm test
npm run test:backup
```

Os testes incluem arquivo alterado, chave incorreta, paginação, destino ocupado, pais ausentes e recuperação de contratos, pagamentos e saldos fictícios. O teste de integração usa apenas o emulador.

As cópias com extensão `.salvaai-backup`, as chaves `.key` e a pasta `backups/` são ignoradas pelo Git. Além da cópia local, mantenha cópias protegidas em outro local e repita o ensaio periodicamente. Esta versão não automatiza frequência, retenção ou armazenamento externo.

Referências: [leitura em um instante fixo](https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/list) e [descoberta de coleções](https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/listCollectionIds).
