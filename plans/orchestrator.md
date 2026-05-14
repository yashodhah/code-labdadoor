coordinator
↓ classifies
→ security agent (if any auth/crypto/validation files changed)
→ quality agent (always, for source files)
→ docs agent (only if .md files changed)

Based on everything we've pulled together — the Cloudflare article, the debug logs, and the architecture discussion — the coordinator's full job is:

---

## 1. Intake & Classification

- Read the full diff + MR context
- Count lines changed, files changed
- Identify file domains touched (auth, crypto, docs, config, source, tests etc.)
- Assign risk tier (trivial / lite / full)
- Decide which specialist agents to spawn based on tier + domains
- Apply hard overrides — anything touching `auth/` or `crypto/` always triggers full

---

## 2. Context Preparation

- Extract `shared-mr-context.txt` and write it to disk — PR number, title, author, description, file list, additions/deletions
- Write per-file patch files to `diff_directory/`
- Route patch files to agent-specific subdirectories so each specialist reads only what's relevant to its domain

---

## 3. Agent Orchestration

- Spawn the decided set of specialist agents in parallel
- Pass each agent its domain scope, the path to shared context, and its patch subdirectory
- Collect all findings when agents complete
- Handle agent timeouts or failures gracefully (circuit breaker / skip that domain's findings)

---

## 4. Findings Consolidation

- Merge all findings from all specialists into one list
- Deduplicate — same issue caught by both security and quality agents should appear once
- Re-categorise misplaced findings — quality agent flagging a security issue should be moved, not duplicated
- Filter false positives — findings that contradict each other, or flag unchanged code, get dropped

---

## 5. Severity Judgement

- Re-assess severity across the merged findings — a single agent doesn't have full picture, coordinator does
- Apply the approval logic:
  - All clear → approve
  - Warnings only → approve with comments
  - Multiple warnings forming a risk pattern → unapprove
  - Any critical / security → block merge (request changes)
- This is why the coordinator uses the top-tier model — it's the only agent making a final call

---

## 6. Output Formatting

- Structure findings by category (Security, Code Quality, Performance etc.) so engineers scan headers not walls of text
- Map each finding to exact file + line numbers
- Generate the PR review payload — inline comments for specific findings, a summary comment at the top
- Post back via GitHub Reviews API as a single structured review

---

## The one thing the coordinator never does

Actually review code for bugs. That's fully delegated. The coordinator's value is entirely in the **routing, deduplication, judgement, and formatting** — if it starts doing line-level review itself, you've lost the architecture's biggest benefit which is domain-scoped, noise-filtered specialists.

Want to translate this into the actual coordinator system prompt?
