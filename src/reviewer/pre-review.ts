import { CopilotClient, approveAll } from "@github/copilot-sdk";
import { AGENT_REGISTRY } from "./agent-registry";
import { DiffContext, ReviewConfig, toDiffContext } from "./review-config";
import { GitHubVcsProvider } from "./github";
import { RiskTier } from "../types/approval";
import type { ChangedFileMetadata } from "../types/context";

// ─── Setup: Build VCS provider, fetch diff, and derive context ────────────────

export async function setupPreReview(_config: ReviewConfig): Promise<{
  vcs: GitHubVcsProvider;
  ctx: DiffContext;
  changedFiles: ChangedFileMetadata[];
}> {
  const vcs = new GitHubVcsProvider(_config.vcs);

  const enrichedVcs = await vcs.enrichConfig(_config.vcs);

  const changedFiles = await vcs.listChangedFiles();
  const ctx = toDiffContext(enrichedVcs);

  console.log(
    "Received config:",
    JSON.stringify(
      {
        ..._config,
        vcs: {
          ..._config.vcs,
          token: _config.vcs.token ? "[REDACTED]" : "",
        },
      },
      null,
      2,
    ),
  );
  console.log("Changed files indexed:", changedFiles.length);
  console.log("Derived context:", JSON.stringify(ctx, null, 2));

  return { vcs, ctx, changedFiles };
}

// ─── LLM fallback for domain-sensitive agents ─────────────────────────────────

interface LlmClassification {
  performance: boolean;
  agents_freshness: boolean;
}

async function callLlmClassifier(
  ctx: DiffContext,
  changedFiles: ChangedFileMetadata[],
  agentRules: string | null,
  config: ReviewConfig,
): Promise<LlmClassification> {
  const modelId = config.models.lightweight.id;

  const systemPrompt = [
    "You are a code review classifier. Given a list of changed files, a PR title, and optional repo agent rules,",
    "determine which specialist agents should review the PR.",
    'Respond ONLY with valid JSON (no markdown fences): { "performance": boolean, "agents_freshness": boolean }',
    "- performance: true if changes are likely to affect runtime performance",
    "- agents_freshness: true if source code changes may require AGENTS.md/instruction updates",
  ].join("\n");

  const userPrompt = [
    `PR title: ${ctx.title}`,
    `Changed files:\n${changedFiles.map((f) => `- ${f.filename}`).join("\n")}`,
    agentRules ? `\nRepo agent rules (AGENTS.md):\n${agentRules}` : "",
  ].join("\n");

  const client = new CopilotClient();
  await client.start();

  try {
    const session = await client.createSession({
      model: modelId,
      onPermissionRequest: approveAll,
      systemMessage: { content: systemPrompt },
    });

    try {
      const response = await session.sendAndWait({ prompt: userPrompt }, 30_000);
      const raw = (response?.data.content ?? "")
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "");
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        performance: Boolean(parsed.performance),
        agents_freshness: Boolean(parsed.agents_freshness),
      };
    } finally {
      await session.disconnect().catch(() => undefined);
    }
  } catch (err) {
    console.warn(
      "[classify] LLM fallback failed, defaulting to false:",
      err instanceof Error ? err.message : err,
    );
    return { performance: false, agents_freshness: false };
  } finally {
    await client.stop().catch(() => undefined);
  }
}

// ─── Phase 1: Intake & Classification ────────────────────────────────────────

export async function classify(
  ctx: DiffContext,
  changedFiles: ChangedFileMetadata[],
  agentRules: string | null,
  config: ReviewConfig,
): Promise<{ tier: RiskTier; agents: string[] }> {
  console.log("Classifying PR with diff and context...");

  const matchedAgents = new Set<string>();
  const needsLlm: string[] = [];

  for (const agent of AGENT_REGISTRY) {
    if (agent.trigger.always) {
      matchedAgents.add(agent.name);
      continue;
    }

    let matchedByPath = false;
    if (agent.trigger.pathPatterns && agent.trigger.pathPatterns.length > 0) {
      const patterns = agent.trigger.pathPatterns.map((p) => new RegExp(p));
      matchedByPath = changedFiles.some((f) => patterns.some((re) => re.test(f.filename)));
      if (matchedByPath) {
        matchedAgents.add(agent.name);
      }
    }

    if (agent.trigger.llmClassified && !matchedByPath) {
      needsLlm.push(agent.name);
    }
  }

  if (needsLlm.length > 0) {
    const llmResult = await callLlmClassifier(ctx, changedFiles, agentRules, config);
    if (llmResult.performance && needsLlm.includes("performance")) {
      matchedAgents.add("performance");
    }
    if (llmResult.agents_freshness && needsLlm.includes("agents-freshness")) {
      matchedAgents.add("agents-freshness");
    }
  }

  const agents = Array.from(matchedAgents);

  const hasSecurity = agents.includes("security");
  const hasPerformance = agents.includes("performance");
  const totalChanged = changedFiles.reduce(
    (sum, f) => sum + (f.additions ?? 0) + (f.deletions ?? 0),
    0,
  );

  let tier: RiskTier;
  if (hasSecurity || totalChanged > 300) {
    tier = "full";
  } else if (hasPerformance || totalChanged > 50) {
    tier = "lite";
  } else {
    tier = "trivial";
  }

  console.log(`Classification: tier=${tier}, agents=[${agents.join(", ")}]`);
  return { tier, agents };
}
