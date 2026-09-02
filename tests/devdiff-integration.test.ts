import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DevDiffDevTools } from '@eldrex/plugin-sdk';
import { CodeMemoryPlugin } from '../packages/plugin-codememory/src/index.js';
import { CodeMemoryBridge } from '../src/devdiff/bridge.js';
import { CodeMemoryDB } from '../src/db/database.js';
import { UnifiedMCPServer } from '../src/mcp/unified.js';

describe('DevDiff × CodeMemory Integration Suite', () => {
  let tempDbPath: string;
  let db: CodeMemoryDB;

  beforeEach(() => {
    tempDbPath = path.join(process.cwd(), `.test-devdiff-db-${Date.now()}.sqlite`);
    db = new CodeMemoryDB(tempDbPath);
    CodeMemoryBridge.setLocalDatabase(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(tempDbPath)) {
      try {
        fs.unlinkSync(tempDbPath);
      } catch {}
    }
  });

  it('should validate CodeMemoryPlugin against DevDiff SDK specification', () => {
    const validation = DevDiffDevTools.validatePlugin(CodeMemoryPlugin);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should run CodeMemoryPlugin through DevDiff test harness', async () => {
    const harness = DevDiffDevTools.createTestHarness(CodeMemoryPlugin);
    await harness.activate();

    const sampleDiff = DevDiffDevTools.mockDiff({
      filePaths: ['src/services/PaymentService.ts'],
    });
    const sampleContext = DevDiffDevTools.mockContext({
      files: ['src/services/PaymentService.ts'],
    });

    db.upsertFile({
      path: 'src/services/PaymentService.ts',
      language: 'typescript',
      lastModified: Date.now(),
      sizeBytes: 1024,
      checksum: 'sha123',
    });

    const enrichedDiff = await harness.runBeforeAnalysis(sampleDiff, sampleContext);
    expect(enrichedDiff).toBeDefined();
    expect((sampleContext as any).codeMemory).toBeDefined();
    expect((sampleContext as any).codeMemory.structuralContext).toBeDefined();

    const sampleChangelog = DevDiffDevTools.mockChangelog('Updated payment service');
    const processedChangelog = await harness.runAfterAnalysis(sampleChangelog);
    expect(processedChangelog).toBeDefined();

    await harness.deactivate();
  });

  it('should compute dependent callers via CodeMemoryBridge', async () => {
    const targetId = db.upsertFile({
      path: 'src/core/Engine.ts',
      language: 'typescript',
      lastModified: Date.now(),
      sizeBytes: 2048,
      checksum: 'shaCore',
    });

    const callerId = db.upsertFile({
      path: 'src/main.ts',
      language: 'typescript',
      lastModified: Date.now(),
      sizeBytes: 512,
      checksum: 'shaMain',
    });

    db.syncFileIntelligence(callerId, [], [
      {
        targetFileId: targetId,
        targetSymbolName: 'Engine',
        importPath: './core/Engine',
        depType: 'import',
      },
    ]);

    const impacts = await CodeMemoryBridge.analyzeImpact(['src/core/Engine.ts']);
    expect(impacts).toHaveLength(1);
    expect(impacts[0].file).toBe('src/core/Engine.ts');
    expect(impacts[0].dependentCount).toBe(1);
    expect(impacts[0].directDependents[0].path).toBe('src/main.ts');
  });

  it('should perform memory synchronization and comparison', async () => {
    db.upsertFile({
      path: 'src/index.ts',
      language: 'typescript',
      lastModified: Date.now(),
      sizeBytes: 500,
      checksum: 'shaIndex',
    });

    const report = await CodeMemoryBridge.sync();
    expect(report).toBeDefined();
    expect(report.codeMemoryFiles).toBeGreaterThanOrEqual(1);

    const comparisonText = await CodeMemoryBridge.compare();
    expect(comparisonText).toContain('CodeMemory ⇄ Repository File Tracking');
  });

  it('should instantiate UnifiedMCPServer without errors', () => {
    const unifiedServer = new UnifiedMCPServer(db);
    expect(unifiedServer).toBeDefined();
  });
});
