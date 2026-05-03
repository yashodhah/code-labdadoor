import { Octokit } from '@octokit/rest';
import type { VcsConfig } from '../configs/review-config';
import type { VcsProvider } from './vsc-provider';

const NOISE_FILES = [
  /package-lock\.json$/,
  /yarn\.lock$/,
  /bun\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.min\.js$/,
  /\.min\.css$/,
  /\.map$/,
];

function isNoiseFile(filename: string): boolean {
  return NOISE_FILES.some((pattern) => pattern.test(filename));
}

async function isGeneratedFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  filename: string,
  ref: string
): Promise<boolean> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filename, ref });
    if ('content' in data && typeof data.content === 'string') {
      const raw = Buffer.from(data.content, 'base64').toString('utf-8');
      const firstFiveLines = raw.split('\n').slice(0, 5).join('\n');
      return firstFiveLines.includes('@generated');
    }
  } catch {
    // file may not exist at this ref (deleted), treat as not generated
  }
  return false;
}

function parseRepo(repoStr: string): { owner: string; repo: string } {
  const [owner, repo] = repoStr.split('/');
  if (!owner || !repo) throw new Error(`Invalid repo format: "${repoStr}"`);
  return { owner, repo };
}

export class GitHubVcsProvider implements VcsProvider {
  constructor(private config?: Pick<VcsConfig, 'token' | 'projectId' | 'mrIid'>) {}

  private octokit(): Octokit {
    const token = this.config?.token ?? process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GitHub token not provided');
    return new Octokit({ auth: token });
  }

  private prCoords(): { owner: string; repo: string; prNumber: number } {
    const repoStr = this.config?.projectId ?? process.env.GITHUB_REPO ?? '';
    const prNumber = this.config?.mrIid ?? Number(process.env.PR_NUMBER);
    return { ...parseRepo(repoStr), prNumber };
  }

  async getDiff(): Promise<string> {
    const octokit = this.octokit();
    const { owner, repo, prNumber } = this.prCoords();

    const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    const header = [
      `PR #${prNumber}: ${pr.title}`,
      pr.body ? `\nDescription:\n${pr.body}` : '',
      `\nBase: ${pr.base.sha}  →  Head: ${pr.head.sha}`,
    ]
      .filter(Boolean)
      .join('');

    const chunks: string[] = [header];

    for (const file of files) {
      if (isNoiseFile(file.filename)) continue;
      if (await isGeneratedFile(octokit, owner, repo, file.filename, pr.head.sha)) continue;
      if (!file.patch) continue;

      chunks.push(`\n--- ${file.filename} (${file.status}) ---\n${file.patch}`);
    }

    return chunks.join('\n');
  }

  async postReview(decision: string, body: string): Promise<void> {
    const octokit = this.octokit();
    const { owner, repo, prNumber } = this.prCoords();

    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      event: decision as 'APPROVE' | 'COMMENT' | 'REQUEST_CHANGES',
      body,
    });
  }

  async postComment(body: string): Promise<void> {
    const octokit = this.octokit();
    const { owner, repo, prNumber } = this.prCoords();

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });
  }
}
