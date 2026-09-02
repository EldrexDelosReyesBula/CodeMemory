# Troubleshooting & Frequently Asked Questions

## Common Issues & Resolutions

### 1. Database Lock Errors (`SQLITE_BUSY`)
- **Cause**: Multiple processes attempting concurrent exclusive writes.
- **Solution**: CodeMemory enforces SQLite WAL (Write-Ahead Logging) mode. Verify that the database is located on a local filesystem (not a network NFS share).
  ```bash
  codememory status
  ```

---

### 2. High Memory Usage on Large Repositories
- **Cause**: Indexing massive generated files (`dist/`, `build/`, `node_modules/`, `target/`).
- **Solution**: Ensure your `.gitignore` or `.codememoryignore` ignores build artifacts:
  ```gitignore
  node_modules/
  dist/
  target/
  .git/
  ```

---

### 3. MCP Connection Timeout in IDE
- **Cause**: Executable path not found in editor environment `$PATH`.
- **Solution**: Use absolute path in `.vscode/mcp.json` or `.cursor/mcp.json`:
  ```json
  {
    "command": "node",
    "args": ["/usr/local/lib/node_modules/codememory/dist/cli.js", "mcp"]
  }
  ```

---

### 4. Watcher Not Picking Up File Changes
- **Cause**: Linux system `fs.inotify.max_user_watches` limit reached, or file ignored in `.gitignore`.
- **Solution**: Increase inotify limits:
  ```bash
  sudo sysctl fs.inotify.max_user_watches=524288
  sudo sysctl -p
  ```

---

### 5. Web Explorer Port Conflict (`EADDRINUSE: 3737`)
- **Cause**: Another instance of `codememory web` is already active in the background, or port 3737 is occupied.
- **Solution**: Specify an alternative port using `--port`:
  ```bash
  codememory web --port 4000 --open
  ```

---

### 6. Local vs. Hosted Docs & Sharing Codebase Graphs
- **Question**: Does the hosted website on Vercel show my repository architecture?
- **Answer**: No. `https://codemem.vercel.app` is strictly the static documentation hub with zero telemetry or codebase access.
- **Question**: How do I view my local architecture?
- **Answer**: Run `codememory web` in your project folder, which launches the local visualizer on `http://127.0.0.1:3737`.
- **Question**: How can I share architecture graphs with team members?
- **Answer**: Export a standalone Mermaid diagram or complete JSON AST map:
  ```bash
  # Export Mermaid flowchart
  codememory export --format mermaid > architecture.mmd

  # Export complete AST JSON map
  codememory export --format json > codemap.json
  ```
  Or optionally bind to your private LAN (`codememory web --host 0.0.0.0 --port 3737`).
