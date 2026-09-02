# Privacy Policy & Local Data Sovereignty

**Last Updated:** September 2026
**Effective Date:** September 2, 2026
**Product:** CodeMemory v2.0.0 (`@eldrex/codememory`)
**Publisher:** Eldrex Delos Reyes Bula

---

## 1. Core Commitment: Your Code Never Leaves Your Machine

CodeMemory is built on a single, non-negotiable principle: **your source code is your intellectual property, and it stays on your machine.**

Every architectural decision in CodeMemory — from the local SQLite WAL storage engine to the loopback-only web server binding — exists to enforce this guarantee structurally, not just contractually.

---

## 2. Zero Telemetry. Zero Cloud Ingestion. Zero Exceptions.

When you run `codememory init`, `codememory scan`, `codememory watch`, or `codememory mcp`:

| What We Never Do | Details |
| :--- | :--- |
| **No outbound network calls** | The core engine makes zero HTTP/HTTPS requests during operation |
| **No analytics or tracking** | No telemetry beacons, GA pixels, crash reporters, or user profiling |
| **No code uploads** | Source files, AST tokens, symbol graphs, file paths, and commit metadata never leave your workstation |
| **No background daemons** | CodeMemory does not install persistent system services or background processes without your explicit `codememory watch` command |

---

## 3. What CodeMemory Stores & Where

All data derived from scanning your codebase is stored **exclusively** at:

```
<your-repo>/.codememory/codememory.db
```

This is a local SQLite database operating in Write-Ahead Logging (WAL) mode. The index contains:

- File metadata: paths, content hashes, sizes, detected languages
- Extracted AST symbols: function signatures, class definitions, interface declarations, imports
- Structural dependency mappings: call graphs, import edges, export surfaces
- Local commit hashes and change frequency counters (read from local git history only)
- Namespaced plugin annotations added by any installed CodeMemory plugins

**Complete Removal:** Delete the `.codememory/` directory at any time to permanently and completely purge all stored data. No cloud copies exist.

---

## 4. Local AI & Semantic Embedding Safety

CodeMemory supports optional semantic vector search for enhanced symbol retrieval:

- **Default Engine:** Local [Ollama](https://ollama.com/) running at `http://127.0.0.1:11434`
- **Privacy Guarantee:** All embeddings are computed exclusively on your local CPU/GPU. No prompts, code snippets, or vectors are transmitted to external APIs
- **Disabled by Default:** Semantic indexing requires explicit opt-in via `.codememory/config.json`. It is fully disabled in fresh installations

---

## 5. MCP Server Boundaries

When CodeMemory acts as a Model Context Protocol (MCP) server for AI coding agents (Cursor, Claude Desktop, VS Code Copilot, Antigravity):

- All communication occurs over **`stdio`** (standard input/output) or local Unix domain sockets on your machine
- CodeMemory serves only the context slices explicitly requested by the local agent process
- CodeMemory does not log, intercept, or transmit the AI provider's responses, API keys, or model outputs
- The local web visualizer (`codememory web`) binds exclusively to `127.0.0.1:3737` by default — inaccessible from the network without explicit opt-in

---

## 6. Public Documentation vs. Local Codebase Memory

| Surface | URL | Access to Your Code |
| :--- | :--- | :--- |
| **Public Documentation Portal** | `https://codemem.vercel.app/` | ❌ None. Static documentation only. |
| **Local Architecture Explorer** | `http://127.0.0.1:3737` | ✅ Reads your local `.codememory/codememory.db` only |
| **MCP Server** | `stdio` / local socket | ✅ Serves context slices to your local AI agent only |

---

## 7. Sharing Controls (100% Opt-In)

No codebase memory is shared with anyone by default. If you want to export architecture diagrams with a team:

```bash
# Export a static Mermaid diagram
codememory export --format mermaid > architecture.mmd

# Export a full AST map as JSON
codememory export --format json > codemap.json

# Optionally bind to a private LAN for team access (explicit opt-in)
codememory web --host 0.0.0.0 --port 3737
```

---

## 8. Compliance

Because CodeMemory processes no personal data on remote infrastructure:

- **GDPR & CCPA Compliant** — Zero personal data processing occurs outside the developer's local workstation
- **Air-Gapped Ready** — Works seamlessly in offline, air-gapped, and high-security enterprise environments
- **SOC 2 / Enterprise Ready** — No third-party data processors are involved in the data pipeline

---

## 9. Contact & Inquiries

Questions about this policy or local data governance?

- **GitHub Issues:** [https://github.com/EldrexDelosReyesBula/CodeMemory/issues](https://github.com/EldrexDelosReyesBula/CodeMemory/issues)
- **Email:** eldrexdelosreyesbula@gmail.com
