# Contributing to CodeMemory

Thank you for your interest in contributing to **CodeMemory** (`@eldrex/codememory`)! We welcome contributions from engineers, AI researchers, plugin authors, and open-source enthusiasts.

---

## 🌟 Philosophy & Guiding Principles

1. **Local-First & Zero Telemetry**: Never introduce network calls or analytics into core operations.
2. **Deterministic & Fast**: CodeMemory must be lightning fast (<100ms response time for context slicing).
3. **Type Safety & Testing**: Every PR must be written in strict TypeScript and include unit tests.

---

## 🛠️ Local Development Workflow

### 1. Prerequisites
- **Node.js**: v20.0.0 or higher (v22+ recommended)
- **Git**: 2.30+

### 2. Fork & Clone
\`\`\`bash
git clone https://github.com/<your-username>/CodeMemory.git
cd CodeMemory
\`\`\`

### 3. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 4. Build & Run Tests
\`\`\`bash
# Build TypeScript
npm run build

# Run Vitest test suite
npm test

# Run tests in watch mode
npm run test:watch
\`\`\`

### 5. Running the Local CLI
\`\`\`bash
# Run CLI via tsx
npx tsx src/cli.ts status

# Or link globally for testing
npm link
\`\`\`

---

## 🌿 Branching Strategy & Pull Requests

1. **Branch Naming**:
   - `feature/add-go-ast-parser`
   - `fix/sqlite-wal-locking`
   - `docs/update-ide-setup`
2. **Commit Messages**: Follow Conventional Commits:
   - `feat(parser): add support for Rust struct extraction`
   - `fix(watcher): handle rapid file rename events`
   - `docs(mcp): clarify stdio transport setup`
3. **Pull Request Checklist**:
   - [ ] All Vitest tests pass (`npm test`).
   - [ ] TypeScript compilation succeeds with zero errors (`npm run build`).
   - [ ] Code is formatted cleanly.
   - [ ] New features include relevant unit tests in `tests/`.

---

## 🏛️ Codebase Structure

\`\`\`
CodeMemory/
├── src/
│   ├── cli.ts            # Commander CLI entrypoint & subcommands
│   ├── db/               # SQLite WAL database layer & schema migrations
│   ├── parser/           # Multi-language AST regex/symbol extractor
│   ├── watcher/          # Debounced Chokidar file event watcher
│   ├── context/          # Relevance ranking engine & token budgeter
│   ├── mcp/              # Model Context Protocol stdio server
│   ├── plugins/          # Plugin lifecycle & manifest validator
│   ├── skills/           # SKILLS.md parser & convention extractor
│   └── web/              # Local interactive architecture visualizer
├── docs/                 # Documentation corpus (VitePress structure)
├── website/              # Zero-build CairnJS web visualizer & documentation UI
└── tests/                # Vitest automated test suite
\`\`\`

---

## 🤝 Code of Conduct

Please review our [Code of Conduct](./code-of-conduct.md) before participating in the community.
