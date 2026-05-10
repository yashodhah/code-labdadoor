This porject was inspired by the https://blog.cloudflare.com/ai-code-review/
And note that this is not exactly a copy of that, It's an effort to implement what has been shared with the community using the copilot sdk.

## The problem they solved

Code review was bottlenecking engineers. Median wait for a first review was measured in hours. They tried off-the-shelf AI tools — not flexible enough. They tried naive LLM prompting (dump diff into prompt) — too noisy, hallucinated issues, flagged things that were already handled.

So they built their own.

---

## The architecture in plain English

Instead of one big prompt, they run **up to 7 specialised agents** on every merge request:

- Security reviewer
- Performance reviewer
- Code quality reviewer
- Documentation reviewer
- Release management reviewer
- Internal compliance (Engineering Codex)
- [AGENTS.md](http://AGENTS.md) freshness checker

A **coordinator agent** sits above all of them. It reads all their outputs, deduplicates overlapping findings, re-categorises misplaced ones, filters out false positives, and posts a single structured review comment.

---

## How it actually runs

Runs on **GitLab CI runners** (not GitHub — Cloudflare uses GitLab internally). It is CI-native.

On the runner:

1. A Bun process spawns OpenCode as a child process (`Bun.spawn`) with `--format json`
2. The prompt is passed via `stdin` (not CLI args — they hit Linux's `ARG_MAX` limit on large MRs)
3. OpenCode runs the coordinator agent
4. The coordinator calls a `spawn_reviewers` tool which launches sub-reviewer sessions via OpenCode's SDK — all inside the same process
5. Sub-reviewers run concurrently, return structured XML findings
6. Coordinator consolidates and posts the review to GitLab

Workers are only used for the **control plane** — fetching model config from Workers KV, and fire-and-forget telemetry. Not for the actual agent execution.

---

## Why OpenCode specifically

- Server-first architecture: sessions can be created and driven programmatically via SDK
- Open source — Cloudflare engineers have landed 45+ upstream PRs
- Avoids hacking around a CLI interface

---

## The plugin system — what it actually is

The system needs to produce one file: `opencode.json`. This config tells OpenCode everything — models, agents, prompts, API keys.

The "plugin system" is just their way of **building that config from multiple sources** without everything needing to know about everything else. Each plugin contributes a piece:

- GitLab plugin → VCS tokens, MR data
- Cloudflare plugin → AI Gateway URLs, API keys
- Codex plugin → internal compliance rules
- etc.

**Why this matters for teams:** Each team can write and ship their own plugin independently. The payments team ships a PCI compliance plugin. The infra team ships a Terraform specialist plugin. Nobody needs to go through a central team. Same reason VS Code has an extension marketplace.

> For a prototype, skip the plugin system entirely. Just write `opencode.json` directly. Add the abstraction only when multiple teams need to extend it.
> 

---

## Key prompt engineering insight

The real value is in **what you tell the AI NOT to do**.

Without "what NOT to flag" instructions, you get a firehose of speculative theoretical warnings that developers immediately learn to ignore.

Example — the security reviewer is explicitly told NOT to flag:

- Theoretical risks requiring unlikely preconditions
- Defense-in-depth suggestions when primary defenses are already adequate
- Issues in unchanged code
- "Consider using library X" style suggestions

---

## Model tiers (cost optimisation)

| Tier | Models | Used for |
| --- | --- | --- |
| Top | Claude Opus / GPT-5 | Coordinator only |
| Standard | Claude Sonnet / GPT Codex | Security, performance, code quality |
| Lightweight | Kimi K2.5 | Docs, release notes, [AGENTS.md](http://AGENTS.md) |

Model assignments can be overridden dynamically from a Cloudflare Worker — no code deploys needed.

---

## Risk tiers (token spend optimisation)

| Tier | Condition | Agents |
| --- | --- | --- |
| Trivial | ≤10 lines, ≤20 files | 2 (coordinator + one general reviewer) |
| Lite | ≤100 lines, ≤20 files | 4 |
| Full | >100 lines or >50 files | 7+ |

Anything touching `auth/` or `crypto/` always triggers full review regardless of size.

---

## Approval logic

Biased toward approval — single warning in an otherwise clean MR still gets approved with comments.

| Finding | Action |
| --- | --- |
| All clear / trivial suggestions | Approve |
| Warnings, no production risk | Approve with comments |
| Multiple warnings forming a risk pattern | Unapprove (revoke bot approval) |
| Any critical item or security risk | Block merge (request changes) |

**Escape hatch:** Comment `break glass` to force approval regardless. For hotfixes.

---

## Resilience

- **Circuit breakers** per model tier (closed → half-open → open)
- **Failback chains**: `opus-4-7 → opus-4-6`, `sonnet-4-6 → sonnet-4-5`
- **Heartbeat logs** every 30s so engineers don't think the job is hung
- **Re-reviews** are incremental — remembers previous findings, auto-resolves fixed threads, argues back if engineer disagrees