# AGENTS.md

## Project overview

Labdadoor (`ai-reviewer`) is a Bun-powered CLI that turns GitHub webhook events into Copilot-driven code reviews; the reviewer core is under `src/reviewer` and the action entrypoint lives in `github/index.ts`.

It ships as a reusable library with two entry points:

- **`src/index.ts`** — runs locally or in any CI environment given a config
- **`github/index.ts`** — GitHub-specific wrapper that reads PR context from the environment and posts the review back via the GitHub Reviews API

It uses a multi-agent pipeline where a classifier decides which specialist agents to invoke based on the diff content and changed file paths.

## Setup & verification

- Install dependencies with `bun install` (we commit `bun.lock` for reproducible CI installs).
- Run `bun src/index.ts` locally to exercise the review engine—it loads the bundled settings and prints the decision/summary/findings count.

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

## Work style

- Keep TypeScript strict mode semantics, single quotes, and semicolon-free formatting; prefer small pure helpers and keep side effects localized to GitHub event handling or the orchestrator entrypoint.
- When extending the agent logic, update the instructions in `src/assets/review-instructions/` so each specialist prompt stays in sync with the new findings expectations.
- The orchestration loop communicates via XML (`<findings><finding>…</finding></findings>`); maintain that contract and validate severity/confidence before returning results from sub-agents.

## Testing discipline

- After moving files or changing imports, rerun `bun test github/index.test.ts` and `bun src/index.ts` to spot issues before pushing.
- The classification step always reads this file from the base branch, so new instructions here cannot influence their own PR; keep the guidance focused on cross-cutting repo policy.

## Code review

When reviewing code in this repository, invoke the `typescript-standards` skill.
