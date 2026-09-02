/**
 * @eldrex/plugin-codememory
 *
 * Integration plugin between DevDiff and CodeMemory.
 * Enables DevDiff to access AST symbols and dependency information from CodeMemory,
 * and allows recording change logs back into CodeMemory persistence.
 */

import type {
  DevDiffPlugin,
  PluginContext,
  ParsedDiff,
  ProjectContext,
  ChangelogResult,
  ChangedFile,
  GitCommit,
} from '@eldrex/plugin-sdk';
import { CodeMemoryBridge } from '../../../src/devdiff/bridge.js';

export { CodeMemoryBridge } from '../../../src/devdiff/bridge.js';

let pluginContext: PluginContext | null = null;

export const CodeMemoryPlugin: DevDiffPlugin = {
  id: '@eldrex/plugin-codememory',
  name: 'CodeMemory Integration',
  version: '2.0.0',
  description: 'Integration plugin between DevDiff and CodeMemory for structural AST context and change history',
  author: {
    name: 'Eldrex Delos Reyes Bula',
    email: 'eldrexdelosreyesbula@gmail.com',
    url: 'https://codemem.vercel.app',
  },
  devdiffVersion: '>=1.0.0',

  activate: async (context: PluginContext) => {
    pluginContext = context;
    context.logger.info('CodeMemory integration plugin initialized.');
  },

  deactivate: async () => {
    pluginContext = null;
  },

  hooks: {
    /**
     * Before DevDiff performs AI analysis, provide structural AST context,
     * caller trees, dependencies, and skill instructions.
     */
    beforeAnalysis: async (diff: ParsedDiff, context: ProjectContext): Promise<ParsedDiff | void> => {
      const filePaths: string[] = [];

      if (diff.files && Array.isArray(diff.files)) {
        for (const file of diff.files) {
          const p = file.newPath || file.oldPath || file.path;
          if (p) filePaths.push(p);
        }
      }

      if (filePaths.length === 0) return diff;

      try {
        const structuralMemory = await CodeMemoryBridge.query({
          files: filePaths,
          includeDependencies: true,
          includeRecentChanges: true,
          includeSymbols: true,
          workspacePath: pluginContext?.workspacePath || process.cwd(),
        });

        if (context) {
          (context as any).codeMemory = {
            structuralContext: structuralMemory.structure,
            dependencyGraph: structuralMemory.dependencies,
            recentHotspots: structuralMemory.hotspots,
            skills: structuralMemory.skills,
            conventions: structuralMemory.conventions,
          };

          if (context.raw !== undefined) {
            const architecturalSummary = Object.entries(structuralMemory.structure)
              .map(([f, s]: [string, any]) => {
                const symNames = (s.symbols || []).map((sym: any) => `${sym.kind} ${sym.name}`).join(', ');
                return `File: ${f}${symNames ? ` (Symbols: ${symNames})` : ''}`;
              })
              .join('\n');

            if (architecturalSummary) {
              context.raw += `\n\n[CodeMemory Context]\n${architecturalSummary}`;
            }
          }
        }
      } catch (err: any) {
        pluginContext?.logger.warn(`Could not retrieve CodeMemory context: ${err.message}`);
      }

      return diff;
    },

    /**
     * After DevDiff generates a changelog or explanation,
     * record the explanation into CodeMemory.
     */
    afterAnalysis: async (changelog: ChangelogResult): Promise<ChangelogResult | void> => {
      if (!changelog || !changelog.files) return changelog;

      const filePaths = changelog.files.map((f) => f.path);

      try {
        await CodeMemoryBridge.recordChanges({
          files: filePaths,
          changelog: changelog.summary || changelog.formattedOutput || 'Code modification',
          timestamp: Date.now(),
          workspacePath: pluginContext?.workspacePath || process.cwd(),
        });
      } catch (err: any) {
        pluginContext?.logger.warn(`Could not record change in CodeMemory: ${err.message}`);
      }

      return changelog;
    },

    onFileChange: async (files: ChangedFile[]): Promise<void> => {
      if (!files || files.length === 0) return;
      pluginContext?.logger.debug(`File change event: ${files.length} files modified.`);
    },

    onCommit: async (commit: GitCommit): Promise<void> => {
      pluginContext?.logger.info(`Commit recorded: ${commit.sha.slice(0, 7)} - ${commit.message}`);
    },
  },

  commands: [
    {
      name: 'devdiff memory sync',
      description: 'Synchronize tracked files with CodeMemory index',
      handler: async () => {
        const report = await CodeMemoryBridge.sync(pluginContext?.workspacePath);
        console.log(`Synchronized: ${report.inBoth} files indexed.`);
      },
    },
    {
      name: 'devdiff memory diff',
      description: 'Compare tracked files with CodeMemory index',
      handler: async () => {
        const comparison = await CodeMemoryBridge.compare(pluginContext?.workspacePath);
        console.log(comparison);
      },
    },
    {
      name: 'devdiff memory impact',
      description: 'Analyze downstream dependents for target files',
      handler: async (args: string[]) => {
        const files = args.length > 0 ? args : ['src/index.ts'];
        const impacts = await CodeMemoryBridge.analyzeImpact(files, pluginContext?.workspacePath);
        for (const imp of impacts) {
          console.log(`• ${imp.file} (${imp.dependentCount} dependents)`);
          for (const d of imp.directDependents) {
            console.log(`  ↳ ${d.path}`);
          }
        }
      },
    },
  ],
};

export default CodeMemoryPlugin;
