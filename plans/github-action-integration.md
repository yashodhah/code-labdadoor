# Labdadoor GitHub Action Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the GitHub Action event context into the existing labdadoor review engine so that commenting `/labdadoor` on a PR (or opening/updating a PR) triggers an AI code review and posts the result back as a GitHub PR review.

**Architecture:** `github/index.ts` reads GitHub event env vars directly (no `@actions/*` SDK needed), fetches PR metadata via `@octokit/rest`, builds a `ReviewConfig`, calls `runCodeReview()`, and posts the result via `octokit.pulls.createReview()`. The `action.yml` is updated to set up Bun and run the script.

**Tech Stack:** TypeScript, Bun runtime, `@octokit/rest` (already in `package.json`), `@github/copilot-sdk` (already in `package.json`), existing `src/reviewer/index.ts`.

---

## Agent Orchestration Design

### Agent Registry (5 agents)

| Agent              | Trigger                                                                                                   | Model tier                    |
| ------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `quality`          | always                                                                                                    | standard                      |
| `security`         | path-patterns: `auth/`, `crypto/`, `middleware/`, `token`, `secret`                                       | standard                      |
| `performance`      | AGENTS.md rules first, LLM fallback                                                                       | standard                      |
| `docs`             | path-patterns: `.md`, `.mdx`, `README`, `docs/`                                                           | lightweight                   |
| `agents-freshness` | path-patterns: `src/**/*.ts` (D-check) + `AGENTS.md`, `.github/copilot*` (C-check); `llmClassified: true` | lightweight (D), standard (C) |

The `agents-freshness` agent is **one registry entry** that handles two checks internally:

- **C-check**: instruction files changed in the PR → audit them for quality/security
- **D-check**: source code changed → ask "does this change require updating AGENTS.md/instructions?"
  - Input to lightweight model: file names + PR title + current AGENTS.md content (from base branch)

### Classification (`classify()`)

- **Signature:** `async function classify(ctx: DiffContext, changedFiles: ChangedFileMetadata[], agentRules: ParsedAgentRules | null): Promise<ClassificationResult>`
- **AGENTS.md source:** always fetched from the **base branch** via `octokit.repos.getContent()` — never from the PR head or working tree. A PR that modifies AGENTS.md cannot influence its own classification.
- **Two-phase decision:**
  1. AGENTS.md rules take priority — if the repo defines trigger rules, use them
  2. LLM fallback for domain-sensitive agents not covered by AGENTS.md rules
- **LLM fallback:** one lightweight model call, returns JSON `{ performance: boolean, agents_freshness: boolean }`. Input = file names + PR title + AGENTS.md content (from base). One call for all domain-sensitive agents simultaneously.
- `classify()` is `async` (required for the LLM fallback call).

### `TriggerRule` extension

Add `llmClassified?: boolean` to `TriggerRule`:

```typescript
export interface TriggerRule {
  always?: boolean;
  pathPatterns?: string[];
  llmClassified?: boolean; // included in the one-shot LLM fallback call
}
```

### Orchestration (agent-symphony.ts)

- **One `CopilotClient` subprocess** — no parallel OS-level processes
- **One orchestrator session** dispatches specialist sub-agents via the built-in `Agent` tool
- **Code-driven dispatch:** `classify()` determines which agents run. The orchestrator session prompt says "spawn exactly these agents: [list]" — the LLM is an executor, not a classifier
- **Sub-agent output format:** XML

```xml
<findings>
  <finding>
    <id>security-1</id>
    <severity>critical</severity>
    <category>security</category>
    <file>src/auth/oauth.ts</file>
    <line_start>42</line_start>
    <line_end>45</line_end>
    <title>Unvalidated redirect URI</title>
    <description>The redirect URI is not validated against an allowlist.</description>
    <suggestion>Validate against ALLOWED_REDIRECT_URIS before redirecting.</suggestion>
    <confidence>high</confidence>
  </finding>
</findings>
```

No findings: `<findings/>`

### Deduplication (`consolidateFindings()`)

- Two findings are duplicates if they are on the **same file** with **overlapping line ranges**
- Keep the **higher-severity** finding; discard the lower
- Runs in our code after collecting all sub-agent XML outputs

---

## File Structure

| File                             | Change                                                            |
| -------------------------------- | ----------------------------------------------------------------- |
| `github/index.ts`                | Complete rewrite — labdadoor review engine entry point            |
| `github/action.yml`              | Replace binary install with `oven-sh/setup-bun` + `bun index.ts`  |
| `github/README.md`               | Rewrite for labdadoor (review-only workflow)                      |
| `tsconfig.json`                  | Ensure `github/index.ts` is in `include`                          |
| `github/index.test.ts`           | New test file for pure helper functions                           |
| `src/reviewer/agent-registry.ts` | Add performance + agents-freshness agents                         |
| `src/types/agent.ts`             | Add `llmClassified?: boolean` to `TriggerRule`                    |
| `src/reviewer/pre-review.ts`     | Make `classify()` async; add AGENTS.md fetch + LLM fallback       |
| `src/reviewer/agent-symphony.ts` | Rewrite orchestration: one client, sub-agents, XML parsing, dedup |
| `src/reviewer/github.ts`         | Add `fetchFileFromBase(path)` method                              |

---

## Task 1: Extend Types

**Files:**

- Modify: `src/types/agent.ts`

- [ ] **Step 1: Add `llmClassified` to `TriggerRule`**

```typescript
export interface TriggerRule {
  always?: boolean;
  pathPatterns?: string[];
  llmClassified?: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/agent.ts
git commit -m "feat: add llmClassified trigger to TriggerRule"
```

---

## Task 2: Expand Agent Registry

**Files:**

- Modify: `src/reviewer/agent-registry.ts`

- [ ] **Step 1: Add performance and agents-freshness agents**

```typescript
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
      pathPatterns: ["src/", "AGENTS.md", ".github/copilot"],
      llmClassified: true,
    },
    instructionFiles: ["src/assets/review-instructions/09-documentation.md"],
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/reviewer/agent-registry.ts
git commit -m "feat: add performance and agents-freshness to agent registry"
```

---

## Task 3: Add `fetchFileFromBase` to VCS Provider

**Files:**

- Modify: `src/reviewer/github.ts`

- [ ] **Step 1: Add method**

Add a `fetchFileFromBase(filePath: string): Promise<string | null>` method to `GitHubVcsProvider` that fetches the raw content of a file from the PR's base branch via `octokit.repos.getContent()`. Returns `null` if the file does not exist.

- [ ] **Step 2: Commit**

```bash
git add src/reviewer/github.ts
git commit -m "feat: add fetchFileFromBase to GitHubVcsProvider"
```

---

## Task 4: Make `classify()` Async with AGENTS.md + LLM Fallback

**Files:**

- Modify: `src/reviewer/pre-review.ts`

- [ ] **Step 1: Update signature and implementation**

```typescript
export async function classify(
  ctx: DiffContext,
  changedFiles: ChangedFileMetadata[],
  agentRules: string | null, // raw AGENTS.md content from base branch, null if absent
): Promise<{ tier: RiskTier; agents: string[] }>;
```

Logic:

1. Run path-pattern matching against `changedFiles` for all agents with `pathPatterns` or `always`
2. For agents with `llmClassified: true` not already matched: make one lightweight model call
   - Input: file names + PR title + `agentRules` content
   - Returns JSON `{ performance: boolean, agents_freshness: boolean }`
3. Merge results; assign risk tier based on matched agent set
4. Return `{ tier, agents }` — list of agent names to spawn

- [ ] **Step 2: Update `runCodeReview()` caller**

```typescript
const agentRules = await vcs.fetchFileFromBase("AGENTS.md");
const classification = await classify(ctx, changedFiles, agentRules);
```

- [ ] **Step 3: Commit**

```bash
git add src/reviewer/pre-review.ts src/reviewer/index.ts
git commit -m "feat: make classify() async with AGENTS.md-first + LLM fallback"
```

---

## Task 5: Rewrite Orchestration (agent-symphony.ts)

**Files:**

- Modify: `src/reviewer/agent-symphony.ts`

- [ ] **Step 1: Rewrite `orchestrateAgentsImpl`**

Replace `Promise.all` of parallel sessions with:

1. One `CopilotClient` + one orchestrator session
2. Orchestrator system prompt: coordinator role, XML output contract, dedup instructions
3. Orchestrator user prompt: "Spawn exactly these agents: [names]. Pass each agent its scoped patch content and shared context. Collect XML findings."
4. Orchestrator uses built-in `Agent` tool to dispatch each specialist
5. `sendAndWait()` returns orchestrator's final response containing merged XML

- [ ] **Step 2: Replace JSON parser with XML parser**

Replace `parseAgentFindings` (JSON) with `parseXmlFindings`:

- Extract `<finding>` elements from `<findings>` block
- Map each element's child tags to `SpecialistFinding` fields
- Validate severity/category/confidence against allowed values; apply defaults on invalid
- Return `[]` for `<findings/>` or missing block

- [ ] **Step 3: Implement `consolidateFindings()`**

In `src/reviewer/index.ts`:

- Flatten all per-agent findings into a single list
- Sort by file + line_start
- For overlapping line ranges on the same file: keep higher-severity finding, discard lower
- Severity order: `critical > warning > suggestion`

- [ ] **Step 4: Commit**

```bash
git add src/reviewer/agent-symphony.ts src/reviewer/index.ts
git commit -m "feat: rewrite orchestration — one client, sub-agents, XML output, dedup"
```

---

## Task 6: Update `tsconfig.json`

**Files:**

- Modify: `tsconfig.json`

- [ ] **Step 1: Ensure `github/index.ts` is included**

Verify `include` array contains `"github/index.ts"`. Remove stale `"src/github/src/**/*"` if present.

- [ ] **Step 2: Commit**

```bash
git add tsconfig.json
git commit -m "chore: fix tsconfig includes for github/index.ts"
```

---

## Task 7: Rewrite `github/index.ts`

**Files:**

- Modify: `github/index.ts`

- [ ] **Step 1: Write the complete new `github/index.ts`**

```typescript
import * as fs from "node:fs";
import { Octokit } from "@octokit/rest";
import { runCodeReview } from "../src/reviewer/index";
import type { ReviewConfig, VcsConfig } from "../src/types/review-config";
import type { CoordinatorReview, Decision } from "../src/types/findings";
import settingsJson from "../src/configs/settings.json";

// ─── Event Payload Shapes ─────────────────────────────────────────────────────

interface PullRequestPayload {
  action: string;
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    user: { login: string };
    base: { ref: string };
    head: { ref: string };
  };
}

interface IssueCommentPayload {
  action: string;
  issue: {
    number: number;
    pull_request?: object;
  };
  comment: { body: string };
}

interface PullRequestReviewCommentPayload {
  action: string;
  pull_request: { number: number };
  comment: { body: string };
}

// ─── Environment Readers ──────────────────────────────────────────────────────

function readEventPayload(): unknown {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error("GITHUB_EVENT_PATH is not set");
  return JSON.parse(fs.readFileSync(eventPath, "utf-8"));
}

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return token;
}

function getRepository(): string {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) throw new Error("GITHUB_REPOSITORY is not set");
  return repo; // "owner/repo"
}

// ─── Trigger Detection ────────────────────────────────────────────────────────

const COMMAND_PATTERN = /(?:^|\s)(?:\/labdadoor|\/lb)(?=$|\s)/;

export function isLabdadoorCommand(body: string): boolean {
  return COMMAND_PATTERN.test(body.trim());
}

interface ReviewTarget {
  prNumber: number;
}

function resolveReviewTarget(): ReviewTarget | null {
  const eventName = process.env.GITHUB_EVENT_NAME ?? "";
  const payload = readEventPayload();

  if (eventName === "pull_request") {
    const p = payload as PullRequestPayload;
    if (!["opened", "synchronize", "reopened"].includes(p.action)) return null;
    return { prNumber: p.pull_request.number };
  }

  if (eventName === "issue_comment") {
    const p = payload as IssueCommentPayload;
    if (!p.issue.pull_request) return null;
    if (!isLabdadoorCommand(p.comment.body)) return null;
    return { prNumber: p.issue.number };
  }

  if (eventName === "pull_request_review_comment") {
    const p = payload as PullRequestReviewCommentPayload;
    if (!isLabdadoorCommand(p.comment.body)) return null;
    return { prNumber: p.pull_request.number };
  }

  return null;
}

// ─── Review Formatting ────────────────────────────────────────────────────────

type GitHubReviewEvent = "APPROVE" | "COMMENT" | "REQUEST_CHANGES";

export function toGitHubEvent(decision: Decision): GitHubReviewEvent {
  switch (decision) {
    case "approve":
      return "APPROVE";
    case "comment":
      return "COMMENT";
    case "unapprove":
      return "COMMENT";
    case "block":
      return "REQUEST_CHANGES";
  }
}

const DECISION_LABEL: Record<Decision, string> = {
  approve: "**Decision: APPROVED**",
  comment: "**Decision: COMMENT**",
  unapprove: "**Decision: UNAPPROVE** (flagging new concerns)",
  block: "**Decision: CHANGES REQUESTED**",
};

export function formatReviewBody(result: CoordinatorReview): string {
  const findingsRows = result.findings.map(
    (f, i) => `| ${i + 1} | ${f.severity} | \`${f.file}:${f.line_start}\` | ${f.title} |`,
  );
  const findingsTable = findingsRows.length
    ? `\n\n### Findings\n| # | Severity | File | Title |\n|---|----------|------|-------|\n${findingsRows.join("\n")}`
    : "";

  return `${DECISION_LABEL[result.decision]}\n\n${result.summary}${findingsTable}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const target = resolveReviewTarget();
  if (!target) {
    console.log("No labdadoor trigger matched — exiting cleanly.");
    return;
  }

  const token = getToken();
  const repo = getRepository();
  const [owner, repoName] = repo.split("/");

  const octokit = new Octokit({ auth: token });

  const { data: pr } = await octokit.pulls.get({
    owner,
    repo: repoName,
    pull_number: target.prNumber,
  });

  console.log(`Starting labdadoor review on PR #${pr.number}: ${pr.title}`);

  const vcsConfig: VcsConfig = {
    token,
    repo,
    prNumber: pr.number,
    title: pr.title,
    description: pr.body ?? "",
    author: pr.user?.login ?? "unknown",
    baseBranch: pr.base.ref,
    headBranch: pr.head.ref,
    diffStats: {
      additions: pr.additions,
      deletions: pr.deletions,
      filesChanged: pr.changed_files,
    },
  };

  const config: ReviewConfig = {
    vcs: vcsConfig,
    models: settingsJson.models,
  };

  let result: CoordinatorReview;
  try {
    result = await runCodeReview(config);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("runCodeReview failed:", msg);
    await octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: target.prNumber,
      body: `**Labdadoor error**: review pipeline failed.\n\n\`${msg}\``,
    });
    process.exit(1);
  }

  console.log(
    `Review complete — decision: ${result.decision}, findings: ${result.findings.length}`,
  );

  await octokit.pulls.createReview({
    owner,
    repo: repoName,
    pull_number: target.prNumber,
    event: toGitHubEvent(result.decision),
    body: formatReviewBody(result),
  });

  console.log("Review posted to GitHub.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify type-checks**

```bash
bunx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add github/index.ts
git commit -m "feat: rewrite github/index.ts with corrected VcsConfig fields and imports"
```

---

## Task 8: Write Tests for Pure Helpers

**Files:**

- Create: `github/index.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, test, expect } from "bun:test";
import { isLabdadoorCommand, toGitHubEvent, formatReviewBody } from "./index";

describe("isLabdadoorCommand", () => {
  test("matches /labdadoor at start", () =>
    expect(isLabdadoorCommand("/labdadoor please review")).toBe(true));
  test("matches /lb shorthand", () => expect(isLabdadoorCommand("/lb")).toBe(true));
  test("matches /lb mid-sentence", () =>
    expect(isLabdadoorCommand("hey /lb can you check?")).toBe(true));
  test("rejects /labdadoorx", () => expect(isLabdadoorCommand("/labdadoorx")).toBe(false));
  test("rejects unrelated comment", () =>
    expect(isLabdadoorCommand("looks good to me")).toBe(false));
});

describe("toGitHubEvent", () => {
  test("approve  -> APPROVE", () => expect(toGitHubEvent("approve")).toBe("APPROVE"));
  test("comment  -> COMMENT", () => expect(toGitHubEvent("comment")).toBe("COMMENT"));
  test("unapprove-> COMMENT", () => expect(toGitHubEvent("unapprove")).toBe("COMMENT"));
  test("block    -> REQUEST_CHANGES", () => expect(toGitHubEvent("block")).toBe("REQUEST_CHANGES"));
});

describe("formatReviewBody", () => {
  test("includes decision label and summary", () => {
    const body = formatReviewBody({ decision: "approve", summary: "All good.", findings: [] });
    expect(body).toContain("**Decision: APPROVED**");
    expect(body).toContain("All good.");
  });
  test("includes findings table when present", () => {
    const body = formatReviewBody({
      decision: "block",
      summary: "Issues found.",
      findings: [
        {
          id: "1",
          severity: "critical",
          category: "security",
          file: "src/auth.ts",
          line_start: 10,
          line_end: 12,
          title: "SQL injection",
          description: "Unsanitized input.",
          suggestion: "Use parameterized queries.",
        },
      ],
    });
    expect(body).toContain("### Findings");
    expect(body).toContain("src/auth.ts:10");
    expect(body).toContain("SQL injection");
  });
  test("no findings table when empty", () => {
    const body = formatReviewBody({ decision: "comment", summary: "Minor notes.", findings: [] });
    expect(body).not.toContain("### Findings");
  });
});
```

- [ ] **Step 2: Run tests**

```bash
bun test github/index.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add github/index.test.ts
git commit -m "test: add unit tests for github/index.ts pure helpers"
```

---

## Task 9: Update `github/action.yml`

- [ ] **Step 1: Write corrected `action.yml`**

```yaml
name: "CodeLabdadoor Review"
description: "AI-powered code review for pull requests"
branding:
  icon: "eye"
  color: "orange"

inputs:
  anthropic_api_key:
    description: "Anthropic API key for the review models"
    required: true

runs:
  using: "composite"
  steps:
    - name: Set up Bun
      uses: oven-sh/setup-bun@v2
      with:
        bun-version: latest

    - name: Install dependencies
      shell: bash
      run: bun install --frozen-lockfile

    - name: Run labdadoor review
      shell: bash
      run: bun ${{ github.action_path }}/index.ts
      env:
        ANTHROPIC_API_KEY: ${{ inputs.anthropic_api_key }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Commit bun.lock** (required for `--frozen-lockfile` to work in CI)

```bash
git add bun.lock
git commit -m "chore: commit bun.lock for reproducible CI installs"
```

- [ ] **Step 3: Commit action.yml**

```bash
git add github/action.yml
git commit -m "feat: update action.yml — setup-bun, correct GITHUB_TOKEN, add steps key"
```

---

## Task 10: Rewrite `github/README.md`

- [ ] **Step 1: Write new README** (see original plan for content — no structural changes needed)

- [ ] **Step 2: Commit**

```bash
git add github/README.md
git commit -m "docs: rewrite github/README.md for labdadoor review-only workflow"
```

---

## Verification

- [ ] `bunx tsc --noEmit` — no errors
- [ ] `bun test github/index.test.ts` — all pass
- [ ] `bun.lock` committed
- [ ] Local sim: `pull_request` opened → review posted to GitHub
- [ ] Local sim: `issue_comment` with `/labdadoor` → review posted
- [ ] Local sim: `issue_comment` without keyword → "No labdadoor trigger matched"
- [ ] Local sim: `pull_request` with `action: closed` → exits cleanly

### What "working" looks like

`runCodeReview` returns a `comment` decision with a placeholder summary until Phases 4–6 are fully implemented. End-to-end, you'll see a `**Decision: COMMENT**` review posted to the PR. The action integration is complete as soon as that review appears.
