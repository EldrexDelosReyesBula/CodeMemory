import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

export interface GitStatus {
  isGitRepo: boolean;
  branch: string;
  latestCommit?: {
    hash: string;
    author: string;
    date: string;
    message: string;
  };
  modifiedFiles: string[];
  untrackedFiles: string[];
}

export class GitMonitor {
  private readonly rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  public isGitRepository(): boolean {
    return fs.existsSync(path.join(this.rootDir, '.git'));
  }

  public getStatus(): GitStatus {
    if (!this.isGitRepository()) {
      return {
        isGitRepo: false,
        branch: 'none',
        modifiedFiles: [],
        untrackedFiles: [],
      };
    }

    try {
      const branch = this.runGit('rev-parse --abbrev-ref HEAD').trim();
      const logOutput = this.runGit('log -1 --format="%H|||%an|||%ad|||%s"');
      let latestCommit: GitStatus['latestCommit'];

      if (logOutput) {
        const [hash, author, date, message] = logOutput.trim().split('|||');
        latestCommit = { hash, author, date, message };
      }

      const statusOutput = this.runGit('status --porcelain');
      const modifiedFiles: string[] = [];
      const untrackedFiles: string[] = [];

      statusOutput.split('\n').forEach((line) => {
        if (!line.trim()) return;
        const status = line.slice(0, 2);
        const file = line.slice(3).trim();

        if (status.includes('?') || status.includes('A')) {
          untrackedFiles.push(file);
        } else {
          modifiedFiles.push(file);
        }
      });

      return {
        isGitRepo: true,
        branch,
        latestCommit,
        modifiedFiles,
        untrackedFiles,
      };
    } catch (err) {
      return {
        isGitRepo: true,
        branch: 'unknown',
        modifiedFiles: [],
        untrackedFiles: [],
      };
    }
  }

  public getFileDiffSummary(filePath: string): string | null {
    if (!this.isGitRepository()) return null;
    try {
      return this.runGit(`diff --stat HEAD -- "${filePath}"`).trim();
    } catch {
      return null;
    }
  }

  private runGit(command: string): string {
    return execSync(`git ${command}`, {
      cwd: this.rootDir,
      stdio: ['pipe', 'pipe', 'ignore'],
      encoding: 'utf8',
    });
  }
}
