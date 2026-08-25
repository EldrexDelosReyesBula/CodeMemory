import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CodeMemoryDB } from '../db/database.js';
import { ContextEngine } from '../context/ranker.js';
import { MermaidGenerator } from '../generator/mermaid.js';
import { GitMonitor } from '../git/monitor.js';
import { PluginRegistry } from '../plugins/index.js';

export class CodeMemoryMCPServer {
  private server: Server;
  private db: CodeMemoryDB;
  private contextEngine: ContextEngine;
  private mermaid: MermaidGenerator;
  private git: GitMonitor;
  private pluginRegistry: PluginRegistry;

  constructor(db?: CodeMemoryDB) {
    this.db = db || new CodeMemoryDB();
    this.contextEngine = new ContextEngine(this.db);
    this.mermaid = new MermaidGenerator(this.db);
    this.git = new GitMonitor();
    this.pluginRegistry = PluginRegistry.getInstance(this.db);

    this.server = new Server(
      {
        name: 'codememory-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 1. Register Tools matching Master Plan Section 8.2 and Addendum 2
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_code',
            description:
              'Searches across all memory layers for matching symbols, files, and modules.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Text query, symbol name, or signature keywords',
                },
                kind: {
                  type: 'string',
                  description: 'Optional filter: function, class, interface, type, struct',
                },
                language: {
                  type: 'string',
                  description: 'Optional language filter: typescript, python, rust, go, sql',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum results to return (default 20)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_context',
            description:
              'Returns change-aware structural, relational, and historical context for a file, symbol, or task description, including plugin annotations and matching skill instructions.',
            inputSchema: {
              type: 'object',
              properties: {
                task: {
                  type: 'string',
                  description: 'Task description (e.g., "fix payment webhook retry logic")',
                },
                file: {
                  type: 'string',
                  description: 'Target focus file path (e.g., "src/payments/StripeService.ts")',
                },
                target: {
                  type: 'string',
                  description: 'Focus symbol or keyword name',
                },
                token_budget: {
                  type: 'number',
                  description: 'Maximum token budget (default 4000)',
                },
              },
            },
          },
          {
            name: 'get_symbol',
            description:
              'Get detailed location, signature, docstring, and dependencies for a specific symbol.',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Exact symbol name',
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'get_dependencies',
            description:
              'Get dependency graph for a file or symbol in either upstream (dependents) or downstream (dependencies) direction.',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'File path or symbol name',
                },
                direction: {
                  type: 'string',
                  enum: ['downstream', 'upstream', 'both'],
                  description: 'Dependency direction (default: downstream)',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'get_history',
            description:
              'Get historical change records, diff summaries, and commit history for a file or codebase.',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Optional specific file path',
                },
                since: {
                  type: 'string',
                  description: 'Optional time filter (e.g., "7 days ago")',
                },
                limit: {
                  type: 'number',
                  description: 'Max records (default 20)',
                },
              },
            },
          },
          {
            name: 'get_architecture',
            description:
              'Returns architecture overview, relational summaries, and Mermaid diagram.',
            inputSchema: {
              type: 'object',
              properties: {
                focus_module: {
                  type: 'string',
                  description: 'Optional directory or module to focus diagram on',
                },
                direction: {
                  type: 'string',
                  enum: ['TD', 'LR'],
                  description: 'Diagram layout direction',
                },
              },
            },
          },
          {
            name: 'get_hotspots',
            description:
              'Identifies files and components with the highest change frequency and impact rates.',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of hotspots to return (default 10)',
                },
              },
            },
          },
          {
            name: 'get_tests',
            description:
              'Returns related test files and coverage mapping for a target implementation file or symbol.',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Target file path or symbol name',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'get_annotations',
            description:
              'Returns all namespaced annotations (core, Ollama, and plugin-contributed) for a file or entity.',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'File path to query annotations for',
                },
              },
              required: ['file_path'],
            },
          },
          {
            name: 'get_relationships',
            description:
              'Returns custom domain model relationships contributed by core and plugins.',
            inputSchema: {
              type: 'object',
              properties: {
                entity_type: {
                  type: 'string',
                  enum: ['file', 'symbol', 'dependency', 'repository'],
                  description: 'Entity type',
                },
                entity_id: {
                  type: 'number',
                  description: 'Entity ID',
                },
              },
              required: ['entity_type', 'entity_id'],
            },
          },
          // --- New Local IDE Agent MCP Tools (v1.4.0) ---
          {
            name: 'get_skills',
            description:
              'Returns relevant skill instructions from SKILLS.md, AGENTS.md, CLAUDE.md, etc.',
            inputSchema: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  description: 'Optional topic or section name (e.g., "Commands", "Architecture", "build")',
                },
              },
            },
          },
          {
            name: 'get_commands',
            description:
              'Returns executable shell commands parsed from project skill files with safety flags.',
            inputSchema: {
              type: 'object',
              properties: {
                task: {
                  type: 'string',
                  description: 'Optional task description to filter relevant commands (e.g., "test", "build")',
                },
              },
            },
          },
          {
            name: 'get_conventions',
            description:
              'Returns coding conventions, style rules, and agent guidelines from project skill files.',
            inputSchema: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  description: 'Optional topic filter',
                },
              },
            },
          },
          {
            name: 'get_file_context',
            description:
              'Fast IDE active-file context: returns symbols, dependencies, recent changes, and related tests for the currently active editor file.',
            inputSchema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  description: 'Active file path in the IDE editor',
                },
              },
              required: ['file'],
            },
          },
          {
            name: 'get_selection_context',
            description:
              'Returns symbol hierarchy and context specifically covering a selected line range in the IDE.',
            inputSchema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  description: 'File path',
                },
                start_line: {
                  type: 'number',
                  description: 'Selection start line (1-indexed)',
                },
                end_line: {
                  type: 'number',
                  description: 'Selection end line (1-indexed)',
                },
              },
              required: ['file', 'start_line', 'end_line'],
            },
          },
          {
            name: 'get_incremental_updates',
            description:
              'Returns all changes recorded in the repository since a given timestamp.',
            inputSchema: {
              type: 'object',
              properties: {
                since: {
                  type: 'string',
                  description: 'ISO timestamp or date string',
                },
              },
              required: ['since'],
            },
          },
          {
            name: 'get_project_skills',
            description:
              'Returns all detected agent skill files and their high-level sections.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    // 2. Handle Tool Calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      try {
        switch (name) {
          case 'search_code': {
            const query = String(args.query || '');
            const kind = args.kind as any;
            const language = args.language ? String(args.language) : undefined;
            const limit = typeof args.limit === 'number' ? args.limit : 20;

            const results = this.db.searchSymbols({ query, kind, language, limit });
            return {
              content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
            };
          }

          case 'get_context': {
            const task = args.task ? String(args.task) : undefined;
            const file = args.file ? String(args.file) : undefined;
            const target = args.target ? String(args.target) : undefined;
            const tokenBudget = typeof args.token_budget === 'number' ? args.token_budget : 4000;

            const context = this.contextEngine.getContext({
              task,
              file,
              target,
              tokenBudget,
            });

            return {
              content: [{ type: 'text', text: JSON.stringify(context, null, 2) }],
            };
          }

          case 'get_symbol': {
            const symbolName = String(args.name || '');
            const symbol = this.db.getSymbolByName(symbolName);
            if (!symbol) {
              return {
                content: [{ type: 'text', text: `Symbol "${symbolName}" not found.` }],
              };
            }
            const dependents = this.db.getDependentsForSymbol(symbolName);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ symbol, callers: dependents }, null, 2),
                },
              ],
            };
          }

          case 'get_dependencies': {
            const targetPath = String(args.path || '');
            const direction = (args.direction as string) || 'downstream';

            const downstream = this.db.getDependenciesForFile(targetPath);
            const upstream = this.db.getDependentsForFile(targetPath);

            const result =
              direction === 'upstream'
                ? { dependents: upstream }
                : direction === 'both'
                ? { dependencies: downstream, dependents: upstream }
                : { dependencies: downstream };

            return {
              content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
          }

          case 'get_history': {
            const targetPath = args.path ? String(args.path) : undefined;
            const limit = typeof args.limit === 'number' ? args.limit : 20;

            const history = targetPath
              ? this.db.getHistoryForPath(targetPath, limit)
              : this.db.getRecentChanges(limit);
            const gitStatus = this.git.getStatus();

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ gitStatus, history }, null, 2),
                },
              ],
            };
          }

          case 'get_architecture': {
            const direction = (args.direction as any) || 'TD';
            const focusModule = args.focus_module ? String(args.focus_module) : undefined;
            const diagram = this.mermaid.generateArchitectureDiagram({
              direction,
              focusModule,
            });
            const metrics = this.db.getCodebaseMetrics();

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ metrics, mermaidDiagram: diagram }, null, 2),
                },
              ],
            };
          }

          case 'get_hotspots': {
            const limit = typeof args.limit === 'number' ? args.limit : 10;
            const hotspots = this.db.getHotspots(limit);

            return {
              content: [{ type: 'text', text: JSON.stringify(hotspots, null, 2) }],
            };
          }

          case 'get_tests': {
            const targetPath = String(args.path || '');
            const tests = this.db.getRelatedTests(targetPath);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ target: targetPath, related_tests: tests }, null, 2),
                },
              ],
            };
          }

          case 'get_annotations': {
            const targetPath = String(args.file_path || '');
            const annotations = this.db.getAnnotationsForFile(targetPath);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ file: targetPath, annotations }, null, 2),
                },
              ],
            };
          }

          case 'get_relationships': {
            const entityType = args.entity_type as any;
            const entityId = Number(args.entity_id);
            const rels = this.db.getRelationships(entityType, entityId);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ entity_type: entityType, entity_id: entityId, relationships: rels }, null, 2),
                },
              ],
            };
          }

          // --- Local IDE Agent Handlers ---
          case 'get_skills': {
            const topic = args.topic ? String(args.topic) : undefined;
            const skills = topic ? this.db.searchSkillInstructions(topic) : this.db.getSkillInstructions();

            return {
              content: [{ type: 'text', text: JSON.stringify(skills, null, 2) }],
            };
          }

          case 'get_commands': {
            const task = args.task ? String(args.task) : undefined;
            const commands = this.db.getExtractedCommands(task);

            return {
              content: [{ type: 'text', text: JSON.stringify(commands, null, 2) }],
            };
          }

          case 'get_conventions': {
            const topic = args.topic ? String(args.topic) : undefined;
            const conventions = this.db.getConventions(topic);

            return {
              content: [{ type: 'text', text: JSON.stringify(conventions, null, 2) }],
            };
          }

          case 'get_file_context': {
            const targetFile = String(args.file || '');
            const symbols = this.db.getSymbolsForFile(targetFile);
            const dependencies = this.db.getDependenciesForFile(targetFile);
            const dependents = this.db.getDependentsForFile(targetFile);
            const recentChanges = this.db.getHistoryForPath(targetFile, 5);
            const relatedTests = this.db.getRelatedTests(targetFile);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      file: targetFile,
                      symbols,
                      dependencies,
                      dependents,
                      recentChanges,
                      relatedTests,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'get_selection_context': {
            const targetFile = String(args.file || '');
            const startLine = Number(args.start_line || 1);
            const endLine = Number(args.end_line || 1);

            const allSymbols = this.db.getSymbolsForFile(targetFile);
            const coveringSymbols = allSymbols.filter(
              (s) => s.lineStart <= endLine && s.lineEnd >= startLine
            );

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      file: targetFile,
                      selection: { startLine, endLine },
                      covering_symbols: coveringSymbols,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'get_incremental_updates': {
            const sinceStr = String(args.since || '');
            const allChanges = this.db.getRecentChanges(50);
            const deltaChanges = sinceStr
              ? allChanges.filter((c) => new Date(c.timestamp) > new Date(sinceStr))
              : allChanges;

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ since: sinceStr, delta_changes: deltaChanges }, null, 2),
                },
              ],
            };
          }

          case 'get_project_skills': {
            const skills = this.db.getSkillInstructions();
            const filesMap: Record<string, string[]> = {};
            for (const s of skills) {
              if (!filesMap[s.filePath]) filesMap[s.filePath] = [];
              filesMap[s.filePath].push(s.section);
            }

            return {
              content: [{ type: 'text', text: JSON.stringify(filesMap, null, 2) }],
            };
          }

          default:
            return {
              isError: true,
              content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            };
        }
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `CodeMemory MCP Error: ${err.message}` }],
        };
      }
    });

    // 3. Register Resources matching Master Plan Section 8.3 & Addendum 2
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'codememory://repository_summary',
            name: 'Repository Summary',
            description: 'High-level overview of repository structure and language breakdown',
            mimeType: 'application/json',
          },
          {
            uri: 'codememory://architecture',
            name: 'Architecture Graph',
            description: 'Current architecture graph and Mermaid diagram',
            mimeType: 'text/vnd.mermaid',
          },
          {
            uri: 'codememory://project_structure',
            name: 'Project Structure',
            description: 'Hierarchical file tree with symbol inventory',
            mimeType: 'application/json',
          },
          {
            uri: 'codememory://recent_changes',
            name: 'Recent Changes',
            description: 'Recent change activity and commit log',
            mimeType: 'application/json',
          },
          {
            uri: 'codememory://plugin_registry',
            name: 'Plugin Registry',
            description: 'Installed plugins and their contributions',
            mimeType: 'application/json',
          },
          {
            uri: 'codememory://skills',
            name: 'Agent Skills & Instructions',
            description: 'Structured instructions from SKILLS.md, AGENTS.md, and conventions',
            mimeType: 'application/json',
          },
          {
            uri: 'codememory://commands',
            name: 'Extracted Commands',
            description: 'All extracted shell commands and safety flags',
            mimeType: 'application/json',
          },
          {
            uri: 'codememory://conventions',
            name: 'Coding Conventions',
            description: 'Project coding guidelines and style rules',
            mimeType: 'application/json',
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      if (uri === 'codememory://repository_summary') {
        const metrics = this.db.getCodebaseMetrics();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(metrics, null, 2),
            },
          ],
        };
      }
      if (uri === 'codememory://architecture') {
        const diagram = this.mermaid.generateArchitectureDiagram();
        return {
          contents: [
            {
              uri,
              mimeType: 'text/vnd.mermaid',
              text: diagram,
            },
          ],
        };
      }
      if (uri === 'codememory://project_structure') {
        const files = this.db.getAllFiles().map((f) => ({
          ...f,
          symbols: this.db.getSymbolsForFile(f.path),
        }));
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(files, null, 2),
            },
          ],
        };
      }
      if (uri === 'codememory://recent_changes') {
        const changes = this.db.getRecentChanges(30);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(changes, null, 2),
            },
          ],
        };
      }
      if (uri === 'codememory://plugin_registry') {
        const plugins = this.pluginRegistry.listPlugins();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(plugins, null, 2),
            },
          ],
        };
      }
      if (uri === 'codememory://skills') {
        const skills = this.db.getSkillInstructions();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(skills, null, 2),
            },
          ],
        };
      }
      if (uri === 'codememory://commands') {
        const commands = this.db.getExtractedCommands();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(commands, null, 2),
            },
          ],
        };
      }
      if (uri === 'codememory://conventions') {
        const conventions = this.db.getConventions();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(conventions, null, 2),
            },
          ],
        };
      }
      throw new Error(`Resource not found: ${uri}`);
    });
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    console.error('[CodeMemory MCP] Server running on stdio transport...');
    await this.server.connect(transport);
    console.error('[CodeMemory MCP] Connected and ready.');
  }
}
