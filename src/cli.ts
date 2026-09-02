#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'node:fs';
import path from 'node:path';
import Table from 'cli-table3';
import { CodeMemoryDB } from './db/database.js';
import { FileWatcherEngine } from './watcher/engine.js';
import { ContextEngine } from './context/ranker.js';
import { MermaidGenerator } from './generator/mermaid.js';
import { CodebaseExporter, type ExportFormat } from './generator/exporter.js';
import { ConfigManager } from './config/index.js';
import { GitMonitor } from './git/monitor.js';
import { CodeMemoryMCPServer } from './mcp/server.js';
import { PluginRegistry } from './plugins/index.js';
import { CodeMemoryWebServer } from './web/server.js';

const program = new Command();

program
  .name('codememory')
  .description('A Persistent Engineering Context Layer for AI-Assisted Development')
  .version('2.0.0');

// 1. init
program
  .command('init')
  .description('Initialize CodeMemory database and index the current codebase')
  .action(async () => {
    console.log(chalk.bold.cyan('\n🧠 CodeMemory Initializer'));
    const spinner = ora('Scanning and indexing codebase...').start();
    const startTime = Date.now();

    try {
      const db = new CodeMemoryDB();
      const watcher = new FileWatcherEngine(db);
      const result = await watcher.scanAll();

      const elapsed = Date.now() - startTime;
      spinner.succeed(
        chalk.green(
          `Initialized successfully! Indexed ${result.filesScanned} files and ${result.symbolsIndexed} symbols in ${elapsed}ms.`
        )
      );
      console.log(chalk.gray(`Database location: ${path.join(process.cwd(), '.codememory', 'codememory.db')}\n`));
      console.log(chalk.bold('Next steps:'));
      console.log(chalk.cyan('  codememory ide init --all                ') + chalk.gray('- Setup IDE MCP configurations'));
      console.log(chalk.cyan('  codememory web                           ') + chalk.gray('- Launch Interactive Architecture Explorer'));
      console.log(chalk.cyan('  codememory skills list                   ') + chalk.gray('- Inspect project skills & instructions'));
      console.log(chalk.cyan('  codememory watch                         ') + chalk.gray('- Start live background watcher'));
      console.log(chalk.cyan('  codememory mcp                           ') + chalk.gray('- Launch MCP server for AI tools\n'));
    } catch (err: any) {
      spinner.fail(chalk.red(`Initialization failed: ${err.message}`));
      process.exit(1);
    }
  });

// 2. scan
program
  .command('scan')
  .description('Re-scan and index codebase symbols and dependencies')
  .action(async () => {
    const spinner = ora('Scanning repository...').start();
    const startTime = Date.now();
    try {
      const db = new CodeMemoryDB();
      const watcher = new FileWatcherEngine(db);
      const result = await watcher.scanAll();
      const elapsed = Date.now() - startTime;
      spinner.succeed(
        chalk.green(
          `Scan complete in ${elapsed}ms! Indexed ${result.filesScanned} files, ${result.symbolsIndexed} symbols.`
        )
      );
    } catch (err: any) {
      spinner.fail(chalk.red(`Scan failed: ${err.message}`));
      process.exit(1);
    }
  });

// 3. watch
program
  .command('watch')
  .description('Start the real-time background file watcher')
  .option('-d, --debounce <ms>', 'Debounce window in ms', '100')
  .option('-q, --quiet', 'Suppress file event logging')
  .action((options) => {
    console.log(chalk.bold.cyan('\n👁️ CodeMemory Real-Time Watcher'));
    console.log(chalk.gray('Watching repository for changes... (Press Ctrl+C to exit)\n'));

    const db = new CodeMemoryDB();
    const watcher = new FileWatcherEngine(db, {
      debounceMs: parseInt(options.debounce, 10) || 100,
      quiet: options.quiet ?? false,
      onEvent: (event, filePath) => {
        if (!options.quiet) {
          const timeStr = new Date().toLocaleTimeString();
          console.log(chalk.gray(`[${timeStr}] `) + chalk.yellow(`${event.padEnd(8)} `) + chalk.white(filePath));
        }
      },
    });

    watcher.start();

    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nStopping watcher...'));
      watcher.stop();
      process.exit(0);
    });
  });

// 4. web (Interactive Web Explorer & Local Server)
program
  .command('web')
  .description('Launch the local interactive Architecture Explorer and Documentation portal')
  .option('-p, --port <port>', 'Server port (default: 3737)', '3737')
  .option('-h, --host <host>', 'Host binding (default: 127.0.0.1)', '127.0.0.1')
  .option('-m, --mode <mode>', 'Launch mode: auto (auto-open browser) or manual (print URL only)', 'auto')
  .option('--open', 'Open browser automatically')
  .option('--daemon', 'Run server in background daemon process')
  .action(async (options) => {
    const port = parseInt(options.port, 10) || 3737;
    const host = options.host || '127.0.0.1';

    if (options.daemon) {
      const { spawn } = await import('node:child_process');
      const filteredArgs = process.argv.slice(2).filter((a) => a !== '--daemon');
      const child = spawn(process.execPath, [process.argv[1], ...filteredArgs], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      console.log(chalk.bold.green('\n✓ CodeMemory Web Explorer started in background'));
      console.log(chalk.gray(`  URL: http://${host}:${port}`));
      console.log(chalk.gray(`  PID: ${child.pid}\n`));
      process.exit(0);
    }

    const db = new CodeMemoryDB();
    const watcher = new FileWatcherEngine(db, {
      quiet: true,
      onEvent: (eventType, filePath) => {
        webServer.broadcastEvent(eventType, { path: filePath });
      },
    });

    if (db.getAllFiles().length === 0) {
      await watcher.scanAll();
    }

    const webServer = new CodeMemoryWebServer(db, { port, host });
    watcher.start();

    try {
      const { url } = await webServer.start();
      console.log('\n' + chalk.cyan('┌─────────────────────────────────────────┐'));
      console.log(chalk.cyan('│') + chalk.bold.white('       CodeMemory Web Explorer           ') + chalk.cyan('│'));
      console.log(chalk.cyan('├─────────────────────────────────────────┤'));
      console.log(chalk.cyan('│') + '                                         ' + chalk.cyan('│'));
      console.log(chalk.cyan('│') + `  Local URL: ${chalk.green.bold(url.padEnd(28))}` + chalk.cyan('│'));
      console.log(chalk.cyan('│') + '                                         ' + chalk.cyan('│'));
      console.log(chalk.cyan('│') + chalk.gray('  Press Ctrl+C to stop                   ') + chalk.cyan('│'));
      console.log(chalk.cyan('│') + '                                         ' + chalk.cyan('│'));
      console.log(chalk.cyan('└─────────────────────────────────────────┘\n'));

      const shouldOpen = options.open || options.mode === 'auto';
      if (shouldOpen) {
        import('node:child_process').then(({ exec }) => {
          const cmd =
            process.platform === 'win32'
              ? `start "" "${url}"`
              : process.platform === 'darwin'
              ? `open "${url}"`
              : `xdg-open "${url}"`;
          exec(cmd, () => {});
        }).catch(() => {});
      }

      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\nStopping CodeMemory Web Server...'));
        watcher.stop();
        await webServer.stop();
        process.exit(0);
      });
    } catch (err: any) {
      console.error(chalk.red(`Failed to start Web Server: ${err.message}`));
      process.exit(1);
    }
  });

// 5. status
program
  .command('status')
  .description('Show repository memory metrics, Git status, and change hotspots')
  .action(() => {
    const db = new CodeMemoryDB();
    const metrics = db.getCodebaseMetrics();
    const git = new GitMonitor();
    const gitStatus = git.getStatus();
    const hotspots = db.getHotspots(5);

    console.log(chalk.bold.cyan('\n📊 CodeMemory System Status\n'));

    if (gitStatus.isGitRepo) {
      console.log(chalk.bold('Git Branch:         ') + chalk.green(gitStatus.branch || 'unknown'));
      console.log(chalk.bold('Modified Files:     ') + (gitStatus.modifiedFiles.length > 0 ? chalk.yellow(`${gitStatus.modifiedFiles.length} files`) : chalk.green('clean')));
      if (gitStatus.latestCommit) {
        console.log(chalk.bold('Latest Commit:      ') + chalk.white(`${gitStatus.latestCommit.hash} - ${gitStatus.latestCommit.message}`));
      }
      console.log('');
    }

    console.log(chalk.bold('Files Indexed:      ') + chalk.white(metrics.totalFiles));
    console.log(chalk.bold('Symbols Tracked:    ') + chalk.white(metrics.totalSymbols));
    console.log(chalk.bold('Dependencies:       ') + chalk.white(metrics.totalDependencies));

    if (hotspots.length > 0) {
      console.log(chalk.bold.yellow('\n🔥 Top Change Hotspots:'));
      for (const h of hotspots) {
        console.log(chalk.gray(`  • ${h.path} (${h.changeCount} changes)`));
      }
    }

    console.log(chalk.bold('\nLanguages:'));
    for (const [lang, count] of Object.entries(metrics.languages)) {
      console.log(`  • ${lang.padEnd(15)}: ${count}`);
    }

    console.log(chalk.bold('\nSymbol Kinds:'));
    for (const [kind, count] of Object.entries(metrics.symbolKinds)) {
      console.log(`  • ${kind.padEnd(15)}: ${count}`);
    }
    console.log('');
  });

// 6. query
program
  .command('query [term]')
  .description('Query symbols, dependencies, or history')
  .option('-k, --kind <kind>', 'Filter by symbol kind (class, function, etc.)')
  .option('-l, --lang <lang>', 'Filter by language')
  .option('--dependencies <file>', 'List outgoing dependencies for a file')
  .option('--dependents <file>', 'List incoming dependents for a file')
  .option('--annotations <file>', 'List annotations for a file')
  .option('--history <file>', 'Show change history for a file')
  .action((term, options) => {
    const db = new CodeMemoryDB();

    if (options.dependencies) {
      const deps = db.getDependenciesForFile(options.dependencies);
      console.log(chalk.bold.cyan(`\n📦 Dependencies of "${options.dependencies}":\n`));
      if (deps.length === 0) {
        console.log(chalk.gray('No outgoing dependencies found.\n'));
        return;
      }
      for (const d of deps) {
        console.log(`  • ${chalk.white(d.target_symbol_name)} ${chalk.gray(`(${d.import_path})`)}`);
      }
      console.log('');
      return;
    }

    if (options.dependents) {
      const dependents = db.getDependentsForFile(options.dependents);
      console.log(chalk.bold.cyan(`\n🔗 Dependents of "${options.dependents}":\n`));
      if (dependents.length === 0) {
        console.log(chalk.gray('No dependents found.\n'));
        return;
      }
      for (const d of dependents) {
        console.log(`  • ${chalk.white(d.source_path)} imports ${chalk.cyan(d.target_symbol_name)}`);
      }
      console.log('');
      return;
    }

    if (options.annotations) {
      const annos = db.getAnnotationsForFile(options.annotations);
      console.log(chalk.bold.cyan(`\n🏷️ Annotations for "${options.annotations}":\n`));
      if (annos.length === 0) {
        console.log(chalk.gray('No annotations found.\n'));
        return;
      }
      for (const a of annos) {
        console.log(`  • [${chalk.yellow(a.source)}] ${chalk.bold(a.key)}: ${a.value} (conf: ${a.confidence || 1.0})`);
      }
      console.log('');
      return;
    }

    if (options.history) {
      const history = db.getHistoryForPath(options.history);
      console.log(chalk.bold.cyan(`\n📜 Change History for "${options.history}":\n`));
      for (const h of history) {
        console.log(`  • ${chalk.yellow(h.eventType.padEnd(8))} ${chalk.gray(h.timestamp)} - ${h.diffSummary || ''}`);
      }
      console.log('');
      return;
    }

    const results = db.searchSymbols({
      query: term || '',
      kind: options.kind,
      language: options.lang,
    });

    console.log(chalk.bold.cyan(`\n🔎 Found ${results.length} matching symbols:\n`));

    const table = new Table({
      head: [chalk.cyan('Symbol'), chalk.cyan('Kind'), chalk.cyan('File'), chalk.cyan('Line')],
    });

    for (const r of results.slice(0, 30)) {
      table.push([r.name, r.kind, r.filePath || '', `${r.lineStart}-${r.lineEnd}`]);
    }

    console.log(table.toString());
    console.log('');
  });

// 7. context
program
  .command('context')
  .description('Generate change-aware context payload for AI agents')
  .option('-t, --task <task>', 'Task description')
  .option('-f, --file <file>', 'Target focus file path')
  .option('-s, --symbol <symbol>', 'Target focus symbol name')
  .option('-b, --budget <tokens>', 'Token budget', '4000')
  .action((options) => {
    const db = new CodeMemoryDB();
    const engine = new ContextEngine(db);

    const context = engine.getContext({
      task: options.task,
      file: options.file,
      target: options.symbol,
      tokenBudget: parseInt(options.budget, 10),
    });

    console.log(chalk.bold.cyan(`\n🎯 Change-Aware Context for "${context.focus || options.task || 'codebase'}"`));
    console.log(chalk.gray(`Generated context for "${context.focus || 'task'}". ${context.direct_dependencies.length} direct dependencies, ${context.recent_changes.length} recent changes, and ${context.related_tests.length} related test files found.\n`));

    if (context.direct_dependencies.length > 0) {
      console.log(chalk.bold('Direct Dependencies:'));
      for (const d of context.direct_dependencies) {
        console.log(`  • ${chalk.white(d.symbol)} ${chalk.gray(`(${d.path})`)}`);
      }
      console.log('');
    }

    if (context.skill_instructions && context.skill_instructions.length > 0) {
      console.log(chalk.bold('Relevant Skills & Commands:'));
      for (const s of context.skill_instructions) {
        console.log(`  • [${chalk.cyan(s.file)}] ${chalk.bold(s.section)}:`);
        if (s.commands) {
          for (const c of s.commands) {
            console.log(`      $ ${chalk.green(c.command)} - ${chalk.gray(c.description)}`);
          }
        }
      }
      console.log('');
    }

    if (context.annotations && context.annotations.length > 0) {
      console.log(chalk.bold('Annotations:'));
      for (const a of context.annotations) {
        console.log(`  • [${chalk.yellow(a.source)}] ${a.key}: ${a.value}`);
      }
      console.log('');
    }

    if (context.code_snippets && context.code_snippets.length > 0) {
      console.log(chalk.bold('--- Targeted Code Snippets ---\n'));
      for (const snip of context.code_snippets) {
        console.log(chalk.cyan(`File: ${snip.path} (~${snip.estimated_tokens} tokens)`));
        console.log(chalk.gray(snip.content));
        console.log('');
      }
    }
  });

// 8. skills
const skillsCmd = program.command('skills').description('Manage and inspect agent instructions and skills');

skillsCmd
  .command('list')
  .description('List all detected skill instruction files and sections')
  .action(() => {
    const db = new CodeMemoryDB();
    const skills = db.getSkillInstructions();

    console.log(chalk.bold.cyan('\n🧠 Detected Project Skills & Agent Instructions:\n'));
    if (skills.length === 0) {
      console.log(chalk.gray('No skill instruction files detected (e.g. SKILLS.md, AGENTS.md, CLAUDE.md).\n'));
      return;
    }

    const filesMap: Record<string, string[]> = {};
    for (const s of skills) {
      if (!filesMap[s.filePath]) filesMap[s.filePath] = [];
      filesMap[s.filePath].push(s.section);
    }

    for (const [file, sections] of Object.entries(filesMap)) {
      console.log(chalk.bold.white(`📄 ${file}`));
      for (const sec of sections) {
        console.log(chalk.gray(`    • ${sec}`));
      }
    }
    console.log('');
  });

skillsCmd
  .command('commands')
  .description('List all extracted shell commands and safety flags')
  .option('-t, --topic <topic>', 'Filter commands by topic')
  .action((options) => {
    const db = new CodeMemoryDB();
    const commands = db.getExtractedCommands(options.topic);

    console.log(chalk.bold.cyan('\n⚡ Extracted Project Commands:\n'));
    if (commands.length === 0) {
      console.log(chalk.gray('No commands found.\n'));
      return;
    }

    for (const c of commands) {
      const safety = c.safe ? chalk.green('[safe]') : chalk.yellow('[requires approval]');
      console.log(`  ${safety} ${chalk.bold.white(c.command)} — ${chalk.gray(c.description)}`);
    }
    console.log('');
  });

skillsCmd
  .command('conventions')
  .description('List project coding conventions and agent rules')
  .action(() => {
    const db = new CodeMemoryDB();
    const conventions = db.getConventions();

    console.log(chalk.bold.cyan('\n📜 Project Coding Conventions & Rules:\n'));
    if (conventions.length === 0) {
      console.log(chalk.gray('No conventions sections found in skill files.\n'));
      return;
    }

    for (const c of conventions) {
      console.log(chalk.bold.white(`• [${c.filePath}] ${c.section}:`));
      console.log(chalk.gray(c.content.split('\n').map(l => `    ${l}`).join('\n')));
      console.log('');
    }
  });

// 9. ide
const ideCmd = program.command('ide').description('Local IDE AI Agent MCP configuration manager');

ideCmd
  .command('init [target]')
  .description('Generate MCP configuration for an IDE (vscode, cursor, jetbrains, claude-desktop, or --all)')
  .option('--all', 'Generate for all IDEs')
  .action((target, options) => {
    const rootDir = process.cwd();
    const isAll = options.all || target === 'all' || target === '--all';
    const targets = isAll ? ['vscode', 'cursor', 'claude-desktop'] : [target || 'vscode'];

    console.log(chalk.bold.cyan('\n🛠️ Generating Local IDE Agent MCP Configurations:\n'));

    for (const t of targets) {
      if (t === 'vscode') {
        const dir = path.join(rootDir, '.vscode');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const filePath = path.join(dir, 'mcp.json');
        const config = {
          servers: {
            codememory: {
              command: 'node',
              args: [path.join(rootDir, 'dist', 'cli.js'), 'mcp'],
              env: {},
            },
          },
        };
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
        console.log(chalk.green(`  ✓ Created VS Code Copilot config: ${chalk.bold('.vscode/mcp.json')}`));
      } else if (t === 'cursor') {
        const dir = path.join(rootDir, '.cursor');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const filePath = path.join(dir, 'mcp.json');
        const config = {
          mcpServers: {
            codememory: {
              command: 'node',
              args: [path.join(rootDir, 'dist', 'cli.js'), 'mcp'],
            },
          },
        };
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
        console.log(chalk.green(`  ✓ Created Cursor AI config: ${chalk.bold('.cursor/mcp.json')}`));
      } else if (t === 'claude-desktop') {
        const filePath = path.join(rootDir, 'claude_desktop_mcp.json');
        const config = {
          mcpServers: {
            codememory: {
              command: 'node',
              args: [path.join(rootDir, 'dist', 'cli.js'), 'mcp'],
            },
          },
        };
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
        console.log(chalk.green(`  ✓ Created Claude Desktop config: ${chalk.bold('claude_desktop_mcp.json')}`));
      }
    }
    console.log(chalk.gray('\nYour IDE agents can now directly query CodeMemory on stdio transport!\n'));
  });

ideCmd
  .command('status')
  .description('Show detected IDE configurations in current workspace')
  .action(() => {
    const rootDir = process.cwd();
    console.log(chalk.bold.cyan('\n🔍 IDE Integration Status:\n'));

    const hasVsCode = fs.existsSync(path.join(rootDir, '.vscode', 'mcp.json'));
    const hasCursor = fs.existsSync(path.join(rootDir, '.cursor', 'mcp.json'));

    console.log(`  • VS Code Copilot : ${hasVsCode ? chalk.green('Configured (.vscode/mcp.json)') : chalk.gray('Not initialized (run `codememory ide init vscode`)')}`);
    console.log(`  • Cursor AI       : ${hasCursor ? chalk.green('Configured (.cursor/mcp.json)') : chalk.gray('Not initialized (run `codememory ide init cursor`)')}`);
    console.log('');
  });

// 10. export
program
  .command('export')
  .description('Export intelligence map in json, markdown, or graphml format')
  .option('-f, --format <format>', 'Export format (json, markdown, graphml)', 'json')
  .option('-o, --output <file>', 'Output file path')
  .action((options) => {
    const db = new CodeMemoryDB();
    const exporter = new CodebaseExporter(db);
    const result = exporter.export(options.format as ExportFormat);

    if (options.output) {
      fs.writeFileSync(options.output, result, 'utf8');
      console.log(chalk.green(`Exported intelligence map to ${options.output}`));
    } else {
      console.log(result);
    }
  });

// 11. diagram
program
  .command('diagram')
  .description('Generate Mermaid architecture diagram')
  .option('-d, --direction <dir>', 'Direction (TD, LR)', 'TD')
  .option('-m, --module <module>', 'Focus on a specific directory/module')
  .option('-c, --class-diagram', 'Generate Class diagram instead of Flowchart')
  .action((options) => {
    const db = new CodeMemoryDB();
    const generator = new MermaidGenerator(db);

    const diagram = options.classDiagram
      ? generator.generateClassDiagram(options.module)
      : generator.generateArchitectureDiagram({
          direction: options.direction as any,
          focusModule: options.module,
        });

    console.log(diagram);
  });

// 12. config
program
  .command('config')
  .description('Display CodeMemory configuration')
  .action(() => {
    const manager = new ConfigManager();
    const config = manager.getConfig();
    console.log(chalk.bold.cyan('\n⚙️ CodeMemory Configuration:\n'));
    console.log(JSON.stringify(config, null, 2));
    console.log('');
  });

// 13. plugin
const pluginCmd = program.command('plugin').description('Manage CodeMemory plugins');

pluginCmd
  .command('list')
  .description('List installed and active plugins')
  .action(() => {
    const db = new CodeMemoryDB();
    const registry = PluginRegistry.getInstance(db);
    const plugins = registry.listPlugins();

    console.log(chalk.bold.cyan('\n🔌 Installed CodeMemory Plugins:\n'));
    for (const p of plugins) {
      const status = p.enabled !== false ? chalk.green('enabled') : chalk.gray('disabled');
      console.log(`  • ${chalk.bold.white(p.name)} (${chalk.cyan(p.id)}) v${p.version} - ${status}`);
    }
    console.log('');
  });

pluginCmd
  .command('enable <id>')
  .description('Enable an installed plugin')
  .action((id) => {
    const registry = PluginRegistry.getInstance();
    if (registry.enablePlugin(id)) {
      console.log(chalk.green(`Plugin "${id}" enabled.`));
    } else {
      console.log(chalk.red(`Plugin "${id}" not found.`));
    }
  });

pluginCmd
  .command('disable <id>')
  .description('Disable an installed plugin')
  .action((id) => {
    const registry = PluginRegistry.getInstance();
    if (registry.disablePlugin(id)) {
      console.log(chalk.yellow(`Plugin "${id}" disabled.`));
    } else {
      console.log(chalk.red(`Plugin "${id}" not found.`));
    }
  });

pluginCmd
  .command('remove <id>')
  .description('Cleanly remove plugin and safely purge its namespaced data')
  .action((id) => {
    const db = new CodeMemoryDB();
    const registry = PluginRegistry.getInstance(db);
    const res = registry.removePlugin(id, db);
    if (res.removed) {
      console.log(chalk.green(`Plugin "${id}" removed. Purged ${res.annotationsRemoved} annotations, ${res.relationshipsRemoved} relationships.`));
    } else {
      console.log(chalk.red(`Plugin "${id}" not found.`));
    }
  });

// 14. clean
program
  .command('clean')
  .description('Remove stored memory database and reset indexing')
  .action(() => {
    const db = new CodeMemoryDB();
    db.clean();
    console.log(chalk.green('CodeMemory database cleaned successfully.'));
  });

// 15. devdiff — Optional DevDiff Integration Commands
const devdiffCmd = program.command('devdiff').description('DevDiff integration utilities and memory synchronization');

devdiffCmd
  .command('sync')
  .description('Synchronize Git-tracked files with CodeMemory index')
  .action(async () => {
    const { CodeMemoryBridge } = await import('./devdiff/bridge.js');
    const db = new CodeMemoryDB();
    CodeMemoryBridge.setLocalDatabase(db);

    console.log(chalk.cyan('\nSynchronizing repository tracking with CodeMemory...\n'));
    const report = await CodeMemoryBridge.sync();
    console.log(`  • CodeMemory indexed files : ${chalk.bold(report.codeMemoryFiles)}`);
    console.log(`  • Repository tracked files : ${chalk.bold(report.trackedFiles)}`);
    console.log(`  • Indexed & tracked in both: ${chalk.bold(report.inBoth)}`);
    console.log(`\n  Status: ${report.synchronized ? chalk.green('Synchronized') : chalk.yellow('Untracked files exist')}\n`);
  });

devdiffCmd
  .command('compare')
  .description('Compare tracked repository files with CodeMemory index')
  .action(async () => {
    const { CodeMemoryBridge } = await import('./devdiff/bridge.js');
    const db = new CodeMemoryDB();
    CodeMemoryBridge.setLocalDatabase(db);

    const comparison = await CodeMemoryBridge.compare();
    console.log('\n' + comparison + '\n');
  });

devdiffCmd
  .command('impact [files...]')
  .description('Analyze direct and indirect caller dependencies for specified files')
  .action(async (files) => {
    const { CodeMemoryBridge } = await import('./devdiff/bridge.js');
    const db = new CodeMemoryDB();
    CodeMemoryBridge.setLocalDatabase(db);

    const targetFiles = files && files.length > 0 ? files : ['src/cli.ts'];
    console.log(chalk.cyan('\nDependency Impact Analysis:\n'));

    const impacts = await CodeMemoryBridge.analyzeImpact(targetFiles);
    for (const imp of impacts) {
      console.log(`  File: ${chalk.bold.white(imp.file)} (${imp.dependentCount} direct dependents)`);
      if (imp.directDependents.length > 0) {
        for (const dep of imp.directDependents.slice(0, 5)) {
          console.log(chalk.gray(`    ↳ ${dep.path}`));
        }
        if (imp.directDependents.length > 5) {
          console.log(chalk.gray(`    ... and ${imp.directDependents.length - 5} more`));
        }
      }
      console.log('');
    }
  });

devdiffCmd
  .command('explain <file>')
  .description('Display file change history with associated symbols')
  .action(async (file) => {
    const db = new CodeMemoryDB();
    const history = db.getHistoryForPath(file, 5);
    const symbols = db.getSymbolsForFile(file);
    const callers = db.getDependentsForFile(file);

    console.log(chalk.cyan(`\nFile Summary: ${chalk.bold.white(file)}\n`));
    console.log(`  • AST Symbols: ${symbols.length}`);
    console.log(`  • Dependents : ${callers.length}`);
    console.log(`  • History    : ${history.length} change record(s)`);
    console.log('');

    if (history.length > 0) {
      console.log(chalk.bold.white('  Recent Changes:'));
      for (const h of history) {
        console.log(chalk.gray(`    [${h.timestamp.slice(0, 10)}] ${h.gitAuthor || 'User'}: ${h.diffSummary || h.gitMessage || h.eventType}`));
      }
      console.log('');
    }
  });

// 16. mcp
program
  .command('mcp')
  .description('Launch Model Context Protocol (MCP) server over stdio')
  .option('--unified', 'Launch DevDiff × CodeMemory Unified MCP Server')
  .action(async (options) => {
    if (options.unified) {
      const { UnifiedMCPServer } = await import('./mcp/unified.js');
      const server = new UnifiedMCPServer();
      await server.start();
    } else {
      const server = new CodeMemoryMCPServer();
      await server.start();
    }
  });

program.parse(process.argv);


