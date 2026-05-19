import * as path from "path";
import { setupLocalPreReview, classify } from "./reviewer/pre-review";
import { prepareContext } from "./reviewer/context-handler";
import { orchestrateAgentsImpl } from "./reviewer/agent-symphony";
import { consolidateFindings } from "./reviewer/index";
import { loadLocalConfig } from "./reviewer/runtime-config";
import type { SpecialistFinding } from "./types/findings";

const SEVERITY_PREFIX: Record<string, string> = {
  critical: "✖ [critical]",
  warning: "⚠ [warning] ",
  suggestion: "· [suggest] ",
};

function printFindings(findings: SpecialistFinding[]): void {
  if (findings.length === 0) {
    console.log("No findings. Looks good.");
    return;
  }

  for (const f of findings) {
    const prefix = SEVERITY_PREFIX[f.severity] ?? "? [unknown] ";
    console.log(`${prefix} ${f.file}:${f.line_start} — ${f.title}`);
    if (f.description) console.log(`  ${f.description}`);
    if (f.suggestion) console.log(`  → ${f.suggestion}`);
    console.log();
  }
}

async function main(): Promise<void> {
  const configPath = path.join(__dirname, "configs", "local-settings.json");
  const config = loadLocalConfig(configPath);

  const { vcs, ctx, changedFiles, agentRules } = await setupLocalPreReview(config);

  if (changedFiles.length === 0) {
    console.log("No staged changes to review.");
    process.exit(0);
  }

  console.log(`Reviewing ${changedFiles.length} staged file(s)...`);

  const classification = await classify(ctx, changedFiles, agentRules, config);
  const scopes = await prepareContext(vcs, ctx, changedFiles);
  const scopedAgents = scopes.filter((s) => classification.agents.includes(s.agentName));

  const rawFindings = await orchestrateAgentsImpl(scopedAgents, config);
  const findings = consolidateFindings(rawFindings);

  printFindings(findings);

  const hasCritical = findings.some((f) => f.severity === "critical");
  process.exit(hasCritical ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
