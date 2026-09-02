/**
 * UnifiedMCPServer — DevDiff × CodeMemory Unified Model Context Protocol (MCP) Server
 *
 * Provides a single, unified MCP connection for AI agents (Claude, Copilot, Cursor, Gemini, Windsurf).
 * Combines DevDiff's change memory & changelog synthesis with CodeMemory's multi-language AST structural memory.
 */

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
import { CodeMemoryBridge } from '../devdiff/bridge.js';

export class UnifiedMCPServer {
  private server: Server;
  private db: CodeMemoryDB;
  private contextEngine: ContextEngine;
  private mermaid: MermaidGenerator;
  private git: GitMonitor;

  constructor(db?: CodeMemoryDB) {
    this.db = db || new CodeMemoryDB();
    this.contextEngine = new ContextEngine(this.db);
    this.mermaid = new MermaidGenerator(this.db);
    this.git = new GitMonitor();

    // Register db in bridge for in-process fast queries
    CodeMemoryBridge.setLocalDatabase(this.db);

    this.server = new Server(
      {
        name: 'devdiff-codememory-unified',
        version: '2.0.0',
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
    // 1. List All Tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // --- Unified Synergy Tools ---
          {
            name: 'unified_context',
            description:
              'Returns the complete combined context: DevDiff change memory, commit rationale, CodeMemory structural AST symbols, caller trees, and project skill instructions.',
            inputSchema: {
              type: 'object',
              properties: {
                task: {
                  type: 'string',
                  description: 'Task or prompt description (e.g. "Refactor payment checkout flow")',
                },
                file: {
                  type: 'string',
                  description: 'Target focus file path (e.g. "src/payments/Checkout.ts")',
                },
                token_budget: {
                  type: 'number',
                  description: 'Maximum token budget (default: 4000)',
                },
              },
            },
          },
          {
            name: 'unified_change_analysis',
            description:
              'Performs deep architectural change analysis: parses staged/recent git diff, maps modifications to AST symbols, and calculates cascading blast radius across downstream callers.',
            inputSchema: {
              type: 'object',
              properties: {
                files: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Optional list of files to analyze (defaults to staged/recent changes)',
                },
              },
            },
          },
          {
            name: 'unified_memory_sync',
            description: 'Verifies and synchronizes DevDiff change memory with CodeMemory structural index.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },

          // --- CodeMemory Structural Memory Tools ---
          {
            name: 'codememory_query',
            description: 'Queries structural codebase memory for symbols, declarations, and file locations.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Symbol name, keyword, or query term',
                },
                kind: {
                  type: 'string',
                  description: 'Optional symbol kind: function, class, interface, type, struct',
                },
                limit: {
                  type: 'number',
                  description: 'Max results (default: 20)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'codememory_dependencies',
            description: 'Returns upstream (callers) and downstream (callees) dependency topology for a file or symbol.',
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
                  description: 'Direction of dependency graph',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'codememory_architecture',
            description: 'Returns high-level architectural overview, component metrics, and Mermaid diagram.',
            inputSchema: {
              type: 'object',
              properties: {
                focus_module: {
                  type: 'string',
                  description: 'Optional module or folder to focus on',
                },
              },
            },
          },
          {
            name: 'codememory_hotspots',
            description: 'Returns change velocity hotspots and frequently modified files.',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of hotspots to return (default: 10)',
                },
              },
            },
          },
          {
            name: 'codememory_skills',
            description: 'Returns relevant skill instructions from SKILLS.md, AGENTS.md, and CLAUDE.md.',
            inputSchema: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  description: 'Optional skill topic or section',
                },
              },
            },
          },

          // --- DevDiff Change Intelligence Tools ---
          {
            name: 'devdiff_explain_code',
            description: 'Explains recent modifications and architectural rationale for a specific file.',
            inputSchema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  description: 'File path to explain',
                },
              },
              required: ['file'],
            },
          },
          {
            name: 'devdiff_security_scan',
            description: 'Scans files or repository for leaked secrets and security vulnerabilities.',
            inputSchema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  description: 'Optional file path to scan (defaults to whole project)',
                },
              },
            },
          },
        ],
      };
    });

    // 2. Handle Tool Invocations
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      try {
        switch (name) {
          case 'unified_context': {
            const task = args.task ? String(args.task) : undefined;
            const file = args.file ? String(args.file) : undefined;
            const tokenBudget = typeof args.token_budget === 'number' ? args.token_budget : 4000;

            const structuralContext = this.contextEngine.getContext({
              task,
              file,
              tokenBudget,
            });

            const recentChanges = file
              ? this.db.getHistoryForPath(file, 5)
              : this.db.getRecentChanges(5);

            const unifiedPayload = {
              focus: file || task || 'Workspace',
              structural_memory: structuralContext,
              change_memory: {
                recent_modifications: recentChanges,
                git_status: this.git.getStatus(),
              },
              skills_and_conventions: {
                rules: structuralContext.skill_instructions,
                annotations: structuralContext.annotations,
              },
              generated_at: new Date().toISOString(),
            };

            return {
              content: [{ type: 'text', text: JSON.stringify(unifiedPayload, null, 2) }],
            };
          }

          case 'unified_change_analysis': {
            let files: string[] = [];
            if (Array.isArray(args.files) && args.files.length > 0) {
              files = args.files.map(String);
            } else {
              const status = this.git.getStatus();
              files = [...status.modifiedFiles, ...status.untrackedFiles].slice(0, 10);
            }

            if (files.length === 0) {
              const recent = this.db.getRecentChanges(5);
              files = recent.map((r) => r.path);
            }

            const impactReport = await CodeMemoryBridge.analyzeImpact(files);
            return {
              content: [{ type: 'text', text: JSON.stringify({ analyzed_files: files, impact_report: impactReport }, null, 2) }],
            };
          }

          case 'unified_memory_sync': {
            const report = await CodeMemoryBridge.sync();
            return {
              content: [{ type: 'text', text: JSON.stringify(report, null, 2) }],
            };
          }

          case 'codememory_query': {
            const query = String(args.query || '');
            const kind = args.kind as any;
            const limit = typeof args.limit === 'number' ? args.limit : 20;
            const results = this.db.searchSymbols({ query, kind, limit });
            return {
              content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
            };
          }

          case 'codememory_dependencies': {
            const targetPath = String(args.path || '');
            const direction = (args.direction as string) || 'both';
            const downstream = this.db.getDependenciesForFile(targetPath);
            const upstream = this.db.getDependentsForFile(targetPath);

            const result =
              direction === 'upstream'
                ? { callers: upstream }
                : direction === 'downstream'
                ? { callees: downstream }
                : { callees: downstream, callers: upstream };

            return {
              content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
          }

          case 'codememory_architecture': {
            const focusModule = args.focus_module ? String(args.focus_module) : undefined;
            const diagram = this.mermaid.generateArchitectureDiagram({ focusModule });
            const metrics = this.db.getCodebaseMetrics();
            return {
              content: [{ type: 'text', text: JSON.stringify({ metrics, mermaidDiagram: diagram }, null, 2) }],
            };
          }

          case 'codememory_hotspots': {
            const limit = typeof args.limit === 'number' ? args.limit : 10;
            const hotspots = this.db.getHotspots(limit);
            return {
              content: [{ type: 'text', text: JSON.stringify(hotspots, null, 2) }],
            };
          }

          case 'codememory_skills': {
            const topic = args.topic ? String(args.topic) : undefined;
            const skills = topic ? this.db.searchSkillInstructions(topic) : this.db.getSkillInstructions();
            return {
              content: [{ type: 'text', text: JSON.stringify(skills, null, 2) }],
            };
          }

          case 'devdiff_explain_code': {
            const targetFile = String(args.file || '');
            const history = this.db.getHistoryForPath(targetFile, 5);
            const annotations = this.db.getAnnotationsForFile(targetFile);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      file: targetFile,
                      recent_explanations: history.map((h) => ({
                        date: h.timestamp,
                        summary: h.diffSummary || h.gitMessage,
                        author: h.gitAuthor,
                      })),
                      annotations,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'devdiff_security_scan': {
            const targetFile = args.file ? String(args.file) : undefined;
            const allFiles = targetFile ? [{ path: targetFile }] : this.db.getAllFiles();
            const findings: any[] = [];

            for (const f of allFiles) {
              const ann = this.db.getAnnotationsForFile(f.path);
              const sec = ann.filter((a) => a.key.includes('security') || a.key.includes('vulnerability'));
              if (sec.length > 0) {
                findings.push({ file: f.path, issues: sec });
              }
            }

            return {
              content: [{ type: 'text', text: JSON.stringify({ total_findings: findings.length, findings }, null, 2) }],
            };
          }

          default:
            return {
              isError: true,
              content: [{ type: 'text', text: `Unknown unified tool: ${name}` }],
            };
        }
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Unified MCP Error: ${err.message}` }],
        };
      }
    });

    // 3. Resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'unified://architecture',
            name: 'Unified Architecture & Change Overview',
            mimeType: 'application/json',
          },
          {
            uri: 'unified://skills',
            name: 'Unified Agent Skills & Conventions',
            mimeType: 'application/json',
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      if (uri === 'unified://architecture') {
        const metrics = this.db.getCodebaseMetrics();
        const diagram = this.mermaid.generateArchitectureDiagram();
        return {
          contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ metrics, diagram }, null, 2) }],
        };
      }
      if (uri === 'unified://skills') {
        const skills = this.db.getSkillInstructions();
        const conventions = this.db.getConventions();
        return {
          contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ skills, conventions }, null, 2) }],
        };
      }
      throw new Error(`Resource not found: ${uri}`);
    });
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 DevDiff × CodeMemory Unified MCP Server running on stdio');
  }
}
