/**
 * Domain model types and contracts for CodeMemory
 */

export type SymbolKind =
  | 'function'
  | 'class'
  | 'method'
  | 'interface'
  | 'type'
  | 'variable'
  | 'constant'
  | 'struct'
  | 'enum'
  | 'module';

export type DependencyType =
  | 'import'
  | 'call'
  | 'inheritance'
  | 'type_reference'
  | 'file'
  | 'require'
  | 'use';

export type ChangeEventType = 'created' | 'modified' | 'deleted' | 'renamed';

export type EntityType = 'file' | 'symbol' | 'dependency' | 'repository';

export interface FileRecord {
  id?: number;
  path: string;
  language: string;
  createdAt?: string;
  lastModified: number;
  sizeBytes: number;
  checksum: string;
  isBinary?: boolean;
  ignored?: boolean;
}

export interface SymbolRecord {
  id?: number;
  fileId: number;
  filePath?: string;
  name: string;
  kind: SymbolKind;
  signature?: string;
  docstring?: string;
  lineStart: number;
  lineEnd: number;
  columnStart?: number;
  columnEnd?: number;
  visibility?: string;
  isExported?: boolean;
  parentSymbolId?: number;
  summary?: string;
  checksum?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DependencyRecord {
  id?: number;
  sourceFileId: number;
  targetFileId?: number;
  sourceSymbolId?: number;
  targetSymbolName: string;
  importPath: string;
  depType: DependencyType;
  fileLevel?: boolean;
  createdAt?: string;
}

export interface ChangeRecord {
  id?: number;
  fileId?: number;
  path: string;
  timestamp: string;
  eventType: ChangeEventType;
  commitHash?: string;
  gitAuthor?: string;
  gitMessage?: string;
  diffSummary?: string;
  impactScore?: number;
}

export interface HotspotRecord {
  path: string;
  changeCount: number;
  lastModified: string;
  impactScore: number;
}

export interface AnnotationRecord {
  id?: number;
  entityType: EntityType;
  entityId: number;
  key: string;
  value: string;
  source: string;
  confidence?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RelationshipRecord {
  id?: number;
  sourceEntityType: EntityType;
  sourceEntityId: number;
  targetEntityType: EntityType;
  targetEntityId: number;
  relationshipType: string;
  source: string;
  metadata?: string;
  createdAt?: string;
}

export interface ExtractedCommand {
  command: string;
  description: string;
  safe: boolean;
  requiresApproval?: boolean;
}

export interface SkillInstructionRecord {
  id?: number;
  filePath: string;
  toolTarget: string; // 'generic' | 'claude' | 'cursor' | 'copilot' | 'gemini'
  section: string;
  headingLevel?: number;
  content: string;
  commands?: ExtractedCommand[];
  lineStart?: number;
  lineEnd?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArchitectureSnapshot {
  id?: number;
  timestamp?: string;
  mermaidDiagram: string;
  metricsJson: string;
}

export interface CodebaseMetrics {
  totalFiles: number;
  totalSymbols: number;
  totalDependencies: number;
  languages: Record<string, number>;
  symbolKinds: Record<string, number>;
  lastScanTimestamp: string;
}

export interface QueryOptions {
  query?: string;
  kind?: SymbolKind;
  language?: string;
  limit?: number;
}

export interface ChangeAwareContext {
  focus?: string;
  task?: string;
  direct_dependencies: Array<{ symbol: string; path: string; relation: string }>;
  indirect_dependencies: Array<{ symbol: string; path: string; relation: string }>;
  recent_changes: Array<{ file: string; change: string; timestamp: string }>;
  related_tests: string[];
  annotations?: Array<{ source: string; key: string; value: string; confidence?: number }>;
  skill_instructions?: Array<{ file: string; section: string; content: string; commands?: ExtractedCommand[] }>;
  code_snippets?: Array<{ path: string; content: string; estimated_tokens: number }>;
  generated_at: string;
}
