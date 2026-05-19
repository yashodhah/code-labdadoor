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
2. Resolves coding standards — if `LABRADOR_STANDARDS` is set, installs skill packages via `npx skills add` and loads their `SKILL.md` content (see **Standards loading** below)
3. Classifies the PR (risk tier: trivial / lite / full) and selects which agents to run
4. Each agent reviews its scoped diff and returns XML findings; the `quality` agent additionally enforces any loaded coding standards
5. Findings are deduplicated by file + line overlap (highest severity wins)
6. Returns a structured review

## Standards loading

The `quality` agent can be extended with external coding standards at runtime. All other agents (security, performance, docs, agents-freshness) are unaffected.

**Configuration**

Set the `LABRADOR_STANDARDS` environment variable to a comma-separated list of skill sources in any format accepted by `npx skills add`:

```bash
LABRADOR_STANDARDS=owner/repo
LABRADOR_STANDARDS=owner/repo1,owner/standards-repo2
```

**What happens at startup**

`src/reviewer/standards-loader.ts` runs once before the review pipeline:

1. For each source, runs `npx skills add <source> --yes` — installs skill files into `.claude/skills/` (project) or `~/.claude/skills/` (global)
2. Scans both locations for `SKILL.md` files
3. Concatenates their content and appends it under a `## CODING STANDARDS` heading in the `quality` agent's system message

**Testing the behavior**

To verify standards are loaded and enforced:

1. Install a standards package: `LABRADOR_STANDARDS=thecloudplumbingco/tcp-standards`
2. Stage a TypeScript file that violates a known rule (e.g., uses `any` — violates `TCP-TS-001`)
3. Run `bun run src/local.ts`
4. Expect a `quality` agent finding citing the rule code (e.g., `TCP-TS-001`)

If no rule code appears in the finding, the standards were not loaded — check that `.claude/skills/` contains the expected `SKILL.md` files after the run.

## Integrations

For now this repo directly supports GitHub integration. Further integrations (e.g. GitLab, Bitbucket) are not planned yet — see `docs/` for background on the project initiative.

## Code review

When reviewing code in this repository, invoke the `tcp-standards:typescript-standards` skill.
