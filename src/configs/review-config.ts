// ─── Diff Context (shared type, defined here to avoid circular imports) ──────

export interface DiffContext {
  prNumber:    number;
  title:       string;
  author:      string;
  description: string;
  files:       string[];
  additions:   number;
  deletions:   number;
}

// ─── VCS ─────────────────────────────────────────────────────────────────────

export interface DiffStats {
  additions:    number;
  deletions:    number;
  filesChanged: number;
}

export interface VcsConfig {
  token:          string;
  projectId:      string;
  mrIid:          number;
  targetBranch?:  string;
  sourceBranch?:  string;
  mrTitle?:       string;
  mrDescription?: string;
  authorUsername?: string;
  changedFiles?:  string[];
  diffStats?:     DiffStats;
}

// ─── Models ───────────────────────────────────────────────────────────────────

export interface ModelDef {
  id:            string;
  provider:      string;
  fallbackChain: string[];
  usedFor:       string;
}

export interface ModelsConfig {
  top:        ModelDef;
  standard:   ModelDef;
  lightweight: ModelDef;
}

// ─── Root Config ─────────────────────────────────────────────────────────────

export interface ReviewConfig {
  vcs:    VcsConfig;
  models: ModelsConfig;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export function toDiffContext(vcs: VcsConfig): DiffContext {
  return {
    prNumber:    vcs.mrIid,
    title:       vcs.mrTitle       ?? '',
    author:      vcs.authorUsername ?? '',
    description: vcs.mrDescription  ?? '',
    files:       vcs.changedFiles   ?? [],
    additions:   vcs.diffStats?.additions   ?? 0,
    deletions:   vcs.diffStats?.deletions   ?? 0,
  };
}
