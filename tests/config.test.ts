import { describe, it, expect } from 'vitest';
import { ConfigManager, DEFAULT_CONFIG } from '../src/config/index.js';

describe('ConfigManager', () => {
  it('should load default configuration when no file exists', () => {
    const manager = new ConfigManager();
    const config = manager.getConfig();

    expect(config.watch.debounceMs).toBe(100);
    expect(config.storage.location).toBe('.codememory');
    expect(config.ollama.enabled).toBe(false);
    expect(config.mcp.enabled).toBe(true);
  });
});
