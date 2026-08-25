/**
 * SQLite Database Schema and DDL definitions for CodeMemory
 * Configured with WAL mode and custom indexes for <50ms query response.
 * Includes Core Entities + Plugin Namespaced Data + Skill Instructions.
 */

export const SCHEMA_VERSION = '1.0.0';

export const INITIAL_SCHEMA_SQL = `
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- 1. Schema Info
CREATE TABLE IF NOT EXISTS schema_info (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tracked Files Table
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    language TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified INTEGER NOT NULL,
    size_bytes INTEGER NOT NULL,
    checksum TEXT NOT NULL,
    is_binary INTEGER DEFAULT 0,
    ignored INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
CREATE INDEX IF NOT EXISTS idx_files_language ON files(language);

-- 3. Extracted Code Symbols
CREATE TABLE IF NOT EXISTS symbols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    signature TEXT,
    docstring TEXT,
    line_start INTEGER NOT NULL,
    line_end INTEGER NOT NULL,
    column_start INTEGER DEFAULT 0,
    column_end INTEGER DEFAULT 0,
    visibility TEXT DEFAULT 'public',
    is_exported INTEGER DEFAULT 0,
    parent_symbol_id INTEGER REFERENCES symbols(id) ON DELETE CASCADE,
    summary TEXT,
    checksum TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_symbols_file_id ON symbols(file_id);
CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name);
CREATE INDEX IF NOT EXISTS idx_symbols_kind ON symbols(kind);
CREATE INDEX IF NOT EXISTS idx_symbols_parent ON symbols(parent_symbol_id);

-- 4. Dependency & Relationship Graph
CREATE TABLE IF NOT EXISTS dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    target_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL,
    source_symbol_id INTEGER REFERENCES symbols(id) ON DELETE CASCADE,
    target_symbol_name TEXT NOT NULL,
    import_path TEXT NOT NULL,
    dep_type TEXT NOT NULL,
    file_level INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dependencies_source_file ON dependencies(source_file_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_target_file ON dependencies(target_file_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_target_symbol ON dependencies(target_symbol_name);

-- 5. Change History & Evolution Log
CREATE TABLE IF NOT EXISTS changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER REFERENCES files(id) ON DELETE SET NULL,
    path TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,
    commit_hash TEXT,
    git_author TEXT,
    git_message TEXT,
    diff_summary TEXT,
    impact_score REAL DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS idx_changes_path ON changes(path);
CREATE INDEX IF NOT EXISTS idx_changes_timestamp ON changes(timestamp);

-- 6. Architecture Snapshots
CREATE TABLE IF NOT EXISTS architecture_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mermaid_diagram TEXT NOT NULL,
    metrics_json TEXT NOT NULL
);

-- 7. Configuration Store
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 8. Domain Model: Namespaced Annotations (Extensible by Plugins & Core)
CREATE TABLE IF NOT EXISTS annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,       -- 'file', 'symbol', 'dependency', 'repository'
    entity_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,             -- serialized JSON or plain text
    source TEXT NOT NULL,            -- 'core', 'ollama', or plugin identifier
    confidence REAL,                 -- 0.0 to 1.0
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, entity_id, key, source)
);

CREATE INDEX IF NOT EXISTS idx_annotations_entity ON annotations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_annotations_source ON annotations(source);

-- 9. Domain Model: Extensible Custom Relationships
CREATE TABLE IF NOT EXISTS relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_entity_type TEXT NOT NULL,
    source_entity_id INTEGER NOT NULL,
    target_entity_type TEXT NOT NULL,
    target_entity_id INTEGER NOT NULL,
    relationship_type TEXT NOT NULL,
    source TEXT NOT NULL,            -- 'core' or plugin identifier
    metadata TEXT,                   -- JSON metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_entity_type, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_entity_type, target_entity_id);

-- 10. Agent Skills & Instruction Entity Store
CREATE TABLE IF NOT EXISTS skill_instructions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL,         -- 'SKILLS.md', 'AGENTS.md', etc.
    tool_target TEXT NOT NULL DEFAULT 'generic', -- 'generic', 'claude', 'cursor', 'copilot'
    section TEXT NOT NULL,           -- 'Commands', 'Architecture', 'Conventions'
    heading_level INTEGER DEFAULT 2,
    content TEXT NOT NULL,
    commands TEXT,                   -- JSON array of extracted shell commands
    line_start INTEGER,
    line_end INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_path, section)
);

CREATE INDEX IF NOT EXISTS idx_skills_file ON skill_instructions(file_path);
CREATE INDEX IF NOT EXISTS idx_skills_section ON skill_instructions(section);
CREATE INDEX IF NOT EXISTS idx_skills_target ON skill_instructions(tool_target);
`;
