# Privacy Policy & Local Data Sovereignty

**Last Updated:** August 2026  
**Effective Date:** August 25, 2026  
**Product:** CodeMemory (`@eldrex/codememory`)  
**Publisher:** Eldrex Delos Reyes Bula  

---

## 1. Core Commitment: 100% Local Autonomy

CodeMemory is engineered from the ground up on a **local-first, privacy-obsessed architecture**. We believe that source code is a developer's and organization's most critical intellectual property. Under no circumstances should toolchains silently siphon or transmit codebase intelligence to remote cloud servers.

---

## 2. Zero Telemetry & Zero Cloud Ingestion

1. **No Outbound Network Calls**: When you execute \`codememory init\`, \`codememory scan\`, \`codememory watch\`, or \`codememory mcp\`, the engine makes zero outbound network requests.
2. **No Analytics or Tracking**: CodeMemory contains no tracking beacons, Google Analytics, telemetry pings, crash reporting daemons, or user profiling code.
3. **No Code Uploads**: Your source code files, AST tokens, symbol graphs, file paths, commit messages, and project instructions are never uploaded to any remote server or cloud AI provider.

---

## 3. Data Storage & Local Persistence

All data collected or derived by CodeMemory is stored exclusively on your local machine:
- **Location**: \`.codememory/codememory.db\` inside your repository root.
- **Engine**: Local SQLite database operating in Write-Ahead Logging (WAL) mode.
- **Content**:
  - File metadata (paths, hashes, sizes, language detectors).
  - Extracted AST symbols (function signatures, classes, interfaces).
  - Structural dependency mappings (imports, calls, exports).
  - Local commit hashes and change frequency counters.
  - Namespaced plugin annotations.
- **De-initialization & Deletion**: You can permanently and completely remove all stored data at any time simply by deleting the \`.codememory/\` directory.

---

## 4. Local AI & Semantic Embedding Safety

CodeMemory supports optional semantic vector search:
- **Default Engine**: Local [Ollama](https://ollama.com/) instance operating on \`http://127.0.0.1:11434\`.
- **Privacy Guarantee**: Embeddings are computed strictly on your local CPU/GPU hardware. No prompts or code embeddings leave your local area network (LAN).
- **Opt-In Only**: Semantic indexing is completely disabled by default and requires explicit configuration in \`.codememory/config.json\`.

---

## 5. Model Context Protocol (MCP) Boundaries

When CodeMemory acts as an MCP server for AI agents (e.g. Cursor, VS Code Copilot, Claude Desktop, Antigravity):
- Communication occurs exclusively over standard input/output (\`stdio\`) or local Unix domain sockets on your machine.
- CodeMemory only provides context slices to the specific agent requesting them on your local system.
- CodeMemory does not manage, log, or transmit the LLM provider's responses.

---

## 6. Compliance & Auditing

Because CodeMemory does not collect, process, or store personal data on remote infrastructure:
- **GDPR & CCPA Compliant**: Zero personal data processing occurs outside the developer's workstation.
- **Air-Gapped Ready**: CodeMemory functions seamlessly in air-gapped, offline, and high-security enterprise environments.

---

## 7. Contact & Inquiries

If you have questions regarding this Privacy Policy, open an issue on GitHub or reach out to:
- **Repository**: [https://github.com/EldrexDelosReyesBula/CodeMemory](https://github.com/EldrexDelosReyesBula/CodeMemory)
- **Email**: privacy@codemem.dev
