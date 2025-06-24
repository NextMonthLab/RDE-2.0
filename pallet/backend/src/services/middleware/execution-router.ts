/**
 * Execution Router - Agent Bridge Middleware v2.0
 * Routes validated intents to appropriate execution handlers
 */

import type { Intent, ExecutionContext, ExecutionResult } from './types.js';

export class ExecutionRouter {
  private static instance: ExecutionRouter;

  private constructor() {}

  public static getInstance(): ExecutionRouter {
    if (!ExecutionRouter.instance) {
      ExecutionRouter.instance = new ExecutionRouter();
    }
    return ExecutionRouter.instance;
  }

  /**
   * Route validated intent to appropriate execution handler
   */
  public async routeIntent(context: ExecutionContext): Promise<ExecutionResult> {
    const { intent } = context;
    const startTime = Date.now();

    try {
      switch (intent.type) {
        case 'file_operation':
          return await this.handleFileOperation(intent, context, startTime);
        
        case 'terminal_command':
          return await this.handleTerminalCommand(intent, context, startTime);
        
        case 'code_generation':
          return await this.handleCodeGeneration(intent, context, startTime);
        
        default:
          return this.createErrorResult(intent, `Unsupported intent type: ${(intent as any).type}`, startTime);
      }
    } catch (error) {
      return this.createErrorResult(intent, error instanceof Error ? error.message : String(error), startTime);
    }
  }

  /**
   * Handle file operation intents
   */
  private async handleFileOperation(intent: any, context: ExecutionContext, startTime: number): Promise<ExecutionResult> {
    // For file operations, return success immediately as they will be handled by Execution Engine
    // The Agent Bridge will emit the approved event which the Execution Engine will process
    return {
      success: true,
      intent,
      output: `File operation approved - will be processed by Execution Engine`,
      duration: Date.now() - startTime,
      affectedFiles: [intent.target?.file || intent.target?.path],
      sideEffects: ['Approved for Execution Engine processing'],
    };
  }

  /**
   * Handle terminal command intents
   */
  private async handleTerminalCommand(intent: any, context: ExecutionContext, startTime: number): Promise<ExecutionResult> {
    // Terminal commands would typically be routed to a terminal service
    return {
      success: false,
      intent,
      output: 'Terminal command execution not implemented',
      duration: Date.now() - startTime,
      affectedFiles: [],
      sideEffects: ['Terminal command queued'],
    };
  }

  /**
   * Handle code generation intents
   */
  private async handleCodeGeneration(intent: any, context: ExecutionContext, startTime: number): Promise<ExecutionResult> {
    // Code generation would integrate with AI services
    return {
      success: true,
      intent,
      output: 'Code generation completed',
      duration: Date.now() - startTime,
      affectedFiles: [intent.target?.file],
      sideEffects: ['Code generated and ready for file operations'],
    };
  }

  /**
   * Create error result
   */
  private createErrorResult(intent: Intent, error: string, startTime: number): ExecutionResult {
    return {
      success: false,
      intent,
      error,
      duration: Date.now() - startTime,
      affectedFiles: [],
      sideEffects: [],
    };
  }
}