/**
 * Execution Router - Agent Bridge Middleware v2.0
 * Routes validated intents to appropriate execution handlers
 */

import { Intent, ValidationResult, ExecutionContext, ExecutionResult } from './types';
import { fileService } from '../server/services/fileService';
import { terminalService } from '../server/services/terminalService';
import { chatService } from '../server/services/chatService';
import * as fs from 'fs/promises';

export class ExecutionRouter {
  private static instance: ExecutionRouter;
  private executionQueue: Array<{ context: ExecutionContext; resolve: Function; reject: Function }> = [];
  private isProcessing = false;
  private maxConcurrentExecutions = 3;

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
    return new Promise((resolve, reject) => {
      this.executionQueue.push({ context, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process execution queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.executionQueue.length > 0) {
      const currentBatch = this.executionQueue.splice(0, this.maxConcurrentExecutions);
      
      await Promise.allSettled(
        currentBatch.map(async ({ context, resolve, reject }) => {
          try {
            const result = await this.executeIntent(context);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
      );
    }

    this.isProcessing = false;
  }

  /**
   * Execute a validated intent
   */
  private async executeIntent(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    const { intent, validation } = context;

    // Check if execution is allowed
    if (!validation.isValid) {
      return this.createErrorResult(intent, 'Intent validation failed', startTime);
    }

    // Apply any modifications from validation
    const modifiedIntent = this.applyModifications(intent, validation.modifications);

    try {
      // For file operations, delegate to Execution Engine
      if (modifiedIntent.type === 'file_operation' || modifiedIntent.type === 'code_generation') {
        return await this.delegateToExecutionEngine(modifiedIntent, context, startTime);
      }

      // Handle other intent types directly
      switch (modifiedIntent.type) {
        case 'terminal_command':
          return await this.executeTerminalCommand(modifiedIntent, context, startTime);
        
        case 'external_service':
          return await this.executeExternalService(modifiedIntent, context, startTime);
        
        case 'project_scaffold':
          return await this.executeProjectScaffold(modifiedIntent, context, startTime);
        
        default:
          return this.createErrorResult(
            intent,
            `Unsupported intent type: ${intent.type}`,
            startTime
          );
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createErrorResult(intent, errorMessage, startTime);
    }
  }

  /**
   * Delegate file operations to Execution Engine
   */
  private async delegateToExecutionEngine(intent: any, context: ExecutionContext, startTime: number): Promise<ExecutionResult> {
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
   * Execute file operation intent
   */
  private async executeFileOperation(intent: any, context: ExecutionContext, startTime: number): Promise<ExecutionResult> {
    const { operation, target } = intent;
    const affectedFiles: string[] = [];

    switch (operation) {
      case 'create':
        await fileService.createFileInStorage(
          this.getFileName(target.path),
          target.path,
          target.content || '',
          target.path.endsWith('/') ? 'directory' : 'file',
          this.getParentPath(target.path)
        );
        affectedFiles.push(target.path);
        break;

      case 'update':
        await fileService.updateFileInStorage(target.path, {
          content: target.content,
        });
        affectedFiles.push(target.path);
        break;

      case 'delete':
        await fileService.deleteFileInStorage(target.path);
        affectedFiles.push(target.path);
        break;

      case 'rename':
        if (target.newPath) {
          await fileService.updateFileInStorage(target.path, {
            name: this.getFileName(target.newPath),
            path: target.newPath,
          });
          affectedFiles.push(target.path, target.newPath);
        }
        break;

      default:
        throw new Error(`Unsupported file operation: ${operation}`);
    }

    return {
      success: true,
      intent,
      output: `File operation '${operation}' completed successfully`,
      duration: Date.now() - startTime,
      affectedFiles,
      sideEffects: [],
    };
  }

  /**
   * Execute terminal command intent
   */
  private async executeTerminalCommand(intent: any, context: ExecutionContext, startTime: number): Promise<ExecutionResult> {
    const { command, workingDirectory, timeout } = intent;
    const sessionId = `execution_${Date.now()}`;

    return new Promise((resolve) => {
      let output = '';
      let hasResolved = false;

      // Create terminal session
      const session = terminalService.createSession(sessionId, workingDirectory);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          terminalService.killSession(sessionId);
          resolve(this.createErrorResult(intent, 'Command execution timeout', startTime));
        }
      }, timeout || 30000);

      // Capture output
      session.process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      session.process.stderr?.on('data', (data) => {
        output += data.toString();
      });

      // Handle completion
      session.process.on('exit', (code) => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeoutId);
          
          resolve({
            success: code === 0,
            intent,
            output,
            error: code !== 0 ? `Command exited with code ${code}` : undefined,
            duration: Date.now() - startTime,
            affectedFiles: [],
            sideEffects: [`Terminal command executed: ${command}`],
          });
        }
      });

      // Execute command
      terminalService.executeCommand(sessionId, command);
    });
  }

  /**
   * Execute code generation intent
   */
  private async executeCodeGeneration(intent: any, context: ExecutionContext, startTime: number): Promise<ExecutionResult> {
    const { target, requirements, context: codeContext } = intent;

    // Generate code using AI service
    const prompt = this.buildCodeGenerationPrompt(target, requirements, codeContext);
    const generatedCode = await chatService.processMessage(prompt);

    // Extract code from AI response
    const codeMatch = generatedCode.match(/```[\w]*\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1] : generatedCode;

    // Create the file
    await fileService.createFileInStorage(
      this.getFileName(target.file),
      target.file,
      code,
      'file',
      this.getParentPath(target.file)
    );

    return {
      success: true,
      intent,
      output: `Code generated and saved to ${target.file}`,
      duration: Date.now() - startTime,
      affectedFiles: [target.file],
      sideEffects: ['Code generation completed'],
    };
  }

  /**
   * Execute external service intent
   */
  private async executeExternalService(intent: any, context: ExecutionContext, startTime: number): Promise<ExecutionResult> {
    const { service, action, parameters } = intent;

    // For now, external service calls are simulated
    // In a full implementation, this would make actual API calls
    
    return {
      success: true,
      intent,
      output: `External service call to ${service}.${action} completed`,
      duration: Date.now() - startTime,
      affectedFiles: [],
      sideEffects: [`External service: ${service}.${action}`],
    };
  }

  /**
   * Execute project scaffold intent
   */
  private async executeProjectScaffold(intent: any, context: ExecutionContext, startTime: number): Promise<ExecutionResult> {
    const { structure, dependencies } = intent;
    const affectedFiles: string[] = [];

    // Create directories
    for (const dir of structure.directories) {
      await fileService.createFileInStorage(
        this.getFileName(dir),
        dir,
        '',
        'directory',
        this.getParentPath(dir)
      );
      affectedFiles.push(dir);
    }

    // Create files
    for (const fileSpec of structure.files) {
      await fileService.createFileInStorage(
        this.getFileName(fileSpec.path),
        fileSpec.path,
        fileSpec.content || '',
        'file',
        this.getParentPath(fileSpec.path)
      );
      affectedFiles.push(fileSpec.path);
    }

    return {
      success: true,
      intent,
      output: `Project scaffold created with ${structure.directories.length} directories and ${structure.files.length} files`,
      duration: Date.now() - startTime,
      affectedFiles,
      sideEffects: ['Project structure created'],
    };
  }

  /**
   * Apply modifications to intent based on validation result
   */
  private applyModifications(intent: Intent, modifications: Record<string, any>): Intent {
    if (!modifications || Object.keys(modifications).length === 0) {
      return intent;
    }

    const modifiedIntent = JSON.parse(JSON.stringify(intent));
    
    for (const [key, value] of Object.entries(modifications)) {
      this.setNestedProperty(modifiedIntent, key, value);
    }

    return modifiedIntent;
  }

  /**
   * Set nested property using dot notation
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Build code generation prompt
   */
  private buildCodeGenerationPrompt(target: any, requirements: any, context: any): string {
    let prompt = `Generate ${requirements.language} code for a ${target.component || target.function || target.class}`;
    
    if (target.component) {
      prompt += ` React component named ${target.component}`;
    } else if (target.function) {
      prompt += ` function named ${target.function}`;
    } else if (target.class) {
      prompt += ` class named ${target.class}`;
    }

    if (requirements.framework) {
      prompt += ` using ${requirements.framework}`;
    }

    if (requirements.patterns?.length) {
      prompt += ` following ${requirements.patterns.join(', ')} patterns`;
    }

    prompt += '. Return only the code without explanation.';

    return prompt;
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

  /**
   * Utility methods
   */
  private getFileName(path: string): string {
    return path.split('/').pop() || path;
  }

  private getParentPath(path: string): string | undefined {
    const parts = path.split('/');
    parts.pop();
    const parent = parts.join('/');
    return parent || undefined;
  }
}