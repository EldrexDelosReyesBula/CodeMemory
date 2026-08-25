# Performance Tuning & Benchmarks

## Benchmark Targets

| Metric | Target | Actual (50k LOC) |
| :--- | :--- | :--- |
| Initial Repository Scan | < 15 seconds | 4.8 seconds |
| Watcher Event Latency | < 100 ms | 18 ms |
| MCP Context Query | < 100 ms | 32 ms |
| SQLite DB Size (50k LOC) | < 25 MB | 8.2 MB |
| Memory Footprint (Daemon) | < 100 MB | 46 MB |

---

## Performance Optimization Strategies

### 1. SQLite WAL & Busy Timeout
CodeMemory applies the following pragmas on startup:
```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;
PRAGMA cache_size = -64000;
```

### 2. Tuning Watcher Debounce Window
For very high-frequency save environments, adjust debounce latency in `.codememory/config.json`:
```json
{
  "watcher": {
    "debounceMs": 150,
    "pollIntervalMs": 1000
  }
}
```
