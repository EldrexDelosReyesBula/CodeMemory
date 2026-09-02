/**
 * CodeMemoryBridge
 *
 * Bridge providing integration between DevDiff and CodeMemory.
 * Enables DevDiff to access AST symbols and dependency information from CodeMemory,
 * and allows recording change logs back into CodeMemory persistence.
 */

import { CodeMemoryBridge } from '../../../src/devdiff/bridge.js';

export * from '../../../src/devdiff/bridge.js';
export { CodeMemoryBridge };
export default CodeMemoryBridge;
