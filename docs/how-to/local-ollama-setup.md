# How to Configure Local Embeddings with Ollama

## Overview
CodeMemory features an optional local semantic embedding layer powered by Ollama. This enables natural-language semantic code search without sending any proprietary source code to third-party cloud AI providers.

---

## Prerequisites
1. Install [Ollama](https://ollama.com/) on your local machine:
   ```bash
   # macOS / Linux
   curl -fsSL https://ollama.com/install.sh | sh

   # Windows
   # Download installer from https://ollama.com/download/windows
   ```

2. Pull an embedding model:
   ```bash
   ollama pull nomic-embed-text
   ```

---

## Configuration

Edit or create `.codememory/config.json` in your repository root:

```json
{
  "semantic": {
    "enabled": true,
    "provider": "ollama",
    "model": "nomic-embed-text",
    "endpoint": "http://127.0.0.1:11434"
  }
}
```

---

## Indexing & Searching

### 1. Build Semantic Vector Cache
```bash
codememory scan --semantic
```

### 2. Perform Semantic Queries
```bash
codememory query --semantic "where do we validate Stripe webhook signatures?"
```

CodeMemory performs cosine similarity ranking directly over local embeddings in SQLite.
