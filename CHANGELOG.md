# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-25

### Added
- **Local-First Codebase Intelligence Engine**:
  - SQLite WAL mode database engine (`.codememory/codememory.db`) for high-throughput zero-blocking concurrent reads and serialized atomic writes.
  - Multi-language AST parser extracting classes, functions, interfaces, methods, type aliases, and import/export dependencies across TypeScript, JavaScript, Python, Rust, Go, SQL, and C/C++.
  - Real-time debounced file watcher with `.gitignore` compliance and sub-100ms incremental synchronization.
- **Model Context Protocol (MCP) Server**:
  - Full JSON-RPC 2.0 stdio MCP server for VS Code Copilot, Cursor AI, Claude Desktop, Antigravity, and custom agent sidecars.
  - Tools include `get_context`, `search_code`, `get_symbol`, `get_dependencies`, `get_history`, `get_skills`, and `get_commands`.
- **Change-Aware Relevance Ranker & Context Engine**:
  - Multi-factor scoring algorithm: $\text{Relevance} = 0.35 \times \text{Recency} + 0.30 \times \text{Proximity} + 0.25 \times \text{Semantic} + 0.10 \times \text{Hotspot}$.
  - Precision token budgeting preventing LLM context flooding.
- **Web-Based Interactive Architecture Explorer**:
  - Embedded local HTTP server (`127.0.0.1:3737`) serving real-time architecture visualizations.
  - Interactive flow graph and node grid with dependency arrows, status indicators, and hotspot badges.
  - Daily change timeline scrubber with change velocity logs and real-time Server-Sent Events (SSE).
  - Deep node inspection drawer with AST symbols, incoming callers, outgoing dependencies, and AI context slice playground.
- **VitePress-Grade Documentation Portal**:
  - Fast, responsive documentation site built with `@eldrex/cairnjs` v1.2.0.
  - Full-text search (`⌘K`), reading progress bar, Mermaid diagram rendering, and callout blocks.
  - Production documentation hosted at [https://codemem.vercel.app/](https://codemem.vercel.app/).
- **CLI Commands**:
  - `init`: Initialize repository and index AST symbols.
  - `scan`: Synchronously scan files.
  - `watch`: Start background file watcher.
  - `query`: Query symbols, callers, and dependencies.
  - `status`: Show repository metrics, git status, and hotspots.
  - `context`: Generate targeted change-aware AI context slice.
  - `web`: Launch the local Architecture Explorer & Web UI.
  - `mcp`: Launch the MCP stdio server.
  - `ide`: Generate IDE configurations for Cursor, VS Code, and Claude Desktop.
  - `diagram`: Render Mermaid architecture and class diagrams.
  - `export`: Export codebase map to JSON or GraphML.
  - `plugin`: Plugin management and lifecycle commands.
  - `skills`: Inspect project skill files, agent conventions, and extracted shell commands.
  - `clean`: Reset and clean SQLite database cache.
