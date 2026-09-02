import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_SCHEMA_SQL, SCHEMA_VERSION } from './schema.js';
import type {
  FileRecord,
  SymbolRecord,
  DependencyRecord,
  ChangeRecord,
  HotspotRecord,
  AnnotationRecord,
  RelationshipRecord,
  SkillInstructionRecord,
  ExtractedCommand,
  ArchitectureSnapshot,
  CodebaseMetrics,
  QueryOptions,
  EntityType,
} from '../types/index.js';

export interface DatabaseOptions {
  dbPath?: string;
  inMemory?: boolean;
}

export class CodeMemoryDB {
  private db: DatabaseSync;
  private readonly dbPath: string;

  constructor(options: DatabaseOptions | string = {}) {
    const opts: DatabaseOptions = typeof options === 'string' ? { dbPath: options } : options;
    if (opts.inMemory) {
      this.db = new DatabaseSync(':memory:');
      this.dbPath = ':memory:';
    } else {
      const rootDir = process.cwd();
      const dotDir = path.join(rootDir, '.codememory');
      if (!fs.existsSync(dotDir)) {
        fs.mkdirSync(dotDir, { recursive: true });
      }
      this.dbPath = opts.dbPath || path.join(dotDir, 'codememory.db');
      this.db = new DatabaseSync(this.dbPath);
    }

    this.configurePragmas();
    this.initializeSchema();
  }

  private configurePragmas(): void {
    if (this.dbPath !== ':memory:') {
      try {
        this.db.exec('PRAGMA journal_mode = WAL;');
        this.db.exec('PRAGMA synchronous = NORMAL;');
        this.db.exec('PRAGMA busy_timeout = 5000;');
      } catch {}
    }
    try {
      this.db.exec('PRAGMA foreign_keys = ON;');
    } catch {}
  }

  /**
   * Execute an operation with exponential backoff retry on SQLite lock/busy contention.
   */
  public withRetry<T>(fn: () => T, maxAttempts = 5): T {
    let attempts = 0;
    while (true) {
      try {
        return fn();
      } catch (err: any) {
        const msg = String(err?.message || err).toLowerCase();
        if ((msg.includes('busy') || msg.includes('locked')) && attempts < maxAttempts) {
          attempts++;
          const waitMs = Math.min(50 * Math.pow(2, attempts - 1), 500);
          const start = Date.now();
          while (Date.now() - start < waitMs) {}
          continue;
        }
        throw err;
      }
    }
  }

  private initializeSchema(): void {
    this.migrateColumns();
    try {
      this.db.exec(INITIAL_SCHEMA_SQL);
    } catch {
      this.migrateColumns();
      this.db.exec(INITIAL_SCHEMA_SQL);
    }

    const setVersion = this.db.prepare(
      'INSERT OR REPLACE INTO schema_info (version, applied_at) VALUES (?, CURRENT_TIMESTAMP)'
    );
    setVersion.run(SCHEMA_VERSION);
  }

  private migrateColumns(): void {
    const symbolCols = ['docstring', 'column_start', 'column_end', 'is_exported', 'parent_symbol_id'];
    for (const col of symbolCols) {
      try {
        this.db.exec(`ALTER TABLE symbols ADD COLUMN ${col} TEXT;`);
      } catch {}
    }
    const changeCols = ['git_author', 'git_message'];
    for (const col of changeCols) {
      try {
        this.db.exec(`ALTER TABLE changes ADD COLUMN ${col} TEXT;`);
      } catch {}
    }
    const depCols = ['file_level'];
    for (const col of depCols) {
      try {
        this.db.exec(`ALTER TABLE dependencies ADD COLUMN ${col} INTEGER DEFAULT 0;`);
      } catch {}
    }
  }

  /**
   * Upsert file record and return its file ID.
   */
  public upsertFile(file: FileRecord): number {
    return this.withRetry(() => {
      const existing = this.db
        .prepare('SELECT id FROM files WHERE path = ?')
        .get(file.path) as { id: number } | undefined;

      if (existing) {
        this.db
          .prepare(
            `UPDATE files 
             SET language = ?, last_modified = ?, size_bytes = ?, checksum = ?
             WHERE id = ?`
          )
          .run(
            file.language,
            file.lastModified,
            file.sizeBytes,
            file.checksum,
            existing.id
          );
        return Number(existing.id);
      }

      const res = this.db
        .prepare(
          `INSERT INTO files (path, language, last_modified, size_bytes, checksum)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(
          file.path,
          file.language,
          file.lastModified,
          file.sizeBytes,
          file.checksum
        );
      return Number(res.lastInsertRowid);
    });
  }

  public getFileByPath(filePath: string): FileRecord | null {
    const row = this.db
      .prepare('SELECT * FROM files WHERE path = ?')
      .get(filePath) as any;
    if (!row) return null;
    return {
      id: Number(row.id),
      path: String(row.path),
      language: String(row.language),
      createdAt: row.created_at,
      lastModified: Number(row.last_modified),
      sizeBytes: Number(row.size_bytes),
      checksum: String(row.checksum),
    };
  }

  public getFile(filePath: string): FileRecord | null {
    return this.getFileByPath(filePath);
  }

  public getAllFiles(): FileRecord[] {
    const rows = this.db.prepare('SELECT * FROM files ORDER BY path ASC').all() as any[];
    return rows.map((r) => ({
      id: Number(r.id),
      path: String(r.path),
      language: String(r.language),
      createdAt: r.created_at,
      lastModified: Number(r.last_modified),
      sizeBytes: Number(r.size_bytes),
      checksum: String(r.checksum),
    }));
  }

  public deleteFile(filePath: string): void {
    this.withRetry(() => {
      this.db.prepare('DELETE FROM files WHERE path = ?').run(filePath);
    });
  }

  /**
   * Replace all symbols and dependencies for a file atomically.
   */
  public syncFileIntelligence(
    fileId: number,
    symbols: Omit<SymbolRecord, 'fileId'>[],
    dependencies: Omit<DependencyRecord, 'sourceFileId'>[]
  ): void {
    this.withRetry(() => {
      this.db.exec('BEGIN IMMEDIATE TRANSACTION;');
      try {
        this.db.prepare('DELETE FROM symbols WHERE file_id = ?').run(fileId);
        this.db.prepare('DELETE FROM dependencies WHERE source_file_id = ?').run(fileId);

        const insertSymbol = this.db.prepare(
          `INSERT INTO symbols (file_id, name, kind, line_start, line_end, column_start, column_end, signature, docstring, summary, visibility, is_exported, parent_symbol_id, checksum)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        for (const sym of symbols) {
          insertSymbol.run(
            fileId,
            sym.name,
            sym.kind,
            sym.lineStart,
            sym.lineEnd,
            sym.columnStart || 0,
            sym.columnEnd || 0,
            sym.signature || null,
            sym.docstring || null,
            sym.summary || null,
            sym.visibility || 'public',
            sym.isExported ? 1 : 0,
            sym.parentSymbolId || null,
            sym.checksum || null
          );
        }

        const insertDep = this.db.prepare(
          `INSERT INTO dependencies (source_file_id, target_file_id, source_symbol_id, target_symbol_name, import_path, dep_type, file_level)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );

        for (const dep of dependencies) {
          insertDep.run(
            fileId,
            dep.targetFileId || null,
            dep.sourceSymbolId || null,
            dep.targetSymbolName,
            dep.importPath,
            dep.depType,
            dep.fileLevel ? 1 : 0
          );
        }

        this.db.exec('COMMIT;');
      } catch (err) {
        try {
          this.db.exec('ROLLBACK;');
        } catch {}
        throw err;
      }
    });
  }

  /**
   * Search symbols across the codebase with filtering and ranking.
   */
  public searchSymbols(options: QueryOptions): SymbolRecord[] {
    const { query = '', kind, language, limit = 50 } = options;
    const wild = `%${query}%`;

    let sql = `
      SELECT s.*, f.path as file_path
      FROM symbols s
      JOIN files f ON s.file_id = f.id
      WHERE (s.name LIKE ? OR s.signature LIKE ? OR s.summary LIKE ?)
    `;
    const params: any[] = [wild, wild, wild];

    if (kind) {
      sql += ` AND s.kind = ?`;
      params.push(kind);
    }
    if (language) {
      sql += ` AND f.language = ?`;
      params.push(language);
    }

    sql += ` ORDER BY 
      CASE WHEN s.name = ? THEN 1
           WHEN s.name LIKE ? THEN 2
           ELSE 3 END,
      s.name ASC
      LIMIT ?`;
    params.push(query, `${query}%`, limit);

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map((r) => ({
      id: Number(r.id),
      fileId: Number(r.file_id),
      filePath: String(r.file_path),
      name: String(r.name),
      kind: r.kind as any,
      lineStart: Number(r.line_start),
      lineEnd: Number(r.line_end),
      signature: r.signature || undefined,
      docstring: r.docstring || undefined,
      summary: r.summary || undefined,
      visibility: r.visibility || undefined,
      checksum: r.checksum || undefined,
    }));
  }

  public getSymbolByName(name: string): SymbolRecord | null {
    const row = this.db
      .prepare(
        `SELECT s.*, f.path as file_path
         FROM symbols s
         JOIN files f ON s.file_id = f.id
         WHERE s.name = ?
         LIMIT 1`
      )
      .get(name) as any;
    if (!row) return null;
    return {
      id: Number(row.id),
      fileId: Number(row.file_id),
      filePath: String(row.file_path),
      name: String(row.name),
      kind: row.kind as any,
      lineStart: Number(row.line_start),
      lineEnd: Number(row.line_end),
      signature: row.signature || undefined,
      summary: row.summary || undefined,
      visibility: row.visibility || undefined,
    };
  }

  public getSymbolsForFile(filePath: string): SymbolRecord[] {
    const sql = `
      SELECT s.*, f.path as file_path
      FROM symbols s
      JOIN files f ON s.file_id = f.id
      WHERE f.path = ?
      ORDER BY s.line_start ASC
    `;
    const rows = this.db.prepare(sql).all(filePath) as any[];
    return rows.map((r) => ({
      id: Number(r.id),
      fileId: Number(r.file_id),
      filePath: String(r.file_path),
      name: String(r.name),
      kind: r.kind as any,
      lineStart: Number(r.line_start),
      lineEnd: Number(r.line_end),
      signature: r.signature || undefined,
      docstring: r.docstring || undefined,
      summary: r.summary || undefined,
      visibility: r.visibility || undefined,
      checksum: r.checksum || undefined,
    }));
  }

  public getDependenciesForFile(filePath: string): any[] {
    const sql = `
      SELECT d.*, sf.path as source_path, tf.path as target_path
      FROM dependencies d
      JOIN files sf ON d.source_file_id = sf.id
      LEFT JOIN files tf ON d.target_file_id = tf.id
      WHERE sf.path = ?
      ORDER BY d.import_path ASC
    `;
    return this.db.prepare(sql).all(filePath);
  }

  public getDependentsForFile(filePath: string): any[] {
    const sql = `
      SELECT DISTINCT d.id, d.source_file_id, d.target_file_id, d.target_symbol_name, d.import_path, d.dep_type,
             sf.path as source_path, tf.path as target_path
      FROM dependencies d
      JOIN files sf ON d.source_file_id = sf.id
      LEFT JOIN files tf ON d.target_file_id = tf.id
      WHERE tf.path = ? OR d.import_path = ? OR d.import_path LIKE ?
      ORDER BY sf.path ASC
    `;
    const baseName = path.basename(filePath, path.extname(filePath));
    return this.db.prepare(sql).all(filePath, filePath, `%/` + baseName);
  }

  public getDependentsForSymbol(symbolName: string): any[] {
    const sql = `
      SELECT d.*, sf.path as source_path
      FROM dependencies d
      JOIN files sf ON d.source_file_id = sf.id
      WHERE d.target_symbol_name = ?
      ORDER BY sf.path ASC
    `;
    return this.db.prepare(sql).all(symbolName);
  }

  public recordChange(change: ChangeRecord): void {
    this.withRetry(() => {
      this.db
        .prepare(
          `INSERT INTO changes (file_id, path, event_type, commit_hash, git_author, git_message, diff_summary, impact_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          change.fileId || null,
          change.path,
          change.eventType,
          change.commitHash || null,
          change.gitAuthor || null,
          change.gitMessage || null,
          change.diffSummary || null,
          change.impactScore || 0.0
        );
    });
  }

  public getRecentChanges(limit: number = 20): ChangeRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM changes ORDER BY id DESC LIMIT ?')
      .all(limit) as any[];
    return rows.map((r) => ({
      id: Number(r.id),
      fileId: r.file_id ? Number(r.file_id) : undefined,
      path: String(r.path),
      timestamp: String(r.timestamp),
      eventType: r.event_type as any,
      commitHash: r.commit_hash || undefined,
      gitAuthor: r.git_author || undefined,
      gitMessage: r.git_message || undefined,
      diffSummary: r.diff_summary || undefined,
      impactScore: Number(r.impact_score || 0),
    }));
  }

  public getHistoryForPath(filePath: string, limit: number = 20): ChangeRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM changes WHERE path = ? ORDER BY id DESC LIMIT ?')
      .all(filePath, limit) as any[];
    return rows.map((r) => ({
      id: Number(r.id),
      fileId: r.file_id ? Number(r.file_id) : undefined,
      path: String(r.path),
      timestamp: String(r.timestamp),
      eventType: r.event_type as any,
      commitHash: r.commit_hash || undefined,
      diffSummary: r.diff_summary || undefined,
      impactScore: Number(r.impact_score || 0),
    }));
  }

  public getHotspots(limit: number = 10): HotspotRecord[] {
    const sql = `
      SELECT path, COUNT(*) as change_count, MAX(timestamp) as last_modified, SUM(impact_score) as total_impact
      FROM changes
      GROUP BY path
      ORDER BY change_count DESC, total_impact DESC
      LIMIT ?
    `;
    const rows = this.db.prepare(sql).all(limit) as any[];
    return rows.map((r) => ({
      path: String(r.path),
      changeCount: Number(r.change_count),
      lastModified: String(r.last_modified),
      impactScore: Number(r.total_impact || 0),
    }));
  }

  public getCoChangingFiles(filePath: string, limit: number = 5): { path: string; coChangeCount: number }[] {
    const sql = `
      SELECT c2.path, COUNT(*) as co_change_count
      FROM changes c1
      JOIN changes c2 ON c1.commit_hash = c2.commit_hash AND c1.path != c2.path
      WHERE c1.path = ? AND c1.commit_hash IS NOT NULL
      GROUP BY c2.path
      ORDER BY co_change_count DESC
      LIMIT ?
    `;
    const rows = this.db.prepare(sql).all(filePath, limit) as any[];
    return rows.map((r) => ({
      path: String(r.path),
      coChangeCount: Number(r.co_change_count),
    }));
  }

  public getRelatedTests(filePath: string): string[] {
    const baseName = path.basename(filePath, path.extname(filePath));
    const testPatterns = [
      `%${baseName}.test%`,
      `%${baseName}.spec%`,
      `%${baseName}_test%`,
      `%test_${baseName}%`,
    ];

    const results = new Set<string>();
    for (const pattern of testPatterns) {
      const rows = this.db
        .prepare('SELECT path FROM files WHERE path LIKE ?')
        .all(pattern) as any[];
      for (const r of rows) {
        results.add(String(r.path));
      }
    }

    return Array.from(results);
  }

  // --- Domain Model: Extensible Annotations & Relationships ---

  public addAnnotation(annotation: AnnotationRecord): void {
    this.withRetry(() => {
      this.db
        .prepare(
          `INSERT OR REPLACE INTO annotations (entity_type, entity_id, key, value, source, confidence, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .run(
          annotation.entityType,
          annotation.entityId,
          annotation.key,
          annotation.value,
          annotation.source,
          annotation.confidence || null
        );
    });
  }

  public getAnnotations(entityType: EntityType, entityId: number): AnnotationRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM annotations WHERE entity_type = ? AND entity_id = ?')
      .all(entityType, entityId) as any[];
    return rows.map((r) => ({
      id: Number(r.id),
      entityType: r.entity_type as EntityType,
      entityId: Number(r.entity_id),
      key: String(r.key),
      value: String(r.value),
      source: String(r.source),
      confidence: r.confidence ? Number(r.confidence) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  }

  public getAnnotationsForFile(filePath: string): AnnotationRecord[] {
    const file = this.getFileByPath(filePath);
    if (!file || !file.id) return [];
    return this.getAnnotations('file', file.id);
  }

  public addRelationship(rel: RelationshipRecord): void {
    this.withRetry(() => {
      this.db
        .prepare(
          `INSERT INTO relationships (source_entity_type, source_entity_id, target_entity_type, target_entity_id, relationship_type, source, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          rel.sourceEntityType,
          rel.sourceEntityId,
          rel.targetEntityType,
          rel.targetEntityId,
          rel.relationshipType,
          rel.source,
          rel.metadata || null
        );
    });
  }

  public getRelationships(entityType: EntityType, entityId: number): RelationshipRecord[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM relationships 
         WHERE (source_entity_type = ? AND source_entity_id = ?)
            OR (target_entity_type = ? AND target_entity_id = ?)`
      )
      .all(entityType, entityId, entityType, entityId) as any[];
    return rows.map((r) => ({
      id: Number(r.id),
      sourceEntityType: r.source_entity_type as EntityType,
      sourceEntityId: Number(r.source_entity_id),
      targetEntityType: r.target_entity_type as EntityType,
      targetEntityId: Number(r.target_entity_id),
      relationshipType: String(r.relationship_type),
      source: String(r.source),
      metadata: r.metadata || undefined,
      createdAt: String(r.created_at),
    }));
  }

  public removePluginData(pluginSource: string): { annotationsRemoved: number; relationshipsRemoved: number } {
    return this.withRetry(() => {
      const resAnn = this.db.prepare('DELETE FROM annotations WHERE source = ?').run(pluginSource);
      const resRel = this.db.prepare('DELETE FROM relationships WHERE source = ?').run(pluginSource);
      return {
        annotationsRemoved: Number(resAnn.changes),
        relationshipsRemoved: Number(resRel.changes),
      };
    });
  }

  // --- Skills & Agent Instructions Domain Store ---

  public upsertSkillInstruction(instruction: SkillInstructionRecord): void {
    this.withRetry(() => {
      const cmdStr = instruction.commands ? JSON.stringify(instruction.commands) : null;
      this.db
        .prepare(
          `INSERT OR REPLACE INTO skill_instructions (file_path, tool_target, section, heading_level, content, commands, line_start, line_end, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .run(
          instruction.filePath,
          instruction.toolTarget || 'generic',
          instruction.section,
          instruction.headingLevel || 2,
          instruction.content,
          cmdStr,
          instruction.lineStart || 1,
          instruction.lineEnd || 1
        );
    });
  }

  public getSkillInstructions(filePath?: string): SkillInstructionRecord[] {
    const sql = filePath
      ? 'SELECT * FROM skill_instructions WHERE file_path = ? ORDER BY id ASC'
      : 'SELECT * FROM skill_instructions ORDER BY file_path ASC, id ASC';
    const rows = (filePath ? this.db.prepare(sql).all(filePath) : this.db.prepare(sql).all()) as any[];
    return rows.map((r) => ({
      id: Number(r.id),
      filePath: String(r.file_path),
      toolTarget: String(r.tool_target),
      section: String(r.section),
      headingLevel: Number(r.heading_level),
      content: String(r.content),
      commands: r.commands ? JSON.parse(r.commands) : undefined,
      lineStart: Number(r.line_start),
      lineEnd: Number(r.line_end),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  }

  public searchSkillInstructions(query: string): SkillInstructionRecord[] {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9_-]/g, ''))
      .filter((t) => t.length >= 3);

    if (tokens.length === 0) {
      const wild = `%${query}%`;
      const sql = `SELECT * FROM skill_instructions WHERE section LIKE ? OR content LIKE ? ORDER BY id ASC`;
      const rows = this.db.prepare(sql).all(wild, wild) as any[];
      return rows.map((r) => ({
        id: Number(r.id),
        filePath: String(r.file_path),
        toolTarget: String(r.tool_target),
        section: String(r.section),
        headingLevel: Number(r.heading_level),
        content: String(r.content),
        commands: r.commands ? JSON.parse(r.commands) : undefined,
        lineStart: Number(r.line_start),
        lineEnd: Number(r.line_end),
      }));
    }

    const clauses = tokens.map(() => '(LOWER(section) LIKE ? OR LOWER(content) LIKE ?)').join(' OR ');
    const params: any[] = [];
    for (const t of tokens) {
      params.push(`%${t}%`, `%${t}%`);
    }

    const sql = `SELECT * FROM skill_instructions WHERE ${clauses} ORDER BY id ASC`;
    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map((r) => ({
      id: Number(r.id),
      filePath: String(r.file_path),
      toolTarget: String(r.tool_target),
      section: String(r.section),
      headingLevel: Number(r.heading_level),
      content: String(r.content),
      commands: r.commands ? JSON.parse(r.commands) : undefined,
      lineStart: Number(r.line_start),
      lineEnd: Number(r.line_end),
    }));
  }

  public getExtractedCommands(topic?: string): ExtractedCommand[] {
    const rows = this.db.prepare('SELECT commands FROM skill_instructions WHERE commands IS NOT NULL').all() as any[];
    const allCmds: ExtractedCommand[] = [];
    for (const r of rows) {
      if (r.commands) {
        try {
          const parsed = JSON.parse(r.commands) as ExtractedCommand[];
          allCmds.push(...parsed);
        } catch {}
      }
    }

    if (!topic) return allCmds;
    const lower = topic.toLowerCase();
    return allCmds.filter((c) => c.command.toLowerCase().includes(lower) || c.description.toLowerCase().includes(lower));
  }

  public getConventions(topic?: string): SkillInstructionRecord[] {
    const wild = topic ? `%${topic}%` : '%';
    const sql = `
      SELECT * FROM skill_instructions
      WHERE (section LIKE '%Convention%' OR section LIKE '%Rule%' OR section LIKE '%Guideline%')
        AND (section LIKE ? OR content LIKE ?)
      ORDER BY id ASC
    `;
    const rows = this.db.prepare(sql).all(wild, wild) as any[];
    return rows.map((r) => ({
      id: Number(r.id),
      filePath: String(r.file_path),
      toolTarget: String(r.tool_target),
      section: String(r.section),
      headingLevel: Number(r.heading_level),
      content: String(r.content),
      commands: r.commands ? JSON.parse(r.commands) : undefined,
      lineStart: Number(r.line_start),
      lineEnd: Number(r.line_end),
    }));
  }

  public saveArchitectureSnapshot(snapshot: ArchitectureSnapshot): void {
    this.db
      .prepare(
        `INSERT INTO architecture_snapshots (mermaid_diagram, metrics_json)
         VALUES (?, ?)`
      )
      .run(snapshot.mermaidDiagram, snapshot.metricsJson);
  }

  public getLatestArchitectureSnapshot(): ArchitectureSnapshot | null {
    const row = this.db
      .prepare(
        'SELECT * FROM architecture_snapshots ORDER BY id DESC LIMIT 1'
      )
      .get() as any;
    if (!row) return null;
    return {
      id: Number(row.id),
      timestamp: String(row.timestamp),
      mermaidDiagram: String(row.mermaid_diagram),
      metricsJson: String(row.metrics_json),
    };
  }

  public getCodebaseMetrics(): CodebaseMetrics {
    const totalFiles = Number(
      (this.db.prepare('SELECT COUNT(*) as count FROM files').get() as any).count
    );
    const totalSymbols = Number(
      (this.db.prepare('SELECT COUNT(*) as count FROM symbols').get() as any).count
    );
    const totalDependencies = Number(
      (this.db.prepare('SELECT COUNT(*) as count FROM dependencies').get() as any).count
    );

    const langRows = this.db
      .prepare('SELECT language, COUNT(*) as count FROM files GROUP BY language')
      .all() as any[];
    const languages: Record<string, number> = {};
    for (const r of langRows) {
      languages[String(r.language)] = Number(r.count);
    }

    const kindRows = this.db
      .prepare('SELECT kind, COUNT(*) as count FROM symbols GROUP BY kind')
      .all() as any[];
    const symbolKinds: Record<string, number> = {};
    for (const r of kindRows) {
      symbolKinds[String(r.kind)] = Number(r.count);
    }

    return {
      totalFiles,
      totalSymbols,
      totalDependencies,
      languages,
      symbolKinds,
      lastScanTimestamp: new Date().toISOString(),
    };
  }

  public clean(): void {
    this.db.exec(`
      DELETE FROM files;
      DELETE FROM symbols;
      DELETE FROM dependencies;
      DELETE FROM changes;
      DELETE FROM architecture_snapshots;
      DELETE FROM annotations;
      DELETE FROM relationships;
      DELETE FROM skill_instructions;
    `);
  }

  public close(): void {
    this.db.close();
  }
}
