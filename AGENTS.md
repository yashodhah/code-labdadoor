# AGENTS.md

## Project overview
- Labdadoor (`ai-reviewer`) is a Bun-powered CLI that turns GitHub webhook events into Copilot-driven code reviews; the reviewer core is under `src/reviewer` and the action entrypoint lives in `github/index.ts`.
## Setup & verification
- Install dependencies with `bun install` (we commit `bun.lock` for reproducible CI installs).
- Run `bun src/index.ts` locally to exercise the review engine—it loads the bundled settings and prints the decision/summary/findings count.


## Work style
- Keep TypeScript strict mode semantics, single quotes, and semicolon-free formatting; prefer small pure helpers and keep side effects localized to GitHub event handling or the orchestrator entrypoint.
- When extending the agent logic, update the instructions in `src/assets/review-instructions/` so each specialist prompt stays in sync with the new findings expectations.
- The orchestration loop communicates via XML (`<findings><finding>…</finding></findings>`); maintain that contract and validate severity/confidence before returning results from sub-agents.

## Testing discipline
- After moving files or changing imports, rerun `bun test github/index.test.ts` and `bun src/index.ts` to spot issues before pushing.
- The classification step always reads this file from the base branch, so new instructions here cannot influence their own PR; keep the guidance focused on cross-cutting repo policy.
