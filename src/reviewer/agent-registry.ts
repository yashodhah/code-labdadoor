import type { AgentDefinition } from "../types/agent";

export const AGENT_REGISTRY: AgentDefinition[] = [
  {
    name: "quality",
    category: "quality",
    modelTier: "standard",
    trigger: { always: true },
    instructionFiles: [
      "src/assets/review-instructions/01-design.md",
      "src/assets/review-instructions/02-functionality.md",
      "src/assets/review-instructions/03-complexity.md",
    ],
  },
  {
    name: "security",
    category: "security",
    modelTier: "standard",
    trigger: {
      pathPatterns: ["auth/", "crypto/", "middleware", "validation", "password", "token", "secret"],
    },
    instructionFiles: [
      "src/assets/review-instructions/02-functionality.md",
      "src/assets/review-instructions/10-every-line.md",
    ],
  },
  {
    name: "performance",
    category: "performance",
    modelTier: "standard",
    trigger: { llmClassified: true },
    instructionFiles: [
      "src/assets/review-instructions/02-functionality.md",
      "src/assets/review-instructions/03-complexity.md",
    ],
  },
  {
    name: "docs",
    category: "docs",
    modelTier: "lightweight",
    trigger: {
      pathPatterns: ["\\.md$", "\\.mdx$", "README", "CHANGELOG", "docs/"],
    },
    instructionFiles: ["src/assets/review-instructions/09-documentation.md"],
  },
  {
    name: "agents-freshness",
    category: "quality",
    modelTier: "lightweight",
    trigger: {
      pathPatterns: ["src/", "AGENTS\\.md", "\\.github/copilot"],
      llmClassified: true,
    },
    instructionFiles: ["src/assets/review-instructions/09-documentation.md"],
  },
];
