# Quick Start Guide

Welcome to **CodeMemory** — the persistent, change-aware intelligence layer for codebases and AI coding assistants. In under 5 minutes, you can initialize your repository, query codebase structure, and connect your favorite AI IDE agent via MCP.

---

> [!NOTE]
> CodeMemory operates 100% locally. All symbol tables, caller graphs, and file histories are stored directly in your repository root under `.codememory/codememory.db` using high-performance SQLite WAL mode.

---

## Step 1: Initialize Your Codebase

Run the `init` command in your repository root:

```bash
# Using npx (zero installation)
npx @eldrex/codememory init

# Or if installed globally
codememory init
```

### What happens during initialization?
1. Scans all source files across TypeScript, JavaScript, Python, Rust, Go, SQL, and C++.
2. Extracts classes, methods, functions, interfaces, type aliases, and import/export dependency graphs.
3. Automatically identifies your `.git` history and computes file change hotspots.
4. Generates `.codememory/codememory.db` and updates `.gitignore`.

---

## Step 2: Query Structural Knowledge

Search for any symbol, function, or class across your entire codebase:

```bash
# Search for an authentication service
codememory query "AuthService"

# Inspect outgoing dependencies of a file
codememory query --dependencies src/services/AuthService.ts

# Inspect incoming callers (dependents) of a file
codememory query --dependents src/services/AuthService.ts
```

> [!TIP]
> Use `codememory status` at any time to get a quick summary of dirty files, recent change velocity, and top hotspot files in your repository.

---

## Step 3: Keep Context Synchronized in Real Time

Start the continuous file watcher while you work. Whenever you save a file, CodeMemory automatically synchronizes symbol tables and updates caller graphs in sub-100ms:

```bash
codememory watch
```

---

## Step 4: Connect AI Agents via MCP

Launch the native **Model Context Protocol (MCP)** server over stdio for Cursor, VS Code Copilot, Claude Desktop, Antigravity, or custom agent sidecars:

```bash
codememory mcp
```

Or generate instant one-click configuration files for all supported IDEs:

```bash
codememory ide init --all
```

---

## Step 5: Launch the Architecture Web Explorer

Inspect interactive dependency diagrams, symbols, change timelines, and full documentation directly in your browser:

```bash
codememory web --open
```

Visit [http://localhost:3737](http://localhost:3737) to explore your codebase visually!
