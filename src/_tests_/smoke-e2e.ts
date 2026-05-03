/**
 * End-to-end smoke test for the full review pipeline.
 * Usage:
 *   npm run smoke:e2e
 *   GITHUB_REPO=owner/repo PR_NUMBER=123 npm run smoke:e2e
 *
 * Builds VCS credentials from runtime environment variables.
 */

import * as path from 'path';
import { loadReviewConfig } from '../configs/runtime-config';
import { runCodeReview } from '../reviewer/orchestrator';

function loadConfig() {
  const settingsPath = path.resolve(__dirname, '../configs/settings.json');
  return loadReviewConfig(settingsPath);
}

async function main() {
  const config = loadConfig();

  console.log('--- smoke:e2e ---');
  console.log(`repo : ${config.vcs.projectId}`);
  console.log(`PR   : ${config.vcs.mrIid}`);

  const result = await runCodeReview(config);

  console.log('\n--- Review complete ---');
  console.log(`decision : ${result.decision}`);
  console.log(`summary  : ${result.summary}`);
  console.log(`findings : ${result.findings.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
