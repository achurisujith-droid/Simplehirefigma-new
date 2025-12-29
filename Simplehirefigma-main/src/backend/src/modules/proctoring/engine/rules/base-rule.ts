/**
 * Base Rule Interface for Proctoring Engine
 * Abstract base class for all proctoring rules
 */

export type RuleSeverity = 'low' | 'medium' | 'high';

export interface RuleViolation {
  ruleId: string;
  severity: RuleSeverity;
  message: string;
  timestamp: number;
  data?: any;
}

export interface RuleContext {
  referenceImageBase64?: string;
  liveImageBase64?: string;
  userId?: string;
  interviewId?: string;
  [key: string]: any;
}

/**
 * Abstract base class for proctoring rules
 */
export abstract class BaseRule {
  public readonly id: string;
  public readonly name: string;
  public enabled: boolean;

  constructor(id: string, name: string, enabled: boolean = true) {
    this.id = id;
    this.name = name;
    this.enabled = enabled;
  }

  /**
   * Check if the rule is violated
   * @param context Context data for rule evaluation
   * @returns Promise<RuleViolation | null> - Returns violation if rule is violated, null otherwise
   */
  abstract check(context: RuleContext): Promise<RuleViolation | null>;

  /**
   * Enable the rule
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable the rule
   */
  disable(): void {
    this.enabled = false;
  }
}
