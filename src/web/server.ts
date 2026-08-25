import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import type { CodeMemoryDB } from '../db/database.js';
import { ContextEngine } from '../context/ranker.js';
import { MermaidGenerator } from '../generator/mermaid.js';

export interface WebServerOptions {
  port?: number;
  host?: string;
  rootDir?: string;
}

export class CodeMemoryWebServer {
  private server: http.Server | null = null;
  private db: CodeMemoryDB;
  private contextEngine: ContextEngine;
  private mermaid: MermaidGenerator;
  private port: number;
  private host: string;
  private rootDir: string;
  private sseClients: Set<http.ServerResponse> = new Set();

  constructor(db: CodeMemoryDB, options: WebServerOptions = {}) {
    this.db = db;
    this.contextEngine = new ContextEngine(db);
    this.mermaid = new MermaidGenerator(db);
    this.port = options.port || 3737;
    this.host = options.host || '127.0.0.1';
    this.rootDir = options.rootDir || process.cwd();
  }

  /**
   * Broadcast real-time change event to connected web clients.
   */
  public broadcastEvent(eventType: string, data: any): void {
    const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
    for (const client of this.sseClients) {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }

  public async start(): Promise<{ port: number; url: string }> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.listen(this.port, this.host, () => {
        const url = `http://${this.host}:${this.port}`;
        resolve({ port: this.port, url });
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const client of this.sseClients) {
        try {
          client.end();
        } catch {}
      }
      this.sseClients.clear();

      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // Set standard local security headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 1. Real-Time Event Stream (/ws/updates or /api/events)
    if (pathname === '/ws/updates' || pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(': connected\n\n');
      this.sseClients.add(res);

      req.on('close', () => {
        this.sseClients.delete(res);
      });
      return;
    }

    // 2. REST API Endpoints
    if (pathname.startsWith('/api/')) {
      this.handleApiRequest(pathname, parsedUrl.searchParams, res);
      return;
    }

    // 3. Static Web Assets & SSR Handlers
    this.handleStaticRequest(pathname, parsedUrl.searchParams, res);
  }

  private handleApiRequest(pathname: string, params: URLSearchParams, res: http.ServerResponse): void {
    res.setHeader('Content-Type', 'application/json');

    try {
      switch (pathname) {
        case '/api/architecture': {
          const files = this.db.getAllFiles();
          const hotspots = this.db.getHotspots(50);
          const hotspotSet = new Set(hotspots.map((h) => h.path));

          const nodes = files.map((f) => {
            const symbols = this.db.getSymbolsForFile(f.path);
            const annotations = this.db.getAnnotationsForFile(f.path);
            const isHotspot = hotspotSet.has(f.path);
            const normalizedPath = f.path.replace(/\\/g, '/');
            return {
              id: normalizedPath,
              path: normalizedPath,
              type: 'file',
              language: f.language,
              size_bytes: f.sizeBytes,
              last_modified: new Date(f.lastModified).toISOString(),
              symbols_count: symbols.length,
              symbols: symbols.slice(0, 10),
              is_hotspot: isHotspot,
              annotations,
            };
          });

          // Build index for robust path resolution
          const fileLookup = new Map<string, string>();
          for (const f of files) {
            const clean = f.path.replace(/\\/g, '/');
            fileLookup.set(clean, clean);
            fileLookup.set(clean.replace(/\.[^.]+$/, ''), clean);
          }

          const edges: Array<{ source: string; target: string; type: string; symbol?: string }> = [];
          for (const f of files) {
            const cleanSrc = f.path.replace(/\\/g, '/');
            const srcDir = path.posix.dirname(cleanSrc);
            const deps = this.db.getDependenciesForFile(f.path);

            for (const d of deps) {
              let resolvedTarget: string | null = d.target_path ? d.target_path.replace(/\\/g, '/') : null;

              if (!resolvedTarget && d.import_path && d.import_path.startsWith('.')) {
                const rawTarget = path.posix.normalize(path.posix.join(srcDir, d.import_path));
                const candidates = [
                  rawTarget,
                  rawTarget.replace(/\.js$/, '.ts'),
                  rawTarget.replace(/\.js$/, ''),
                  rawTarget + '.ts',
                  rawTarget + '.js',
                  rawTarget + '/index.ts',
                  rawTarget + '/index.js',
                ];
                for (const c of candidates) {
                  if (fileLookup.has(c)) {
                    resolvedTarget = fileLookup.get(c)!;
                    break;
                  }
                }
              }

              if (resolvedTarget && resolvedTarget !== cleanSrc) {
                edges.push({
                  source: cleanSrc,
                  target: resolvedTarget,
                  type: d.dep_type || 'import',
                  symbol: d.target_symbol_name,
                });
              }
            }
          }

          const metrics = this.db.getCodebaseMetrics();
          const jgfNodes: Record<string, any> = {};
          for (const n of nodes) {
            jgfNodes[n.path] = {
              label: n.path,
              metadata: n,
            };
          }

          const jgfEdges = edges.map((e) => ({
            source: e.source,
            target: e.target,
            relation: e.type,
            directed: true,
            metadata: { symbol: e.symbol },
          }));

          res.writeHead(200);
          res.end(
            JSON.stringify(
              {
                graph: {
                  id: 'codememory-architecture-graph',
                  type: 'CodebaseArchitecture',
                  label: 'CodeMemory Intelligence Graph',
                  directed: true,
                  metadata: {
                    schema_version: '2.0.0',
                    generator: '@eldrex/codememory',
                    generated_at: new Date().toISOString(),
                    metrics,
                  },
                  nodes: jgfNodes,
                  edges: jgfEdges,
                },
                nodes,
                edges,
                metrics,
                generated_at: new Date().toISOString(),
              },
              null,
              2
            )
          );
          return;
        }

        case '/api/files': {
          const files = this.db.getAllFiles();
          res.writeHead(200);
          res.end(JSON.stringify(files, null, 2));
          return;
        }

        case '/api/symbols': {
          const query = params.get('query') || '';
          const symbols = this.db.searchSymbols({ query, limit: 100 });
          res.writeHead(200);
          res.end(JSON.stringify(symbols, null, 2));
          return;
        }

        case '/api/dependencies': {
          const file = params.get('file');
          if (file) {
            const deps = this.db.getDependenciesForFile(file);
            const dependents = this.db.getDependentsForFile(file);
            res.writeHead(200);
            res.end(JSON.stringify({ dependencies: deps, dependents }, null, 2));
          } else {
            res.writeHead(200);
            res.end(JSON.stringify([], null, 2));
          }
          return;
        }

        case '/api/changes': {
          const limit = parseInt(params.get('limit') || '30', 10);
          const changes = this.db.getRecentChanges(limit);
          res.writeHead(200);
          res.end(JSON.stringify(changes, null, 2));
          return;
        }

        case '/api/hotspots': {
          const limit = parseInt(params.get('limit') || '15', 10);
          const hotspots = this.db.getHotspots(limit);
          res.writeHead(200);
          res.end(JSON.stringify(hotspots, null, 2));
          return;
        }

        case '/api/timeline': {
          const changes = this.db.getRecentChanges(100);
          const daysMap: Record<string, any[]> = {};
          for (const c of changes) {
            const dayKey = c.timestamp ? c.timestamp.split('T')[0] : 'Today';
            if (!daysMap[dayKey]) daysMap[dayKey] = [];
            daysMap[dayKey].push(c);
          }

          const timeline = Object.entries(daysMap).map(([date, dayChanges]) => ({
            date,
            changesCount: dayChanges.length,
            changes: dayChanges,
          }));

          res.writeHead(200);
          res.end(JSON.stringify({ timeline }, null, 2));
          return;
        }

        case '/api/annotations': {
          const file = params.get('file');
          if (file) {
            const annos = this.db.getAnnotationsForFile(file);
            res.writeHead(200);
            res.end(JSON.stringify(annos, null, 2));
          } else {
            const files = this.db.getAllFiles();
            const allAnnos: Array<{ file: string; annotations: any[] }> = [];
            for (const f of files) {
              const annos = this.db.getAnnotationsForFile(f.path);
              if (annos.length > 0) {
                allAnnos.push({ file: f.path, annotations: annos });
              }
            }
            res.writeHead(200);
            res.end(JSON.stringify(allAnnos, null, 2));
          }
          return;
        }

        case '/api/relationships': {
          const files = this.db.getAllFiles();
          const allRels: any[] = [];
          for (const f of files) {
            if (f.id !== undefined) {
              const rels = this.db.getRelationships('file', f.id);
              if (rels && rels.length > 0) {
                allRels.push(...rels);
              }
            }
          }
          res.writeHead(200);
          res.end(JSON.stringify(allRels, null, 2));
          return;
        }

        case '/api/skills': {
          const skills = this.db.getSkillInstructions();
          const commands = this.db.getExtractedCommands();
          const conventions = this.db.getConventions();
          res.writeHead(200);
          res.end(JSON.stringify({ skills, commands, conventions }, null, 2));
          return;
        }

        case '/api/context': {
          const file = params.get('file') || undefined;
          const task = params.get('task') || undefined;
          const context = this.contextEngine.getContext({ file, task });
          res.writeHead(200);
          res.end(JSON.stringify(context, null, 2));
          return;
        }

        case '/api/docs': {
          const docId = params.get('id');
          const docs = this.getDocumentationList();
          if (docId) {
            const doc = docs.find((d) => d.id === docId);
            if (doc) {
              res.writeHead(200);
              res.end(JSON.stringify(doc, null, 2));
            } else {
              res.writeHead(404);
              res.end(JSON.stringify({ error: `Documentation not found: ${docId}` }));
            }
          } else {
            res.writeHead(200);
            res.end(JSON.stringify({ docs }, null, 2));
          }
          return;
        }

        case '/api/docs/search': {
          const q = (params.get('q') || '').toLowerCase().trim();
          const docs = this.getDocumentationList();
          if (!q) {
            res.writeHead(200);
            res.end(JSON.stringify({ results: docs.map((d) => ({ id: d.id, title: d.title, category: d.category, path: d.path })) }));
            return;
          }

          const results = [];
          for (const doc of docs) {
            const titleMatch = doc.title.toLowerCase().includes(q);
            const catMatch = doc.category.toLowerCase().includes(q);
            const contentIdx = doc.content.toLowerCase().indexOf(q);

            if (titleMatch || catMatch || contentIdx !== -1) {
              let snippet = '';
              if (contentIdx !== -1) {
                const start = Math.max(0, contentIdx - 50);
                const end = Math.min(doc.content.length, contentIdx + q.length + 60);
                snippet = (start > 0 ? '...' : '') + doc.content.slice(start, end).replace(/\n/g, ' ') + (end < doc.content.length ? '...' : '');
              }
              results.push({
                id: doc.id,
                title: doc.title,
                category: doc.category,
                path: doc.path,
                snippet,
                score: titleMatch ? 100 : (catMatch ? 50 : 20),
              });
            }
          }

          results.sort((a, b) => b.score - a.score);
          res.writeHead(200);
          res.end(JSON.stringify({ results }, null, 2));
          return;
        }

        default:
          res.writeHead(404);
          res.end(JSON.stringify({ error: `Not found: ${pathname}` }));
      }
    } catch (err: any) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  }

  /**
   * Discovers and compiles all project markdown documentation.
   */
  public getDocumentationList(): Array<{
    id: string;
    title: string;
    category: string;
    path: string;
    content: string;
  }> {
    const docs: Array<{ id: string; title: string; category: string; path: string; content: string }> = [];

    const fileEntries = [
      { id: 'quick-start', path: 'docs/getting-started/quick-start.md', category: 'Getting Started', defaultTitle: 'Quick Start Guide' },
      { id: 'installation', path: 'docs/getting-started/installation.md', category: 'Getting Started', defaultTitle: 'Installation Guide' },
      { id: 'token-optimization', path: 'docs/how-to/token-optimization.md', category: 'How-To Guides', defaultTitle: 'Optimize AI Token Usage' },
      { id: 'local-ollama-setup', path: 'docs/how-to/local-ollama-setup.md', category: 'How-To Guides', defaultTitle: 'Local Embeddings with Ollama' },
      { id: 'ide-copilot-setup', path: 'docs/how-to/ide-copilot-setup.md', category: 'How-To Guides', defaultTitle: 'Connect VS Code & Cursor' },
      { id: 'ci-cd-integration', path: 'docs/how-to/ci-cd-integration.md', category: 'How-To Guides', defaultTitle: 'GitHub Actions & CI/CD' },
      { id: 'cli-reference', path: 'docs/api/cli-reference.md', category: 'CLI & Config', defaultTitle: 'CLI Command Reference' },
      { id: 'mcp-protocol', path: 'docs/api/mcp-protocol.md', category: 'MCP & AI Agents', defaultTitle: 'Model Context Protocol (MCP)' },
      { id: 'ide-integration', path: 'docs/api/ide-integration.md', category: 'MCP & AI Agents', defaultTitle: 'Local IDE Agent Integration' },
      { id: 'domain-model', path: 'docs/api/domain-model.md', category: 'Architecture & Persistence', defaultTitle: 'Domain Model Architecture' },
      { id: 'plugins', path: 'docs/api/plugins.md', category: 'Architecture & Persistence', defaultTitle: 'Plugin Extensibility Engine' },
      { id: 'skills-guide', path: 'docs/api/skills-guide.md', category: 'Agent Skills', defaultTitle: 'Skills.md & Agent Rules' },
      { id: 'troubleshooting', path: 'docs/help/troubleshooting.md', category: 'Help & FAQ', defaultTitle: 'Troubleshooting & FAQ' },
      { id: 'performance-tuning', path: 'docs/help/performance-tuning.md', category: 'Help & FAQ', defaultTitle: 'Performance & Benchmarks' },
      { id: 'privacy-policy', path: 'docs/legal/privacy-policy.md', category: 'Legal & Privacy', defaultTitle: 'Privacy Policy & Local Guarantee' },
      { id: 'security-governance', path: 'docs/legal/security-governance.md', category: 'Legal & Privacy', defaultTitle: 'Security & Governance' },
      { id: 'contributing', path: 'docs/legal/contributing.md', category: 'Legal & Privacy', defaultTitle: 'Contributing Guide' },
      { id: 'code-of-conduct', path: 'docs/legal/code-of-conduct.md', category: 'Legal & Privacy', defaultTitle: 'Code of Conduct' },
      { id: 'license', path: 'docs/legal/license.md', category: 'Legal & Privacy', defaultTitle: 'MIT License' },
      { id: 'readme', path: 'README.md', category: 'Project Codex', defaultTitle: 'CodeMemory Overview' },
      { id: 'skills', path: 'SKILLS.md', category: 'Project Codex', defaultTitle: 'Project SKILLS.md' },
    ];

    for (const entry of fileEntries) {
      const fullPath = path.join(this.rootDir, entry.path);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const firstHeader = content.match(/^#\s+(.+)$/m);
          const title = firstHeader ? firstHeader[1].replace(/^[^\w\s]+/, '').trim() : entry.defaultTitle;
          docs.push({
            id: entry.id,
            title,
            category: entry.category,
            path: entry.path,
            content,
          });
        } catch {
          // ignore unreadable
        }
      }
    }

    return docs;
  }

  private handleStaticRequest(pathname: string, params: URLSearchParams, res: http.ServerResponse): void {
    // 1. Check for robots.txt & sitemap.xml
    if (pathname === '/robots.txt') {
      const robotsPath = path.join(this.rootDir, 'website', 'robots.txt');
      if (fs.existsSync(robotsPath)) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        fs.createReadStream(robotsPath).pipe(res);
        return;
      }
    }

    if (pathname === '/sitemap.xml') {
      const sitemapPath = path.join(this.rootDir, 'website', 'sitemap.xml');
      if (fs.existsSync(sitemapPath)) {
        res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
        fs.createReadStream(sitemapPath).pipe(res);
        return;
      }
    }

    // 2. Handle CairnJS module requested by app.js
    if (pathname.includes('cairn.module.js')) {
      const cairnPath = path.join(this.rootDir, 'node_modules', '@eldrex', 'cairnjs', 'dist', 'cairn.module.js');
      if (fs.existsSync(cairnPath)) {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        fs.createReadStream(cairnPath).pipe(res);
        return;
      }
    }

    // 3. Handle /assets/ requests
    if (pathname.startsWith('/assets/')) {
      const assetPath = path.join(this.rootDir, pathname);
      if (fs.existsSync(assetPath) && !fs.statSync(assetPath).isDirectory()) {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        fs.createReadStream(assetPath).pipe(res);
        return;
      }
    }

    // 4. Handle /docs/ and root markdown requests
    if (pathname.startsWith('/docs/') && pathname.endsWith('.md')) {
      const docPath = path.join(this.rootDir, pathname.startsWith('/') ? pathname.slice(1) : pathname);
      if (fs.existsSync(docPath) && !fs.statSync(docPath).isDirectory()) {
        res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
        fs.createReadStream(docPath).pipe(res);
        return;
      }
    }

    // 5. Handle HTML Document Page SSR Injection for `/`, `/docs`, `/docs/:id`
    const isDocRoute = pathname.startsWith('/docs/') || pathname === '/docs' || pathname === '/';
    if (isDocRoute && !path.extname(pathname)) {
      const indexPath = path.join(this.rootDir, 'website', 'index.html');
      if (fs.existsSync(indexPath)) {
        let docId = params.get('id') || params.get('doc');
        if (!docId && pathname.startsWith('/docs/')) {
          docId = pathname.replace('/docs/', '').replace(/\/$/, '');
        }

        let html = fs.readFileSync(indexPath, 'utf8');

        // If a specific doc is targeted, dynamically inject SEO meta tags & pre-render title
        if (docId) {
          const docs = this.getDocumentationList();
          const doc = docs.find((d) => d.id === docId);
          if (doc) {
            const pageTitle = `${doc.title} — CodeMemory Docs`;
            const cleanDesc = doc.content.slice(0, 160).replace(/[#`*\n]/g, ' ').trim();
            html = html.replace(/<title>.*?<\/title>/, `<title>${pageTitle}</title>`);
            html = html.replace(/<meta name="description" content=".*?"/, `<meta name="description" content="${cleanDesc}"`);
            html = html.replace(/<meta property="og:title" content=".*?"/, `<meta property="og:title" content="${pageTitle}"`);
            html = html.replace(/<meta property="og:description" content=".*?"/, `<meta property="og:description" content="${cleanDesc}"`);
          }
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
    }

    const websiteDir = path.join(this.rootDir, 'website');
    const safePath = path.join(websiteDir, pathname === '/' ? 'index.html' : pathname);

    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(safePath);
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.txt': 'text/plain',
      '.xml': 'application/xml',
    };

    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    fs.createReadStream(safePath).pipe(res);
  }
}
