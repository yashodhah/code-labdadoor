// ─── Diff Context ────────────────────────────────────────────────────────────

export interface DiffContext {
  prNumber: number;
  title: string;
  author: string;
  description: string;
  files: string[];
  additions: number;
  deletions: number;
}

// ─── VCS ─────────────────────────────────────────────────────────────────────

export interface DiffStats {
  additions: number;
  deletions: number;
  filesChanged: number;
}

export interface VcsConfig {
  token: string;
  repo: string; // owner/repo format
  prNumber: number;
  baseBranch?: string;
  headBranch?: string;
  title?: string;
  description?: string;
  author?: string;
  files?: string[];
  diffStats?: DiffStats;
}

// ─── Models ───────────────────────────────────────────────────────────────────

export interface ModelDef {
  id: string;
  provider: string;
  fallbackChain: string[];
  usedFor: string;
}

export interface ModelsConfig {
  top: ModelDef;
  standard: ModelDef;
  lightweight: ModelDef;
}

// ─── Root Config ─────────────────────────────────────────────────────────────

export interface ReviewConfig {
  vcs: VcsConfig;
  models: ModelsConfig;
  standards?: string[]; // skill sources, e.g. ["owner/repo"] — resolved from LABRADOR_STANDARDS env
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export function toDiffContext(vcs: VcsConfig): DiffContext {
  return {
    prNumber: vcs.prNumber,
    title: vcs.title ?? "",
    author: vcs.author ?? "",
    description: vcs.description ?? "",
    files: vcs.files ?? [],
    additions: vcs.diffStats?.additions ?? 0,
    deletions: vcs.diffStats?.deletions ?? 0,
  };
}
