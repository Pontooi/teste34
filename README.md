# 💧 DualDev — Academia de Programação Interativa

<p align="center">
  <img src="https://img.shields.io/badge/Status-Ativo-10b981?style=for-the-badge&logo=github" alt="Status" />
  <img src="https://img.shields.io/badge/Estética-Frutiger%20Aero-0284c7?style=for-the-badge" alt="Design" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-Vite-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Licen%C3%A7a-MIT-blue?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <strong>Aprenda Java, Python, JavaScript, HTML5 e CSS3 na prática com lições interativas, editor em tempo real, validador de desafios e gamificação completa.</strong>
</p>

---

## 📖 Sobre o Projeto

O **DualDev** é uma plataforma educacional desenvolvida para tornar o aprendizado de programação acessível, imersivo e livre de frustrações. Em vez de exigir configurações complexas de ambiente local (instalação de compiladores Java, Python, Node.js e extensões), o estudante escreve e executa código **diretamente no navegador**.

Projetado sob a estética **Frutiger Aero** — com vidros translúcidos (*Aero Glass*), botões esmaltados aquáticos (*Aqua Gloss*), tons relaxantes de ciano e água-marinha e atmosfera serena —, o DualDev oferece uma experiência visual aconchegante para longas jornadas de estudo.

---

## 🚀 Principais Recursos

### 1. 🎓 Trilhas de Aprendizagem Práticas
- **☕ Java:** Fundamentos da POO, anatomia da classe Java, o método essencial `public static void main`, métodos com parâmetros e retornos tipados, arrays de dados e laços de repetição.
- **🐍 Python:** Sintaxe concisa, controle de fluxo (`if`/`elif`/`else`), estruturas de listas, iterações com `for in` e `range()`, modularização com funções `def` e built-ins (`len`, `max`, `sum`).
- **⚡ JavaScript (ES6+):** Escopo moderno de variáveis (`let`/`const`), template literals, arrow functions, programação funcional com `.map()` e `.filter()` e desestruturação de objetos.
- **🌐 HTML5:** Estruturação semântica da Web, menus de navegação, formulários interativos acessíveis e hierarquia de tags.
- **🎨 CSS3:** Box Model, Flexbox, CSS Grid, tipografia, microinterações e transições fluidas.

---

### 2. ⚡ Editor com IntelliSense Estilo VS Code
- **Snippets de Autocompletar:** Digite abreviações e aperte `Tab` para gerar blocos inteiros instantaneamente:
  - `sout` + `Tab` ➔ `System.out.println("");`
  - `main` + `Tab` ➔ `public static void main(String[] args) { ... }`
  - `def` + `Tab` ➔ `def nome_funcao():`
  - `clg` + `Tab` ➔ `console.log();`
- **Menu Flutuante com Sugestões:** Sugestões inteligentes acionadas com `Ctrl + Espaço`.
- **Rascunho Automático:** Seu código nunca é perdido — cada exercício salva o progresso no navegador em tempo real.

---

### 3. 🧪 Validador Automatizado de Desafios
Cada lição possui critérios e testes automatizados. Ao clicar em **"Verificar Desafio"**, o sistema analisa o código fonte e a saída do terminal para comprovar se a lógica atende aos objetivos propostos, concedendo feedback imediato.

---

### 4. 🏆 Sistema de Gamificação
- **Pontos de Experiência (XP):** Conquistados a cada lição e desafio superado.
- **Níveis do Desenvolvedor:** Suba de nível conforme acumula XP.
- **Ofensiva Diária (Streak):** Mantenha o hábito de praticar todos os dias para acumular dias seguidos de estudo.
- **Missões Diárias:** Objetivos renovados periodicamente com bônus de XP.
- **Galeria de Conquistas:** Insígnias exclusivas desbloqueadas por marcos de aprendizado e dedicação.

---

### 5. 🌊 Design Frutiger Aero Autêntico
- **Superfícies de Vidro (*Aero Glass*):** Painéis translúcidos com reflexo especular superior.
- **Botões Esmaltados (*Aqua Pill Buttons*):** Efeito de relevo com clique tátil e brilho suave.
- **Modo Claro & Escuro:** Alterne entre o céu limpo (*Clear Sky*) e o abismo oceânico relaxante (*Deep Ocean*), ambos sem poluição visual.

---

## ⌨️ Atalhos de Teclado no Editor

| Atalho | Ação |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Executar o código no console |
| <kbd>Tab</kbd> ou <kbd>Enter</kbd> | Confirmar sugestão de código / Snippet |
| <kbd>Ctrl</kbd> + <kbd>Espaço</kbd> | Abrir menu de sugestões IntelliSense |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Navegar pelas sugestões |
| <kbd>Esc</kbd> | Fechar janela de sugestões |
| <kbd>Tab</kbd> *(sem sugestão)* | Indentar 4 espaços |

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) com tokens de vidro Frutiger Aero
- **Bundler & Dev Server:** [Vite](https://vitejs.dev/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Armazenamento:** Web LocalStorage com proteção anti-falha

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Gerenciador de pacotes `npm` ou `yarn`

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   cd SEU-REPOSITORIO
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   Abra [http://localhost:3000](http://localhost:3000) ou a porta indicada pelo terminal.

---

## 🚀 Como Publicar no GitHub Pages

O projeto já vem 100% preparado para ser publicado no GitHub Pages com 2 opções simples:

### Opção 1: GitHub Actions (Totalmente Automático)
1. No seu repositório no GitHub, acesse a aba **Settings** > **Pages**.
2. Em **Source**, selecione: **GitHub Actions**.
3. Vá em **Settings** > **Actions** > **General**, role até **Workflow permissions** e marque **Read and write permissions**.
4. Vá na aba **Actions** e acione o fluxo **Deploy to GitHub Pages**. Em ~1 minuto o site estará publicado com link oficial!

### Opção 2: Pelo Terminal com 1 Comando
Execute no terminal do seu computador:
```bash
npm run deploy
```
Esse comando compilará os arquivos de produção e criará a branch `gh-pages` automaticamente no seu GitHub.

---

## 📁 Estrutura de Pastas

```text
├── .github/workflows/
│   └── deploy.yml            # Automação de deploy contínuo no GitHub Pages
├── src/
│   ├── components/           # Componentes reutilizáveis (Editor, Navbar, Terminal, etc.)
│   ├── context/              # Gerenciador de estado global (DualDevContext)
│   ├── data/                 # Banco de lições, trilhas, missões e snippets
│   ├── pages/                # Páginas principais (Home, Academia, Playground, etc.)
│   ├── services/             # Interpretadores e simuladores de código em tempo real
│   ├── types/                # Definições de tipagem TypeScript
│   ├── App.tsx               # Componente raiz da aplicação
│   ├── index.css             # Estilos globais e tokens Frutiger Aero
│   └── main.tsx              # Ponto de entrada do React
├── index.html                # Ponto de montagem HTML com meta tags
├── package.json              # Dependências e scripts npm
├── tsconfig.json             # Configuração do TypeScript
└── vite.config.ts            # Configuração do Vite com base relativa
```

---

## 📄 Licença

Este projeto está sob a licença [MIT](./LICENSE). Sinta-se livre para usar, estudar, modificar e compartilhar!

---

<p align="center">
  Desenvolvido com carinho para entusiastas e aprendizes da programação. 🚀
</p>
