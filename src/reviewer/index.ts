import type { ReviewConfig, DiffContext } from './review-config';
import { orchestrateAgentsImpl } from './agent-symphony';
import { setupPreReview, classify } from './pre-review';
import { prepareContext } from './context-handler';

import type { SpecialistFinding, CoordinatorReview } from '../types/findings';
import type { AgentScope } from '../types/context';
import type { Severity } from '../types/approval';

// ─── Phase 3: Agent Orchestration ────────────────────────────────────────────

export async function orchestrateAgents(_scopes: AgentScope[], _config: ReviewConfig): Promise<SpecialistFinding[][]> {
  return orchestrateAgentsImpl(_scopes, _config);
}

// ─── Phase 4: Findings Consolidation ─────────────────────────────────────────

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 3,
  warning: 2,
  suggestion: 1,
};

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function consolidateFindings(raw: SpecialistFinding[][]): SpecialistFinding[] {
  const flat = raw.flat();
  flat.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line_start - b.line_start;
  });

  const result: SpecialistFinding[] = [];

  for (const candidate of flat) {
    const overlap = result.findIndex(
      (existing) =>
        existing.file === candidate.file &&
        rangesOverlap(existing.line_start, existing.line_end, candidate.line_start, candidate.line_end)
    );

    if (overlap === -1) {
      result.push(candidate);
    } else {
      const existing = result[overlap];
      if (SEVERITY_RANK[candidate.severity] > SEVERITY_RANK[existing.severity]) {
        result[overlap] = candidate;
      }
    }
  }

  return result;
}

// ─── Phase 5: Severity Judgement ─────────────────────────────────────────────

export function judgeAndDecide(_findings: SpecialistFinding[]): CoordinatorReview {
  throw new Error('not implemented');
}

// ─── Phase 6: Output Formatting ──────────────────────────────────────────────

export function formatOutput(_review: CoordinatorReview): object {
  throw new Error('not implemented');
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────────

export async function runCodeReview(_config: ReviewConfig): Promise<CoordinatorReview> {
  const { vcs, ctx, changedFiles } = await setupPreReview(_config);

  const agentRules = await vcs.fetchFileFromBase('AGENTS.md');
  const classification = await classify(ctx, changedFiles, agentRules, _config);

  let _rawFindings: SpecialistFinding[][] = [];
  try {
    console.log('[Phase 2/3] Preparing context and orchestrating agents...');
    const scopes = await prepareContext(vcs, ctx, changedFiles);
    console.log('[Phase 2/3] Agent scopes prepared:', scopes.length, 'agents');
    const scopedAgents = scopes.filter((scope) => classification.agents.includes(scope.agentName));
    console.log('[Phase 2/3] Filtered to', scopedAgents.length, 'agents matching classification');
    _rawFindings = await orchestrateAgents(scopedAgents, _config);
    console.log('[Phase 2/3] Orchestration complete. Collected', _rawFindings.length, 'agent result arrays');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error('Phase 2/3 encountered an error:', message);
    console.error('Stack trace:', stack);
  }

  const consolidated = consolidateFindings(_rawFindings);

  return {
    decision: 'comment',
    summary: consolidated.length
      ? 'Phase 3 executed and collected specialist findings. Remaining phases are still placeholders.'
      : 'This is a placeholder review. Implement Phases 4, 5, and 6 to produce real reviews.',
    findings: [],
  };
}
