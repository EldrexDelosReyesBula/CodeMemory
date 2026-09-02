# CLI Command Reference

Comprehensive command-line interface documentation for `@eldrex/codememory`.

---

## Command Overview

| Command | Description | Common Flags |
| :--- | :--- | :--- |
| `codememory init` | Initializes `.codememory/` SQLite DB & indexer | `--force`, `--json` |
| `codememory scan` | Synchronously scans repo files & AST symbols | `--path <dir>`, `--quiet`, `--force` |
| `codememory watch` | Starts real-time debounced file watcher | `--debounce <ms>`, `--quiet` |
| `codememory query` | Searches symbols, callers, and dependencies | `--dependencies`, `--dependents`, `--history` |
| `codememory status` | Displays codebase metrics & hotspot ranking | `--json` |
| `codememory context` | Builds change-aware AI context slice | `--task <str>`, `--budget <n>`, `--file <path>` |
| `codememory web` | Starts Architecture Explorer & Docs Portal | `--port <n>`, `--host <addr>`, `--open`, `--mode <auto\|manual>`, `--daemon` |
| `codememory mcp` | Runs stdio Model Context Protocol server | `--debug`, `--unified` |
| `codememory ide` | Configures IDE MCP integrations | `init --all`, `init --cursor`, `init --vscode`, `init --claude` |
| `codememory diagram` | Renders Mermaid architecture diagrams | `--direction <LR\|TD>`, `--class-diagram` |
| `codememory export` | Exports codebase graph to JSON, Mermaid, or GraphML | `--format <json\|mermaid\|graphml>` |
| `codememory devdiff` | DevDiff git-synchronization and caller impact analysis | `sync`, `compare`, `impact <file>`, `explain <file>` |
| `codememory plugin` | Manages extensible CodeMemory plugins | `list`, `enable <id>`, `disable <id>`, `remove <id>` |
| `codememory skills` | Parses and indexes project agent skill conventions | `--json`, `--commands` |
| `codememory clean` | Resets and cleans SQLite database cache | `--force` |

---

## Detailed Command Specifications

### `codememory init`
Creates the `.codememory/` directory, initializes `codememory.db` with SQLite WAL mode, and triggers an initial AST index of all recognized source files.
```bash
# Standard initialization
codememory init

# Force clean re-initialization
codememory init --force
```

---

### `codememory watch`
Starts the real-time background file watcher. Monitors file creates, updates, and deletes with 100ms debouncing and `.gitignore` compliance.
```bash
# Standard watcher
codememory watch

# Watch with custom debounce window and quiet daemon output
codememory watch --debounce 150 --quiet
```

---

### `codememory web`
Launches the embedded local web server serving the interactive Architecture Explorer, symbol graph, and documentation hub.
```bash
# Start and automatically open browser
codememory web --open

# Start with explicit launch mode (auto vs manual)
codememory web --mode auto
codememory web --mode manual

# Start in background daemon mode on a custom port
codememory web --port 4000 --daemon

# Optional LAN sharing (opt-in for team intranet access)
codememory web --host 0.0.0.0 --port 3737
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

# Dependencies (outgoing imports)
codememory query --dependencies src/services/PaymentService.ts

# Dependents (callers/incoming consumers)
codememory query --dependents src/services/PaymentService.ts

# Historical modifications & commit log
codememory query --history src/services/PaymentService.ts
```

---

### `codememory mcp`
Launches the official Model Context Protocol (MCP) server over standard I/O for Cursor, VS Code Copilot, Claude Desktop, Antigravity, and AI sidecars.
```bash
# Standard stdio MCP transport
codememory mcp

# Unified MCP server (CodeMemory + DevDiff combined tools)
codememory mcp --unified
```

---

### `codememory devdiff`
Integrates with DevDiff for AST-informed git diff analysis and caller impact tracing:
```bash
# Verify synchronization between Git index and CodeMemory DB
codememory devdiff sync

# List untracked or unindexed workspace files
codememory devdiff compare

# Analyze direct and indirect blast radius for a modified file
codememory devdiff impact src/cli.ts

# Explain AST changes and symbol diffs
codememory devdiff explain src/cli.ts
```

---

### `codememory export`
Exports codebase graph data for external consumption, offline documentation, or CI pipelines:
```bash
# Export Mermaid diagram
codememory export --format mermaid > architecture.mmd

# Export AST JSON map
codememory export --format json > codemap.json

# Export GraphML XML
codememory export --format graphml > codemap.graphml
```

---

> [!TIP]
> Run `codememory <command> --help` in your terminal for instant syntax help on any subcommand.
