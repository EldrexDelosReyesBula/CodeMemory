# Model Context Protocol (MCP) Integration

CodeMemory provides a native **Model Context Protocol (MCP)** server over standard I/O, allowing AI assistants like **Claude Desktop**, **Cursor AI**, **VS Code Copilot**, and **Google Antigravity** to query your repository's symbol graph, change hotspots, and conventions automatically.

---

> [!NOTE]
> The Model Context Protocol is an open standard that enables AI models to safely interact with local developer tools and context engines.

---

## 1. Quick Automatic Configuration

CodeMemory can generate configuration files for all your installed IDEs automatically:

```bash
# Configure all detected IDEs
codememory ide init --all

# Or target specific editors:
codememory ide init --cursor
codememory ide init --vscode
codememory ide init --claude
```

---

## 2. Manual Configuration Examples

### Cursor AI (`.cursor/mcp.json`)
Add the following to `.cursor/mcp.json` in your repository root:

```json
{
  "mcpServers": {
    "codememory": {
      "command": "npx",
      "args": ["-y", "@eldrex/codememory", "mcp"]
    }
  }
}
```

---

### Claude Desktop (`claude_desktop_config.json`)
Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "codememory": {
      "command": "npx",
      "args": ["-y", "@eldrex/codememory", "mcp"],
      "env": {
        "CODEMEMORY_PROJECT_ROOT": "/path/to/your/project"
      }
    }
  }
}
```

---

### Google Antigravity & AI Agent Suites
Configure in `.gemini/config/mcp_config.json` or project MCP configuration:

```json
{
  "mcpServers": {
    "codememory": {
      "command": "npx",
      "args": ["@eldrex/codememory", "mcp"]
    }
  }
}
```

---

## Available MCP Tools

When connected, AI models gain access to the following tools:

| MCP Tool | Description |
| :--- | :--- |
| `codememory_context` | Retrieves change-aware context slice for the current task and focused files within token budget. |
| `codememory_query_symbols` | Searches AST symbols (functions, classes, interfaces) across all languages. |
| `codememory_dependencies` | Queries incoming callers or outgoing dependencies for a specific file. |
| `codememory_recent_changes` | Returns recent file modifications, diffs, and change history. |
| `codememory_hotspots` | Identifies high-churn, error-prone hotspot files. |

---

> [!TIP]
> Use `codememory_context` with a descriptive `--task` parameter to give your AI agent ultra-targeted context slices that fit neatly inside small LLM prompt windows.
