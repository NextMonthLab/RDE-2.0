/**
 * Agent Bridge Middleware v2.0 - Production Hetzner Deployment
 * Core coordinator linking AI chat output → Middleware → Execution layer
 */
import { EventEmitter } from 'events';
import type { Intent, AgentBridgeConfig, ParsedChatOutput, ExecutionResult, ValidationResult } from './types.js';
export declare class AgentBridge extends EventEmitter {
    private static instance;
    private config;
    private validator;
    private router;
    private auditor;
    private isInitialized;
    private constructor();
    static getInstance(): AgentBridge;
    /**
     * Initialize Agent Bridge with configuration
     */
    initialize(config?: Partial<AgentBridgeConfig>): Promise<void>;
    /**
     * Process AI chat message through the complete middleware pipeline
     */
    processChatMessage(message: string, sessionId: string, options?: {
        userId?: string;
        autoExecute?: boolean;
        currentFile?: string;
    }): Promise<{
        parsed: ParsedChatOutput;
        results: Array<{
            intent: Intent;
            validation: ValidationResult;
            execution?: ExecutionResult;
        }>;
    }>;
    /**
     * Process a single intent through validation and execution
     */
    private processIntent;
    /**
     * Get default configuration
     */
    private getDefaultConfig;
    /**
     * Get current configuration
     */
    getConfig(): AgentBridgeConfig;
    /**
     * Get audit statistics
     */
    getAuditStatistics(days?: number): Promise<any>;
    /**
     * Health check
     */
    getHealthStatus(): {
        isInitialized: boolean;
        config: AgentBridgeConfig;
        timestamp: string;
    };
}
export declare const agentBridge: AgentBridge;
/**
 * Initialize middleware for use in server
 */
export declare function initializeMiddleware(): Promise<void>;
//# sourceMappingURL=index.d.ts.map