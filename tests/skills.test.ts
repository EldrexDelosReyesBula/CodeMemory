import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SkillsParser } from '../src/parser/skills.js';
import { CodeMemoryDB } from '../src/db/database.js';
import { ContextEngine } from '../src/context/ranker.js';

describe('Skills.md & Agent Instruction Integration', () => {
  let db: CodeMemoryDB;

  beforeEach(() => {
    db = new CodeMemoryDB({ inMemory: true });
  });

  afterEach(() => {
    db.close();
  });

  it('should parse markdown sections and extract shell commands with safety checks', () => {
    const markdown = `# CodeMemory Project

## Description
A persistent codebase memory system.

## Commands
- \`npm run build\` — Build the project
- \`npm test\` — Run test suites
- \`rm -rf dist\` — Force clean build

## Conventions
- Use TypeScript strict mode
- Do not commit secrets
`;

    const sections = SkillsParser.parse('SKILLS.md', markdown);
    expect(sections).toHaveLength(4);

    const cmdSection = sections.find((s) => s.section === 'Commands');
    expect(cmdSection).toBeDefined();
    expect(cmdSection?.commands).toHaveLength(3);

    const buildCmd = cmdSection?.commands?.find((c) => c.command === 'npm run build');
    expect(buildCmd?.safe).toBe(true);

    const rmCmd = cmdSection?.commands?.find((c) => c.command.includes('rm -rf'));
    expect(rmCmd?.safe).toBe(false);
    expect(rmCmd?.requiresApproval).toBe(true);
  });

  it('should store, search, and retrieve skill instructions from domain model', () => {
    const markdown = `# Agent Rules

## Commands
- \`npm run dev\` — Start development server

## Conventions
- Follow functional style in CairnJS components
`;

    const sections = SkillsParser.parse('AGENTS.md', markdown);
    for (const s of sections) {
      db.upsertSkillInstruction(s);
    }

    const allSkills = db.getSkillInstructions();
    expect(allSkills.length).toBeGreaterThanOrEqual(2);

    const searchResults = db.searchSkillInstructions('development server');
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].section).toBe('Commands');

    const conventions = db.getConventions('CairnJS');
    expect(conventions).toHaveLength(1);
    expect(conventions[0].content).toContain('functional style');

    const commands = db.getExtractedCommands('dev');
    expect(commands).toHaveLength(1);
    expect(commands[0].command).toBe('npm run dev');
  });

  it('should inject matching skill instructions into change-aware context', () => {
    db.upsertSkillInstruction({
      filePath: 'SKILLS.md',
      toolTarget: 'generic',
      section: 'Testing',
      content: 'Run `npm test` before submitting changes',
      commands: [
        { command: 'npm test', description: 'Run test suites', safe: true },
      ],
    });

    const engine = new ContextEngine(db);
    const context = engine.getContext({
      task: 'Testing payment processing',
    });

    expect(context.skill_instructions).toBeDefined();
    expect(context.skill_instructions?.length).toBe(1);
    expect(context.skill_instructions?.[0].file).toBe('SKILLS.md');
    expect(context.skill_instructions?.[0].commands?.[0].command).toBe('npm test');
  });
});
