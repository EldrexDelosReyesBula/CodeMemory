/**
 * CodeMemory Skills.md & Agent Instruction Parser (v1.4.0)
 * Parses SKILLS.md, AGENTS.md, CLAUDE.md, CURSOR.md, and extracts commands/conventions.
 */

import path from 'node:path';
import type { SkillInstructionRecord, ExtractedCommand } from '../types/index.js';

export const SUPPORTED_SKILL_FILES = [
  'SKILLS.md',
  'AGENTS.md',
  'CLAUDE.md',
  'CURSOR.md',
  '.cursorrules',
  'COPILOT.md',
  '.github/copilot-instructions.md',
  'GEMINI.md',
  'CONTEXT.md',
];

export class SkillsParser {
  /**
   * Determine target agent tool from filename.
   */
  public static detectToolTarget(filePath: string): string {
    const base = path.basename(filePath).toLowerCase();
    if (base.includes('claude')) return 'claude';
    if (base.includes('cursor')) return 'cursor';
    if (base.includes('copilot')) return 'copilot';
    if (base.includes('gemini')) return 'gemini';
    return 'generic';
  }

  /**
   * Check if a relative path matches an agent instruction file.
   */
  public static isSkillFile(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    return SUPPORTED_SKILL_FILES.some((f) => normalized.endsWith(f) || normalized === f);
  }

  /**
   * Parse Markdown content into structured sections and commands.
   */
  public static parse(filePath: string, content: string): SkillInstructionRecord[] {
    const toolTarget = this.detectToolTarget(filePath);
    const lines = content.split('\n');
    const sections: SkillInstructionRecord[] = [];

    let currentSection = 'Overview';
    let currentLevel = 1;
    let currentContent: string[] = [];
    let startLine = 1;

    const finalizeSection = (endLine: number) => {
      const sectionText = currentContent.join('\n').trim();
      const commands = this.extractCommands(sectionText);
      sections.push({
        filePath: filePath.replace(/\\/g, '/'),
        toolTarget,
        section: currentSection,
        headingLevel: currentLevel,
        content: sectionText,
        commands: commands.length > 0 ? commands : undefined,
        lineStart: startLine,
        lineEnd: endLine,
      });
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        if (currentContent.length > 0 || currentSection !== 'Overview') {
          finalizeSection(i);
        }
        currentLevel = headingMatch[1].length;
        currentSection = headingMatch[2].trim();
        currentContent = [];
        startLine = i + 1;
      } else {
        currentContent.push(line);
      }
    }

    finalizeSection(lines.length);
    return sections;
  }

  /**
   * Extract executable shell commands and evaluate safety flags.
   */
  public static extractCommands(text: string): ExtractedCommand[] {
    const commands: ExtractedCommand[] = [];

    // 1. Match code blocks (```bash ... ```)
    const codeBlockRegex = /```(?:bash|sh|shell|zsh)?\n([\s\S]*?)```/g;
    let blockMatch;
    while ((blockMatch = codeBlockRegex.exec(text)) !== null) {
      const blockLines = blockMatch[1].split('\n');
      for (const rawLine of blockLines) {
        const cmd = rawLine.trim().replace(/^[$>]\s*/, '');
        if (cmd && !cmd.startsWith('#')) {
          commands.push({
            command: cmd,
            description: 'Shell command in code block',
            safe: this.isSafeCommand(cmd),
            requiresApproval: !this.isSafeCommand(cmd),
          });
        }
      }
    }

    // 2. Match inline backtick commands with description (`npm run build` — Build project)
    const inlineRegex = /-\s*`([^`]+)`(?:\s*[-—:]\s*(.+))?/g;
    let inlineMatch;
    while ((inlineMatch = inlineRegex.exec(text)) !== null) {
      const cmd = inlineMatch[1].trim();
      const desc = inlineMatch[2] ? inlineMatch[2].trim() : 'Project command';
      if (cmd && !commands.some((c) => c.command === cmd)) {
        commands.push({
          command: cmd,
          description: desc,
          safe: this.isSafeCommand(cmd),
          requiresApproval: !this.isSafeCommand(cmd),
        });
      }
    }

    return commands;
  }

  /**
   * Determine if command is safe (read-only / standard build / test).
   */
  private static isSafeCommand(cmd: string): boolean {
    const lower = cmd.toLowerCase();
    const destructive = ['rm -rf', 'del /f', 'drop table', 'shutdown', 'format', ':(){ :|:& };:'];
    if (destructive.some((d) => lower.includes(d))) return false;

    const safePrefixes = ['npm test', 'npm run build', 'npm run dev', 'cargo check', 'cargo test', 'git status', 'git diff', 'pytest', 'node '];
    return safePrefixes.some((p) => lower.startsWith(p)) || !lower.includes('rm ');
  }
}
