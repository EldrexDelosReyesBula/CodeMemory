/**
 * Entry point for Unified MCP Server from @eldrex/plugin-codememory
 */

import { UnifiedMCPServer } from '../../../src/mcp/unified.js';

export { UnifiedMCPServer };

if (process.argv[1] && process.argv[1].endsWith('unified-mcp.js')) {
  const server = new UnifiedMCPServer();
  server.start().catch((err: any) => {
    console.error('Fatal MCP Server error:', err);
    process.exit(1);
  });
}
