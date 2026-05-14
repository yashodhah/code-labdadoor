## Project overview

Labdadoor is an NPM package that runs AI-powered code reviews. It ships as a reusable library with two entry points:

- **`src/index.ts`** — runs locally or in any CI environment given a config
- **`github/index.ts`** — GitHub-specific wrapper that reads PR context from the environment and posts the review back via the GitHub Reviews API

It uses a multi-agent pipeline where a classifier decides which specialist agents to invoke based on the diff content and changed file paths.

## Specialist agents

| Agent              | Trigger                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `quality`          | Always — reviews design, functionality, and complexity                                                   |
| `security`         | Path match: `auth/`, `crypto/`, `middleware`, `validation`, `token`, `secret`, `password`                |
| `performance`      | LLM-classified — triggered when changes likely affect runtime performance                                |
| `docs`             | Path match: `.md`, `.mdx`, `README`, `CHANGELOG`, `docs/`                                                |
| `agents-freshness` | Path match on `src/` or `AGENTS.md`, or LLM-classified — checks whether agent instructions need updating |

## How it works

1. Receives PR context (title, diff, changed files) — from GitHub event payload or a local config
2. Classifies the PR (risk tier: trivial / lite / full) and selects which agents to run
3. Each agent reviews its scoped diff and returns XML findings
4. Findings are deduplicated by file + line overlap (highest severity wins)
5. Returns a structured review

## Integrations

For now this repo directly supports GitHub integration. Further integrations (e.g. GitLab, Bitbucket) are not planned yet — see `docs/` for background on the project initiative.

## Code review

When reviewing code in this repository, invoke the `typescript-standards` skill.
