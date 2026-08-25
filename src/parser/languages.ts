import path from 'node:path';

export interface LanguageDef {
  id: string;
  name: string;
  extensions: string[];
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageDef> = {
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    extensions: ['.ts', '.tsx', '.mts', '.cts', '.d.ts'],
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    extensions: ['.js', '.jsx', '.mjs', '.cjs'],
  },
  python: {
    id: 'python',
    name: 'Python',
    extensions: ['.py', '.pyi', '.pyw'],
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    extensions: ['.rs'],
  },
  go: {
    id: 'go',
    name: 'Go',
    extensions: ['.go'],
  },
  java: {
    id: 'java',
    name: 'Java',
    extensions: ['.java'],
  },
  cpp: {
    id: 'cpp',
    name: 'C/C++',
    extensions: ['.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.hxx'],
  },
  csharp: {
    id: 'csharp',
    name: 'C#',
    extensions: ['.cs'],
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    extensions: ['.rb'],
  },
  php: {
    id: 'php',
    name: 'PHP',
    extensions: ['.php'],
  },
  swift: {
    id: 'swift',
    name: 'Swift',
    extensions: ['.swift'],
  },
  kotlin: {
    id: 'kotlin',
    name: 'Kotlin',
    extensions: ['.kt', '.kts'],
  },
  sql: {
    id: 'sql',
    name: 'SQL',
    extensions: ['.sql'],
  },
  markdown: {
    id: 'markdown',
    name: 'Markdown',
    extensions: ['.md', '.mdx'],
  },
  json: {
    id: 'json',
    name: 'JSON',
    extensions: ['.json', '.jsonc'],
  },
  yaml: {
    id: 'yaml',
    name: 'YAML',
    extensions: ['.yaml', '.yml'],
  },
};

export function detectLanguage(filePath: string): string {
  const base = path.basename(filePath).toLowerCase();
  if (base.endsWith('.d.ts')) return 'typescript';

  const ext = path.extname(filePath).toLowerCase();
  for (const lang of Object.values(SUPPORTED_LANGUAGES)) {
    if (lang.extensions.includes(ext)) {
      return lang.id;
    }
  }

  // Common extensionless configuration files
  if (base === 'dockerfile') return 'dockerfile';
  if (base === 'makefile') return 'makefile';

  return 'unknown';
}
