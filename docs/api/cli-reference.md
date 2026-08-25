# CLI Command Reference

Comprehensive command-line interface documentation for `@eldrex/codememory`.

---

## Command Overview

| Command | Description | Common Flags |
| :--- | :--- | :--- |
| `codememory init` | Initializes `.codememory/` SQLite DB & indexer | `--force`, `--json` |
| `codememory scan` | Synchronously scans repo files & AST symbols | `--path <dir>`, `--quiet` |
| `codememory watch` | Starts real-time debounced file watcher | `--debounce <ms>` |
| `codememory query` | Searches symbols, callers, and dependencies | `--dependencies`, `--dependents` |
| `codememory status` | Displays codebase metrics & hotspot ranking | `--json` |
| `codememory context` | Builds change-aware AI context slice | `--task <str>`, `--budget <n>` |
| `codememory web` | Starts Architecture Explorer & Docs Portal | `--port <n>`, `--open` |
| `codememory mcp` | Runs stdio Model Context Protocol server | `--debug` |
| `codememory ide` | Configures IDE MCP integrations | `init --all`, `init --cursor` |
| `codememory diagram` | Renders Mermaid architecture diagrams | `--direction LR`, `--class-diagram` |
| `codememory export` | Exports codebase graph to JSON or GraphML | `--format json\|graphml` |
| `codememory plugin` | Manages extensible CodeMemory plugins | `list`, `enable`, `disable`, `remove` |
| `codememory clean` | Resets and cleans SQLite database cache | `--force` |

---

## Detailed Command Specifications

### `codememory init`
Creates the `.codememory/` directory, initializes `codememory.db` with SQLite WAL mode, and triggers an initial AST index of all recognized source files.
```bash
codememory init
```

---

### `codememory context`
Generates a change-aware context slice for AI coding assistants. Scores relevance using semantic AST matches, recent file modifications, and git hotspots within a specified token budget.
```bash
codememory context --task "Refactor checkout webhook" --budget 3500 --file src/api/webhook.ts
```

---

### `codememory query [term]`
Searches codebase symbols or inspects file relationships:
```bash
# Symbol search
codememory query "PaymentGateway"

# Dependencies (outgoing)
codememory query --dependencies src/services/PaymentService.ts

# Dependents (callers/incoming)
codememory query --dependents src/services/PaymentService.ts

# Historical changes
codememory query --history src/services/PaymentService.ts
```

---

### `codememory web`
Launches the embedded local web server serving the interactive Architecture Explorer, symbol graph, and VitePress documentation portal.
```bash
# Start on custom port and open browser
codememory web --port 4000 --open
```

---

### `codememory mcp`
Launches the official Model Context Protocol (MCP) server over standard I/O for Cursor, VS Code Copilot, Claude Desktop, Antigravity, and AI sidecars.
```bash
codememory mcp
```

---

> [!TIP]
> Run `codememory <command> --help` in your terminal for instant syntax help on any subcommand.
