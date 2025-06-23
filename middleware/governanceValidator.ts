/**
 * Governance Validator - Agent Bridge Middleware v2.0
 * Reads and enforces governance rules from build protocol
 */

import { Intent, GovernanceRule, ValidationResult } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class GovernanceValidator {
  private rules: GovernanceRule[] = [];
  private rulesPath: string;
  private lastRulesUpdate: Date = new Date(0);

  constructor(rulesPath: string = './system/build-protocol.json') {
    this.rulesPath = rulesPath;
  }

  /**
   * Validate intent against governance rules
   */
  public async validateIntent(intent: Intent): Promise<ValidationResult> {
    await this.loadRulesIfNeeded();

    const result: ValidationResult = {
      isValid: true,
      intent,
      appliedRules: [],
      errors: [],
      warnings: [],
      modifications: {},
      requiresApproval: false,
    };

    // Apply all matching rules
    for (const rule of this.rules) {
      if (this.ruleApplies(rule, intent)) {
        const ruleResult = this.applyRule(rule, intent);
        this.mergeRuleResult(result, ruleResult, rule.id);
      }
    }

    return result;
  }

  /**
   * Load governance rules from file system
   */
  private async loadRulesIfNeeded(): Promise<void> {
    try {
      const stats = await fs.stat(this.rulesPath);
      if (stats.mtime > this.lastRulesUpdate) {
        const rulesContent = await fs.readFile(this.rulesPath, 'utf-8');
        const rulesData = JSON.parse(rulesContent);
        this.rules = this.parseRules(rulesData);
        this.lastRulesUpdate = stats.mtime;
      }
    } catch (error) {
      // If rules file doesn't exist, use default rules
      this.rules = this.getDefaultRules();
      this.lastRulesUpdate = new Date();
    }
  }

  /**
   * Check if a rule applies to the given intent
   */
  private ruleApplies(rule: GovernanceRule, intent: Intent): boolean {
    // Check if intent type matches
    if (!rule.intentTypes.includes(intent.type)) {
      return false;
    }

    // Check all conditions
    return rule.conditions.every(condition => 
      this.evaluateCondition(condition, intent)
    );
  }

  /**
   * Evaluate a single condition against an intent
   */
  private evaluateCondition(condition: any, intent: Intent): boolean {
    const value = this.getFieldValue(condition.field, intent);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value);
      case 'matches':
        return new RegExp(condition.value).test(String(value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      default:
        return false;
    }
  }

  /**
   * Get field value from intent using dot notation
   */
  private getFieldValue(field: string, intent: Intent): any {
    const parts = field.split('.');
    let value: any = intent;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Apply a rule to an intent
   */
  private applyRule(rule: GovernanceRule, intent: Intent): Partial<ValidationResult> {
    const result: Partial<ValidationResult> = {
      errors: [],
      warnings: [],
      modifications: {},
      requiresApproval: false,
    };

    switch (rule.action) {
      case 'deny':
        result.errors = [`Action denied by rule: ${rule.name}`];
        break;

      case 'require_approval':
        result.requiresApproval = true;
        result.warnings = [`Action requires approval: ${rule.description}`];
        break;

      case 'modify':
        if (rule.modifications) {
          result.modifications = { ...rule.modifications };
          result.warnings = [`Action modified by rule: ${rule.name}`];
        }
        break;

      case 'allow':
        // No additional action needed
        break;
    }

    return result;
  }

  /**
   * Merge rule result into main validation result
   */
  private mergeRuleResult(
    main: ValidationResult,
    rule: Partial<ValidationResult>,
    ruleId: string
  ): void {
    main.appliedRules.push(ruleId);

    if (rule.errors?.length) {
      main.errors.push(...rule.errors);
      main.isValid = false;
    }

    if (rule.warnings?.length) {
      main.warnings.push(...rule.warnings);
    }

    if (rule.modifications) {
      main.modifications = { ...main.modifications, ...rule.modifications };
    }

    if (rule.requiresApproval) {
      main.requiresApproval = true;
    }
  }

  /**
   * Parse rules from configuration data
   */
  private parseRules(rulesData: any): GovernanceRule[] {
    if (!rulesData.governance?.rules) {
      return this.getDefaultRules();
    }

    return rulesData.governance.rules.map((rule: any) => ({
      id: rule.id || `rule_${Date.now()}_${Math.random()}`,
      name: rule.name || 'Unnamed Rule',
      description: rule.description || '',
      intentTypes: rule.intentTypes || [],
      conditions: rule.conditions || [],
      action: rule.action || 'allow',
      modifications: rule.modifications,
    }));
  }

  /**
   * Get default governance rules
   */
  private getDefaultRules(): GovernanceRule[] {
    return [
      {
        id: 'default_file_size_limit',
        name: 'File Size Limit',
        description: 'Prevent creation of files larger than 5MB',
        intentTypes: ['file_operation'],
        conditions: [
          {
            field: 'target.content',
            operator: 'greater_than',
            value: 5 * 1024 * 1024, // 5MB
          },
        ],
        action: 'deny',
      },
      {
        id: 'default_system_file_protection',
        name: 'System File Protection',
        description: 'Prevent modification of system configuration files',
        intentTypes: ['file_operation'],
        conditions: [
          {
            field: 'target.path',
            operator: 'matches',
            value: '^/(etc|usr|var|bin|sbin)/',
          },
        ],
        action: 'deny',
      },
      {
        id: 'default_dangerous_commands',
        name: 'Dangerous Command Protection',
        description: 'Require approval for potentially dangerous terminal commands',
        intentTypes: ['terminal_command'],
        conditions: [
          {
            field: 'command',
            operator: 'matches',
            value: '(rm|delete|format|shutdown|reboot|dd|mkfs)',
          },
        ],
        action: 'require_approval',
      },
      {
        id: 'default_package_installation',
        name: 'Package Installation Approval',
        description: 'Require approval for package installations',
        intentTypes: ['terminal_command'],
        conditions: [
          {
            field: 'command',
            operator: 'contains',
            value: 'npm install',
          },
        ],
        action: 'require_approval',
      },
      {
        id: 'default_external_service_approval',
        name: 'External Service Approval',
        description: 'Require approval for external service calls',
        intentTypes: ['external_service'],
        conditions: [],
        action: 'require_approval',
      },
      {
        id: 'default_working_directory',
        name: 'Working Directory Restriction',
        description: 'Restrict terminal commands to project directories',
        intentTypes: ['terminal_command'],
        conditions: [
          {
            field: 'workingDirectory',
            operator: 'matches',
            value: '^/projects/',
          },
        ],
        action: 'allow',
      },
      {
        id: 'default_file_extension_validation',
        name: 'File Extension Validation',
        description: 'Ensure proper file extensions for code files',
        intentTypes: ['file_operation', 'code_generation'],
        conditions: [
          {
            field: 'target.path',
            operator: 'matches',
            value: '\\.(js|jsx|ts|tsx|css|html|json|md)$',
          },
        ],
        action: 'allow',
      },
    ];
  }

  /**
   * Create build protocol file with default governance rules
   */
  public async createDefaultBuildProtocol(): Promise<void> {
    const defaultProtocol = {
      version: '2.0',
      governance: {
        enabled: true,
        rules: this.getDefaultRules(),
        settings: {
          requireApprovalThreshold: 'medium',
          auditLevel: 'full',
          autoApprove: ['low'],
        },
      },
      middleware: {
        intentParser: {
          enabled: false,
          confidence_threshold: 0.7,
        },
        executionRouter: {
          enabled: false,
          timeout: 30000,
        },
        auditLogger: {
          enabled: false,
          retention_days: 30,
        },
      },
      skeleton: {
        enabled: false,
        auto_scaffold: false,
      },
      seo: {
        enabled: false,
        auto_optimize: false,
      },
      migration: {
        enabled: false,
        auto_migrate: false,
      },
    };

    const systemDir = path.dirname(this.rulesPath);
    try {
      await fs.mkdir(systemDir, { recursive: true });
      await fs.writeFile(
        this.rulesPath,
        JSON.stringify(defaultProtocol, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to create build protocol file:', error);
    }
  }

  /**
   * Get current governance rules
   */
  public async getRules(): Promise<GovernanceRule[]> {
    await this.loadRulesIfNeeded();
    return this.rules;
  }

  /**
   * Update governance rules
   */
  public async updateRules(rules: GovernanceRule[]): Promise<void> {
    this.rules = rules;
    
    try {
      const existingData = await this.loadBuildProtocol();
      existingData.governance.rules = rules;
      
      await fs.writeFile(
        this.rulesPath,
        JSON.stringify(existingData, null, 2),
        'utf-8'
      );
      
      this.lastRulesUpdate = new Date();
    } catch (error) {
      console.error('Failed to update governance rules:', error);
    }
  }

  /**
   * Load build protocol file
   */
  private async loadBuildProtocol(): Promise<any> {
    try {
      const content = await fs.readFile(this.rulesPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      await this.createDefaultBuildProtocol();
      const content = await fs.readFile(this.rulesPath, 'utf-8');
      return JSON.parse(content);
    }
  }
}