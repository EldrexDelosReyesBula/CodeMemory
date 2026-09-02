/**
 * CodeMemoryBridge
 *
 * Bridge providing integration between DevDiff and CodeMemory.
 * Enables DevDiff to access AST symbols and dependency information from CodeMemory,
 * and allows recording change logs back into CodeMemory persistence.
 */

import { exec, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

export interface CodeMemoryContext {
  structure: Record<string, any>;
  dependencies: Record<string, any>;
  hotspots: Array<{ file: string; changes: any[] }>;
  skills?: Array<{ file: string; section: string; content: string }>;
  conventions?: Array<{ title: string; content: string }>;
}

export interface SyncReport {
  codeMemoryFiles: number;
  trackedFiles: number;
  inBoth: number;
  onlyInCodeMemory: string[];
  onlyInTracked: string[];
  synchronized: boolean;
  timestamp: string;
}

export interface ImpactAnalysisResult {
  file: string;
  directDependents: Array<{ symbol: string; path: string }>;
  dependentCount: number;
}

export class CodeMemoryBridge {
  private static localDbInstance: any = null;

  /**
   * Register an in-process CodeMemoryDB instance for direct queries when running in the same process.
   */
  public static setLocalDatabase(dbInstance: any): void {
    this.localDbInstance = dbInstance;
  }

  /**
   * Query structural information for specified files.
   */
  public static async query(params: {
    files: string[];
    includeDependencies?: boolean;
    includeRecentChanges?: boolean;
    includeSymbols?: boolean;
    workspacePath?: string;
  }): Promise<CodeMemoryContext> {
    const results: CodeMemoryContext = {
      structure: {},
      dependencies: {},
      hotspots: [],
      skills: [],
      conventions: [],
    };

    const cwd = params.workspacePath || process.cwd();

    // 1. In-process direct database query if available
    if (this.localDbInstance) {
      try {
        for (const file of params.files) {
          const normFile = path.normalize(file).replace(/\\/g, '/');
          const symbols = this.localDbInstance.getSymbolsForFile(normFile);
          results.structure[normFile] = { symbols, path: normFile };

          if (params.includeDependencies) {
            results.dependencies[normFile] = {
              downstream: this.localDbInstance.getDependenciesForFile(normFile),
              upstream: this.localDbInstance.getDependentsForFile(normFile),
            };
          }

          if (params.includeRecentChanges) {
            const changes = this.localDbInstance.getHistoryForPath(normFile, 10);
            if (changes && changes.length > 0) {
              results.hotspots.push({ file: normFile, changes });
            }
          }
        }

        results.skills = this.localDbInstance.getSkillInstructions?.() || [];
        results.conventions = this.localDbInstance.getConventions?.() || [];
        return results;
      } catch {
        // Fallback to CLI
      }
    }

    // 2. Fallback to CLI invocation
    for (const file of params.files) {
      try {
        const structure = await this.queryFile(file, cwd);
        if (structure) {
          results.structure[file] = structure;
        }

        if (params.includeDependencies) {
          const deps = await this.queryDependencies(file, cwd);
          if (deps) {
            results.dependencies[file] = deps;
          }
        }

        if (params.includeRecentChanges) {
          const changes = await this.queryRecentChanges(file, cwd);
          if (changes && changes.length > 0) {
            results.hotspots.push({ file, changes });
          }
        }
      } catch {}
    }

    return results;
  }

  /**
   * Record change summaries back to CodeMemory database.
   */
  public static async recordChanges(params: {
    files: string[];
    changelog: string;
    timestamp?: number;
    author?: string;
    commitHash?: string;
    workspacePath?: string;
  }): Promise<void> {
    const cwd = params.workspacePath || process.cwd();

    if (this.localDbInstance) {
      try {
        for (const file of params.files) {
          const normFile = path.normalize(file).replace(/\\/g, '/');
          this.localDbInstance.recordChange({
            path: normFile,
            eventType: 'modified',
            timestamp: new Date(params.timestamp || Date.now()).toISOString(),
            gitAuthor: params.author || 'DevDiff',
            gitMessage: params.changelog.slice(0, 120),
            diffSummary: params.changelog,
            commitHash: params.commitHash,
          });

          const fileRecord = this.localDbInstance.getFile(normFile);
          if (fileRecord?.id) {
            this.localDbInstance.addAnnotation({
              entityType: 'file',
              entityId: fileRecord.id,
              key: 'changelog',
              value: params.changelog,
              source: '@eldrex/plugin-codememory',
              confidence: 1.0,
            });
          }
        }
        return;
      } catch {}
    }

    try {
      await this.execAsync('npx @eldrex/codememory watch --trigger-reindex', cwd);
    } catch {}
  }

  /**
   * Analyze dependency dependents for given files.
   */
  public static async analyzeImpact(files: string[], workspacePath?: string): Promise<ImpactAnalysisResult[]> {
    const cwd = workspacePath || process.cwd();
    const results: ImpactAnalysisResult[] = [];

    for (const file of files) {
      const normFile = path.normalize(file).replace(/\\/g, '/');
      let upstreamDependents: any[] = [];

      if (this.localDbInstance) {
        try {
          upstreamDependents = this.localDbInstance.getDependentsForFile(normFile);
        } catch {}
      } else {
        try {
          const out = await this.execAsync(`npx @eldrex/codememory query "${normFile}" --direction upstream --format json`, cwd);
          const parsed = JSON.parse(out);
          upstreamDependents = parsed.dependents || [];
        } catch {}
      }

      const direct = upstreamDependents.map((d: any) => ({
        symbol: d.targetSymbolName || d.target_symbol_name || d.sourceSymbolName || normFile,
        path: d.source_path || d.sourcePath || d.path || '',
      }));

      results.push({
        file: normFile,
        directDependents: direct,
        dependentCount: direct.length,
      });
    }

    return results;
  }

  /**
   * Synchronize and verify file lists between Git tracking and CodeMemory index.
   */
  public static async sync(workspacePath?: string): Promise<SyncReport> {
    const cwd = workspacePath || process.cwd();

    // 1. CodeMemory indexed files
    let cmFiles: string[] = [];
    if (this.localDbInstance) {
      try {
        cmFiles = this.localDbInstance.getAllFiles().map((f: any) => f.path);
      } catch {}
    }

    if (cmFiles.length === 0) {
      try {
        const cmIndex = await this.execAsync('npx @eldrex/codememory export --format json', cwd);
        const cmData = JSON.parse(cmIndex);
        cmFiles = cmData.files ? cmData.files.map((f: any) => (typeof f === 'string' ? f : f.path)) : [];
      } catch {
        cmFiles = [];
      }
    }

    // 2. Discover git-tracked files in workspace
    let trackedFiles: string[] = [];
    try {
      const gitOut = execSync('git ls-files', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      trackedFiles = gitOut.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    } catch {
      trackedFiles = cmFiles;
    }

    const normCmFiles = cmFiles.map((f) => path.normalize(f).replace(/\\/g, '/'));
    const normTrackedFiles = trackedFiles.map((f) => path.normalize(f).replace(/\\/g, '/'));

    const onlyInCodeMemory = normCmFiles.filter((f) => !normTrackedFiles.includes(f));
    const onlyInTracked = normTrackedFiles.filter((f) => !normCmFiles.includes(f));
    const inBoth = normTrackedFiles.filter((f) => normCmFiles.includes(f));

    return {
      codeMemoryFiles: normCmFiles.length,
      trackedFiles: normTrackedFiles.length,
      inBoth: inBoth.length,
      onlyInCodeMemory,
      onlyInTracked,
      synchronized: onlyInTracked.length === 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Compare tracked files with CodeMemory index.
   */
  public static async compare(workspacePath?: string): Promise<string> {
    const report = await this.sync(workspacePath);
    const lines: string[] = [];

    lines.push('CodeMemory ⇄ Repository File Tracking');
    lines.push('────────────────────────────────────────');
    lines.push(`• CodeMemory indexed files: ${report.codeMemoryFiles}`);
    lines.push(`• Repository tracked files: ${report.trackedFiles}`);
    lines.push(`• Indexed & tracked in both: ${report.inBoth}`);
    lines.push(`• Status: ${report.synchronized ? 'Synchronized' : 'Untracked files exist'}`);
    lines.push('────────────────────────────────────────');

    if (report.onlyInTracked.length > 0) {
      lines.push('Files not yet indexed by CodeMemory:');
      for (const file of report.onlyInTracked.slice(0, 10)) {
        lines.push(`  • ${file}`);
      }
      if (report.onlyInTracked.length > 10) {
        lines.push(`  ... and ${report.onlyInTracked.length - 10} more`);
      }
    }

    return lines.join('\n');
  }

  private static async queryFile(file: string, cwd: string): Promise<any> {
    const output = await this.execAsync(`npx @eldrex/codememory query "${file}" --format json`, cwd);
    return JSON.parse(output);
  }

  private static async queryDependencies(file: string, cwd: string): Promise<any> {
    const output = await this.execAsync(`npx @eldrex/codememory query "${file}" --dependencies --format json`, cwd);
    return JSON.parse(output);
  }

  private static async queryRecentChanges(file: string, cwd: string): Promise<any[]> {
    const output = await this.execAsync(`npx @eldrex/codememory query "${file}" --changes --format json`, cwd);
    return JSON.parse(output);
  }

  private static execAsync(command: string, cwd: string = process.cwd()): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout.trim());
      });
    });
  }
}
