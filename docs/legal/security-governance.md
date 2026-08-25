# Security & Governance Policy

**Version:** 1.0.0  
**Effective Date:** August 25, 2026  
**Product:** CodeMemory (`@eldrex/codememory`)  

---

## 1. Security Architecture & Threat Model

CodeMemory is architected with a defense-in-depth posture tailored for local development environments and multi-agent AI ecosystems:

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                      IDE AI Agent                       │
│        (VS Code Copilot, Cursor, Claude Desktop)        │
└──────────────────────────┬──────────────────────────────┘
                           │ Stdio / JSON-RPC
┌──────────────────────────▼──────────────────────────────┐
│                CodeMemory MCP Gateway                   │
│           (Schema Validation & Token Limiter)           │
├──────────────────────────┬──────────────────────────────┤
│    AST Parser Engine     │    Relevance Ranker          │
│   (Secret Redaction)     │   (Budget Enforcement)       │
├──────────────────────────┴──────────────────────────────┤
│               SQLite WAL Storage Layer                  │
│       (Parameterized Queries, Zero Cloud Sync)          │
└─────────────────────────────────────────────────────────┘
\`\`\`

---

## 2. AST Secret Redaction & Token Sanitization

To protect sensitive credentials from inadvertent exposure to AI models:
- **Automatic Secret Masking**: When parsing source files or configuration strings, common API keys (e.g. AWS credentials, OpenAI keys, Stripe secret keys, GitHub Personal Access Tokens, JWTs, and private keys) are automatically redacted prior to generating symbol metadata.
- **Gitignore Compliance**: The AST scanner and file watcher automatically honor root and nested \`.gitignore\` files, ensuring \`.env\`, \`*.pem\`, \`*.key\`, and build artifacts are never scanned or persisted into the index.

---

## 3. Database Integrity & Persistence Boundaries

- **Single Core Ownership**: Only the CodeMemory core binary owns the SQLite schema and direct write operations. Plugins and external tools may only query or append annotations through validated, type-safe API boundaries.
- **SQL Injection Defense**: 100% of SQLite database transactions utilize parameterized prepared statements (\`db.prepare()\`). No dynamic string concatenation is permitted in SQL queries.
- **WAL Concurrency**: SQLite Write-Ahead Logging (WAL) ensures atomic, crash-resilient reads and writes across concurrent CLI commands and watcher processes.

---

## 4. MCP Tool Execution Safety & Approval Flags

CodeMemory's MCP server exposes structured tool definitions with explicit safety guarantees:
- **Read-Only Context Tools**: Tools like \`get_context\`, \`search_code\`, \`get_symbol\`, and \`get_dependencies\` are strictly read-only and generate zero side effects on the filesystem.
- **Extracted Command Safety**: Commands parsed from \`SKILLS.md\` are classified with explicit \`safe: true | false\` attributes so that AI agents are forced to request human approval before executing non-idempotent terminal actions.

---

## 5. Vulnerability Disclosure & SLA

We take security vulnerabilities seriously and appreciate responsible disclosure.

### How to Report a Vulnerability
- **Do NOT create a public GitHub issue.**
- Send details of the vulnerability to: **security@codemem.dev** (or submit a private security advisory via GitHub).
- Include:
  - Description of the vulnerability.
  - Steps to reproduce or proof-of-concept code.
  - Affected versions and operating system details.

### Response Timeline Commitments
- **Initial Acknowledgment**: Within 24 hours.
- **Triage & Severity Assessment**: Within 48 hours.
- **Patch & Advisory Release**: Critical vulnerabilities patched within 5 business days.

---

## 6. Dependency & Supply Chain Auditing

- **Minimal Dependencies**: The production CLI engine relies only on audited, standard libraries.
- **Automated CI Audits**: Continuous \`npm audit\` and Dependabot security monitoring on every release.
