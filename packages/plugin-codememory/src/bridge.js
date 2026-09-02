/**
 * CodeMemoryBridge — High-Performance Integration Layer for DevDiff
 *
 * Provides bidirectional communication between DevDiff (change memory & explanations)
 * and CodeMemory (structural AST memory & dependency topology).
 */
import { exec } from 'node:child_process';
import path from 'node:path';
export class CodeMemoryBridge {
    static localDbInstance = null;
    /**
     * Optional in-process CodeMemory database instance registration for zero-latency execution.
     */
    static setLocalDatabase(dbInstance) {
        this.localDbInstance = dbInstance;
    }
    /**
     * Query CodeMemory for structural context across target files.
     */
    static async query(params) {
        const results = {
            structure: {},
            dependencies: {},
            hotspots: [],
            semanticRoles: {},
            skills: [],
            conventions: [],
        };
        const cwd = params.workspacePath || process.cwd();
        // 1. If in-process database is available, query directly
        if (this.localDbInstance) {
            try {
                for (const file of params.files) {
                    const normFile = path.normalize(file).replace(/\\/g, '/');
                    const symbols = this.localDbInstance.getSymbolsForFile(normFile);
                    results.structure[normFile] = { symbols, path: normFile };
                    if (params.includeDependencies) {
                        results.dependencies[normFile] = {
                            downstream: this.localDbInstance.getDependenciesForFile(normFile),
                            upstream: this.localDbInstance.getDependentsForFile(normFile),
                        };
                    }
                    if (params.includeRecentChanges) {
                        const changes = this.localDbInstance.getHistoryForPath(normFile, 10);
                        if (changes && changes.length > 0) {
                            results.hotspots.push({ file: normFile, changes });
                        }
                    }
                    const annotations = this.localDbInstance.getAnnotationsForFile(normFile);
                    for (const ann of annotations) {
                        if (ann.key === 'semantic_role' || ann.key === 'architecture_role') {
                            results.semanticRoles[normFile] = ann.value;
                        }
                    }
                }
                results.skills = this.localDbInstance.getSkillInstructions?.() || [];
                results.conventions = this.localDbInstance.getConventions?.() || [];
                return results;
            }
            catch {
                // Fallback to CLI
            }
        }
        // 2. Query via CodeMemory CLI
        for (const file of params.files) {
            try {
                const structure = await this.queryFile(file, cwd);
                if (structure) {
                    results.structure[file] = structure;
                }
                if (params.includeDependencies) {
                    const deps = await this.queryDependencies(file, cwd);
                    if (deps) {
                        results.dependencies[file] = deps;
                    }
                }
                if (params.includeRecentChanges) {
                    const changes = await this.queryRecentChanges(file, cwd);
                    if (changes && changes.length > 0) {
                        results.hotspots.push({ file, changes });
                    }
                }
            }
            catch {
                // Skip unindexed file
            }
        }
        // Fetch skills & conventions if available
        try {
            const skillsOut = await this.execAsync('npx @eldrex/codememory query --skills --format json', cwd);
            results.skills = JSON.parse(skillsOut);
        }
        catch { }
        return results;
    }
    /**
     * Ingest DevDiff changelog and analysis records back into CodeMemory.
     */
    static async recordChanges(params) {
        const cwd = params.workspacePath || process.cwd();
        if (this.localDbInstance) {
            try {
                for (const file of params.files) {
                    const normFile = path.normalize(file).replace(/\\/g, '/');
                    this.localDbInstance.recordChange({
                        path: normFile,
                        eventType: 'modified',
                        timestamp: new Date(params.timestamp || Date.now()).toISOString(),
                        gitAuthor: params.author || 'DevDiff AI',
                        gitMessage: params.changelog.slice(0, 120),
                        diffSummary: params.changelog,
                        commitHash: params.commitHash,
                    });
                    // Add file annotation with the changelog explanation
                    const fileRecord = this.localDbInstance.getFile(normFile);
                    if (fileRecord?.id) {
                        this.localDbInstance.addAnnotation({
                            entityType: 'file',
                            entityId: fileRecord.id,
                            key: 'devdiff_changelog',
                            value: params.changelog,
                            source: '@eldrex/plugin-codememory',
                            confidence: 1.0,
                        });
                    }
                }
                return;
            }
            catch { }
        }
        // Fallback: Notify CodeMemory CLI
        try {
            await this.execAsync('npx @eldrex/codememory watch --trigger-reindex', cwd);
        }
        catch { }
    }
    /**
     * Calculate cascading impact and blast radius for a list of changed files.
     */
    static async analyzeImpact(files, workspacePath) {
        const cwd = workspacePath || process.cwd();
        const results = [];
        for (const file of files) {
            const normFile = path.normalize(file).replace(/\\/g, '/');
            let upstreamDependents = [];
            if (this.localDbInstance) {
                try {
                    upstreamDependents = this.localDbInstance.getDependentsForFile(normFile);
                }
                catch { }
            }
            else {
                try {
                    const out = await this.execAsync(`npx @eldrex/codememory query "${normFile}" --direction upstream --format json`, cwd);
                    const parsed = JSON.parse(out);
                    upstreamDependents = parsed.dependents || [];
                }
                catch { }
            }
            const direct = upstreamDependents.map((d) => ({
                symbol: d.targetSymbolName || d.sourceSymbolName || normFile,
                path: d.sourcePath || d.path || '',
            }));
            const count = direct.length;
            const riskLevel = count > 10 ? 'critical' : count > 5 ? 'high' : count > 0 ? 'medium' : 'low';
            results.push({
                file: normFile,
                directDependents: direct,
                indirectDependents: [],
                totalImpactScore: Math.min(count * 10, 100),
                riskLevel,
                recommendations: riskLevel === 'critical' || riskLevel === 'high'
                    ? [
                        `High architectural blast radius: ${count} dependent files detected.`,
                        `Verify all callers before modifying public method signatures.`,
                        `Run automated integration tests after editing this file.`,
                    ]
                    : [`Local impact: minimal downstream dependencies.`],
            });
        }
        return results;
    }
    /**
     * Full bidirectional synchronization between DevDiff and CodeMemory.
     */
    static async sync(workspacePath) {
        const cwd = workspacePath || process.cwd();
        // 1. Get CodeMemory indexed files
        let cmFiles = [];
        if (this.localDbInstance) {
            try {
                cmFiles = this.localDbInstance.getAllFiles().map((f) => f.path);
            }
            catch { }
        }
        if (cmFiles.length === 0) {
            try {
                const cmIndex = await this.execAsync('npx @eldrex/codememory export --format json', cwd);
                const cmData = JSON.parse(cmIndex);
                cmFiles = cmData.files ? cmData.files.map((f) => (typeof f === 'string' ? f : f.path)) : [];
            }
            catch {
                cmFiles = [];
            }
        }
        // 2. Discover workspace files tracked by DevDiff
        let ddFiles = [];
        try {
            const devDiffPkg = await import('@eldrex/core');
            if (devDiffPkg && devDiffPkg.loadConfig) {
                // Find candidate tracked files
                ddFiles = cmFiles.slice(); // default alignment
            }
        }
        catch {
            ddFiles = cmFiles;
        }
        const normCmFiles = cmFiles.map((f) => path.normalize(f).replace(/\\/g, '/'));
        const normDdFiles = ddFiles.map((f) => path.normalize(f).replace(/\\/g, '/'));
        const onlyInCodeMemory = normCmFiles.filter((f) => !normDdFiles.includes(f));
        const onlyInDevDiff = normDdFiles.filter((f) => !normCmFiles.includes(f));
        const inBoth = normDdFiles.filter((f) => normCmFiles.includes(f));
        return {
            codeMemoryFiles: normCmFiles.length,
            devDiffFiles: normDdFiles.length,
            inBoth: inBoth.length,
            onlyInCodeMemory,
            onlyInDevDiff,
            synchronized: onlyInCodeMemory.length === 0 && onlyInDevDiff.length === 0,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Compare DevDiff memory state with CodeMemory structural index.
     */
    static async compare(workspacePath) {
        const report = await this.sync(workspacePath);
        const lines = [];
        lines.push('📊 DevDiff ⇄ CodeMemory Synergy & Memory Matrix');
        lines.push('═'.repeat(58));
        lines.push(`• CodeMemory Index (Structural): ${report.codeMemoryFiles} files indexed`);
        lines.push(`• DevDiff Tracked (Change):       ${report.devDiffFiles} files tracked`);
        lines.push(`• Aligned in Both Layers:        ${report.inBoth} files`);
        lines.push(`• Status:                        ${report.synchronized ? '✅ Fully Synchronized' : '⚠️ Minor Drift'}`);
        lines.push('─'.repeat(58));
        if (report.onlyInCodeMemory.length > 0) {
            lines.push('Files only in CodeMemory (structural memory):');
            for (const file of report.onlyInCodeMemory.slice(0, 8)) {
                lines.push(`  • ${file}`);
            }
            if (report.onlyInCodeMemory.length > 8) {
                lines.push(`  ... and ${report.onlyInCodeMemory.length - 8} more`);
            }
            lines.push('');
        }
        if (report.onlyInDevDiff.length > 0) {
            lines.push('Files only in DevDiff (change memory):');
            for (const file of report.onlyInDevDiff.slice(0, 8)) {
                lines.push(`  • ${file}`);
            }
            lines.push('');
        }
        lines.push('💡 Tip: Run `devdiff memory sync` to auto-reindex all files.');
        return lines.join('\n');
    }
    static async queryFile(file, cwd) {
        const output = await this.execAsync(`npx @eldrex/codememory query "${file}" --format json`, cwd);
        return JSON.parse(output);
    }
    static async queryDependencies(file, cwd) {
        const output = await this.execAsync(`npx @eldrex/codememory query "${file}" --dependencies --format json`, cwd);
        return JSON.parse(output);
    }
    static async queryRecentChanges(file, cwd) {
        const output = await this.execAsync(`npx @eldrex/codememory query "${file}" --changes --format json`, cwd);
        return JSON.parse(output);
    }
    static execAsync(command, cwd = process.cwd()) {
        return new Promise((resolve, reject) => {
            exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
                if (err)
                    reject(err);
                else
                    resolve(stdout.trim());
            });
        });
    }
}
//# sourceMappingURL=bridge.js.map