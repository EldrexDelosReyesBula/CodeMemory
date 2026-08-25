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
- **Cause**: Linux system `fs.inotify.max_user_watches` limit reached.
- **Solution**: Increase inotify limit:
  ```bash
  sudo sysctl fs.inotify.max_user_watches=524288
  sudo sysctl -p
  ```
