"use strict";
// ─── Diff Context (shared type, defined here to avoid circular imports) ──────
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDiffContext = toDiffContext;
// ─── Adapter ─────────────────────────────────────────────────────────────────
function toDiffContext(vcs) {
    return {
        prNumber: vcs.mrIid,
        title: vcs.mrTitle ?? '',
        author: vcs.authorUsername ?? '',
        description: vcs.mrDescription ?? '',
        files: vcs.changedFiles ?? [],
        additions: vcs.diffStats?.additions ?? 0,
        deletions: vcs.diffStats?.deletions ?? 0,
    };
}
