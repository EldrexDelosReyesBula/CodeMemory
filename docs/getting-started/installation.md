# Installation Guide

CodeMemory runs seamlessly on macOS, Linux, and Windows. You can execute it on demand with `npx` or install it globally via your preferred package manager.

---

> [!IMPORTANT]
> CodeMemory requires **Node.js v20.0.0** or higher. Node.js v22.x or v24.x is strongly recommended for optimized native SQLite support.

---

## 1. Instant Execution (No Installation Required)

You can run CodeMemory commands immediately in any repository root without installing:

```bash
npx @eldrex/codememory init
```

---

## 2. Global Installation

Install CodeMemory globally for instant access to the `codememory` CLI binary anywhere in your terminal:

```bash
# Using npm
npm install -g @eldrex/codememory

# Using pnpm
pnpm add -g @eldrex/codememory

# Using yarn
yarn global add @eldrex/codememory

# Using bun
bun add -g @eldrex/codememory
```

### Verify Global Installation
```bash
codememory --version
```

---

## 3. Local Development & Building from Source

To contribute or run CodeMemory from source:

```bash
# 1. Clone repository
git clone https://github.com/EldrexDelosReyesBula/CodeMemory.git
cd CodeMemory

# 2. Install dependencies
npm install

# 3. Build TypeScript binaries
npm run build

# 4. Run tests
npm test

# 5. Link executable for local testing
npm link
```

---

## System Requirements

| Requirement | Minimum | Recommended |
| :--- | :--- | :--- |
| **Node.js** | `v20.0.0` | `v22.x` / `v24.x` |
| **Operating System** | macOS, Linux, Windows (WSL / Native) | macOS (Apple Silicon), Ubuntu 22.04+, Win 11 |
| **Git** | `2.25+` | `2.40+` |
| **Disk Space** | ~50 MB per 100k lines of code | SSD storage recommended for large repos |

---

> [!TIP]
> After installing, head to the [Quick Start Guide](quick-start.md) to initialize your first project!
