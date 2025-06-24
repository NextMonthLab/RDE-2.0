/**
 * Execution Engine v1.0 - Production Hetzner Deployment
 * Event-driven file operations processor for Agent Bridge Middleware
 */
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { ensureDirectory, resolveSafePath, isWithinWorkspace } from '../../utils/filesystem.js';
export class ExecutionEngine extends EventEmitter {
    static instance;
    workspaceRoot;
    maxFileSize;
    allowedExtensions;
    processingQueue = [];
    isProcessing = false;
    stats = {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        lastOperationTime: null,
    };
    constructor() {
        super();
        this.workspaceRoot = process.env.EXECUTION_ENGINE_WORKSPACE_ROOT || '/app/projects';
        this.maxFileSize = parseInt(process.env.EXECUTION_ENGINE_MAX_FILE_SIZE || '10485760'); // 10MB
        this.allowedExtensions = (process.env.EXECUTION_ENGINE_ALLOWED_EXTENSIONS ||
            '.js,.jsx,.ts,.tsx,.json,.md,.txt,.css,.html,.yml,.yaml').split(',');
    }
    static getInstance() {
        if (!ExecutionEngine.instance) {
            ExecutionEngine.instance = new ExecutionEngine();
        }
        return ExecutionEngine.instance;
    }
    /**
     * Initialize execution engine
     */
    async initialize() {
        // Ensure workspace directory exists
        await ensureDirectory(this.workspaceRoot);
        console.log('[ExecutionEngine] v1.0 initialized successfully');
        console.log('[ExecutionEngine] Workspace root:', this.workspaceRoot);
        console.log('[ExecutionEngine] Ready for live file operations');
    }
    /**
     * Subscribe to Agent Bridge Middleware approval events
     */
    async subscribeToMiddlewareEvents() {
        try {
            const { agentBridge } = await import('../middleware/index.js');
            // Subscribe to approved intent events
            agentBridge.on('intent-approved', async (approvalEvent) => {
                console.log(`[ExecutionEngine] Received approved intent: ${approvalEvent.intentId}`);
                // Convert to execution event format
                const executionEvent = {
                    intentId: approvalEvent.intentId,
                    operation: approvalEvent.operation,
                    targetPath: approvalEvent.targetPath,
                    content: approvalEvent.content,
                    newPath: approvalEvent.newPath,
                    timestamp: approvalEvent.timestamp,
                    userId: approvalEvent.userId,
                    sessionId: approvalEvent.sessionId,
                };
                // Process the approved intent
                await this.queueApprovedIntent(executionEvent);
            });
            console.log('[ExecutionEngine] Successfully subscribed to Agent Bridge Middleware approval events');
        }
        catch (error) {
            console.error('[ExecutionEngine] Failed to subscribe to middleware events:', error);
        }
    }
    /**
     * Queue an approved intent for execution
     */
    async queueApprovedIntent(event) {
        this.processingQueue.push(event);
        if (!this.isProcessing) {
            await this.processQueue();
        }
    }
    /**
     * Process the execution queue
     */
    async processQueue() {
        if (this.isProcessing || this.processingQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        try {
            while (this.processingQueue.length > 0) {
                const event = this.processingQueue.shift();
                if (event) {
                    await this.processApprovedIntent(event);
                }
            }
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Process a single approved intent
     */
    async processApprovedIntent(event) {
        const startTime = Date.now();
        try {
            console.log(`[ExecutionEngine] Processing ${event.operation} on ${event.targetPath}`);
            // Validate operation
            this.validateOperation(event);
            // Execute the operation
            let result;
            switch (event.operation) {
                case 'create':
                    result = await this.executeCreateFile(event, startTime);
                    break;
                case 'update':
                    result = await this.executeUpdateFile(event, startTime);
                    break;
                case 'delete':
                    result = await this.executeDeleteFile(event, startTime);
                    break;
                default:
                    throw new Error(`Unsupported operation: ${event.operation}`);
            }
            // Log successful execution to system audit
            console.log(`[ExecutionEngine] ✅ Successfully executed ${event.operation} on ${event.targetPath} (${result.duration}ms)`);
            // Log to system audit via middleware
            try {
                const { agentBridge } = await import('../middleware/index.js');
                const auditor = agentBridge.auditor;
                if (auditor) {
                    await auditor.logIntentProcessing({
                        id: event.intentId,
                        type: 'file_operation',
                        operation: event.operation,
                        target: { path: event.targetPath, content: event.content },
                        timestamp: event.timestamp,
                        source: 'ai_chat',
                        priority: 'medium'
                    }, { isValid: true, appliedRules: [], errors: [], warnings: [], modifications: {}, requiresApproval: false }, result, { sessionId: event.sessionId, userId: event.userId });
                }
            }
            catch (auditError) {
                console.warn('[ExecutionEngine] Failed to log to system audit:', auditError);
            }
            // Emit success event
            this.emit('execution-success', result);
            return result;
        }
        catch (error) {
            const result = this.createErrorResult(event, error, startTime);
            console.error(`[ExecutionEngine] ❌ Failed to execute ${event.operation} on ${event.targetPath}:`, error);
            // Emit error event
            this.emit('execution-error', result);
            return result;
        }
    }
    /**
     * Validate file operation
     */
    validateOperation(event) {
        // Check file extension
        const ext = path.extname(event.targetPath);
        if (ext && !this.allowedExtensions.includes(ext)) {
            throw new Error(`File extension ${ext} not allowed`);
        }
        // Check file size for content operations
        if (event.content && Buffer.byteLength(event.content, 'utf8') > this.maxFileSize) {
            throw new Error(`File content exceeds maximum size limit (${this.maxFileSize} bytes)`);
        }
        // Validate path is within workspace
        const safePath = resolveSafePath(event.targetPath, this.workspaceRoot);
        if (!isWithinWorkspace(safePath, this.workspaceRoot)) {
            throw new Error(`Path ${event.targetPath} is outside allowed workspace`);
        }
    }
    /**
     * Execute file creation
     */
    async executeCreateFile(event, startTime) {
        const safePath = resolveSafePath(event.targetPath, this.workspaceRoot);
        // Ensure parent directory exists
        await ensureDirectory(path.dirname(safePath));
        // Write file content
        await fs.writeFile(safePath, event.content || '', 'utf8');
        this.updateStats(true);
        return {
            success: true,
            intentId: event.intentId,
            operation: event.operation,
            targetPath: safePath,
            duration: Date.now() - startTime,
            affectedFiles: [safePath],
            timestamp: new Date(),
        };
    }
    /**
     * Execute file update
     */
    async executeUpdateFile(event, startTime) {
        const safePath = resolveSafePath(event.targetPath, this.workspaceRoot);
        // Write file content (overwrite existing)
        await fs.writeFile(safePath, event.content || '', 'utf8');
        this.updateStats(true);
        return {
            success: true,
            intentId: event.intentId,
            operation: event.operation,
            targetPath: safePath,
            duration: Date.now() - startTime,
            affectedFiles: [safePath],
            timestamp: new Date(),
        };
    }
    /**
     * Execute file deletion
     */
    async executeDeleteFile(event, startTime) {
        const safePath = resolveSafePath(event.targetPath, this.workspaceRoot);
        // Check if file exists
        try {
            await fs.access(safePath);
        }
        catch {
            throw new Error(`File ${event.targetPath} does not exist`);
        }
        // Delete file
        await fs.unlink(safePath);
        this.updateStats(true);
        return {
            success: true,
            intentId: event.intentId,
            operation: event.operation,
            targetPath: safePath,
            duration: Date.now() - startTime,
            affectedFiles: [safePath],
            timestamp: new Date(),
        };
    }
    /**
     * Create error result
     */
    createErrorResult(event, error, startTime) {
        this.updateStats(false);
        return {
            success: false,
            intentId: event.intentId,
            operation: event.operation,
            targetPath: event.targetPath,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
            affectedFiles: [],
            timestamp: new Date(),
        };
    }
    /**
     * Update execution statistics
     */
    updateStats(success) {
        this.stats.totalOperations++;
        this.stats.lastOperationTime = new Date();
        if (success) {
            this.stats.successfulOperations++;
        }
        else {
            this.stats.failedOperations++;
        }
    }
    /**
     * Get execution statistics
     */
    getStats() {
        return {
            ...this.stats,
            queueLength: this.processingQueue.length,
        };
    }
    /**
     * Get workspace root path
     */
    getWorkspaceRoot() {
        return this.workspaceRoot;
    }
}
// Export singleton instance
export const executionEngine = ExecutionEngine.getInstance();
/**
 * Initialize execution engine for use in server
 */
export async function initializeExecutionEngine() {
    await executionEngine.initialize();
    await executionEngine.subscribeToMiddlewareEvents();
}
//# sourceMappingURL=index.js.map