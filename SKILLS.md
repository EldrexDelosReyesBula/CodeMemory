# CodeMemory Project Skills & Agent Guidelines

## Description
CodeMemory is a local-first, persistent engineering context layer and codebase memory system for AI-assisted development.

## Commands
- `npm run build` — Build TypeScript to JavaScript in dist/
- `npm test` — Run all Vitest unit and integration test suites
- `node dist/cli.js scan` — Scan and index codebase symbols and dependencies
- `node dist/cli.js web` — Launch interactive architecture visualization server
- `node dist/cli.js context --task "fix payments"` — Generate change-aware context
- `node dist/cli.js ide init --all` — Generate IDE MCP configuration files

## Architecture
- `src/db/` — SQLite database persistence with WAL mode and domain model
- `src/parser/` — Code symbol/dependency extractors and Skills.md parser
- `src/watcher/` — Debounced file system watcher respecting .gitignore
- `src/context/` — Change-aware context ranker with token budget management
- `src/mcp/` — Model Context Protocol stdio server for IDE agents
- `src/web/` — Local HTTP REST & SSE streaming server
- `website/` — Interactive Architecture Explorer powered by `@eldrex/cairnjs`

## Conventions
- Always write pure TypeScript with strict types enabled
- Ensure SQLite schema changes are handled through non-destructive migrations
- Use `@eldrex/cairnjs` signals (`state`, `computed`) for all UI reactivity
- Keep MCP tool outputs well-structured in JSON format
- Maintain high test coverage for all core services
