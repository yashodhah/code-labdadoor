import type { Octokit } from "@octokit/rest";

export interface FileChange {
  filename: string;
  status: "added" | "removed" | "modified" | "renamed" | "copied" | "changed" | "unchanged";
  additions: number;
  deletions: number;
  patch?: string;
}

export async function getPRFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  pull_number: number,
): Promise<FileChange[]> {
  const files = await octokit.paginate(octokit.pulls.listFiles, {
    owner,
    repo,
    pull_number,
    per_page: 100,
  });

  return files.map((f) => ({
    filename: f.filename,
    status: f.status as FileChange["status"],
    additions: f.additions,
    deletions: f.deletions,
    patch: f.patch,
  }));
}

export async function getPRDiff(
  octokit: Octokit,
  owner: string,
  repo: string,
  pull_number: number,
): Promise<string> {
  const response = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
    owner,
    repo,
    pull_number,
    headers: {
      Accept: "application/vnd.github.v3.diff",
    },
  });
  return response.data as unknown as string;
}
