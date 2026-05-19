import { execFileSync } from "node:child_process";
import type { ChangedFileMetadata } from "../types/context";
import type { VcsProvider } from "../types/vcs";

function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf-8" }).trim();
}

const STATUS_MAP: Record<string, string> = {
  M: "modified",
  A: "added",
  D: "removed",
  R: "renamed",
  C: "copied",
};

export class LocalVcsProvider implements VcsProvider {
  listChangedFiles(): Promise<ChangedFileMetadata[]> {
    const nameStatus = git("diff", "--cached", "--name-status");
    if (!nameStatus) return [];

    const numStat = git("diff", "--cached", "--numstat");
    const statMap = new Map<string, { additions: number; deletions: number }>();
    for (const line of numStat.split("\n").filter(Boolean)) {
      const [add, del, ...rest] = line.split("\t");
      const filename = rest.join("\t");
      statMap.set(filename, {
        additions: parseInt(add, 10) || 0,
        deletions: parseInt(del, 10) || 0,
      });
    }

    const files: ChangedFileMetadata[] = [];
    for (const line of nameStatus.split("\n").filter(Boolean)) {
      const parts = line.split("\t");
      const statusChar = parts[0][0];
      // Renames and copies: R100\told\tnew
      const filename = statusChar === "R" || statusChar === "C" ? parts[2] : parts[1];
      const status = STATUS_MAP[statusChar] ?? "modified";
      const stats = statMap.get(filename) ?? { additions: 0, deletions: 0 };
      files.push({ filename, status, ...stats });
    }

    return Promise.resolve(files);
  }

  getPatchForFile(filename: string): Promise<string | null> {
    try {
      const patch = git("diff", "--cached", "--", filename);
      return Promise.resolve(patch || null);
    } catch {
      return Promise.resolve(null);
    }
  }
}
