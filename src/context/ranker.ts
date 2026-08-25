import fs from 'node:fs';
import path from 'node:path';
import type { CodeMemoryDB } from '../db/database.js';
import type { ChangeAwareContext, SkillInstructionRecord, ExtractedCommand } from '../types/index.js';
import { SecurityScanner } from '../security/scanner.js';

export interface ContextQueryOptions {
  task?: string;
  file?: string;
  target?: string;
  tokenBudget?: number;
}

export class ContextEngine {
  private readonly db: CodeMemoryDB;
  private readonly securityScanner: SecurityScanner;

  constructor(db: CodeMemoryDB) {
    this.db = db;
    this.securityScanner = new SecurityScanner();
  }

  /**
   * Approximate token count for text.
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Generate change-aware context payload matching Master Plan Section 8.4 and Addendum 2.
   */
  public getContext(options: ContextQueryOptions): ChangeAwareContext {
    const { task, file: focusFile, target, tokenBudget = 4000 } = options;

    let targetFile = focusFile;
    if (!targetFile && target) {
      const sym = this.db.getSymbolByName(target);
      if (sym && sym.filePath) {
        targetFile = sym.filePath;
      }
    }

    // 1. Direct and Indirect Dependencies
    const directDeps: Array<{ symbol: string; path: string; relation: string }> = [];
    const indirectDeps: Array<{ symbol: string; path: string; relation: string }> = [];
    const relatedFiles = new Set<string>();

    if (targetFile) {
      relatedFiles.add(targetFile);
      const rawDeps = this.db.getDependenciesForFile(targetFile);
      for (const d of rawDeps) {
        directDeps.push({
          symbol: d.target_symbol_name,
          path: d.target_path || d.import_path,
          relation: `imports ${d.target_symbol_name}`,
        });
        if (d.target_path) relatedFiles.add(d.target_path);
      }

      // Upstream callers
      const rawDependents = this.db.getDependentsForFile(targetFile);
      for (const d of rawDependents) {
        indirectDeps.push({
          symbol: d.target_symbol_name,
          path: d.source_path,
          relation: `called by ${path.basename(d.source_path)}`,
        });
        if (d.source_path) relatedFiles.add(d.source_path);
      }
    }

    // 2. Recent Changes & Hotspots
    const recentChangesRaw = this.db.getRecentChanges(20);
    const recentChanges = recentChangesRaw
      .filter((c) => (targetFile ? relatedFiles.has(c.path) || c.path === targetFile : true))
      .slice(0, 10)
      .map((c) => ({
        file: c.path,
        change: c.eventType,
        timestamp: c.timestamp,
      }));

    // 3. Related Tests
    const relatedTests = targetFile ? this.db.getRelatedTests(targetFile) : [];

    // 4. Namespaced Plugin & Core Annotations
    const annotations: Array<{ source: string; key: string; value: string; confidence?: number }> = [];
    if (targetFile) {
      const fileAnnotations = this.db.getAnnotationsForFile(targetFile);
      for (const a of fileAnnotations) {
        annotations.push({
          source: a.source,
          key: a.key,
          value: a.value,
          confidence: a.confidence,
        });
      }
    }

    // 5. Skills & Agent Instructions relevant to task
    let skillInstructions: Array<{ file: string; section: string; content: string; commands?: ExtractedCommand[] }> | undefined;
    if (task) {
      const matchingSkills = this.db.searchSkillInstructions(task);
      if (matchingSkills.length > 0) {
        skillInstructions = matchingSkills.slice(0, 3).map((s) => ({
          file: s.filePath,
          section: s.section,
          content: s.content,
          commands: s.commands,
        }));
      }
    }

    // 6. Code Snippets within token budget
    const codeSnippets: Array<{ path: string; content: string; estimated_tokens: number }> = [];
    let tokensUsed = 300; // estimated structural overhead

    const filesToRead = Array.from(relatedFiles).slice(0, 5);
    for (const f of filesToRead) {
      try {
        if (fs.existsSync(f)) {
          const rawContent = fs.readFileSync(f, 'utf8');
          const redacted = this.securityScanner.redactSecrets(rawContent);
          const snippetTokens = this.estimateTokens(redacted);

          if (tokensUsed + snippetTokens <= tokenBudget) {
            tokensUsed += snippetTokens;
            codeSnippets.push({
              path: f,
              content: redacted,
              estimated_tokens: snippetTokens,
            });
          }
        }
      } catch {
        // Skip unreadable files
      }
    }

    return {
      focus: targetFile,
      task,
      direct_dependencies: directDeps,
      indirect_dependencies: indirectDeps,
      recent_changes: recentChanges,
      related_tests: relatedTests,
      annotations: annotations.length > 0 ? annotations : undefined,
      skill_instructions: skillInstructions,
      code_snippets: codeSnippets,
      generated_at: new Date().toISOString(),
    };
  }
}
