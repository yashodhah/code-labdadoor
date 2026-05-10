import type { Severity, Category, Confidence, Decision } from './approval';

/**
 * Findings produced by specialist agents during code review.
 */

export interface SpecialistFinding {
  id: string;
  agent: string;
  severity: Severity;
  category: Category;
  file: string;
  line_start: number;
  line_end: number;
  title: string;
  description: string;
  suggestion: string;
  confidence: Confidence;
}

export interface CoordinatorReview {
  decision: Decision;
  summary: string;
  findings: Omit<SpecialistFinding, 'agent' | 'confidence'>[];
}

// Re-export for convenience
export type { Decision } from './approval';
