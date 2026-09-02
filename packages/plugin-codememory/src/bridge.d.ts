/**
 * CodeMemoryBridge — High-Performance Integration Layer for DevDiff
 *
 * Provides bidirectional communication between DevDiff (change memory & explanations)
 * and CodeMemory (structural AST memory & dependency topology).
 */
export interface CodeMemoryContext {
    structure: Record<string, any>;
    dependencies: Record<string, any>;
    hotspots: Array<{
        file: string;
        changes: any[];
    }>;
    semanticRoles: Record<string, string>;
    skills?: Array<{
        file: string;
        section: string;
        content: string;
    }>;
    conventions?: Array<{
        title: string;
        content: string;
    }>;
}
export interface SyncReport {
    codeMemoryFiles: number;
    devDiffFiles: number;
    inBoth: number;
    onlyInCodeMemory: string[];
    onlyInDevDiff: string[];
    synchronized: boolean;
    timestamp: string;
}
export interface ImpactAnalysisResult {
    file: string;
    directDependents: Array<{
        symbol: string;
        path: string;
    }>;
    indirectDependents: Array<{
        symbol: string;
        path: string;
    }>;
    totalImpactScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
}
export declare class CodeMemoryBridge {
    private static localDbInstance;
    /**
     * Optional in-process CodeMemory database instance registration for zero-latency execution.
     */
    static setLocalDatabase(dbInstance: any): void;
    /**
     * Query CodeMemory for structural context across target files.
     */
    static query(params: {
        files: string[];
        includeDependencies?: boolean;
        includeRecentChanges?: boolean;
        includeSymbols?: boolean;
        workspacePath?: string;
    }): Promise<CodeMemoryContext>;
    /**
     * Ingest DevDiff changelog and analysis records back into CodeMemory.
     */
    static recordChanges(params: {
        files: string[];
        changelog: string;
        timestamp?: number;
        author?: string;
        commitHash?: string;
        workspacePath?: string;
    }): Promise<void>;
    /**
     * Calculate cascading impact and blast radius for a list of changed files.
     */
    static analyzeImpact(files: string[], workspacePath?: string): Promise<ImpactAnalysisResult[]>;
    /**
     * Full bidirectional synchronization between DevDiff and CodeMemory.
     */
    static sync(workspacePath?: string): Promise<SyncReport>;
    /**
     * Compare DevDiff memory state with CodeMemory structural index.
     */
    static compare(workspacePath?: string): Promise<string>;
    private static queryFile;
    private static queryDependencies;
    private static queryRecentChanges;
    private static execAsync;
}
//# sourceMappingURL=bridge.d.ts.map