# Contributing to CodeMemory

Thank you for your interest in contributing to **CodeMemory** (`@eldrex/codememory`) — the local-first, AST-powered structural memory layer for AI coding assistants.

We welcome contributions from engineers, AI researchers, plugin authors, language parser contributors, and documentation writers.

---

## Engineering Philosophy

Every contribution to CodeMemory is held to these non-negotiable principles:

| Principle | What It Means |
| :--- | :--- |
| **Local-First, Zero Telemetry** | Never introduce outbound network calls, analytics, or cloud SDK dependencies into core engine operations |
| **Deterministic & Sub-100ms** | The context slicing engine must remain fast. Benchmark any change that touches the parser, ranker, or database layer |
| **Strict TypeScript** | All source code in `src/` is written in strict-mode TypeScript with explicit return types |
| **Test Coverage** | Every new feature or bug fix must include a corresponding Vitest test in `tests/` |

---

## Local Development Setup

### Prerequisites

- **Node.js:** v20.0.0+ (v22+ recommended)
- **Git:** 2.30+

### 1. Fork & Clone

```bash
# Fork via GitHub UI, then:
git clone https://github.com/<your-username>/CodeMemory.git
cd CodeMemory
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build & Verify

```bash
# Compile TypeScript to dist/
npm run build

# Run the full Vitest test suite (36 tests across 10 suites)
npm test

# Run tests in watch mode during development
npm run test:watch
```

### 4. Run the CLI Locally

```bash
# Run CLI commands directly via tsx (no build required)
npx tsx src/cli.ts status
npx tsx src/cli.ts scan .
npx tsx src/cli.ts web

# Or link globally for end-to-end testing
npm link
codememory status
```

---

## Codebase Structure

```
CodeMemory/
├── src/
│   ├── cli.ts              # Commander CLI entrypoint & all subcommands
│   ├── db/                 # SQLite WAL schema, migrations, prepared statements
│   ├── parser/             # Multi-language AST regex/symbol extractor
│   ├── watcher/            # Debounced Chokidar file event watcher
│   ├── context/            # Relevance ranking engine & token budget slicer
│   ├── mcp/                # Model Context Protocol stdio server & tool definitions
│   ├── plugins/            # Plugin lifecycle manager & manifest validator
│   ├── skills/             # SKILLS.md parser & agent convention extractor
│   └── web/                # Local interactive architecture web server
├── tests/                  # Vitest automated test suite
├── docs/                   # Product documentation markdown corpus
├── website/                # CairnJS-powered public docs & Web Explorer UI
├── ARCHITECTURE.md         # System data flow & domain boundary reference
└── SKILLS.md               # CodeMemory's own agent skill conventions
```

---

## Branching Strategy & Pull Requests

**Branch naming:**
```
feature/add-go-struct-parser
fix/sqlite-wal-lock-timeout
docs/update-mcp-tool-signatures
perf/reduce-context-slice-latency
```

**Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat(parser): add support for Rust enum and impl block extraction
fix(watcher): handle rapid sequential file rename events correctly
docs(cli): clarify --unified flag behavior in CLI reference
perf(context): reduce symbol ranking from O(n²) to O(n log n)
```

**PR Checklist before opening:**

- [ ] `npm run build` compiles with zero TypeScript errors
- [ ] `npm test` passes all 36 tests
- [ ] New functionality includes unit tests in `tests/`
- [ ] No outbound network calls introduced in `src/`
- [ ] No hardcoded absolute file paths or machine-specific values

---

## What We Welcome

- **New language parser support** (Kotlin, Swift, Java, C#, PHP)
- **Plugin API extensions** with backwards compatibility
- **Performance improvements** to the AST indexer or context ranker
- **Documentation fixes** and improved code examples
- **IDE integration guides** for new MCP-compatible editors
- **Bug reports** with clear reproduction steps

---

## Code of Conduct

All contributors are expected to follow our [Code of Conduct](./code-of-conduct.md). We maintain a respectful, inclusive engineering community.
