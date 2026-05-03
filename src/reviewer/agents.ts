import type { Category } from './orchestrator';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ModelTier = 'top' | 'standard' | 'lightweight';

export interface TriggerRule {
  /** Run this agent on every PR (for source files). */
  always?:       boolean;
  /** Regex patterns matched against changed file paths. */
  pathPatterns?: string[];
}

export interface AgentDefinition {
  name:             string;
  category:         Category;
  modelTier:        ModelTier;
  trigger:          TriggerRule;
  /** Workspace-relative paths; loaded and concatenated at agent spawn time. */
  instructionFiles: string[];
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const AGENT_REGISTRY: AgentDefinition[] = [
  {
    name:     'security',
    category: 'security',
    modelTier: 'standard',
    trigger: {
      pathPatterns: ['auth/', 'crypto/', 'middleware', 'validation', 'password', 'token', 'secret'],
    },
    instructionFiles: [
      'src/instructions/02-functionality.md',
      'src/instructions/10-every-line.md',
    ],
  },
  {
    name:     'quality',
    category: 'quality',
    modelTier: 'standard',
    trigger: {
      always: true,
    },
    instructionFiles: [
      'src/instructions/01-design.md',
      'src/instructions/02-functionality.md',
      'src/instructions/03-complexity.md',
    ],
  },
  {
    name:     'docs',
    category: 'docs',
    modelTier: 'lightweight',
    trigger: {
      pathPatterns: ['\\.md$', '\\.mdx$', 'README', 'CHANGELOG', 'docs/'],
    },
    instructionFiles: [
      'src/instructions/09-documentation.md',
    ],
  },
];
