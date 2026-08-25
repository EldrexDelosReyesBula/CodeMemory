import crypto from 'node:crypto';
import type { SymbolRecord, DependencyRecord, SymbolKind, DependencyType } from '../types/index.js';
import { detectLanguage } from './languages.js';

export interface ParseResult {
  language: string;
  symbols: Omit<SymbolRecord, 'fileId'>[];
  dependencies: Omit<DependencyRecord, 'sourceFileId'>[];
  checksum: string;
  sizeBytes: number;
}

export class CodeExtractor {
  /**
   * Parse source code content and extract symbols & dependencies.
   */
  public parseFile(filePath: string, content: string): ParseResult {
    const language = detectLanguage(filePath);
    const checksum = crypto.createHash('sha256').update(content).digest('hex');
    const sizeBytes = Buffer.byteLength(content, 'utf8');

    const lines = content.split('\n');
    const symbols: Omit<SymbolRecord, 'fileId'>[] = [];
    const dependencies: Omit<DependencyRecord, 'sourceFileId'>[] = [];

    switch (language) {
      case 'typescript':
      case 'javascript':
        this.extractTypeScript(lines, symbols, dependencies);
        break;
      case 'python':
        this.extractPython(lines, symbols, dependencies);
        break;
      case 'rust':
        this.extractRust(lines, symbols, dependencies);
        break;
      case 'go':
        this.extractGo(lines, symbols, dependencies);
        break;
      case 'sql':
        this.extractSQL(lines, symbols, dependencies);
        break;
      default:
        this.extractGeneric(lines, symbols, dependencies);
        break;
    }

    return {
      language,
      symbols,
      dependencies,
      checksum,
      sizeBytes,
    };
  }

  private extractTypeScript(
    lines: string[],
    symbols: Omit<SymbolRecord, 'fileId'>[],
    dependencies: Omit<DependencyRecord, 'sourceFileId'>[]
  ): void {
    // 1. Dependencies: import ... from '...' & require('...')
    const importRegex = /import\s+(?:(?:\*\s+as\s+([a-zA-Z0-9_$]+)|{([^}]+)}|([a-zA-Z0-9_$]+))\s+from\s+)?['"]([^'"]+)['"]/g;
    const requireRegex = /(?:const|let|var)\s+(?:{([^}]+)}|([a-zA-Z0-9_$]+))\s*=\s*require\(['"]([^'"]+)['"]\)/g;

    const fullContent = lines.join('\n');
    let match: RegExpExecArray | null;

    while ((match = importRegex.exec(fullContent)) !== null) {
      const namespace = match[1];
      const namedImports = match[2];
      const defaultImport = match[3];
      const importPath = match[4];

      if (namedImports) {
        namedImports.split(',').forEach((item) => {
          const cleanName = item.trim().split(/\s+as\s+/)[0].trim();
          if (cleanName) {
            dependencies.push({
              targetSymbolName: cleanName,
              importPath,
              depType: 'import',
            });
          }
        });
      } else if (defaultImport) {
        dependencies.push({
          targetSymbolName: defaultImport.trim(),
          importPath,
          depType: 'import',
        });
      } else if (namespace) {
        dependencies.push({
          targetSymbolName: namespace.trim(),
          importPath,
          depType: 'import',
        });
      } else {
        dependencies.push({
          targetSymbolName: '*',
          importPath,
          depType: 'import',
        });
      }
    }

    while ((match = requireRegex.exec(fullContent)) !== null) {
      const namedImports = match[1];
      const defaultImport = match[2];
      const importPath = match[3];

      if (namedImports) {
        namedImports.split(',').forEach((item) => {
          const cleanName = item.trim().split(':')[0].trim();
          if (cleanName) {
            dependencies.push({
              targetSymbolName: cleanName,
              importPath,
              depType: 'require',
            });
          }
        });
      } else if (defaultImport) {
        dependencies.push({
          targetSymbolName: defaultImport.trim(),
          importPath,
          depType: 'require',
        });
      }
    }

    // 2. Symbols extraction
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      // Skip comments
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
        continue;
      }

      // Export / Public functions
      const funcMatch = /^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/.exec(trimmed);
      if (funcMatch) {
        symbols.push({
          name: funcMatch[1],
          kind: 'function',
          lineStart: lineNum,
          lineEnd: this.findBlockEnd(lines, i),
          signature: trimmed.split('{')[0].trim(),
          visibility: trimmed.startsWith('export') ? 'public' : 'internal',
        });
        continue;
      }

      // Const arrow functions
      const arrowMatch = /^(?:export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)(?:\s*:\s*([^=>]+))?\s*=>/.exec(trimmed);
      if (arrowMatch) {
        symbols.push({
          name: arrowMatch[1],
          kind: 'function',
          lineStart: lineNum,
          lineEnd: this.findBlockEnd(lines, i),
          signature: trimmed.split('=>')[0].trim() + ' => ...',
          visibility: trimmed.startsWith('export') ? 'public' : 'internal',
        });
        continue;
      }

      // Classes
      const classMatch = /^(?:export\s+)?(?:abstract\s+)?class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+([a-zA-Z0-9_$.]+))?(?:\s+implements\s+([^{]+))?/.exec(trimmed);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          lineStart: lineNum,
          lineEnd: this.findBlockEnd(lines, i),
          signature: trimmed.split('{')[0].trim(),
          visibility: trimmed.startsWith('export') ? 'public' : 'internal',
        });
        continue;
      }

      // Interfaces
      const interfaceMatch = /^(?:export\s+)?interface\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+([^{]+))?/.exec(trimmed);
      if (interfaceMatch) {
        symbols.push({
          name: interfaceMatch[1],
          kind: 'interface',
          lineStart: lineNum,
          lineEnd: this.findBlockEnd(lines, i),
          signature: trimmed.split('{')[0].trim(),
          visibility: trimmed.startsWith('export') ? 'public' : 'internal',
        });
        continue;
      }

      // Types
      const typeMatch = /^(?:export\s+)?type\s+([a-zA-Z0-9_$]+)(?:<[^>]+>)?\s*=/.exec(trimmed);
      if (typeMatch) {
        symbols.push({
          name: typeMatch[1],
          kind: 'type',
          lineStart: lineNum,
          lineEnd: lineNum,
          signature: trimmed.replace(/;$/, ''),
          visibility: trimmed.startsWith('export') ? 'public' : 'internal',
        });
        continue;
      }

      // Enums
      const enumMatch = /^(?:export\s+)?enum\s+([a-zA-Z0-9_$]+)/.exec(trimmed);
      if (enumMatch) {
        symbols.push({
          name: enumMatch[1],
          kind: 'enum',
          lineStart: lineNum,
          lineEnd: this.findBlockEnd(lines, i),
          signature: trimmed.split('{')[0].trim(),
          visibility: trimmed.startsWith('export') ? 'public' : 'internal',
        });
        continue;
      }
    }
  }

  private extractPython(
    lines: string[],
    symbols: Omit<SymbolRecord, 'fileId'>[],
    dependencies: Omit<DependencyRecord, 'sourceFileId'>[]
  ): void {
    const importRegex = /^(?:from\s+([a-zA-Z0-9_.]+)\s+import\s+(.+)|import\s+(.+))$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      if (trimmed.startsWith('#')) continue;

      // Imports
      const impMatch = importRegex.exec(trimmed);
      if (impMatch) {
        if (impMatch[1] && impMatch[2]) {
          const mod = impMatch[1];
          const imported = impMatch[2].split(',');
          for (const item of imported) {
            const clean = item.trim().split(/\s+as\s+/)[0].trim();
            if (clean) {
              dependencies.push({
                targetSymbolName: clean,
                importPath: mod,
                depType: 'import',
              });
            }
          }
        } else if (impMatch[3]) {
          const clean = impMatch[3].trim().split(/\s+as\s+/)[0].trim();
          dependencies.push({
            targetSymbolName: clean,
            importPath: clean,
            depType: 'import',
          });
        }
        continue;
      }

      // Classes
      const classMatch = /^class\s+([a-zA-Z0-9_]+)(?:\(([^)]*)\))?:/.exec(trimmed);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          lineStart: lineNum,
          lineEnd: this.findPythonBlockEnd(lines, i),
          signature: trimmed,
          visibility: classMatch[1].startsWith('_') ? 'private' : 'public',
        });
        continue;
      }

      // Functions / Methods
      const defMatch = /^(?:async\s+)?def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?:/.exec(trimmed);
      if (defMatch) {
        const isMethod = line.startsWith('    ') || line.startsWith('\t');
        symbols.push({
          name: defMatch[1],
          kind: isMethod ? 'method' : 'function',
          lineStart: lineNum,
          lineEnd: this.findPythonBlockEnd(lines, i),
          signature: trimmed,
          visibility: defMatch[1].startsWith('_') ? 'private' : 'public',
        });
        continue;
      }
    }
  }

  private extractRust(
    lines: string[],
    symbols: Omit<SymbolRecord, 'fileId'>[],
    dependencies: Omit<DependencyRecord, 'sourceFileId'>[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      if (trimmed.startsWith('//')) continue;

      // `use` statements
      const useMatch = /^use\s+([^;]+);/.exec(trimmed);
      if (useMatch) {
        const usePath = useMatch[1].trim();
        const lastPart = usePath.split('::').pop() || usePath;
        dependencies.push({
          targetSymbolName: lastPart,
          importPath: usePath,
          depType: 'use',
        });
        continue;
      }

      // Structs
      const structMatch = /^(?:pub(?:\([^)]+\))?\s+)?struct\s+([a-zA-Z0-9_]+)/.exec(trimmed);
      if (structMatch) {
        symbols.push({
          name: structMatch[1],
          kind: 'struct',
          lineStart: lineNum,
          lineEnd: this.findBlockEnd(lines, i),
          signature: trimmed.split('{')[0].trim(),
          visibility: trimmed.startsWith('pub') ? 'public' : 'internal',
        });
        continue;
      }

      // Enums
      const enumMatch = /^(?:pub(?:\([^)]+\))?\s+)?enum\s+([a-zA-Z0-9_]+)/.exec(trimmed);
      if (enumMatch) {
        symbols.push({
          name: enumMatch[1],
          kind: 'enum',
          lineStart: lineNum,
          lineEnd: this.findBlockEnd(lines, i),
          signature: trimmed.split('{')[0].trim(),
          visibility: trimmed.startsWith('pub') ? 'public' : 'internal',
        });
        continue;
      }

      // Traits
      const traitMatch = /^(?:pub(?:\([^)]+\))?\s+)?trait\s+([a-zA-Z0-9_]+)/.exec(trimmed);
      if (traitMatch) {
        symbols.push({
          name: traitMatch[1],
          kind: 'interface',
          lineStart: lineNum,
          lineEnd: this.findBlockEnd(lines, i),
          signature: trimmed.split('{')[0].trim(),
          visibility: trimmed.startsWith('pub') ? 'public' : 'internal',
        });
        continue;
      }

      // Functions
      const fnMatch = /^(?:pub(?:\([^)]+\))?\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)/.exec(trimmed);
      if (fnMatch) {
        symbols.push({
          name: fnMatch[1],
          kind: 'function',
          lineStart: lineNum,
          lineEnd: this.findBlockEnd(lines, i),
          signature: trimmed.split('{')[0].trim(),
          visibility: trimmed.startsWith('pub') ? 'public' : 'internal',
        });
        continue;
      }
    }
  }

  private extractGo(
    lines: string[],
    symbols: Omit<SymbolRecord, 'fileId'>[],
    dependencies: Omit<DependencyRecord, 'sourceFileId'>[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      if (trimmed.startsWith('//')) continue;

      // Imports
      const impMatch = /^import\s+(?:\(([^)]+)\)|"([^"]+)")/.exec(trimmed);
      if (impMatch) {
        if (impMatch[2]) {
          dependencies.push({
            targetSymbolName: impMatch[2].split('/').pop() || impMatch[2],
            importPath: impMatch[2],
            depType: 'import',
          });
        }
      }

      // Structs / Types
      const typeMatch = /^type\s+([a-zA-Z0-9_]+)\s+(struct|interface)/.exec(trimmed);
      if (typeMatch) {
        symbols.push({
          name: typeMatch[1],
          kind: typeMatch[2] === 'struct' ? 'struct' : 'interface',
          lineStart: lineNum,
          lineEnd: this.findBlockEnd(lines, i),
          signature: trimmed.split('{')[0].trim(),
          visibility: /^[A-Z]/.test(typeMatch[1]) ? 'public' : 'internal',
        });
        continue;
      }

      // Functions / Methods
      const funcMatch = /^func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(/.exec(trimmed);
      if (funcMatch) {
        symbols.push({
          name: funcMatch[1],
          kind: 'function',
          lineStart: lineNum,
          lineEnd: this.findBlockEnd(lines, i),
          signature: trimmed.split('{')[0].trim(),
          visibility: /^[A-Z]/.test(funcMatch[1]) ? 'public' : 'internal',
        });
        continue;
      }
    }
  }

  private extractSQL(
    lines: string[],
    symbols: Omit<SymbolRecord, 'fileId'>[],
    dependencies: Omit<DependencyRecord, 'sourceFileId'>[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      const tableMatch = /CREATE\s+(?:OR\s+REPLACE\s+)?(?:TABLE|VIEW)\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_`".]+)/i.exec(trimmed);
      if (tableMatch) {
        symbols.push({
          name: tableMatch[1].replace(/[`"]/g, ''),
          kind: 'struct',
          lineStart: lineNum,
          lineEnd: lineNum,
          signature: trimmed,
          visibility: 'public',
        });
      }
    }
  }

  private extractGeneric(
    lines: string[],
    symbols: Omit<SymbolRecord, 'fileId'>[],
    dependencies: Omit<DependencyRecord, 'sourceFileId'>[]
  ): void {
    // Fallback heuristic: search for functions and class keywords
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      const lineNum = i + 1;

      const genericMatch = /^(?:class|struct|function|def|fn)\s+([a-zA-Z0-9_$]+)/i.exec(trimmed);
      if (genericMatch) {
        symbols.push({
          name: genericMatch[1],
          kind: 'function',
          lineStart: lineNum,
          lineEnd: lineNum,
          signature: trimmed,
          visibility: 'public',
        });
      }
    }
  }

  private findBlockEnd(lines: string[], startIndex: number): number {
    let openBraces = 0;
    let foundOpen = false;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === '{') {
          openBraces++;
          foundOpen = true;
        } else if (char === '}') {
          openBraces--;
          if (foundOpen && openBraces <= 0) {
            return i + 1;
          }
        }
      }
    }
    return startIndex + 1;
  }

  private findPythonBlockEnd(lines: string[], startIndex: number): number {
    const baseIndent = lines[startIndex].search(/\S/);
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // skip blank lines
      const indent = line.search(/\S/);
      if (indent <= baseIndent) {
        return i;
      }
    }
    return lines.length;
  }
}
