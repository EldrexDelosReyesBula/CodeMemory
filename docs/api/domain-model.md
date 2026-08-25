# CodeMemory Domain Model & Persistence Specification

**Core Principle:** CodeMemory owns persistence. Plugins contribute through the domain model.

---

## 🏛️ Core Entities

| Entity | Purpose | Owner |
| :--- | :--- | :--- |
| `Repository` | Workspace root metadata and configuration | Core |
| `File` | File inventory, languages, checksums, sizes | Core |
| `Symbol` | Classes, functions, interfaces, methods, structs, enums | Core |
| `Dependency` | File-level and symbol-level imports/calls | Core |
| `Change` | Evolution log, commits, diff summaries, hotspots | Core |
| `Annotation` | Namespaced key-value metadata with confidence scores | Core / Plugins / Ollama |
| `Relationship` | Custom semantic relationships between entities | Core / Plugins |

---

## 🔒 Persistence Ownership Rules

1. **Core Owns Schema**: Only CodeMemory core creates, alters, or migrates SQLite tables.
2. **Core Owns Writes**: Direct writes to SQLite tables are prohibited for plugins; all data must flow through domain model validation methods.
3. **Namespacing by Default**: Every annotation and relationship records its `source` plugin identifier.
4. **Safe Removal**: Removing a plugin deletes only records where `source = <plugin_id>`, ensuring core entities are never corrupted.
