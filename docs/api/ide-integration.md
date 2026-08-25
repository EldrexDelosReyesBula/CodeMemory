# CodeMemory Local IDE Agent Integration Guide

## Overview
CodeMemory's Model Context Protocol (MCP) server runs as a lightweight subprocess on `stdio`, providing sub-100ms context access for local IDE agents.

---

## One-Line Setup

Generate MCP configuration files for your editor:

```bash
# Setup VS Code Copilot (.vscode/mcp.json)
codememory ide init vscode

# Setup Cursor AI (.cursor/mcp.json)
codememory ide init cursor

# Setup all detected IDEs
codememory ide init --all
```

---

## Dedicated IDE Agent MCP Tools

| Tool | Purpose |
| :--- | :--- |
| `get_file_context` | Returns symbols, dependencies, and changes for currently open active editor file. |
| `get_selection_context` | Returns symbols covering the line range selected by the developer. |
| `get_skills` | Queries project instructions from `SKILLS.md`. |
| `get_commands` | Returns task-relevant shell commands with safety checks. |
| `get_conventions` | Returns coding style guidelines and rules. |
| `get_incremental_updates` | Returns changes recorded since a given timestamp. |
| `get_context` | Returns full change-aware context payload with skills injection. |
