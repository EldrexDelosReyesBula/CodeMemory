# DevDiff Integration Guide

CodeMemory can be optionally paired with **DevDiff** to combine structural AST intelligence with change history and release note synthesis.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    OPTIONAL INTEGRATION                     │
│                                                             │
│  CodeMemory = Multi-language AST, caller graphs, SQL memory │
│  DevDiff    = Git diff parsing, changelog synthesis        │
│                                                             │
│  Together: Context slices with structural ground truth      │
└─────────────────────────────────────────────────────────────┘
```

- **CodeMemory is standalone**: If you do not use DevDiff, CodeMemory functions with 100% of its native capabilities without any extra dependencies.
- **Optional Plugin**: When DevDiff is present in your workflow, `@eldrex/plugin-codememory` enriches DevDiff's analysis context with real AST symbols and caller relationships before generating changelogs.

---

## Installation

To install the optional plugin:

```bash
npm install @eldrex/plugin-codememory
```

---

## CLI Utilities

CodeMemory includes commands for inspecting and synchronizing tracked repository files:

### 1. Synchronization Check
Compares Git-tracked repository files against the CodeMemory SQLite index:
```bash
npx codememory devdiff sync
```

### 2. File State Comparison
Displays any untracked or unindexed files across the workspace:
```bash
npx codememory devdiff compare
```

### 3. Caller Dependency Impact
Analyzes direct and indirect callers for specific files:
```bash
npx codememory devdiff impact src/cli.ts
```

### 4. File Change Summary
Displays recent change records and associated AST symbols:
```bash
npx codememory devdiff explain src/cli.ts
```

---

## Unified MCP Server

If you use AI coding agents (Claude Desktop, Cursor, Copilot) and want a single MCP endpoint that exposes both CodeMemory structural tools and DevDiff change analysis tools, run:

```bash
npx codememory mcp --unified
```

Or configure in your `.vscode/mcp.json` or `.cursor/mcp.json`:

```json
{
  "servers": {
    "codememory-unified": {
      "command": "npx",
      "args": ["@eldrex/codememory", "mcp", "--unified"]
    }
  }
}
```
