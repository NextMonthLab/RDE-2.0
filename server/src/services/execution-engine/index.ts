/**
 * Execution Engine v1.0
 * Subscribes to Agent Bridge Middleware approval events and executes approved file operations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

interface FileOperationEvent {
  intentId: string;
  operation: 'create' | 'update' | 'delete' | 'rename' | 'move';
  targetPath: string;
  content?: string;
  newPath?: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

interface ExecutionResult {
  success: boolean;
  intentId: string;
  operation: string;
  targetPath: string;
  error?: string;
  duration: number;
  timestamp: Date;
}

export class ExecutionEngine extends EventEmitter {
  private static instance: ExecutionEngine;
  private isInitialized = false;
  private executionQueue: FileOperationEvent[] = [];
  private isProcessing = false;
  private maxConcurrentExecutions = 5;
  private workspaceRoot = './projects/default-app';

  private constructor() {
    super();
    this.setupEventHandlers();
  }

  public static getInstance(): ExecutionEngine {
    if (!ExecutionEngine.instance) {
      ExecutionEngine.instance = new ExecutionEngine();
    }
    return ExecutionEngine.instance;
  }

  /**
   * Initialize the Execution Engine
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Ensure workspace directory exists
    await this.ensureDirectoryExists(this.workspaceRoot);

    this.isInitialized = true;
    console.log('[ExecutionEngine] v1.0 initialized successfully');
    console.log('[ExecutionEngine] Workspace root:', this.workspaceRoot);
    console.log('[ExecutionEngine] Ready for live file operations');
  }

  /**
   * Subscribe to Agent Bridge Middleware approval events
   */
  public async subscribeToMiddlewareEvents(): Promise<void> {
    try {
      const { agentBridge } = await import('../../../../middleware/agentBridge.js');
      
      // Subscribe to approved intent events
      agentBridge.on('intent-approved', async (approvalEvent: any) => {
        console.log(`[ExecutionEngine] Received approved intent: ${approvalEvent.intentId}`);
        
        // Convert to execution event format
        const executionEvent: FileOperationEvent = {
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
    } catch (error) {
      console.error('[ExecutionEngine] Failed to subscribe to middleware events:', error);
    }
  }

  /**
   * Process approved file operation intent
   */
  public async processApprovedIntent(event: FileOperationEvent): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    console.log(`[ExecutionEngine] Processing approved intent: ${event.intentId} - ${event.operation} on ${event.targetPath}`);

    try {
      let result: ExecutionResult;

      switch (event.operation) {
        case 'create':
          result = await this.executeFileCreation(event, startTime);
          break;
        case 'update':
          result = await this.executeFileUpdate(event, startTime);
          break;
        case 'delete':
          result = await this.executeFileDeletion(event, startTime);
          break;
        case 'rename':
          result = await this.executeFileRename(event, startTime);
          break;
        case 'move':
          result = await this.executeFileMove(event, startTime);
          break;
        default:
          throw new Error(`Unsupported operation: ${event.operation}`);
      }

      // Log successful execution to system audit
      console.log(`[ExecutionEngine] ✅ Successfully executed ${event.operation} on ${event.targetPath} (${result.duration}ms)`);
      
      // Log to system audit via middleware
      try {
        const { agentBridge } = await import('../../../../middleware/agentBridge.js');
        const auditor = (agentBridge as any).auditor;
        if (auditor) {
          await auditor.logIntentProcessing(
            { 
              id: event.intentId,
              type: 'file_operation',
              operation: event.operation,
              target: { path: event.targetPath, content: event.content },
              timestamp: event.timestamp,
              source: 'ai_chat',
              priority: 'medium'
            },
            { isValid: true, appliedRules: [], errors: [], warnings: [], modifications: {}, requiresApproval: false },
            result,
            { sessionId: event.sessionId, userId: event.userId }
          );
        }
      } catch (auditError) {
        console.warn('[ExecutionEngine] Failed to log to system audit:', auditError);
      }
      
      // Emit success event
      this.emit('execution-success', result);
      
      return result;

    } catch (error) {
      const result: ExecutionResult = {
        success: false,
        intentId: event.intentId,
        operation: event.operation,
        targetPath: event.targetPath,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ExecutionEngine] ❌ Failed to execute ${event.operation} on ${event.targetPath}: ${errorMessage}`);
      
      // Emit error event
      this.emit('execution-error', result);
      
      return result;
    }
  }

  /**
   * Execute file creation
   */
  private async executeFileCreation(event: FileOperationEvent, startTime: number): Promise<ExecutionResult> {
    const fullPath = this.resolveFilePath(event.targetPath);
    
    // Ensure parent directory exists
    await this.ensureDirectoryExists(path.dirname(fullPath));
    
    // Write file content
    await fs.writeFile(fullPath, event.content || '', 'utf-8');
    
    return {
      success: true,
      intentId: event.intentId,
      operation: event.operation,
      targetPath: event.targetPath,
      duration: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * Execute file update
   */
  private async executeFileUpdate(event: FileOperationEvent, startTime: number): Promise<ExecutionResult> {
    const fullPath = this.resolveFilePath(event.targetPath);
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      throw new Error(`File does not exist: ${event.targetPath}`);
    }
    
    // Update file content
    await fs.writeFile(fullPath, event.content || '', 'utf-8');
    
    return {
      success: true,
      intentId: event.intentId,
      operation: event.operation,
      targetPath: event.targetPath,
      duration: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * Execute file deletion
   */
  private async executeFileDeletion(event: FileOperationEvent, startTime: number): Promise<ExecutionResult> {
    const fullPath = this.resolveFilePath(event.targetPath);
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      throw new Error(`File does not exist: ${event.targetPath}`);
    }
    
    // Delete file
    await fs.unlink(fullPath);
    
    return {
      success: true,
      intentId: event.intentId,
      operation: event.operation,
      targetPath: event.targetPath,
      duration: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * Execute file rename
   */
  private async executeFileRename(event: FileOperationEvent, startTime: number): Promise<ExecutionResult> {
    if (!event.newPath) {
      throw new Error('New path is required for rename operation');
    }

    const oldPath = this.resolveFilePath(event.targetPath);
    const newPath = this.resolveFilePath(event.newPath);
    
    // Ensure target directory exists
    await this.ensureDirectoryExists(path.dirname(newPath));
    
    // Rename file
    await fs.rename(oldPath, newPath);
    
    return {
      success: true,
      intentId: event.intentId,
      operation: event.operation,
      targetPath: event.targetPath,
      duration: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * Execute file move
   */
  private async executeFileMove(event: FileOperationEvent, startTime: number): Promise<ExecutionResult> {
    // For now, move is the same as rename
    return await this.executeFileRename(event, startTime);
  }

  /**
   * Queue approved intent for processing
   */
  public async queueApprovedIntent(event: FileOperationEvent): Promise<void> {
    this.executionQueue.push(event);
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * Process the execution queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      while (this.executionQueue.length > 0) {
        const batch = this.executionQueue.splice(0, this.maxConcurrentExecutions);
        
        await Promise.allSettled(
          batch.map(event => this.processApprovedIntent(event))
        );
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Resolve file path relative to workspace
   */
  private resolveFilePath(filePath: string): string {
    // If path is already absolute and within workspace, use it
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    
    // If path starts with workspace root, resolve relative to current directory
    if (filePath.startsWith('./projects/') || filePath.startsWith('projects/')) {
      return path.resolve(filePath);
    }
    
    // Otherwise, resolve relative to workspace root
    return path.resolve(this.workspaceRoot, filePath);
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
      if (error instanceof Error && (error as any).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('execution-success', (result: ExecutionResult) => {
      console.log(`[ExecutionEngine] ✅ Execution completed: ${result.intentId}`);
    });

    this.on('execution-error', (result: ExecutionResult) => {
      console.error(`[ExecutionEngine] ❌ Execution failed: ${result.intentId} - ${result.error}`);
    });
  }

  /**
   * Get execution statistics
   */
  public getStatistics(): {
    queueLength: number;
    isProcessing: boolean;
    workspaceRoot: string;
    initialized: boolean;
  } {
    return {
      queueLength: this.executionQueue.length,
      isProcessing: this.isProcessing,
      workspaceRoot: this.workspaceRoot,
      initialized: this.isInitialized,
    };
  }

  /**
   * Get health status
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'down';
    version: string;
    uptime: number;
    queueLength: number;
  } {
    return {
      status: this.isInitialized ? 'healthy' : 'down',
      version: '1.0',
      uptime: process.uptime(),
      queueLength: this.executionQueue.length,
    };
  }
}

// Export singleton instance
export const executionEngine = ExecutionEngine.getInstance();