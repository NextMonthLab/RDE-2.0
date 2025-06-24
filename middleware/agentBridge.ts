/**
 * Agent Bridge - Agent Bridge Middleware v2.0
 * Core coordinator linking AI chat output → Middleware → Execution layer
 */

import { Intent, AgentBridgeConfig, ParsedChatOutput, ExecutionContext, ExecutionResult } from './types';
import { IntentParser } from './intentParser';
import { GovernanceValidator } from './governanceValidator';
import { ExecutionRouter } from './executionRouter';
import { AuditLogger } from './auditLogger';
import { nanoid } from 'nanoid';
import { EventEmitter } from 'events';

export class AgentBridge extends EventEmitter {
  private static instance: AgentBridge;
  private config: AgentBridgeConfig;
  private validator: GovernanceValidator;
  private router: ExecutionRouter;
  private auditor: AuditLogger;
  private isInitialized = false;

  private constructor() {
    super();
    this.config = this.getDefaultConfig();
    this.validator = new GovernanceValidator();
    this.router = ExecutionRouter.getInstance();
    this.auditor = AuditLogger.getInstance();
  }

  public static getInstance(): AgentBridge {
    if (!AgentBridge.instance) {
      AgentBridge.instance = new AgentBridge();
    }
    return AgentBridge.instance;
  }

  /**
   * Initialize Agent Bridge with configuration
   */
  public async initialize(config?: Partial<AgentBridgeConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Create default governance rules if needed
    await this.validator.createDefaultBuildProtocol();

    this.isInitialized = true;
    console.log('[AgentBridge] Initialized successfully');
    console.log('[AgentBridge] Configuration:', this.config);
  }

  /**
   * Process AI chat message through the complete middleware pipeline
   */
  public async processChatMessage(
    message: string,
    sessionId: string,
    options: {
      userId?: string;
      currentFile?: string;
      autoExecute?: boolean;
    } = {}
  ): Promise<{
    parsed: ParsedChatOutput;
    results: Array<{
      intent: Intent;
      validation: any;
      execution?: ExecutionResult;
      error?: string;
    }>;
    summary: {
      totalIntents: number;
      validIntents: number;
      executedIntents: number;
      rejectedIntents: number;
      pendingApprovals: number;
    };
  }> {
    if (!this.isInitialized) {
      throw new Error('AgentBridge not initialized. Call initialize() first.');
    }

    // Step 1: Parse intents from chat message
    const parsed = this.config.enableIntentParsing 
      ? IntentParser.parseChatMessage(message, sessionId)
      : { 
          originalMessage: message, 
          intents: [], 
          confidence: 0, 
          parseErrors: [], 
          metadata: {
            modelUsed: 'none',
            parseTime: 0,
            intentCount: 0,
          } 
        };

    const results: any[] = [];
    const summary = {
      totalIntents: parsed.intents.length,
      validIntents: 0,
      executedIntents: 0,
      rejectedIntents: 0,
      pendingApprovals: 0,
    };

    // Step 2: Process each intent
    for (const intent of parsed.intents) {
      try {
        const result = await this.processIntent(intent, sessionId, {
          userId: options.userId,
          currentFile: options.currentFile,
          autoExecute: options.autoExecute ?? false,
          chatMessage: message,
        });

        results.push(result);

        // Update summary
        if (result.validation.isValid) {
          summary.validIntents++;
          
          if (result.validation.requiresApproval) {
            summary.pendingApprovals++;
          } else if (result.execution) {
            summary.executedIntents++;
          }
        } else {
          summary.rejectedIntents++;
        }

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorResult = {
          intent,
          validation: { 
            isValid: false, 
            intent,
            appliedRules: [],
            errors: [errorMessage],
            warnings: [],
            modifications: {},
            requiresApproval: false,
          },
          error: errorMessage,
        };
        
        results.push(errorResult);
        summary.rejectedIntents++;

        // Log error
        if (this.config.enableAudit) {
          await this.auditor.logIntentProcessing(
            intent,
            errorResult.validation,
            undefined,
            { chatMessage: message, userId: options.userId, sessionId }
          );
        }
      }
    }

    return { parsed, results, summary };
  }

  /**
   * Process a single intent through validation and execution
   */
  private async processIntent(
    intent: Intent,
    sessionId: string,
    options: {
      userId?: string;
      currentFile?: string;
      autoExecute: boolean;
      chatMessage: string;
    }
  ): Promise<{
    intent: Intent;
    validation: any;
    execution?: ExecutionResult;
  }> {
    // Step 1: Validate intent
    const validation = this.config.enableGovernance
      ? await this.validator.validateIntent(intent)
      : { 
          isValid: true, 
          intent,
          appliedRules: [], 
          errors: [], 
          warnings: [], 
          modifications: {}, 
          requiresApproval: false 
        };

    let execution: ExecutionResult | undefined;

    // Step 2: Execute if valid and conditions are met
    if (validation.isValid && !validation.requiresApproval && options.autoExecute && this.config.enableExecution) {
      const context: ExecutionContext = {
        intent,
        validation,
        user: options.userId ? { id: options.userId, permissions: ['read', 'write'] } : undefined,
        environment: {
          workingDirectory: '/projects/default-app',
          nodeEnv: process.env.NODE_ENV || 'development',
          restrictions: [],
        },
      };

      execution = await this.router.routeIntent(context);
      
      // Emit approved intent event for Execution Engine
      if (execution.success && (intent.type === 'file_operation' || intent.type === 'code_generation')) {
        this.emit('intent-approved', {
          intentId: intent.id,
          operation: intent.operation || 'create',
          targetPath: intent.target?.file || intent.target?.path,
          content: intent.target?.content,
          newPath: intent.target?.newPath,
          timestamp: new Date(),
          userId: options.userId,
          sessionId,
          executionResult: execution,
        });
      }
    }

    // Step 3: Audit the processing
    if (this.config.enableAudit) {
      await this.auditor.logIntentProcessing(
        intent,
        validation,
        execution,
        {
          chatMessage: options.chatMessage,
          userId: options.userId,
          sessionId,
        }
      );
    }

    return { intent, validation, execution };
  }

  /**
   * Execute a previously validated intent
   */
  public async executeIntent(
    intent: Intent,
    sessionId: string,
    options: {
      userId?: string;
      skipValidation?: boolean;
    } = {}
  ): Promise<ExecutionResult> {
    if (!this.isInitialized) {
      throw new Error('AgentBridge not initialized');
    }

    // Validate intent unless skipped
    let validation;
    if (!options.skipValidation) {
      validation = await this.validator.validateIntent(intent);
      if (!validation.isValid) {
        throw new Error(`Intent validation failed: ${validation.errors.join(', ')}`);
      }
    } else {
      validation = { isValid: true, appliedRules: [], errors: [], warnings: [], modifications: {}, requiresApproval: false };
    }

    // Create execution context
    const context: ExecutionContext = {
      intent,
      validation,
      user: options.userId ? { id: options.userId, permissions: ['read', 'write'] } : undefined,
      environment: {
        workingDirectory: '/projects/default-app',
        nodeEnv: process.env.NODE_ENV || 'development',
        restrictions: [],
      },
    };

    // Execute intent
    const execution = await this.router.routeIntent(context);

    // Audit the execution
    if (this.config.enableAudit) {
      await this.auditor.logIntentProcessing(
        intent,
        validation,
        execution,
        { sessionId, userId: options.userId }
      );
    }

    return execution;
  }

  /**
   * Get pending intents requiring approval
   */
  public async getPendingApprovals(): Promise<Array<{
    intent: Intent;
    validation: any;
    source: any;
    timestamp: Date;
  }>> {
    const entries = await this.auditor.queryAuditLog({
      outcomes: ['pending_approval'],
      limit: 100,
    });

    return entries.map(entry => ({
      intent: entry.intent,
      validation: entry.validation,
      source: entry.source,
      timestamp: entry.timestamp,
    }));
  }

  /**
   * Approve a pending intent
   */
  public async approveIntent(
    intentId: string,
    sessionId: string,
    userId?: string
  ): Promise<ExecutionResult> {
    const entries = await this.auditor.queryAuditLog({
      outcomes: ['pending_approval'],
    });

    const entry = entries.find(e => e.intent.id === intentId);
    if (!entry) {
      throw new Error(`Intent ${intentId} not found or not pending approval`);
    }

    return await this.executeIntent(entry.intent, sessionId, {
      userId,
      skipValidation: true,
    });
  }

  /**
   * Get audit statistics
   */
  public async getAuditStatistics(days: number = 7): Promise<any> {
    return await this.auditor.getAuditStatistics(days);
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AgentBridgeConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[AgentBridge] Configuration updated:', this.config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): AgentBridgeConfig {
    return { ...this.config };
  }

  /**
   * Get governance rules
   */
  public async getGovernanceRules(): Promise<any[]> {
    return await this.validator.getRules();
  }

  /**
   * Update governance rules
   */
  public async updateGovernanceRules(rules: any[]): Promise<void> {
    await this.validator.updateRules(rules);
  }

  /**
   * Health check
   */
  public getHealthStatus(): {
    initialized: boolean;
    config: AgentBridgeConfig;
    components: {
      intentParser: boolean;
      governance: boolean;
      execution: boolean;
      audit: boolean;
    };
  } {
    return {
      initialized: this.isInitialized,
      config: this.config,
      components: {
        intentParser: this.config.enableIntentParsing,
        governance: this.config.enableGovernance,
        execution: this.config.enableExecution,
        audit: this.config.enableAudit,
      },
    };
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): AgentBridgeConfig {
    return {
      enableIntentParsing: true,  // Now enabled for live governance
      enableGovernance: true,     // Now enabled for live governance  
      enableExecution: true,      // Now enabled for live governance
      enableAudit: true,          // Now enabled for live governance
      governanceRulesPath: './system/build-protocol.json',
      auditLogPath: './system/audit.log',
      maxConcurrentIntents: 3,
      intentTimeout: 30000,
    };
  }

  /**
   * Enable middleware (use with caution)
   */
  public enableMiddleware(components: {
    intentParser?: boolean;
    governance?: boolean;
    execution?: boolean;
    audit?: boolean;
  }): void {
    console.log('[AgentBridge] WARNING: Enabling middleware components');
    
    this.config = {
      ...this.config,
      enableIntentParsing: components.intentParser ?? this.config.enableIntentParsing,
      enableGovernance: components.governance ?? this.config.enableGovernance,
      enableExecution: components.execution ?? this.config.enableExecution,
      enableAudit: components.audit ?? this.config.enableAudit,
    };

    console.log('[AgentBridge] Middleware components enabled:', this.config);
  }

  /**
   * Disable all middleware (safety mechanism)
   */
  public disableMiddleware(): void {
    this.config = {
      ...this.config,
      enableIntentParsing: false,
      enableGovernance: false,
      enableExecution: false,
      enableAudit: false,
    };

    console.log('[AgentBridge] All middleware components disabled');
  }
}

// Export singleton instance
export const agentBridge = AgentBridge.getInstance();