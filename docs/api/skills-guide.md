# CodeMemory Skills.md & Agent Instructions Guide

## Overview
CodeMemory indexes project-level agent instruction files (`SKILLS.md`, `AGENTS.md`, `CLAUDE.md`, `CURSOR.md`, `.cursorrules`, `COPILOT.md`, `GEMINI.md`) as first-class domain entities.

---

## Supported Files & Priorities

| Filename | Tool/Agent Target | Precedence |
| :--- | :--- | :--- |
| `SKILLS.md` | Cross-tool / Generic | High |
| `AGENTS.md` | Cross-tool / Generic | High |
| `CLAUDE.md` | Claude Desktop / Anthropic | High |
| `CURSOR.md` | Cursor AI | Medium |
| `.cursorrules` | Cursor (legacy) | Low |
| `COPILOT.md` | GitHub Copilot | Medium |
| `.github/copilot-instructions.md` | GitHub Copilot | Medium |
| `GEMINI.md` | Google Gemini | Low |

---

## Structured Parsing & Command Safety

When indexing a skills file, CodeMemory extracts:
- **Sections**: `#`, `##`, `###` headings and section content.
- **Commands**: Backtick and code-block shell commands.
- **Safety Flags**: Evaluates read-only/build commands (`npm test`, `cargo check`) as `safe: true`, while destructive actions (`rm -rf`) are marked as `safe: false, requires_approval: true`.
- **Conventions & Rules**: Coding guidelines and constraints.

---

## CLI Inspection

```bash
# List all detected skill files and sections
codememory skills list

# List extracted commands with safety tags
codememory skills commands

# Show coding conventions
codememory skills conventions
```
