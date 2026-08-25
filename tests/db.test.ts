import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CodeMemoryDB } from '../src/db/database.js';

describe('CodeMemoryDB', () => {
  let db: CodeMemoryDB;

  beforeEach(() => {
    db = new CodeMemoryDB({ inMemory: true });
  });

  afterEach(() => {
    db.close();
  });

  it('should initialize schema and tables in memory', () => {
    const metrics = db.getCodebaseMetrics();
    expect(metrics.totalFiles).toBe(0);
    expect(metrics.totalSymbols).toBe(0);
  });

  it('should upsert file records and retrieve by path', () => {
    const fileId = db.upsertFile({
      path: 'src/index.ts',
      language: 'typescript',
      lastModified: Date.now(),
      sizeBytes: 1024,
      checksum: 'abc123hash',
    });

    expect(fileId).toBeGreaterThan(0);

    const file = db.getFileByPath('src/index.ts');
    expect(file).not.toBeNull();
    expect(file?.language).toBe('typescript');
    expect(file?.checksum).toBe('abc123hash');
  });

  it('should sync file symbols and dependencies in an atomic transaction', () => {
    const fileId = db.upsertFile({
      path: 'src/auth.ts',
      language: 'typescript',
      lastModified: Date.now(),
      sizeBytes: 500,
      checksum: 'sha-auth',
    });

    db.syncFileIntelligence(
      fileId,
      [
        {
          name: 'authenticateUser',
          kind: 'function',
          lineStart: 10,
          lineEnd: 25,
          signature: 'export async function authenticateUser(token: string)',
          visibility: 'public',
        },
        {
          name: 'UserProfile',
          kind: 'interface',
          lineStart: 1,
          lineEnd: 8,
          signature: 'export interface UserProfile',
          visibility: 'public',
        },
      ],
      [
        {
          targetSymbolName: 'jwt',
          importPath: 'jsonwebtoken',
          depType: 'import',
        },
      ]
    );

    const symbols = db.getSymbolsForFile('src/auth.ts');
    expect(symbols).toHaveLength(2);
    expect(symbols[0].name).toBe('UserProfile');
    expect(symbols[1].name).toBe('authenticateUser');

    const searchResults = db.searchSymbols({ query: 'authenticate' });
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].name).toBe('authenticateUser');
  });
});
