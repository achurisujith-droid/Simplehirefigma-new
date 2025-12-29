/**
 * Proctoring Engine
 * Extensible rule-based system for interview proctoring
 */

import logger from '../../../config/logger';
import { BaseRule, RuleContext, RuleViolation } from './rules/base-rule';
import { FaceMatchingRule } from './rules/face-matching-rule';

export interface ProctoringResult {
  passed: boolean;
  violations: RuleViolation[];
}

/**
 * Proctoring Engine
 * Executes all enabled rules and returns violations
 */
export class ProctoringEngine {
  private rules: BaseRule[];

  constructor() {
    // Initialize with default rules
    // Currently: faceMatchingRule
    // Future: multiplePersonRule, lookAwayRule, tabSwitchRule
    this.rules = [
      new FaceMatchingRule(true, 80), // Enabled with 80% threshold
    ];

    logger.info(`Proctoring engine initialized with ${this.rules.length} rules`);
  }

  /**
   * Add a custom rule to the engine
   */
  addRule(rule: BaseRule): void {
    this.rules.push(rule);
    logger.info(`Added rule: ${rule.name} (${rule.id})`);
  }

  /**
   * Remove a rule by ID
   */
  removeRule(ruleId: string): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter((rule) => rule.id !== ruleId);
    const removed = this.rules.length < initialLength;

    if (removed) {
      logger.info(`Removed rule: ${ruleId}`);
    }

    return removed;
  }

  /**
   * Enable a rule by ID
   */
  enableRule(ruleId: string): boolean {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enable();
      logger.info(`Enabled rule: ${ruleId}`);
      return true;
    }
    return false;
  }

  /**
   * Disable a rule by ID
   */
  disableRule(ruleId: string): boolean {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.disable();
      logger.info(`Disabled rule: ${ruleId}`);
      return true;
    }
    return false;
  }

  /**
   * Get all rules
   */
  getRules(): BaseRule[] {
    return this.rules;
  }

  /**
   * Run all enabled checks
   * @param context Context data for rule evaluation
   * @returns Proctoring result with pass/fail and violations
   */
  async runChecks(context: RuleContext): Promise<ProctoringResult> {
    const violations: RuleViolation[] = [];
    const enabledRules = this.rules.filter((rule) => rule.enabled);

    logger.info(`Running ${enabledRules.length} enabled proctoring rules`);

    // Execute all enabled rules
    for (const rule of enabledRules) {
      try {
        logger.info(`Executing rule: ${rule.name} (${rule.id})`);
        const violation = await rule.check(context);

        if (violation) {
          violations.push(violation);
          logger.warn(
            `Rule violation detected: ${rule.name} - ${violation.message}`
          );
        }
      } catch (error) {
        logger.error(`Error executing rule ${rule.id}:`, error);
        // Add error as high severity violation
        violations.push({
          ruleId: rule.id,
          severity: 'high',
          message: `Rule execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now(),
          data: { error: String(error) },
        });
      }
    }

    const passed = violations.length === 0;

    logger.info(
      `Proctoring checks completed: ${passed ? 'PASSED' : 'FAILED'} (${violations.length} violations)`
    );

    return {
      passed,
      violations,
    };
  }
}

// Export singleton instance
export const proctoringEngine = new ProctoringEngine();
