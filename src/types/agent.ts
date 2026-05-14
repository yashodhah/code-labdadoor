import type { Category, ModelTier } from "./approval";

/**
 * Types for agent configuration and triggering rules.
 */

export type { ModelTier } from "./approval";

export interface TriggerRule {
  /** Run this agent on every PR (for source files). */
  always?: boolean;
  /** Regex patterns matched against changed file paths. */
  pathPatterns?: string[];
  /** Include this agent in the one-shot LLM fallback classification call. */
  llmClassified?: boolean;
}

export interface AgentDefinition {
  name: string;
  category: Category;
  modelTier: ModelTier;
  trigger: TriggerRule;
  /** Workspace-relative paths; loaded and concatenated at agent spawn time. */
  instructionFiles: string[];
}
