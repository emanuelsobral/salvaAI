# Arquitetura e Estrutura do Projeto - AgentFinanceiro

> Documento histórico do legado. Inclui propostas que podem não corresponder aos arquivos implementados. Consulte o [índice atual](README.md) e a [comparação entre versões](evolucao-antigo-novo.md) para o estado revisado.

O projeto de Gerenciamento Financeiro Pessoal segue uma divisão clássica entre um Back-end robusto construído em Python e um Front-end intuitivo e dinâmico feito em HTML/CSS/JS puros.

## 📂 Estrutura de Diretórios Recomendada

```text
AgentFinanceiro/
│
├── backend/                       # Api em Python (Ex: FastAPI, Flask)
│   ├── app.py                     # Entrypoint da aplicação
│   ├── requirements.txt           # Dependências Python (Ex: uvloop, sqlalchemy, etc)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py              # Configurações de ambiente, JWT, Database URLs
│   │   └── financial_health.py    # Regras de negócios puras (Ex: farol de previsibilidade)
│   ├── models/
│   │   ├── __init__.py
│   │   └── db_models.py           # Modelos ORM do Banco de Dados / Entidades
│   ├── api/                       # Controladores (End-points RESTful)
│   │   ├── __init__.py
│   │   ├── routes_cards.py        # Rotas /cards, /cards/transactions
│   │   ├── routes_transactions.py # Rotas /transactions
│   │   └── routes_analytics.py    # Rotas para leitura de dados de Dashboard
│   └── services/
│       ├── __init__.py
│       └── import_service.py      # Lógica de processamento de arquivos OFX/CSV
│
├── frontend/                      # Interface Web Pura
│   ├── index.html                 # Main Dashboard
│   ├── login.html                 # Tela de Login/Auth
│   ├── css/
│   │   ├── global.css             # Resets e variáveis
│   │   ├── components.css         # Estilização de botões, modais, alertas
│   │   ├── layout.css             # Grid/Flexbox para o dashboard analítico
│   │   └── theme-dark.css         # Especificidades para o modo escuro nativo (Dark Mode)
│   ├── js/
│   │   ├── api.js                 # Wrapper puro (fetch API) para conexões com o back-end
│   │   ├── dashboard.js           # Construção e manipulação dos gráficos e DOM principal
│   │   ├── forms.js               # Validações, Envios (saídas, cartão) e manipuladores de evento
│   │   └── parser.js              # Interações/Preview de upload de CSV/OFX antes de enviar
│   └── assets/                    # Repositório de imagens e SVG's
│       └── icons/
│
└── database/
    └── schema.sql                 # Dump do esquema padrão do banco em SQL
```

---

## 🎨 Diretrizes de Interface (UI/UX)

Para que a experiência seja focada, objetiva e diminua a ansiedade do usuário ao lidar com dinheiro:

### 1. Sistema de Cores (Theming & Dark Mode)
- **Cores Semânticas:** Utilizar estritamente o código de cores para inputs do usuário e resultados. Verde `#2ecc71` (Entradas / Saldo Livre), Laranja `#e67e22` (Alerta do farol, Gastos se aproximando do teto), Vermelho `#e74c3c` (Dívida / Fechamento de Faturas).
- **Isolamento Cognitivo:** Entradas de `Benefícios (VR/VA)` ou `Caixinhas` devem possuir uma aba ou paleta levemente separada do painel principal (Ex: tons de Roxo ou Azul para benefícios e caixinhas) para que seja notório que aquele dinheiro **não deve ser misturado**.
- **Dark Mode Nativo:** Utilizar propriedades CSS customizadas (vars `--bg-color`, `--text-color`) controláveis preferencialmente por `@media (prefers-color-scheme: dark)` e um seletor manual na UI (Ex: um toggle no cabeçalho).

### 2. Dashboard Analítico
- **Progresso de Caixinhas:** Metas exigem estímulo. Uma barra de progresso horizontal clara (Ex: _"Reserva de Emergência: 60% concluído"_).
- **Projeção de Futuro (Farol):** Ao centro, de forma bem grande. O usuário precisa saber imediatamente se o mês que vem vai fechar confortavelmente. Ícones visuais (emoji de farol, ou cards coloridos de fundo) baseados na resposta do Back-end.
- **Gráficos:** Uso de bibliotecas de gráfico JS limpas (como Chart.js ou ApexCharts) integradas em cartões (cards) estéticos com *border-radius* suavizados e sutis *box-shadows*.

### 3. Registro e Previsibilidade
- **Botão Rápido de Ação (FAB - Floating Action Button):** Um botão grande e acessível no canto inferior/topo para adicionar novas despesas/receitas rapidamente, já com *selects* que destaquem as categorias e, vital, de onde o dinheiro está saindo (O usuário nunca pode esquecer de dizer se gastou do VR ou da Conta Geral).
- **Seção de Faturas de Cartão:** É necessário mostrar uma régua do tempo intuitiva que permita ver que os gastos foram empurrados para os meses futuros de faturas a vencer.
