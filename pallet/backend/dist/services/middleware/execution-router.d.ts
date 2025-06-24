/**
 * Execution Router - Agent Bridge Middleware v2.0
 * Routes validated intents to appropriate execution handlers
 */
import type { ExecutionContext, ExecutionResult } from './types.js';
export declare class ExecutionRouter {
    private static instance;
    private constructor();
    static getInstance(): ExecutionRouter;
    /**
     * Route validated intent to appropriate execution handler
     */
    routeIntent(context: ExecutionContext): Promise<ExecutionResult>;
    /**
     * Handle file operation intents
     */
    private handleFileOperation;
    /**
     * Handle terminal command intents
     */
    private handleTerminalCommand;
    /**
     * Handle code generation intents
     */
    private handleCodeGeneration;
    /**
     * Create error result
     */
    private createErrorResult;
}
//# sourceMappingURL=execution-router.d.ts.map