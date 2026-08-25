import { describe, it, expect } from 'vitest';
import { SecurityScanner } from '../src/security/scanner.js';

describe('SecurityScanner', () => {
  it('should detect OpenAI API key patterns', () => {
    const code = 'const apiKey = "sk-1234567890abcdef1234567890abcdef";';
    const findings = SecurityScanner.scan(code);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toContain('API Key');
  });

  it('should redact secrets from code snippets', () => {
    const code = 'const token = "ghp_1234567890abcdef1234567890abcdef1234";';
    const redacted = SecurityScanner.redact(code);

    expect(redacted).not.toContain('ghp_');
    expect(redacted).toContain('[REDACTED_SECRET]');
  });
});
