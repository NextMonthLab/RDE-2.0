/**
 * Agent Bridge Middleware v2.0 - Type Definitions
 * Structured intent schemas for AI-governed development
 */

// Core Intent Types
export interface BaseIntent {
  id: string;
  type: IntentType;
  timestamp: Date;
  source: 'ai_chat' | 'user_input' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export type IntentType = 
  | 'file_operation'
  | 'terminal_command'
  | 'external_service'
  | 'project_scaffold'
  | 'code_generation'
  | 'migration'
  | 'seo_optimization'
  | 'deployment';

// File Operation Intents
export interface FileOperationIntent extends BaseIntent {
  type: 'file_operation';
  operation: 'create' | 'update' | 'delete' | 'rename' | 'move';
  target: {
    path: string;
    content?: string;
    newPath?: string;
    backup?: boolean;
  };
  validation: {
    fileType: string;
    sizeLimit?: number;
    permissions?: string[];
  };
}

// Terminal Command Intents
export interface TerminalCommandIntent extends BaseIntent {
  type: 'terminal_command';
  command: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
  timeout?: number;
  validation: {
    allowedCommands?: string[];
    restrictedPaths?: string[];
    requireConfirmation?: boolean;
  };
}

// External Service Intents
export interface ExternalServiceIntent extends BaseIntent {
  type: 'external_service';
  service: 'anthropic' | 'github' | 'npm' | 'deployment' | 'database';
  action: string;
  parameters: Record<string, any>;
  authentication?: {
    type: 'api_key' | 'oauth' | 'token';
    secretKey?: string;
  };
}

// Project Scaffold Intents
export interface ProjectScaffoldIntent extends BaseIntent {
  type: 'project_scaffold';
  framework: 'react' | 'vue' | 'angular' | 'node' | 'python' | 'custom';
  structure: {
    directories: string[];
    files: Array<{
      path: string;
      template?: string;
      content?: string;
    }>;
  };
  dependencies?: string[];
}

// Code Generation Intents
export interface CodeGenerationIntent extends BaseIntent {
  type: 'code_generation';
  target: {
    file: string;
    function?: string;
    component?: string;
    class?: string;
  };
  requirements: {
    language: string;
    framework?: string;
    patterns?: string[];
    tests?: boolean;
  };
  context: {
    existingCode?: string;
    imports?: string[];
    dependencies?: string[];
  };
}

// Union type for all intents
export type Intent = 
  | FileOperationIntent
  | TerminalCommandIntent
  | ExternalServiceIntent
  | ProjectScaffoldIntent
  | CodeGenerationIntent;

// Governance and Validation Types
export interface GovernanceRule {
  id: string;
  name: string;
  description: string;
  intentTypes: IntentType[];
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'matches' | 'in' | 'greater_than' | 'less_than';
    value: any;
  }>;
  action: 'allow' | 'deny' | 'require_approval' | 'modify';
  modifications?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  intent: Intent;
  appliedRules: string[];
  errors: string[];
  warnings: string[];
  modifications: Record<string, any>;
  requiresApproval: boolean;
}

// Execution Types
export interface ExecutionContext {
  intent: Intent;
  validation: ValidationResult;
  user?: {
    id: string;
    permissions: string[];
  };
  environment: {
    workingDirectory: string;
    nodeEnv: string;
    restrictions: string[];
  };
}

export interface ExecutionResult {
  success: boolean;
  intent: Intent;
  output?: any;
  error?: string;
  duration: number;
  affectedFiles?: string[];
  sideEffects?: string[];
}

// Audit Types
export interface AuditEntry {
  id: string;
  timestamp: Date;
  intent: Intent;
  validation: ValidationResult;
  execution?: ExecutionResult;
  source: {
    chatMessage?: string;
    userId?: string;
    sessionId: string;
  };
  outcome: 'processed' | 'rejected' | 'failed' | 'pending_approval';
}

// Agent Bridge Types
export interface AgentBridgeConfig {
  enableIntentParsing: boolean;
  enableGovernance: boolean;
  enableExecution: boolean;
  enableAudit: boolean;
  governanceRulesPath: string;
  auditLogPath: string;
  maxConcurrentIntents: number;
  intentTimeout: number;
}

export interface ParsedChatOutput {
  originalMessage: string;
  intents: Intent[];
  confidence: number;
  parseErrors: string[];
  metadata: {
    modelUsed: string;
    parseTime: number;
    intentCount: number;
  };
}