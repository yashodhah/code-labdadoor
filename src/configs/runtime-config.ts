import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import type { ReviewConfig, VcsConfig } from './review-config';

function loadDotEnvCandidates(projectRoot: string): void {
  dotenv.config({ path: path.join(projectRoot, '.env') });
  dotenv.config({ path: path.join(projectRoot, 'src', '.env') });
}

function firstDefined(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value !== undefined && value !== '');
}

function resolveMrIid(rawMrIid: number | undefined): number {
  const mrValue = firstDefined(
    process.env.PR_NUMBER,
    process.env.MR_IID,
    rawMrIid !== undefined ? String(rawMrIid) : undefined
  );

  const parsed = mrValue ? Number(mrValue) : NaN;
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Missing or invalid PR number. Set PR_NUMBER or MR_IID at runtime.');
  }

  return parsed;
}

function resolveVcsConfig(rawVcs: VcsConfig | undefined): VcsConfig {
  const token = firstDefined(
    process.env.GITHUB_TOKEN,
    process.env.GITHUB_ACCESS_TOKEN,
    rawVcs?.token
  );
  const projectId = firstDefined(
    process.env.GITHUB_REPO,
    process.env.PROJECT_ID,
    rawVcs?.projectId
  );
  const mrIid = resolveMrIid(rawVcs?.mrIid);

  if (!token) {
    throw new Error('Missing GitHub token. Set GITHUB_TOKEN (or GITHUB_ACCESS_TOKEN) at runtime.');
  }

  if (!projectId) {
    throw new Error('Missing repository id. Set GITHUB_REPO (owner/repo) at runtime.');
  }

  return {
    ...(rawVcs ?? { token: '', projectId: '', mrIid: 0 }),
    token,
    projectId,
    mrIid,
  };
}

export function loadReviewConfig(settingsPath: string): ReviewConfig {
  const projectRoot = path.resolve(path.dirname(settingsPath), '..', '..');
  loadDotEnvCandidates(projectRoot);

  const rawConfig = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as ReviewConfig;

  return {
    ...rawConfig,
    vcs: resolveVcsConfig(rawConfig.vcs),
  };
}
