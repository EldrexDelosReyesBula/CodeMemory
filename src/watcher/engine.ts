import chokidar, { type FSWatcher } from 'chokidar';
import fs from 'node:fs';
import path from 'node:path';
import ignore from 'ignore';
import type { CodeMemoryDB } from '../db/database.js';
import { CodeExtractor } from '../parser/extractor.js';
import { SkillsParser } from '../parser/skills.js';

export interface WatcherOptions {
  rootDir?: string;
  debounceMs?: number;
  onEvent?: (eventType: string, filePath: string) => void;
}

export class FileWatcherEngine {
  private readonly rootDir: string;
  private readonly debounceMs: number;
  private readonly db: CodeMemoryDB;
  private readonly extractor: CodeExtractor;
  private watcher: FSWatcher | null = null;
  private ig: ReturnType<typeof ignore>;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private onEventCallback?: (eventType: string, filePath: string) => void;

  constructor(db: CodeMemoryDB, options: WatcherOptions = {}) {
    this.db = db;
    this.rootDir = options.rootDir || process.cwd();
    this.debounceMs = options.debounceMs || 100;
    this.extractor = new CodeExtractor();
    this.onEventCallback = options.onEvent;
    this.ig = ignore();

    this.loadIgnoreRules();
  }

  private loadIgnoreRules(): void {
    // Default system ignores
    this.ig.add([
      '.git',
      '.git/**',
      '.codememory',
      '.codememory/**',
      'node_modules',
      'node_modules/**',
      'dist',
      'dist/**',
      'build',
      'build/**',
      '*.lock',
      '*.log',
      '.DS_Store',
    ]);

    const gitignorePath = path.join(this.rootDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      try {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        this.ig.add(content);
      } catch (err) {
        // Fallback gracefully
      }
    }
  }

  public shouldIgnore(relativeFilePath: string): boolean {
    const normalized = relativeFilePath.replace(/\\/g, '/');
    return this.ig.ignores(normalized);
  }

  /**
   * Perform full synchronous scan and index of repository.
   */
  public async scanAll(): Promise<{ filesScanned: number; symbolsIndexed: number }> {
    let filesScanned = 0;
    let symbolsIndexed = 0;

    const walk = async (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(this.rootDir, fullPath).replace(/\\/g, '/');

        if (this.shouldIgnore(relPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const count = await this.processFileChange(relPath, fullPath);
          filesScanned++;
          symbolsIndexed += count;
        }
      }
    };

    await walk(this.rootDir);
    return { filesScanned, symbolsIndexed };
  }

  /**
   * Process a single file addition or modification.
   */
  public async processFileChange(relPath: string, fullPath: string): Promise<number> {
    const normalizedRelPath = relPath.replace(/\\/g, '/');

    try {
      if (!fs.existsSync(fullPath)) {
        this.db.deleteFile(normalizedRelPath);
        this.db.recordChange({
          path: normalizedRelPath,
          timestamp: new Date().toISOString(),
          eventType: 'deleted',
        });
        return 0;
      }

      const stat = fs.statSync(fullPath);
      // Skip very large binary or data files (> 2MB)
      if (stat.size > 2 * 1024 * 1024) {
        return 0;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      const parsed = this.extractor.parseFile(normalizedRelPath, content);

      // If this is an agent instruction file (SKILLS.md, AGENTS.md, etc.), parse skills
      if (SkillsParser.isSkillFile(normalizedRelPath)) {
        const skillSections = SkillsParser.parse(normalizedRelPath, content);
        for (const s of skillSections) {
          this.db.upsertSkillInstruction(s);
        }
      }

      // Upsert file metadata
      const fileId = this.db.upsertFile({
        path: normalizedRelPath,
        language: parsed.language,
        lastModified: Math.floor(stat.mtimeMs),
        sizeBytes: parsed.sizeBytes,
        checksum: parsed.checksum,
      });

      // Update symbols & dependencies atomically
      this.db.syncFileIntelligence(fileId, parsed.symbols, parsed.dependencies);

      this.db.recordChange({
        fileId,
        path: normalizedRelPath,
        timestamp: new Date().toISOString(),
        eventType: 'modified',
        diffSummary: `Indexed ${parsed.symbols.length} symbols, ${parsed.dependencies.length} dependencies`,
      });

      return parsed.symbols.length;
    } catch (err: any) {
      console.error(`[Error indexing ${normalizedRelPath}]:`, err?.message || err);
      return 0;
    }
  }

  /**
   * Start real-time file watcher.
   */
  public start(): void {
    if (this.watcher) return;

    this.watcher = chokidar.watch(this.rootDir, {
      ignored: (pathStr: string) => {
        const rel = path.relative(this.rootDir, pathStr).replace(/\\/g, '/');
        if (!rel) return false;
        return this.shouldIgnore(rel);
      },
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    this.watcher.on('all', (event: string, filePath: string) => {
      const relPath = path.relative(this.rootDir, filePath).replace(/\\/g, '/');
      if (this.shouldIgnore(relPath)) return;

      // Debounce events for this specific file
      const existingTimer = this.debounceTimers.get(relPath);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(async () => {
        this.debounceTimers.delete(relPath);
        await this.processFileChange(relPath, filePath);
        if (this.onEventCallback) {
          this.onEventCallback(event, relPath);
        }
      }, this.debounceMs);

      this.debounceTimers.set(relPath, timer);
    });
  }

  public stop(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
