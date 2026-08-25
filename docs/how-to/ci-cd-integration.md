# How to Run CodeMemory in GitHub Actions & CI/CD

## Continuous Architecture Indexing
You can run CodeMemory in your CI/CD pipeline to generate automated architecture diagrams, track change hotspots across pull requests, and enforce architectural boundaries.

---

## GitHub Actions Example Workflow

Create `.github/workflows/codememory.yml`:

```yaml
name: CodeMemory Architecture Analysis

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install CodeMemory
        run: npm install -g codememory

      - name: Scan & Index Codebase
        run: codememory scan

      - name: Generate Architecture Diagram
        run: codememory diagram --direction TD > architecture.md

      - name: Check Hotspots
        run: codememory status
```
