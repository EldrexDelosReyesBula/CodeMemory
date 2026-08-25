# How to Connect VS Code, Cursor AI, and Claude Desktop

## Overview
CodeMemory's Model Context Protocol (MCP) server runs over `stdio`, enabling zero-configuration integration with all major AI-assisted coding editors.

---

## 1. Automated Setup (Recommended)
Run inside your workspace root:

```bash
# Auto-detect and generate configuration files for all installed IDEs
codememory ide init --all
```

---

## 2. Manual Configuration

### VS Code Copilot (`.vscode/mcp.json`)
```json
{
  "mcpServers": {
    "codememory": {
      "command": "codememory",
      "args": ["mcp"]
    }
  }
}
```

### Cursor AI (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "codememory": {
      "command": "codememory",
      "args": ["mcp"]
    }
  }
}
```

### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "codememory": {
      "command": "codememory",
      "args": ["mcp"],
      "env": {
        "CODEMEMORY_PROJECT_ROOT": "/path/to/your/project"
      }
    }
  }
}
```

---

## 3. Verification
In your editor's chat window, type:
```
@codememory get_architecture
```
If configured properly, CodeMemory will return the structural graph of your active repository.
