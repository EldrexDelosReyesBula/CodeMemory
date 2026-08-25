import fs from 'node:fs';
import path from 'node:path';

export interface CodeMemoryConfig {
  watch: {
    debounceMs: number;
    ignorePaths: string[];
    additionalIgnore: string[];
  };
  storage: {
    location: string;
    compression: boolean;
    maxDatabaseSizeMb: number;
  };
  git: {
    enabled: boolean;
    trackHistory: boolean;
    maxCommitsStored: number;
  };
  parsing: {
    languages: string[];
    maxFileSizeKb: number;
    skipBinary: boolean;
  };
  ollama: {
    enabled: boolean;
    model: string;
    baseUrl: string;
    generateSummaries: boolean;
    generateArchitectureDescriptions: boolean;
    maxTokensPerSummary: number;
  };
  mcp: {
    enabled: boolean;
    port: number;
    host: string;
  };
  export: {
    includeGitMetadata: boolean;
    mermaidDirection: 'TD' | 'LR';
  };
}

export const DEFAULT_CONFIG: CodeMemoryConfig = {
  watch: {
    debounceMs: 100,
    ignorePaths: ['node_modules', 'dist', 'build', 'target', '.git', 'vendor', '.codememory'],
    additionalIgnore: ['*.generated.ts', '*.min.js', '*.lock'],
  },
  storage: {
    location: '.codememory',
    compression: true,
    maxDatabaseSizeMb: 500,
  },
  git: {
    enabled: true,
    trackHistory: true,
    maxCommitsStored: 1000,
  },
  parsing: {
    languages: ['typescript', 'javascript', 'python', 'rust', 'go', 'sql'],
    maxFileSizeKb: 500,
    skipBinary: true,
  },
  ollama: {
    enabled: false,
    model: 'llama3.2',
    baseUrl: 'http://localhost:11434',
    generateSummaries: false,
    generateArchitectureDescriptions: false,
    maxTokensPerSummary: 100,
  },
  mcp: {
    enabled: true,
    port: 0,
    host: '127.0.0.1',
  },
  export: {
    includeGitMetadata: true,
    mermaidDirection: 'TD',
  },
};

export class ConfigManager {
  private config: CodeMemoryConfig;
  private readonly rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.config = this.loadConfig();
  }

  public getConfig(): CodeMemoryConfig {
    return this.config;
  }

  private loadConfig(): CodeMemoryConfig {
    const jsonPath = path.join(this.rootDir, '.codememory.json');
    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, 'utf8');
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      } catch {
        // Fall back to default
      }
    }

    const tomlPath = path.join(this.rootDir, '.codememory.toml');
    if (fs.existsSync(tomlPath)) {
      try {
        const content = fs.readFileSync(tomlPath, 'utf8');
        return this.parseSimpleToml(content);
      } catch {
        // Fall back to default
      }
    }

    return DEFAULT_CONFIG;
  }

  public saveConfig(newConfig: Partial<CodeMemoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    const jsonPath = path.join(this.rootDir, '.codememory.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.config, null, 2), 'utf8');
  }

  private parseSimpleToml(content: string): CodeMemoryConfig {
    // Basic TOML parser fallback for standard codememory.toml format
    const cfg = { ...DEFAULT_CONFIG };
    const lines = content.split('\n');
    let currentSection = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const secMatch = /^\[([a-zA-Z0-9_]+)\]$/.exec(line);
      if (secMatch) {
        currentSection = secMatch[1];
        continue;
      }

      const kvMatch = /^([a-zA-Z0-9_]+)\s*=\s*(.+)$/.exec(line);
      if (kvMatch) {
        const key = kvMatch[1];
        let val: any = kvMatch[2].trim();

        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (/^\d+$/.test(val)) val = parseInt(val, 10);
        else if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);

        if (currentSection === 'ollama' && key === 'enabled') cfg.ollama.enabled = Boolean(val);
        if (currentSection === 'watch' && key === 'debounce_ms') cfg.watch.debounceMs = Number(val);
        if (currentSection === 'git' && key === 'enabled') cfg.git.enabled = Boolean(val);
      }
    }

    return cfg;
  }
}
