import * as fs from 'node:fs';
import { Octokit } from '@octokit/rest';
import { runCodeReview } from '../src/reviewer/index';
import type { ReviewConfig, VcsConfig } from '../src/types/review-config';
import type { CoordinatorReview, Decision } from '../src/types/findings';
import settingsJson from '../src/configs/settings.json';

// ─── Event Payload Shapes ─────────────────────────────────────────────────────

interface PullRequestPayload {
  action: string;
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    user: { login: string };
    base: { ref: string };
    head: { ref: string };
  };
}

interface IssueCommentPayload {
  action: string;
  issue: {
    number: number;
    pull_request?: object;
  };
  comment: { body: string };
}

interface PullRequestReviewCommentPayload {
  action: string;
  pull_request: { number: number };
  comment: { body: string };
}

// ─── Environment Readers ──────────────────────────────────────────────────────

function readEventPayload(): unknown {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error('GITHUB_EVENT_PATH is not set');
  return JSON.parse(fs.readFileSync(eventPath, 'utf-8'));
}

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  return token;
}

function getRepository(): string {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) throw new Error('GITHUB_REPOSITORY is not set');
  return repo;
}

// ─── Trigger Detection ────────────────────────────────────────────────────────

const COMMAND_PATTERN = /(?:^|\s)(?:\/labdadoor|\/lb)(?=$|\s)/;

export function isLabdadoorCommand(body: string): boolean {
  return COMMAND_PATTERN.test(body.trim());
}

interface ReviewTarget {
  prNumber: number;
}

function resolveReviewTarget(): ReviewTarget | null {
  const eventName = process.env.GITHUB_EVENT_NAME ?? '';
  const payload = readEventPayload();

  if (eventName === 'pull_request') {
    const p = payload as PullRequestPayload;
    if (!['opened', 'synchronize', 'reopened'].includes(p.action)) return null;
    return { prNumber: p.pull_request.number };
  }

  if (eventName === 'issue_comment') {
    const p = payload as IssueCommentPayload;
    if (!p.issue.pull_request) return null;
    if (!isLabdadoorCommand(p.comment.body)) return null;
    return { prNumber: p.issue.number };
  }

  if (eventName === 'pull_request_review_comment') {
    const p = payload as PullRequestReviewCommentPayload;
    if (!isLabdadoorCommand(p.comment.body)) return null;
    return { prNumber: p.pull_request.number };
  }

  return null;
}

// ─── Review Formatting ────────────────────────────────────────────────────────

type GitHubReviewEvent = 'APPROVE' | 'COMMENT' | 'REQUEST_CHANGES';

export function toGitHubEvent(decision: Decision): GitHubReviewEvent {
  switch (decision) {
    case 'approve':   return 'APPROVE';
    case 'comment':   return 'COMMENT';
    case 'unapprove': return 'COMMENT';
    case 'block':     return 'REQUEST_CHANGES';
  }
}

const DECISION_LABEL: Record<Decision, string> = {
  approve:   '**Decision: APPROVED**',
  comment:   '**Decision: COMMENT**',
  unapprove: '**Decision: UNAPPROVE** (flagging new concerns)',
  block:     '**Decision: CHANGES REQUESTED**',
};

export function formatReviewBody(result: CoordinatorReview): string {
  const findingsRows = result.findings.map((f, i) =>
    `| ${i + 1} | ${f.severity} | \`${f.file}:${f.line_start}\` | ${f.title} |`
  );
  const findingsTable = findingsRows.length
    ? `\n\n### Findings\n| # | Severity | File | Title |\n|---|----------|------|-------|\n${findingsRows.join('\n')}`
    : '';

  return `${DECISION_LABEL[result.decision]}\n\n${result.summary}${findingsTable}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const target = resolveReviewTarget();
  if (!target) {
    console.log('No labdadoor trigger matched — exiting cleanly.');
    return;
  }

  const token = getToken();
  const repo = getRepository();
  const [owner, repoName] = repo.split('/');

  const octokit = new Octokit({ auth: token });

  const { data: pr } = await octokit.pulls.get({
    owner,
    repo: repoName,
    pull_number: target.prNumber,
  });

  console.log(`Starting labdadoor review on PR #${pr.number}: ${pr.title}`);

  const vcsConfig: VcsConfig = {
    token,
    repo,
    prNumber:    pr.number,
    title:       pr.title,
    description: pr.body ?? '',
    author:      pr.user?.login ?? 'unknown',
    baseBranch:  pr.base.ref,
    headBranch:  pr.head.ref,
    diffStats: {
      additions:    pr.additions,
      deletions:    pr.deletions,
      filesChanged: pr.changed_files,
    },
  };

  const config: ReviewConfig = {
    vcs: vcsConfig,
    models: settingsJson.models,
  };

  let result: CoordinatorReview;
  try {
    result = await runCodeReview(config);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('runCodeReview failed:', msg);
    await octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: target.prNumber,
      body: `**Labdadoor error**: review pipeline failed.\n\n\`${msg}\``,
    });
    process.exit(1);
  }

  console.log(`Review complete — decision: ${result.decision}, findings: ${result.findings.length}`);

  await octokit.pulls.createReview({
    owner,
    repo: repoName,
    pull_number: target.prNumber,
    event: toGitHubEvent(result.decision),
    body: formatReviewBody(result),
  });

  console.log('Review posted to GitHub.');
}

if ((import.meta as unknown as Record<string, unknown>).main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
