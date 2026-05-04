import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { DiffContext, ReviewConfig } from '../configs/review-config';
import { toDiffContext } from '../configs/review-config';
import { orchestrateAgentsImpl } from './orchestrate-agents';
import { GitHubVcsProvider } from '../vcs/github';
import { AGENT_REGISTRY } from './agents';

// ─── Types ───────────────────────────────────────────────────────────────────

export type { DiffContext };
export type RiskTier   = 'trivial' | 'lite' | 'full';
export type Severity   = 'critical' | 'warning' | 'suggestion';
export type Category   = 'security' | 'quality' | 'performance' | 'docs' | 'release';
export type Confidence = 'high' | 'medium' | 'low';
export type Decision   = 'approve' | 'comment' | 'unapprove' | 'block';

export interface AgentScope {
  agentName:         string;
  patchPaths:        string[];
  sharedContextPath: string;
}

export interface ChangedFile {
  filename: string;
  status:   string;
  patch:    string;
}

export interface ReviewContext {
  pr: {
    number:      number;
    title:       string;
    author:      string;
    description: string;
  };
  stats: {
    additions:    number;
    deletions:    number;
    filesChanged: number;
  };
  files: ChangedFile[];
}

export function getContextDir(): string {
  return path.join(
    process.env.RUNNER_TEMP ?? os.tmpdir(),
    'labdadoor',
    process.env.GITHUB_RUN_ID ?? `local-${Date.now()}`
  );
}

// what every specialist produces — one entry per finding (subagent contract)
export interface SpecialistFinding {
  id:          string;
  agent:       string;
  severity:    Severity;
  category:    Category;
  file:        string;
  line_start:  number;
  line_end:    number;
  title:       string;
  description: string;
  suggestion:  string;
  confidence:  Confidence;
}

// what the coordinator produces — single object
export interface CoordinatorReview {
  decision: Decision;
  summary:  string;
  findings: Omit<SpecialistFinding, 'agent' | 'confidence'>[];
}

// ─── Context Helpers ─────────────────────────────────────────────────────────

// Exported for testing only
export function parseDiffIntoFiles(diff: string): ChangedFile[] {
  // Matches the format written by GitHubVcsProvider.getDiff():
  //   \n--- FILENAME (STATUS) ---\n
  // The trailing " ---" distinguishes this from unified diff "--- a/file" headers.
  const SEPARATOR = /\n--- (.+?) \((added|modified|removed|renamed|copied)\) ---\n/g;

  const boundaries: Array<{ filename: string; status: string; contentStart: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = SEPARATOR.exec(diff)) !== null) {
    boundaries.push({
      filename:     match[1],
      status:       match[2],
      contentStart: match.index + match[0].length,
    });
  }

  return boundaries.map((b, i) => {
    const contentEnd = i + 1 < boundaries.length
      ? diff.lastIndexOf('\n--- ', boundaries[i + 1].contentStart)
      : diff.length;
    return {
      filename: b.filename,
      status:   b.status,
      patch:    diff.slice(b.contentStart, contentEnd).trim(),
    };
  });
}

// Exported for testing only
export function writeSharedContext(ctx: ReviewContext): string {
  const contextDir  = getContextDir();
  const contextPath = path.join(contextDir, 'context.json');
  const content = {
    pr:    ctx.pr,
    stats: ctx.stats,
    files: ctx.files.map(f => ({
      filename:  f.filename,
      status:    f.status,
      patchPath: path.join(contextDir, 'patches', `${f.filename.replace(/\//g, '__')}.diff`),
    })),
  };
  fs.writeFileSync(contextPath, JSON.stringify(content, null, 2));
  return contextPath;
}

// Exported for testing only
export function writePatches(files: ChangedFile[]): Map<string, string> {
  const patchesDir = path.join(getContextDir(), 'patches');
  fs.mkdirSync(patchesDir, { recursive: true });

  const pathMap = new Map<string, string>();
  for (const file of files) {
    if (!file.patch) continue;
    const safeName  = file.filename.replace(/\//g, '__');
    const patchPath = path.join(patchesDir, `${safeName}.diff`);
    fs.writeFileSync(patchPath, file.patch);
    pathMap.set(file.filename, patchPath);
  }
  return pathMap;
}

// ─── Phase 1: Intake & Classification ────────────────────────────────────────

export function classify(_diff: string, _ctx: DiffContext): { tier: RiskTier; agents: string[] } {
  // Count lines changed and files touched.
  // Detect which domains are in scope: auth, crypto, docs, config, source, tests.
  // Assign risk tier:
  //   trivial → tiny diffs, only config/docs, no logic changes
  //   lite    → moderate changes, no sensitive domains
  //   full    → large diffs, or any sensitive domain touched
  // Hard overrides: anything touching auth/ or crypto/ always escalates to full, regardless of size.
  // Return the tier and the list of specialist agent names to spawn.
  throw new Error('not implemented');
}

// ─── Phase 2: Context Preparation ────────────────────────────────────────────

export function prepareContext(_diff: string, _ctx: DiffContext): AgentScope[] {
  // Write a shared-mr-context.txt file containing PR number, title, author,
  // description, file list, additions, and deletions.
  // Write per-file patch files into a diff_directory/ on disk.
  // Route each patch file to an agent-specific subdirectory so each specialist
  // only reads patches relevant to its domain (e.g. security agent only gets
  // auth/crypto/validation files).
  // Return one AgentScope per agent to be spawned, each with its patch paths
  // and the shared context path.
  throw new Error('not implemented');
}

// ─── Phase 3: Agent Orchestration ────────────────────────────────────────────

export async function orchestrateAgents(_scopes: AgentScope[], _config: ReviewConfig): Promise<SpecialistFinding[][]> {
  // Spawn all scoped specialist agents in parallel.
  // Pass each agent its domain scope, the path to shared context, and its
  // agent-specific patch subdirectory.
  // Collect the findings arrays when agents complete.
  // Circuit-break on timeout or agent failure: skip that domain's findings
  // entirely and log the failure — do not let one broken agent crash the run.
  // Return an array-of-arrays: one findings array per agent.
  return orchestrateAgentsImpl(_scopes, _config);
}

// ─── Phase 4: Findings Consolidation ─────────────────────────────────────────

export function consolidateFindings(_raw: SpecialistFinding[][]): SpecialistFinding[] {
  // Merge all per-agent findings into a single flat list.
  // Deduplicate: the same issue caught by multiple agents should appear once.
  // Recategorize misplaced findings: a quality agent flagging a security issue
  // should have its category corrected, not be duplicated under both.
  // Filter false positives: drop findings that contradict each other, or that
  // flag lines that were not actually changed in this diff.
  // Return the cleaned, merged findings list.
  throw new Error('not implemented');
}

// ─── Phase 5: Severity Judgement ─────────────────────────────────────────────

export function judgeAndDecide(_findings: SpecialistFinding[]): CoordinatorReview {
  // Re-assess severity across the full merged findings list — individual agents
  // don't have the complete picture; the coordinator does.
  // Apply approval logic:
  //   all clear                             → approve
  //   warnings only                         → comment
  //   multiple warnings forming risk pattern → unapprove
  //   any critical or security finding      → block (request changes)
  // The coordinator uses the top-tier model because it is the only agent making
  // the final, binding decision.
  // Return a CoordinatorReview with the decision, a summary, and cleaned findings.
  throw new Error('not implemented');
}

// ─── Phase 6: Output Formatting ──────────────────────────────────────────────

export function formatOutput(_review: CoordinatorReview): object {
  // Group findings by category (Security, Code Quality, Performance, etc.) so
  // engineers scan section headers rather than a wall of text.
  // Map each finding to exact file path + line numbers.
  // Build the GitHub Reviews API payload:
  //   - one inline comment per finding (body = title + description + suggestion)
  //   - one top-level summary comment with the decision and overall summary
  // Return the payload object ready to hand to the VCS provider.
  throw new Error('not implemented');
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

export async function runCodeReview(_config: ReviewConfig): Promise<CoordinatorReview> {
  // Setup — build VCS provider, fetch diff, and derive DiffContext from config
  const _vcs = new GitHubVcsProvider(_config.vcs);
  const _diff = await _vcs.getDiff();
  const _ctx = toDiffContext(_config.vcs);
  // Phase 1 — classify the diff and decide which agents to run
  // Phase 2 — write shared context and per-agent patch files to disk
  // Phase 3 — spawn specialist agents in parallel, collect raw findings
  // Phase 4 — merge, deduplicate, recategorize, and filter the findings
  // Phase 5 — re-assess severity and produce the approval decision
  // Phase 6 — format the output for the GitHub Reviews API
  //
  // The coordinator never reviews code lines itself.
  // Its value is entirely in routing, deduplication, judgement, and formatting.
  console.log(
    'Received config:',
    JSON.stringify(
      {
        ..._config,
        vcs: {
          ..._config.vcs,
          token: _config.vcs.token ? '[REDACTED]' : '',
        },
      },
      null,
      2
    )
  );
  console.log('Fetched diff:', _diff.slice(0, 200) + '...'); // log a snippet, not the whole thing
  console.log('Derived context:', JSON.stringify(_ctx, null, 2));

  let _rawFindings: SpecialistFinding[][] = [];
  try {
    const _classification = classify(_diff, _ctx);
    const _scopes = prepareContext(_diff, _ctx);
    const scopedAgents = _scopes.filter((scope) => _classification.agents.includes(scope.agentName));
    _rawFindings = await orchestrateAgents(scopedAgents, _config);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Phase 1/2 placeholders prevented Phase 3 execution in runCodeReview:', message);
  }

  return {
    decision: 'comment',
    summary: _rawFindings.length
      ? 'Phase 3 executed and collected specialist findings. Remaining phases are still placeholders.'
      : 'This is a placeholder review. Implement Phases 1, 2, 4, 5, and 6 to produce real reviews.',
    findings: [],
  };
}
