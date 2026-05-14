import { CopilotClient } from '@github/copilot-sdk';
import type { ModelInfo } from '@github/copilot-sdk';

export async function detectAvailableModels(): Promise<ModelInfo[]> {
  const client = new CopilotClient({ gitHubToken: process.env.GH_TOKEN });

  try {
    await client.start();
    const models = await client.listModels();

    console.log('\n[model-detection] Available models from SDK:\n');
    models.forEach((m) => {
      console.log(`  ID: ${m.id}`);
      if (m.name) console.log(`     Name: ${m.name}`);
      if (m.capabilities?.supports?.vision) console.log(`     • Supports Vision`);
      if (m.capabilities?.supports?.reasoningEffort) {
        console.log(`     • Supports Reasoning (efforts: ${m.supportedReasoningEfforts?.join(', ') || 'default'})`);
      }
      if (m.policy) console.log(`     • Policy: ${m.policy.status}`);
      console.log();
    });

    const ids = models.map((m) => m.id);
    console.log(`[model-detection] Update settings.json with these IDs: ${ids.join(', ')}\n`);
    return models;
  } finally {
    await client.stop().catch(() => {});
  }
}
