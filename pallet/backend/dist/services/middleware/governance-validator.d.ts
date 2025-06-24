/**
 * Governance Validator - Agent Bridge Middleware v2.0
 * Reads and enforces governance rules from build protocol
 */
import type { Intent, GovernanceRule, ValidationResult } from './types.js';
export declare class GovernanceValidator {
    private rules;
    private rulesPath;
    private lastRulesUpdate;
    constructor(rulesPath?: string);
    /**
     * Validate intent against governance rules
     */
    validateIntent(intent: Intent): Promise<ValidationResult>;
    /**
     * Load governance rules from file system
     */
    private loadRulesIfNeeded;
    /**
     * Check if a rule applies to the given intent
     */
    private ruleApplies;
    /**
     * Evaluate a single condition against an intent
     */
    private evaluateCondition;
    /**
     * Get field value from intent using dot notation
     */
    private getFieldValue;
    /**
     * Apply a rule to an intent
     */
    private applyRule;
    /**
     * Merge rule result into main validation result
     */
    private mergeRuleResult;
    /**
     * Parse rules from configuration data
     */
    private parseRules;
    /**
     * Get default governance rules
     */
    private getDefaultRules;
    /**
     * Create build protocol file with default governance rules
     */
    createDefaultBuildProtocol(): Promise<void>;
    /**
     * Load build protocol file
     */
    private loadBuildProtocol;
    /**
     * Get current governance rules
     */
    getRules(): Promise<GovernanceRule[]>;
    /**
     * Update governance rules
     */
    updateRules(rules: GovernanceRule[]): Promise<void>;
}
//# sourceMappingURL=governance-validator.d.ts.map