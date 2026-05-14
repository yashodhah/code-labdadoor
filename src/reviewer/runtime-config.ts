import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import type { ReviewConfig, VcsConfig } from "./review-config";

function loadDotEnvCandidates(projectRoot: string): void {
  dotenv.config({ path: path.join(projectRoot, ".env") });
  dotenv.config({ path: path.join(projectRoot, "src", ".env") });
}

function firstDefined(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value !== undefined && value !== "");
}

function resolvePrNumber(rawPrNumber: number | undefined): number {
  const prValue = firstDefined(
    process.env.PR_NUMBER,
    process.env.PULL_NUMBER,
    rawPrNumber !== undefined ? String(rawPrNumber) : undefined,
  );

  const parsed = prValue ? Number(prValue) : NaN;
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Missing or invalid PR number. Set PR_NUMBER or PULL_NUMBER at runtime.");
  }

  return parsed;
}

function resolveVcsConfig(rawVcs: VcsConfig | undefined): VcsConfig {
  const token = firstDefined(
    process.env.GH_TOKEN,
    process.env.GITHUB_TOKEN,
    process.env.GITHUB_ACCESS_TOKEN,
    rawVcs?.token,
  );
  const repo = firstDefined(process.env.GITHUB_REPO, rawVcs?.repo);
  const prNumber = resolvePrNumber(rawVcs?.prNumber);

  if (!token) {
    throw new Error("Missing GitHub token. Set GH_TOKEN, GITHUB_TOKEN, or GITHUB_ACCESS_TOKEN at runtime.");
  }

  if (!repo) {
    throw new Error("Missing repository. Set GITHUB_REPO (owner/repo format) at runtime.");
  }

  return {
    ...(rawVcs ?? { token: "", repo: "", prNumber: 0 }),
    token,
    repo,
    prNumber,
  };
}

export function loadReviewConfig(settingsPath: string): ReviewConfig {
  const projectRoot = path.resolve(path.dirname(settingsPath), "..", "..");
  loadDotEnvCandidates(projectRoot);

  const rawConfig = JSON.parse(fs.readFileSync(settingsPath, "utf-8")) as ReviewConfig;

  return {
    ...rawConfig,
    vcs: resolveVcsConfig(rawConfig.vcs),
  };
}
