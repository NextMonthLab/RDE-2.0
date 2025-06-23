/**
 * Governance Validator - Agent Bridge Middleware v2.0
 * Reads and enforces governance rules from build protocol
 */

import fs from 'fs/promises';
import path from 'path';
import type { Intent, GovernanceRule, ValidationResult } from './types.js';

export class GovernanceValidator {
  private rules: GovernanceRule[] = [];
  private rulesPath: string;
  private lastRulesUpdate: Date = new Date(0);

  constructor(rulesPath: string = process.env.BUILD_PROTOCOL_PATH || '/app/system/build-protocol.json') {
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

    // Apply each relevant rule
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
      if (stats.mtime <= this.lastRulesUpdate) {
        return; // Rules haven't changed
      }

      const buildProtocol = await this.loadBuildProtocol();
      this.rules = this.parseRules(buildProtocol);
      this.lastRulesUpdate = stats.mtime;
      
      console.log(`[GovernanceValidator] Loaded ${this.rules.length} governance rules`);
    } catch (error) {
      console.warn('[GovernanceValidator] Failed to load rules, using defaults:', error);
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
    const fieldValue = this.getFieldValue(condition.field, intent);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      
      case 'matches':
        try {
          const regex = new RegExp(condition.value, 'i');
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }
      
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      
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
      appliedRules: [rule.id],
      errors: [],
      warnings: [],
      modifications: {},
    };

    switch (rule.action) {
      case 'allow':
        // Rule explicitly allows this intent
        break;
      
      case 'deny':
        result.isValid = false;
        result.errors = [`Intent denied by rule: ${rule.name}`];
        break;
      
      case 'require_approval':
        result.requiresApproval = true;
        result.warnings = [`Intent requires approval: ${rule.description}`];
        break;
      
      case 'modify':
        if (rule.modifications) {
          result.modifications = { ...rule.modifications };
          result.warnings = [`Intent modified by rule: ${rule.name}`];
        }
        break;
    }

    return result;
  }

  /**
   * Merge rule result into main validation result
   */
  private mergeRuleResult(
    main: ValidationResult,
    ruleResult: Partial<ValidationResult>,
    ruleId: string
  ): void {
    // Track applied rule
    main.appliedRules.push(ruleId);
    
    // Merge validation status (any false makes it false)
    if (ruleResult.isValid === false) {
      main.isValid = false;
    }
    
    // Merge approval requirement (any true makes it true)
    if (ruleResult.requiresApproval === true) {
      main.requiresApproval = true;
    }
    
    // Merge errors and warnings
    if (ruleResult.errors) {
      main.errors.push(...ruleResult.errors);
    }
    if (ruleResult.warnings) {
      main.warnings.push(...ruleResult.warnings);
    }
    
    // Merge modifications
    if (ruleResult.modifications) {
      main.modifications = { ...main.modifications, ...ruleResult.modifications };
    }
  }

  /**
   * Parse rules from configuration data
   */
  private parseRules(rulesData: any): GovernanceRule[] {
    if (!rulesData.rules || !Array.isArray(rulesData.rules)) {
      return this.getDefaultRules();
    }

    return rulesData.rules.map((rule: any) => ({
      id: rule.id || `rule-${Date.now()}`,
      name: rule.name || 'Unnamed Rule',
      description: rule.description || '',
      intentTypes: Array.isArray(rule.intentTypes) ? rule.intentTypes : [],
      conditions: Array.isArray(rule.conditions) ? rule.conditions : [],
      action: rule.action || 'allow',
      modifications: rule.modifications || {},
    }));
  }

  /**
   * Get default governance rules
   */
  private getDefaultRules(): GovernanceRule[] {
    return [
      {
        id: 'allow-safe-file-operations',
        name: 'Allow Safe File Operations',
        description: 'Automatically approve creation and updates of safe file types',
        intentTypes: ['file_operation'],
        conditions: [
          { field: 'operation', operator: 'in', value: ['create', 'update'] },
          { field: 'target.path', operator: 'matches', value: '\\.(js|jsx|ts|tsx|json|md|txt|css|html)$' }
        ],
        action: 'allow',
      },
      {
        id: 'require-approval-deletions',
        name: 'Require Approval for Deletions',
        description: 'All file deletions require manual approval',
        intentTypes: ['file_operation'],
        conditions: [
          { field: 'operation', operator: 'equals', value: 'delete' }
        ],
        action: 'require_approval',
      },
      {
        id: 'restrict-system-files',
        name: 'Restrict System File Access',
        description: 'Prevent access to system configuration files',
        intentTypes: ['file_operation'],
        conditions: [
          { field: 'target.path', operator: 'matches', value: '^(\\.|/etc/|/usr/|/var/|/sys/|/proc/)' }
        ],
        action: 'deny',
      },
    ];
  }

  /**
   * Create build protocol file with default governance rules
   */
  public async createDefaultBuildProtocol(): Promise<void> {
    try {
      await fs.access(this.rulesPath);
      return; // File already exists
    } catch {
      // File doesn't exist, create it
      const defaultProtocol = {
        version: '2.0.0',
        metadata: {
          name: 'RDE v2.0 Build Protocol',
          description: 'AI-Governed development environment build protocol',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        governance: {
          mode: 'semi-automatic',
          defaultAction: 'allow',
          requireApprovalFor: ['file_deletion', 'system_commands', 'package_installation'],
        },
        rules: this.getDefaultRules(),
      };

      // Ensure directory exists
      const dir = path.dirname(this.rulesPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write default protocol
      await fs.writeFile(this.rulesPath, JSON.stringify(defaultProtocol, null, 2));
      console.log(`[GovernanceValidator] Created default build protocol at ${this.rulesPath}`);
    }
  }

  /**
   * Load build protocol file
   */
  private async loadBuildProtocol(): Promise<any> {
    const content = await fs.readFile(this.rulesPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Get current governance rules
   */
  public async getRules(): Promise<GovernanceRule[]> {
    await this.loadRulesIfNeeded();
    return [...this.rules];
  }

  /**
   * Update governance rules
   */
  public async updateRules(rules: GovernanceRule[]): Promise<void> {
    try {
      const buildProtocol = await this.loadBuildProtocol();
      buildProtocol.rules = rules;
      buildProtocol.metadata.updatedAt = new Date().toISOString();
      
      await fs.writeFile(this.rulesPath, JSON.stringify(buildProtocol, null, 2));
      this.rules = rules;
      this.lastRulesUpdate = new Date();
      
      console.log(`[GovernanceValidator] Updated ${rules.length} governance rules`);
    } catch (error) {
      throw new Error(`Failed to update governance rules: ${error}`);
    }
  }
}