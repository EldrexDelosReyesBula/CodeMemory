import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CodeMemoryDB } from '../src/db/database.js';
import fs from 'node:fs';
import path from 'node:path';

describe('Database Lock Resilience & Concurrency', () => {
  const testDbDir = path.join(process.cwd(), '.test_codememory');
  const testDbPath = path.join(testDbDir, 'test_concurrency.db');

  beforeEach(() => {
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterEach(() => {
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
      if (fs.existsSync(testDbDir)) {
        fs.rmSync(testDbDir, { recursive: true, force: true });
      }
    } catch {}
  });

  it('should handle sequential and concurrent writes with WAL and busy timeout without locking errors', async () => {
    const db1 = new CodeMemoryDB({ dbPath: testDbPath });
    const db2 = new CodeMemoryDB({ dbPath: testDbPath });

    // Concurrent inserts across two separate database handles
    const writes1 = Array.from({ length: 25 }, (_, i) => {
      return db1.upsertFile({
        path: `src/file_a_${i}.ts`,
        language: 'typescript',
        lastModified: Date.now(),
        sizeBytes: 100 + i,
        checksum: `chk_a_${i}`,
      });
    });

    const writes2 = Array.from({ length: 25 }, (_, i) => {
      return db2.upsertFile({
        path: `src/file_b_${i}.ts`,
        language: 'typescript',
        lastModified: Date.now(),
        sizeBytes: 200 + i,
        checksum: `chk_b_${i}`,
      });
    });

    expect(writes1).toHaveLength(25);
    expect(writes2).toHaveLength(25);

    const allFiles = db1.getAllFiles();
    expect(allFiles.length).toBe(50);

    db1.close();
    db2.close();
  });

  it('should successfully execute withRetry on operations', () => {
    const db = new CodeMemoryDB({ inMemory: true });
    let attempts = 0;

    const result = db.withRetry(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('database is locked (test mock)');
      }
      return 'success';
    });

    expect(result).toBe('success');
    expect(attempts).toBe(3);
    db.close();
  });
});
