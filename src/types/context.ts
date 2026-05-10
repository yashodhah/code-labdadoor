/**
 * Context, scope, and file-related types for code review.
 */

export interface AgentScope {
  agentName: string;
  patchPaths: string[];
  patchFiles: PatchFileRef[];
  sharedContextPath: string;
  ensurePatch: (file: PatchFileRef) => Promise<void>;
}

export interface ChangedFileMetadata {
  filename: string;
  status: string;
  additions?: number;
  deletions?: number;
}

export interface PatchFileRef {
  filename: string;
  patchPath: string;
}

export interface ReviewContext {
  pr: {
    number: number;
    title: string;
    author: string;
    description: string;
  };
  stats: {
    additions: number;
    deletions: number;
    filesChanged: number;
  };
  files: ChangedFileMetadata[];
}
