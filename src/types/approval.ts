/**
 * Approval and decision-related types for code review.
 */

export type RiskTier = 'trivial' | 'lite' | 'full';
export type Severity = 'critical' | 'warning' | 'suggestion';
export type Category = 'security' | 'quality' | 'performance' | 'docs' | 'release';
export type Confidence = 'high' | 'medium' | 'low';
export type Decision = 'approve' | 'comment' | 'unapprove' | 'block';
export type ModelTier = 'top' | 'standard' | 'lightweight';

export interface ClassificationResult {
  tier: RiskTier;
  agents: string[];
}
