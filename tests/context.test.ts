import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CodeMemoryDB } from '../src/db/database.js';
import { MermaidGenerator } from '../src/generator/mermaid.js';
import { CodebaseExporter } from '../src/generator/exporter.js';
import { ContextEngine } from '../src/context/ranker.js';

describe('Context, Diagram & Exporters', () => {
  let db: CodeMemoryDB;

  beforeEach(() => {
    db = new CodeMemoryDB({ inMemory: true });

    const fileA = db.upsertFile({
      path: 'src/core.ts',
      language: 'typescript',
      lastModified: Date.now(),
      sizeBytes: 1200,
      checksum: 'chk-core',
    });

    const fileB = db.upsertFile({
      path: 'src/utils.ts',
      language: 'typescript',
      lastModified: Date.now(),
      sizeBytes: 800,
      checksum: 'chk-utils',
    });

    const fileTest = db.upsertFile({
      path: 'tests/core.test.ts',
      language: 'typescript',
      lastModified: Date.now(),
      sizeBytes: 600,
      checksum: 'chk-test',
    });

    db.syncFileIntelligence(
      fileA,
      [
        {
          name: 'CoreEngine',
          kind: 'class',
          lineStart: 5,
          lineEnd: 50,
          signature: 'export class CoreEngine',
        },
      ],
      [
        {
          targetFileId: fileB,
          targetSymbolName: 'formatText',
          importPath: './utils.js',
          depType: 'import',
        },
      ]
    );

    db.syncFileIntelligence(
      fileB,
      [
        {
          name: 'formatText',
          kind: 'function',
          lineStart: 1,
          lineEnd: 10,
          signature: 'export function formatText(input: string): string',
        },
      ],
      []
    );

    // Record change events with same commit to test coupling detection
    db.recordChange({
      fileId: fileA,
      path: 'src/core.ts',
      timestamp: new Date().toISOString(),
      eventType: 'modified',
      commitHash: 'commit-1234',
      diffSummary: 'Updated CoreEngine logic',
      impactScore: 1.5,
    });

    db.recordChange({
      fileId: fileB,
      path: 'src/utils.ts',
      timestamp: new Date().toISOString(),
      eventType: 'modified',
      commitHash: 'commit-1234',
      diffSummary: 'Updated formatText helper',
      impactScore: 1.0,
    });
  });

  afterEach(() => {
    db.close();
  });

  it('should generate valid Mermaid architecture diagram', () => {
    const generator = new MermaidGenerator(db);
    const diagram = generator.generateArchitectureDiagram();

    expect(diagram).toContain('```mermaid');
    expect(diagram).toContain('graph TD');
    expect(diagram).toContain('src/core.ts');
    expect(diagram).toContain('src/utils.ts');
  });

  it('should export valid JSON and Markdown', () => {
    const exporter = new CodebaseExporter(db);
    const jsonStr = exporter.export('json');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.metrics.totalFiles).toBe(3);

    const mdStr = exporter.export('markdown');
    expect(mdStr).toContain('# Codebase Architecture & Intelligence Map');
    expect(mdStr).toContain('CoreEngine');
    expect(mdStr).toContain('formatText');
  });

  it('should compute change-aware context with dependencies and tests', () => {
    const engine = new ContextEngine(db);
    const result = engine.getContext({
      file: 'src/core.ts',
      tokenBudget: 1000,
    });

    expect(result.focus).toBe('src/core.ts');
    expect(result.direct_dependencies).toHaveLength(1);
    expect(result.direct_dependencies[0].symbol).toBe('formatText');
    expect(result.recent_changes).toHaveLength(2);
    expect(result.related_tests).toContain('tests/core.test.ts');
  });

  it('should detect top hotspots', () => {
    const hotspots = db.getHotspots(5);
    expect(hotspots.length).toBeGreaterThan(0);
    expect(hotspots[0].path).toBe('src/core.ts');
    expect(hotspots[0].changeCount).toBe(1);
  });

  it('should detect co-changing / coupling files across commits', () => {
    const coChanges = db.getCoChangingFiles('src/core.ts', 5);
    expect(coChanges).toHaveLength(1);
    expect(coChanges[0].path).toBe('src/utils.ts');
    expect(coChanges[0].coChangeCount).toBe(1);
  });
});
