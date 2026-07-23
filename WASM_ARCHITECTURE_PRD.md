# Product Requirements Document (PRD) Draft: Plataforma Web Droid

## 1. Visão Geral (Visão do Produto)
A **Plataforma Web Droid** será o destino final do repositório `droid`. O objetivo é criar um tutorial interativo de banco de dados diretamente no navegador, permitindo que estudantes escrevam código C, C++, Rust ou Zig (através de múltiplas linguagens) e vejam os resultados em tempo real. Toda a compilação, execução e testes ocorrerão localmente via **WebAssembly (Wasm)**, removendo a necessidade de infraestrutura pesada no backend e garantindo segurança e latência zero.

## 2. Objetivos e Metas
- **Serverless Execution**: Não haverá envio de código do usuário para servidores backend. Todo o ciclo de vida (compilação -> teste -> execução) acontecerá *client-side*.
- **Feedback Instantâneo**: A UI deverá fornecer resultados de testes e logs do AST instantaneamente após a digitação/submissão.
- **Ecossistema Multi-Linguagem**: O estudante escolhe a linguagem base (C, C++, Rust, Zig). A plataforma injeta os arquivos base e cuida da compilação de cada ferramenta para Wasm localmente.

## 3. Arquitetura WebAssembly

### 3.1. Compilação In-Browser
A conversão do código fonte do estudante (ex: C/C++) para WebAssembly será feita localmente usando ferramentas compiladas para a web, como:
- **C/C++**: Utilização do `clang-wasm` ou `webassembly/wasi-sdk` portados para rodar sobre a própria VM do navegador.
- **Rust/Zig**: Têm excelente suporte nativo para targets `wasm32-unknown-unknown` e `wasm32-wasi`.

### 3.2. Armazenamento em Disco (B-Tree & Pager)
Para suportar os estágios 5 ao 7 (B-Tree, Pager Cache, WAL), o código de banco de dados precisará fazer chamadas ao disco (`open`, `write`, `read`, `fsync`).
- **Solução Principal**: **OPFS (Origin Private File System)**. A API OPFS será usada para interceptar o VFS do WebAssembly, provendo acesso síncrono, persistente e de ultra-baixa latência (equivalente ao modelo usado pelo SQLite oficial para Web).
- O estudante escreverá código POSIX tradicional, e o runtime WASI do navegador se encarregará do mapeamento.

### 3.3. Interceptação de I/O (O REPL)
- A plataforma irá prover um terminal integrado (XTerm.js).
- Chamadas `printf` da AST ou `fgets` no REPL serão interceptadas via WASI e refletidas na interface gráfica.

## 4. O Novo Ecossistema de Testes (Reescrita)

Atualmente, os testes de integração do `droid` rodam em Python. Embora o Python possa rodar no navegador via *Pyodide*, para uma plataforma educacional de alta performance e fácil integração com o ecossistema Web, propõe-se **reescrever a engine de testes**.

**Alternativas de Linguagem para a Test Engine:**
1. **TypeScript / JavaScript (Recomendado)**:
   - *Por quê?* É a linguagem nativa do navegador. Pode interagir facilmente com o módulo WebAssembly gerado pelo usuário (instanciando a memória e chamando funções). O runner de testes pode validar as saídas capturadas pela interface.
2. **Rust (Compilado para Wasm)**:
   - *Por quê?* Se houver necessidade de uma suite de testes ultra-rápida, rígida e tipada. O Rust compila perfeitamente para Wasm e o binário de teste pode interagir com o binário do banco de dados na mesma memória.

**Mecânica dos Testes:**
- A nova suite de testes será orientada aos **mesmos artefatos MD** (ex: `STAGE2_LEXER_TEST_PLAN.md`).
- A cada submissão, o código é compilado. O script de teste (`test_runner.ts`) injeta as *queries* predefinidas e compara as saídas padrão (`stdout`) capturadas com a saída esperada (regex ou string exata).

## 5. Próximos Passos (Roadmap de Pesquisa)
- [ ] Construir Prova de Conceito (PoC) compilando um simples "Hello World" em C dentro do navegador (ex: usando `wasm-clang`).
- [ ] Validar a leitura e escrita síncrona de um arquivo de 4KB usando o OPFS.
- [ ] Criar o `Test Runner` em TypeScript que invoca um módulo `.wasm` customizado e lê sua saída.
- [ ] Desenhar o MVP da Interface (Monaco Editor + XTerm.js + Terminal de Testes).
