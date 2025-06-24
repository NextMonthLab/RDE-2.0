/**
 * Audit Logger - Agent Bridge Middleware v2.0
 * Records all AI-generated intents, validation results, and execution outcomes
 */
import type { Intent, ValidationResult, ExecutionResult } from './types.js';
export declare class AuditLogger {
    private static instance;
    private logPath;
    private logBuffer;
    private bufferSize;
    private flushInterval;
    private retentionDays;
    private constructor();
    static getInstance(logPath?: string): AuditLogger;
    /**
     * Log an audit entry for intent processing
     */
    logIntentProcessing(intent: Intent, validation: ValidationResult, execution?: ExecutionResult, source?: {
        sessionId: string;
        userId?: string;
        chatMessage?: string;
    }): Promise<void>;
    /**
     * Add entry to audit log
     */
    private addEntry;
    /**
     * Flush buffer to file
     */
    private flush;
    /**
     * Format log entry as JSON line
     */
    private formatLogEntry;
    /**
     * Determine outcome based on validation and execution results
     */
    private determineOutcome;
    /**
     * Get audit statistics
     */
    getAuditStatistics(days?: number): Promise<{
        totalEntries: number;
        successfulExecutions: number;
        failedExecutions: number;
        rejectedIntents: number;
        pendingApprovals: number;
        topIntentTypes: Array<{
            type: string;
            count: number;
        }>;
        timeRange: {
            start: Date;
            end: Date;
        };
    }>;
    /**
     * Clean up old audit entries
     */
    cleanupOldEntries(): Promise<void>;
    /**
     * Start automatic flush timer
     */
    private startFlushTimer;
    /**
     * Ensure log directory exists
     */
    private ensureLogDirectory;
}
//# sourceMappingURL=audit-logger.d.ts.map