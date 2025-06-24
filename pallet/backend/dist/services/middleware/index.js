/**
 * Agent Bridge Middleware v2.0 - Production Hetzner Deployment
 * Core coordinator linking AI chat output → Middleware → Execution layer
 */
import { EventEmitter } from 'events';
import { IntentParser } from './intent-parser.js';
import { GovernanceValidator } from './governance-validator.js';
import { ExecutionRouter } from './execution-router.js';
import { AuditLogger } from './audit-logger.js';
export class AgentBridge extends EventEmitter {
    static instance;
    config;
    validator;
    router;
    auditor;
    isInitialized = false;
    constructor() {
        super();
        this.config = this.getDefaultConfig();
        this.validator = new GovernanceValidator();
        this.router = ExecutionRouter.getInstance();
        this.auditor = AuditLogger.getInstance();
    }
    static getInstance() {
        if (!AgentBridge.instance) {
            AgentBridge.instance = new AgentBridge();
        }
        return AgentBridge.instance;
    }
    /**
     * Initialize Agent Bridge with configuration
     */
    async initialize(config) {
        if (this.isInitialized) {
            return;
        }
        this.config = { ...this.config, ...config };
        await this.validator.createDefaultBuildProtocol();
        console.log('[AgentBridge] Initialized successfully');
        console.log('[AgentBridge] Configuration:', this.config);
        this.isInitialized = true;
    }
    /**
     * Process AI chat message through the complete middleware pipeline
     */
    async processChatMessage(message, sessionId, options = {}) {
        const results = [];
        // Step 1: Parse chat message into structured intents
        const parsed = this.config.enableIntentParsing
            ? IntentParser.parseChatMessage(message, sessionId)
            : {
                originalMessage: message,
                intents: [],
                confidence: 0,
                parseErrors: ['Intent parsing disabled'],
                metadata: { modelUsed: 'none', parseTime: 0, intentCount: 0 }
            };
        console.log(`[AgentBridge] Parsed ${parsed.intents.length} intents from chat message`);
        // Process each intent
        for (const intent of parsed.intents) {
            const result = await this.processIntent(intent, sessionId, options);
            results.push(result);
        }
        return { parsed, results };
    }
    /**
     * Process a single intent through validation and execution
     */
    async processIntent(intent, sessionId, options) {
        // Step 1: Validate intent against governance rules
        const validation = this.config.enableGovernance
            ? await this.validator.validateIntent(intent)
            : { isValid: true, intent, appliedRules: [], errors: [], warnings: [], modifications: {}, requiresApproval: false };
        let execution;
        // Step 2: Execute if valid and conditions are met
        if (validation.isValid && !validation.requiresApproval && options.autoExecute && this.config.enableExecution) {
            const context = {
                intent,
                validation,
                environment: {
                    workingDirectory: process.env.PROJECTS_PATH || '/app/projects',
                    nodeEnv: process.env.NODE_ENV || 'development',
                    restrictions: [],
                },
                ...(options.userId && { user: { id: options.userId, permissions: ['read', 'write'] } }),
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
        // Step 3: Audit the entire process
        if (this.config.enableAudit) {
            await this.auditor.logIntentProcessing(intent, validation, execution, {
                sessionId,
                ...(options.userId && { userId: options.userId })
            });
        }
        return {
            intent,
            validation,
            ...(execution && { execution })
        };
    }
    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            enableIntentParsing: process.env.MIDDLEWARE_ENABLE_GOVERNANCE !== 'false',
            enableGovernance: process.env.MIDDLEWARE_ENABLE_GOVERNANCE !== 'false',
            enableExecution: process.env.MIDDLEWARE_ENABLE_EXECUTION !== 'false',
            enableAudit: process.env.MIDDLEWARE_ENABLE_AUDIT !== 'false',
            governanceRulesPath: process.env.BUILD_PROTOCOL_PATH || '/app/system/build-protocol.json',
            auditLogPath: process.env.AUDIT_LOG_PATH || '/app/system/audit',
            maxConcurrentIntents: parseInt(process.env.MIDDLEWARE_MAX_CONCURRENT_INTENTS || '3'),
            intentTimeout: parseInt(process.env.MIDDLEWARE_INTENT_TIMEOUT || '30000'),
        };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get audit statistics
     */
    async getAuditStatistics(days = 7) {
        return this.auditor.getAuditStatistics(days);
    }
    /**
     * Health check
     */
    getHealthStatus() {
        return {
            isInitialized: this.isInitialized,
            config: this.config,
            timestamp: new Date().toISOString(),
        };
    }
}
// Export singleton instance
export const agentBridge = AgentBridge.getInstance();
/**
 * Initialize middleware for use in server
 */
export async function initializeMiddleware() {
    await agentBridge.initialize();
}
//# sourceMappingURL=index.js.map