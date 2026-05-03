/**
 * Smoke test for GitHubVcsProvider.
 * Usage:
 *   npm run smoke -- 123
 *   GITHUB_REPO=owner/repo npm run smoke -- 456
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { GitHubVcsProvider } from '../github';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });


async function main() {
  // Map GITHUB_ACCESS_TOKEN from .env to GITHUB_TOKEN
  if (!process.env.GITHUB_TOKEN && process.env.GITHUB_ACCESS_TOKEN) {
    process.env.GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
  }

  const prArg = process.argv[2];
  if (prArg) process.env.PR_NUMBER = prArg;

  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not set');
  if (!process.env.GITHUB_REPO) throw new Error('GITHUB_REPO is not set (format: owner/repo)');
  if (!process.env.PR_NUMBER) throw new Error('PR_NUMBER is not set');

  const vcs = new GitHubVcsProvider();

  console.log('--- getDiff() ---');
  const diff = await vcs.getDiff();
  console.log(diff);

  console.log('\n--- postComment() ---');
  await vcs.postComment('smoke test comment from ai-reviewer');
  console.log('comment posted');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
