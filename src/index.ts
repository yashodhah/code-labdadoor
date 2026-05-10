import * as path from 'path';
import { runCodeReview } from './reviewer';
import { loadReviewConfig } from './reviewer/runtime-config';

function loadConfig() {
  const configPath = path.join(__dirname, 'configs', 'settings.json');
  return loadReviewConfig(configPath);
}

async function main(): Promise<void> {
  const config = loadConfig();
  const result = await runCodeReview(config);
  console.log('\n--- Review complete ---');
  console.log(`Decision : ${result.decision}`);
  console.log(`Summary  : ${result.summary}`);
  console.log(`Findings : ${result.findings.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
