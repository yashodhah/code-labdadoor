Dumped the raw GitHub Actions logs from a Copilot code review.. might not be accurate.

## The Two Jobs

Every CCR run splits into two jobs:

- **Prepare** — lightweight, ~2 seconds. Fetches the PR file list, extracts a nonce (one-time security token) from the callback payload.
- **Agent** — the actual work. Downloads binaries, runs the agentic loop, posts results back.

## The Two Binaries (both closed-source, never documented publicly)

**`autofind`** (v6.0.15, from `github/codeml-detector`)

This is the brain. It runs the ReAct loop — calls the LLM, invokes tools, accumulates context, stores comments.

**`ccrcli`** (v0.2.3, from `github/copilot-code-review-published-artifacts`)

This is the plumbing. Three subcommands visible in the logs:

- `ccrcli callback` — signals status to the CAPI endpoint (how the PR spinner + comments appear in real time)
- `ccrcli custom-instructions` — merges `.github/copilot-instructions.md` + `.github/instructions/*.instructions.md` into a unified JSON for autofind

So the split is clean: **autofind = the letter, ccrcli = the envelope**.

## The ReAct Loop

Not just one LLM call — it's a back-and-forth loop:

1. LLM sees diff + system prompt + tool definitions
2. LLM decides what to do next (read a file, search for a symbol, store a comment)
3. `autofind` executes the tool call, appends the result to the conversation
4. Repeat until LLM calls stop

This PR made **9 separate LLM calls**, each building on accumulated context from all previous tool results. The model used was **GPT-5.2**.

## Tools Available (7 total)

| Tool | What it does | Status |
| --- | --- | --- |
| `read_code` | Read a file by line range | ✅ Active |
| `search_dir` | Search for a term across files | ✅ Active |
| `list_dir` | List directory contents | ✅ Active |
| `store_comment` | File a review comment | ✅ Active |
| `store_memory` | Write a fact to persistent memory | ✅ Active |
| `plan` | Write a multi-step plan before acting | ❌ Disabled (`EnablePlanTool=false`) |
| `semantic_issue_search` | Vector search over the codebase | ❌ Disabled (`EnableSemanticIssueSearchTool=false`) |

Disabled tools = cost/speed tradeoffs. Semantic search requires embedding the whole codebase — overkill for a single-file PR.

## Memory System (3 layers)

**In-context** — tool results accumulate in the conversation window for that run. Ephemeral.

**Persistent per-repo** — agent called `store_memory` with a structured fact:

- *fact*: what changed (resumeSessionId replaces shareSession toggle)
- *reason*: why it matters for future reviews
- *citations*: exact file + line numbers

Stored at: `api.githubcopilot.com/agents/swe/internal/memory/v0/{owner}/{repo}`

At the *start* of this run it loaded **2 existing memories** about the repo. So this thing is learning the codebase incrementally across every PR.

**A/B experiment flag** — `ccr_c_551_memory:31485936` in the payload. Memory is still being experimentally rolled out — this run happened to be in the treatment group.

## The 3 Comments Filed

| Severity | File | Lines | Issue |
| --- | --- | --- | --- |
| 🔴 Critical | `CopilotAgent.node.ts` | 100–105 | `let session;` = implicit `any`, breaks `noImplicitAny: true` in tsconfig |
| 🟡 Moderate | `CopilotAgent.node.ts` | 348–352 | `client.start()` failure swallows URL + original error — hard to debug |
| 🟡 Moderate | `CopilotAgent.node.ts` | 345–358 | `client.stop()` never called if `client.start()` throws — resource leak |

## Detector Config (the flags blob)

The full detector string passed to autofind — this is what controls the run behaviour:

```
EnableAutoApproval=true
EnableAgenticTools=true
MaxPromptTokens=110000
UseGPT5Model=true
EnableMemoryStorage=true
EnableCommentTool=true
MoreThorough=true
EnablePlanTool=false
EnableSemanticIssueSearchTool=false
EnableMcpProxy=false
EnableSkills=false
```

`MoreThorough=true` increases allowed LLM iterations. `MCP proxy` being off = no external tool calls (security surface). `Skills=false` = enterprise-only feature not enabled on individual accounts.

## What You Can't Find Publicly

- The workflow YAML — GitHub injects it dynamically, it doesn't live in your repo
- The `autofind` binary — private repo, closed source
- The `ccrcli` binary — same
- The CAPI endpoints — internal GitHub API

The raw logs are the deepest look anyone outside GitHub gets at this pipeline.