/**
 * CodeMemory Domain Model & Plugin Engine
 * Core principle: CodeMemory owns persistence; plugins contribute through the Domain Model.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { CodeMemoryDB } from '../db/database.js';
import type { EntityType, FileRecord, SymbolRecord, DependencyRecord, ChangeRecord } from '../types/index.js';
import type { ParseResult } from '../parser/extractor.js';
import { SecurityScanner } from '../security/scanner.js';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  apiVersion: string;
  author?: { name?: string; email?: string };
  hooks?: {
    on_file_parsed?: boolean;
    on_symbol_extracted?: boolean;
    on_dependency_detected?: boolean;
    on_change_recorded?: boolean;
    on_analysis_requested?: boolean;
  };
  config?: Record<string, any>;
  enabled?: boolean;
}

export type PluginContribution =
  | {
      type: 'annotation';
      entityType: EntityType;
      entityId: number;
      key: string;
      value: string | Record<string, any>;
      confidence?: number;
    }
  | {
      type: 'relationship';
      sourceEntityType: EntityType;
      sourceEntityId: number;
      targetEntityType: EntityType;
      targetEntityId: number;
      relationshipType: string;
      metadata?: Record<string, any>;
    }
  | {
      type: 'repository_metadata';
      key: string;
      value: any;
    };

export interface PluginContext {
  db: CodeMemoryDB;
  rootDir: string;
  config: Record<string, any>;
  logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
}

export interface CodeMemoryPlugin {
  manifest: PluginManifest;
  onLoad?(context: PluginContext): Promise<void> | void;
  onFileParsed?(context: PluginContext, file: FileRecord, parseResult: ParseResult): Promise<PluginContribution[] | void> | PluginContribution[] | void;
  onSymbolExtracted?(context: PluginContext, symbol: SymbolRecord): Promise<PluginContribution[] | void> | PluginContribution[] | void;
  onDependencyDetected?(context: PluginContext, dependency: DependencyRecord): Promise<PluginContribution[] | void> | PluginContribution[] | void;
  onChangeRecorded?(context: PluginContext, change: ChangeRecord): Promise<PluginContribution[] | void> | PluginContribution[] | void;
  onAnalysisRequested?(context: PluginContext, scope?: any): Promise<PluginContribution[] | void> | PluginContribution[] | void;
}

export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, CodeMemoryPlugin> = new Map();
  private db: CodeMemoryDB | null = null;
  private rootDir: string = process.cwd();

  public static getInstance(db?: CodeMemoryDB): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    if (db) {
      PluginRegistry.instance.db = db;
    }
    return PluginRegistry.instance;
  }

  constructor() {
    this.registerBuiltInPlugins();
  }

  private registerBuiltInPlugins(): void {
    // 1. Built-in Security Scanner Plugin
    const securityPlugin: CodeMemoryPlugin = {
      manifest: {
        id: 'security-scanner',
        name: 'Core Security Scanner',
        version: '1.0.0',
        apiVersion: '1.0',
        hooks: { on_file_parsed: true },
        enabled: true,
      },
      onFileParsed: (ctx, file, parseResult) => {
        const scanner = new SecurityScanner();
        // Check file content for secrets
        const findings = scanner.scanForSecrets(file.path, '');
        if (findings.length > 0 && file.id) {
          return findings.map((f) => ({
            type: 'annotation',
            entityType: 'file',
            entityId: file.id!,
            key: 'security_vulnerability',
            value: JSON.stringify({
              type: f.type,
              line: f.line,
              description: f.description,
            }),
            confidence: 0.95,
          }));
        }
      },
    };

    this.register(securityPlugin);
  }

  public register(plugin: CodeMemoryPlugin): void {
    this.plugins.set(plugin.manifest.id, plugin);
  }

  public getPlugin(id: string): CodeMemoryPlugin | undefined {
    return this.plugins.get(id);
  }

  public listPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map((p) => p.manifest);
  }

  public enablePlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    plugin.manifest.enabled = true;
    return true;
  }

  public disablePlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    plugin.manifest.enabled = false;
    return true;
  }

  public removePlugin(id: string, db?: CodeMemoryDB): { removed: boolean; annotationsRemoved: number; relationshipsRemoved: number } {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      return { removed: false, annotationsRemoved: 0, relationshipsRemoved: 0 };
    }

    this.plugins.delete(id);
    const targetDb = db || this.db;
    if (targetDb) {
      const purgeStats = targetDb.removePluginData(id);
      return { removed: true, ...purgeStats };
    }
    return { removed: true, annotationsRemoved: 0, relationshipsRemoved: 0 };
  }

  /**
   * Safe execution and validation pipeline for plugin contributions.
   */
  public async applyContributions(pluginId: string, contributions: PluginContribution[] | void, db: CodeMemoryDB): Promise<number> {
    if (!contributions || !Array.isArray(contributions)) return 0;
    let appliedCount = 0;

    for (const contrib of contributions) {
      if (contrib.type === 'annotation') {
        const valStr = typeof contrib.value === 'string' ? contrib.value : JSON.stringify(contrib.value);
        db.addAnnotation({
          entityType: contrib.entityType,
          entityId: contrib.entityId,
          key: contrib.key,
          value: valStr,
          source: pluginId,
          confidence: contrib.confidence,
        });
        appliedCount++;
      } else if (contrib.type === 'relationship') {
        const metaStr = contrib.metadata ? JSON.stringify(contrib.metadata) : undefined;
        db.addRelationship({
          sourceEntityType: contrib.sourceEntityType,
          sourceEntityId: contrib.sourceEntityId,
          targetEntityType: contrib.targetEntityType,
          targetEntityId: contrib.targetEntityId,
          relationshipType: contrib.relationshipType,
          source: pluginId,
          metadata: metaStr,
        });
        appliedCount++;
      }
    }

    return appliedCount;
  }

  /**
   * Broadcast file parsed event across enabled plugins.
   */
  public async triggerOnFileParsed(file: FileRecord, parseResult: ParseResult, db: CodeMemoryDB): Promise<void> {
    const context: PluginContext = {
      db,
      rootDir: this.rootDir,
      config: {},
      logger: {
        info: (msg) => console.error(`[Plugin Info] ${msg}`),
        warn: (msg) => console.error(`[Plugin Warn] ${msg}`),
        error: (msg) => console.error(`[Plugin Error] ${msg}`),
      },
    };

    for (const [id, plugin] of this.plugins.entries()) {
      if (plugin.manifest.enabled === false) continue;
      if (plugin.manifest.hooks?.on_file_parsed && plugin.onFileParsed) {
        try {
          const contribs = await plugin.onFileParsed(context, file, parseResult);
          await this.applyContributions(id, contribs, db);
        } catch (err: any) {
          console.error(`[Plugin ${id}] Error in onFileParsed:`, err.message);
        }
      }
    }
  }
}
