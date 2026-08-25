# CodeMemory Plugin Development Guide

CodeMemory features an extensible plugin engine that allows developers to write modular analyzers, custom security scanners, AST linters, and external integrations on top of the local SQLite database.

> [!NOTE]
> The plugin API is actively evolving. While foundational hooks remain backward-compatible, new lifecycle capabilities and interfaces are being iterated on.

---

## 🔌 Plugin Manifest (`plugin.json` / `plugin.toml`)

```json
{
  "id": "security-scanner",
  "name": "Security Scanner",
  "version": "1.0.0",
  "apiVersion": "1.0",
  "hooks": {
    "on_file_parsed": true,
    "on_symbol_extracted": true,
    "on_dependency_detected": false,
    "on_change_recorded": false,
    "on_analysis_requested": true
  }
}
```

---

## 🎯 Lifecycle Hooks

```typescript
export interface CodeMemoryPlugin {
  manifest: PluginManifest;
  onLoad?(context: PluginContext): Promise<void> | void;
  onFileParsed?(context: PluginContext, file: FileRecord, parseResult: ParseResult): Promise<PluginContribution[] | void>;
  onSymbolExtracted?(context: PluginContext, symbol: SymbolRecord): Promise<PluginContribution[] | void>;
  onDependencyDetected?(context: PluginContext, dependency: DependencyRecord): Promise<PluginContribution[] | void>;
  onChangeRecorded?(context: PluginContext, change: ChangeRecord): Promise<PluginContribution[] | void>;
  onAnalysisRequested?(context: PluginContext, scope?: any): Promise<PluginContribution[] | void>;
}
```

---

## 📦 Contributing Annotations & Relationships

```typescript
return [
  {
    type: 'annotation',
    entityType: 'file',
    entityId: file.id,
    key: 'vulnerability_found',
    value: 'Hardcoded credentials on line 42',
    confidence: 0.95
  }
];
```
