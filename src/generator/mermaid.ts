import type { CodeMemoryDB } from '../db/database.js';

export interface MermaidOptions {
  direction?: 'TD' | 'LR';
  maxNodes?: number;
  focusModule?: string;
  includeSymbols?: boolean;
}

export class MermaidGenerator {
  private readonly db: CodeMemoryDB;

  constructor(db: CodeMemoryDB) {
    this.db = db;
  }

  /**
   * Generate Mermaid architecture diagram illustrating module connections and symbols.
   */
  public generateArchitectureDiagram(options: MermaidOptions = {}): string {
    const { direction = 'TD', maxNodes = 40, focusModule, includeSymbols = true } = options;
    const files = this.db.getAllFiles();

    if (files.length === 0) {
      return '```mermaid\ngraph TD\n  Empty["No indexed files in CodeMemory database"]\n```';
    }

    const lines: string[] = [];
    lines.push('```mermaid');
    lines.push(`graph ${direction}`);

    // Map files into clean node IDs
    const fileIdMap = new Map<string, string>();
    const activeFiles = files.slice(0, maxNodes);

    activeFiles.forEach((file, index) => {
      const nodeId = `N${index + 1}`;
      fileIdMap.set(file.path, nodeId);

      const symbols = includeSymbols ? this.db.getSymbolsForFile(file.path).slice(0, 4) : [];
      let label = `<b>${file.path}</b>`;
      if (symbols.length > 0) {
        const symbolList = symbols.map((s) => `+ ${s.name} (${s.kind})`).join('<br/>');
        label += `<br/><small>${symbolList}</small>`;
      }

      lines.push(`  ${nodeId}["${label}"]`);
    });

    // Add edges for dependencies
    const edgeSet = new Set<string>();
    for (const file of activeFiles) {
      const sourceNode = fileIdMap.get(file.path);
      if (!sourceNode) continue;

      const deps = this.db.getDependenciesForFile(file.path);
      for (const dep of deps) {
        if (dep.target_path && fileIdMap.has(dep.target_path)) {
          const targetNode = fileIdMap.get(dep.target_path);
          const edgeKey = `${sourceNode}-->${targetNode}`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            lines.push(`  ${sourceNode} -->|imports ${dep.target_symbol_name}| ${targetNode}`);
          }
        }
      }
    }

    lines.push('```');
    return lines.join('\n');
  }

  /**
   * Generate Class Diagram in Mermaid for object-oriented structures.
   */
  public generateClassDiagram(filePath?: string): string {
    const lines: string[] = [];
    lines.push('```mermaid');
    lines.push('classDiagram');

    const files = filePath ? [{ path: filePath }] : this.db.getAllFiles().slice(0, 15);

    for (const f of files) {
      const symbols = this.db.getSymbolsForFile(f.path);
      const classes = symbols.filter((s) => s.kind === 'class' || s.kind === 'interface' || s.kind === 'struct');

      for (const cls of classes) {
        lines.push(`  class ${cls.name} {`);
        if (cls.signature) {
          lines.push(`    +${cls.signature}`);
        }
        lines.push('  }');
      }
    }

    lines.push('```');
    return lines.join('\n');
  }
}
