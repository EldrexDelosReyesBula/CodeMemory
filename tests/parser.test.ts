import { describe, it, expect } from 'vitest';
import { CodeExtractor } from '../src/parser/extractor.js';
import { detectLanguage } from '../src/parser/languages.js';

describe('Parser and Language Detection', () => {
  const extractor = new CodeExtractor();

  it('should detect languages correctly by extension', () => {
    expect(detectLanguage('main.ts')).toBe('typescript');
    expect(detectLanguage('component.tsx')).toBe('typescript');
    expect(detectLanguage('script.py')).toBe('python');
    expect(detectLanguage('lib.rs')).toBe('rust');
    expect(detectLanguage('server.go')).toBe('go');
    expect(detectLanguage('schema.sql')).toBe('sql');
  });

  it('should extract TypeScript classes, interfaces, and functions', () => {
    const tsCode = `
import { Database } from 'better-sqlite3';
import { User, Session } from './models';

export interface AuthConfig {
  secret: string;
  expiresIn: number;
}

export class AuthService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  public async login(username: string): Promise<Session> {
    return { token: 'jwt' };
  }
}

export function verifyToken(token: string): boolean {
  return true;
}
`;

    const result = extractor.parseFile('src/auth.ts', tsCode);
    expect(result.language).toBe('typescript');
    expect(result.dependencies).toHaveLength(3); // Database, User, Session

    const symbolNames = result.symbols.map((s) => s.name);
    expect(symbolNames).toContain('AuthConfig');
    expect(symbolNames).toContain('AuthService');
    expect(symbolNames).toContain('verifyToken');
  });

  it('should extract Python classes, methods, and functions', () => {
    const pyCode = `
import os
from typing import List, Optional

class VectorStore:
    def __init__(self, dimension: int):
        self.dimension = dimension

    def add_vectors(self, vectors: List[float]):
        pass

def compute_similarity(a: List[float], b: List[float]) -> float:
    return 1.0
`;

    const result = extractor.parseFile('embeddings/store.py', pyCode);
    expect(result.language).toBe('python');

    const symbolNames = result.symbols.map((s) => s.name);
    expect(symbolNames).toContain('VectorStore');
    expect(symbolNames).toContain('__init__');
    expect(symbolNames).toContain('add_vectors');
    expect(symbolNames).toContain('compute_similarity');
  });

  it('should extract Rust structs, enums, traits, and functions', () => {
    const rsCode = `
use std::collections::HashMap;

pub struct MemoryCache {
    entries: HashMap<String, String>,
}

pub enum CachePolicy {
    Lru,
    Fifo,
}

pub fn initialize_cache() -> MemoryCache {
    MemoryCache { entries: HashMap::new() }
}
`;

    const result = extractor.parseFile('src/cache.rs', rsCode);
    expect(result.language).toBe('rust');

    const symbolNames = result.symbols.map((s) => s.name);
    expect(symbolNames).toContain('MemoryCache');
    expect(symbolNames).toContain('CachePolicy');
    expect(symbolNames).toContain('initialize_cache');
  });
});
