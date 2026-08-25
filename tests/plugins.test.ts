import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CodeMemoryDB } from '../src/db/database.js';
import { PluginRegistry, type CodeMemoryPlugin } from '../src/plugins/index.js';

describe('Domain Model & Plugin Architecture', () => {
  let db: CodeMemoryDB;
  let registry: PluginRegistry;

  beforeEach(() => {
    db = new CodeMemoryDB({ inMemory: true });
    registry = PluginRegistry.getInstance(db);
  });

  afterEach(() => {
    db.close();
  });

  it('should list built-in security scanner plugin', () => {
    const plugins = registry.listPlugins();
    expect(plugins.length).toBeGreaterThan(0);
    const securityPlugin = plugins.find((p) => p.id === 'security-scanner');
    expect(securityPlugin).toBeDefined();
    expect(securityPlugin?.name).toBe('Core Security Scanner');
  });

  it('should apply and namespace plugin contributions', async () => {
    const fileId = db.upsertFile({
      path: 'src/payments/Stripe.ts',
      language: 'typescript',
      lastModified: Date.now(),
      sizeBytes: 500,
      checksum: 'stripe-123',
    });

    const customPlugin: CodeMemoryPlugin = {
      manifest: {
        id: 'complexity-analyzer',
        name: 'Complexity Analyzer',
        version: '0.1.0',
        apiVersion: '1.0',
      },
    };

    registry.register(customPlugin);

    await registry.applyContributions(
      'complexity-analyzer',
      [
        {
          type: 'annotation',
          entityType: 'file',
          entityId: fileId,
          key: 'cyclomatic_complexity',
          value: '12',
          confidence: 0.99,
        },
      ],
      db
    );

    const annotations = db.getAnnotations('file', fileId);
    expect(annotations).toHaveLength(1);
    expect(annotations[0].source).toBe('complexity-analyzer');
    expect(annotations[0].key).toBe('cyclomatic_complexity');
    expect(annotations[0].value).toBe('12');
  });

  it('should safely remove plugin and purge its namespaced data without corrupting core entities', () => {
    const fileId = db.upsertFile({
      path: 'src/auth.ts',
      language: 'typescript',
      lastModified: Date.now(),
      sizeBytes: 300,
      checksum: 'auth-123',
    });

    db.addAnnotation({
      entityType: 'file',
      entityId: fileId,
      key: 'test_key',
      value: 'test_val',
      source: 'temp-plugin',
    });

    const purgeStats = db.removePluginData('temp-plugin');
    expect(purgeStats.annotationsRemoved).toBe(1);

    // Core file record remains untouched
    const file = db.getFileByPath('src/auth.ts');
    expect(file).toBeDefined();
    expect(file?.path).toBe('src/auth.ts');

    const annotations = db.getAnnotations('file', fileId);
    expect(annotations).toHaveLength(0);
  });
});
