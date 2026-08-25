/**
 * CodeMemory Security & Secrets Scanner
 * Scans code snippets before context extraction or export to detect accidentally embedded secrets.
 */

export interface SecretFinding {
  line: number;
  type: string;
  preview: string;
  description?: string;
}

export class SecurityScanner {
  private static readonly SECRET_PATTERNS = [
    { type: 'AWS Access Key', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
    { type: 'OpenAI / Generic API Key', regex: /sk-[a-zA-Z0-9]{20,48}/g },
    { type: 'GitHub Personal Access Token', regex: /gh[pousr]_[a-zA-Z0-9]{36,255}/g },
    { type: 'Slack Token', regex: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}/g },
    { type: 'Private Key', regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
    { type: 'Generic Password / Secret Assignment', regex: /(?:password|secret|api_key|apikey|auth_token)\s*[:=]\s*['"][a-zA-Z0-9_!@#$%^&*()-]{8,}['"]/gi },
  ];

  /**
   * Scan text content for potential secret exposures.
   */
  public static scan(content: string): SecretFinding[] {
    const findings: SecretFinding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of this.SECRET_PATTERNS) {
        pattern.regex.lastIndex = 0;
        if (pattern.regex.test(line)) {
          findings.push({
            line: i + 1,
            type: pattern.type,
            preview: line.slice(0, 40) + '...',
            description: `Potential ${pattern.type} detected on line ${i + 1}`,
          });
        }
      }
    }

    return findings;
  }

  public scanForSecrets(_filePath: string, content: string): SecretFinding[] {
    return SecurityScanner.scan(content);
  }

  /**
   * Mask secrets in text to prevent prompt leakage.
   */
  public static redact(content: string): string {
    let redacted = content;
    for (const pattern of this.SECRET_PATTERNS) {
      redacted = redacted.replace(pattern.regex, '[REDACTED_SECRET]');
    }
    return redacted;
  }

  public redactSecrets(content: string): string {
    return SecurityScanner.redact(content);
  }
}
