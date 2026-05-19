import * as fs from "node:fs";
import * as path from "node:path";
import type { DiffContext } from "./review-config";
import { AGENT_REGISTRY } from "./agent-registry";
import type { VcsProvider } from "../types/vcs";

import type {
  AgentScope,
  ChangedFileMetadata,
  PatchFileRef,
  ReviewContext,
} from "../types/context";

const workspaceRoot = process.env.WORKSPACE_ROOT || process.cwd();
const runId = process.env.GITHUB_RUN_ID ?? "local";
const contextDir = path.join(workspaceRoot, "outputs", runId);

export function getContextDir(): string {
  // Keep one stable run directory for the whole process.
  return contextDir;
}

function toSafePatchPath(filename: string): string {
  // Preserve directory structure: src/handler.ts → patches/src/handler.ts.diff
  return path.join(getContextDir(), "patches", `${filename}.diff`);
}

// Exported for testing only
export function writeSharedContext(ctx: ReviewContext): string {
  const contextDir = getContextDir();
  const contextPath = path.join(contextDir, "context.json");
  const content = {
    pr: ctx.pr,
    stats: ctx.stats,
    files: ctx.files.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patchPath: toSafePatchPath(f.filename),
    })),
  };

  try {
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(contextPath, JSON.stringify(content, null, 2));
    console.log(
      "[context] Wrote context.json to",
      contextPath,
      "- file size:",
      JSON.stringify(content).length,
      "bytes",
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[context] FAILED to write context.json to", contextPath);
    console.error("[context] Error:", errorMsg);
    throw err;
  }
  return contextPath;
}

async function materializePatch(vcs: VcsProvider, file: PatchFileRef): Promise<void> {
  if (fs.existsSync(file.patchPath)) {
    return;
  }

  const patch = await vcs.getPatchForFile(file.filename);
  if (!patch) {
    console.log("[context] No patch content available for", file.filename);
    return;
  }

  fs.mkdirSync(path.dirname(file.patchPath), { recursive: true });
  fs.writeFileSync(file.patchPath, patch);
  console.log("[context] Lazily wrote patch:", file.filename, "- size:", patch.length, "bytes");
}

export async function prepareContext(
  vcs: VcsProvider,
  _ctx: DiffContext,
  changedFiles: ChangedFileMetadata[],
): Promise<AgentScope[]> {
  const contextDir = getContextDir();
  console.log("[Phase 2] Creating context directory:", contextDir);
  fs.mkdirSync(contextDir, { recursive: true });
  fs.mkdirSync(path.join(contextDir, "patches"), { recursive: true });

  console.log("[Phase 2] Building context metadata index...");
  const files = changedFiles;
  console.log("[Phase 2] Indexed", files.length, "changed files");

  const ctx: ReviewContext = {
    pr: {
      number: _ctx.prNumber,
      title: _ctx.title,
      author: _ctx.author,
      description: _ctx.description,
    },
    stats: {
      additions: _ctx.additions,
      deletions: _ctx.deletions,
      filesChanged: files.length,
    },
    files,
  };

  console.log("[Phase 2] Writing shared metadata context...");
  const sharedContextPath = writeSharedContext(ctx);
  console.log("[Phase 2] Shared context written to:", sharedContextPath);

  const patchRefs = files.map(
    (file): PatchFileRef => ({
      filename: file.filename,
      patchPath: toSafePatchPath(file.filename),
    }),
  );

  // Materialize all patches upfront
  console.log("[Phase 2] Materializing", patchRefs.length, "patches...");
  for (const patchRef of patchRefs) {
    await materializePatch(vcs, patchRef);
  }
  console.log("[Phase 2] All patches materialized");

  return AGENT_REGISTRY.map((agent): AgentScope => {
    let agentPatchFiles: PatchFileRef[];

    if (agent.trigger.always || (agent.trigger.llmClassified && !agent.trigger.pathPatterns)) {
      agentPatchFiles = [...patchRefs];
    } else {
      const patterns = (agent.trigger.pathPatterns ?? []).map((p) => new RegExp(p));
      agentPatchFiles = patchRefs.filter((file) => patterns.some((re) => re.test(file.filename)));
    }

    return {
      agentName: agent.name,
      patchPaths: agentPatchFiles.map((file) => file.patchPath),
      patchFiles: agentPatchFiles,
      sharedContextPath,
      ensurePatch: (file) => materializePatch(vcs, file),
    };
  });
}
