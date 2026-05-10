import { Octokit } from '@octokit/rest';
import type { VcsConfig } from './review-config';
import type { ChangedFileMetadata } from '../types/context';

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


// ______________________________________________________________________________________________

export class GitHubVcsProvider {
  private cachedFiles: Awaited<ReturnType<Octokit['pulls']['listFiles']>>['data'] | null = null;

  constructor(private config?: VcsConfig) {}

  private octokit(): Octokit {
    const token = this.config?.token ?? process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GitHub token not provided');
    return new Octokit({ auth: token });
  }

  private prCoords(): { owner: string; repo: string; prNumber: number } {
    const repoStr = this.config?.repo ?? process.env.GITHUB_REPO ?? '';
    const prNumber = this.config?.prNumber ?? Number(process.env.PR_NUMBER);
    return { ...parseRepo(repoStr), prNumber };
  }

  /**
   * Fetch PR metadata and populate missing VcsConfig fields
   */
  async enrichConfig(config: VcsConfig): Promise<VcsConfig> {
    const octokit = this.octokit();
    const { owner, repo } = parseRepo(config.repo);
    const prNumber = config.prNumber;

    try {
      const { data: pr } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
        per_page: 100,
      });

      return {
        ...config,
        title: config.title ?? pr.title,
        description: config.description ?? pr.body ?? '',
        author: config.author ?? pr.user?.login ?? '',
        files: config.files ?? files.map((f) => f.filename),
        diffStats: config.diffStats ?? {
          additions: pr.additions,
          deletions: pr.deletions,
          filesChanged: pr.changed_files,
        },
      };
    } catch (error) {
      console.error('[GitHub] Failed to enrich config:', error);
      throw error;
    }
  }

  private async listPullFiles(): Promise<Awaited<ReturnType<Octokit['pulls']['listFiles']>>['data']> {
    if (this.cachedFiles) {
      return this.cachedFiles;
    }

    const octokit = this.octokit();
    const { owner, repo, prNumber } = this.prCoords();

    const files = await octokit.paginate(octokit.pulls.listFiles, {
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    this.cachedFiles = files;
    return files;
  }

  async listChangedFiles(): Promise<ChangedFileMetadata[]> {
    const octokit = this.octokit();
    const { owner, repo, prNumber } = this.prCoords();

    console.log(`[GitHub] Listing changed files for ${owner}/${repo} PR #${prNumber}`);
    const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
    const files = await this.listPullFiles();
    console.log(`[GitHub] Found ${files.length} files in this PR`);

    const changedFiles: ChangedFileMetadata[] = [];
    for (const file of files) {
      if (await isGeneratedFile(octokit, owner, repo, file.filename, pr.head.sha)) {
        console.log(`[GitHub] Skipping generated file in metadata: ${file.filename}`);
        continue;
      }

      changedFiles.push({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
      });
    }

    return changedFiles;
  }

  async getPatchForFile(filename: string): Promise<string | null> {
    const files = await this.listPullFiles();
    const match = files.find((file) => file.filename === filename);
    if (!match) {
      console.warn(`[GitHub] No changed file entry found for: ${filename}`);
      return null;
    }

    if (!match.patch) {
      console.log(`[GitHub] No patch available for: ${filename}`);
      return null;
    }

    return match.patch;
  }

  async getDiff(): Promise<string> {
    const octokit = this.octokit();
    const { owner, repo, prNumber } = this.prCoords();

    console.log(`[GitHub] Fetching full diff for ${owner}/${repo} PR #${prNumber}`);

    const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
    const files = await this.listPullFiles();

    const header = [
      `PR #${prNumber}: ${pr.title}`,
      pr.body ? `\nDescription:\n${pr.body}` : '',
      `\nBase: ${pr.base.sha}  →  Head: ${pr.head.sha}`,
    ]
      .filter(Boolean)
      .join('');

    const chunks: string[] = [header];

    for (const file of files) {
      if (await isGeneratedFile(octokit, owner, repo, file.filename, pr.head.sha)) {
        continue;
      }
      if (!file.patch) {
        continue;
      }

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

  async fetchFileFromBase(filePath: string): Promise<string | null> {
    const octokit = this.octokit();
    const { owner, repo, prNumber } = this.prCoords();

    const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });

    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: pr.base.sha,
      });
      if ('content' in data && typeof data.content === 'string') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch {
      return null;
    }
  }
}
