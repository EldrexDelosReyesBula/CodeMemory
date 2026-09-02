# Security & Governance Policy

**Version:** 2.0.0
**Effective Date:** September 2, 2026
**Product:** CodeMemory (`@eldrex/codememory`)
**Publisher:** Eldrex Delos Reyes Bula

---

## 1. Security Architecture

CodeMemory is designed with a defense-in-depth posture for local development environments and multi-agent AI pipelines. The full data flow across all security boundaries:

```
┌──────────────────────────────────────────────────────────┐
│                     IDE AI Agent                         │
│     (Cursor AI, VS Code Copilot, Claude Desktop,         │
│      Antigravity, or any MCP-compatible client)          │
└─────────────────────┬────────────────────────────────────┘
                      │  stdio / JSON-RPC 2.0
┌─────────────────────▼────────────────────────────────────┐
│              CodeMemory MCP Gateway                      │
│        (Schema Validation · Token Budget Limiter)        │
├─────────────────────┬────────────────────────────────────┤
│   AST Parser Engine │   Relevance Ranking Engine         │
│  (Secret Redaction) │   (Context Budget Enforcement)     │
├─────────────────────┴────────────────────────────────────┤
│              SQLite WAL Persistence Layer                │
│    (Parameterized Queries · Zero Network Egress)         │
└──────────────────────────────────────────────────────────┘
```

**Threat surfaces actively mitigated:**
- Credential leakage from source files to AI model context
- SQL injection via dynamic query construction
- Unauthorized network exfiltration of codebase data
- Cross-process database corruption under concurrent access

---

## 2. AST Secret Redaction

Before any symbol metadata is stored or served to an AI agent, CodeMemory's parser applies automatic secret redaction:

**Patterns actively masked:**
- AWS Access Key IDs and Secret Access Keys (`AKIA...`)
- OpenAI, Anthropic, and other LLM provider API keys
- Stripe live and test secret keys (`sk_live_*`, `sk_test_*`)
- GitHub Personal Access Tokens (`ghp_*`, `github_pat_*`)
- Generic Bearer tokens and Authorization headers in source strings
- PEM-encoded private keys and certificate blocks
- JWTs encoded in configuration files

**Gitignore Compliance:** The AST scanner and file watcher automatically respect root and nested `.gitignore` files, excluding `.env`, `*.pem`, `*.key`, `*.p12`, build artifacts, and `node_modules` from ever being scanned or indexed.

---

## 3. Database Integrity & Persistence Boundaries

| Control | Implementation |
| :--- | :--- |
| **Schema Ownership** | Only the CodeMemory core binary owns the SQLite schema and performs write operations. Plugins annotate through validated API boundaries only |
| **SQL Injection Defense** | 100% of database operations use parameterized prepared statements (`db.prepare()`). Zero dynamic string interpolation in SQL |
| **WAL Concurrency** | SQLite Write-Ahead Logging ensures atomic, crash-resilient reads/writes across concurrent CLI and watcher processes |
| **Exclusive Local Binding** | The web server and MCP server bind to `127.0.0.1` only. No unintended network exposure |

---

## 4. MCP Tool Execution Safety

CodeMemory's MCP server exposes structured tool definitions with explicit execution safety classifications:

**Read-Only Tools (zero filesystem side effects):**
- `codememory_get_context` — returns relevance-ranked symbol slices
- `codememory_search_code` — full-text and AST symbol search
- `codememory_get_symbol` — returns symbol definition, callers, and callees
- `codememory_get_dependencies` — file dependency graph query
- `codememory_get_skills` — reads SKILLS.md conventions

**Agent-Approval Required (non-idempotent):**
- Any commands extracted from `SKILLS.md` are classified with explicit `safe: true | false` flags. AI agents are instructed to request human confirmation before executing `safe: false` terminal operations.

---

## 5. Vulnerability Disclosure

We take security seriously. If you discover a vulnerability in CodeMemory, please follow responsible disclosure:

**Report to:**
- **Private:** Email **eldrexdelosreyesbula@gmail.com** with subject `[SECURITY] CodeMemory Vulnerability`
- **GitHub:** Submit a [private security advisory](https://github.com/EldrexDelosReyesBula/CodeMemory/security/advisories/new)
- **Do NOT** open a public GitHub Issue for security vulnerabilities

**What to include:**
- Clear description of the vulnerability and its potential impact
- Steps to reproduce or a minimal proof-of-concept
- Affected versions and operating system / Node.js version details

**Response SLA:**

| Stage | Commitment |
| :--- | :--- |
| Initial Acknowledgment | Within 24 hours |
| Triage & Severity Assessment | Within 48 hours |
| Patch & Advisory Release | Critical CVEs within 5 business days |
| Public Disclosure | After patch is published |

---

## 6. Dependency & Supply Chain Auditing

- **Minimal Production Dependencies:** The core CLI engine relies exclusively on audited, well-maintained libraries (`better-sqlite3`, `chokidar`, `commander`, `tsx`)
- **Zero Transitive Cloud SDKs:** No AWS, GCP, Azure, or telemetry SDKs are present in the production bundle
- **Continuous CI Audits:** `npm audit` is run automatically on every pull request via GitHub Actions
- **npm Pack Verification:** The published npm package is verified with `npm pack --dry-run` before each release to confirm only `dist/`, `website/`, `README.md`, and `LICENSE` are bundled
