/**
 * Execution Engine v1.0 - Production Hetzner Deployment
 * Event-driven file operations processor for Agent Bridge Middleware
 */
import { EventEmitter } from 'events';
export interface FileOperationEvent {
    intentId: string;
    operation: 'create' | 'update' | 'delete' | 'rename' | 'move';
    targetPath: string;
    content?: string;
    newPath?: string;
    timestamp: Date;
    userId?: string;
    sessionId: string;
}
export interface ExecutionResult {
    success: boolean;
    intentId: string;
    operation: string;
    targetPath: string;
    duration: number;
    error?: string;
    affectedFiles: string[];
    timestamp: Date;
}
export declare class ExecutionEngine extends EventEmitter {
    private static instance;
    private workspaceRoot;
    private maxFileSize;
    private allowedExtensions;
    private processingQueue;
    private isProcessing;
    private stats;
    private constructor();
    static getInstance(): ExecutionEngine;
    /**
     * Initialize execution engine
     */
    initialize(): Promise<void>;
    /**
     * Subscribe to Agent Bridge Middleware approval events
     */
    subscribeToMiddlewareEvents(): Promise<void>;
    /**
     * Queue an approved intent for execution
     */
    queueApprovedIntent(event: FileOperationEvent): Promise<void>;
    /**
     * Process the execution queue
     */
    private processQueue;
    /**
     * Process a single approved intent
     */
    processApprovedIntent(event: FileOperationEvent): Promise<ExecutionResult>;
    /**
     * Validate file operation
     */
    private validateOperation;
    /**
     * Execute file creation
     */
    private executeCreateFile;
    /**
     * Execute file update
     */
    private executeUpdateFile;
    /**
     * Execute file deletion
     */
    private executeDeleteFile;
    /**
     * Create error result
     */
    private createErrorResult;
    /**
     * Update execution statistics
     */
    private updateStats;
    /**
     * Get execution statistics
     */
    getStats(): typeof this.stats & {
        queueLength: number;
    };
    /**
     * Get workspace root path
     */
    getWorkspaceRoot(): string;
}
export declare const executionEngine: ExecutionEngine;
/**
 * Initialize execution engine for use in server
 */
export declare function initializeExecutionEngine(): Promise<void>;
//# sourceMappingURL=index.d.ts.map