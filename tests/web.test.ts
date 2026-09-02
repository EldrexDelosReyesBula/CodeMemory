import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CodeMemoryDB } from '../src/db/database.js';
import { CodeMemoryWebServer } from '../src/web/server.js';

describe('Local Architecture Web Server', () => {
  let db: CodeMemoryDB;
  let webServer: CodeMemoryWebServer;
  let serverUrl: string;

  beforeEach(async () => {
    db = new CodeMemoryDB({ inMemory: true });

    const fileId = db.upsertFile({
      path: 'src/services/Payment.ts',
      language: 'typescript',
      lastModified: Date.now(),
      sizeBytes: 1500,
      checksum: 'pay-123',
    });

    db.syncFileIntelligence(
      fileId,
      [
        {
          name: 'PaymentProcessor',
          kind: 'class',
          lineStart: 1,
          lineEnd: 25,
          signature: 'export class PaymentProcessor',
        },
      ],
      []
    );

    // Pick a random unreserved high port for testing
    const testPort = 30000 + Math.floor(Math.random() * 10000);
    webServer = new CodeMemoryWebServer(db, { port: testPort });
    const res = await webServer.start();
    serverUrl = res.url;
  });

  afterEach(async () => {
    await webServer.stop();
    db.close();
  });

  it('should serve /api/architecture with nodes, edges, and metrics', async () => {
    const res = await fetch(`${serverUrl}/api/architecture`);
    expect(res.status).toBe(200);

    const data = (await res.json()) as any;
    expect(data.nodes).toBeDefined();
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0].path).toBe('src/services/Payment.ts');
    expect(data.metrics).toBeDefined();
  });

  it('should serve /api/files and /api/symbols', async () => {
    const resFiles = await fetch(`${serverUrl}/api/files`);
    expect(resFiles.status).toBe(200);
    const files = (await resFiles.json()) as any[];
    expect(files).toHaveLength(1);

    const resSymbols = await fetch(`${serverUrl}/api/symbols?query=Payment`);
    expect(resSymbols.status).toBe(200);
    const symbols = (await resSymbols.json()) as any[];
    expect(symbols).toHaveLength(1);
    expect(symbols[0].name).toBe('PaymentProcessor');
  });

  it('should serve /api/timeline with grouped daily changes', async () => {
    const res = await fetch(`${serverUrl}/api/timeline`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.timeline).toBeDefined();
  });

  it('should serve /api/docs with discovered markdown documentation', async () => {
    const res = await fetch(`${serverUrl}/api/docs`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.docs).toBeDefined();
    expect(Array.isArray(data.docs)).toBe(true);
    expect(data.docs.length).toBeGreaterThan(0);

    const firstDoc = data.docs[0];
    expect(firstDoc.id).toBeDefined();
    expect(firstDoc.title).toBeDefined();
    expect(firstDoc.content).toBeDefined();

    // Query specific doc by id
    const resSingle = await fetch(`${serverUrl}/api/docs?id=${firstDoc.id}`);
    expect(resSingle.status).toBe(200);
    const singleData = (await resSingle.json()) as any;
    expect(singleData.id).toBe(firstDoc.id);
  });

  it('should serve root / with 200 OK and index.html', async () => {
    const res = await fetch(`${serverUrl}/`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('CodeMemory');
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('should serve static assets with correct MIME types', async () => {
    const resApp = await fetch(`${serverUrl}/app.js`);
    expect(resApp.status).toBe(200);
    expect(resApp.headers.get('content-type')).toContain('javascript');

    const resStyle = await fetch(`${serverUrl}/style.css`);
    expect(resStyle.status).toBe(200);
    expect(resStyle.headers.get('content-type')).toContain('css');
  });

  it('should fallback to index.html for SPA routes', async () => {
    const resSpa = await fetch(`${serverUrl}/docs/quick-start`);
    expect(resSpa.status).toBe(200);
    const text = await resSpa.text();
    expect(text).toContain('CodeMemory');
    expect(resSpa.headers.get('content-type')).toContain('text/html');
  });

  it('should return 404 for unknown api routes', async () => {
    const res404 = await fetch(`${serverUrl}/api/unknown_endpoint`);
    expect(res404.status).toBe(404);
  });
});

