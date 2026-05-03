"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_REGISTRY = void 0;
// ─── Registry ─────────────────────────────────────────────────────────────────
exports.AGENT_REGISTRY = [
    {
        name: 'security',
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
        name: 'quality',
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
        name: 'docs',
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
